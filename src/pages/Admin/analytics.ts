/**
 * Numbers for Аналитика / Диспетчерская, computed in the browser from the orders list.
 * Stage timestamps (accepted_at, ready_at, picked_up_at, delivered_at), ratings and courier ids
 * are optional: when the server starts sending them (docs/ADMIN_ANALYTICS_API.md) the metrics fill in.
 */
import { adminApi, type Order, type Restaurant, type AdminUser } from '../../services/adminService';
import { pickI18nText } from '../../utils/i18nContent';

export type AOrder = Order & {
    accepted_at?: string | null;
    ready_at?: string | null;
    picked_up_at?: string | null;
    delivered_at?: string | null;
    rating?: number | null;
    rating_comment?: string | null;
    courier_name?: string | null;
    tips?: number | null;
    delivery_fee?: number | null;
};

export type ARestaurant = Restaurant & { commission_percent?: number | null };

/* ================= Time helpers ================= */

const ms = (iso?: string | null) => (iso ? new Date(iso).getTime() : NaN);
export const minutesBetween = (a?: string | null, b?: string | null) => {
    const d = (ms(b) - ms(a)) / 60000;
    return Number.isFinite(d) && d >= 0 && d < 24 * 60 ? d : null;
};
const avg = (xs: (number | null | undefined)[]) => {
    const v = xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
    return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};
export const round = (n: number | null | undefined, d = 0) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);

export function inPeriod(orders: AOrder[], days: number, offsetDays = 0) {
    const to = Date.now() - offsetDays * 864e5;
    const from = to - days * 864e5;
    return orders.filter((o) => { const t = ms(o.created_at); return t >= from && t < to; });
}

export const isDone = (o: AOrder) => o.status === 'delivered';
export const isCancelled = (o: AOrder) => o.status === 'cancelled';
export const revenueOf = (list: AOrder[]) => list.filter(isDone).reduce((s, o) => s + Number(o.total || 0), 0);

/* ================= Sales ================= */

export interface Sales {
    orders: number;
    delivered: number;
    revenue: number;
    avgCheck: number;
    cancelRate: number;          // %
    customers: number;
    newCustomers: number;
    repeatShare: number;         // % of customers in period with 2+ lifetime orders
    avgDelivery: number | null;  // minutes created → delivered
}

export function sales(period: AOrder[], all: AOrder[]): Sales {
    const done = period.filter(isDone);
    const revenue = revenueOf(period);
    const users = new Set(period.map((o) => o.user_id).filter(Boolean));
    const firstOrder = new Map<string, number>();
    const lifetime = new Map<string, number>();
    all.filter((o) => !isCancelled(o)).forEach((o) => {
        if (!o.user_id) return;
        const t = ms(o.created_at);
        if (!firstOrder.has(o.user_id) || t < firstOrder.get(o.user_id)!) firstOrder.set(o.user_id, t);
        lifetime.set(o.user_id, (lifetime.get(o.user_id) || 0) + 1);
    });
    const from = Math.min(...period.map((o) => ms(o.created_at)));
    const newCustomers = [...users].filter((u) => (firstOrder.get(u) ?? 0) >= from).length;
    const repeat = [...users].filter((u) => (lifetime.get(u) || 0) >= 2).length;
    return {
        orders: period.length,
        delivered: done.length,
        revenue,
        avgCheck: done.length ? revenue / done.length : 0,
        cancelRate: period.length ? (period.filter(isCancelled).length / period.length) * 100 : 0,
        customers: users.size,
        newCustomers,
        repeatShare: users.size ? (repeat / users.size) * 100 : 0,
        avgDelivery: avg(done.map((o) => minutesBetween(o.created_at, o.delivered_at))),
    };
}

export const delta = (now: number, before: number) => (before ? ((now - before) / before) * 100 : null);

export function byDay(period: AOrder[], days: number) {
    const out: { date: Date; revenue: number; orders: number }[] = [];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(start.getTime() - i * 864e5);
        const next = d.getTime() + 864e5;
        const list = period.filter((o) => { const t = ms(o.created_at); return t >= d.getTime() && t < next; });
        out.push({ date: d, revenue: revenueOf(list), orders: list.filter((o) => !isCancelled(o)).length });
    }
    return out;
}

