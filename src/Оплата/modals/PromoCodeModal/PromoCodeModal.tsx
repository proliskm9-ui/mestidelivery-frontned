import React, { useState, useEffect, useRef } from 'react';
import './PromoCodeModal.css';
import { useLanguage } from '../../../translations/LanguageContext';

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

  if (!isOpen) return null;

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
    <>
      <div className="pc-overlay active promo-modal-overlay" onClick={onClose}>
        <div className="pc-bottom-sheet active promo-modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="pc-header">
          <div>
            <h2 className="pc-title">{t('checkout.promo_codes')}</h2>
            <p className="pc-subtitle">
              {t('checkout.current_selection')} {currentCode ? `#${currentCode}` : '—'}
            </p>
          </div>
        </div>

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

        <button
          className="pc-confirm-btn"
          onClick={handleApply}
          disabled={isButtonDisabled}
        >
          {t('checkout.promo_apply')}
        </button>

      </div>
      </div>
    </>
  );
};

export default PromoCodeModal;
