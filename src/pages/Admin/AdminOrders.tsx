import { useState, useEffect, useRef } from 'react';
import { adminApi, adminAuth, type Order, type Restaurant } from '../../services/adminService';
import {
    ClockIcon, CheckIcon, ChefIcon, PackageIcon,
    DeliveryIcon, StarIcon, CancelIcon, WalletIcon
} from '../../components/icons/StatusIcons';
import FullPageLoader from '../../components/UI/FullPageLoader';
import { pickKitchenText } from '../../utils/i18nContent';
import './AdminStyles.css';

const STATUS_MAP: Record<string, { label: string; color: string; Icon: any; step: number }> = {
    pending_payment: { label: 'Ожидание оплаты', color: '#ff6b35', Icon: WalletIcon, step: 0 },
    pending: { label: 'Новый', color: '#ffaa00', Icon: ClockIcon, step: 1 },
    confirmed: { label: 'Подтверждён', color: '#00aaff', Icon: CheckIcon, step: 2 },
    preparing: { label: 'Готовится', color: '#aa44ff', Icon: ChefIcon, step: 3 },
    ready: { label: 'Готов', color: '#00ccff', Icon: PackageIcon, step: 4 },
    delivering: { label: 'В пути', color: '#ff8800', Icon: DeliveryIcon, step: 5 },
    delivered: { label: 'Доставлен', color: '#21ea7c', Icon: StarIcon, step: 6 },
    cancelled: { label: 'Отменён', color: '#ff4444', Icon: CancelIcon, step: -1 },
};

