import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { adminApi } from '../../services/adminService';
import { MESTIA_CENTER } from '../../types/delivery';
import { MAP_TILE_OPTIONS, MAP_TILE_URL } from '../../lib/delivery/mapTiles';
import { pickI18nText } from '../../utils/i18nContent';
import { ANALYTICS_API, type AOrder, type ARestaurant, minutesBetween } from './analytics';
import './AdminPromotions.css';
import './AdminCrm.css';
import './AdminDispatch.css';

/** Live courier position, GET /api/admin/couriers/live (docs/ADMIN_ANALYTICS_API.md). */
interface LiveCourier { id: number; name: string; lat: number; lng: number; updated_at?: string; active_orders?: number; is_online?: boolean }

const POLL_MS = 15000;
const SLA_WARN = 20;
const SLA_LATE = 30;

const STAGES: { id: string; label: string; statuses: string[] }[] = [
    { id: 'new', label: 'Новые', statuses: ['pending_payment', 'pending'] },
    { id: 'kitchen', label: 'Готовятся', statuses: ['confirmed', 'preparing'] },
    { id: 'ready', label: 'Ждут курьера', statuses: ['ready'] },
    { id: 'road', label: 'В пути', statuses: ['delivering'] },
];
const STAGE_COLOR: Record<string, string> = { new: '#FFD60A', kitchen: '#a855f7', ready: '#00ccff', road: '#ff8800' };
const stageOf = (s: string) => STAGES.find((x) => x.statuses.includes(s))?.id || 'new';


const pin = (color: string, label: string, late = false) => L.divIcon({
    className: 'dp-pin',
    html: `<div class="dp-pin-dot${late ? ' is-late' : ''}" style="--c:${color}">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});
const restaurantPin = L.divIcon({
    className: 'dp-pin',
    html: `<div class="dp-pin-rest"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});
