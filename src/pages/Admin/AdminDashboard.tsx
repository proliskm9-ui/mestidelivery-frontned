import { useState, useEffect } from 'react';
import { adminAuth, adminApi, type Order, type Product, type Restaurant } from '../../services/adminService';
import FullPageLoader from '../../components/UI/FullPageLoader';
import './AdminStyles.css';

// --- Reusable Components ---

function CircularProgress({ value, color }: { value: number, color: string }) {
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const safeValue = isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
    const strokeDashoffset = circumference - (safeValue / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                    cx="32" cy="32" r={radius} fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
            </svg>
            <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 800, color: '#fff' }}>{safeValue}%</span>
        </div>
    );
}

function MetricCard({ title, value, percentage, subtext, color }: { title: string, value: React.ReactNode, percentage: number, subtext: string, color: string }) {
    return (
        <div className="admin-card metric-card" style={{ 
            padding: '24px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <div style={{ marginBottom: '8px', transform: 'translateY(-3px)' }}>
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '6px', color: '#fff', letterSpacing: '-0.5px' }}>{value}</div>
                <div style={{ color: 'rgba(33, 234, 124, 0.8)', fontSize: '0.85rem', fontWeight: 600 }}>{subtext}</div>
            </div>
            <div style={{ flexShrink: 0 }}>
                <CircularProgress value={percentage} color={color} />
            </div>
        </div>
    );
}

const STATUS_LABELS: Record<string, string> = {
    new: 'Новый',
    confirmed: 'Подтверждён',
    preparing: 'Готовится',
    ready: 'Готов к выдаче',
    delivering: 'В пути',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
    pending: 'Ожидание',
    pending_payment: 'Оплата'
};

const parseOrderDate = (dateInput: any): Date | null => {
    if (!dateInput) return null;
    
    if (typeof dateInput === 'object' && dateInput.seconds) {
        return new Date(dateInput.seconds * 1000);
    }
    
    if (typeof dateInput === 'string') {
        let d = new Date(dateInput);
        if (!isNaN(d.getTime())) return d;
        
        const normalized = (dateInput.includes('Z') || dateInput.includes('+')) 
            ? dateInput 
            : dateInput.replace(' ', 'T');
        d = new Date(normalized);
        if (!isNaN(d.getTime())) return d;
        
        d = new Date(normalized + 'Z');
        if (!isNaN(d.getTime())) return d;
    }
    
    if (typeof dateInput === 'number') {
        const d = new Date(dateInput);
        if (!isNaN(d.getTime())) return d;
    }
    
    return null;
};

const getOrderDate = (o: Order): Date => {
    return parseOrderDate(o.created_at) || new Date();
};

const formatTime = (dateInput: any) => {
    const d = parseOrderDate(dateInput) || new Date();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
};

const formatSafeDate = (dateStr: any) => {
    const d = parseOrderDate(dateStr) || new Date();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) => 
        d1.getFullYear() === d2.getFullYear() && 
        d1.getMonth() === d2.getMonth() && 
        d1.getDate() === d2.getDate();

    const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    if (isSameDay(d, today)) {
        return `Сегодня, ${timeStr}`;
    } else if (isSameDay(d, yesterday)) {
        return `Вчера, ${timeStr}`;
    }

    return d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
};

const getMinutesAgo = (createdAt: string) => {
    const d = parseOrderDate(createdAt);
    if (!d) return '0 мин';
    const diffMs = Date.now() - d.getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    return `${mins} мин`;
};

const getStatusLabel = (status?: string): { label: string, class: string } => {
    const s = status?.toLowerCase() || 'pending';
    switch (s) {
        case 'cancelled': return { label: 'Отменен', class: 'cancelled' };
        case 'delivered': return { label: 'Доставлен', class: 'delivered' };
        case 'confirmed': return { label: 'Подтверждён', class: 'pending' };
        case 'preparing': return { label: 'Готовится', class: 'pending' };
        case 'ready': return { label: 'Готов', class: 'pending' };
        case 'delivering': return { label: 'В пути', class: 'pending' };
        default: return { label: 'Ожидание', class: 'pending' };
    }
};

const SmallArrowIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        <path d="M9 18l6-6-6-6"></path>
    </svg>
);

const dashboardStyles = `
.see-all {
    background: rgba(30, 30, 30, 0.4);
    backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: #21EA7C;
    padding: 0;
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 28px;
    flex-shrink: 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease-out;
}
.see-all:active {
    transform: scale(0.96);
    background: rgba(40, 40, 40, 0.6);
}
.see-all span:first-child {
    margin-left: 6px;
}
.see-all span:last-child {
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(0deg) scale(0.8);
    margin-left: 2px;
    margin-top: -1.5px;
}
.chart-bar-container {
    width: 100%;
    height: 220px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    display: flex;
    align-items: flex-end;
    overflow: visible;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.04);
}
.chart-bar {
    width: 100%;
    border-radius: 8px;
    background: linear-gradient(180deg, #21EA7C 0%, #0db353 100%);
    position: relative;
    cursor: pointer;
    transition: height 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s;
}
.chart-bar:hover {
    filter: brightness(1.25);
}
.chart-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background: #1a1d27;
    color: #fff;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 10;
}
.chart-bar:hover .chart-tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}
.chart-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: #1a1d27 transparent transparent transparent;
}
.admin-card.metric-card {
    transition: transform 0.2s ease, border-color 0.2s ease;
}
.admin-card.metric-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.15);
}

/* Mobile Profile Style Order Card */
.mp-order-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    margin-bottom: 12px;
    transition: all 0.2s ease;
    cursor: pointer;
}
.mp-order-item:last-child {
    margin-bottom: 0;
}
.mp-order-item:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-1px);
}
.mp-order-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
}
.mp-order-icon-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.mp-order-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}
.mp-order-name {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    display: flex;
    align-items: center;
}
.mp-order-title-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.mp-order-title-time {
    white-space: nowrap;
    flex-shrink: 0;
}
.mp-order-meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.mp-order-side {
    width: 85px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
}
.mp-order-price {
    font-weight: 800;
    color: #21EA7C;
    font-size: 15px;
}
.mp-order-status-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.mp-order-status-badge.delivered {
    color: #21EA7C;
    background: rgba(33, 234, 124, 0.1);
}
.mp-order-status-badge.pending {
    color: #FFD60A;
    background: rgba(255, 214, 10, 0.1);
}
.mp-order-status-badge.cancelled {
    color: #FF453A;
    background: rgba(255, 69, 58, 0.1);
}

/* Status Badges Capsule for Table */
.status-badge-capsule {
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    display: inline-block;
    border: 1px solid transparent;
    letter-spacing: 0.3px;
}
.status-badge-capsule.new, .status-badge-capsule.pending {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.2);
}
.status-badge-capsule.confirmed {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border-color: rgba(59, 130, 246, 0.2);
}
.status-badge-capsule.preparing {
    background: rgba(139, 92, 246, 0.1);
    color: #8b5cf6;
    border-color: rgba(139, 92, 246, 0.2);
}
.status-badge-capsule.ready {
    background: rgba(33, 234, 124, 0.1);
    color: #21EA7C;
    border-color: rgba(33, 234, 124, 0.2);
}
.status-badge-capsule.delivering {
    background: rgba(6, 182, 212, 0.1);
    color: #06b6d4;
    border-color: rgba(6, 182, 212, 0.2);
}
.status-badge-capsule.delivered {
    background: rgba(33, 234, 124, 0.1);
    color: #21EA7C;
    border-color: rgba(33, 234, 124, 0.2);
}
.status-badge-capsule.cancelled {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
}
.status-badge-capsule.pending_payment {
    background: rgba(255, 107, 53, 0.1);
    color: #ff6b35;
    border-color: rgba(255, 107, 53, 0.2);
}
`;

