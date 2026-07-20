import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Order } from '../api';
import { api } from '../api';
import { Phone, MapPin, ChevronDown, ChevronUp, Clock, CheckCircle2, ShoppingBag } from 'lucide-react';
import FullPageLoader from '../../../components/UI/FullPageLoader';

const REFRESH_MS = 4000;

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  preparing: 'Готовится',
  ready: 'Готов к выдаче',
  delivering: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
  picked_up: 'Забран курьером',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#21EA7C',
  delivering: '#06b6d4',
  delivered: '#6b7280',
  cancelled: '#ef4444',
  picked_up: '#10b981',
};

export function CourierOrders() {
  const { acceptOrder, advanceCourierOrder, userName } = useStore();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'available' | 'active' | 'history'>('available');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [avail, mine] = await Promise.all([
        api.getAvailableOrders().catch(() => [] as Order[]),
        api.getMyOrders().catch(() => [] as Order[]),
      ]);
      setAvailableOrders(avail);
      setMyOrders(mine);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    try { await acceptOrder(orderId); await fetchData(); } finally { setActionLoading(null); }
  };

  const handleAdvance = async (orderId: string) => {
    setActionLoading(orderId);
    try { await advanceCourierOrder(orderId); await fetchData(); } finally { setActionLoading(null); }
  };

  const activeOrders = myOrders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const historyOrders = myOrders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="admin-page">
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            ЗАКАЗЫ КУРЬЕРА
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
          Привет, {userName} 👋
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', width: '100%' }}>
        <FilterBtn active={tab === 'available'} onClick={() => setTab('available')}>
          Доступные {availableOrders.length > 0 && <span style={{marginLeft: 6, background: tab === 'available' ? 'rgba(0,0,0,0.2)' : 'var(--admin-primary)', color: tab === 'available' ? 'inherit' : '#0f1117', borderRadius: 10, padding: '2px 7px', fontSize: 12, fontWeight: 700}}>{availableOrders.length}</span>}
        </FilterBtn>
        <FilterBtn active={tab === 'active'} onClick={() => setTab('active')}>
          В работе {activeOrders.length > 0 && <span style={{marginLeft: 6, background: tab === 'active' ? 'rgba(0,0,0,0.2)' : 'var(--admin-primary)', color: tab === 'active' ? 'inherit' : '#0f1117', borderRadius: 10, padding: '2px 7px', fontSize: 12, fontWeight: 700}}>{activeOrders.length}</span>}
        </FilterBtn>
        <FilterBtn active={tab === 'history'} onClick={() => setTab('history')}>
          История {historyOrders.length > 0 && <span style={{marginLeft: 6, background: tab === 'history' ? 'rgba(0,0,0,0.2)' : 'var(--admin-primary)', color: tab === 'history' ? 'inherit' : '#0f1117', borderRadius: 10, padding: '2px 7px', fontSize: 12, fontWeight: 700}}>{historyOrders.length}</span>}
        </FilterBtn>
      </div>

      {/* Content */}
      {loading ? (
        <FullPageLoader variant="list" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* AVAILABLE */}
          {tab === 'available' && (
            availableOrders.length === 0 ? (
              <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💤</div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--admin-text)' }}>Нет доступных заказов</h3>
                <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>
                  Ожидайте — новые заказы появятся автоматически
                </p>
              </div>
            ) : availableOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                actionLabel="✅ Принять заказ"
                onAction={() => handleAccept(order.id)}
                loading={actionLoading === order.id}
                showEarnings
              />
            ))
          )}

          {/* ACTIVE */}
          {tab === 'active' && (
            activeOrders.length === 0 ? (
              <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--admin-text)' }}>Нет активных заказов</h3>
                <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>Перейдите во вкладку "Доступные"</p>
              </div>
            ) : activeOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                actionLabel={order.status === 'preparing' ? '⏳ Ждем готовности' : (order.status === 'ready' || order.status === 'picked_up' ? '🛵 Забрать заказ' : '✅ Заказ доставлен')}
                onAction={() => handleAdvance(order.id)}
                loading={actionLoading === order.id}
                disabled={order.status === 'preparing'}
              />
            ))
          )}

          {/* HISTORY */}
          {tab === 'history' && (
            historyOrders.length === 0 ? (
              <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--admin-text)' }}>История пуста</h3>
              </div>
            ) : historyOrders.map(order => (
              <HistoryCard key={order.id} order={order} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order, actionLabel, onAction, loading, showEarnings, disabled,
}: {
  order: Order; actionLabel: string; onAction: () => void; loading?: boolean; showEarnings?: boolean; disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(() => {
    const match = window.location.pathname.match(/\/partners\/order(\d+)/);
    return match ? match[1] === String(order.id) : false;
  });
  const status = order.status as string;

  // Visual status step indices:
  // preparing (0) -> ready (1) -> picked_up (2) -> arrived (3) -> delivered (4)
  let activeStep = 0;
  if (status === 'preparing') activeStep = 0;
  else if (status === 'ready') activeStep = 1;
  else if (status === 'picked_up') activeStep = 2;
  else if (status === 'arrived') activeStep = 3;
  else if (status === 'delivered') activeStep = 4;

  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div 
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

      <div style={{ padding: '24px 28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 20, color: '#fff' }}>Заказ #{order.id}</span>
              {order.distanceKm && (
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>
                  📍 {order.distanceKm.toFixed(1)} км
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              {order.createdAt ? new Date(typeof order.createdAt === 'object' && (order.createdAt as any).seconds ? (order.createdAt as any).seconds * 1000 : order.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </div>
          
          <span className="status-badge" style={{
            background: `${STATUS_COLORS[status]}15`,
            color: STATUS_COLORS[status] || '#6b7280',
            border: `1px solid ${STATUS_COLORS[status]}30`,
            padding: '6px 14px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>

        {/* Visual Route Flow Step Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 24px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.01)',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.03)'
        }}>
          {[
            { label: 'Кухня', active: activeStep >= 0 },
            { label: 'Готов', active: activeStep >= 1 },
            { label: 'В пути', active: activeStep >= 2 },
            { label: 'Передача', active: activeStep >= 3 }
          ].map((step, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: idx < 3 ? 1 : undefined }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: step.active ? '#21EA7C' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: step.active ? '0 0 10px rgba(33, 234, 124, 0.4)' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {step.active ? (
                    <CheckCircle2 size={12} style={{ color: '#080c0a' }} />
                  ) : (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: step.active ? '#fff' : 'var(--admin-text-muted)' }}>{step.label}</span>
              </div>
              {idx < 3 && (
                <div style={{
                  height: 2,
                  flex: 1,
                  background: activeStep > idx ? '#21EA7C' : 'rgba(255,255,255,0.05)',
                  margin: '0 10px',
                  marginTop: -14,
                  transition: 'all 0.3s'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Addresses Route cards */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.01)', 
          borderRadius: 16, 
          padding: '18px 20px', 
          marginBottom: 20,
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16,
          border: '1px solid rgba(255,255,255,0.03)'
        }}>
          {/* Pickup */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(33, 234, 124, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShoppingBag size={16} style={{ color: '#21EA7C' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: 0.5 }}>Забрать из ресторана</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: 14, marginTop: 2 }}>{(order as any).restaurantName || 'Sunset Resto'}</div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>{order.pickupAddress || 'Тбилиси, ул. Абашидзе 25'}</div>
            </div>
            <a 
              href="tel:+995599000000" 
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--admin-text-muted)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <Phone size={14} />
            </a>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

          {/* Delivery */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={16} style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--admin-text-muted)', letterSpacing: 0.5 }}>Доставить по адресу</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: 14, marginTop: 2 }}>{order.deliveryAddress || 'Адрес не указан'}</div>
            </div>
            <a 
              href="tel:+995599111111" 
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--admin-text-muted)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <Phone size={14} />
            </a>
          </div>
        </div>

        {/* Collapsible Order Items Details */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--admin-text-muted)',
              fontSize: 12,
              fontWeight: 800,
              transition: 'all 0.15s'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              🛒 Состав заказа ({totalQty} шт) · Приборов: {totalQty}
            </span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.15)',
              borderRadius: '0 0 12px 12px',
              padding: '14px 16px',
              border: '1px solid rgba(255,255,255,0.03)',
              borderTop: 'none',
              marginTop: -2,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              {order.items && order.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  <span>{it.name} <span style={{ color: 'var(--admin-text-muted)', marginLeft: 4 }}>x{it.quantity}</span></span>
                  <span style={{ fontWeight: 700 }}>{(it.price * it.quantity).toFixed(2)} ₾</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 700 }}>
                <span>Доставка</span>
                <span>{order.deliveryFee.toFixed(2)} ₾</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#fff', fontWeight: 800 }}>
                <span>Всего к оплате</span>
                <span style={{ color: '#21EA7C' }}>{order.totalAmount.toFixed(2)} ₾</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {showEarnings && (
            <div style={{
              flex: 1, 
              background: 'rgba(33, 234, 124, 0.04)', 
              borderRadius: 14, 
              padding: '12px 16px',
              textAlign: 'center',
              border: '1px solid rgba(33, 234, 124, 0.08)'
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>Доход курьера</div>
              <div style={{ fontWeight: 900, fontSize: 20, color: '#21EA7C', marginTop: 2 }}>
                {((order.totalAmount || 0) * 0.15).toFixed(2)} ₾
              </div>
            </div>
          )}

          <button
            className="admin-btn admin-btn-primary"
            onClick={onAction}
            disabled={loading || disabled}
            style={{ 
              flex: showEarnings ? undefined : 1, 
              padding: '16px 24px', 
              borderRadius: 14, 
              opacity: (loading || disabled) ? 0.6 : 1,
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 15px rgba(33, 234, 124, 0.15)'
            }}
          >
            {loading ? '...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ order }: { order: Order }) {
  return (
    <div 
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