const NEXT_ACTION: Record<string, { status: string; label: string; style: string }> = {
    pending_payment: { status: 'confirmed', label: '💳 Подтвердить оплату', style: 'payment' },
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
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refundingId, setRefundingId] = useState<number | null>(null);
    const prevCountRef = useRef(0);
    const user = adminAuth.getUser();

    const load = async (manual = false) => {
        if (manual) setIsRefreshing(true);
        const startTime = Date.now();
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
            if (manual) {
                const elapsed = Date.now() - startTime;
                if (elapsed < 600) {
                    setTimeout(() => setIsRefreshing(false), 600 - elapsed);
                } else {
                    setIsRefreshing(false);
                }
            }
        }
    };

    // Auto-refresh every 15 seconds
    useEffect(() => {
        load();
        const interval = setInterval(() => load(), 15000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handler = () => setActiveDropdownId(null);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
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
        if (!confirm('Отменить заказ? Заказ останется в разделе «Отменённые», где можно инициировать возврат.')) return;
        try {
            await adminApi.patch(`/orders/${id}/status`, { status: 'cancelled' });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
            setFilter('cancelled');
        } catch (err: any) {
            alert(err.message || 'Ошибка отмены');
            load();
        }
    };

    const initiateRefund = async (id: number) => {
        if (!confirm('Инициировать возврат средств? Клиенту придёт письмо, что деньги вернутся в течение суток.')) return;
        setRefundingId(id);
        try {
            const res = await adminApi.post<{ success: boolean; refund_initiated_at?: string }>(`/admin/orders/${id}/refund`, {});
            setOrders(prev => prev.map(o => o.id === id
                ? { ...o, refund_initiated_at: res.refund_initiated_at || new Date().toISOString() }
                : o));
        } catch (err: any) {
            alert(err.message || 'Не удалось инициировать возврат');
        } finally {
            setRefundingId(null);
        }
    };

    const parseItems = (itemsStr: string) => {
        try {
            const parsed = typeof itemsStr === 'string' ? JSON.parse(itemsStr) : itemsStr || [];
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    };

    const getRestName = (id: string) => restaurants.find(r => r.id === id)?.name || id;

    const timeSince = (dateVal: any) => {
        if (!dateVal) return '—';
        let dateStr = typeof dateVal === 'string' ? dateVal : 
                      (typeof dateVal === 'object' && dateVal.seconds) ? new Date(dateVal.seconds * 1000).toISOString() : 
                      String(dateVal);
        
        // Force UTC interpretation if no timezone info is present
        const normalized = (dateStr.includes('Z') || dateStr.includes('+')) 
            ? dateStr 
            : dateStr.replace(' ', 'T') + 'Z';
            
        const diffMs = Date.now() - new Date(normalized).getTime();
        const mins = Math.floor(diffMs / 60000);
        
        if (mins < 0) return 'только что'; // Handle slight clock drift
        if (mins < 1) return 'только что';
        if (mins < 60) return `${mins} мин назад`;
        const hrs = Math.floor(mins / 60);
        return `${hrs} ч ${mins % 60} мин назад`;
    };

    // Filter logic
    const filtered = (() => {
        if (!Array.isArray(orders)) return [];
        if (filter === 'active') return orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
        if (filter === 'waiting') return orders.filter(o => ['pending_payment', 'pending'].includes(o.status));
        if (filter === 'all') return orders;
        return orders.filter(o => o.status === filter);
    })();


    if (loading) return <FullPageLoader variant="list" />;

    return (
        <div className="admin-page">
            {/* Header */}
            <div style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-1px', textTransform: 'uppercase' }}>
                        Заказы
                    </h1>
                    <button className="admin-btn-refresh" onClick={() => load(true)} disabled={isRefreshing}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        <span>{isRefreshing ? 'Обновление...' : 'Обновить'}</span>
                    </button>
                </div>
                <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '1.05rem', fontWeight: 500, maxWidth: '80%' }}>
                    {user?.role === 'restaurant_admin' ? 'Управление и статусы заказов вашего ресторана.' : 'Мониторинг, распределение курьеров и управление заказами.'}
                </p>
            </div>

            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', width: '100%' }}>
                <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>
                    Все
                </FilterBtn>
                <FilterBtn active={filter === 'active'} onClick={() => setFilter('active')}>
                    Активные
                </FilterBtn>
                <FilterBtn active={filter === 'delivered'} onClick={() => setFilter('delivered')}>
                    Доставлены
                </FilterBtn>
                <FilterBtn active={filter === 'cancelled'} onClick={() => setFilter('cancelled')}>
                    Отменены
                </FilterBtn>
                <FilterBtn active={filter === 'waiting'} onClick={() => setFilter('waiting')}>
                    Ожидают
                </FilterBtn>
            </div>

            {/* Orders list */}
            <div style={{ display: 'grid', gap: '16px' }}>
                {filtered.map(order => {
                    const items = parseItems(order.items);
                    
                    // Parse comments to separate payment method from customer comments
                    const isOnlinePayment = order.comment?.includes('[Оплата: Онлайн]');
                    const cleanComment = order.comment?.replace(/\[Оплата:.*?\]/g, '').trim();
                    const isOnlinePending = order.status === 'pending' && isOnlinePayment;
                    
                    const statusInfo = isOnlinePending ? STATUS_MAP.pending_payment : (STATUS_MAP[order.status] || STATUS_MAP.pending);
                    const nextAction = isOnlinePending ? NEXT_ACTION.pending_payment : NEXT_ACTION[order.status];
                    
                    const isExpanded = expandedId === order.id;
                    const isAssigning = assigning === order.id;

                    return (
                        <div key={order.id} className="admin-card-premium" style={{
                            opacity: (order.status === 'delivered' || order.status === 'cancelled') ? 0.75 : 1,
                            boxShadow: isExpanded 
                                ? `0 12px 30px rgba(0, 0, 0, 0.5)` 
                                : `0 4px 12px rgba(0, 0, 0, 0.2)`,
                            animation: 'fadeIn 0.3s ease-out',
                            zIndex: activeDropdownId === order.id ? 50 : (isExpanded ? 10 : 1),
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            borderLeft: `5px solid ${statusInfo.color}`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = statusInfo.color;
                            e.currentTarget.style.borderLeftColor = statusInfo.color; // ensure left stays same
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '';
                            e.currentTarget.style.borderLeftColor = statusInfo.color;
                        }}>


                            {/* Order header click area */}
                            <div
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '18px 24px 18px 29px', cursor: 'pointer', // Offset padding slightly to clear absolute left bar
                                    background: (order.status === 'pending' || isOnlinePending) 
                                        ? 'rgba(245, 158, 11, 0.02)' 
                                        : order.status === 'pending_payment' 
                                            ? 'rgba(255, 107, 53, 0.03)' 
                                            : 'transparent',
                                    transition: 'background 0.2s ease',
                                    borderRadius: '24px 24px 0 0'
                                }}
                                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ 
                                        background: `${statusInfo.color}15`, 
                                        padding: '8px', 
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `1px solid ${statusInfo.color}30`
                                    }}>
                                        <statusInfo.Icon size={20} style={{ color: statusInfo.color }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                                            Заказ #{order.id}
                                            <span className={`status-badge-capsule ${order.status}`} style={{
                                                fontSize: '0.68rem', fontWeight: 800,
                                                padding: '3px 10px', borderRadius: '8px',
                                                background: `${statusInfo.color}18`, color: statusInfo.color,
                                                border: `1px solid ${statusInfo.color}30`
                                            }}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 600 }}>
                                            {getRestName(order.restaurant_id)} · {timeSince(order.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--admin-primary)', letterSpacing: '-0.5px' }}>
                                            {Number(order.total || 0).toFixed(2)} ₾
                                        </div>
                                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem', fontWeight: 600, marginTop: '2px' }}>
                                            {items.length} поз.
                                        </div>
                                    </div>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className={`chevron-icon ${isExpanded ? 'expanded' : ''}`}
                                    >
                                        <path d="M6 9l6 6 6-6" />
                                    </svg>
                                </div>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div style={{
                                    padding: '0 24px 24px 29px', // Offset padding slightly to clear absolute left bar
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    animation: 'fadeIn 0.2s ease'
                                }}>
                                    {/* Status pipeline */}
                                    <div className="premium-stepper-container">
                                        {['pending_payment', 'pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'].map((s, i) => {
                                            const info = STATUS_MAP[s];
                                            const isCurrent = order.status === s;
                                            const isCompleted = statusInfo.step > -1 && info.step > -1 && info.step < statusInfo.step;
                                            return (
                                                <div 
                                                    key={s} 
                                                    className={`premium-step ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                                    style={{ '--step-color': info.color } as any}
                                                >
                                                    <div className="premium-step-circle">
                                                        {isCompleted ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        ) : (
                                                            i + 1
                                                        )}
                                                    </div>
                                                    <div className="premium-step-label">{info.label}</div>
                                                    {i < 6 && <div className="premium-step-line" />}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Customer info + Items */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginTop: '16px' }}>
                                        {/* Client Column */}
                                        <div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
                                                Клиент
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: 'var(--admin-primary)' }}>
                                                        {(order.customer_name || 'Г').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{order.customer_name || 'Гость'}</div>
                                                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>Имя получателя</div>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(33, 234, 124, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-primary)' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>{order.phone || '—'}</div>
                                                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>Телефон</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(33, 234, 124, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-primary)', flexShrink: 0, marginTop: '2px' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                            <circle cx="12" cy="10" r="3" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 }}>{order.address || '—'}</div>
                                                        <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>Адрес доставки</div>
                                                    </div>
                                                </div>

                                                {(order as any).apartment && (
                                                    <div style={{ 
                                                        marginLeft: '42px', 
                                                        background: 'rgba(255,255,255,0.02)', 
                                                        padding: '10px 14px', 
                                                        borderRadius: '10px', 
                                                        fontSize: '0.82rem', 
                                                        color: 'var(--admin-text-muted)',
                                                        border: '1px solid rgba(255,255,255,0.04)',
                                                        fontWeight: 600
                                                    }}>
                                                        Кв: <span style={{ color: '#fff' }}>{(order as any).apartment}</span> · 
                                                        Под: <span style={{ color: '#fff' }}>{(order as any).entrance}</span> · 
                                                        Эт: <span style={{ color: '#fff' }}>{(order as any).floor}</span> · 
                                                        Домофон: <span style={{ color: '#fff' }}>{(order as any).intercom}</span>
                                                    </div>
                                                )}

                                                {(order as any).scheduled_time && (
                                                    <div style={{ 
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        background: 'rgba(245, 158, 11, 0.04)', 
                                                        padding: '10px 14px', 
                                                        borderRadius: '10px', 
                                                        color: '#f59e0b', 
                                                        fontSize: '0.88rem', 
                                                        fontWeight: 700,
                                                        border: '1px solid rgba(245, 158, 11, 0.15)',
                                                    }}>
                                                        <span>⏰</span>
                                                        <span>Доставка ко времени: {(order as any).scheduled_time}</span>
                                                    </div>
                                                )}

                                                {/* Premium Payment Box (Unified Style) & Comment */}
                                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                                    <div style={{
                                                        flex: 1,
                                                        minWidth: '200px',
                                                        background: 'rgba(33, 234, 124, 0.04)',
                                                        border: '1px solid rgba(33, 234, 124, 0.15)',
                                                        padding: '12px 16px',
                                                        borderRadius: '12px',
                                                        color: '#21ea7c',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        display: 'flex',
                                                        gap: '10px',
                                                        alignItems: 'center'
                                                    }}>
                                                        <span style={{ fontSize: '1.2rem' }}>{isOnlinePayment ? '💳' : '💵'}</span>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>Вид оплаты</div>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                                                                {isOnlinePayment ? 'Онлайн (Оплачено)' : 'Наличными / Терминал'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {cleanComment && (
                                                        <div style={{
                                                            flex: 1,
                                                            minWidth: '200px',
                                                            background: 'rgba(245, 158, 11, 0.04)',
                                                            padding: '12px 16px',
                                                            borderRadius: '12px',
                                                            color: '#f59e0b',
                                                            fontSize: '0.85rem',
                                                            border: '1px solid rgba(245, 158, 11, 0.15)',
                                                            fontWeight: 600,
                                                            display: 'flex',
                                                            gap: '10px',
                                                            alignItems: 'flex-start'
                                                        }}>
                                                            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>💬</span>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Комментарий клиента</div>
                                                                <div style={{ color: '#fff', fontWeight: 600 }}>{cleanComment}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {(order as any).courier_comment && (
                                                    <div style={{
                                                        background: 'rgba(59, 130, 246, 0.04)',
                                                        padding: '10px 14px', borderRadius: '12px', color: '#3b82f6', fontSize: '0.85rem',
                                                        border: '1px solid rgba(59, 130, 246, 0.15)', fontWeight: 600,
                                                        display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '10px'
                                                    }}>
                                                        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🚴</span>
                                                        <div style={{ flex: 1 }}>{(order as any).courier_comment}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Items Column */}
                                        <div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
                                                Состав заказа
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {items.map((item: any, i: number) => (
                                                    <div key={i} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                        fontSize: '0.92rem', color: '#fff', fontWeight: 600
                                                    }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ 
                                                                background: 'rgba(255,255,255,0.06)', 
                                                                color: 'var(--admin-primary)', 
                                                                padding: '2px 8px', 
                                                                borderRadius: '6px', 
                                                                fontSize: '0.78rem', 
                                                                fontWeight: 800 
                                                            }}>{item.quantity}×</span>
                                                            <span>{pickKitchenText(item.name)}</span>
                                                        </span>
                                                        <span style={{ color: '#fff', fontWeight: 700 }}>
                                                            {Number(item.price * item.quantity || 0).toFixed(2)} <span style={{ color: 'var(--admin-primary)', fontSize: '0.82rem' }}>₾</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.88rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                                                <span>🍴 Приборы:</span>
                                                <span style={{ color: '#fff', fontWeight: 700 }}>{(order as any).cutlery_count ? Math.max(1, (order as any).cutlery_count) : 1} шт.</span>
                                            </div>
                                            
                                            {Number((order as any).tips || 0) > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.88rem', color: 'var(--admin-primary)', fontWeight: 700 }}>
                                                    <span>💰 Чаевые курьеру:</span>
                                                    <span>{Number((order as any).tips || 0).toFixed(2)} ₾</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions Column */}
                                        <div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
                                                Действия
                                            </div>

                                            {/* Main action button */}
                                            {nextAction && (
                                                <button
                                                    className={`admin-btn ${nextAction.style === 'payment' ? '' : 'admin-btn-primary'}`}
                                                    onClick={() => updateStatus(order.id, nextAction.status)}
                                                    disabled={isAssigning}
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '14px', 
                                                        marginBottom: '12px', 
                                                        fontSize: '0.95rem',
                                                        fontWeight: 800,
                                                        borderRadius: '14px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        ...(nextAction.style === 'payment' ? {
                                                            background: 'linear-gradient(135deg, #ff6b35 0%, #ff8552 100%)',
                                                            color: '#fff',
                                                            boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
                                                            animation: 'pulse-payment 2s infinite'
                                                        } : {
                                                            background: 'linear-gradient(135deg, var(--admin-primary) 0%, #1dd470 100%)',
                                                            color: '#0f1117',
                                                            boxShadow: '0 4px 15px rgba(33, 234, 124, 0.2)'
                                                        })
                                                    }}
                                                >
                                                    {isAssigning ? (
                                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
                                                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                                                                <path d="M4 12a8 8 0 0 1 8-8" />
                                                            </svg>
                                                            Ищем курьера...
                                                        </span>
                                                    ) : (
                                                        nextAction.label
                                                    )}
                                                </button>
                                            )}

                                            {/* Custom Dropdown selector for super_admin */}
                                            {user?.role === 'super_admin' && (
                                                <div className="status-dropdown-container" onClick={(e) => e.stopPropagation()} style={{ marginBottom: '12px' }}>
                                                    <button
                                                        className="status-dropdown-trigger"
                                                        onClick={() => setActiveDropdownId(activeDropdownId === order.id ? null : order.id)}
                                                        style={{
                                                            borderColor: activeDropdownId === order.id ? 'var(--admin-primary)' : 'rgba(255, 255, 255, 0.08)',
                                                            boxShadow: activeDropdownId === order.id ? '0 0 0 2px rgba(33, 234, 124, 0.15)' : 'none'
                                                        }}
                                                    >
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="status-dropdown-dot" style={{ background: statusInfo.color }} />
                                                            {statusInfo.label}
                                                        </span>
                                                        <svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className={`chevron-icon ${activeDropdownId === order.id ? 'expanded' : ''}`}
                                                        >
                                                            <path d="M6 9l6 6 6-6" />
                                                        </svg>
                                                    </button>

                                                    {activeDropdownId === order.id && (
                                                        <div className="status-dropdown-menu">
                                                            {Object.entries(STATUS_MAP).map(([key, val]) => {
                                                                const isSelected = order.status === key;
                                                                return (
                                                                    <div
                                                                        key={key}
                                                                        className={`status-dropdown-item ${isSelected ? 'selected' : ''}`}
                                                                        onClick={() => {
                                                                            updateStatus(order.id, key);
                                                                            setActiveDropdownId(null);
                                                                        }}
                                                                    >
                                                                        <span className="status-dropdown-dot" style={{ background: val.color }} />
                                                                        <span>{val.label}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Cancel button */}
                                            {!['delivered', 'cancelled'].includes(order.status) && (
                                                <button
                                                    className="admin-btn"
                                                    style={{
                                                        width: '100%', 
                                                        padding: '12px', 
                                                        fontSize: '0.9rem',
                                                        fontWeight: 700,
                                                        borderRadius: '14px',
                                                        background: 'rgba(255, 68, 68, 0.05)', 
                                                        color: '#ff6666',
                                                        border: '1px solid rgba(255, 68, 68, 0.15)',
                                                        transition: 'all 0.2s ease',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                                                        e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.3)';
                                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.15)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(255, 68, 68, 0.05)';
                                                        e.currentTarget.style.borderColor = 'rgba(255, 68, 68, 0.15)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                    onClick={() => cancelOrder(order.id)}
                                                >
                                                    ✕ Отменить заказ
                                                </button>
                                            )}

                                            {/* Refund button */}
                                            {order.status === 'cancelled' && (
                                                order.refund_initiated_at ? (
                                                    <div style={{
                                                        marginTop: '10px',
                                                        padding: '12px',
                                                        borderRadius: '14px',
                                                        background: 'rgba(33,234,124,0.05)',
                                                        border: '1px solid rgba(33,234,124,0.15)',
                                                        color: '#21ea7c',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 700,
                                                        textAlign: 'center',
                                                    }}>
                                                        ✓ Возврат инициирован
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="admin-btn"
                                                        style={{
                                                            width: '100%',
                                                            marginTop: '10px',
                                                            padding: '12px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 700,
                                                            borderRadius: '14px',
                                                            background: 'rgba(33, 234, 124, 0.05)',
                                                            color: '#21ea7c',
                                                            border: '1px solid rgba(33, 234, 124, 0.15)',
                                                            transition: 'all 0.2s ease',
                                                            cursor: refundingId === order.id ? 'wait' : 'pointer',
                                                            opacity: refundingId === order.id ? 0.7 : 1,
                                                        }}
                                                        disabled={refundingId === order.id}
                                                        onClick={() => initiateRefund(order.id)}
                                                    >
                                                        {refundingId === order.id ? 'Отправка…' : '↩ Вернуть средства'}
                                                    </button>
                                                )
                                            )}

                                            {/* Courier info */}
                                            {!!order.courier_id && (
                                                <div style={{
                                                    marginTop: '16px', 
                                                    padding: '14px', 
                                                    borderRadius: '14px',
                                                    background: 'rgba(33,234,124,0.03)', 
                                                    border: '1px solid rgba(33,234,124,0.12)',
                                                    display: 'flex',
                                                    gap: '10px',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{ fontSize: '1.3rem' }}>🚴</span>
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', color: '#21ea7c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Курьер назначен</div>
                                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px', color: '#fff' }}>ID: {order.courier_id}</div>
                                                    </div>
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
                @keyframes pulse-payment {
                    0% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4); }
                    50% { box-shadow: 0 0 0 8px rgba(255, 107, 53, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

function FilterBtn({ active, onClick, children }: {
    active: boolean; onClick: () => void; children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? '#21ea7c' : '#222532',
                color: active ? '#0f1117' : '#9ca3af',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '100px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = '#2a2e3d';
                    e.currentTarget.style.color = '#fff';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = '#222532';
                    e.currentTarget.style.color = '#9ca3af';
                }
            }}
        >
            {children}
        </button>
    );
}
