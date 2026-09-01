import React, { useState, useEffect, useMemo } from 'react';
import './TimeModal.css';
import { useLanguage } from '../../../translations/LanguageContext';
import { generateRestaurantSlots, type TimeSlot } from '../../../utils/workingHours';

interface TimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: string | null;
  onSelect: (timeSlot: string | null) => void;
  workingHours?: string | null;
}

const TimeModal: React.FC<TimeModalProps> = ({ isOpen, onClose, currentTime, onSelect, workingHours }) => {
  const { t } = useLanguage();
  const [localSelection, setLocalSelection] = useState<string | null>(currentTime);

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(currentTime);
    }
  }, [isOpen, currentTime]);

  const slots = useMemo<TimeSlot[]>(() => generateRestaurantSlots(workingHours), [workingHours, isOpen]);

  if (!isOpen) return null;

  const selectedLabel =
    slots.find((s) => s.value === localSelection)?.label ||
    localSelection ||
    '—';

  const handleSlotClick = (slot: TimeSlot): void => {
    if (localSelection === slot.value) {
      setLocalSelection(null);
    } else {
      setLocalSelection(slot.value);
    }
  };

  const handleFinalize = (): void => {
    onSelect(localSelection);
    onClose();
  };

  return (
    <>
      <div className="tm-overlay active time-modal-overlay" onClick={onClose}>
        <div className="tm-bottom-sheet active time-modal-content" onClick={e => e.stopPropagation()}>
        <div className="tm-header">
          <div>
            <h2 className="tm-title">{t('checkout.choose_time_title')}</h2>
            <p className="tm-subtitle">
              {t('checkout.current_selection')} {selectedLabel}
            </p>
          </div>
        </div>

        <div className="tm-slots-grid">
          {slots.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', color: '#9ca3af', fontSize: 14, margin: 0 }}>
              Нет доступных слотов в ближайшие дни
            </p>
          ) : (
            slots.map((slot) => (
              <button
                key={slot.value}
                type="button"
                className={`tm-slot-btn ${localSelection === slot.value ? 'active' : ''}`}
                onClick={() => handleSlotClick(slot)}
              >
                {slot.label}
              </button>
            ))
          )}
        </div>

        <button type="button" className="tm-confirm-btn" onClick={handleFinalize}>
          {t('common.done')}
        </button>
      </div>
      </div>
    </>
  );
};

export default TimeModal;
