import React, { useState, useEffect } from 'react';
import '../CommentModal/CommentModal.css'; // Используем общие стили
import { useLanguage } from '../../../translations/LanguageContext';

interface PhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: string;
  onSave: (val: string) => void;
}

const PhoneModal: React.FC<PhoneModalProps> = ({ isOpen, onClose, currentValue, onSave }) => {
  const { t } = useLanguage();
  const [val, setVal] = useState<string>('');

  useEffect(() => {
    if (isOpen) setVal(currentValue || '');
  }, [isOpen, currentValue]);

  const formatPhoneNumber = (input: string): string => {
    let digits = input.replace(/\D/g, '');

    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }

    if (!digits) return '';

    // --- ЛОГИКА ДЛЯ РОССИИ (+7) ---
    if (digits.startsWith('7')) {
      digits = digits.slice(0, 11);

      let formatted = '+7';
      if (digits.length > 1) {
        formatted += ' (' + digits.slice(1, 4);
      }
      if (digits.length >= 5) {
        formatted += ') ' + digits.slice(4, 7);
      }
      if (digits.length >= 8) {
        formatted += '-' + digits.slice(7, 9);
      }
      if (digits.length >= 10) {
        formatted += '-' + digits.slice(9, 11);
      }
      return formatted;
    }

    // --- ЛОГИКА ДЛЯ ДРУГИХ СТРАН ---
    else {
      digits = digits.slice(0, 15);

      let formatted = '+' + digits;

      if (digits.length > 3) {
        formatted = '+' + digits.slice(0, 3) + ' ' + digits.slice(3);

        if (digits.length > 6) {
          formatted = '+' + digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6);
        }
        if (digits.length > 10) {
          formatted = '+' + digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6, 10) + ' ' + digits.slice(10);
        }
      }

      return formatted;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const formatted = formatPhoneNumber(e.target.value);
    setVal(formatted);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="cm-overlay active phone-modal-overlay" onClick={onClose}>
      <div className="cm-bottom-sheet active phone-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cm-header">
          <div>
            <h2 className="cm-title">{t('checkout.phone')}</h2>
            <p className="cm-subtitle">{val || t('checkout.not_specified')}</p>
          </div>
          <button className="cm-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={`cm-input-wrapper ${val ? 'has-value' : ''}`}>
          <label className="cm-input-label">{t('checkout.phone_recipient')}</label>
          <input
            type="tel"
            className="cm-input"
            placeholder={t('checkout.phone_ph')}
            value={val}
            onChange={handleChange}
            maxLength={20}
          />
        </div>

        <button
          className="cm-confirm-btn"
          onClick={() => { onSave(val); onClose(); }}
        >
          {t('common.save')}
        </button>
      </div>
      </div>
    </>
  );
};

export default PhoneModal;