const courierPin = (name: string) => L.divIcon({
    className: 'dp-pin',
    html: `<div class="dp-pin-courier"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0c1c11" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg><span>${name.replace(/[<>&"]/g, '')}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

function beep() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        [0, 0.18].forEach((t) => {
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'sine'; o.frequency.value = 880;
            g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
            g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.15);
            o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.16);
        });
        setTimeout(() => ctx.close(), 600);
    } catch { /* audio blocked until the first click */ }
}

function FlyTo({ target }: { target: [number, number] | null }) {
    const map = useMap();
    useEffect(() => { if (target) map.flyTo(target, 16, { duration: 0.6 }); }, [map, target]);
    return null;
}

const elapsed = (o: AOrder, now: number) => Math.max(0, Math.floor((now - new Date(o.created_at).getTime()) / 60000));
const tone = (m: number) => (m >= SLA_LATE ? 'late' : m >= SLA_WARN ? 'warn' : 'ok');

export function AdminDispatch() {
    const [orders, setOrders] = useState<AOrder[]>([]);
    const [restaurants, setRestaurants] = useState<ARestaurant[]>([]);
    const [couriers, setCouriers] = useState<LiveCourier[] | null>(null);
    const [now, setNow] = useState(Date.now());
    const [updated, setUpdated] = useState<number | null>(null);
    const [sound, setSound] = useState(() => { try { return localStorage.getItem('mesti_dispatch_sound') !== '0'; } catch { return true; } });
    const [rush, setRush] = useState<{ on: boolean; available: boolean }>({ on: false, available: true });
    const [focus, setFocus] = useState<number | null>(null);
    const [fresh, setFresh] = useState<Set<number>>(new Set());
    const seen = useRef<Set<number> | null>(null);

    const load = async () => {
        const [o, c] = await Promise.all([
            adminApi.get<AOrder[]>('/orders?limit=500', true).catch(() => null),
            adminApi.get<LiveCourier[]>(ANALYTICS_API.couriersLive, true).catch(() => null),
        ]);
        if (Array.isArray(o)) {
            const active = o.filter((x) => !['delivered', 'cancelled'].includes(x.status));
            if (seen.current) {
                const added = active.filter((x) => !seen.current!.has(x.id)).map((x) => x.id);
                if (added.length) {
                    setFresh(new Set(added));
                    setTimeout(() => setFresh(new Set()), 8000);
                    if (sound) beep();
                }
            }
            seen.current = new Set(active.map((x) => x.id));
            setOrders(o);
        }
        setCouriers(Array.isArray(c) ? c : null);
        setUpdated(Date.now());
    };

    useEffect(() => {
        load();
        adminApi.get<ARestaurant[]>('/restaurants/').then((r) => setRestaurants(Array.isArray(r) ? r : [])).catch(() => {});
        fetch('/api/bot/v1/rush-status').then((r) => r.json()).then((d) => setRush((x) => ({ ...x, on: Boolean(d?.is_rush) }))).catch(() => {});
        const poll = setInterval(load, POLL_MS);
        const tick = setInterval(() => setNow(Date.now()), 1000);
        return () => { clearInterval(poll); clearInterval(tick); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { try { localStorage.setItem('mesti_dispatch_sound', sound ? '1' : '0'); } catch { /* ignore */ } }, [sound]);

    const active = useMemo(() => orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [orders]);
    const today = useMemo(() => {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        return orders.filter((o) => new Date(o.created_at).getTime() >= start.getTime());
    }, [orders]);
    const deliveredToday = today.filter((o) => o.status === 'delivered');
    const late = active.filter((o) => elapsed(o, now) >= SLA_LATE);
    const restName = (id: string) => pickI18nText(restaurants.find((r) => r.id === id)?.name || '', 'ru') || 'Ресторан';
    const avgToday = (() => {
        const v = deliveredToday.map((o) => minutesBetween(o.created_at, o.delivered_at)).filter((x): x is number => x != null);
        return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null;
    })();

    const toggleRush = async () => {
        const next = !rush.on;
        try {
            await adminApi.post(ANALYTICS_API.rush, { is_rush: next });
            setRush({ on: next, available: true });
        } catch {
            setRush((x) => ({ ...x, available: false }));
            alert('Сервер пока не умеет переключать час пик из админки (docs/ADMIN_ANALYTICS_API.md).');
        }
    };

    const focusOrder = (o: AOrder) => { setFocus(o.id); };
    const focusPoint: [number, number] | null = (() => {
        const o = active.find((x) => x.id === focus);
        return o?.delivery_lat && o?.delivery_lng ? [o.delivery_lat, o.delivery_lng] : null;
    })();

    return (
        <div className="admin-page ap dp">
            <header className="ap-head dp-head">
                <div>
                    <h1 className="ap-title">Диспетчерская</h1>
                    <p className="ap-sub">
                        <span className="dp-live" /> Обновляется каждые 15 секунд{updated ? ` · ${Math.max(0, Math.round((now - updated) / 1000))} с назад` : ''}
                    </p>
                </div>
                <div className="crm-head-actions">
                    <button type="button" className={`dp-toggle${sound ? ' is-on' : ''}`} onClick={() => { setSound(!sound); if (!sound) beep(); }}>
                        <span className="dp-toggle-knob" /> Звук новых заказов
                    </button>
                    <button type="button" className={`dp-toggle dp-toggle--rush${rush.on ? ' is-on' : ''}`} onClick={toggleRush} title="Клиенты увидят «час пик» и увеличенное время доставки">
                        <span className="dp-toggle-knob" /> Час пик
                    </button>
                    <button className="admin-btn" onClick={load}>Обновить</button>
                </div>
            </header>

            <div className="crm-kpis dp-kpis">
                <div className="crm-kpi"><span className="crm-kpi-value">{active.length}</span><span className="crm-kpi-label">активных заказов</span></div>
                <div className={`crm-kpi${late.length ? ' is-danger dp-kpi-alarm' : ''}`}><span className="crm-kpi-value">{late.length}</span><span className="crm-kpi-label">дольше {SLA_LATE} минут</span></div>
                <div className="crm-kpi"><span className="crm-kpi-value">{couriers ? couriers.filter((c) => c.is_online !== false).length : '—'}</span><span className="crm-kpi-label">курьеров на линии</span></div>
                <div className="crm-kpi is-accent"><span className="crm-kpi-value">{deliveredToday.length}</span><span className="crm-kpi-label">доставлено сегодня</span></div>
                <div className="crm-kpi"><span className="crm-kpi-value">{avgToday != null ? `${avgToday} мин` : '—'}</span><span className="crm-kpi-label">среднее время сегодня</span></div>
            </div>

            <div className="dp-body">
                <div className="dp-map">
                    <MapContainer center={MESTIA_CENTER} zoom={14} zoomControl={false} attributionControl={false} className="dp-leaflet">
                        {/* Same tiles as the client map, darkened with a CSS filter to match the admin */}
                        <TileLayer url={MAP_TILE_URL} {...MAP_TILE_OPTIONS} />
                        {restaurants.filter((r) => r.latitude && r.longitude).map((r) => (
                            <Marker key={r.id} position={[r.latitude!, r.longitude!]} icon={restaurantPin}>
                                <Tooltip direction="top" offset={[0, -12]}>{pickI18nText(r.name, 'ru')}</Tooltip>
                            </Marker>
                        ))}
                        {active.filter((o) => o.delivery_lat && o.delivery_lng).map((o) => {
                            const m = elapsed(o, now);
                            return (
                                <Marker key={o.id} position={[o.delivery_lat!, o.delivery_lng!]} icon={pin(STAGE_COLOR[stageOf(o.status)], String(m), m >= SLA_LATE)} eventHandlers={{ click: () => setFocus(o.id) }}>
                                    <Tooltip direction="top" offset={[0, -14]}>#{o.id} · {restName(o.restaurant_id)} · {m} мин</Tooltip>
                                </Marker>
                            );
                        })}
                        {(couriers || []).map((c) => (
                            <Marker key={`c${c.id}`} position={[c.lat, c.lng]} icon={courierPin(c.name)} />
                        ))}
                        <FlyTo target={focusPoint} />
                    </MapContainer>
                    <div className="dp-legend">
                        {STAGES.map((s) => <span key={s.id}><i style={{ background: STAGE_COLOR[s.id] }} />{s.label}</span>)}
                        <span><i className="dp-legend-courier" />Курьер</span>
                    </div>
                    {couriers === null && <div className="dp-map-note">Курьеры появятся на карте, когда сервер начнёт отдавать их координаты.</div>}
                </div>

                <aside className="dp-board">
                    {STAGES.map((stage) => {
                        const list = active.filter((o) => stage.statuses.includes(o.status));
                        return (
                            <section key={stage.id} className="dp-col">
                                <h3 className="dp-col-title"><i style={{ background: STAGE_COLOR[stage.id] }} />{stage.label}<span>{list.length}</span></h3>
                                {list.length === 0 ? <p className="dp-empty">—</p> : list.map((o) => {
                                    const m = elapsed(o, now);
                                    return (
                                        <button key={o.id} type="button" className={`dp-card is-${tone(m)}${fresh.has(o.id) ? ' is-fresh' : ''}${focus === o.id ? ' is-focus' : ''}`} onClick={() => focusOrder(o)}>
                                            <span className="dp-card-top">
                                                <b>#{o.id}</b>
                                                <span className={`dp-timer is-${tone(m)}`}>{m} мин</span>
                                            </span>
                                            <span className="dp-card-rest">{restName(o.restaurant_id)}</span>
                                            <span className="dp-card-meta">{[o.address, o.courier_name ? `курьер ${o.courier_name}` : ''].filter(Boolean).join(' · ') || '—'}</span>
                                            <span className="dp-card-sum">{Number(o.total || 0).toFixed(0)} ₾</span>
                                        </button>
                                    );
                                })}
                            </section>
                        );
                    })}
                </aside>
            </div>
        </div>
    );
}
