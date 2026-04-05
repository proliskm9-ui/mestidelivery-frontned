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
        const customerPos: [number, number] = [41.7151, 44.8271]; // TODO: Parse activeOrder.address_coords
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
        /* --- COURIER PAGE STYLES --- */
        .courier-list-screen {
            padding: 24px;
            max-width: 600px;
            margin: 0 auto;
            color: #fff;
            min-height: 100vh;
            font-family: 'Montserrat', sans-serif;
            padding-bottom: 80px; 
            background: transparent; /* Parent admin-layout handles bg */
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
            margin-bottom: 24px;
        }
        .c-title { font-size: 28px; font-weight: 800; margin: 0; line-height: 1; text-transform: uppercase; }
        .c-subtitle { color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 4px; }

        .status-toggle {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .status-toggle.on { background: rgba(33, 234, 124, 0.15); border-color: rgba(33, 234, 124, 0.5); color: #21EA7C; }
        .status-toggle.off { background: rgba(255, 59, 48, 0.15); border-color: rgba(255, 59, 48, 0.5); color: #FF3B30; }
        .toggle-indicator { width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; }

        /* Stats */
        .c-stats-row {
            display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;
            margin-bottom: 32px;
        }
        .c-stat-card {
            background: rgba(20, 20, 20, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 12px;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            text-align: center;
        }
        .stat-label { font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.5); letter-spacing: 0.5px; margin-bottom: 4px; }
        .stat-value { font-size: 18px; font-weight: 700; color: #fff; }
        .stat-value.money { color: #21EA7C; text-shadow: 0 0 10px rgba(33, 234, 124, 0.3); }
        .stat-value.ok { color: #21EA7C; }
        .stat-value.err { color: #FF3B30; }

        /* Tabs */
        .c-tabs {
            display: flex; gap: 8px; margin-bottom: 20px;
            background: rgba(255,255,255,0.05);
            padding: 4px; border-radius: 14px;
        }
        .c-tab {
            flex: 1;
            background: transparent; border: none;
            color: rgba(255,255,255,0.6);
            padding: 10px 0;
            border-radius: 10px;
            font-family: inherit; font-size: 14px; font-weight: 600;
            cursor: pointer; position: relative;
            transition: all 0.2s;
        }
        .c-tab.active {
            background: #21EA7C;
            color: #000;
            box-shadow: 0 2px 10px rgba(33, 234, 124, 0.3);
        }
        .tab-badge {
            background: #fff; color: #000;
            font-size: 10px; padding: 1px 5px; border-radius: 10px;
            margin-left: 6px; vertical-align: middle;
        }
        .tab-badge.dot { padding: 4px; border-radius: 50%; width: 8px; height: 8px; background: #FF3B30; color: transparent; }

        /* Orders Grid */
        .orders-grid { display: flex; flex-direction: column; gap: 16px; }
        
        .empty-state {
            text-align: center; padding: 40px 20px;
            color: rgba(255,255,255,0.3);
            border: 2px dashed rgba(255,255,255,0.1);
            border-radius: 20px;
        }
        .empty-icon { font-size: 48px; display: block; margin-bottom: 16px; opacity: 0.5; }

        /* Order Card */
        .order-card {
            background: #111;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 20px;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s;
        }
        .order-card:active { transform: scale(0.98); }
        
        .card-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 16px;
        }
        .rest-info { display: flex; align-items: center; gap: 10px; }
        .rest-icon { width: 36px; height: 36px; background: rgba(33, 234, 124, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #21EA7C; }
        .rest-name { font-weight: 700; font-size: 16px; }
        
        .dist-badge {
            background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 8px; font-size: 12px; color: #aaa;
        }

        .card-body { position: relative; margin-bottom: 20px; padding-left: 12px; }
        .loc-row { display: flex; gap: 16px; margin-bottom: 16px; position: relative; }
        .line-indicator {
            position: absolute; left: 5px; top: 8px; bottom: 8px; width: 2px;
            background: linear-gradient(to bottom, #21EA7C 0%, #aaa 100%);
        }
        .loc-points { display: flex; flex-direction: column; gap: 16px; width: 100%; }
        .point { font-size: 14px; color: #ddd; padding-left: 20px; position: relative; }
        .point::before { content: ''; position: absolute; left: 0; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: #111; border: 2px solid #21EA7C; z-index: 1; }
        .point.client::before { border-color: #fff; }
        .addr-sub { font-size: 11px; color: #666; margin-top: 2px; }

        .price-row {
            display: flex; justify-content: space-between; align-items: center;
            background: rgba(33, 234, 124, 0.05); padding: 12px; border-radius: 12px;
        }
        .income-val { color: #21EA7C; font-weight: 800; font-size: 16px; }

        .take-btn {
            width: 100%; padding: 16px;
            background: #21EA7C; color: #000;
            border: none; border-radius: 14px;
            font-weight: 700; font-size: 16px; text-transform: uppercase;
            letter-spacing: 1px; cursor: pointer;
            box-shadow: 0 4px 20px rgba(33, 234, 124, 0.3);
            transition: all 0.2s;
        }
        .take-btn:active { transform: scale(0.95); opacity: 0.9; }

        /* History Card */
        .history-card {
            background : rgba(255,255,255,0.03);
            border-radius: 16px; padding: 16px;
            display: flex; flex-direction: column; gap: 8px;
        }
        .h-top { display: flex; justify-content: space-between; opacity: 0.5; font-size: 12px; }
        .h-body { display: flex; justify-content: space-between; align-items: center; }
        .h-address { font-weight: 500; font-size: 14px; max-width: 70%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .h-price { color: #21EA7C; font-weight: 700; }

        /* --- ACTIVE MAP VIEW --- */
        .courier-active-screen {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #000; z-index: 5000;
            display: flex; flex-direction: column;
        }
        .courier-map-full { flex: 1; position: relative; }
        .live-map-v3-full { width: 100%; height: 100%; }
        
        .map-overlay-back {
            position: absolute; top: 20px; left: 20px; z-index: 10;
        }
        .icon-btn-glass {
            width: 44px; height: 44px; border-radius: 12px;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            color: #fff; display: flex; align-items: center; justify-content: center;
            cursor: pointer;
        }

        .courier-bottom-sheet {
            background: rgba(20, 20, 20, 0.85);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px 24px 0 0;
            padding: 8px 24px 32px 24px;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
            animation: slideUp 0.3s ease-out;
            max-height: 50vh; overflow-y: auto;
        }
        .sheet-handle-bar { display: flex; justify-content: center; padding: 8px 0 20px 0; }
        .sheet-handle { width: 40px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; }

        .sheet-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 24px;
        }
        .order-id { font-size: 22px; margin: 0; color: #fff; }
        .order-status-text { color: #aaa; margin: 4px 0 0 0; font-size: 14px; }
        .sheet-price-badge {
            background: #21EA7C; color: #000; font-weight: 800;
            padding: 6px 12px; border-radius: 10px; font-size: 18px;
        }

        .sheet-address-box, .sheet-customer-box {
            display: flex; align-items: center; gap: 16px;
            background: rgba(255,255,255,0.05); padding: 16px;
            border-radius: 16px; margin-bottom: 12px;
        }
        .address-icon, .customer-avatar {
            width: 40px; height: 40px; border-radius: 50%;
            background: rgba(255,255,255,0.1);
            display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .address-text, .customer-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .address-label { font-size: 11px; text-transform: uppercase; color: #aaa; }
        .address-val { font-size: 15px; font-weight: 500; }
        .c-name { font-weight: 600; }
        .c-phone { font-size: 13px; color: #aaa; }

        .call-btn {
            width: 40px; height: 40px; border-radius: 50%; background: #21EA7C;
            display: flex; align-items: center; justify-content: center; font-size: 20px;
            text-decoration: none; color: #000; box-shadow: 0 4px 10px rgba(33,234,124,0.3);
        }

        .sheet-actions {
            display: flex; gap: 12px; margin-top: 24px;
        }
        .sheet-btn {
            flex: 1; padding: 16px; border: none; border-radius: 14px;
            font-weight: 700; font-size: 16px; cursor: pointer;
            transition: transform 0.2s;
        }
        .sheet-btn.primary { background: #21EA7C; color: #000; box-shadow: 0 4px 15px rgba(33,234,124,0.3); }
        .sheet-btn.secondary { background: rgba(255,255,255,0.1); color: #fff; }
        .sheet-btn:active { transform: scale(0.96); }

        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `}</style>
);
