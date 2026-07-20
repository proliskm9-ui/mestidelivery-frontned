import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Order } from '../api';
import { api } from '../api';
import { 
  ShoppingBag, 
  History, 
  User, 
  X, 
  Check, 
  ChefHat, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import FullPageLoader from '../../../components/UI/FullPageLoader';

const REFRESH_MS = 5000;

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  preparing: 'Готовится',
  ready: 'Готов к выдаче',
  delivering: 'Доставляется',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#21EA7C',
  delivering: '#06b6d4',
  delivered: '#6b7280',
  cancelled: '#ef4444',
};

const NEXT_ACTION: Record<string, { label: string; next: string }> = {
  new: { label: '👍 Принять', next: 'confirmed' },
  confirmed: { label: '🍳 Начать готовить', next: 'preparing' },
  preparing: { label: '✅ Готово', next: 'ready' },
};

function OrderTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState('');

  const calculateElapsed = useCallback(() => {
    if (!createdAt) return '0 мин';
    const createdDate = new Date(
      typeof createdAt === 'object' && (createdAt as any).seconds 
        ? (createdAt as any).seconds * 1000 
        : createdAt
    );
    const diffMs = Date.now() - createdDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'меньше минуты';
    if (diffMins < 60) return `${diffMins} мин`;
    
    const diffHours = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    return `${diffHours} ч ${remMins} мин`;
  }, [createdAt]);

  useEffect(() => {
    setElapsed(calculateElapsed());
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 30000); // update every 30 seconds
    return () => clearInterval(interval);
  }, [calculateElapsed]);

  return <span>{elapsed}</span>;
}

