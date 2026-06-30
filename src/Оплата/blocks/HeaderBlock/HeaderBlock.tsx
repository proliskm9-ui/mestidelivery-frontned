import React from 'react';
import './HeaderBlock.css';
import { useLanguage } from '../../../translations/LanguageContext';

interface HeaderBlockProps {
  deliveryType: 'standard' | 'scheduled';
  setDeliveryType: (type: 'standard' | 'scheduled') => void;
  scheduledTime: string | null;
  setScheduledTime?: (val: string) => void;
  onOpenTimeModal: () => void;
  onBack?: () => void;
}

const HeaderBlock: React.FC<HeaderBlockProps> = ({ deliveryType, setDeliveryType, scheduledTime, setScheduledTime, onOpenTimeModal, onBack }) => {
  const { t } = useLanguage();
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

      <div className="time-buttons">
        <button
          className={`time-btn time-btn--standard ${deliveryType === 'standard' ? 'active' : ''}`}
          onClick={() => {
            setDeliveryType('standard');
            if (setScheduledTime) setScheduledTime('');
          }}
          type="button"
        >
          <span className="btn-title">{t('checkout.standard')}</span>
          <span className="btn-sub">25-30 {t('checkout.min_short')}</span>
        </button>

        <button
          className={`time-btn time-btn--schedule ${deliveryType === 'scheduled' ? 'active' : ''}`}
          onClick={onOpenTimeModal}
          type="button"
        >
          <span className="btn-title">{t('checkout.scheduled')}</span>
          <span className="btn-sub">
            {scheduledTime ? scheduledTime : t('checkout.scheduled_desc')}
          </span>
        </button>
      </div>
    </section>
  );
};

export default HeaderBlock;