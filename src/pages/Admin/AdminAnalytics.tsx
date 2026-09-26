import { useEffect, useMemo, useState } from 'react';
import { adminApi, adminAuth, type AdminUser } from '../../services/adminService';
import {
    ANALYTICS_API, type AOrder, type ARestaurant, type Award, type KpiPlan, type PlanMetric, type CourierStat, type RestaurantStat,
    byDay, courierStats, delta, fmtGel, fmtMin, heatmap, inPeriod, loadOrLocal, localStore, metricLabel, planProgress,
    restaurantStats, round, sales, topDishes, uid,
} from './analytics';
import { Kpi, plural } from './AdminCustomers';
import './AdminPromotions.css';
import './AdminCrm.css';
import './AdminAnalytics.css';

type Tab = 'sales' | 'restaurants' | 'couriers';
type Days = 7 | 30 | 90;

const PLANS_KEY = 'mesti_admin_kpi_plans';
const AWARDS_KEY = 'mesti_admin_awards';

export function AdminAnalytics() {
    const [tab, setTab] = useState<Tab>('sales');
    const [days, setDays] = useState<Days>(30);
    const [orders, setOrders] = useState<AOrder[]>([]);
    const [restaurants, setRestaurants] = useState<ARestaurant[]>([]);
    const [couriers, setCouriers] = useState<AdminUser[]>([]);
    const [plans, setPlans] = useState<KpiPlan[]>([]);
    const [awards, setAwards] = useState<Award[]>([]);
    const [localOnly, setLocalOnly] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [o, r, u, p, a] = await Promise.all([
                adminApi.get<AOrder[]>('/orders?limit=10000').catch(() => []),
                adminApi.get<ARestaurant[]>('/restaurants/').catch(() => []),
                adminApi.get<AdminUser[]>('/admin/users').catch(() => []),
                loadOrLocal<KpiPlan>(ANALYTICS_API.plans, PLANS_KEY),
                loadOrLocal<Award>(ANALYTICS_API.awards, AWARDS_KEY),
            ]);
            setOrders(Array.isArray(o) ? o : []);
            setRestaurants(Array.isArray(r) ? r : []);
            setCouriers((Array.isArray(u) ? u : []).filter((x) => x.role === 'courier'));
            setPlans(p.items); setAwards(a.items); setLocalOnly(p.local || a.local);
            setLoading(false);
        })();
    }, []);

    const period = useMemo(() => inPeriod(orders, days), [orders, days]);
    const prev = useMemo(() => inPeriod(orders, days, days), [orders, days]);

    /* ---- plans & awards: server, or this browser until the server is ready ---- */
    const savePlan = async (plan: KpiPlan) => {
        const next = [plan, ...plans.filter((x) => x.id !== plan.id)];
        if (localOnly) localStore<KpiPlan>(PLANS_KEY).write(next);
        else await adminApi.post(ANALYTICS_API.plans, plan).catch((e) => alert('Не удалось сохранить план: ' + e.message));
        setPlans(next);
    };
    const removePlan = async (plan: KpiPlan) => {
        if (!confirm(`Удалить план «${plan.title}»?`)) return;
        const next = plans.filter((x) => x.id !== plan.id);
        if (localOnly) localStore<KpiPlan>(PLANS_KEY).write(next);
        else await adminApi.delete(`${ANALYTICS_API.plans}/${plan.id}`).catch(() => {});
        setPlans(next);
    };
    const giveAward = async (award: Award) => {
        const next = [award, ...awards];
        if (localOnly) localStore<Award>(AWARDS_KEY).write(next);
        else await adminApi.post(ANALYTICS_API.awards, award).catch((e) => alert('Не удалось сохранить награду: ' + e.message));
        setAwards(next);
    };

    return (
        <div className="admin-page ap crm an">
            <header className="ap-head">
                <div>
                    <h1 className="ap-title">Аналитика</h1>
                    <p className="ap-sub">Продажи, успеваемость ресторанов и курьеров. Отстающим — помощь, лучшим — премии и сниженная комиссия.</p>
                </div>
                <div className="crm-head-actions">
                    <div className="ap-seg">
                        {([7, 30, 90] as Days[]).map((d) => (
                            <button key={d} type="button" className={`ap-seg-btn${days === d ? ' is-on' : ''}`} onClick={() => setDays(d)}>{d} дней</button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="ap-tabs an-tabs" role="tablist">
                <button role="tab" aria-selected={tab === 'sales'} className={`ap-tab${tab === 'sales' ? ' is-on' : ''}`} onClick={() => setTab('sales')}>Продажи</button>
                <button role="tab" aria-selected={tab === 'restaurants'} className={`ap-tab${tab === 'restaurants' ? ' is-on' : ''}`} onClick={() => setTab('restaurants')}>Рестораны</button>
                <button role="tab" aria-selected={tab === 'couriers'} className={`ap-tab${tab === 'couriers' ? ' is-on' : ''}`} onClick={() => setTab('couriers')}>Курьеры</button>
            </div>

            {localOnly && tab !== 'sales' && (
                <div className="ap-notice">
                    <strong>Планы и награды пока хранятся только в этом браузере.</strong>
                    Когда на сервере появятся эндпоинты из <code>docs/ADMIN_ANALYTICS_API.md</code>, они будут видны на всех устройствах и курьерам в приложении.
                </div>
            )}

            {loading ? <div className="ap-empty">Считаем…</div> : (
                <>
                    {tab === 'sales' && <SalesTab period={period} prev={prev} all={orders} days={days} restaurants={restaurants} />}
                    {tab === 'restaurants' && (
                        <RestaurantsTab
                            stats={restaurantStats(period, restaurants)}
                            restaurants={restaurants}
                            onRestaurantSaved={(r) => setRestaurants((l) => l.map((x) => (x.id === r.id ? { ...x, ...r } : x)))}
                            orders={orders} plans={plans.filter((p) => p.target_type === 'restaurant')} awards={awards.filter((a) => a.target_type === 'restaurant')}
                            onSavePlan={savePlan} onRemovePlan={removePlan} onAward={giveAward}
                        />
                    )}
                    {tab === 'couriers' && (
                        <CouriersTab
                            stats={courierStats(period, couriers)}
                            orders={orders} plans={plans.filter((p) => p.target_type === 'courier')} awards={awards.filter((a) => a.target_type === 'courier')}
                            onSavePlan={savePlan} onRemovePlan={removePlan} onAward={giveAward}
                        />
                    )}
                </>
            )}
        </div>
    );
}

/* ================= Sales ================= */

function Trend({ value }: { value: number | null }) {
    if (value == null || !Number.isFinite(value)) return <span className="an-trend">—</span>;
    const v = Math.round(value);
    return <span className={`an-trend ${v >= 0 ? 'is-up' : 'is-down'}`}>{v >= 0 ? '+' : ''}{v}%</span>;
}

function SalesTab({ period, prev, all, days, restaurants }: { period: AOrder[]; prev: AOrder[]; all: AOrder[]; days: Days; restaurants: ARestaurant[] }) {
    const [mode, setMode] = useState<'revenue' | 'orders'>('revenue');
    const s = sales(period, all);
    const p = sales(prev, all);
    const series = byDay(period, Math.min(days, 30));
    const peak = Math.max(1, ...series.map((d) => (mode === 'revenue' ? d.revenue : d.orders)));
    const grid = heatmap(period);
    const hot = Math.max(1, ...grid.flat());
    const dishes = topDishes(period);
    const dishMax = Math.max(1, ...dishes.map((d) => d.qty));
    const rest = restaurantStats(period, restaurants).filter((r) => r.revenue > 0).sort((a, b) => b.revenue - a.revenue);
    const busiest = (() => {
        let best = { d: 0, h: 0, n: 0 };
        grid.forEach((row, d) => row.forEach((n, h) => { if (n > best.n) best = { d, h, n }; }));
        return best;
    })();
    const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <>
            <div className="crm-kpis">
                <Kpi label={<>Выручка <Trend value={delta(s.revenue, p.revenue)} /></>} value={fmtGel(s.revenue)} accent />
                <Kpi label={<>Доставлено заказов <Trend value={delta(s.delivered, p.delivered)} /></>} value={s.delivered} />
                <Kpi label={<>Средний чек <Trend value={delta(s.avgCheck, p.avgCheck)} /></>} value={fmtGel(s.avgCheck)} />
                <Kpi label="Отмены" value={`${round(s.cancelRate, 1)}%`} tone={s.cancelRate > 8 ? 'warn' : undefined} />
                <Kpi label={`Клиентов, из них новых ${s.newCustomers}`} value={s.customers} />
                <Kpi label="Вернулись повторно" value={`${Math.round(s.repeatShare)}%`} hint="Доля клиентов периода, у которых 2+ заказа за всё время" />
            </div>

            <div className="an-grid">
                <section className="crm-panel an-span-2">
                    <div className="an-panel-head">
                        <h3 className="crm-panel-title">По дням</h3>
                        <div className="ap-seg">
                            <button type="button" className={`ap-seg-btn${mode === 'revenue' ? ' is-on' : ''}`} onClick={() => setMode('revenue')}>Выручка</button>
                            <button type="button" className={`ap-seg-btn${mode === 'orders' ? ' is-on' : ''}`} onClick={() => setMode('orders')}>Заказы</button>
                        </div>
                    </div>
                    <div className="an-bars" style={{ ['--n' as any]: series.length }}>
                        {series.map((d) => {
                            const v = mode === 'revenue' ? d.revenue : d.orders;
                            return (
                                <div key={d.date.toISOString()} className="an-bar" title={`${d.date.toLocaleDateString('ru-RU')}: ${mode === 'revenue' ? fmtGel(v) : `${v} заказов`}`}>
                                    <span className="an-bar-fill" style={{ height: `${Math.max(2, (v / peak) * 100)}%` }} />
                                    <span className="an-bar-label">{series.length <= 14 || d.date.getDate() % 5 === 0 ? d.date.getDate() : ''}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="crm-panel">
                    <h3 className="crm-panel-title">Доля ресторанов</h3>
                    {rest.length === 0 ? <div className="ap-empty">Нет продаж.</div> : (
                        <ul className="an-share">
                            {rest.slice(0, 6).map((r) => (
                                <li key={r.id}>
                                    <span className="an-share-name">{r.name}</span>
                                    <span className="an-share-val">{fmtGel(r.revenue)}</span>
                                    <span className="an-share-bar"><i style={{ width: `${r.share}%` }} /></span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="crm-panel an-span-2">
                    <div className="an-panel-head">
                        <h3 className="crm-panel-title">Часы пик</h3>
                        {busiest.n > 0 && <span className="ap-muted">Больше всего заказов: {DOW[busiest.d]}, {busiest.h}:00–{busiest.h + 1}:00</span>}
                    </div>
                    <div className="an-heat">
                        <span />
                        {Array.from({ length: 24 }, (_, h) => <span key={h} className="an-heat-h">{h % 3 === 0 ? h : ''}</span>)}
                        {grid.map((row, d) => (
                            <FragmentRow key={d} label={DOW[d]} row={row} hot={hot} />
                        ))}
                    </div>
                    <p className="ap-muted an-note">Чем зеленее — тем больше заказов. Ставьте больше курьеров на яркие клетки.</p>
                </section>

                <section className="crm-panel">
                    <h3 className="crm-panel-title">Топ блюд</h3>
                    {dishes.length === 0 ? <div className="ap-empty">Нет данных.</div> : (
                        <ol className="an-dishes">
                            {dishes.map((d) => (
                                <li key={d.name}>
                                    <span className="an-dish-name">{d.name}</span>
                                    <span className="ap-muted">{d.qty} шт</span>
                                    <span className="an-share-bar"><i style={{ width: `${(d.qty / dishMax) * 100}%` }} /></span>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>
        </>
    );
}

function FragmentRow({ label, row, hot }: { label: string; row: number[]; hot: number }) {
    return (
        <>
            <span className="an-heat-d">{label}</span>
            {row.map((n, h) => (
                <span key={h} className="an-heat-c" title={`${label} ${h}:00 — ${n} ${plural(n, 'заказ', 'заказа', 'заказов')}`} style={{ ['--a' as any]: n ? 0.12 + (n / hot) * 0.88 : 0 }} />
            ))}
        </>
    );
}

/* ================= Restaurants ================= */

const scoreTone = (s: number | null) => (s == null ? '' : s >= 75 ? 'is-good' : s >= 50 ? 'is-mid' : 'is-bad');

function Score({ value }: { value: number | null }) {
    return <span className={`an-score ${scoreTone(value)}`}>{value ?? '—'}</span>;
}

interface TabProps<T> {
    stats: T[];
    orders: AOrder[];
    plans: KpiPlan[];
    awards: Award[];
    onSavePlan: (p: KpiPlan) => Promise<void>;
    onRemovePlan: (p: KpiPlan) => Promise<void>;
    onAward: (a: Award) => Promise<void>;
}

function RestaurantsTab({ stats, restaurants, onRestaurantSaved, orders, plans, awards, onSavePlan, onRemovePlan, onAward }: TabProps<RestaurantStat> & { restaurants: ARestaurant[]; onRestaurantSaved: (r: ARestaurant) => void }) {
    const [awardFor, setAwardFor] = useState<RestaurantStat | null>(null);
    const [planOpen, setPlanOpen] = useState(false);
    const [commissionWarn, setCommissionWarn] = useState(false);
    const active = stats.filter((s) => s.orders > 0);
    const leader = active[0];
    const weak = active.filter((s) => (s.score ?? 100) < 50);
    const noTiming = active.every((s) => s.acceptMin == null);

    const saveCommission = async (s: RestaurantStat, value: number) => {
        const r = restaurants.find((x) => x.id === s.id);
        if (!r) return;
        try {
            const saved = await adminApi.put<ARestaurant>(`/restaurants/${r.id}`, { ...r, commission_percent: value });
            onRestaurantSaved({ ...r, commission_percent: value });
            if (saved && typeof saved === 'object' && !('commission_percent' in saved)) setCommissionWarn(true);
        } catch (e: any) { alert('Не удалось сохранить комиссию: ' + (e?.message || '')); }
    };

    return (
        <>
            <div className="crm-kpis">
                <Kpi label="Ресторанов с заказами" value={active.length} />
                <Kpi label="Лидер периода" value={leader ? leader.name : '—'} accent />
                <Kpi label="Нужна помощь" value={weak.length} tone={weak.length ? 'warn' : undefined} hint="Балл ниже 50" />
                <Kpi label="Комиссия за период" value={fmtGel(active.reduce((s, r) => s + (r.commissionGel || 0), 0))} hint="Выручка ресторана × его процент комиссии" />
            </div>

            {(noTiming || commissionWarn) && (
                <div className="ap-notice">
                    {noTiming && <><strong>Скорость принятия и готовки пока не считается</strong> — сервер не отдаёт время этапов заказа (accepted_at, ready_at). Балл сейчас строится по рейтингу и отменам. </>}
                    {commissionWarn && <><strong>Сервер пока не хранит комиссию</strong> — поле commission_percent нужно добавить в рестораны.</>}
                    {' '}Подробности в <code>docs/ADMIN_ANALYTICS_API.md</code>.
                </div>
            )}

            <PlansBlock type="restaurant" plans={plans} orders={orders} targets={stats.map((s) => ({ id: s.id, name: s.name }))} onRemove={onRemovePlan} onNew={() => setPlanOpen(true)} onAward={onAward} awards={awards} />

            <div className="admin-table-premium crm-wrap">
                <table className="admin-table crm-table an-table">
                    <thead>
                        <tr>
                            <th>Ресторан</th><th>Балл</th><th>Заказы</th><th>Выручка</th><th>Рейтинг</th>
                            <th title="От оформления до принятия рестораном">Принимает</th><th title="От принятия до готовности">Готовит</th><th>Отмены</th><th>Комиссия</th><th />
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((s, i) => (
                            <tr key={s.id} className={s.orders && (s.score ?? 100) < 50 ? 'an-row-weak' : ''}>
                                <td>
                                    <div className="crm-person">
                                        <span className="an-rank">{i + 1}</span>
                                        {s.img ? <img className="an-thumb" src={s.img} alt="" /> : <span className="crm-avatar">{s.name.charAt(0)}</span>}
                                        <span><span className="crm-name">{s.name}</span>{i === 0 && s.orders > 0 ? <span className="an-badge is-gold">Лидер</span> : s.orders && (s.score ?? 100) < 50 ? <span className="an-badge is-bad">Нужна помощь</span> : null}</span>
                                    </div>
                                </td>
                                <td><Score value={s.score} /></td>
                                <td>{s.orders}<div className="ap-muted">{round(s.share, 0)}% выручки</div></td>
                                <td>{fmtGel(s.revenue)}<div className="ap-muted">чек {fmtGel(s.avgCheck)}</div></td>
                                <td>{s.rating ?? '—'}{s.ratingCount ? <div className="ap-muted">{s.ratingCount} оценок</div> : null}</td>
                                <td><span className={s.acceptMin != null && s.acceptMin > 8 ? 'an-bad' : ''}>{fmtMin(s.acceptMin)}</span></td>
                                <td><span className={s.cookMin != null && s.cookMin > 30 ? 'an-bad' : ''}>{fmtMin(s.cookMin)}</span></td>
                                <td><span className={s.cancelRate > 8 ? 'an-bad' : ''}>{round(s.cancelRate, 1)}%</span></td>
                                <td><CommissionCell value={s.commission} gel={s.commissionGel} onSave={(v) => saveCommission(s, v)} /></td>
                                <td><button className="admin-btn" onClick={() => setAwardFor(s)}>Наградить</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="ap-muted an-note">Балл 0–100: рейтинг 35%, отмены 25%, скорость принятия 20%, скорость готовки 20%. Зелёный — 75+, красный — ниже 50.</p>

            {awardFor && <AwardModal type="restaurant" target={{ id: awardFor.id, name: awardFor.name }} onClose={() => setAwardFor(null)} onSave={async (a) => { await onAward(a); setAwardFor(null); }} />}
            {planOpen && <PlanModal type="restaurant" targets={stats.map((s) => ({ id: s.id, name: s.name }))} onClose={() => setPlanOpen(false)} onSave={async (p) => { await onSavePlan(p); setPlanOpen(false); }} />}
        </>
    );
}

function CommissionCell({ value, gel, onSave }: { value: number | null; gel: number | null; onSave: (v: number) => void }) {
    const [edit, setEdit] = useState(false);
    const [v, setV] = useState(String(value ?? ''));
    if (edit) {
        const commit = () => { const n = Math.max(0, Math.min(50, Number(v.replace(',', '.')) || 0)); setEdit(false); if (n !== value) onSave(n); };
        return (
            <span className="an-commission-edit">
                <input className="admin-input" autoFocus inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEdit(false); }} />%
            </span>
        );
    }
    return (
        <button className="crm-link" onClick={() => { setV(String(value ?? '')); setEdit(true); }} title="Изменить процент комиссии">
            {value == null ? 'задать' : `${value}%`}
            {gel != null && <div className="ap-muted">{fmtGel(gel)}</div>}
        </button>
    );
}

/* ================= Couriers ================= */

function CouriersTab({ stats, orders, plans, awards, onSavePlan, onRemovePlan, onAward }: TabProps<CourierStat>) {
    const [awardFor, setAwardFor] = useState<CourierStat | null>(null);
    const [planOpen, setPlanOpen] = useState(false);
    const active = stats.filter((s) => s.deliveries > 0);
    const noLink = orders.length > 0 && orders.every((o) => !o.courier_id);
    const paid = awards.reduce((s, a) => s + a.amount, 0);

    return (
        <>
            <div className="crm-kpis">
                <Kpi label="Курьеров в команде" value={stats.length} />
                <Kpi label="Самый активный" value={active[0] ? active[0].name : '—'} accent />
                <Kpi label="Доставок за период" value={active.reduce((s, c) => s + c.deliveries, 0)} />
                <Kpi label="Выдано премий" value={fmtGel(paid)} />
            </div>

            {noLink && (
                <div className="ap-notice">
                    <strong>Заказы пока не привязаны к курьерам</strong> — в ответе /orders нет courier_id у заказов. Как только сервер начнёт его отдавать, здесь появятся доставки, скорость и рейтинг каждого курьера.
                </div>
            )}

            <PlansBlock type="courier" plans={plans} orders={orders} targets={stats.map((s) => ({ id: s.id, name: s.name }))} onRemove={onRemovePlan} onNew={() => setPlanOpen(true)} onAward={onAward} awards={awards} />

            {stats.length === 0 ? <div className="ap-empty">Курьеров нет. Добавьте их в разделе Команда → Сотрудники с ролью «courier».</div> : (
                <div className="admin-table-premium crm-wrap">
                    <table className="admin-table crm-table an-table">
                        <thead>
                            <tr><th>Курьер</th><th>Балл</th><th>Доставок</th><th>Сумма заказов</th><th>Среднее время</th><th>Рейтинг</th><th>Чаевые</th><th>Премии</th><th /></tr>
                        </thead>
                        <tbody>
                            {stats.map((s, i) => {
                                const got = awards.filter((a) => String(a.target_id) === String(s.id));
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <div className="crm-person">
                                                <span className="an-rank">{i + 1}</span>
                                                <span className="crm-avatar">{s.name.charAt(0).toUpperCase()}</span>
                                                <span><span className="crm-name">{s.name}</span>{i < 3 && s.deliveries > 0 ? <span className={`an-badge ${['is-gold', 'is-silver', 'is-bronze'][i]}`}>{i + 1} место</span> : null}</span>
                                            </div>
                                        </td>
                                        <td><Score value={s.score} /></td>
                                        <td>{s.deliveries}</td>
                                        <td>{fmtGel(s.revenue)}</td>
                                        <td><span className={s.avgMin != null && s.avgMin > 35 ? 'an-bad' : ''}>{fmtMin(s.avgMin)}</span></td>
                                        <td>{s.rating ?? '—'}</td>
                                        <td>{fmtGel(s.tips)}</td>
                                        <td>{got.length ? <>{fmtGel(got.reduce((x, a) => x + a.amount, 0))}<div className="ap-muted">{got.length} {plural(got.length, 'раз', 'раза', 'раз')}</div></> : <span className="ap-muted">—</span>}</td>
                                        <td><button className="admin-btn" onClick={() => setAwardFor(s)}>Премировать</button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="ap-muted an-note">Балл 0–100: число доставок 40% (относительно лучшего), скорость 30%, рейтинг 30%.</p>

            <AwardsHistory awards={awards} />

            {awardFor && <AwardModal type="courier" target={{ id: awardFor.id, name: awardFor.name }} onClose={() => setAwardFor(null)} onSave={async (a) => { await onAward(a); setAwardFor(null); }} />}
            {planOpen && <PlanModal type="courier" targets={stats.map((s) => ({ id: s.id, name: s.name }))} onClose={() => setPlanOpen(false)} onSave={async (p) => { await onSavePlan(p); setPlanOpen(false); }} />}
        </>
    );
}

/* ================= KPI plans ================= */

type Target = { id: string | number; name: string };

function PlansBlock({ type, plans, orders, targets, awards, onNew, onRemove, onAward }: {
    type: 'courier' | 'restaurant'; plans: KpiPlan[]; orders: AOrder[]; targets: Target[]; awards: Award[];
    onNew: () => void; onRemove: (p: KpiPlan) => void; onAward: (a: Award) => Promise<void>;
}) {
    const user = adminAuth.getUser();
    return (
        <section className="crm-panel an-plans">
            <div className="an-panel-head">
                <h3 className="crm-panel-title">Планы и KPI</h3>
                <button className="admin-btn admin-btn-primary" onClick={onNew}>Новый план</button>
            </div>
            {plans.length === 0 ? (
                <p className="ap-muted">
                    {type === 'courier'
                        ? 'Поставьте цель, например «100 доставок за месяц — премия 100 GEL». Прогресс каждого курьера посчитается сам.'
                        : 'Например «150 заказов за месяц — комиссия −2% на следующий месяц». Прогресс посчитается сам.'}
                </p>
            ) : plans.map((plan) => {
                const who = plan.target_id == null ? targets : targets.filter((t) => String(t.id) === String(plan.target_id));
                return (
                    <div key={plan.id} className="an-plan">
                        <div className="an-plan-head">
                            <b>{plan.title}</b>
                            <span className="ap-muted">{plan.target} {metricLabel[plan.metric]} за {plan.period === 'week' ? 'неделю' : 'месяц'} · награда {fmtGel(plan.reward_gel)}</span>
                            <button className="crm-link an-plan-del" onClick={() => onRemove(plan)}>Удалить</button>
                        </div>
                        <ul className="an-plan-list">
                            {who.map((t) => {
                                const pr = planProgress(plan, orders, t.id);
                                const paid = awards.some((a) => a.plan_id === plan.id && String(a.target_id) === String(t.id) && new Date(a.created_at).getTime() >= Date.now() - (plan.period === 'week' ? 7 : 31) * 864e5);
                                return (
                                    <li key={String(t.id)}>
                                        <span className="an-plan-name">{t.name}</span>
                                        <span className="an-progress"><i style={{ width: `${pr.pct}%` }} className={pr.done ? 'is-done' : ''} /></span>
                                        <span className="an-plan-val">{plan.metric === 'revenue' ? fmtGel(pr.value) : pr.value} / {plan.metric === 'revenue' ? fmtGel(plan.target) : plan.target}</span>
                                        {pr.done ? (
                                            paid ? <span className="crm-status crm-status--completed">Награждён</span> : (
                                                <button className="admin-btn admin-btn-primary" onClick={() => onAward({
                                                    id: uid(), target_type: type, target_id: t.id, target_name: t.name, amount: plan.reward_gel,
                                                    reason: `План «${plan.title}» выполнен`, plan_id: plan.id, created_at: new Date().toISOString(), admin: user?.username,
                                                })}>Выдать {fmtGel(plan.reward_gel)}</button>
                                            )
                                        ) : <span className="ap-muted an-plan-left">ещё {plan.metric === 'revenue' ? fmtGel(plan.target - pr.value) : plan.target - pr.value}</span>}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </section>
    );
}

function PlanModal({ type, targets, onClose, onSave }: { type: 'courier' | 'restaurant'; targets: Target[]; onClose: () => void; onSave: (p: KpiPlan) => Promise<void> }) {
    const [p, setP] = useState<KpiPlan>({
        id: uid(), target_type: type, target_id: null, title: type === 'courier' ? 'Лучший курьер месяца' : 'Ресторан месяца',
        metric: type === 'courier' ? 'deliveries' : 'orders', period: 'month', target: type === 'courier' ? 100 : 150, reward_gel: 100,
        created_at: new Date().toISOString(),
    });
    const set = <K extends keyof KpiPlan>(k: K, v: KpiPlan[K]) => setP((x) => ({ ...x, [k]: v }));
    const metrics: PlanMetric[] = type === 'courier' ? ['deliveries', 'revenue'] : ['orders', 'revenue'];
    return (
        <div className="admin-centered-modal-overlay" onClick={onClose}>
            <div className="admin-centered-modal crm-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="ap-editor-title">Новый план</h2>
                <div className="crm-form">
                    <div className="ap-grid">
                        <label className="ap-field ap-col-2"><span className="ap-field-label">Название</span><input className="admin-input" value={p.title} onChange={(e) => set('title', e.target.value)} /></label>
                        <label className="ap-field ap-col-2">
                            <span className="ap-field-label">Для кого</span>
                            <select className="admin-input" value={p.target_id == null ? '' : String(p.target_id)} onChange={(e) => set('target_id', e.target.value === '' ? null : (type === 'courier' ? Number(e.target.value) : e.target.value))}>
                                <option value="">{type === 'courier' ? 'Все курьеры' : 'Все рестораны'}</option>
                                {targets.map((t) => <option key={String(t.id)} value={String(t.id)}>{t.name}</option>)}
                            </select>
                        </label>
                        <div className="ap-field ap-col-2">
                            <span className="ap-field-label">Что считаем</span>
                            <div className="ap-seg">{metrics.map((m) => <button key={m} type="button" className={`ap-seg-btn${p.metric === m ? ' is-on' : ''}`} onClick={() => set('metric', m)}>{m === 'revenue' ? 'Выручку' : m === 'deliveries' ? 'Доставки' : 'Заказы'}</button>)}</div>
                        </div>
                        <div className="ap-field ap-col-2">
                            <span className="ap-field-label">Период</span>
                            <div className="ap-seg">
                                <button type="button" className={`ap-seg-btn${p.period === 'week' ? ' is-on' : ''}`} onClick={() => set('period', 'week')}>Неделя</button>
                                <button type="button" className={`ap-seg-btn${p.period === 'month' ? ' is-on' : ''}`} onClick={() => set('period', 'month')}>Месяц</button>
                            </div>
                        </div>
                        <label className="ap-field"><span className="ap-field-label">Цель{p.metric === 'revenue' ? ', ₾' : ''}</span><input className="admin-input" inputMode="numeric" value={p.target} onChange={(e) => set('target', Math.max(1, Number(e.target.value) || 0))} /></label>
                        <label className="ap-field"><span className="ap-field-label">Награда, ₾</span><input className="admin-input" inputMode="numeric" value={p.reward_gel} onChange={(e) => set('reward_gel', Math.max(0, Number(e.target.value) || 0))} /></label>
                    </div>
                    <div className="ap-editor-foot">
                        <span className="ap-muted">{p.target} {metricLabel[p.metric]} за {p.period === 'week' ? 'неделю' : 'месяц'} → {fmtGel(p.reward_gel)}</span>
                        <div className="ap-actions">
                            <button className="admin-btn" onClick={onClose}>Отмена</button>
                            <button className="admin-btn admin-btn-primary" disabled={!p.title.trim()} onClick={() => onSave(p)}>Создать</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================= Awards ================= */

const AWARD_REASONS = {
    courier: ['Курьер месяца', 'Больше всех доставок', 'Лучший рейтинг', 'Выручил в час пик', 'Другое'],
    restaurant: ['Ресторан месяца', 'Самая быстрая кухня', 'Лучший рейтинг', 'Рост заказов', 'Другое'],
};

function AwardModal({ type, target, onClose, onSave }: { type: 'courier' | 'restaurant'; target: Target; onClose: () => void; onSave: (a: Award) => Promise<void> }) {
    const [amount, setAmount] = useState('50');
    const [reason, setReason] = useState(AWARD_REASONS[type][0]);
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const value = Math.max(0, Number(amount.replace(',', '.')) || 0);
    return (
        <div className="admin-centered-modal-overlay" onClick={onClose}>
            <div className="admin-centered-modal crm-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="ap-editor-title">{type === 'courier' ? 'Премия' : 'Награда'}: {target.name}</h2>
                <div className="crm-form">
                    <div className="crm-form-row">
                        <label className="ap-field"><span className="ap-field-label">Сумма, ₾</span><input className="admin-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
                        <div className="ap-chips crm-quick">{[20, 50, 100, 200].map((n) => <button key={n} type="button" className={`ap-chip${value === n ? ' is-on' : ''}`} onClick={() => setAmount(String(n))}>{n}</button>)}</div>
                    </div>
                    <label className="ap-field"><span className="ap-field-label">За что</span><select className="admin-input" value={reason} onChange={(e) => setReason(e.target.value)}>{AWARD_REASONS[type].map((r) => <option key={r}>{r}</option>)}</select></label>
                    <label className="ap-field"><span className="ap-field-label">Комментарий</span><input className="admin-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={type === 'courier' ? 'Например: 42 доставки за неделю без опозданий' : 'Например: вычтем из счёта за комиссию'} /></label>
                    <div className="ap-editor-foot">
                        <span className="ap-muted">{type === 'courier' ? 'Премия выплачивается вне сайта — здесь она фиксируется в истории.' : 'Можно зачесть в счёт комиссии.'}</span>
                        <div className="ap-actions">
                            <button className="admin-btn" onClick={onClose}>Отмена</button>
                            <button className="admin-btn admin-btn-primary" disabled={busy || value <= 0} onClick={async () => {
                                setBusy(true);
                                await onSave({ id: uid(), target_type: type, target_id: target.id, target_name: target.name, amount: value, reason: [reason, comment.trim()].filter(Boolean).join(': '), created_at: new Date().toISOString(), admin: adminAuth.getUser()?.username });
                                setBusy(false);
                            }}>Наградить на {fmtGel(value)}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AwardsHistory({ awards }: { awards: Award[] }) {
    if (!awards.length) return null;
    return (
        <section className="crm-panel an-history">
            <h3 className="crm-panel-title">История наград</h3>
            <ul className="crm-list">
                {awards.slice(0, 20).map((a) => (
                    <li key={a.id}>
                        <span className="crm-list-main">
                            <b>{a.target_name || `#${a.target_id}`}</b>
                            <span className="ap-muted">{[new Date(a.created_at).toLocaleDateString('ru-RU'), a.reason, a.admin ? `выдал ${a.admin}` : ''].filter(Boolean).join(' · ')}</span>
                        </span>
                        <span className="crm-amount is-plus">+{fmtGel(a.amount)}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
