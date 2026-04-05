import { useState, useEffect, useRef } from 'react';
import { adminApi, adminAuth, type Order, type Restaurant } from '../../services/adminService';
import {
    ClockIcon, CheckIcon, ChefIcon, PackageIcon,
    DeliveryIcon, StarIcon, CancelIcon
} from '../../components/icons/StatusIcons';
import './AdminStyles.css';

const STATUS_MAP: Record<string, { label: string; color: string; Icon: any; step: number }> = {
    pending: { label: 'Новый', color: '#ffaa00', Icon: ClockIcon, step: 1 },
    confirmed: { label: 'Подтверждён', color: '#00aaff', Icon: CheckIcon, step: 2 },
    preparing: { label: 'Готовится', color: '#aa44ff', Icon: ChefIcon, step: 3 },
    ready: { label: 'Готов', color: '#00ccff', Icon: PackageIcon, step: 4 },
    delivering: { label: 'В пути', color: '#ff8800', Icon: DeliveryIcon, step: 5 },
    delivered: { label: 'Доставлен', color: '#21ea7c', Icon: StarIcon, step: 6 },
    cancelled: { label: 'Отменён', color: '#ff4444', Icon: CancelIcon, step: -1 },
};

const NEXT_ACTION: Record<string, { status: string; label: string; style: string }> = {
    pending: { status: 'confirmed', label: '✅ Принять заказ', style: 'confirm' },
    confirmed: { status: 'preparing', label: '👨‍🍳 Начать готовить', style: 'prepare' },
    preparing: { status: 'ready', label: '📦 Заказ готов', style: 'ready' },
};

