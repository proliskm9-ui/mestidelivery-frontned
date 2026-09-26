import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/adminService';
import {
    CRM, type Referral, type ReferralStatus, type Flag,
    displayName, fmtDate, gel, isMissingEndpoint, loadList, referralFlags, referralStatusLabel, riskScore,
} from './crm';
import { CustomerPanel, Kpi, MissingNotice, plural } from './AdminCustomers';
import './AdminPromotions.css';
import './AdminCrm.css';

type View = 'all' | ReferralStatus | 'suspicious';

const VIEWS: { id: View; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'suspicious', label: 'Подозрительные' },
    { id: 'pending', label: 'Ждут заказа' },
    { id: 'completed', label: 'Выплачены' },
    { id: 'cancelled', label: 'Отменены' },
];

interface Row extends Referral { _flags: Flag[]; _risk: number }

export function AdminReferrals() {
    const [items, setItems] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);
    const [view, setView] = useState<View>('all');
    const [query, setQuery] = useState('');
    const [period, setPeriod] = useState<'7' | '30' | 'all'>('30');
    const [openCustomer, setOpenCustomer] = useState<number | null>(null);
    const [cancelling, setCancelling] = useState<Row | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            setItems(await loadList<Referral>(CRM.referrals));
            setMissing(false);
        } catch (e) {
            if (isMissingEndpoint(e)) setMissing(true);
            else alert('Не удалось загрузить рефералов: ' + ((e as any)?.message || ''));
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const inPeriod = useMemo(() => {
        if (period === 'all') return items;
        const from = Date.now() - Number(period) * 24 * 3600e3;
        return items.filter((r) => new Date(r.created_at).getTime() >= from);
    }, [items, period]);

    const rows: Row[] = useMemo(() => inPeriod.map((r) => {
        const f = referralFlags(r, items);
        return { ...r, _flags: f, _risk: riskScore(f) };
    }), [inPeriod, items]);

    const kpi = useMemo(() => {
        const done = rows.filter((r) => r.status === 'completed');
        const active = rows.filter((r) => r.status !== 'cancelled');
        return {
            total: rows.length,
            pending: rows.filter((r) => r.status === 'pending').length,
            done: done.length,
            paid: done.reduce((s, r) => s + (r.reward_points || 0), 0),
            orders: done.reduce((s, r) => s + (r.order_total || 0), 0),
            conversion: active.length ? Math.round((done.length / active.length) * 100) : 0,
            suspicious: rows.filter((r) => r.status !== 'cancelled' && r._risk >= 2).length,
        };
    }, [rows]);

    const top = useMemo(() => {
        const map = new Map<number, { id: number; name: string; invited: number; done: number; earned: number; risk: number }>();
        rows.forEach((r) => {
            const e = map.get(r.referrer_id) || { id: r.referrer_id, name: displayName(r.referrer_name, r.referrer_phone, r.referrer_id), invited: 0, done: 0, earned: 0, risk: 0 };
            e.invited++;
            if (r.status === 'completed') { e.done++; e.earned += r.reward_points || 0; }
            if (r.status !== 'cancelled') e.risk += r._risk;
            map.set(r.referrer_id, e);
        });
        return [...map.values()].sort((a, b) => b.invited - a.invited || b.earned - a.earned).slice(0, 6);
    }, [rows]);

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        const qd = q.replace(/\D/g, '');
        return rows
            .filter((r) => (view === 'all' ? true : view === 'suspicious' ? r.status !== 'cancelled' && r._risk >= 2 : r.status === view))
            .filter((r) => !q
                || [r.referrer_name, r.referee_name].some((n) => (n || '').toLowerCase().includes(q))
                || (qd.length >= 3 && [r.referrer_phone, r.referee_phone].some((p) => (p || '').replace(/\D/g, '').includes(qd)))
                || String(r.qualifying_order_id || '') === q)
            .sort((a, b) => (view === 'suspicious' ? b._risk - a._risk : 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [rows, view, query]);

    const markCancelled = (id: number, reason: string) =>
        setItems((l) => l.map((r) => (r.id === id ? { ...r, status: 'cancelled', cancel_reason: reason } : r)));

    return (
        <div className="admin-page ap crm">
            <header className="ap-head">
                <div>
                    <h1 className="ap-title">Рефералы</h1>
                    <p className="ap-sub">Друг получает бесплатную доставку от 100 GEL, пригласивший — 5 GEL бонусами за первый доставленный заказ друга от 50 GEL. Подозрительные приглашения подсвечены — их можно отменить и забрать бонус.</p>
                </div>
                <div className="crm-head-actions">
                    <div className="ap-seg">
                        {(['7', '30', 'all'] as const).map((p) => (
                            <button key={p} type="button" className={`ap-seg-btn${period === p ? ' is-on' : ''}`} onClick={() => setPeriod(p)}>{p === 'all' ? 'Всё время' : `${p} дней`}</button>
                        ))}
                    </div>
                    <button className="admin-btn" onClick={load}>Обновить</button>
                </div>
            </header>

            {missing && <MissingNotice what="о приглашениях" />}

            <div className="crm-kpis">
                <Kpi label="Приглашений" value={kpi.total} />
                <Kpi label="Ждут первого заказа" value={kpi.pending} />
                <Kpi label={`Выплачено за ${kpi.done} ${plural(kpi.done, 'друга', 'друзей', 'друзей')}`} value={gel(kpi.paid)} accent />
                <Kpi label="Конверсия в заказ" value={`${kpi.conversion}%`} hint="Выплачено / все неотменённые приглашения" />
                <Kpi label="Заказы друзей" value={gel(kpi.orders)} hint="Сумма первых заказов приглашённых" />
                <Kpi label="Подозрительных" value={kpi.suspicious} tone={kpi.suspicious ? 'warn' : undefined} />
            </div>

            <div className="crm-split">
                <section className="crm-panel">
                    <h3 className="crm-panel-title">Топ пригласивших</h3>
                    {top.length === 0 ? <div className="ap-empty">Пока никого.</div> : (
                        <ol className="crm-top">
                            {top.map((p, i) => (
                                <li key={p.id}>
                                    <span className="crm-top-rank">{i + 1}</span>
                                    <button className="crm-link crm-top-name" onClick={() => setOpenCustomer(p.id)}>{p.name}</button>
                                    <span className="crm-top-meta">{p.done}/{p.invited} · {gel(p.earned)}</span>
                                    {p.risk >= 3 && <span className="crm-flag is-hot" title="Много подозрительных сигналов">риск</span>}
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <section className="crm-panel crm-panel--legend">
                    <h3 className="crm-panel-title">На что смотреть</h3>
                    <ul className="crm-legend">
                        <li><span className="crm-flag is-hot">Одно устройство / адрес</span> почти наверняка сам себя пригласил</li>
                        <li><span className="crm-flag">Похожие номера</span> номера отличаются 1–2 цифрами</li>
                        <li><span className="crm-flag">Волна приглашений</span> 3+ друга за сутки</li>
                        <li><span className="crm-flag">Заказ впритык</span> первый заказ ровно на 50–55 GEL</li>
                    </ul>
                    <p className="ap-muted">Отмена приглашения с возвратом списывает выплаченные 5 GEL с баланса пригласившего. Если это системно — заблокируйте его в карточке клиента.</p>
                </section>
            </div>

            <div className="ap-toolbar crm-toolbar">
                <input className="admin-input ap-search" placeholder="Имя, телефон или номер заказа" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="crm-chips">
                {VIEWS.map((v) => (
                    <button key={v.id} type="button" className={`ap-chip${view === v.id ? ' is-on' : ''}`} onClick={() => setView(v.id)}>
                        {v.label}{v.id === 'suspicious' && kpi.suspicious ? <span className="crm-count">{kpi.suspicious}</span> : null}
                    </button>
                ))}
            </div>

            {loading ? <div className="ap-empty">Загрузка…</div> : shown.length === 0 ? (
                <div className="ap-empty">{missing ? 'Данные появятся, когда сервер начнёт их отдавать.' : 'Ничего не нашли.'}</div>
            ) : (
                <div className="admin-table-premium crm-wrap">
                    <table className="admin-table crm-table">
                        <thead>
                            <tr><th>Дата</th><th>Пригласил</th><th>Друг</th><th>Первый заказ</th><th>Бонус</th><th>Статус</th><th>Сигналы</th><th style={{ textAlign: 'right' }}>Действия</th></tr>
                        </thead>
                        <tbody>
                            {shown.map((r) => (
                                <tr key={r.id} className={r.status !== 'cancelled' && r._risk >= 3 ? 'crm-row is-hot' : 'crm-row'}>
                                    <td className="ap-muted">{fmtDate(r.created_at, true)}</td>
                                    <td>
                                        <button className="crm-link" onClick={() => setOpenCustomer(r.referrer_id)}>{displayName(r.referrer_name, r.referrer_phone, r.referrer_id)}</button>
                                        <div className="ap-muted">{r.referrer_phone || ''}</div>
                                    </td>
                                    <td>
                                        {r.referee_id
                                            ? <button className="crm-link" onClick={() => setOpenCustomer(r.referee_id!)}>{displayName(r.referee_name, r.referee_phone, r.referee_id)}</button>
                                            : <span>{r.referee_phone || '—'}</span>}
                                        <div className="ap-muted">{r.referee_id ? r.referee_phone || '' : ''}</div>
                                    </td>
                                    <td>{r.qualifying_order_id ? <>#{r.qualifying_order_id}<div className="ap-muted">{gel(r.order_total)}</div></> : <span className="ap-muted">нет</span>}</td>
                                    <td>{r.status === 'completed' ? <span className="crm-points">+{r.reward_points || 5} GEL</span> : <span className="ap-muted">{r.reward_points || 5} GEL</span>}</td>
                                    <td>
                                        <span className={`crm-status crm-status--${r.status}`}>{referralStatusLabel[r.status]}</span>
                                        {r.cancel_reason && <div className="ap-muted">{r.cancel_reason}</div>}
                                    </td>
                                    <td>
                                        <div className="crm-flags">
                                            {r._flags.length === 0 ? <span className="ap-muted">—</span> : r._flags.map((f) => (
                                                <span key={f.id} className={`crm-flag${f.weight >= 3 ? ' is-hot' : ''}`} title={f.hint}>{f.label}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {r.status !== 'cancelled' && <button className="admin-btn admin-btn-danger" onClick={() => setCancelling(r)}>Отменить</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {cancelling && (
                <CancelModal
                    row={cancelling}
                    onClose={() => setCancelling(null)}
                    onDone={(reason) => { markCancelled(cancelling.id, reason); setCancelling(null); }}
                    onOpenReferrer={() => { setOpenCustomer(cancelling.referrer_id); setCancelling(null); }}
                />
            )}

            {openCustomer != null && (
                <CustomerPanel id={openCustomer} onClose={() => setOpenCustomer(null)} onOpenCustomer={setOpenCustomer} onChanged={() => load()} />
            )}
        </div>
    );
}

const CANCEL_REASONS = ['Сам себя пригласил', 'Фейковый аккаунт', 'Заказ отменён / возврат', 'Другое'];

function CancelModal({ row, onClose, onDone, onOpenReferrer }: { row: Row; onClose: () => void; onDone: (reason: string) => void; onOpenReferrer: () => void }) {
    const [reason, setReason] = useState(CANCEL_REASONS[0]);
    const [revoke, setRevoke] = useState(row.status === 'completed');
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setBusy(true);
        try {
            await adminApi.post(CRM.cancelReferral(row.id), { reason, revoke_reward: revoke });
            onDone(reason);
        } catch (e: any) {
            alert(isMissingEndpoint(e) ? 'Сервер ещё не умеет отменять приглашения (docs/ADMIN_CUSTOMERS_API.md).' : 'Не удалось: ' + (e?.message || ''));
        } finally { setBusy(false); }
    };

    return (
        <div className="admin-centered-modal-overlay" onClick={onClose}>
            <div className="admin-centered-modal crm-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="ap-editor-title">Отменить приглашение</h2>
                <p className="ap-muted">
                    {displayName(row.referrer_name, row.referrer_phone, row.referrer_id)} → {displayName(row.referee_name, row.referee_phone, row.referee_id)}
                    {row.qualifying_order_id ? `, заказ #${row.qualifying_order_id} на ${gel(row.order_total)}` : ''}
                </p>
                {row._flags.length > 0 && <div className="crm-flags crm-flags--gap">{row._flags.map((f) => <span key={f.id} className={`crm-flag${f.weight >= 3 ? ' is-hot' : ''}`} title={f.hint}>{f.label}</span>)}</div>}
                <div className="crm-form">
                    <label className="ap-field">
                        <span className="ap-field-label">Причина</span>
                        <select className="admin-input" value={reason} onChange={(e) => setReason(e.target.value)}>{CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
                    </label>
                    {row.status === 'completed' && (
                        <label className="ap-check">
                            <input type="checkbox" checked={revoke} onChange={(e) => setRevoke(e.target.checked)} />
                            Забрать выплаченный бонус ({row.reward_points || 5} GEL) у пригласившего
                        </label>
                    )}
                    <div className="ap-editor-foot">
                        <button className="admin-btn crm-link" onClick={onOpenReferrer}>Открыть пригласившего — заблокировать</button>
                        <div className="ap-actions">
                            <button className="admin-btn" onClick={onClose}>Назад</button>
                            <button className="admin-btn admin-btn-danger" disabled={busy} onClick={submit}>{busy ? 'Отменяем…' : 'Отменить приглашение'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
