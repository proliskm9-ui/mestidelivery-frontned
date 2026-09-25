# Promo codes — server API the site expects

The admin page **Акции и промокоды → Промокоды** (`src/pages/Admin/AdminPromotions.tsx`) is ready and
calls the endpoints below through `adminApi` (base `/api`, header `Authorization: Bearer <admin token>`).
Until they exist the page shows a notice ("Сервер ещё не умеет хранить промокоды") and does nothing else.

Restaurant promotions (tab **Акции ресторанов**) need nothing new: they are saved with the existing
`PUT /api/restaurants/:id` (`has_promo`, `promo_text`). `promo_text` may be a plain string or a JSON
string `{"ru":"…","en":"…","ka":"…"}`; the site picks the visitor's language.

## Data model

```sql
CREATE TABLE promo_codes (
  id                 SERIAL PRIMARY KEY,
  code               VARCHAR(20) UNIQUE NOT NULL,        -- stored upper-case, A-Z 0-9 - _
  kind               VARCHAR(16) NOT NULL,               -- 'percent' | 'fixed' | 'free_delivery'
  value              NUMERIC(10,2) NOT NULL DEFAULT 0,   -- percent 1-100, or GEL for 'fixed'
  min_order          NUMERIC(10,2) NOT NULL DEFAULT 0,   -- items subtotal, GEL
  max_discount       NUMERIC(10,2) NOT NULL DEFAULT 0,   -- cap for 'percent', 0 = no cap
  max_activations    INT NOT NULL DEFAULT 0,             -- 0 = unlimited
  per_user_limit     INT NOT NULL DEFAULT 1,             -- 0 = unlimited
  new_customers_only BOOLEAN NOT NULL DEFAULT FALSE,     -- only a customer's first order
  restaurant_ids     TEXT[] NOT NULL DEFAULT '{}',       -- empty = all restaurants
  starts_at          DATE NULL,
  ends_at            DATE NULL,                          -- inclusive
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  note               TEXT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE promo_code_uses (
  id         SERIAL PRIMARY KEY,
  promo_id   INT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  order_id   INT NOT NULL,
  discount   NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`activations` in responses = `COUNT(*)` from `promo_code_uses` for that code.

## Admin endpoints (super_admin only)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/admin/promo-codes` | — | `PromoCode[]` (with `activations`), newest first |
| POST | `/api/admin/promo-codes` | `PromoCode` without `id` | created `PromoCode` |
| PUT | `/api/admin/promo-codes/:id` | full `PromoCode` | updated `PromoCode` |
| DELETE | `/api/admin/promo-codes/:id` | — | `{ "ok": true }` |

`PromoCode` JSON uses exactly the column names above (`restaurant_ids` as a string array, dates as
`YYYY-MM-DD` or `null`). Return `409` with `{"error":"code exists"}` for a duplicate code.

## Customer endpoints (for checkout, next step)

`POST /api/promo/validate` — body `{ "code", "restaurant_id", "subtotal" }`, user from the bearer token.
Response `200 { "ok": true, "kind", "discount": 12.5, "label": "MESTIA10 −10%" }` or
`200 { "ok": false, "reason": "expired" | "min_order" | "limit" | "used" | "not_found" | "restaurant" | "new_only" }`.

On `POST /api/orders` the site will send `promo_code` (it already does, empty today) and `discount`.
The server must **re-validate** the code, recompute the discount itself (never trust the client),
store a row in `promo_code_uses` in the same transaction as the order, and reject the order with
`400 {"error":"promo_invalid"}` if the code stopped being valid.

Discount rules: `percent` → `subtotal * value / 100`, capped by `max_discount` if > 0;
`fixed` → `min(value, subtotal)`; `free_delivery` → equals the delivery fee.
