import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Order } from '../api';
import { api } from '../api';
import {
  ShoppingBag,
  History,
  Check,
  ChefHat,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import FullPageLoader from '../../../components/UI/FullPageLoader';
import { pickKitchenText } from '../../../utils/i18nContent';

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
  preparing: '#a78bfa',
  ready: '#21EA7C',
  delivering: '#06b6d4',
  delivered: '#6b7280',
  cancelled: '#ef4444',
};

const NEXT_ACTION: Record<string, { label: string; next: string }> = {
  new: { label: 'Принять', next: 'confirmed' },
  confirmed: { label: 'Начать готовить', next: 'preparing' },
  preparing: { label: 'Готово к выдаче', next: 'ready' },
};

function OrderTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState('');

  const calculateElapsed = useCallback(() => {
    if (!createdAt) return '0м';
    const createdDate = new Date(
      typeof createdAt === 'object' && (createdAt as any).seconds
        ? (createdAt as any).seconds * 1000
        : createdAt
    );
    const diffMins = Math.floor((Date.now() - createdDate.getTime()) / 60000);
    if (diffMins < 1) return '<1м';
    if (diffMins < 60) return `${diffMins}м`;
    return `${Math.floor(diffMins / 60)}ч ${diffMins % 60}м`;
  }, [createdAt]);

  useEffect(() => {
    setElapsed(calculateElapsed());
    const interval = setInterval(() => setElapsed(calculateElapsed()), 30000);
    return () => clearInterval(interval);
  }, [calculateElapsed]);

  return <span className="partner-timer">{elapsed}</span>;
}

function itemsPreview(order: Order): string {
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) return 'Состав не указан';
  const parts = items.slice(0, 2).map((it) => `${pickKitchenText(it.name)} ×${it.quantity}`);
  const more = items.length > 2 ? ` · +${items.length - 2}` : '';
  return parts.join(', ') + more;
}

