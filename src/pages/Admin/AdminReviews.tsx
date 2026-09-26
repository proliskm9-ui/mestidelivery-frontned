import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/adminService';
import { pickI18nText } from '../../utils/i18nContent';
import type { AOrder, ARestaurant } from './analytics';
import { CustomerPanel, Kpi } from './AdminCustomers';
import { fmtDate } from './crm';
import './AdminPromotions.css';
import './AdminCrm.css';
import './AdminAnalytics.css';
import './AdminReviews.css';

type Filter = 'all' | 'bad' | 'comment' | 'good';

function Stars({ value }: { value: number }) {
    return (
        <span className="rv-stars" aria-label={`${value} из 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} viewBox="0 0 24 24" className={i <= value ? 'is-on' : ''}><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            ))}
        </span>
    );
}

export function AdminReviews() {
    const [orders, setOrders] = useState<AOrder[]>([]);
    const [restaurants, setRestaurants] = useState<ARestaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('bad');
    const [rest, setRest] = useState('all');
    const [customer, setCustomer] = useState<number | null>(null);

    useEffect(() => {
        Promise.all([
            adminApi.get<AOrder[]>('/orders?limit=10000').catch(() => []),
            adminApi.get<ARestaurant[]>('/restaurants/').catch(() => []),
        ]).then(([o, r]) => { setOrders(Array.isArray(o) ? o : []); setRestaurants(Array.isArray(r) ? r : []); setLoading(false); });
    }, []);

    const rated = useMemo(() => orders.filter((o) => typeof o.rating === 'number' && o.rating! > 0)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [orders]);
    const restName = (id: string) => pickI18nText(restaurants.find((r) => r.id === id)?.name || '', 'ru') || 'Ресторан';

    const shown = rated.filter((o) => (rest === 'all' || o.restaurant_id === rest)
        && (filter === 'all' || (filter === 'bad' ? o.rating! <= 3 : filter === 'good' ? o.rating! >= 5 : Boolean(o.rating_comment?.trim()))));

    const avg = rated.length ? rated.reduce((s, o) => s + o.rating!, 0) / rated.length : 0;
    const bad = rated.filter((o) => o.rating! <= 3).length;
    const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: rated.filter((o) => Math.round(o.rating!) === n).length }));
    const distMax = Math.max(1, ...dist.map((d) => d.c));

    return (
        <div className="admin-page ap crm">
            <header className="ap-head">
                <div>
                    <h1 className="ap-title">Отзывы</h1>
                    <p className="ap-sub">Оценки клиентов после заказа. Плохие — сверху: откройте клиента и компенсируйте бонусами или промокодом.</p>
                </div>
            </header>

            {!loading && orders.length > 0 && rated.length === 0 && (
                <div className="ap-notice">
                    <strong>Оценок в данных пока нет.</strong>
                    Клиенты ставят оценку после доставки, но сервер не отдаёт её в списке заказов — нужно добавить поля rating и rating_comment в /orders (docs/ADMIN_ANALYTICS_API.md).
                </div>
            )}

            <div className="rv-top">
                <div className="crm-kpis rv-kpis">
                    <Kpi label="Средняя оценка" value={rated.length ? avg.toFixed(2) : '—'} accent />
                    <Kpi label="Всего оценок" value={rated.length} />
                    <Kpi label="Плохих (1–3)" value={bad} tone={bad ? 'warn' : undefined} />
                    <Kpi label="С комментарием" value={rated.filter((o) => o.rating_comment?.trim()).length} />
                </div>
                <section className="crm-panel rv-dist">
                    {dist.map((d) => (
                        <div key={d.n} className="rv-dist-row">
                            <span>{d.n}</span>
                            <span className="an-share-bar"><i style={{ width: `${(d.c / distMax) * 100}%` }} /></span>
                            <span className="ap-muted">{d.c}</span>
                        </div>
                    ))}
                </section>
            </div>

            <div className="ap-toolbar crm-toolbar">
                <select className="admin-input crm-sort rv-rest" value={rest} onChange={(e) => setRest(e.target.value)}>
                    <option value="all">Все рестораны</option>
                    {restaurants.map((r) => <option key={r.id} value={r.id}>{pickI18nText(r.name, 'ru')}</option>)}
                </select>
            </div>
            <div className="crm-chips">
                {([['bad', 'Плохие'], ['comment', 'С комментарием'], ['good', 'Пятёрки'], ['all', 'Все']] as [Filter, string][]).map(([id, label]) => (
                    <button key={id} type="button" className={`ap-chip${filter === id ? ' is-on' : ''}`} onClick={() => setFilter(id)}>{label}</button>
                ))}
            </div>

            {loading ? <div className="ap-empty">Загрузка…</div> : shown.length === 0 ? <div className="ap-empty">Отзывов нет.</div> : (
                <div className="rv-list">
                    {shown.slice(0, 100).map((o) => (
                        <article key={o.id} className={`rv-card${o.rating! <= 2 ? ' is-bad' : o.rating! === 3 ? ' is-mid' : ''}`}>
                            <header className="rv-card-head">
                                <Stars value={Math.round(o.rating!)} />
                                <span className="ap-muted">{fmtDate(o.created_at, true)} · заказ #{o.id} · {Number(o.total || 0).toFixed(0)} ₾</span>
                            </header>
                            {o.rating_comment?.trim() ? <p className="rv-text">«{o.rating_comment.trim()}»</p> : <p className="rv-text ap-muted">Без комментария</p>}
                            <footer className="rv-card-foot">
                                <span><b>{restName(o.restaurant_id)}</b>{o.courier_name ? <span className="ap-muted"> · курьер {o.courier_name}</span> : null}</span>
                                <span className="rv-who">{o.customer_name || 'Клиент'}{o.phone ? <span className="ap-muted"> {o.phone}</span> : null}</span>
                                {Number(o.user_id) > 0 && <button className="admin-btn" onClick={() => setCustomer(Number(o.user_id))}>Компенсировать</button>}
                            </footer>
                        </article>
                    ))}
                </div>
            )}

            {customer != null && <CustomerPanel id={customer} onClose={() => setCustomer(null)} onOpenCustomer={setCustomer} />}
        </div>
    );
}
