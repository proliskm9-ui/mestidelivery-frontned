import React from 'react';
import './HeaderBlock.css';
import { useLanguage } from '../../../translations/LanguageContext';
import { useRushStatus } from '../../../utils/rushStatus';
import { deliveryLabel } from '../../../utils/eta';

interface HeaderBlockProps {
  deliveryType: 'standard' | 'scheduled';
  setDeliveryType: (type: 'standard' | 'scheduled') => void;
  scheduledTime: string | null;
  scheduledDisplay?: string | null;
  setScheduledTime?: (val: string) => void;
  onOpenTimeModal: () => void;
  onBack?: () => void;
  asapDisabled?: boolean;
  closedHint?: string | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
  zoneId?: string | null;
}

const HeaderBlock: React.FC<HeaderBlockProps> = ({
  deliveryType,
  setDeliveryType,
  scheduledTime,
  scheduledDisplay,
  setScheduledTime,
  onOpenTimeModal,
  onBack,
  asapDisabled,
  closedHint,
  restaurantId,
  restaurantName,
  zoneId,
}) => {
  const { t, language } = useLanguage();
  const rush = useRushStatus(restaurantId);
  const eta = deliveryLabel({ restaurantId, restaurantName, zoneId, rush: rush.isRush }, language);
  const timeLabel = scheduledDisplay || scheduledTime;
  return (
    <section className="checkout-top">
      <header className="ho-header">
        <div className="ho-back-btn" onClick={() => onBack ? onBack() : window.history.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </div>
        <h1 className="ho-title">{t('checkout.title')}</h1>
        <div style={{ width: 44 }}></div>
      </header>

      {asapDisabled && closedHint && (
        <p style={{ margin: '0 16px 10px', color: '#f87171', fontSize: 13, fontWeight: 600 }}>
          {closedHint}. {t('checkout.closed_pick_open')}
        </p>
      )}

      <div className="time-buttons">
        <button
          className={`time-btn time-btn--standard ${deliveryType === 'standard' ? 'active' : ''}`}
          onClick={() => {
            if (asapDisabled) return;
            setDeliveryType('standard');
            if (setScheduledTime) setScheduledTime('');
          }}
          type="button"
          disabled={asapDisabled}
          style={asapDisabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
        >
          <span className="btn-title">{t('checkout.standard')}</span>
          <span className="btn-sub">{eta}</span>
        </button>

        <button
          className={`time-btn time-btn--schedule ${deliveryType === 'scheduled' ? 'active' : ''}`}
          onClick={onOpenTimeModal}
          type="button"
        >
          <span className="btn-title">{t('checkout.scheduled')}</span>
          <span className="btn-sub">
            {timeLabel ? timeLabel : t('checkout.scheduled_desc')}
          </span>
        </button>
      </div>

    </section>
  );
};

export default HeaderBlock;
