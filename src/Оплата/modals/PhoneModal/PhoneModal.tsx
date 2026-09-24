import React, { useState, useEffect } from 'react';
import '../CommentModal/CommentModal.css'; // Используем общие стили
import { useLanguage } from '../../../translations/LanguageContext';
import Sheet from '../../../components/UI/Sheet';

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

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={t('checkout.phone')}
      description={val || t('checkout.not_specified')}
      footer={<button type="button" className="md-sheet-cta" onClick={() => { onSave(val); onClose(); }}>{t('common.save')}</button>}
    >
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
    </Sheet>
  );
};

export default PhoneModal;
