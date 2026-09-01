import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useStore } from '../store/useStore';
import type { Order, OrderStatus } from '../api';
import { api, resolveCourierAction } from '../api';
import {
  Phone,
  MapPin,
  ShoppingBag,
  RefreshCw,
  Package,
  ScrollText,
} from 'lucide-react';
import FullPageLoader from '../../../components/UI/FullPageLoader';
import { useLanguage } from '../../../translations/LanguageContext';
import { localizeAddressForCourier } from '../utils/localizeAddress';

const REFRESH_MS = 4000;

const STATUS_KEYS: Record<string, string> = {
  new: 'partnerApp.orders.status.new',
  confirmed: 'partnerApp.orders.status.confirmed',
  preparing: 'partnerApp.orders.status.preparing',
  ready: 'partnerApp.orders.status.ready',
  delivering: 'partnerApp.orders.status.delivering',
  delivered: 'partnerApp.orders.status.delivered',
  cancelled: 'partnerApp.orders.status.cancelled',
  picked_up: 'partnerApp.orders.status.picked_up',
  arrived: 'partnerApp.orders.status.arrived',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#a78bfa',
  ready: '#21EA7C',
  delivering: '#06b6d4',
  delivered: '#6b7280',
  cancelled: '#ef4444',
  picked_up: '#06b6d4',
  arrived: '#06b6d4',
};

function fillId(template: string, id: string) {
  return template.replace('{id}', id);
}

function phaseKey(status: OrderStatus, atRestaurant: boolean, available: boolean): string {
  if (available) return '';
  if (status === 'picked_up' || status === 'arrived') return 'partnerApp.orders.phase_delivering';
  if (status === 'ready' && atRestaurant) return 'partnerApp.orders.phase_pickup';
  if (status === 'ready') return 'partnerApp.orders.phase_to_rest';
  if (atRestaurant) return status === 'preparing' ? 'partnerApp.orders.phase_wait' : 'partnerApp.orders.phase_at_rest';
  return 'partnerApp.orders.phase_to_rest';
}

function stepperIndex(status: OrderStatus, atRestaurant: boolean, available: boolean): number {
  if (available) return 0;
  if (status === 'picked_up' || status === 'arrived') return 3;
  if (status === 'ready' && atRestaurant) return 2;
  if (atRestaurant) return 2;
  return 1;
}

