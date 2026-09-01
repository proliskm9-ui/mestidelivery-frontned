import React from 'react';
import './PaymentBlock.css';
import { useLanguage } from '../../../translations/LanguageContext';
import { ENABLE_CRYPTO_PAY } from '../../../config/features';

import cashGreenIcon from '../../assets/banknote1.png';
import cashGrayIcon from '../../assets/banknote2.png';
import cardGreenIcon from '../../assets/bank-cards 1.png';
import cardGrayIcon from '../../assets/bank-cards 2.png';
import promoIcon from '../../assets/promo-code 1.png';

interface PaymentBlockProps {
  paymentMethod: 'cash' | 'card' | 'card-eu';
  setPaymentMethod: (method: 'cash' | 'card' | 'card-eu') => void;
  onOpenPromo: () => void;
  promoCode: string;
}

const PaymentBlock: React.FC<PaymentBlockProps> = ({
  paymentMethod,
  setPaymentMethod,
  onOpenPromo,
  promoCode
}) => {
  const { t } = useLanguage();

  return (
    <section className="payment-card">
      <h2 className="payment-title">{t('checkout.payment_method_title')}</h2>

      <div className="payment-content">

        {/* Кнопки выбора оплаты */}
        <div className="payment-buttons">

          {/* Кнопка Наличные */}
          <button
            type="button"
            className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('cash')}
          >
            <div className="payment-btn-icon-cash">
              <img src={paymentMethod === 'cash' ? cashGreenIcon : cashGrayIcon} alt="Cash" />
            </div>
            <div className="payment-btn-bottom">
              <span className="payment-btn-text">{t('checkout.cash_courier')}</span>
            </div>
          </button>

          <button
            type="button"
            className={`payment-btn ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            <div className="payment-btn-icon-card">
              <img src={paymentMethod === 'card' ? cardGreenIcon : cardGrayIcon} alt="Card" />
            </div>
            <div className="payment-btn-bottom">
              <span className="payment-btn-text">{t('checkout.card_rus_eu')}</span>
              <div className="payment-btn-logo">
                <img src="/Assets/apple-touch-icon.png" alt="Card" />
              </div>
            </div>
          </button>

          {ENABLE_CRYPTO_PAY ? (
            <button
              type="button"
              className={`payment-btn ${paymentMethod === 'card-eu' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card-eu')}
            >
              <div className="payment-btn-icon-crypto">
                <img
                  src="/Assets/cryptowallet_icon.png"
                  alt="Crypto"
                  style={{
                    filter: paymentMethod === 'card-eu' ? 'none' : 'grayscale(1) brightness(0.7)'
                  }}
                />
              </div>
              <div className="payment-btn-bottom">
                <span className="payment-btn-text">{t('checkout.crypto')}</span>
                <div className="payment-btn-logo">
                  <img src="/Assets/apple-touch-icon.png" alt="Card" />
                </div>
              </div>
            </button>
          ) : null}
        </div>

        {/* Строка Промокоды */}
        <div className="promo-row" onClick={onOpenPromo}>
          <div className="promo-row-inner">
            <div className="promo-icon-placeholder">
              <img src={promoIcon} alt="" />
            </div>

            {/* Контейнер для текста и лейбла */}
            <div className="promo-text-container">
              {promoCode && <span className="promo-label">{t('checkout.promo_code')}</span>}
              <span className={`promo-text ${promoCode ? 'active' : ''}`}>
                {promoCode ? `#${promoCode}` : t('checkout.promo_codes')}
              </span>
            </div>

            <div className="spacer"></div>

            <div className="promo-arrow">
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path d="M1 1L5 5L1 9" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="promo-line"></div>

      </div>
    </section>
  );
};

export default PaymentBlock;