import { useMemo } from 'react';
import type { Order } from '../api';
import { BarChart2, CheckCircle2, ShoppingBag, XCircle } from 'lucide-react';
import { useLanguage } from '../../../translations/LanguageContext';

interface Props {
  restaurantRevenue: number;
  activeOrders: Order[];
  historicOrders: Order[];
  onNavigate: (page: 'orders' | 'history' | string) => void;
}

function fill(template: string, n: number) {
  return template.replace('{n}', String(n));
}

export function RestaurantStatsPage({
  restaurantRevenue,
  activeOrders,
  historicOrders,
  onNavigate,
}: Props) {
  const { t } = useLanguage();
  const delivered = useMemo(
    () => historicOrders.filter((o) => o.status === 'delivered'),
    [historicOrders],
  );
  const cancelled = useMemo(
    () => [...activeOrders, ...historicOrders].filter((o) => o.status === 'cancelled'),
    [activeOrders, historicOrders],
  );
  const active = useMemo(
    () => activeOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)),
    [activeOrders],
  );
  const avgCheck = delivered.length
    ? delivered.reduce((s, o) => s + o.totalAmount, 0) / delivered.length
    : 0;

  return (
    <div className="partner-page">
      <div className="partner-page-head">
        <div>
          <p className="partner-page-kicker">{t('partnerApp.restStats.kicker')}</p>
          <h1 className="partner-page-title">{t('partnerApp.restStats.title')}</h1>
          <p className="partner-page-sub">{t('partnerApp.restStats.sub')}</p>
        </div>
      </div>

      <div className="partner-metric-grid">
        <div className="partner-metric-tile">
          <span className="partner-metric-tile__label">{t('partnerApp.restStats.revenue')}</span>
          <div className="partner-metric-tile__value">
            {restaurantRevenue.toLocaleString()} <span style={{ fontSize: '1rem', color: '#21EA7C' }}>₾</span>
          </div>
          <div className="partner-metric-tile__sub">{t('partnerApp.restStats.revenue_sub')}</div>
        </div>
        <div className="partner-metric-tile">
          <span className="partner-metric-tile__label">{t('partnerApp.restStats.avg')}</span>
          <div className="partner-metric-tile__value">
            {avgCheck.toFixed(0)} <span style={{ fontSize: '1rem', color: '#21EA7C' }}>₾</span>
          </div>
          <div className="partner-metric-tile__sub">{t('partnerApp.restStats.avg_sub')}</div>
        </div>
        <button
          type="button"
          className="partner-metric-tile"
          onClick={() => onNavigate('orders')}
          style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }}
        >
          <span className="partner-metric-tile__label">{t('partnerApp.restStats.active')}</span>
          <div className="partner-metric-tile__value">{active.length}</div>
          <div className="partner-metric-tile__sub" style={{ color: '#60a5fa' }}>
            {t('partnerApp.restStats.active_sub')}
          </div>
        </button>
        <div className="partner-metric-tile">
          <span className="partner-metric-tile__label">{t('partnerApp.restStats.cancelled')}</span>
          <div className="partner-metric-tile__value">{cancelled.length}</div>
          <div className="partner-metric-tile__sub" style={{ color: '#ef4444' }}>
            {t('partnerApp.restStats.cancelled_sub')}
          </div>
        </div>
      </div>

      <section className="partner-card">
        <div className="partner-card__head">
          <h3>
            <BarChart2 size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            {t('partnerApp.restStats.totals_title')}
          </h3>
          <p>{t('partnerApp.restStats.totals_sub')}</p>
        </div>
        <ul className="partner-fact-list">
          <li>
            <CheckCircle2 size={16} />
            <span>{fill(t('partnerApp.restStats.delivered_n'), delivered.length)}</span>
          </li>
          <li>
            <ShoppingBag size={16} />
            <span>{fill(t('partnerApp.restStats.active_n'), active.length)}</span>
          </li>
          <li>
            <XCircle size={16} />
            <span>{fill(t('partnerApp.restStats.cancelled_n'), cancelled.length)}</span>
          </li>
        </ul>
      </section>

      <button type="button" className="partner-btn-primary" onClick={() => onNavigate('history')}>
        {t('partnerApp.restStats.open_history')}
      </button>
    </div>
  );
}
