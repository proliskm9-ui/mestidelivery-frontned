import React, { useState, useEffect } from 'react';
import './CustomTipModal.css';
import { useLanguage } from '../../../translations/LanguageContext';
import Sheet from '../../../components/UI/Sheet';

interface CustomTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTip: number;
  onApply: (amount: number) => void;
}

const CustomTipModal: React.FC<CustomTipModalProps> = ({ isOpen, onClose, currentTip, onApply }) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (currentTip > 0 && currentTip % 1 === 0) {
        setInputValue(currentTip.toString());
      } else {
        setInputValue('');
      }
    }
  }, [isOpen, currentTip]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setInputValue(val);
    }
  };

  const handleApply = (): void => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue > 0) {
      onApply(numValue);
      onClose();
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={t('checkout.select_amount')}
      description={`${t('checkout.current_selection')} ${inputValue ? `${parseFloat(inputValue).toFixed(2)} ₾` : (currentTip > 0 ? `${currentTip.toFixed(2)} ₾` : t('checkout.no_tips'))}`}
      className="checkout-sheet"
      footer={<button type="button" className="md-sheet-cta" onClick={handleApply} disabled={!inputValue || parseFloat(inputValue) <= 0}>{t('menu.apply')}</button>}
    >

        <div className={`ct-input-wrapper ${inputValue ? 'has-value' : ''}`}>
          <label className="ct-input-label">{t('checkout.tips_title')}</label>
          <div className="ct-input-container">
            <div className="ct-input-wrapper-inner">
              <div className="ct-input-mirror-container">
                <span className="ct-input-mirror">{inputValue}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="ct-input"
                  placeholder={inputValue ? '' : t('checkout.enter_amount')}
                  value={inputValue}
                  onChange={handleChange}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') handleApply();
                  }}
                />
              </div>
              {inputValue && <span className="ct-input-suffix">.00₾</span>}
            </div>
          </div>
        </div>

    </Sheet>
  );
};

export default CustomTipModal;
