import React from 'react';
import './FooterBlock.css';
import { useLanguage } from '../../../translations/LanguageContext';
import AnimatedPrice from '../../../components/UI/AnimatedPrice';

interface FooterBlockProps {
  totalAmount: number;
  onPay: () => void;
  /** Tap on the total opens the order breakdown. */
  onShowDetails?: () => void;
}

const FooterBlock: React.FC<FooterBlockProps> = ({ totalAmount, onPay, onShowDetails }) => {
  const { t } = useLanguage();
  return (
    <footer className="fixed-footer">
      <button type="button" className="footer-left footer-total-btn" onClick={onShowDetails} aria-label={t('checkout.summary_title')}>
        <div className={`footer-amount ${totalAmount >= 100 ? 'small-text' : ''}`}>
          <AnimatedPrice value={totalAmount} />
        </div>
        <div className="footer-label">
          {t('checkout.order_details_link')}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </div>
      </button>
      <button className="footer-pay-btn" onClick={onPay} type="button">
        {t('cart.checkout_btn')}
      </button>
    </footer>
  );
};

export default FooterBlock;