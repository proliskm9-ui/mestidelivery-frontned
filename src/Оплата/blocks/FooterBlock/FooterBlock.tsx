import React from 'react';
import './FooterBlock.css';
import { useLanguage } from '../../../translations/LanguageContext';
import AnimatedPrice from '../../../components/UI/AnimatedPrice';

interface FooterBlockProps {
  totalAmount: number;
  onPay: () => void;
}

const FooterBlock: React.FC<FooterBlockProps> = ({ totalAmount, onPay }) => {
  const { t } = useLanguage();
  return (
    <footer className="fixed-footer">
      <div className="footer-left">
        <div className={`footer-amount ${totalAmount >= 100 ? 'small-text' : ''}`}>
          <AnimatedPrice value={totalAmount} />
        </div>
        <div className="footer-label">{t('common.total')}</div>
      </div>
      <button className="footer-pay-btn" onClick={onPay} type="button">
        {t('cart.checkout_btn')}
      </button>
    </footer>
  );
};

export default FooterBlock;