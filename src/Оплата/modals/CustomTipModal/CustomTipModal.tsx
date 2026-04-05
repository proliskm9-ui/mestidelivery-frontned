import React, { useState, useEffect } from 'react';
import './CustomTipModal.css';

interface CustomTipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTip: number;
  onApply: (amount: number) => void;
}

const CustomTipModal: React.FC<CustomTipModalProps> = ({ isOpen, onClose, currentTip, onApply }) => {
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

  if (!isOpen) return null;

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
    <>
      <div className="ct-overlay active" onClick={onClose}></div>

      <div className="ct-bottom-sheet active" onClick={(e) => e.stopPropagation()}>
        <div className="ct-header">
          <div>
            <h2 className="ct-title">Выбор суммы</h2>
            <p className="ct-subtitle">
              Текущий: {inputValue ? `${parseFloat(inputValue).toFixed(2)} ₾` : (currentTip > 0 ? `${currentTip.toFixed(2)} ₾` : 'Без чаевых')}
            </p>
          </div>
        </div>

        <div className={`ct-input-wrapper ${inputValue ? 'has-value' : ''}`}>
          <label className="ct-input-label">Чаевые</label>
          <div className="ct-input-container">
            <div className="ct-input-wrapper-inner">
              <div className="ct-input-mirror-container">
                <span className="ct-input-mirror">{inputValue}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="ct-input"
                  placeholder={inputValue ? '' : 'Введите сумму'}
                  value={inputValue}
                  onChange={handleChange}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') handleApply();
                  }}
                  autoFocus
                />
              </div>
              {inputValue && <span className="ct-input-suffix">.00₾</span>}
            </div>
          </div>
        </div>

        <button
          className="ct-confirm-btn"
          onClick={handleApply}
          disabled={!inputValue || parseFloat(inputValue) <= 0}
        >
          Применить
        </button>
      </div>
    </>
  );
};

export default CustomTipModal;