/** 7 × 24 grid of non-cancelled orders, Monday first. */
export function heatmap(period: AOrder[]) {
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    period.filter((o) => !isCancelled(o)).forEach((o) => {
        const d = new Date(o.created_at);
        if (isNaN(d.getTime())) return;
        grid[(d.getDay() + 6) % 7][d.getHours()]++;
    });
    return grid;
}

export function parseItems(raw: unknown): { name: string; quantity: number; price: number }[] {
    try {
        const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!Array.isArray(list)) return [];
        return list.map((i: any) => ({
            name: pickI18nText(String(i.name ?? i.title ?? ''), 'ru') || 'Без названия',
            quantity: Number(i.quantity ?? i.qty ?? 1) || 1,
            price: Number(i.price ?? 0) || 0,
        }));
    } catch { return []; }
}

export function topDishes(period: AOrder[], limit = 8) {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    period.filter(isDone).forEach((o) => parseItems(o.items).forEach((i) => {
        const e = map.get(i.name) || { name: i.name, qty: 0, revenue: 0 };
        e.qty += i.quantity; e.revenue += i.quantity * i.price;
        map.set(i.name, e);
    }));
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
}

/* ================= Scoring ================= */

/** Linear 0–100: `good` or better → 100, `bad` or worse → 0. */
const scale = (v: number | null, good: number, bad: number) => (v == null ? null : Math.max(0, Math.min(100, ((v - bad) / (good - bad)) * 100)));

function weighted(parts: [number | null, number][]) {
    const got = parts.filter(([v]) => v != null) as [number, number][];
    const w = got.reduce((s, [, k]) => s + k, 0);
    return w ? Math.round(got.reduce((s, [v, k]) => s + v * k, 0) / w) : null;
}

export interface RestaurantStat {
    id: string;
    name: string;
    img?: string;
    orders: number;
    revenue: number;
    avgCheck: number;
    rating: number | null;
    ratingCount: number;
    cancelRate: number;
    acceptMin: number | null;   // created → accepted
    cookMin: number | null;     // accepted → ready
    commission: number | null;  // %
    commissionGel: number | null;
    score: number | null;
    share: number;              // % of all revenue
}

