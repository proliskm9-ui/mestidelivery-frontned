import React from 'react';
import './FooterBlock.css';

interface FooterBlockProps {
  totalAmount: number;
  deliveryTime: string;
  onPay: () => void;
}

const FooterBlock: React.FC<FooterBlockProps> = ({ totalAmount, deliveryTime, onPay }) => {
  return (
    <footer className="fixed-footer">
      <div className="footer-left">
        <div className="footer-amount">{totalAmount.toFixed(2).replace('.', ',')} ₾</div>
        <div className="footer-time-row">
          <img
            src="/Assets/иконка_человек_2 пнг 32.png"
            alt="delivery"
            className="footer-time-icon"
          />
          {deliveryTime}
        </div>
      </div>
      <button className="footer-pay-btn" onClick={onPay} type="button">
        Оплатить
      </button>
    </footer>
  );
};

export default FooterBlock;