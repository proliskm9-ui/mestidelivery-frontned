import React, { useState, useEffect, useRef } from 'react';
import './PromoCodeModal.css';
import { useLanguage } from '../../../translations/LanguageContext';
import Sheet from '../../../components/UI/Sheet';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  onApply: (code: string) => void;
}

const PromoCodeModal: React.FC<PromoCodeModalProps> = ({ isOpen, onClose, currentCode, onApply }) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentCode || '');
    }
  }, [isOpen, currentCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  const handleApply = (): void => {
    onApply(inputValue.trim());
    onClose();
  };

  const isInputEmpty = !inputValue.trim();
  const hasCurrentCode = !!currentCode;

  const isButtonDisabled = isInputEmpty && !hasCurrentCode;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={t('checkout.promo_codes')}
      description={`${t('checkout.current_selection')} ${currentCode ? `#${currentCode}` : '—'}`}
      className="checkout-sheet"
      footer={<button type="button" className="md-sheet-cta" onClick={handleApply} disabled={isButtonDisabled}>{t('checkout.promo_apply')}</button>}
    >

        <div className={`pc-input-wrapper ${inputValue ? 'has-value' : ''}`}>
          <label className="pc-input-label">{t('checkout.promo_code')}</label>
          <input
            ref={inputRef}
            type="text"
            className="pc-input"
            placeholder={inputValue ? '' : t('checkout.promo_placeholder')}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && !isButtonDisabled) handleApply();
            }}
          />
        </div>
    </Sheet>
  );
};

export default PromoCodeModal;
