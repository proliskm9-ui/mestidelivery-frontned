import React from 'react';
import './HeaderBlock.css';

interface HeaderBlockProps {
    deliveryType: 'standard' | 'scheduled';
    setDeliveryType: (type: 'standard' | 'scheduled') => void;
    scheduledTime: string | null;
    setScheduledTime: (time: string | null) => void;
    onOpenTimeModal: () => void;
    onBack?: () => void;
}

const HeaderBlock: React.FC<HeaderBlockProps> = ({
    deliveryType,
    setDeliveryType,
    scheduledTime,
    setScheduledTime,
    onOpenTimeModal,
    onBack
}) => {
    return (
        <section className="checkout-top">
            {/* Back Button */}
            <button className="back-btn" onClick={onBack} aria-label="Back">
                <svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8.5H1M1 8.5L8.5 16M1 8.5L8.5 1" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <h1 className="checkout-title">Оформление заказа</h1>

            <div className="time-buttons">
                <button
                    className={`time-btn time-btn--standard ${deliveryType === 'standard' ? 'active' : ''}`}
                    onClick={() => {
                        setDeliveryType('standard');
                        if (setScheduledTime) setScheduledTime(null);
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
