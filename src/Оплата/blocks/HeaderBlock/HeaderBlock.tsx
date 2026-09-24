import React from 'react';
import { Flame } from 'lucide-react';
import './HeaderBlock.css';
import { useLanguage } from '../../../translations/LanguageContext';
import { useRushStatus, rushTitle, rushDescription } from '../../../utils/rushStatus';

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
}) => {
  const { t, language } = useLanguage();
  const rush = useRushStatus();
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
          {closedHint}. Сейчас оформить нельзя — выберите время на открытие.
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
          <span className="btn-sub">{rush.isRush ? '45-65 ' : '25-40 '}{t('checkout.min_short')}</span>
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

      {rush.isRush && (
        <div className="rush-hour-badge">
          <div className="rush-hour-header">
            <Flame className="rush-flame" size={15} strokeWidth={2.2} aria-hidden="true" />
            <span>{rushTitle(rush, language)}</span>
          </div>
          <p className="rush-hour-desc">{rushDescription(language)}</p>
        </div>
      )}
    </section>
  );
};

export default HeaderBlock;
