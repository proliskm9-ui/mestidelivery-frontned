import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/adminService';
import type { PromoKind } from './AdminPromotions';
import {
    CRM, type Customer, type CustomerDetails, type PersonalPromo, type Referral,
    displayName, fmtDate, gel, isMissingEndpoint, loadList, randomCode, referralStatusLabel, signedGel, txLabel,
} from './crm';
import './AdminPromotions.css';
import './AdminCrm.css';

type Filter = 'all' | 'bonus' | 'invited' | 'referrers' | 'blocked';

const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'bonus', label: 'С бонусами' },
    { id: 'referrers', label: 'Приглашают друзей' },
    { id: 'invited', label: 'Пришли по приглашению' },
    { id: 'blocked', label: 'Заблокированы' },
];

/* ================= Page ================= */

export function AdminCustomers() {
    const [items, setItems] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sort, setSort] = useState<'recent' | 'orders' | 'points'>('recent');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [openId, setOpenId] = useState<number | null>(null);
    const [bulk, setBulk] = useState<'bonus' | 'promo' | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            setItems(await loadList<Customer>(CRM.customers));
            setMissing(false);
        } catch (e) {
            if (isMissingEndpoint(e)) setMissing(true);
            else alert('Не удалось загрузить клиентов: ' + ((e as any)?.message || ''));
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const patch = (id: number, change: Partial<Customer>) => setItems((l) => l.map((c) => (c.id === id ? { ...c, ...change } : c)));

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        const qDigits = q.replace(/\D/g, '');
        let list = items.filter((c) => {
            if (filter === 'bonus' && !(c.points > 0)) return false;
            if (filter === 'invited' && !c.referrer_id) return false;
            if (filter === 'referrers' && !(c.invited_total || 0)) return false;
            if (filter === 'blocked' && !c.is_blocked) return false;
            if (!q) return true;
            return (c.name || '').toLowerCase().includes(q)
                || (qDigits.length >= 3 && (c.phone || '').replace(/\D/g, '').includes(qDigits))
                || (c.referral_code || '').toLowerCase() === q
                || String(c.id) === q;
        });
        list = [...list].sort((a, b) => {
            if (sort === 'orders') return (b.orders_total || 0) - (a.orders_total || 0);
            if (sort === 'points') return (b.points || 0) - (a.points || 0);
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        return list;
    }, [items, query, filter, sort]);

    const kpi = useMemo(() => {
        const weekAgo = Date.now() - 7 * 24 * 3600e3;
        return {
            total: items.length,
            fresh: items.filter((c) => c.created_at && new Date(c.created_at).getTime() > weekAgo).length,
            bonus: items.reduce((s, c) => s + (c.points || 0), 0),
            blocked: items.filter((c) => c.is_blocked).length,
        };
    }, [items]);

    const toggleSel = (id: number) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const allShownSelected = shown.length > 0 && shown.every((c) => selected.has(c.id));
    const toggleAll = () => setSelected(allShownSelected ? new Set() : new Set(shown.map((c) => c.id)));
    const targets = items.filter((c) => selected.has(c.id));

    return (
        <div className="admin-page ap crm">
            <header className="ap-head">
                <div>
                    <h1 className="ap-title">Клиенты</h1>
                    <p className="ap-sub">Бонусный баланс, промокоды и блокировка. Бонусы — это скидка при оплате, 1 бонус = 1 GEL.</p>
                </div>
                <button className="admin-btn" onClick={load}>Обновить</button>
            </header>

            {missing && <MissingNotice what="клиентов" />}

            <div className="crm-kpis">
                <Kpi label="Клиентов" value={kpi.total} />
                <Kpi label="Новых за 7 дней" value={kpi.fresh} />
                <Kpi label="Бонусов на счетах" value={gel(kpi.bonus)} accent />
                <Kpi label="Заблокировано" value={kpi.blocked} tone={kpi.blocked ? 'danger' : undefined} />
            </div>

            <div className="ap-toolbar crm-toolbar">
                <input className="admin-input ap-search" placeholder="Имя, телефон, ID или реф-код" value={query} onChange={(e) => setQuery(e.target.value)} />
                <select className="admin-input crm-sort" value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="Сортировка">
                    <option value="recent">Сначала новые</option>
                    <option value="orders">По сумме заказов</option>
                    <option value="points">По бонусам</option>
                </select>
            </div>
            <div className="crm-chips">
                {FILTERS.map((f) => (
                    <button key={f.id} type="button" className={`ap-chip${filter === f.id ? ' is-on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
                ))}
            </div>

            {selected.size > 0 && (
                <div className="crm-bulkbar">
                    <span>Выбрано: <b>{selected.size}</b></span>
                    <button className="admin-btn admin-btn-primary" onClick={() => setBulk('bonus')}>Начислить бонусы</button>
                    <button className="admin-btn" onClick={() => setBulk('promo')}>Выдать промокод</button>
                    <button className="admin-btn crm-link" onClick={() => setSelected(new Set())}>Снять выбор</button>
                </div>
            )}

            {loading ? <div className="ap-empty">Загрузка…</div> : shown.length === 0 ? (
                <div className="ap-empty">{missing ? 'Список появится, когда сервер начнёт отдавать клиентов.' : 'Никого не нашли.'}</div>
            ) : (
                <div className="admin-table-premium crm-wrap">
                    <table className="admin-table crm-table">
                        <thead>
                            <tr>
                                <th className="crm-col-check"><input type="checkbox" checked={allShownSelected} onChange={toggleAll} aria-label="Выбрать всех" /></th>
                                <th>Клиент</th>
                                <th>Заказы</th>
                                <th>Бонусы</th>
                                <th>Друзья</th>
                                <th>С нами с</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((c) => (
                                <tr key={c.id} className={`crm-row${c.is_blocked ? ' is-blocked' : ''}`} onClick={() => setOpenId(c.id)}>
                                    <td className="crm-col-check" onClick={(e) => e.stopPropagation()}>
                                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSel(c.id)} aria-label="Выбрать" />
                                    </td>
                                    <td>
                                        <div className="crm-person">
                                            <Avatar name={c.name} />
                                            <span>
                                                <span className="crm-name">{displayName(c.name, c.phone, c.id)}</span>
                                                <span className="ap-muted">{c.phone || c.email || `#${c.id}`}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td>{c.orders_count || 0}<div className="ap-muted">{gel(c.orders_total)}</div></td>
                                    <td><span className={c.points > 0 ? 'crm-points' : 'ap-muted'}>{gel(c.points)}</span></td>
                                    <td>
                                        {c.invited_total ? <div>{c.invited_completed || 0} из {c.invited_total} заказали</div> : null}
                                        {c.referrer_id ? <div className="ap-muted">пришёл от {displayName(c.referrer_name, null, c.referrer_id)}</div> : null}
                                        {!c.invited_total && !c.referrer_id ? <span className="ap-muted">—</span> : null}
                                    </td>
                                    <td className="ap-muted">{fmtDate(c.created_at)}</td>
                                    <td>{c.is_blocked ? <span className="ap-badge ap-badge--off crm-badge-danger">Заблокирован</span> : <span className="ap-badge ap-badge--on">Активен</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {openId != null && (
                <CustomerPanel
                    id={openId}
                    fallback={items.find((c) => c.id === openId)}
                    onClose={() => setOpenId(null)}
                    onChanged={(change) => patch(openId, change)}
                    onOpenCustomer={setOpenId}
                />
            )}

            {bulk && (
                <div className="admin-centered-modal-overlay" onClick={() => setBulk(null)}>
                    <div className="admin-centered-modal crm-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="ap-editor-title">{bulk === 'bonus' ? 'Начислить бонусы' : 'Выдать промокод'} — {targets.length} {plural(targets.length, 'клиенту', 'клиентам', 'клиентам')}</h2>
                        {bulk === 'bonus' ? (
                            <BonusForm
                                targets={targets}
                                onDone={(results) => { results.forEach(([id, points]) => patch(id, { points })); setBulk(null); setSelected(new Set()); }}
                                onCancel={() => setBulk(null)}
                            />
                        ) : (
                            <PromoForm targets={targets} onDone={() => { setBulk(null); setSelected(new Set()); }} onCancel={() => setBulk(null)} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ================= Shared bits ================= */

export function Avatar({ name, large }: { name?: string | null; large?: boolean }) {
    const letter = (name || '').trim().charAt(0).toUpperCase();
    return (
        <span className={`crm-avatar${large ? ' crm-avatar--lg' : ''}`} aria-hidden="true">
            {letter || <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>}
        </span>
    );
}

export function Kpi({ label, value, accent, tone, hint }: { label: React.ReactNode; value: React.ReactNode; accent?: boolean; tone?: 'danger' | 'warn'; hint?: string }) {
    return (
        <div className={`crm-kpi${accent ? ' is-accent' : ''}${tone ? ` is-${tone}` : ''}`} title={hint}>
            <span className="crm-kpi-value">{value}</span>
            <span className="crm-kpi-label">{label}</span>
        </div>
    );
}

export function MissingNotice({ what }: { what: string }) {
    return (
        <div className="ap-notice">
            <strong>Сервер ещё не отдаёт данные {what}.</strong>
            Интерфейс готов: как только на сервере появятся эндпоинты из <code>docs/ADMIN_CUSTOMERS_API.md</code>, всё заработает без изменений на сайте.
        </div>
    );
}

export function plural(n: number, one: string, few: string, many: string) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
}

/* ================= Customer panel (drawer) ================= */

type PanelTab = 'bonus' | 'friends' | 'promo';
type PanelAction = null | 'bonus' | 'promo' | 'block';

export function CustomerPanel({ id, fallback, onClose, onChanged, onOpenCustomer }: {
    id: number;
    fallback?: Partial<Customer>;
    onClose: () => void;
    onChanged?: (change: Partial<Customer>) => void;
    onOpenCustomer?: (id: number) => void;
}) {
    const [data, setData] = useState<CustomerDetails | null>(fallback ? ({ ...fallback } as CustomerDetails) : null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<PanelTab>('bonus');
    const [action, setAction] = useState<PanelAction>(null);

    const load = async () => {
        setLoading(true);
        try {
            const d = await adminApi.get<CustomerDetails>(CRM.customer(id), true);
            setData((prev) => ({ ...(prev || {}), ...d }));
        } catch { /* keep the list row as a fallback */ }
        finally { setLoading(false); }
    };
    useEffect(() => { setAction(null); setTab('bonus'); load(); }, [id]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const apply = (change: Partial<CustomerDetails>) => { setData((d) => (d ? { ...d, ...change } : d)); onChanged?.(change); };

    const c = data;
    const name = displayName(c?.name, c?.phone, id);

    return (
        <div className="crm-drawer-overlay" onClick={onClose}>
            <aside className="crm-drawer" onClick={(e) => e.stopPropagation()} aria-label={`Клиент ${name}`}>
                <header className="crm-drawer-head">
                    <Avatar name={c?.name} large />
                    <div className="crm-drawer-who">
                        <h2>{name}</h2>
                        <p className="ap-muted">
                            {[c?.phone, c?.email, `ID ${id}`, c?.created_at ? `с ${fmtDate(c.created_at)}` : ''].filter(Boolean).join(' · ')}
                        </p>
                        {c?.is_blocked && <p className="crm-blocked-note">Заблокирован{c.blocked_reason ? `: ${c.blocked_reason}` : ''}</p>}
                    </div>
                    <button className="crm-close" onClick={onClose} aria-label="Закрыть">×</button>
                </header>

                <div className="crm-drawer-stats">
                    <div><span className="crm-points crm-big">{gel(c?.points)}</span><span className="ap-muted">бонусов</span></div>
                    <div><b>{c?.orders_count ?? 0}</b><span className="ap-muted">заказов · {gel(c?.orders_total)}</span></div>
                    <div><b>{c?.invited_completed ?? 0} / {c?.invited_total ?? 0}</b><span className="ap-muted">друзей заказали</span></div>
                    <div><b>{gel(c?.bonus_earned)}</b><span className="ap-muted">заработал на друзьях</span></div>
                </div>

                {c?.referrer_id ? (
                    <p className="crm-from">
                        Пришёл по приглашению{' '}
                        <button className="crm-link" onClick={() => onOpenCustomer?.(c.referrer_id!)}>{displayName(c.referrer_name, null, c.referrer_id)}</button>
                    </p>
                ) : null}

                <div className="crm-drawer-actions">
                    <button className={`admin-btn${action === 'bonus' ? ' admin-btn-primary' : ''}`} onClick={() => setAction(action === 'bonus' ? null : 'bonus')}>Начислить / списать</button>
                    <button className={`admin-btn${action === 'promo' ? ' admin-btn-primary' : ''}`} onClick={() => setAction(action === 'promo' ? null : 'promo')}>Выдать промокод</button>
                    {c?.is_blocked ? (
                        <UnblockButton id={id} onDone={() => apply({ is_blocked: false, blocked_reason: null })} />
                    ) : (
                        <button className={`admin-btn admin-btn-danger${action === 'block' ? ' is-on' : ''}`} onClick={() => setAction(action === 'block' ? null : 'block')}>Заблокировать</button>
                    )}
                </div>

                {action && c && (
                    <div className="crm-action-box">
                        {action === 'bonus' && (
                            <BonusForm targets={[c]} onCancel={() => setAction(null)} onDone={(res) => { const p = res[0]?.[1]; if (p != null) apply({ points: p }); setAction(null); load(); }} />
                        )}
                        {action === 'promo' && (
                            <PromoForm targets={[c]} onCancel={() => setAction(null)} onDone={() => { setAction(null); setTab('promo'); load(); }} />
                        )}
                        {action === 'block' && (
                            <BlockForm customer={c} onCancel={() => setAction(null)} onDone={(change) => { apply(change); setAction(null); load(); }} />
                        )}
                    </div>
                )}

                <div className="ap-tabs crm-drawer-tabs" role="tablist">
                    <button role="tab" aria-selected={tab === 'bonus'} className={`ap-tab${tab === 'bonus' ? ' is-on' : ''}`} onClick={() => setTab('bonus')}>История бонусов</button>
                    <button role="tab" aria-selected={tab === 'friends'} className={`ap-tab${tab === 'friends' ? ' is-on' : ''}`} onClick={() => setTab('friends')}>Приглашённые</button>
                    <button role="tab" aria-selected={tab === 'promo'} className={`ap-tab${tab === 'promo' ? ' is-on' : ''}`} onClick={() => setTab('promo')}>Промокоды</button>
                </div>

                <div className="crm-drawer-body">
                    {loading && !c?.bonus_transactions ? <div className="ap-empty">Загрузка…</div> : (
                        <>
                            {tab === 'bonus' && <TxList items={c?.bonus_transactions || []} />}
                            {tab === 'friends' && <FriendsList items={c?.referrals || []} onOpenCustomer={onOpenCustomer} />}
                            {tab === 'promo' && <PromoList items={c?.promo_codes || []} />}
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}

function TxList({ items }: { items: CustomerDetails['bonus_transactions'] & {} }) {
    if (!items.length) return <div className="ap-empty">Движений по бонусам пока нет.</div>;
    return (
        <ul className="crm-list">
            {items.map((t) => (
                <li key={t.id}>
                    <span className="crm-list-main">
                        <b>{txLabel[t.type] || t.type}</b>
                        <span className="ap-muted">{[fmtDate(t.created_at, true), t.order_id ? `заказ #${t.order_id}` : '', t.admin ? `админ: ${t.admin}` : ''].filter(Boolean).join(' · ')}</span>
                        {t.description && <span className="ap-muted">{t.description}</span>}
                    </span>
                    <span className={`crm-amount ${t.amount >= 0 ? 'is-plus' : 'is-minus'}`}>{signedGel(t.amount)}</span>
                </li>
            ))}
        </ul>
    );
}

function FriendsList({ items, onOpenCustomer }: { items: Referral[]; onOpenCustomer?: (id: number) => void }) {
    if (!items.length) return <div className="ap-empty">Ещё никого не пригласил.</div>;
    return (
        <ul className="crm-list">
            {items.map((r) => (
                <li key={r.id}>
                    <span className="crm-list-main">
                        {r.referee_id ? <button className="crm-link" onClick={() => onOpenCustomer?.(r.referee_id!)}>{displayName(r.referee_name, r.referee_phone, r.referee_id)}</button> : <b>{r.referee_phone || '—'}</b>}
                        <span className="ap-muted">{[fmtDate(r.created_at), r.qualifying_order_id ? `заказ #${r.qualifying_order_id} на ${gel(r.order_total)}` : ''].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className={`crm-status crm-status--${r.status}`}>{referralStatusLabel[r.status]}</span>
                </li>
            ))}
        </ul>
    );
}

function PromoList({ items }: { items: PersonalPromo[] }) {
    if (!items.length) return <div className="ap-empty">Персональных промокодов нет.</div>;
    return (
        <ul className="crm-list">
            {items.map((p) => (
                <li key={p.id ?? p.code}>
                    <span className="crm-list-main">
                        <span className="ap-code">{p.code}</span>
                        <span className="ap-muted">{[promoBenefit(p.kind, p.value), p.min_order ? `от ${p.min_order} GEL` : '', p.ends_at ? `до ${fmtDate(p.ends_at)}` : '', p.note || ''].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className={`crm-status ${p.used ? 'crm-status--cancelled' : 'crm-status--completed'}`}>{p.used ? 'Использован' : 'Активен'}</span>
                </li>
            ))}
        </ul>
    );
}

const promoBenefit = (kind: PromoKind, value: number) => (kind === 'free_delivery' ? 'Бесплатная доставка' : kind === 'percent' ? `−${value}%` : `−${value} GEL`);

/* ================= Forms ================= */

const BONUS_REASONS = ['Подарок', 'Компенсация за заказ', 'Бонус за отзыв', 'Корректировка', 'Накрутка рефералов'];

/** Credit or debit bonuses for one or many customers. onDone gets [id, newBalance] pairs. */
function BonusForm({ targets, onDone, onCancel }: { targets: Customer[]; onDone: (res: [number, number][]) => void; onCancel: () => void }) {
    const single = targets.length === 1 ? targets[0] : null;
    const [sign, setSign] = useState<1 | -1>(1);
    const [amount, setAmount] = useState('5');
    const [reason, setReason] = useState(BONUS_REASONS[0]);
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const value = Math.round((Number(amount.replace(',', '.')) || 0) * 100) / 100;
    const delta = sign * value;
    const after = single ? Math.max(0, (single.points || 0) + delta) : null;
    const tooMuch = single && sign < 0 && value > (single.points || 0);

    const submit = async () => {
        if (value <= 0) return;
        setBusy(true);
        const res: [number, number][] = [];
        const failed: string[] = [];
        for (const t of targets) {
            try {
                const r = await adminApi.post<{ points?: number }>(CRM.bonus(t.id), { amount: delta, reason, comment: comment.trim() || undefined });
                res.push([t.id, typeof r?.points === 'number' ? r.points : Math.max(0, (t.points || 0) + delta)]);
            } catch (e: any) {
                failed.push(`${displayName(t.name, t.phone, t.id)}: ${isMissingEndpoint(e) ? 'сервер не готов' : e?.message || 'ошибка'}`);
            }
        }
        setBusy(false);
        if (failed.length) alert('Не получилось для:\n' + failed.join('\n'));
        if (res.length) onDone(res);
    };

    return (
        <div className="crm-form">
            <div className="ap-seg">
                <button type="button" className={`ap-seg-btn${sign === 1 ? ' is-on' : ''}`} onClick={() => { setSign(1); if (reason === 'Накрутка рефералов') setReason(BONUS_REASONS[0]); }}>Начислить</button>
                <button type="button" className={`ap-seg-btn${sign === -1 ? ' is-on' : ''}`} onClick={() => setSign(-1)}>Списать</button>
            </div>
            <div className="crm-form-row">
                <label className="ap-field">
                    <span className="ap-field-label">Сумма, GEL</span>
                    <input className="admin-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </label>
                <div className="ap-chips crm-quick">
                    {[5, 10, 20, 50].map((n) => <button key={n} type="button" className={`ap-chip${value === n ? ' is-on' : ''}`} onClick={() => setAmount(String(n))}>{n}</button>)}
                    {single && sign < 0 && single.points > 0 && <button type="button" className="ap-chip" onClick={() => setAmount(String(single.points))}>Всё ({single.points})</button>}
                </div>
            </div>
            <label className="ap-field">
                <span className="ap-field-label">Причина</span>
                <select className="admin-input" value={reason} onChange={(e) => setReason(e.target.value)}>
                    {BONUS_REASONS.filter((r) => sign < 0 || r !== 'Накрутка рефералов').map((r) => <option key={r}>{r}</option>)}
                </select>
            </label>
            <label className="ap-field">
                <span className="ap-field-label">Комментарий (видите только вы)</span>
                <input className="admin-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Например: заказ #1042 опоздал на 40 минут" />
            </label>
            <div className="ap-editor-foot">
                <span className="ap-muted">
                    {single ? <>Баланс: {gel(single.points)} → <b className={tooMuch ? 'crm-danger' : 'crm-points'}>{gel(after)}</b>{tooMuch ? ' (спишем сколько есть)' : ''}</> : <>Каждому: <b className="crm-points">{signedGel(delta)}</b>, всего {signedGel(delta * targets.length)}</>}
                </span>
                <div className="ap-actions">
                    <button className="admin-btn" onClick={onCancel}>Отмена</button>
                    <button className={`admin-btn ${sign < 0 ? 'admin-btn-danger' : 'admin-btn-primary'}`} disabled={busy || value <= 0} onClick={submit}>{busy ? 'Сохранение…' : sign > 0 ? `Начислить ${gel(value)}` : `Списать ${gel(value)}`}</button>
                </div>
            </div>
        </div>
    );
}

/** Personal promo codes: one code per customer, usable once, only by that customer. */
function PromoForm({ targets, onDone, onCancel }: { targets: Customer[]; onDone: () => void; onCancel: () => void }) {
    const inMonth = new Date(Date.now() + 30 * 24 * 3600e3).toISOString().slice(0, 10);
    const [p, setP] = useState<PersonalPromo>({ code: randomCode(), kind: 'fixed', value: 10, min_order: 30, ends_at: inMonth, note: '' });
    const [busy, setBusy] = useState(false);
    const set = <K extends keyof PersonalPromo>(k: K, v: PersonalPromo[K]) => setP((x) => ({ ...x, [k]: v }));
    const num = (v: string) => Math.max(0, Number(v.replace(',', '.')) || 0);
    const many = targets.length > 1;

    const problems: string[] = [];
    if (!many && !/^[A-Z0-9_-]{3,20}$/.test(p.code)) problems.push('Код: 3–20 символов, латиница, цифры, - и _');
    if (p.kind === 'percent' && (p.value < 1 || p.value > 100)) problems.push('Процент от 1 до 100');
    if (p.kind === 'fixed' && p.value <= 0) problems.push('Сумма скидки больше 0');

    const submit = async () => {
        if (problems.length) return;
        setBusy(true);
        const failed: string[] = [];
        for (const t of targets) {
            const body = { ...p, code: many ? randomCode(p.code.split('-')[0] || 'GIFT') : p.code };
            try { await adminApi.post(CRM.promo(t.id), body); }
            catch (e: any) { failed.push(`${displayName(t.name, t.phone, t.id)}: ${isMissingEndpoint(e) ? 'сервер не готов' : e?.message || 'ошибка'}`); }
        }
        setBusy(false);
        if (failed.length) alert('Не получилось для:\n' + failed.join('\n'));
        if (failed.length < targets.length) onDone();
    };

    return (
        <div className="crm-form">
            <div className="ap-grid">
                <label className="ap-field ap-col-2">
                    <span className="ap-field-label">{many ? 'Префикс кода (каждому сгенерируем свой)' : 'Код'}</span>
                    <div className="crm-inline">
                        <input className="admin-input ap-code-input" value={many ? p.code.split('-')[0] : p.code} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} />
                        {!many && <button type="button" className="admin-btn" onClick={() => set('code', randomCode())}>Сгенерировать</button>}
                    </div>
                </label>
                <div className="ap-field ap-col-2">
                    <span className="ap-field-label">Что даёт</span>
                    <div className="ap-seg">
                        <button type="button" className={`ap-seg-btn${p.kind === 'fixed' ? ' is-on' : ''}`} onClick={() => set('kind', 'fixed')}>Скидка GEL</button>
                        <button type="button" className={`ap-seg-btn${p.kind === 'percent' ? ' is-on' : ''}`} onClick={() => set('kind', 'percent')}>Скидка %</button>
                        <button type="button" className={`ap-seg-btn${p.kind === 'free_delivery' ? ' is-on' : ''}`} onClick={() => set('kind', 'free_delivery')}>Бесплатная доставка</button>
                    </div>
                </div>
                {p.kind !== 'free_delivery' && (
                    <label className="ap-field">
                        <span className="ap-field-label">{p.kind === 'percent' ? 'Процент' : 'Скидка, GEL'}</span>
                        <input className="admin-input" inputMode="decimal" value={p.value} onChange={(e) => set('value', num(e.target.value))} />
                    </label>
                )}
                <label className="ap-field">
                    <span className="ap-field-label">Заказ от, GEL</span>
                    <input className="admin-input" inputMode="decimal" value={p.min_order} onChange={(e) => set('min_order', num(e.target.value))} />
                </label>
                <label className="ap-field">
                    <span className="ap-field-label">Действует до</span>
                    <input type="date" className="admin-input" value={p.ends_at || ''} onChange={(e) => set('ends_at', e.target.value || null)} />
                </label>
                <label className="ap-field ap-col-2">
                    <span className="ap-field-label">Заметка</span>
                    <input className="admin-input" value={p.note || ''} onChange={(e) => set('note', e.target.value)} placeholder="Например: извинение за задержку" />
                </label>
            </div>
            {problems.length > 0 && <ul className="ap-problems">{problems.map((x) => <li key={x}>{x}</li>)}</ul>}
            <div className="ap-editor-foot">
                <span className="ap-muted">Клиент увидит код в профиле → «Промокоды». Одноразовый, только для {many ? 'этих клиентов' : 'этого клиента'}.</span>
                <div className="ap-actions">
                    <button className="admin-btn" onClick={onCancel}>Отмена</button>
                    <button className="admin-btn admin-btn-primary" disabled={busy || problems.length > 0} onClick={submit}>{busy ? 'Выдаём…' : 'Выдать'}</button>
                </div>
            </div>
        </div>
    );
}

const BLOCK_REASONS = ['Накрутка рефералов', 'Мошенничество с заказами', 'Оскорбления курьеров', 'Другое'];

function BlockForm({ customer, onDone, onCancel }: { customer: Customer; onDone: (c: Partial<Customer>) => void; onCancel: () => void }) {
    const [reason, setReason] = useState(BLOCK_REASONS[0]);
    const [comment, setComment] = useState('');
    const [wipe, setWipe] = useState(customer.points > 0);
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setBusy(true);
        const full = [reason, comment.trim()].filter(Boolean).join(': ');
        try {
            await adminApi.post(CRM.block(customer.id), { blocked: true, reason: full });
            const change: Partial<Customer> = { is_blocked: true, blocked_reason: full };
            if (wipe && customer.points > 0) {
                const r = await adminApi.post<{ points?: number }>(CRM.bonus(customer.id), { amount: -customer.points, reason: 'Блокировка', comment: full });
                change.points = typeof r?.points === 'number' ? r.points : 0;
            }
            onDone(change);
        } catch (e: any) {
            alert(isMissingEndpoint(e) ? 'Сервер ещё не умеет блокировать клиентов (docs/ADMIN_CUSTOMERS_API.md).' : 'Не удалось: ' + (e?.message || ''));
        } finally { setBusy(false); }
    };

    return (
        <div className="crm-form">
            <p className="crm-warn">Заблокированный клиент не сможет оформлять заказы и получать бонусы за друзей. Уже выплаченные бонусы можно списать ниже.</p>
            <label className="ap-field">
                <span className="ap-field-label">Причина</span>
                <select className="admin-input" value={reason} onChange={(e) => setReason(e.target.value)}>{BLOCK_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
            </label>
            <label className="ap-field">
                <span className="ap-field-label">Комментарий</span>
                <input className="admin-input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Что именно заметили" />
            </label>
            {customer.points > 0 && (
                <label className="ap-check">
                    <input type="checkbox" checked={wipe} onChange={(e) => setWipe(e.target.checked)} />
                    Списать все бонусы ({gel(customer.points)})
                </label>
            )}
            <div className="ap-editor-foot">
                <span />
                <div className="ap-actions">
                    <button className="admin-btn" onClick={onCancel}>Отмена</button>
                    <button className="admin-btn admin-btn-danger" disabled={busy} onClick={submit}>{busy ? 'Блокируем…' : 'Заблокировать'}</button>
                </div>
            </div>
        </div>
    );
}

function UnblockButton({ id, onDone }: { id: number; onDone: () => void }) {
    const [busy, setBusy] = useState(false);
    return (
        <button className="admin-btn" disabled={busy} onClick={async () => {
            if (!confirm('Разблокировать клиента?')) return;
            setBusy(true);
            try { await adminApi.post(CRM.block(id), { blocked: false }); onDone(); }
            catch (e: any) { alert('Не удалось: ' + (e?.message || '')); }
            finally { setBusy(false); }
        }}>{busy ? '…' : 'Разблокировать'}</button>
    );
}