export function RestaurantOrders({ defaultTab = 'active' }: { defaultTab?: 'active' | 'history' }) {
  const { cancelRestaurantOrder } = useStore();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'active' | 'history'>(defaultTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [active, historic] = await Promise.all([
        api.getRestaurantActiveOrders(),
        api.getRestaurantHistoricOrders(),
      ]);
      setActiveOrders(Array.isArray(active) ? active : []);
      setHistoryOrders(Array.isArray(historic) ? historic : []);
    } catch {
      setError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
    setActionLoading(`cancel-${orderId}`);
    try {
      await cancelRestaurantOrder(orderId);
      setConfirmCancelId(null);
      await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="partner-page">
      <div className="partner-page-head">
        <div>
          <p className="partner-page-kicker">Кухня</p>
          <h1 className="partner-page-title">Заказы</h1>
          <p className="partner-page-sub">Активные и история смены</p>
        </div>
        <button
          type="button"
          className="partner-icon-btn"
          onClick={fetchData}
          disabled={loading}
          aria-label="Обновить"
        >
          <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div className="partner-segments">
        <button
          type="button"
          className={`partner-seg${tab === 'active' ? ' is-active' : ''}`}
          onClick={() => setTab('active')}
        >
          Активные
          {activeOrders.length > 0 && <span className="partner-seg-count">{activeOrders.length}</span>}
        </button>
        <button
          type="button"
          className={`partner-seg${tab === 'history' ? ' is-active' : ''}`}
          onClick={() => setTab('history')}
        >
          История
        </button>
      </div>

      {error && (
        <div className="partner-error">
          <span>{error}</span>
          <button type="button" className="partner-icon-btn" onClick={fetchData} aria-label="Повторить">
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <FullPageLoader variant="list" />
      ) : tab === 'active' ? (
        activeOrders.length === 0 ? (
          <div className="partner-empty">
            <div className="partner-empty-icon">
              <ShoppingBag size={28} />
            </div>
            <h3>Нет активных заказов</h3>
            <p>Новые появятся здесь автоматически</p>
          </div>
        ) : (
          activeOrders.map((order) => {
            const color = STATUS_COLORS[order.status] || '#6b7280';
            const expanded = expandedId === order.id;
            const qty = (order.items || []).reduce((s, it) => s + it.quantity, 0);
            return (
              <article
                key={order.id}
                className="partner-order-card"
                style={{ borderLeftColor: color }}
              >
                <div className="partner-order-card-body">
                  <div className="partner-order-top">
                    <div>
                      <p className="partner-order-id">#{order.id}</p>
                      <p className="partner-order-meta">
                        {qty} поз. ·{' '}
                        {order.createdAt
                          ? new Date(
                              typeof order.createdAt === 'object' && (order.createdAt as any).seconds
                                ? (order.createdAt as any).seconds * 1000
                                : order.createdAt
                            ).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="partner-timer-label">Ожидание</div>
                      <OrderTimer createdAt={order.createdAt} />
                      <div style={{ marginTop: 8 }}>
                        <span
                          className="partner-status"
                          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="partner-items-preview">{itemsPreview(order)}</p>

                  {NEXT_ACTION[order.status] && (
                    <button
                      type="button"
                      className="partner-btn-primary"
                      onClick={() => handleAdvance(order.id, order.status)}
                      disabled={actionLoading === order.id}
                    >
                      {actionLoading === order.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          {order.status === 'new' && <Check size={18} strokeWidth={2.5} />}
                          {order.status === 'confirmed' && <ChefHat size={18} strokeWidth={2.5} />}
                          {order.status === 'preparing' && <CheckCircle2 size={18} strokeWidth={2.5} />}
                          {NEXT_ACTION[order.status].label}
                        </>
                      )}
                    </button>
                  )}

                  {order.status === 'new' && confirmCancelId !== order.id && (
                    <button
                      type="button"
                      className="partner-btn-danger"
                      onClick={() => setConfirmCancelId(order.id)}
                      disabled={!!actionLoading}
                    >
                      <X size={16} />
                      Отменить
                    </button>
                  )}

                  {confirmCancelId === order.id && (
                    <div className="partner-confirm-bar">
                      <p>Отменить заказ #{order.id}?</p>
                      <div className="partner-confirm-actions">
                        <button type="button" onClick={() => setConfirmCancelId(null)}>
                          Назад
                        </button>
                        <button
                          type="button"
                          className="is-danger"
                          onClick={() => handleCancel(order.id)}
                          disabled={actionLoading === `cancel-${order.id}`}
                        >
                          {actionLoading === `cancel-${order.id}` ? '…' : 'Отменить'}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="partner-btn-ghost"
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                  >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {expanded ? 'Свернуть' : 'Подробнее'}
                  </button>

                  {expanded && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--p-muted)' }}>
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: 'var(--p-text)' }}>Курьер:</strong>{' '}
                        {order.assignedCourierName || (order.status === 'new' ? 'ожидает принятия' : 'поиск…')}
                      </div>
                      {(order as any).comment ? (
                        <div>
                          <strong style={{ color: 'var(--p-text)' }}>Комментарий:</strong>{' '}
                          {(order as any).comment}
                        </div>
                      ) : null}
                      <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
                        {(order.items || []).map((it, i) => (
                          <li key={i} style={{ marginBottom: 4, color: 'var(--p-text)', fontWeight: 600 }}>
                            {pickKitchenText(it.name)} ×{it.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )
      ) : historyOrders.length === 0 ? (
        <div className="partner-empty">
          <div className="partner-empty-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>
            <History size={28} />
          </div>
          <h3>История пуста</h3>
          <p>Завершённые заказы появятся здесь</p>
        </div>
      ) : (
        historyOrders.map((order) => {
          const color = STATUS_COLORS[order.status] || '#6b7280';
          return (
            <article key={order.id} className="partner-order-card" style={{ borderLeftColor: color }}>
              <div className="partner-order-card-body" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p className="partner-order-id">#{order.id}</p>
                  <p className="partner-order-meta">
                    {order.createdAt
                      ? new Date(
                          typeof order.createdAt === 'object' && (order.createdAt as any).seconds
                            ? (order.createdAt as any).seconds * 1000
                            : order.createdAt
                        ).toLocaleDateString('ru')
                      : '—'}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{order.totalAmount} ₾</div>
                  <span
                    className="partner-status"
                    style={{ marginTop: 6, background: `${color}22`, color }}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>
            </article>
          );
        })
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
