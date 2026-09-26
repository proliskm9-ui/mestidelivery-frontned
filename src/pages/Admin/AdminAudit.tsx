import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/adminService';
import { ANALYTICS_API } from './analytics';
import { fmtDate, isMissingEndpoint } from './crm';
import './AdminPromotions.css';
import './AdminCrm.css';

/** One admin action, GET /api/admin/audit-log (docs/ADMIN_ANALYTICS_API.md). */
interface AuditEntry {
    id: number | string;
    admin: string;
    action: string;          // bonus_adjust, customer_block, referral_cancel, order_status, order_refund, promo_create, commission_change, award …
    target?: string | null;  // "Клиент #101", "Заказ #1042", "BBQ Garden"
    details?: string | null;
    created_at: string;
}

const ACTIONS: Record<string, string> = {
    bonus_adjust: 'Бонусы',
    customer_block: 'Блокировка',
    customer_unblock: 'Разблокировка',
    referral_cancel: 'Отмена приглашения',
    order_status: 'Статус заказа',
    order_refund: 'Возврат',
    promo_create: 'Промокод',
    promo_update: 'Промокод',
    commission_change: 'Комиссия',
    award: 'Награда',
    product_update: 'Меню',
    restaurant_update: 'Ресторан',
    login: 'Вход',
};

export function AdminAudit() {
    const [items, setItems] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);
    const [admin, setAdmin] = useState('all');
    const [query, setQuery] = useState('');

    useEffect(() => {
        adminApi.get<AuditEntry[] | { items: AuditEntry[] }>(ANALYTICS_API.audit, true)
            .then((d) => setItems(Array.isArray(d) ? d : d?.items || []))
            .catch((e) => { if (isMissingEndpoint(e)) setMissing(true); })
            .finally(() => setLoading(false));
    }, []);

    const admins = useMemo(() => [...new Set(items.map((i) => i.admin))].sort(), [items]);
    const q = query.trim().toLowerCase();
    const shown = items.filter((i) => (admin === 'all' || i.admin === admin)
        && (!q || [i.action, ACTIONS[i.action], i.target, i.details].some((x) => (x || '').toLowerCase().includes(q))));

    return (
        <div className="admin-page ap crm">
            <header className="ap-head">
                <div>
                    <h1 className="ap-title">Журнал действий</h1>
                    <p className="ap-sub">Кто из команды что менял: бонусы, блокировки, статусы и возвраты заказов, промокоды, комиссии, награды.</p>
                </div>
            </header>

            {missing && (
                <div className="ap-notice">
                    <strong>Сервер ещё не ведёт журнал.</strong>
                    Нужна таблица действий и эндпоинт из <code>docs/ADMIN_ANALYTICS_API.md</code> — после этого история появится здесь сама.
                </div>
            )}

            <div className="ap-toolbar crm-toolbar">
                <input className="admin-input ap-search" placeholder="Действие, клиент, заказ…" value={query} onChange={(e) => setQuery(e.target.value)} />
                <select className="admin-input crm-sort" value={admin} onChange={(e) => setAdmin(e.target.value)}>
                    <option value="all">Все сотрудники</option>
                    {admins.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>

            {loading ? <div className="ap-empty">Загрузка…</div> : shown.length === 0 ? <div className="ap-empty">{missing ? 'Записей пока нет.' : 'Ничего не нашли.'}</div> : (
                <div className="admin-table-premium crm-wrap">
                    <table className="admin-table crm-table">
                        <thead><tr><th>Когда</th><th>Кто</th><th>Действие</th><th>Над чем</th><th>Подробности</th></tr></thead>
                        <tbody>
                            {shown.slice(0, 300).map((i) => (
                                <tr key={i.id}>
                                    <td className="ap-muted">{fmtDate(i.created_at, true)}</td>
                                    <td><b>{i.admin}</b></td>
                                    <td><span className="ap-badge ap-badge--wait">{ACTIONS[i.action] || i.action}</span></td>
                                    <td>{i.target || '—'}</td>
                                    <td className="ap-muted">{i.details || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
