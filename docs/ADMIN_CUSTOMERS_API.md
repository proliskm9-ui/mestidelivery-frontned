# Customers, bonuses, referrals — server API the site expects

The admin pages **Клиенты** (`src/pages/Admin/AdminCustomers.tsx`) and **Рефералы**
(`src/pages/Admin/AdminReferrals.tsx`), plus the customer sheet **Профиль → Промокоды**
(`src/components/Profile/PromoCodesSheet.tsx`), call the endpoints below.
Admin calls go through `adminApi` (base `/api`, header `Authorization: Bearer <admin token>`,
role `super_admin`). Until an endpoint exists (404/405) the admin page shows a notice and the
customer sheet shows an empty list. Nothing else on the site changes.

All endpoint paths live in one place: `CRM` in `src/pages/Admin/crm.ts`. If the backend prefers
another prefix (for example the Python service under `/api/bot/v1/admin/...`), change them there.

The data already exists in the referral database used by `referral.py` (tables `customers`,
`referrals`, `bonus_transactions`, attached `orders_db.orders`). The rules below match that code:
the referrer gets `reward_points` (5) as bonus points (1 point = 1 GEL) when the friend's first
**delivered** order is ≥ 50 GEL.

## Schema additions

```sql
ALTER TABLE customers ADD COLUMN is_blocked     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN blocked_reason TEXT;
ALTER TABLE customers ADD COLUMN blocked_at     TEXT;

ALTER TABLE referrals ADD COLUMN cancel_reason TEXT;
ALTER TABLE referrals ADD COLUMN cancelled_at  TEXT;
-- optional, fills the "one device / one IP" signals (store at referral/bind and at login)
ALTER TABLE referrals ADD COLUMN referee_device TEXT;
ALTER TABLE referrals ADD COLUMN referee_ip     TEXT;

-- bonus_transactions: add who did a manual change
ALTER TABLE bonus_transactions ADD COLUMN admin TEXT;

-- promo_codes (docs/PROMO_CODES_API.md): personal codes
ALTER TABLE promo_codes ADD COLUMN customer_id INT NULL;   -- NULL = public code
```

`bonus_transactions.type` values used by the admin: `referral_reward`, `referral_revoked`,
`admin_adjust`, `order_spend`, `order_refund`, `expired`. `amount` is signed (+ credit, − debit).

## Objects

```ts
Customer {
  id, name, phone, email,
  points,                    // current balance (customers.points)
  referral_code,
  referrer_id, referrer_name,// who invited this customer (via customers.referred_by → customers.referral_code)
  orders_count, orders_total,// delivered orders only
  last_order_at, created_at,
  is_blocked, blocked_reason,
  invited_total,             // COUNT(referrals WHERE referrer_id = id)
  invited_completed,         // … AND status = 'completed'
  bonus_earned               // SUM(reward_points) of completed referrals
}

CustomerDetails = Customer & {
  bonus_transactions: { id, amount, type, description, order_id, admin, created_at, expires_at }[],  // newest first, last 100
  referrals: Referral[],     // where referrer_id = id
  promo_codes: { id, code, kind, value, min_order, ends_at, note, used }[]  // personal codes
}

Referral {
  id, status: 'pending' | 'completed' | 'cancelled',
  referrer_id, referrer_name, referrer_phone,
  referee_id, referee_name, referee_phone,
  reward_points, qualifying_order_id, order_total,
  created_at, completed_at, cancel_reason,
  flags: string[]            // server-side signals, see below
}
```

## Admin endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| GET  | `/api/admin/customers` | — | `Customer[]` (or `{ items, total }`), newest first |
| GET  | `/api/admin/customers/:id` | — | `CustomerDetails` |
| POST | `/api/admin/customers/:id/bonus` | `{ amount, reason, comment? }` | `{ ok: true, points }` — new balance |
| POST | `/api/admin/customers/:id/block` | `{ blocked: true, reason }` or `{ blocked: false }` | `{ ok: true }` |
| POST | `/api/admin/customers/:id/promo-codes` | `{ code, kind, value, min_order, ends_at, note }` | created promo code |
| GET  | `/api/admin/referrals` | — | `Referral[]` (or `{ items }`), newest first |
| POST | `/api/admin/referrals/:id/cancel` | `{ reason, revoke_reward }` | `{ ok: true }` |

Details:

- **bonus**: `amount` is signed. Never let the balance go below 0 (debit at most the balance).
  Update `customers.points` and insert a `bonus_transactions` row (`type = 'admin_adjust'`,
  `description = reason + ': ' + comment`, `admin = <admin username>`) in one transaction.
  Bulk actions in the admin simply call this once per customer.
- **block**: set `is_blocked`, `blocked_reason`, `blocked_at`. The admin may follow it with a
  `bonus` call that debits the whole balance (checkbox "Списать все бонусы").
- **promo-codes** (personal): insert into `promo_codes` with `customer_id = :id`,
  `max_activations = 1`, `per_user_limit = 1`, `is_active = true`. `409 {"error":"code exists"}`
  on a duplicate code. For many customers the admin generates a unique code per person.
- **cancel referral**: set `status = 'cancelled'`, `cancel_reason`, `cancelled_at`. If it was
  `completed` and `revoke_reward` is true, debit `reward_points` from the referrer (not below 0)
  and insert `bonus_transactions` (`type = 'referral_revoked'`, `order_id = qualifying_order_id`).
  `process_delivered_orders()` must skip cancelled rows (it already only reads `pending`).

## Enforcement (important — the admin buttons mean nothing without it)

1. `POST /api/orders` from a blocked customer → `403 {"error":"customer_blocked"}`.
   The site shows "Аккаунт заблокирован. Напишите в поддержку…".
2. `POST /api/bot/v1/customer/referral/bind` → ignore (return ok, do nothing) when the referrer or
   the referee is blocked, and when referee = referrer (same id or same last 9 phone digits).
3. `process_delivered_orders()` → don't pay rewards to a blocked referrer; mark the referral
   `cancelled` with `cancel_reason = 'referrer blocked'` instead.
4. Personal promo codes are valid only for their `customer_id` (`POST /api/promo/validate` and
   order creation return `reason: "not_found"` for anyone else). An invalid code on order
   creation → `400 {"error":"promo_invalid"}`; the site clears the saved code and tells the user.

## Signals (`Referral.flags`)

The admin computes some signals itself from the list (burst of invites, order just over 50 GEL,
phones differing by 1–2 digits, order within 10 minutes of the invite). Only the server can see
these, so please send them when true:

| Flag | When |
|---|---|
| `same_device` | referee and referrer were seen with the same device id / Telegram init data user |
| `same_ip` | same IP at bind or login |
| `same_address` | qualifying order delivered to an address the referrer used before |
| `referrer_blocked` | referrer is blocked |

## Customer endpoint

`GET /api/customer/promo-codes` (bearer = customer token) →
`[{ code, kind, value, min_order, ends_at, used }]` — the customer's personal codes plus any
public codes you want to advertise (optional). Used by **Профиль → Промокоды**. The chosen code
is remembered on the device and pre-filled at checkout; the order already sends it as `promo_code`.
