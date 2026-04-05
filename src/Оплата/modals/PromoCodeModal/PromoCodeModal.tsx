import React, { useState, useEffect, useRef } from 'react';
import './PromoCodeModal.css';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  onApply: (code: string) => void;
}

const PromoCodeModal: React.FC<PromoCodeModalProps> = ({ isOpen, onClose, currentCode, onApply }) => {
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentCode || '');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
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
      <div className="pc-overlay active" onClick={onClose}></div>

      <div className="pc-bottom-sheet active" onClick={(e) => e.stopPropagation()}>

        <div className="pc-header">
          <div>
            <h2 className="pc-title">Промокоды</h2>
            <p className="pc-subtitle">
              Текущий: {currentCode ? `#${currentCode}` : '—'}
            </p>
          </div>
        </div>

        <div className={`pc-input-wrapper ${inputValue ? 'has-value' : ''}`}>
          <label className="pc-input-label">Промокод</label>
          <input
            ref={inputRef}
            type="text"
            className="pc-input"
            placeholder={inputValue ? '' : 'Введите промокод'}
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
          Применить
        </button>

      </div>
    </>
  );
};

export default PromoCodeModal;