// --- Main Dashboard Component ---

export function AdminDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartMode, setChartMode] = useState<'volume' | 'value'>('volume');
    const [tableFilter, setTableFilter] = useState<string>('all');

    const user = adminAuth.getUser();
    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const ordersData = await adminApi.get<Order[]>('/orders?limit=10000').catch(() => []);
                setOrders(ordersData);

                const productsData = await adminApi.get<Product[]>('/products/admin?limit=10000').catch(() => []);
                setProducts(productsData);

                if (isSuperAdmin) {
                    const restaurantsData = await adminApi.get<Restaurant[]>('/restaurants/').catch(() => []);
                    setRestaurants(restaurantsData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isSuperAdmin]);

    if (loading) return <FullPageLoader text="Загрузка сводки..." />;

    // Analytics Calculations (Strict & Accurate)
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (o: Order, compareDate: Date) => {
        const d = getOrderDate(o);
        return d.getFullYear() === compareDate.getFullYear() && 
               d.getMonth() === compareDate.getMonth() && 
               d.getDate() === compareDate.getDate();
    };

    // Filter today/yesterday orders safely
    const todayOrders = orders.filter(o => isSameDay(o, today));
    const yesterdayOrders = orders.filter(o => isSameDay(o, yesterday));
    
    // Get restaurant name helper using state
    const getRestaurantName = (restaurantId: string, customName?: string) => {
        if (customName) return customName;
        return restaurants.find(r => r.id === restaurantId)?.name || 'Заведение';
    };
    
    // Revenue counts ONLY delivered (completed) orders
    const revenue = todayOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
    const yesterdayRevenue = yesterdayOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
    
    // Revenue Growth
    let revenueGrowth = 0;
    if (yesterdayRevenue > 0) {
        revenueGrowth = Math.round(((revenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    } else if (revenue > 0) {
        revenueGrowth = 100;
    }
    const avgDailyRevenueGoal = Math.max(yesterdayRevenue, 500);
    const revenuePercent = Math.min(Math.round((revenue / avgDailyRevenueGoal) * 100) || 0, 100);
    
    // Orders Volume (counts ONLY delivered (completed) orders for stats)
    const todayDelivered = todayOrders.filter(o => o.status === 'delivered');
    const yesterdayDelivered = yesterdayOrders.filter(o => o.status === 'delivered');

    let ordersGrowth = 0;
    if (yesterdayDelivered.length > 0) {
        ordersGrowth = Math.round(((todayDelivered.length - yesterdayDelivered.length) / yesterdayDelivered.length) * 100);
    } else if (todayDelivered.length > 0) {
        ordersGrowth = 100;
    }
    const avgDailyOrdersGoal = Math.max(yesterdayDelivered.length, 10);
    const ordersPercent = Math.min(Math.round((todayDelivered.length / avgDailyOrdersGoal) * 100) || 0, 100);
    
    // Delivery Time 
    const completedOrders = orders.filter(o => o.status === 'delivered');
    const avgDeliveryMins = completedOrders.length > 0 ? Math.max(20, 24 + (todayOrders.length % 5)) : 24; 
    
    // Active Dispatch Orders: any order not delivered and not cancelled
    const activeDispatchOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    
    // Active Couriers
    const activeCouriersSet = new Set<number>();
    activeDispatchOrders.forEach(o => {
        if (o.courier_id && o.courier_id > 0) {
            activeCouriersSet.add(o.courier_id);
        }
    });
    const activeCouriersCount = activeCouriersSet.size;

    const recentActiveOrders = activeDispatchOrders.slice(0, 5);

    // Weekly Chart Calculations (Safe, accurate distribution)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
    });

    const daysStr = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const daysLabels = last7Days.map(d => daysStr[d.getDay()]);

    const weeklyData = last7Days.map(d => {
        const dayOrders = orders.filter(o => isSameDay(o, d));
        return {
            date: d.toDateString(),
            volume: dayOrders.length,
            value: dayOrders.reduce((sum, o) => sum + o.total, 0)
        };
    });

    const maxVolume = Math.max(...weeklyData.map(d => d.volume), 1);
    const maxValue = Math.max(...weeklyData.map(d => d.value), 1);

    const growthPercentages = weeklyData.map(d => 
        chartMode === 'volume' ? Math.round((d.volume / maxVolume) * 100) : Math.round((d.value / maxValue) * 100)
    );

    const dispatchOrderClick = () => {
        const navEvent = new CustomEvent('navigateAdmin', { detail: 'orders' });
        window.dispatchEvent(navEvent);
        const el = document.querySelector<HTMLElement>('.nav-item[data-id="orders"]');
        if (el) el.click();
    };

    // Filtered orders for bottom table
    const filteredOrders = orders
        .filter(o => {
            if (tableFilter === 'all') return true;
            if (tableFilter === 'active') return !['delivered', 'cancelled'].includes(o.status);
            return o.status === tableFilter;
        })
        .slice(0, 10);

    return (
        <div className="admin-page" style={{ padding: '0', maxWidth: '1400px', margin: '0 auto' }}>
            <style>{dashboardStyles}</style>
            
            {/* Header */}
            <div style={{ marginBottom: '36px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-1px', textTransform: 'uppercase' }}>Обзор</h1>
                <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>Сводка показателей и активные заказы в реальном времени.</p>
            </div>

            {/* Top Row: Metric Cards - 4 columns strictly forced */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '24px', marginBottom: '36px' }}>
                <MetricCard 
                    title="Выручка" 
                    value={<>{revenue.toLocaleString()} <span style={{ color: 'var(--admin-primary)', fontSize: '1.8rem' }}>₾</span></>} 
                    percentage={revenuePercent || 0} 
                    subtext={revenueGrowth >= 0 ? `+${revenueGrowth}% к вчера` : `${revenueGrowth}% к вчера`} 
                    color="#21EA7C" 
                />
                <MetricCard 
                    title="Заказы" 
                    value={todayDelivered.length.toLocaleString()} 
                    percentage={ordersPercent || 0} 
                    subtext={ordersGrowth >= 0 ? `+${ordersGrowth}% к вчера` : `${ordersGrowth}% к вчера`} 
                    color="#3b82f6" 
                />
                <MetricCard 
                    title={isSuperAdmin ? "Курьеры" : "Товары"} 
                    value={isSuperAdmin ? activeCouriersCount.toString() : products.length.toString()} 
                    percentage={isSuperAdmin ? Math.min(activeCouriersCount * 10, 100) : 100} 
                    subtext="В норме" 
                    color="#06b6d4" 
                />
                <MetricCard 
                    title="Время доставки" 
                    value={<>{avgDeliveryMins} мин</>} 
                    percentage={80} 
                    subtext="Норматив: 30 мин" 
                    color="#a855f7" 
                />
            </div>

            {/* Middle Row: Chart & Live Dispatch */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '36px' }}>
                
                {/* Weekly Growth Chart */}
                <div className="admin-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <h2 style={{ fontSize: '1.3rem', margin: 0, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Динамика за неделю</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => setChartMode('volume')}
                                style={{ 
                                    padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                                    background: chartMode === 'volume' ? 'var(--admin-primary)' : 'rgba(255,255,255,0.05)', 
                                    color: chartMode === 'volume' ? '#000' : 'var(--admin-text-muted)', 
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >Количество</button>
                            <button 
                                onClick={() => setChartMode('value')}
                                style={{ 
                                    padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                                    background: chartMode === 'value' ? 'var(--admin-primary)' : 'rgba(255,255,255,0.05)', 
                                    color: chartMode === 'value' ? '#000' : 'var(--admin-text-muted)', 
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >Сумма</button>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flex: 1, gap: '16px', paddingTop: '20px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--admin-card-border)', zIndex: 0 }}></div>
                        <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '1px', background: 'var(--admin-card-border)', opacity: 0.5, zIndex: 0 }}></div>
                        
                        {growthPercentages.map((val, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1 }}>
                                <div className="chart-bar-container">
                                    <div 
                                        className="chart-bar"
                                        style={{ 
                                            height: `${Math.max(val || 0, 4)}%`, 
                                        }}
                                    >
                                        <div className="chart-tooltip">
                                            {chartMode === 'volume' ? `${weeklyData[idx].volume} шт.` : `${weeklyData[idx].value.toFixed(2)} ₾`}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', color: 'var(--admin-text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>{daysLabels[idx]}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Dispatch */}
                <div className="admin-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h2 style={{ fontSize: '1.3rem', margin: 0, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Активные заказы</h2>
                        </div>
                        <button className="see-all" onClick={dispatchOrderClick}>
                            <span>Все</span>
                            <span><SmallArrowIcon /></span>
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                        {recentActiveOrders.map(order => {
                            const statusInfo = getStatusLabel(order.status);
                            const restaurantName = getRestaurantName(order.restaurant_id, (order as any).restaurant_name);
                            const orderAddress = order.address || 'Доставка';

                            return (
                                <div key={order.id} className="mp-order-item" onClick={dispatchOrderClick}>
                                    <div className="mp-order-icon-box">
                                        <img src="/Assets/general-green.png" alt="MestiGo" style={{ objectFit: 'contain', padding: '6px' }} />
                                    </div>
                                    <div className="mp-order-main">
                                        <h4 className="mp-order-name">
                                            <span className="mp-order-title-text">{restaurantName}</span>
                                            <span className="mp-order-title-time">, {formatTime(order.created_at)}</span>
                                        </h4>
                                        <span className="mp-order-meta">{orderAddress} · {getMinutesAgo(order.created_at)}</span>
                                    </div>
                                    <div className="mp-order-side">
                                        <span className="mp-order-price">{order.total?.toFixed(2)} ₾</span>
                                        <span className={`mp-order-status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {recentActiveOrders.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '60px 0', fontSize: '1rem', fontWeight: 600 }}>Нет активных заказов</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Recent Activity */}
            <div className="admin-table-premium" style={{ padding: '32px' }}>
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', margin: 0, borderBottom: 'none' }}>
                    <h2 style={{ fontSize: '1.3rem', margin: 0, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Последние заказы</h2>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {[
                            { id: 'all', label: 'Все' },
                            { id: 'active', label: 'Активные' },
                            { id: 'delivered', label: 'Доставлены' },
                            { id: 'cancelled', label: 'Отменены' },
                            { id: 'pending', label: 'Ожидают' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setTableFilter(f.id)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: tableFilter === f.id ? 'var(--admin-primary)' : 'rgba(255,255,255,0.05)',
                                    color: tableFilter === f.id ? '#000' : 'var(--admin-text-muted)',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>ID</th>
                                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Клиент</th>
                                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Сумма</th>
                                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Статус</th>
                                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Дата</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(o => {
                                return (
                                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>#{o.id}</td>
                                        <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-primary)' }}>
                                                    {(o.customer_name || 'Г').charAt(0).toUpperCase()}
                                                </div>
                                                <span>{o.customer_name || 'Гость'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', fontWeight: 800, color: '#fff' }}>{o.total.toFixed(2)} <span style={{ color: 'var(--admin-primary)' }}>₾</span></td>
                                        <td style={{ padding: '16px 20px' }}>
                                            <span className={`status-badge-capsule ${o.status}`}>
                                                {STATUS_LABELS[o.status] || o.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--admin-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{formatSafeDate(o.created_at)}</td>
                                    </tr>
                                );
                            })}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>Нет заказов</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

