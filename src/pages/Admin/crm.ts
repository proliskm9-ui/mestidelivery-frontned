/**
 * Customers, bonuses and referrals for the admin (Клиенты / Рефералы).
 * Server contract: docs/ADMIN_CUSTOMERS_API.md. Until the endpoints exist the pages show a notice.
 */
import { adminApi } from '../../services/adminService';
import type { PromoKind } from './AdminPromotions';

/* ================= Types ================= */

export interface Customer {
    id: number;
    name: string | null;
    phone: string | null;
    email?: string | null;
    points: number;                 // bonus balance, 1 point = 1 GEL
    referral_code?: string | null;
    referrer_id?: number | null;    // who invited this customer
    referrer_name?: string | null;
    orders_count: number;           // delivered orders
    orders_total: number;           // GEL, delivered orders
    last_order_at?: string | null;
    created_at?: string | null;
    is_blocked: boolean;
    blocked_reason?: string | null;
    invited_total?: number;         // referrals where this customer is the referrer
    invited_completed?: number;
    bonus_earned?: number;          // GEL paid for referrals
}

export type BonusTxType = 'referral_reward' | 'referral_revoked' | 'admin_adjust' | 'order_spend' | 'order_refund' | 'expired' | string;

export interface BonusTx {
    id: number;
    amount: number;                 // + credit / − debit
    type: BonusTxType;
    description?: string | null;
    order_id?: number | null;
    admin?: string | null;          // who made a manual adjustment
    created_at: string;
    expires_at?: string | null;
}

export type ReferralStatus = 'pending' | 'completed' | 'cancelled';

export interface Referral {
    id: number;
    referrer_id: number;
    referrer_name?: string | null;
    referrer_phone?: string | null;
    referee_id?: number | null;
    referee_name?: string | null;
    referee_phone?: string | null;
    status: ReferralStatus;
    reward_points: number;
    qualifying_order_id?: number | null;
    order_total?: number | null;
    created_at: string;
    completed_at?: string | null;
    cancel_reason?: string | null;
    /** Server-side signals: same_device, same_ip, same_address, referrer_blocked … */
    flags?: string[];
}

export interface PersonalPromo {
    id?: number;
    code: string;
    kind: PromoKind;
    value: number;
    min_order: number;
    ends_at: string | null;
    note?: string;
    used?: boolean;
}

export interface CustomerDetails extends Customer {
    bonus_transactions?: BonusTx[];
    referrals?: Referral[];         // people this customer invited
    promo_codes?: PersonalPromo[];
}

/* ================= Endpoints ================= */

export const CRM = {
    customers: '/admin/customers',
    customer: (id: number) => `/admin/customers/${id}`,
    bonus: (id: number) => `/admin/customers/${id}/bonus`,
    block: (id: number) => `/admin/customers/${id}/block`,
    promo: (id: number) => `/admin/customers/${id}/promo-codes`,
    referrals: '/admin/referrals',
    cancelReferral: (id: number) => `/admin/referrals/${id}/cancel`,
};

/** True when the error means "the server has no such endpoint yet". */
export const isMissingEndpoint = (e: unknown) => /404|405|not found/i.test(String((e as any)?.message ?? e));

export async function loadList<T>(url: string): Promise<T[]> {
    const data: any = await adminApi.get<any>(url, true);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    return [];
}

/* ================= Formatting ================= */

export const gel = (n: number | null | undefined) => `${Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} GEL`;

export const signedGel = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} GEL`;

export function fmtDate(iso?: string | null, withTime = false) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU', withTime
        ? { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const displayName = (name?: string | null, phone?: string | null, id?: number | null) =>
    (name && name.trim()) || phone || (id ? `Клиент #${id}` : '—');

export const txLabel: Record<string, string> = {
    referral_reward: 'Бонус за друга',
    referral_revoked: 'Бонус за друга отменён',
    admin_adjust: 'Ручное начисление',
    order_spend: 'Списано в заказе',
    order_refund: 'Возврат в заказе',
    expired: 'Сгорели',
};

export const referralStatusLabel: Record<ReferralStatus, string> = {
    pending: 'Ждёт заказа',
    completed: 'Бонус выплачен',
    cancelled: 'Отменён',
};

/* ================= Fraud signals ================= */

export interface Flag { id: string; label: string; hint: string; weight: number }

const FLAG_INFO: Record<string, Omit<Flag, 'id'>> = {
    burst: { label: 'Волна приглашений', hint: '3+ приглашения от одного человека за сутки', weight: 2 },
    min_order: { label: 'Заказ впритык', hint: 'Первый заказ друга всего на 50–55 GEL — ровно чтобы получить бонус', weight: 1 },
    similar_phone: { label: 'Похожие номера', hint: 'Номера пригласившего и друга отличаются 1–2 цифрами', weight: 2 },
    fast_order: { label: 'Мгновенный заказ', hint: 'Друг заказал меньше чем через 10 минут после регистрации', weight: 1 },
    same_device: { label: 'Одно устройство', hint: 'Сервер видел оба аккаунта на одном устройстве', weight: 3 },
    same_ip: { label: 'Один IP', hint: 'Оба аккаунта заходили с одного IP-адреса', weight: 1 },
    same_address: { label: 'Один адрес', hint: 'Заказ друга доставлен на адрес пригласившего', weight: 3 },
    referrer_blocked: { label: 'Пригласивший заблокирован', hint: 'Аккаунт пригласившего заблокирован', weight: 3 },
};

export const flagInfo = (id: string): Flag => ({ id, ...(FLAG_INFO[id] || { label: id, hint: 'Сигнал с сервера', weight: 1 }) });

const digits = (p?: string | null) => (p || '').replace(/\D/g, '').slice(-9);

function phoneDistance(a: string, b: string) {
    if (!a || !b || a.length !== b.length) return 99;
    let d = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
    return d;
}

/** Server flags + what the admin can see from the list itself. */
export function referralFlags(r: Referral, all: Referral[]): Flag[] {
    const ids = new Set(r.flags || []);
    const t = new Date(r.created_at).getTime();
    const sameDay = all.filter((x) => x.referrer_id === r.referrer_id && Math.abs(new Date(x.created_at).getTime() - t) < 24 * 3600e3);
    if (sameDay.length >= 3) ids.add('burst');
    if (r.order_total != null && r.order_total >= 50 && r.order_total < 55) ids.add('min_order');
    const d = phoneDistance(digits(r.referrer_phone), digits(r.referee_phone));
    if (d >= 1 && d <= 2) ids.add('similar_phone');
    if (r.completed_at && r.created_at && new Date(r.completed_at).getTime() - t < 10 * 60e3) ids.add('fast_order');
    return [...ids].map(flagInfo).sort((a, b) => b.weight - a.weight);
}

export const riskScore = (flags: Flag[]) => flags.reduce((s, f) => s + f.weight, 0);

/* ================= Codes ================= */

export function randomCode(prefix = 'GIFT') {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
    return `${prefix}-${s}`;
}
