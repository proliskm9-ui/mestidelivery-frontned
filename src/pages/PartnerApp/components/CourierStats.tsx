import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Package, Wallet, Activity, TrendingUp } from 'lucide-react';
import { api } from '../api';
import { useStore } from '../store/useStore';
import FullPageLoader from '../../../components/UI/FullPageLoader';
import { useLanguage } from '../../../translations/LanguageContext';

interface StatsPayload {
  total_deliveries: number;
  total_tips_earned: number;
  total_order_value: number;
  active_orders: number;
  is_online: boolean;
}

export function CourierStats() {
  const { userName, historicOrders, activeOrders } = useStore();
  const { t } = useLanguage();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api.getStats();
      setStats(data);
    } catch {
      setError(t('partnerApp.stats.err'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  const localDelivered = useMemo(
    () => historicOrders.filter((o) => o.status === 'delivered'),
    [historicOrders],
  );
  const inFlight = useMemo(
    () => activeOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status) && o.assignedCourierName),
    [activeOrders],
  );

  const deliveries = stats?.total_deliveries ?? localDelivered.length;
  const tips = stats?.total_tips_earned ?? 0;
  const orderValue = stats?.total_order_value ?? localDelivered.reduce((s, o) => s + o.totalAmount, 0);
  const active = stats?.active_orders ?? inFlight.length;
  const avgCheck = deliveries > 0 ? orderValue / deliveries : 0;

  return (
    <div className="partner-page">
      <div className="partner-page-head">
        <div>
          <p className="partner-page-kicker">{t('partnerApp.stats.kicker')}</p>
          <h1 className="partner-page-title">{t('partnerApp.stats.title')}</h1>
          <p className="partner-page-sub">{userName} · {t('partnerApp.stats.sub')}</p>
        </div>
        <button type="button" className="partner-icon-btn" onClick={load} aria-label={t('partnerApp.stats.refresh')}>
          <RefreshCw size={18} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {error && (
        <div className="partner-error">
          <span>{error}</span>
          <button type="button" className="partner-icon-btn" onClick={load} aria-label={t('partnerApp.stats.refresh')}>
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {loading && !stats ? (
        <FullPageLoader variant="list" />
      ) : (
        <>
          <div className="partner-metric-grid">
            <div className="partner-metric-tile">
              <span className="partner-metric-tile__label">{t('partnerApp.stats.deliveries')}</span>
              <div className="partner-metric-tile__value">{deliveries}</div>
              <div className="partner-metric-tile__sub">{t('partnerApp.stats.deliveries_sub')}</div>
            </div>
            <div className="partner-metric-tile">
              <span className="partner-metric-tile__label">{t('partnerApp.stats.active')}</span>
              <div className="partner-metric-tile__value">{active}</div>
              <div className="partner-metric-tile__sub" style={{ color: '#60a5fa' }}>
                {t('partnerApp.stats.active_sub')}
              </div>
            </div>
            <div className="partner-metric-tile">
              <span className="partner-metric-tile__label">{t('partnerApp.stats.tips')}</span>
              <div className="partner-metric-tile__value">
                {tips.toFixed(0)} <span style={{ fontSize: '1rem', color: '#21EA7C' }}>₾</span>
              </div>
              <div className="partner-metric-tile__sub">{t('partnerApp.stats.tips_sub')}</div>
            </div>
            <div className="partner-metric-tile">
              <span className="partner-metric-tile__label">{t('partnerApp.stats.avg')}</span>
              <div className="partner-metric-tile__value">
                {avgCheck.toFixed(0)} <span style={{ fontSize: '1rem', color: '#21EA7C' }}>₾</span>
              </div>
              <div className="partner-metric-tile__sub">{t('partnerApp.stats.avg_sub')}</div>
            </div>
          </div>

          <section className="partner-card">
            <div className="partner-card__head">
              <h3>{t('partnerApp.stats.about_title')}</h3>
              <p>{t('partnerApp.stats.about_sub')}</p>
            </div>
            <ul className="partner-fact-list">
              <li>
                <Package size={16} />
                <span>{t('partnerApp.stats.fact_deliveries')}</span>
              </li>
              <li>
                <Wallet size={16} />
                <span>{t('partnerApp.stats.fact_tips')}</span>
              </li>
              <li>
                <Activity size={16} />
                <span>{t('partnerApp.stats.fact_active')}</span>
              </li>
              <li>
                <TrendingUp size={16} />
                <span>{t('partnerApp.stats.fact_payouts')}</span>
              </li>
            </ul>
          </section>

          {localDelivered.length > 0 && (
            <section className="partner-card">
              <div className="partner-card__head">
                <h3>{t('partnerApp.stats.recent_title')}</h3>
                <p>{t('partnerApp.stats.recent_sub')}</p>
              </div>
              <div className="partner-mini-list">
                {localDelivered.slice(0, 8).map((o) => (
                  <div key={o.id} className="partner-mini-row">
                    <div>
                      <strong>#{o.id}</strong>
                      <span>{o.restaurantName}</span>
                    </div>
                    <em>{o.totalAmount.toFixed(0)} ₾</em>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