export function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filter, setFilter] = useState('active');
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [assigning, setAssigning] = useState<number | null>(null);
    const prevCountRef = useRef(0);
    const user = adminAuth.getUser();

    const load = async () => {
        try {
            const [o, r] = await Promise.all([
                adminApi.get<Order[]>('/orders'),
                adminApi.get<Restaurant[]>('/restaurants/').catch(() => [])
            ]);
            // Play notification for new pending orders
            if (prevCountRef.current > 0) {
                const newPending = o.filter(x => x.status === 'pending').length;
                const oldPending = orders.filter(x => x.status === 'pending').length;
                if (newPending > oldPending) {
                    try { new Audio('data:audio/wav;base64,UklGRl9vT19telemdlkkBAAEARAAI').play().catch(() => { }); } catch { }
                }
            }
            prevCountRef.current = o.length;
            setOrders(o);
            setRestaurants(r);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh every 15 seconds
    useEffect(() => {
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (id: number, status: string) => {
        try {
            await adminApi.patch(`/orders/${id}/status`, { status });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

            // Auto-assign courier when order becomes ready
            if (status === 'ready') {
                setAssigning(id);
                try {
                    const res = await adminApi.post<{ success: boolean; message: string }>(`/courier/auto-assign/${id}`, {});
                    if (res.success) {
                        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'delivering' } : o));
                    }
                } catch { /* auto-assign failed, courier can pick up manually */ }
                setAssigning(null);
            }
        } catch (err: any) {
            alert(err.message || 'Ошибка обновления статуса');
            load();
        }
    };

    const cancelOrder = async (id: number) => {
        if (!confirm('Отменить заказ?')) return;
        try {
            await adminApi.delete(`/orders/${id}`);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
        } catch (err: any) {
            alert(err.message || 'Ошибка отмены');
        }
    };

    const parseItems = (itemsStr: string) => {
        try {
            return typeof itemsStr === 'string' ? JSON.parse(itemsStr) : itemsStr || [];
        } catch { return []; }
    };

    const getRestName = (id: string) => restaurants.find(r => r.id === id)?.name || id;

    const timeSince = (dateStr: string) => {
        const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
        if (mins < 1) return 'только что';
        if (mins < 60) return `${mins} мин назад`;
        const hrs = Math.floor(mins / 60);
        return `${hrs} ч ${mins % 60} мин назад`;
    };

    // Filter logic
    const filtered = (() => {
        if (filter === 'active') return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
        if (filter === 'all') return orders;
        return orders.filter(o => o.status === filter);
    })();

    // Count badges
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    const activeCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;

    if (loading) return <div className="admin-loading">Загрузка заказов...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1 className="page-title">
                    {user?.role === 'restaurant_admin' ? '🍽️ Заказы ресторана' : '📋 Управление заказами'}
                </h1>
                <button className="admin-btn" onClick={load} style={{ background: 'rgba(255,255,255,0.05)' }}>
                    🔄 Обновить
                </button>
            </div>

            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <FilterBtn active={filter === 'active'} onClick={() => setFilter('active')} color="#21ea7c" count={activeCount}>
                    Активные
                </FilterBtn>
                <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} color="#888">
                    Все
                </FilterBtn>
                {Object.entries(STATUS_MAP).map(([key, val]) => (
                    <FilterBtn
                        key={key}
                        active={filter === key}
                        onClick={() => setFilter(key)}
                        color={val.color}
                        count={counts[key]}
                    >
                        {val.label}
                    </FilterBtn>
                ))}
            </div>

            {/* Orders list */}
            <div style={{ display: 'grid', gap: '16px' }}>
                {filtered.map(order => {
                    const items = parseItems(order.items);
                    const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                    const nextAction = NEXT_ACTION[order.status];
                    const isExpanded = expandedId === order.id;
                    const isAssigning = assigning === order.id;

                    return (
                        <div key={order.id} className="admin-card" style={{
                            padding: 0,
                            overflow: 'hidden',
                            borderLeft: `4px solid ${statusInfo.color}`,
                            transition: 'all 0.3s ease'
                        }}>
                            {/* Order header */}
                            <div
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '16px 20px', cursor: 'pointer',
                                    background: order.status === 'pending' ? 'rgba(255, 170, 0, 0.05)' : 'transparent'
                                }}
                                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <statusInfo.Icon size={22} style={{ color: statusInfo.color }} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                                            Заказ #{order.id}
                                            <span style={{
                                                marginLeft: '10px', fontSize: '0.75rem', fontWeight: 600,
                                                padding: '2px 10px', borderRadius: '10px',
                                                background: `${statusInfo.color}22`, color: statusInfo.color
                                            }}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                                            {getRestName(order.restaurant_id)} · {timeSince(order.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--admin-primary)' }}>
                                        {order.total} ₾
                                    </div>
                                    <div style={{ color: '#888', fontSize: '0.8rem' }}>
                                        {items.length} поз. · {isExpanded ? '▲' : '▼'}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div style={{
                                    padding: '0 20px 20px',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    animation: 'fadeIn 0.2s ease'
                                }}>
                                    {/* Status pipeline */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '16px 0', overflowX: 'auto', paddingBottom: '4px' }}>
                                        {['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'].map((s, i) => {
                                            const info = STATUS_MAP[s];
                                            const isCurrent = order.status === s;
                                            const isPast = info.step < statusInfo.step && statusInfo.step > 0;
                                            return (
                                                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <div style={{
                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.65rem', fontWeight: 700,
                                                        background: isCurrent ? info.color : isPast ? `${info.color}44` : 'rgba(255,255,255,0.06)',
                                                        color: isCurrent ? '#000' : isPast ? info.color : '#555',
                                                        transition: 'all 0.3s',
                                                        flexShrink: 0
                                                    }}>
                                                        {isPast ? '✓' : i + 1}
                                                    </div>
                                                    {i < 5 && (
                                                        <div style={{
                                                            width: '24px', height: '2px', flexShrink: 0,
                                                            background: isPast ? `${info.color}66` : 'rgba(255,255,255,0.08)'
                                                        }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Customer info + Items */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Клиент</div>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{order.customer_name || '—'}</div>
                                            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>{order.phone || '—'}</div>
                                            <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '4px' }}>📍 {order.address || '—'}</div>
                                            {(order as any).apartment && <div style={{ fontSize: '0.8rem', color: '#888', marginLeft: '18px' }}>Кв: {(order as any).apartment}, Под: {(order as any).entrance}, Эт: {(order as any).floor}, Домофон: {(order as any).intercom}</div>}

                                            {(order as any).scheduled_time && (
                                                <div style={{ marginTop: '4px', color: '#ffaa00', fontSize: '0.9rem', fontWeight: 600 }}>
                                                    ⏰ Доставка ко времени: {(order as any).scheduled_time}
                                                </div>
                                            )}

                                            {order.comment && (
                                                <div style={{
                                                    marginTop: '8px', background: 'rgba(255,68,68,0.08)',
                                                    padding: '8px 12px', borderRadius: '8px', color: '#ff8888', fontSize: '0.85rem'
                                                }}>
                                                    💬 {order.comment}
                                                </div>
                                            )}
                                            {(order as any).courier_comment && (
                                                <div style={{
                                                    marginTop: '8px', background: 'rgba(33, 150, 243, 0.08)',
                                                    padding: '8px 12px', borderRadius: '8px', color: '#2196f3', fontSize: '0.85rem'
                                                }}>
                                                    🚴 {((order as any).courier_comment)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Состав заказа</div>
                                            {items.map((item: any, i: number) => (
                                                <div key={i} style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    <span>{item.quantity}× {item.name}</span>
                                                    <span style={{ color: 'var(--admin-primary)', fontWeight: 600 }}>
                                                        {(item.price * item.quantity).toFixed(2)} ₾
                                                    </span>
                                                </div>
                                            ))}
                                            <div style={{ fontSize: '0.85rem', color: '#ccc', marginTop: '6px' }}>
                                                🍴 Приборы: {(order as any).cutlery_count || 0}
                                            </div>
                                            {(order as any).tips > 0 && (
                                                <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#21ea7c' }}>
                                                    💰 Чаевые: {(order as any).tips} ₾
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Действия</div>

                                            {/* Main action button */}
                                            {nextAction && (
                                                <button
                                                    className="admin-btn admin-btn-primary"
                                                    style={{ width: '100%', padding: '12px', marginBottom: '8px', fontSize: '1rem' }}
                                                    onClick={() => updateStatus(order.id, nextAction.status)}
                                                    disabled={isAssigning}
                                                >
                                                    {isAssigning ? '🔍 Ищем курьера...' : nextAction.label}
                                                </button>
                                            )}

                                            {/* Manual status select for super admins */}
                                            {user?.role === 'super_admin' && (
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                                    className="admin-input"
                                                    style={{ width: '100%', marginBottom: '8px', fontSize: '0.85rem' }}
                                                >
                                                    {Object.entries(STATUS_MAP).map(([key, val]) => (
                                                        <option key={key} value={key}>{val.label}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {/* Cancel button */}
                                            {!['delivered', 'cancelled'].includes(order.status) && (
                                                <button
                                                    className="admin-btn"
                                                    style={{
                                                        width: '100%', padding: '10px', fontSize: '0.85rem',
                                                        background: 'rgba(255,68,68,0.1)', color: '#ff6666',
                                                        border: '1px solid rgba(255,68,68,0.2)'
                                                    }}
                                                    onClick={() => cancelOrder(order.id)}
                                                >
                                                    ✕ Отменить
                                                </button>
                                            )}

                                            {/* Courier info */}
                                            {order.courier_id && (
                                                <div style={{
                                                    marginTop: '12px', padding: '10px', borderRadius: '10px',
                                                    background: 'rgba(33,234,124,0.06)', border: '1px solid rgba(33,234,124,0.15)'
                                                }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#21ea7c' }}>🚴 Курьер назначен</div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '4px' }}>ID: {order.courier_id}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--admin-text-muted)' }}>
                        Нет заказов
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

function FilterBtn({ active, onClick, color, count, children }: {
    active: boolean; onClick: () => void; color: string; count?: number; children: React.ReactNode;
}) {
    return (
        <button
            className="admin-btn"
            onClick={onClick}
            style={{
                background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
                color: active ? color : '#888',
                border: `1px solid ${active ? `${color}44` : 'transparent'}`,
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: active ? 600 : 400,
                borderRadius: '8px',
                transition: 'all 0.2s'
            }}
        >
            {children}
            {count !== undefined && count > 0 && (
                <span style={{
                    marginLeft: '6px', background: active ? color : 'rgba(255,255,255,0.1)',
                    color: active ? '#000' : '#888', padding: '1px 7px', borderRadius: '10px',
                    fontSize: '0.75rem', fontWeight: 700
                }}>
                    {count}
                </span>
            )}
        </button>
    );
}