export function CourierOrders() {
  const { acceptOrder, advanceCourierOrder, isOnline } = useStore();
  const { t } = useLanguage();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'available' | 'active' | 'history'>('available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const actionLabelFor = (order: Order, available: boolean): string => {
    if (available) return t('partnerApp.orders.accept');
    const action = resolveCourierAction(order.status, Boolean(order.atRestaurant));
    if (action === 'arrived_rest') return t('partnerApp.orders.arrived_rest');
    if (action === 'waiting') return t('partnerApp.orders.waiting');
    if (action === 'pick_up') return t('partnerApp.orders.picked');
    return t('partnerApp.orders.delivered_cta');
  };

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [availRes, mineRes] = await Promise.allSettled([
        api.getAvailableOrders(),
        api.getMyOrders(),
      ]);
      if (availRes.status === 'fulfilled') {
        setAvailableOrders(Array.isArray(availRes.value) ? availRes.value : []);
      } else {
        setAvailableOrders([]);
      }
      if (mineRes.status === 'fulfilled') {
        setMyOrders(Array.isArray(mineRes.value) ? mineRes.value : []);
      } else {
        setMyOrders([]);
      }

      const authFail =
        (availRes.status === 'rejected' && availRes.reason?.name === 'PartnerAuthError') ||
        (mineRes.status === 'rejected' && mineRes.reason?.name === 'PartnerAuthError');
      if (authFail) {
        setError(t('partnerApp.orders.err_session'));
        return;
      }

      if (availRes.status === 'rejected' && mineRes.status === 'rejected') {
        setError(t('partnerApp.orders.err_load'));
      } else if (availRes.status === 'rejected') {
        setError(t('partnerApp.orders.err_available'));
      } else if (mineRes.status === 'rejected') {
        setError(t('partnerApp.orders.err_mine'));
      }
    } catch {
      setError(t('partnerApp.orders.err_load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  useEffect(() => {
    const match = window.location.pathname.match(/\/partners\/order(\d+)/);
    if (match) setTab('active');
  }, []);

  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await acceptOrder(orderId);
      setTab('active');
      await fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdvance = async (order: Order) => {
    setActionLoading(order.id);
    try {
      await advanceCourierOrder(order.id, order.status, Boolean(order.atRestaurant));
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('partnerApp.orders.err_load'));
    } finally {
      setActionLoading(null);
    }
  };

  const activeOrders = myOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const historyOrders = myOrders.filter((o) => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="partner-page">
      <div className="partner-page-head">
        <div>
          <p className="partner-page-kicker">{t('partnerApp.orders.kicker')}</p>
          <h1 className="partner-page-title">{t('partnerApp.orders.title')}</h1>
        </div>
        <button type="button" className="partner-icon-btn" onClick={fetchData} disabled={loading} aria-label={t('partnerApp.orders.refresh')}>
          <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div className="partner-segments">
        <button
          type="button"
          className={`partner-seg${tab === 'available' ? ' is-active' : ''}`}
          onClick={() => setTab('available')}
        >
          {t('partnerApp.orders.tab_available')}
          {availableOrders.length > 0 && <span className="partner-seg-count">{availableOrders.length}</span>}
        </button>
        <button
          type="button"
          className={`partner-seg${tab === 'active' ? ' is-active' : ''}`}
          onClick={() => setTab('active')}
        >
          {t('partnerApp.orders.tab_active')}
          {activeOrders.length > 0 && <span className="partner-seg-count">{activeOrders.length}</span>}
        </button>
        <button
          type="button"
          className={`partner-seg${tab === 'history' ? ' is-active' : ''}`}
          onClick={() => setTab('history')}
        >
          {t('partnerApp.orders.tab_history')}
        </button>
      </div>

      {error && (
        <div className="partner-error">
          <span>{error}</span>
          <button type="button" className="partner-icon-btn" onClick={fetchData} aria-label="Retry">
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <FullPageLoader variant="list" />
      ) : tab === 'available' ? (
        !isOnline ? (
          <Empty icon={<ShoppingBag size={28} />} title={t('partnerApp.orders.empty_offline')} text="" />
        ) : availableOrders.length === 0 ? (
          <Empty icon={<ShoppingBag size={28} />} title={t('partnerApp.orders.empty_available')} text="" />
        ) : (
          availableOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              available
              actionLabel={actionLabelFor(order, true)}
              onAction={() => handleAccept(order.id)}
              loading={actionLoading === order.id}
            />
          ))
        )
      ) : tab === 'active' ? (
        activeOrders.length === 0 ? (
          <Empty icon={<Package size={28} />} title={t('partnerApp.orders.empty_active')} text="" />
        ) : (
          activeOrders.map((order) => {
            const action = resolveCourierAction(order.status, Boolean(order.atRestaurant));
            return (
              <OrderCard
                key={order.id}
                order={order}
                available={false}
                actionLabel={actionLabelFor(order, false)}
                onAction={() => handleAdvance(order)}
                loading={actionLoading === order.id}
                disabled={action === 'waiting'}
              />
            );
          })
        )
      ) : historyOrders.length === 0 ? (
        <Empty icon={<ScrollText size={28} />} title={t('partnerApp.orders.empty_history')} text="" />
      ) : (
        historyOrders.map((order) => <HistoryCard key={order.id} order={order} />)
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Empty({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="partner-empty">
      <div className="partner-empty-icon">{icon}</div>
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

function OrderCard({
  order,
  available,
  actionLabel,
  onAction,
  loading,
  disabled,
}: {
  order: Order;
  available: boolean;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { t, language } = useLanguage();
  const status = order.status;
  const atRestaurant = Boolean(order.atRestaurant);
  const color = STATUS_COLORS[status] || '#6b7280';
  const phone = String(order.phone || '').replace(/\D/g, '');
  const earn = (order.deliveryFee || 0).toFixed(0);
  const pickupLabel = order.pickupAddress
    ? localizeAddressForCourier(order.pickupAddress, language)
    : '—';
  const dropoffLabel = order.deliveryAddress
    ? localizeAddressForCourier(order.deliveryAddress, language)
    : '';
  const titleTpl = available ? t('partnerApp.orders.title_new') : t('partnerApp.orders.title_active');
  const phaseKeyName = phaseKey(status, atRestaurant, available);
  const phase = phaseKeyName ? t(phaseKeyName) : '';
  const step = stepperIndex(status, atRestaurant, available);
  const stepLabels = [
    t('partnerApp.orders.steps.accept'),
    t('partnerApp.orders.steps.at_rest'),
    t('partnerApp.orders.steps.picked'),
    t('partnerApp.orders.steps.delivered'),
  ];
  const comment = (order.comment || '').trim();
  const commentClean = comment.replace(/\[Оплата:[^\]]*\]/gi, '').trim();

  return (
    <article className="partner-order-card" style={{ borderLeftColor: color }}>
      <div className="partner-order-card-body">
        <div className="partner-order-top">
          <div>
            <p className="partner-order-id">{fillId(titleTpl, order.id)}</p>
            {phase ? <p className="partner-order-meta">{phase}</p> : null}
          </div>
          {!available && (
            <span
              className="partner-status"
              style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
            >
              {t(STATUS_KEYS[status] || 'partnerApp.orders.status.confirmed')}
            </span>
          )}
        </div>

        {!available && (
          <div className="partner-courier-steps" aria-hidden>
            {stepLabels.map((label, i) => (
              <div key={label} className={`partner-courier-step${i <= step ? ' is-on' : ''}${i === step ? ' is-current' : ''}`}>
                <span>{i + 1}</span>
                <em>{label}</em>
              </div>
            ))}
          </div>
        )}

        <div className="partner-route-row">
          <div className="partner-route-icon">
            <ShoppingBag size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="partner-route-label">{t('partnerApp.orders.pickup_label')}</div>
            <div className="partner-route-text">
              {pickupLabel}
              {order.restaurantName ? ` · ${order.restaurantName}` : ''}
            </div>
          </div>
        </div>

        <div className="partner-route-row">
          <div className="partner-route-icon is-drop">
            <MapPin size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="partner-route-label">{t('partnerApp.orders.dropoff_label')}</div>
            <div className="partner-route-text">
              {dropoffLabel || t('partnerApp.orders.address_unknown')}
            </div>
          </div>
        </div>

        <div className="partner-order-facts">
          {order.distanceKm > 0 && (
            <span>
              {t('partnerApp.orders.distance_label')}: {order.distanceKm.toFixed(1)} {t('partnerApp.orders.km')}
            </span>
          )}
          {order.deliveryFee > 0 && (
            <span>
              {t('partnerApp.orders.income_label')}: <strong>{earn} ₾</strong>
            </span>
          )}
        </div>

        <p className="partner-order-comment">
          {t('partnerApp.orders.comment_label')}:{' '}
          {commentClean || t('partnerApp.orders.comment_none')}
        </p>

        {available && order.deliveryFee > 0 && (
          <div className="partner-earn">
            <span>{t('partnerApp.orders.income_label')}</span>
            <strong>{earn} ₾</strong>
          </div>
        )}

        <button
          type="button"
          className="partner-btn-primary"
          onClick={onAction}
          disabled={loading || disabled}
        >
          {loading ? '…' : actionLabel}
        </button>

        {!available && phone.length >= 9 && (
          <a className="partner-btn-secondary" href={`tel:+${phone}`}>
            <Phone size={16} />
            {t('partnerApp.orders.call_client')}
          </a>
        )}
      </div>
    </article>
  );
}

function HistoryCard({ order }: { order: Order }) {
  const { t } = useLanguage();
  const color = STATUS_COLORS[order.status] || '#6b7280';
  const statusKey = STATUS_KEYS[order.status];
  return (
    <article className="partner-order-card" style={{ borderLeftColor: color }}>
      <div
        className="partner-order-card-body"
        style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
      >
        <div>
          <p className="partner-order-id">#{order.id}</p>
          <p className="partner-order-meta">
            {order.createdAt
              ? new Date(
                  typeof order.createdAt === 'object' && (order.createdAt as any).seconds
                    ? (order.createdAt as any).seconds * 1000
                    : order.createdAt
                ).toLocaleDateString()
              : '—'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {(order.deliveryFee || 0).toFixed(0)} ₾
          </div>
          <span className="partner-status" style={{ marginTop: 6, background: `${color}22`, color }}>
            {statusKey ? t(statusKey) : order.status}
          </span>
        </div>
      </div>
    </article>
  );
}
