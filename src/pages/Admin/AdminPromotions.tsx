import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/adminService';
import { Restaurant } from '../../services/api';
import { pickI18nText, parseI18nContent } from '../../utils/i18nContent';
import './AdminPromotions.css';

/* ================= Types ================= */

type Lang = 'ru' | 'en' | 'ka';
const LANGS: { id: Lang; label: string }[] = [{ id: 'ru', label: 'RU' }, { id: 'en', label: 'EN' }, { id: 'ka', label: 'KA' }];

export type PromoKind = 'percent' | 'fixed' | 'free_delivery';

export interface PromoCode {
    id?: number;
    code: string;
    kind: PromoKind;
    /** percent: 1-100; fixed: GEL off the order; free_delivery: ignored */
    value: number;
    min_order: number;
    /** GEL cap for percent codes, 0 = no cap */
    max_discount: number;
    max_activations: number;   // 0 = unlimited
    per_user_limit: number;    // 0 = unlimited
    activations?: number;      // read-only, from the server
    new_customers_only: boolean;
    restaurant_ids: string[];  // empty = all restaurants
    starts_at: string | null;  // ISO date
    ends_at: string | null;
    is_active: boolean;
    note?: string;
}

const EMPTY_CODE: PromoCode = {
    code: '', kind: 'percent', value: 10, min_order: 0, max_discount: 0, max_activations: 0, per_user_limit: 1,
    new_customers_only: false, restaurant_ids: [], starts_at: null, ends_at: null, is_active: true, note: '',
};

const PROMO_ENDPOINT = '/admin/promo-codes';

/* ================= Helpers ================= */

function readI18n(raw?: string | null): Record<Lang, string> {
    const parsed = parseI18nContent(raw || '');
    if (typeof parsed === 'string') return { ru: parsed, en: '', ka: '' };
    return { ru: String(parsed.ru || ''), en: String(parsed.en || ''), ka: String(parsed.ka || '') };
}

function writeI18n(v: Record<Lang, string>): string {
    const clean = { ru: v.ru.trim(), en: v.en.trim(), ka: v.ka.trim() };
    if (!clean.en && !clean.ka) return clean.ru;
    return JSON.stringify(clean);
}

const kindLabel: Record<PromoKind, string> = { percent: 'Скидка %', fixed: 'Скидка ₾', free_delivery: 'Бесплатная доставка' };

function describe(p: PromoCode): string {
    if (p.kind === 'free_delivery') return 'Бесплатная доставка';
    if (p.kind === 'fixed') return `−${p.value} ₾`;
    return `−${p.value}%${p.max_discount ? ` (до ${p.max_discount} ₾)` : ''}`;
}

function status(p: PromoCode): { label: string; tone: 'on' | 'off' | 'wait' | 'done' } {
    const now = Date.now();
    if (!p.is_active) return { label: 'Выключен', tone: 'off' };
    if (p.starts_at && new Date(p.starts_at).getTime() > now) return { label: 'Запланирован', tone: 'wait' };
    if (p.ends_at && new Date(p.ends_at).getTime() < now) return { label: 'Истёк', tone: 'done' };
    if (p.max_activations && (p.activations || 0) >= p.max_activations) return { label: 'Исчерпан', tone: 'done' };
    return { label: 'Активен', tone: 'on' };
}

/* ================= Page ================= */

export function AdminPromotions() {
    const [tab, setTab] = useState<'promos' | 'codes'>('promos');
    return (
        <div className="admin-page ap">
            <header className="ap-head">
                <div>
                    <h1 className="ap-title">Акции и промокоды</h1>
                    <p className="ap-sub">Акции ресторанов видят только новые клиенты (без заказов). Промокоды вводятся при оформлении.</p>
                </div>
                <div className="ap-tabs" role="tablist">
                    <button type="button" role="tab" aria-selected={tab === 'promos'} className={`ap-tab${tab === 'promos' ? ' is-on' : ''}`} onClick={() => setTab('promos')}>Акции ресторанов</button>
                    <button type="button" role="tab" aria-selected={tab === 'codes'} className={`ap-tab${tab === 'codes' ? ' is-on' : ''}`} onClick={() => setTab('codes')}>Промокоды</button>
                </div>
            </header>
            {tab === 'promos' ? <RestaurantPromos /> : <PromoCodes />}
        </div>
    );
}

