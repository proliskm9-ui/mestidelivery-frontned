import React from 'react';
import './HeaderBlock.css';

interface HeaderBlockProps {
  deliveryType: 'standard' | 'scheduled';
  setDeliveryType: (type: 'standard' | 'scheduled') => void;
  scheduledTime: string | null;
  setScheduledTime?: (val: string) => void;
  onOpenTimeModal: () => void;
  onBack?: () => void;
}

const HeaderBlock: React.FC<HeaderBlockProps> = ({ deliveryType, setDeliveryType, scheduledTime, setScheduledTime, onOpenTimeModal, onBack }) => {
  return (
    <section className="checkout-top">
      <header className="ho-header">
        <div className="ho-back-btn" onClick={() => onBack ? onBack() : window.history.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </div>
        <h1 className="ho-title">Оформление</h1>
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
          <span className="btn-title">Стандарт</span>
          <span className="btn-sub">25-30 мин</span>
        </button>

        <button
          className={`time-btn time-btn--schedule ${deliveryType === 'scheduled' ? 'active' : ''}`}
          onClick={onOpenTimeModal}
          type="button"
        >
          <span className="btn-title">Ко времени</span>
          <span className="btn-sub">
            {scheduledTime ? scheduledTime : 'Выбрать время'}
          </span>
        </button>
      </div>
    </section>
  );
};

export default HeaderBlock;