import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi, type AvailableOrder, type CourierStats, type Order } from '../../services/adminService';
import LiveTrackingMap from '../../components/Map/LiveTrackingMap';
import './AdminStyles.css';

const REFRESH_MS = 3000;

export function AdminCourier() {
    const [stats, setStats] = useState<CourierStats | null>(null);
    const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [/* loading */, setLoading] = useState(true);
    const [online, setOnline] = useState(false);
    const [gpsOk, setGpsOk] = useState(false);

    const [myPos, setMyPos] = useState<[number, number] | null>(null);
    const [tab, setTab] = useState<'active' | 'available' | 'history'>('available');
    const [/* busy */, setBusy] = useState<number | null>(null);

    const watchRef = useRef<number | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [s, av, my] = await Promise.all([
                adminApi.get<CourierStats>('/courier/stats').catch(() => null),
                adminApi.get<AvailableOrder[]>('/courier/available-orders').catch(() => []),
                adminApi.get<Order[]>('/courier/my-orders').catch(() => [])
            ]);
            if (s) { setStats(s); setOnline(s.is_online); }
            setAvailableOrders(av);
            setMyOrders(my);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const t = setInterval(loadData, REFRESH_MS);
        return () => clearInterval(t);
    }, [loadData]);

    const sendGPS = useCallback(async (lat: number, lng: number, h?: number | null, s?: number | null) => {
        setMyPos([lat, lng]);
        try {
            await adminApi.post('/courier/location', { latitude: lat, longitude: lng, heading: h || 0, speed: s || 0 });
            setGpsOk(true);
        } catch { setGpsOk(false); }
    }, []);

    const startGPS = useCallback(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            p => sendGPS(p.coords.latitude, p.coords.longitude, p.coords.heading, p.coords.speed),
            () => setGpsOk(false), { enableHighAccuracy: true }
        );
        watchRef.current = navigator.geolocation.watchPosition(
            p => sendGPS(p.coords.latitude, p.coords.longitude, p.coords.heading, p.coords.speed),
            () => setGpsOk(false),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
    }, [sendGPS]);

    useEffect(() => {
        if (online) startGPS();
        else {
            if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
            setGpsOk(false);
        }
    }, [online, startGPS]);

    const toggleStatus = async () => {
        try {
            const newState = !online;
            await adminApi.post('/courier/status', { is_online: newState });
            setOnline(newState);
            // Optimistic stat update
            if (stats) setStats({ ...stats, is_online: newState });
        } catch { alert('Ошибка связи'); }
    };

    const takeOrder = async (id: number) => {
        if (!confirm('Взять заказ в работу?')) return;
        setBusy(id);
        try {
            await adminApi.post(`/courier/take-order/${id}`, {});
            setTab('active');
            await loadData();
        } catch (e: any) { alert(e.message || 'Ошибка'); }
        setBusy(null);
    };

    const completeOrder = async (id: number) => {
        if (!confirm('Подтверждаете доставку?')) return;
        setBusy(id);
        try {
            await adminApi.post(`/courier/complete-delivery/${id}`, {});
            await loadData();
        } catch (e: any) { alert(e.message || 'Ошибка'); }
        setBusy(null);
    };

    const activeOrder = myOrders.find(o => ['delivering', 'ready', 'preparing', 'picked_up'].includes(o.status));

    // Determine current view
    // If there is an active order, show map interaction automatically? Or keep tab?
    // Let's force map if tab is active and order exists
    const showActiveMap = activeOrder && tab === 'active';

    if (showActiveMap && activeOrder) {
        const customerPos: [number, number] = activeOrder.delivery_lat && activeOrder.delivery_lng
            ? [activeOrder.delivery_lat, activeOrder.delivery_lng]
            : [41.7151, 44.8271];
        const courierPos = myPos || [41.7151, 44.8271];

        return (
            <div className="courier-active-screen">
                <div className="courier-map-full">
                    <LiveTrackingMap
                        courierLocation={{ latitude: courierPos[0], longitude: courierPos[1] }}
                        orderLocation={{ latitude: customerPos[0], longitude: customerPos[1] }}
                        className="live-map-v3-full"
                    />
                    <div className="map-overlay-back">
                        <button className="icon-btn-glass" onClick={() => setTab('available')}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                <div className="courier-bottom-sheet">
                    <div className="sheet-handle-bar"><div className="sheet-handle" /></div>

                    <div className="sheet-header">
                        <div className="sheet-order-info">
                            <h2 className="order-id">Заказ #{activeOrder.id}</h2>
                            <p className="order-status-text">
                                {activeOrder.status === 'preparing' && 'Готовится в ресторане'}
                                {activeOrder.status === 'ready' && 'Готов к выдаче'}
                                {activeOrder.status === 'delivering' && 'В пути к клиенту'}
                            </p>
                        </div>
                        <div className="sheet-price-badge">{activeOrder.total} ₾</div>
                    </div>

                    <div className="sheet-address-box">
                        <div className="address-icon">📍</div>
                        <div className="address-text">
                            <span className="address-label">Куда доставить</span>
                            <span className="address-val">{activeOrder.address}</span>
                        </div>
                    </div>

                    <div className="sheet-customer-box">
                        <div className="customer-avatar">👤</div>
                        <div className="customer-info">
                            <span className="c-name">{activeOrder.customer_name}</span>
                            <span className="c-phone">{activeOrder.phone}</span>
                        </div>
                        <a href={`tel:${activeOrder.phone}`} className="call-btn">
                            📞
                        </a>
                    </div>

                    <div className="sheet-actions">
                        <button
                            className="sheet-btn secondary"
                            onClick={() => window.open(`yandexnavi://build_route_on_map?lat_to=${customerPos[0]}&lon_to=${customerPos[1]}`, '_blank')}
                        >
                            🚀 Навигатор
                        </button>
                        <button className="sheet-btn primary" onClick={() => completeOrder(activeOrder.id)}>
                            ✅ Заказ вручен
                        </button>
                    </div>
                </div>
                <GlobalStyles />
            </div>
        );
    }

    return (
        <div className="courier-list-screen">
            {/* Header */}
            <header className="c-header">
                <div>
                    <h1 className="c-title">Курьер</h1>
                    <div className="c-subtitle">Панель управления</div>
                </div>
                <button className={`status-toggle ${online ? 'on' : 'off'}`} onClick={toggleStatus}>
                    <div className="toggle-indicator" />
                    <span>{online ? 'В сети' : 'Оффлайн'}</span>
                </button>
            </header>

            {/* Stats */}
            <div className="c-stats-row">
                <div className="c-stat-card">
                    <span className="stat-label">Заработано</span>
                    <span className="stat-value money">{stats?.total_tips_earned || 0} ₾</span>
                </div>
                <div className="c-stat-card">
                    <span className="stat-label">Доставок</span>
                    <span className="stat-value">{stats?.total_deliveries || 0}</span>
                </div>
                <div className="c-stat-card">
                    <span className="stat-label">GPS</span>
                    <span className={`stat-value ${gpsOk ? 'ok' : 'err'}`}>{gpsOk ? 'OK' : 'X'}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="c-tabs">
                <button
                    className={`c-tab ${tab === 'available' ? 'active' : ''}`}
                    onClick={() => setTab('available')}
                >
                    Новые
                    {availableOrders.length > 0 && <span className="tab-badge">{availableOrders.length}</span>}
                </button>
                <button
                    className={`c-tab ${tab === 'active' ? 'active' : ''}`}
                    onClick={() => setTab('active')}
                >
                    В работе
                    {activeOrder && <span className="tab-badge dot"></span>}
                </button>
                <button
                    className={`c-tab ${tab === 'history' ? 'active' : ''}`}
                    onClick={() => setTab('history')}
                >
                    История
                </button>
            </div>

            {/* Content List */}
            <div className="c-content">
                {/* AVAILABLE ORDERS */}
                {tab === 'available' && (
                    <div className="orders-grid">
                        {availableOrders.length === 0 && (
                            <div className="empty-state">
                                <span className="empty-icon">💤</span>
                                <h3>Нет заказов поблизости</h3>
                                <p>Ожидайте поступления новых заказов</p>
                            </div>
                        )}
                        {availableOrders.map(o => (
                            <div key={o.id} className="order-card">
                                <div className="card-header">
                                    <div className="rest-info">
                                        <div className="rest-icon">🍔</div>
                                        <span className="rest-name">{o.restaurant_name}</span>
                                    </div>
                                    <span className="dist-badge">~{o.distance_km} км</span>
                                </div>
                                <div className="card-body">
                                    <div className="loc-row">
                                        <div className="line-indicator" />
                                        <div className="loc-points">
                                            <div className="point restaurant">
                                                <span>{o.restaurant_name}</span>
                                                <div className="addr-sub">{o.restaurant_address || 'Адрес ресторана'}</div>
                                            </div>
                                            <div className="point client">
                                                <span>{o.address}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="price-row">
                                        <span>Доход:</span>
                                        <span className="income-val">{(o.total * 0.15).toFixed(2)} ₾</span>
                                    </div>
                                </div>
                                <button className="take-btn" onClick={() => takeOrder(o.id)}>
                                    Принять заказ
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ACTIVE TAB (List View if map closed or none) */}
                {tab === 'active' && (
                    <div className="orders-grid">
                        {!activeOrder && (
                            <div className="empty-state">
                                <span className="empty-icon">📦</span>
                                <h3>Нет активных заказов</h3>
                                <p>Перейдите во вкладку "Новые" чтобы взять заказ</p>
                            </div>
                        )}
                        {activeOrder && !showActiveMap && (
                            // Should normally jump to map, but if we are here:
                            <div className="order-card active-mode">
                                <div className="card-header">
                                    <span className="rest-name">Заказ #{activeOrder.id}</span>
                                    <span className="status-badge-inline">{activeOrder.status}</span>
                                </div>
                                <button className="take-btn" onClick={() => { /* force re-render to map */ }}>
                                    Открыть карту
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* HISTORY */}
                {tab === 'history' && (
                    <div className="orders-grid">
                        {myOrders.filter(o => o.status === 'delivered').length === 0 && (
                            <div className="empty-state">
                                <span className="empty-icon">📜</span>
                                <h3>История пуста</h3>
                            </div>
                        )}
                        {myOrders.filter(o => o.status === 'delivered').map(o => (
                            <div key={o.id} className="history-card">
                                <div className="h-top">
                                    <span className="h-id">#{o.id}</span>
                                    <span className="h-date">{new Date(o.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="h-body">
                                    <div className="h-address">{o.address}</div>
                                    <div className="h-price">{o.total} ₾</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <GlobalStyles />
        </div>
    );
}

const GlobalStyles = () => (
    <style>{`
        /* --- YANDEX-STYLE COURIER SCREEN --- */
        .courier-list-screen {
            padding: 24px;
            max-width: 600px;
            margin: 0 auto;
            color: #000;
            min-height: 100vh;
            font-family: 'Montserrat', sans-serif;
            padding-bottom: 80px; 
            background: #F5F6F8;
        }
        
        @media (max-width: 768px) {
            .courier-list-screen {
                padding: 16px;
                padding-bottom: 90px;
            }
        }

        /* Header */
        .c-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 30px;
        }
        .c-title { font-size: 32px; font-weight: 800; margin: 0; line-height: 1; letter-spacing: -1px; }
        .c-subtitle { color: #7A7A7A; font-size: 15px; margin-top: 6px; font-weight: 500; }

        .status-toggle {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 18px;
            border-radius: 20px;
            border: none;
            background: #FFF;
            color: #000;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
        }
        .status-toggle:active { transform: scale(0.96); }
        .status-toggle.on { background: #FFF; color: #000; border: 2px solid #FCE000; }
        .status-toggle.off { background: #FFF; color: #000; border: 2px solid transparent; }
        .toggle-indicator { width: 10px; height: 10px; border-radius: 50%; }
        .status-toggle.on .toggle-indicator { background: #FCE000; box-shadow: 0 0 8px rgba(252, 224, 0, 0.6); }
        .status-toggle.off .toggle-indicator { background: #FF3B30; }

        /* Stats */
        .c-stats-row {
            display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;
            margin-bottom: 32px;
        }
        .c-stat-card {
            background: #FFF;
            border-radius: 20px;
            padding: 16px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7A7A7A; letter-spacing: 0.5px; margin-bottom: 6px; }
        .stat-value { font-size: 20px; font-weight: 800; color: #000; }
        .stat-value.money { color: #000; }
        .stat-value.ok { color: #15803d; }
        .stat-value.err { color: #FF3B30; }

        /* Tabs */
        .c-tabs {
            display: flex; gap: 8px; margin-bottom: 24px;
            background: #E8E9ED;
            padding: 6px; border-radius: 16px;
        }
        .c-tab {
            flex: 1;
            background: transparent; border: none;
            color: #7A7A7A;
            padding: 12px 0;
            border-radius: 12px;
            font-family: inherit; font-size: 14px; font-weight: 700;
            cursor: pointer; position: relative;
            transition: all 0.2s;
        }
        .c-tab.active {
            background: #FFF;
            color: #000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .tab-badge {
            background: #FF3B30; color: #FFF;
            font-size: 11px; padding: 2px 6px; border-radius: 10px;
            margin-left: 6px; vertical-align: middle;
        }
        .tab-badge.dot { padding: 4px; border-radius: 50%; width: 8px; height: 8px; color: transparent; }

        /* Orders Grid */
        .orders-grid { display: flex; flex-direction: column; gap: 16px; }
        
        .empty-state {
            text-align: center; padding: 60px 20px;
            color: #7A7A7A;
            background: #FFF;
            border-radius: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .empty-icon { font-size: 48px; display: block; margin-bottom: 16px; opacity: 1; }

        /* Order Card */
        .order-card {
            background: #FFF;
            border-radius: 24px;
            padding: 24px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 6px 20px rgba(0,0,0,0.04);
            transition: transform 0.2s;
        }
        .order-card:active { transform: scale(0.98); }
        
        .card-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 20px;
        }
        .rest-info { display: flex; align-items: center; gap: 12px; }
        .rest-icon { width: 44px; height: 44px; background: #F5F6F8; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .rest-name { font-weight: 800; font-size: 18px; color: #000; }
        
        .dist-badge {
            background: #F5F6F8; padding: 6px 10px; border-radius: 10px; font-size: 13px; color: #000; font-weight: 700;
        }

        .card-body { position: relative; margin-bottom: 24px; padding-left: 14px; }
        .loc-row { display: flex; gap: 16px; margin-bottom: 20px; position: relative; }
        .line-indicator {
            position: absolute; left: 5px; top: 12px; bottom: 12px; width: 2px;
            background: #E8E9ED;
        }
        .loc-points { display: flex; flex-direction: column; gap: 20px; width: 100%; }
        .point { font-size: 16px; color: #000; font-weight: 700; padding-left: 20px; position: relative; }
        .point::before { content: ''; position: absolute; left: -1px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: #FCE000; border: 3px solid #FFF; z-index: 1; box-shadow: 0 0 0 1px #E8E9ED; }
        .point.client::before { background: #000; }
        .addr-sub { font-size: 13px; color: #7A7A7A; margin-top: 4px; font-weight: 500; }

        .price-row {
            display: flex; justify-content: space-between; align-items: center;
            background: #F8F9FB; padding: 16px; border-radius: 16px;
        }
        .price-row span { color: #7A7A7A; font-weight: 600; }
        .income-val { color: #000 !important; font-weight: 800; font-size: 20px; }

        .take-btn {
            width: 100%; padding: 18px;
            background: #FCE000; color: #000;
            border: none; border-radius: 16px;
            font-weight: 800; font-size: 16px; text-transform: uppercase;
            letter-spacing: 0.5px; cursor: pointer;
            transition: all 0.2s;
        }
        .take-btn:active { transform: scale(0.96); }

        /* History Card */
        .history-card {
            background : #FFF;
            border-radius: 20px; padding: 20px;
            display: flex; flex-direction: column; gap: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .h-top { display: flex; justify-content: space-between; color: #7A7A7A; font-size: 13px; font-weight: 600; }
        .h-body { display: flex; justify-content: space-between; align-items: center; }
        .h-address { font-weight: 700; font-size: 16px; max-width: 70%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000; }
        .h-price { color: #000; font-weight: 800; font-size: 16px; }

        /* --- ACTIVE MAP VIEW --- */
        .courier-active-screen {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #E8E9ED; z-index: 5000;
            display: flex; flex-direction: column;
        }
        .courier-map-full { flex: 1; position: relative; }
        .live-map-v3-full { width: 100%; height: 100%; }
        
        .map-overlay-back {
            position: absolute; top: 20px; left: 20px; z-index: 10;
        }
        .icon-btn-glass {
            width: 48px; height: 48px; border-radius: 16px;
            background: #FFF; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border: none;
            color: #000; display: flex; align-items: center; justify-content: center;
            cursor: pointer;
        }

        .courier-bottom-sheet {
            background: #FFF;
            border-radius: 32px 32px 0 0;
            padding: 12px 24px 32px 24px;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
            animation: slideUp 0.3s ease-out;
            max-height: 55vh; overflow-y: auto;
        }
        .sheet-handle-bar { display: flex; justify-content: center; padding: 8px 0 24px 0; }
        .sheet-handle { width: 48px; height: 6px; background: #E8E9ED; border-radius: 3px; }

        .sheet-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 24px;
        }
        .order-id { font-size: 26px; margin: 0; color: #000; font-weight: 800; letter-spacing: -0.5px; }
        .order-status-text { color: #7A7A7A; margin: 6px 0 0 0; font-size: 15px; font-weight: 600; }
        .sheet-price-badge {
            background: #FCE000; color: #000; font-weight: 800;
            padding: 8px 16px; border-radius: 14px; font-size: 18px;
        }

        .sheet-address-box, .sheet-customer-box {
            display: flex; align-items: center; gap: 16px;
            background: #F5F6F8; padding: 20px;
            border-radius: 20px; margin-bottom: 12px;
        }
        .address-icon, .customer-avatar {
            font-size: 24px;
        }
        .address-text, .customer-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .address-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #7A7A7A; }
        .address-val { font-size: 16px; font-weight: 700; color: #000; }
        .c-name { font-weight: 800; color: #000; font-size: 16px; }
        .c-phone { font-size: 14px; color: #7A7A7A; font-weight: 500; }

        .call-btn {
            width: 48px; height: 48px; border-radius: 16px; background: #E8E9ED;
            display: flex; align-items: center; justify-content: center; font-size: 20px;
            text-decoration: none; color: #000;
        }

        .sheet-actions {
            display: flex; gap: 12px; margin-top: 24px;
        }
        .sheet-btn {
            flex: 1; padding: 18px; border: none; border-radius: 16px;
            font-weight: 800; font-size: 16px; cursor: pointer;
            transition: transform 0.15s;
        }
        .sheet-btn.primary { background: #FCE000; color: #000; }
        .sheet-btn.secondary { background: #E8E9ED; color: #000; }
        .sheet-btn:active { transform: scale(0.96); }

        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `}</style>
);