export function restaurantStats(period: AOrder[], restaurants: ARestaurant[]): RestaurantStat[] {
    const total = revenueOf(period) || 1;
    return restaurants.map((r) => {
        const list = period.filter((o) => o.restaurant_id === r.id);
        const done = list.filter(isDone);
        const revenue = revenueOf(list);
        const rated = list.filter((o) => typeof o.rating === 'number' && o.rating! > 0);
        const orderRating = avg(rated.map((o) => o.rating!));
        const rating = orderRating ?? (Number(r.rating) || null);
        const acceptMin = avg(list.map((o) => minutesBetween(o.created_at, o.accepted_at)));
        const cookMin = avg(list.map((o) => minutesBetween(o.accepted_at, o.ready_at)));
        const cancelRate = list.length ? (list.filter(isCancelled).length / list.length) * 100 : 0;
        const commission = typeof r.commission_percent === 'number' ? r.commission_percent : null;
        return {
            id: r.id,
            name: pickI18nText(r.name, 'ru'),
            img: r.img,
            orders: list.length,
            revenue,
            avgCheck: done.length ? revenue / done.length : 0,
            rating: round(rating, 1),
            ratingCount: rated.length,
            cancelRate,
            acceptMin: round(acceptMin, 1),
            cookMin: round(cookMin, 0),
            commission,
            commissionGel: commission == null ? null : (revenue * commission) / 100,
            score: list.length ? weighted([
                [scale(rating, 4.9, 3.5), 35],
                [scale(acceptMin, 2, 12), 20],
                [scale(cookMin, 12, 40), 20],
                [scale(cancelRate, 0, 15), 25],
            ]) : null,
            share: (revenue / total) * 100,
        };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.revenue - a.revenue);
}

export interface CourierStat {
    id: number;
    name: string;
    deliveries: number;
    revenue: number;
    tips: number;
    avgMin: number | null;      // picked up (or created) → delivered
    rating: number | null;
    online?: boolean;
    score: number | null;
}

export function courierStats(period: AOrder[], couriers: AdminUser[]): CourierStat[] {
    const max = Math.max(1, ...couriers.map((c) => period.filter((o) => o.courier_id === c.id && isDone(o)).length));
    return couriers.map((c) => {
        const done = period.filter((o) => o.courier_id === c.id && isDone(o));
        const avgMin = avg(done.map((o) => minutesBetween(o.picked_up_at || o.ready_at || o.created_at, o.delivered_at)));
        const rated = done.filter((o) => typeof o.rating === 'number' && o.rating! > 0);
        const rating = avg(rated.map((o) => o.rating!));
        return {
            id: c.id,
            name: c.username,
            deliveries: done.length,
            revenue: revenueOf(done),
            tips: done.reduce((s, o) => s + Number(o.tips || 0), 0),
            avgMin: round(avgMin, 0),
            rating: round(rating, 1),
            score: done.length ? weighted([
                [(done.length / max) * 100, 40],
                [scale(avgMin, 15, 45), 30],
                [scale(rating, 4.9, 3.5), 30],
            ]) : null,
        };
    }).sort((a, b) => b.deliveries - a.deliveries || (b.score ?? 0) - (a.score ?? 0));
}

/* ================= KPI plans & awards ================= */

export type PlanMetric = 'deliveries' | 'revenue' | 'orders';
export interface KpiPlan {
    id: string;
    target_type: 'courier' | 'restaurant';
    target_id: string | number | null;   // null = everyone of that type
    title: string;
    metric: PlanMetric;
    period: 'week' | 'month';
    target: number;
    reward_gel: number;
    created_at: string;
}

export interface Award {
    id: string;
    target_type: 'courier' | 'restaurant';
    target_id: string | number;
    target_name?: string;
    amount: number;
    reason: string;
    plan_id?: string | null;
    created_at: string;
    admin?: string;
}

export const ANALYTICS_API = {
    plans: '/admin/kpi-plans',
    awards: '/admin/awards',
    rush: '/admin/rush',
    couriersLive: '/admin/couriers/live',
    audit: '/admin/audit-log',
};

/** Server first; until the endpoint exists the data lives in this browser only. */
export function localStore<T extends { id: string }>(key: string) {
    const read = (): T[] => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
    const write = (list: T[]) => { try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* full or blocked */ } };
    return { read, write };
}

export async function loadOrLocal<T extends { id: string }>(url: string, key: string): Promise<{ items: T[]; local: boolean }> {
    try {
        const data: any = await adminApi.get<any>(url, true);
        return { items: Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [], local: false };
    } catch {
        return { items: localStore<T>(key).read(), local: true };
    }
}

export function periodStart(p: 'week' | 'month') {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    if (p === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    else d.setDate(1);
    return d.getTime();
}

export function planProgress(plan: KpiPlan, orders: AOrder[], targetId: string | number) {
    const from = periodStart(plan.period);
    const list = orders.filter((o) => ms(o.created_at) >= from && isDone(o)
        && (plan.target_type === 'courier' ? o.courier_id === targetId : o.restaurant_id === targetId));
    const value = plan.metric === 'revenue' ? revenueOf(list) : list.length;
    return { value, pct: plan.target ? Math.min(100, (value / plan.target) * 100) : 0, done: value >= plan.target };
}

export const metricLabel: Record<PlanMetric, string> = { deliveries: 'доставок', orders: 'заказов', revenue: 'GEL выручки' };

export const fmtGel = (n: number | null | undefined, d = 0) => (n == null ? '—' : `${Number(n).toLocaleString('ru-RU', { maximumFractionDigits: d })} ₾`);
export const fmtMin = (n: number | null | undefined) => (n == null ? '—' : `${n} мин`);
export const uid = () => Math.random().toString(36).slice(2, 10);