export function RestaurantOrders({ defaultTab = 'active' }: { defaultTab?: 'active' | 'history' }) {
  const { cancelRestaurantOrder } = useStore();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'active' | 'history'>(defaultTab);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [active, historic] = await Promise.all([
        api.getRestaurantActiveOrders().catch(() => [] as Order[]),
        api.getRestaurantHistoricOrders().catch(() => [] as Order[]),
      ]);
      setActiveOrders(active);
      setHistoryOrders(historic);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  const handleAdvance = async (orderId: string, currentStatus: string) => {
    setActionLoading(orderId);
    try {
      let nextStatus: 'confirmed' | 'preparing' | 'ready' = 'preparing';
      if (currentStatus === 'new') nextStatus = 'confirmed';
      else if (currentStatus === 'confirmed') nextStatus = 'preparing';
      else if (currentStatus === 'preparing') nextStatus = 'ready';
      
      await api.updateOrderStatusRestaurant(orderId, nextStatus);
      await fetchData();
    } finally { 
      setActionLoading(null); 
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Отменить заказ?')) return;
    setActionLoading(`cancel-${orderId}`);
    try { await cancelRestaurantOrder(orderId); await fetchData(); } finally { setActionLoading(null); }
  };



  return (
    <div className="admin-page">
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            Заказы ресторана
          </h1>
          <button className="admin-btn-refresh" onClick={fetchData} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>{loading ? 'Обновление...' : 'Обновить'}</span>
          </button>
        </div>
        <p className="admin-subtitle" style={{ margin: 0, maxWidth: '80%' }}>
          Управление текущими заказами, мониторинг статусов и история выполненных доставок
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', width: '100%' }}>
        <FilterBtn active={tab === 'active'} onClick={() => setTab('active')}>
          Активные
        </FilterBtn>
        <FilterBtn active={tab === 'history'} onClick={() => setTab('history')}>
          История
        </FilterBtn>
      </div>

      {loading ? (
        <FullPageLoader variant="list" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {tab === 'active' && (
            (!Array.isArray(activeOrders) || activeOrders.length === 0) ? (
              <div className="admin-card" style={{ textAlign: 'center', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: 'rgba(33, 234, 124, 0.05)', 
                  border: '1px solid rgba(33, 234, 124, 0.15)', 
                  color: 'var(--admin-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '20px',
                  boxShadow: '0 8px 32px rgba(33, 234, 124, 0.03)'
                }}>
                  <ShoppingBag size={36} />
                </div>
                <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>Нет активных заказов</h3>
                <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Новые заказы появятся автоматически</p>
              </div>
            ) : activeOrders.map(order => (
              <div 
                key={order.id} 
                className="admin-card" 
                style={{ 
                  padding: 0, 
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--admin-card-border)',
                  borderLeft: `4px solid ${STATUS_COLORS[order.status] || '#6b7280'}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = STATUS_COLORS[order.status] || 'var(--admin-card-border)';
                  e.currentTarget.style.boxShadow = `0 8px 30px ${STATUS_COLORS[order.status]}12`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-card-border)';
                  e.currentTarget.style.boxShadow = 'var(--admin-shadow-sm)';
                }}
              >
                <div style={{ padding: '20px 24px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--admin-text)' }}>Заказ #{order.id}</div>
                      <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--admin-primary)', display: 'flex', alignItems: 'center' }}><User size={12} /></span>
                        Клиент · {order.createdAt ? new Date(typeof order.createdAt === 'object' && (order.createdAt as any).seconds ? (order.createdAt as any).seconds * 1000 : order.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="status-badge" style={{
                        background: `${STATUS_COLORS[order.status]}20`,
                        color: STATUS_COLORS[order.status] || '#6b7280',
                        border: `1px solid ${STATUS_COLORS[order.status]}40`,
                      }}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--admin-text)', marginTop: 8 }}>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)', borderRadius: 16, padding: '14px 18px',
                      marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ 
                              background: 'rgba(33, 234, 124, 0.1)', 
                              color: 'var(--admin-primary)', 
                              fontWeight: 800, 
                              fontSize: 12,
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: '1px solid rgba(33, 234, 124, 0.2)'
                            }}>
                              {item.quantity} шт
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 14 }}>
                              {item.name}
                            </span>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}

                  {/* Kitchen Receipt Details Panel */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 16,
                    padding: '16px',
                    marginBottom: 16,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    {/* Header line for the panel */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      borderBottom: '1px dashed rgba(255, 255, 255, 0.08)',
                      paddingBottom: 8,
                      marginBottom: 4
                    }}>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 800, 
                        color: 'var(--admin-primary)', 
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                      }}>
                        Спецификация кухни
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} шт. в заказе
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                      gap: 12,
                      fontSize: 13
                    }}>
                      {/* Cutlery field */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: 11, fontWeight: 600 }}>🍽️ ПРИБОРЫ</span>
                        <span style={{ color: 'var(--admin-text)', fontWeight: 700 }}>
                          {`${order.items.reduce((sum, item) => sum + item.quantity, 0)} компл.`}
                        </span>
                      </div>

                      {/* Courier field */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: 11, fontWeight: 600 }}>🛵 КУРЬЕР</span>
                        <span style={{ 
                          color: order.assignedCourierName ? 'var(--admin-text)' : (order.status === 'new' ? 'var(--admin-text-muted)' : 'var(--admin-warning)'), 
                          fontWeight: 700 
                        }}>
                          {order.assignedCourierName ? order.assignedCourierName : (order.status === 'new' ? 'Ожидает принятия' : 'Поиск курьера...')}
                        </span>
                      </div>

                      {/* Time Elapsed (since order creation) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ color: 'var(--admin-text-muted)', fontSize: 11, fontWeight: 600 }}>⏱️ ВРЕМЯ ОЖИДАНИЯ</span>
                        <span style={{ color: 'var(--admin-text)', fontWeight: 700 }}>
                          <OrderTimer createdAt={order.createdAt} />
                        </span>
                      </div>
                    </div>

                    {/* Order Comment - Full width below the grid */}
                    <div style={{ 
                      marginTop: 4, 
                      paddingTop: 8, 
                      borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}>
                      <span style={{ color: 'var(--admin-text-muted)', fontSize: 11, fontWeight: 600 }}>💬 КОММЕНТАРИЙ К ЗАКАЗУ</span>
                      <span style={{ 
                        color: (order as any).comment ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                        fontStyle: (order as any).comment ? 'normal' : 'italic',
                        fontSize: 13,
                        fontWeight: (order as any).comment ? 600 : 500
                      }}>
                        {(order as any).comment ? (order as any).comment : 'Комментарий отсутствует'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                    {order.status === 'new' && (
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={() => handleCancel(order.id)}
                        disabled={!!actionLoading}
                        style={{ padding: '10px 20px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                      >
                        {actionLoading === `cancel-${order.id}` ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <X size={16} />
                        )}
                        Отменить заказ
                      </button>
                    )}
                    {NEXT_ACTION[order.status] && (
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => handleAdvance(order.id, order.status)}
                        disabled={actionLoading === order.id}
                        style={{ padding: '10px 32px', borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}
                      >
                        {actionLoading === order.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <>
                            {order.status === 'new' && <Check size={18} strokeWidth={2.5} />}
                            {order.status === 'confirmed' && <ChefHat size={18} strokeWidth={2.5} />}
                            {order.status === 'preparing' && <CheckCircle2 size={18} strokeWidth={2.5} />}
                            {NEXT_ACTION[order.status].label.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {tab === 'history' && (
            (!Array.isArray(historyOrders) || historyOrders.length === 0) ? (
              <div className="admin-card" style={{ textAlign: 'center', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: 'rgba(59, 130, 246, 0.05)', 
                  border: '1px solid rgba(59, 130, 246, 0.15)', 
                  color: '#3b82f6', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '20px',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.03)'
                }}>
                  <History size={36} />
                </div>
                <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>История пуста</h3>
                <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Заказы появятся после завершения смен</p>
              </div>
            ) : historyOrders.map(order => (
              <div 
                key={order.id} 
                className="admin-card" 
                style={{ 
                  padding: '20px 24px',
                  transition: 'all 0.3s ease',
                  marginBottom: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--admin-card-border)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#fff' }}>Заказ #{order.id}</div>
                    <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                      {order.createdAt ? new Date(typeof order.createdAt === 'object' && (order.createdAt as any).seconds ? (order.createdAt as any).seconds * 1000 : order.createdAt).toLocaleDateString('ru') : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--admin-text)' }}>{order.totalAmount} ₾</div>
                    <span className="status-badge" style={{
                      background: `${STATUS_COLORS[order.status]}20`,
                      color: STATUS_COLORS[order.status] || '#6b7280',
                      fontSize: 11, marginTop: 4, display: 'block',
                    }}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
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