/* ---------- Restaurant promos (stored on the restaurant: has_promo + promo_text) ---------- */

function RestaurantPromos() {
    const [items, setItems] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [drafts, setDrafts] = useState<Record<string, { on: boolean; text: Record<Lang, string> }>>({});
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);

    const load = async () => {
        setLoading(true); setError('');
        try {
            const data = await adminApi.get<Restaurant[]>('/restaurants/');
            setItems(data);
            const d: typeof drafts = {};
            data.forEach((r) => { d[r.id] = { on: Boolean(r.has_promo), text: readI18n(r.promo_text || r.promo) }; });
            setDrafts(d);
        } catch (e: any) {
            setError(e?.message || 'Не удалось загрузить рестораны');
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const dirty = (r: Restaurant) => {
        const d = drafts[r.id]; if (!d) return false;
        return d.on !== Boolean(r.has_promo) || writeI18n(d.text) !== (r.promo_text || r.promo || '');
    };

    const save = async (r: Restaurant) => {
        const d = drafts[r.id]; if (!d) return;
        setSaving(r.id);
        try {
            const promo_text = writeI18n(d.text);
            const updated = await adminApi.put<Restaurant>(`/restaurants/${r.id}`, { ...r, has_promo: d.on, promo_text, promo: promo_text });
            setItems((list) => list.map((x) => (x.id === r.id ? { ...x, ...updated, has_promo: d.on, promo_text, promo: promo_text } : x)));
            setSaved(r.id); setTimeout(() => setSaved(null), 1800);
        } catch (e: any) {
            alert('Не удалось сохранить: ' + (e?.message || ''));
        } finally { setSaving(null); }
    };

    if (loading) return <div className="ap-empty">Загрузка…</div>;
    if (error) return <div className="ap-empty ap-empty--error">{error} <button className="admin-btn" onClick={load}>Повторить</button></div>;

    const active = items.filter((r) => drafts[r.id]?.on).length;

    return (
        <>
            <div className="ap-stats">
                <div className="ap-stat"><span>{active}</span>с акцией</div>
                <div className="ap-stat"><span>{items.length}</span>ресторанов</div>
            </div>
            <div className="ap-list">
                {items.map((r) => {
                    const d = drafts[r.id] || { on: false, text: { ru: '', en: '', ka: '' } };
                    const set = (patch: Partial<typeof d>) => setDrafts((all) => ({ ...all, [r.id]: { ...d, ...patch } }));
                    return (
                        <div key={r.id} className={`ap-card${d.on ? ' is-on' : ''}`}>
                            <div className="ap-card-head">
                                {r.img ? <img src={r.img} alt="" className="ap-thumb" /> : <div className="ap-thumb ap-thumb--empty">{pickI18nText(r.name, 'ru')[0]}</div>}
                                <div className="ap-card-name">
                                    <strong>{pickI18nText(r.name, 'ru')}</strong>
                                    <span>{d.on ? 'Акция показывается новым клиентам' : 'Акции нет'}</span>
                                </div>
                                <label className="ap-switch" title="Акция">
                                    <input type="checkbox" checked={d.on} onChange={(e) => set({ on: e.target.checked })} />
                                    <span />
                                </label>
                            </div>
                            {d.on && (
                                <div className="ap-langs">
                                    {LANGS.map((l) => (
                                        <label key={l.id} className="ap-field">
                                            <span className="ap-field-label">Текст акции · {l.label}</span>
                                            <input
                                                className="admin-input"
                                                value={d.text[l.id]}
                                                placeholder={l.id === 'ru' ? 'Например: −10% на первый заказ' : l.id === 'en' ? '−10% on your first order' : '−10% პირველ შეკვეთაზე'}
                                                onChange={(e) => set({ text: { ...d.text, [l.id]: e.target.value } })}
                                            />
                                        </label>
                                    ))}
                                </div>
                            )}
                            {dirty(r) && (
                                <div className="ap-card-foot">
                                    <button className="admin-btn" onClick={() => set({ on: Boolean(r.has_promo), text: readI18n(r.promo_text || r.promo) })}>Отменить</button>
                                    <button className="admin-btn admin-btn-primary" disabled={saving === r.id} onClick={() => save(r)}>{saving === r.id ? 'Сохранение…' : 'Сохранить'}</button>
                                </div>
                            )}
                            {saved === r.id && <div className="ap-saved">Сохранено</div>}
                        </div>
                    );
                })}
            </div>
        </>
    );
}

/* ---------- Promo codes (server endpoints: see docs/PROMO_CODES_API.md) ---------- */

function PromoCodes() {
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverMissing, setServerMissing] = useState(false);
    const [edit, setEdit] = useState<PromoCode | null>(null);
    const [query, setQuery] = useState('');

    const load = async () => {
        setLoading(true);
        adminApi.get<Restaurant[]>('/restaurants/').then(setRestaurants).catch(() => {});
        try {
            const data = await adminApi.get<PromoCode[]>(PROMO_ENDPOINT);
            setCodes(Array.isArray(data) ? data : []);
            setServerMissing(false);
        } catch (e: any) {
            // 404 / 405: the backend has no promo-code endpoints yet
            if (/404|405|not found/i.test(String(e?.message))) setServerMissing(true);
            else alert('Ошибка загрузки промокодов: ' + (e?.message || ''));
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const shown = useMemo(() => codes.filter((c) => c.code.toLowerCase().includes(query.trim().toLowerCase())), [codes, query]);

    const remove = async (c: PromoCode) => {
        if (!c.id || !confirm(`Удалить промокод ${c.code}?`)) return;
        try { await adminApi.delete(`${PROMO_ENDPOINT}/${c.id}`); setCodes((l) => l.filter((x) => x.id !== c.id)); }
        catch (e: any) { alert('Не удалось удалить: ' + (e?.message || '')); }
    };

    const toggle = async (c: PromoCode) => {
        if (!c.id) return;
        try {
            const next = { ...c, is_active: !c.is_active };
            await adminApi.put(`${PROMO_ENDPOINT}/${c.id}`, next);
            setCodes((l) => l.map((x) => (x.id === c.id ? next : x)));
        } catch (e: any) { alert('Не удалось изменить: ' + (e?.message || '')); }
    };

    return (
        <>
            {serverMissing && (
                <div className="ap-notice">
                    <strong>Сервер ещё не умеет хранить промокоды.</strong>
                    Интерфейс готов: как только на сервере появятся эндпоинты из <code>docs/PROMO_CODES_API.md</code>, список и формы заработают без изменений на сайте.
                </div>
            )}

            <div className="ap-toolbar">
                <input className="admin-input ap-search" placeholder="Поиск по коду" value={query} onChange={(e) => setQuery(e.target.value)} />
                <button className="admin-btn admin-btn-primary" onClick={() => setEdit({ ...EMPTY_CODE })}>Новый промокод</button>
            </div>

            {loading ? <div className="ap-empty">Загрузка…</div> : shown.length === 0 ? (
                <div className="ap-empty">{serverMissing ? 'Промокодов пока нет — создайте первый, когда сервер будет готов.' : 'Промокодов пока нет.'}</div>
            ) : (
                <div className="admin-table-premium">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Код</th><th>Скидка</th><th>Условия</th><th>Активации</th><th>Статус</th><th style={{ textAlign: 'right' }}>Действия</th></tr>
                        </thead>
                        <tbody>
                            {shown.map((c) => {
                                const st = status(c);
                                return (
                                    <tr key={c.id ?? c.code}>
                                        <td><span className="ap-code">{c.code}</span>{c.note && <div className="ap-muted">{c.note}</div>}</td>
                                        <td>{describe(c)}</td>
                                        <td className="ap-muted">
                                            {[c.min_order ? `от ${c.min_order} ₾` : '', c.new_customers_only ? 'новым клиентам' : '', c.restaurant_ids.length ? `${c.restaurant_ids.length} рест.` : 'все рестораны', c.ends_at ? `до ${new Date(c.ends_at).toLocaleDateString('ru-RU')}` : ''].filter(Boolean).join(' · ')}
                                        </td>
                                        <td>{c.activations || 0}{c.max_activations ? ` / ${c.max_activations}` : ' / ∞'}</td>
                                        <td><span className={`ap-badge ap-badge--${st.tone}`}>{st.label}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="ap-actions">
                                                <button className="admin-btn" onClick={() => toggle(c)}>{c.is_active ? 'Выключить' : 'Включить'}</button>
                                                <button className="admin-btn" onClick={() => setEdit({ ...c })}>Изменить</button>
                                                <button className="admin-btn admin-btn-danger" onClick={() => remove(c)}>Удалить</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {edit && (
                <PromoCodeEditor
                    value={edit}
                    restaurants={restaurants}
                    onClose={() => setEdit(null)}
                    onSaved={(saved) => {
                        setCodes((l) => (edit.id ? l.map((x) => (x.id === edit.id ? saved : x)) : [saved, ...l]));
                        setEdit(null);
                    }}
                />
            )}
        </>
    );
}

function PromoCodeEditor({ value, restaurants, onClose, onSaved }: { value: PromoCode; restaurants: Restaurant[]; onClose: () => void; onSaved: (p: PromoCode) => void }) {
    const [p, setP] = useState<PromoCode>(value);
    const [busy, setBusy] = useState(false);
    const set = <K extends keyof PromoCode>(k: K, v: PromoCode[K]) => setP((x) => ({ ...x, [k]: v }));
    const num = (v: string) => Math.max(0, Number(v.replace(',', '.')) || 0);

    const problems: string[] = [];
    if (!/^[A-Z0-9_-]{3,20}$/.test(p.code)) problems.push('Код: 3–20 символов, латиница, цифры, - и _');
    if (p.kind === 'percent' && (p.value < 1 || p.value > 100)) problems.push('Процент от 1 до 100');
    if (p.kind === 'fixed' && p.value <= 0) problems.push('Сумма скидки больше 0');
    if (p.starts_at && p.ends_at && p.starts_at > p.ends_at) problems.push('Дата окончания раньше начала');

    const save = async () => {
        if (problems.length) return;
        setBusy(true);
        try {
            const saved = p.id
                ? await adminApi.put<PromoCode>(`${PROMO_ENDPOINT}/${p.id}`, p)
                : await adminApi.post<PromoCode>(PROMO_ENDPOINT, p);
            onSaved({ ...p, ...(saved || {}) });
        } catch (e: any) {
            alert('Не удалось сохранить: ' + (e?.message || ''));
        } finally { setBusy(false); }
    };

    const toggleRest = (id: string) => set('restaurant_ids', p.restaurant_ids.includes(id) ? p.restaurant_ids.filter((x) => x !== id) : [...p.restaurant_ids, id]);

    return (
        <div className="admin-centered-modal-overlay" onClick={onClose}>
            <div className="admin-centered-modal ap-editor" onClick={(e) => e.stopPropagation()}>
                <h2 className="ap-editor-title">{p.id ? `Промокод ${value.code}` : 'Новый промокод'}</h2>

                <div className="ap-grid">
                    <label className="ap-field ap-col-2">
                        <span className="ap-field-label">Код</span>
                        <input className="admin-input ap-code-input" value={p.code} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="SUMMER10" />
                    </label>

                    <div className="ap-field ap-col-2">
                        <span className="ap-field-label">Тип скидки</span>
                        <div className="ap-seg">
                            {(Object.keys(kindLabel) as PromoKind[]).map((k) => (
                                <button key={k} type="button" className={`ap-seg-btn${p.kind === k ? ' is-on' : ''}`} onClick={() => set('kind', k)}>{kindLabel[k]}</button>
                            ))}
                        </div>
                    </div>

                    {p.kind !== 'free_delivery' && (
                        <label className="ap-field">
                            <span className="ap-field-label">{p.kind === 'percent' ? 'Процент' : 'Сумма, ₾'}</span>
                            <input className="admin-input" inputMode="decimal" value={p.value} onChange={(e) => set('value', num(e.target.value))} />
                        </label>
                    )}
                    {p.kind === 'percent' && (
                        <label className="ap-field">
                            <span className="ap-field-label">Максимум скидки, ₾ (0 — без лимита)</span>
                            <input className="admin-input" inputMode="decimal" value={p.max_discount} onChange={(e) => set('max_discount', num(e.target.value))} />
                        </label>
                    )}
                    <label className="ap-field">
                        <span className="ap-field-label">Минимальная сумма заказа, ₾</span>
                        <input className="admin-input" inputMode="decimal" value={p.min_order} onChange={(e) => set('min_order', num(e.target.value))} />
                    </label>
                    <label className="ap-field">
                        <span className="ap-field-label">Всего активаций (0 — без лимита)</span>
                        <input className="admin-input" inputMode="numeric" value={p.max_activations} onChange={(e) => set('max_activations', Math.round(num(e.target.value)))} />
                    </label>
                    <label className="ap-field">
                        <span className="ap-field-label">На одного клиента (0 — без лимита)</span>
                        <input className="admin-input" inputMode="numeric" value={p.per_user_limit} onChange={(e) => set('per_user_limit', Math.round(num(e.target.value)))} />
                    </label>
                    <label className="ap-field">
                        <span className="ap-field-label">Начало</span>
                        <input type="date" className="admin-input" value={p.starts_at?.slice(0, 10) || ''} onChange={(e) => set('starts_at', e.target.value || null)} />
                    </label>
                    <label className="ap-field">
                        <span className="ap-field-label">Окончание</span>
                        <input type="date" className="admin-input" value={p.ends_at?.slice(0, 10) || ''} onChange={(e) => set('ends_at', e.target.value || null)} />
                    </label>

                    <div className="ap-field ap-col-2">
                        <span className="ap-field-label">Рестораны (ничего не выбрано — действует везде)</span>
                        <div className="ap-chips">
                            {restaurants.map((r) => (
                                <button key={r.id} type="button" className={`ap-chip${p.restaurant_ids.includes(r.id) ? ' is-on' : ''}`} onClick={() => toggleRest(r.id)}>{pickI18nText(r.name, 'ru')}</button>
                            ))}
                        </div>
                    </div>

                    <label className="ap-check ap-col-2">
                        <input type="checkbox" checked={p.new_customers_only} onChange={(e) => set('new_customers_only', e.target.checked)} />
                        Только для новых клиентов (первый заказ)
                    </label>
                    <label className="ap-check ap-col-2">
                        <input type="checkbox" checked={p.is_active} onChange={(e) => set('is_active', e.target.checked)} />
                        Активен
                    </label>
                    <label className="ap-field ap-col-2">
                        <span className="ap-field-label">Заметка для себя</span>
                        <input className="admin-input" value={p.note || ''} onChange={(e) => set('note', e.target.value)} placeholder="Например: блогер @mestia_trip" />
                    </label>
                </div>

                {problems.length > 0 && <ul className="ap-problems">{problems.map((x) => <li key={x}>{x}</li>)}</ul>}

                <div className="ap-editor-foot">
                    <span className="ap-muted">Клиент увидит: <strong>{p.code || 'КОД'}</strong> — {describe(p)}{p.min_order ? `, от ${p.min_order} ₾` : ''}</span>
                    <div className="ap-actions">
                        <button className="admin-btn" onClick={onClose}>Отмена</button>
                        <button className="admin-btn admin-btn-primary" disabled={busy || problems.length > 0} onClick={save}>{busy ? 'Сохранение…' : 'Сохранить'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
