import React, { useState, useEffect, useMemo } from 'react';
import './TimeModal.css';
import { useLanguage } from '../../../translations/LanguageContext';
import Sheet from '../../../components/UI/Sheet';
import { generateRestaurantSlots, type TimeSlot } from '../../../utils/workingHours';

interface TimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: string | null;
  onSelect: (timeSlot: string | null) => void;
  workingHours?: string | null;
}

const TimeModal: React.FC<TimeModalProps> = ({ isOpen, onClose, currentTime, onSelect, workingHours }) => {
  const { t, language } = useLanguage();
  const [localSelection, setLocalSelection] = useState<string | null>(currentTime);

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(currentTime);
    }
  }, [isOpen, currentTime]);

  const slots = useMemo<TimeSlot[]>(() => generateRestaurantSlots(workingHours), [workingHours, isOpen]);

  const selectedLabel =
    slots.find((s) => s.value === localSelection)?.label ||
    localSelection ||
    '—';

  // Slots span several days: label each day so 22:30 -> 10:00 isn't mistaken for today
  const dayLabel = (d: Date): string => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(d); day.setHours(0, 0, 0, 0);
    const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return t('checkout.day_today');
    if (diff === 1) return t('checkout.day_tomorrow');
    const locale = language === 'ka' ? 'ka-GE' : language === 'en' ? 'en-GB' : 'ru-RU';
    return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  };

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
    <Sheet
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={t('checkout.choose_time_title')}
      description={`${t('checkout.current_selection')} ${selectedLabel}`}
      className="checkout-sheet"
      footer={<button type="button" className="md-sheet-cta" onClick={handleFinalize}>{t('common.done')}</button>}
    >

        <div className="tm-slots-grid">
          {slots.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', color: '#9ca3af', fontSize: 14, margin: 0 }}>
              {t('checkout.no_slots')}
            </p>
          ) : (
            slots.map((slot, i) => {
              const dayKey = slot.value.slice(0, 10);
              const newDay = i === 0 || slots[i - 1].value.slice(0, 10) !== dayKey;
              return (
                <React.Fragment key={slot.value}>
                  {newDay && <p className="tm-day-label">{dayLabel(slot.start)}</p>}
                  <button
                    type="button"
                    className={`tm-slot-btn ${localSelection === slot.value ? 'active' : ''}`}
                    onClick={() => handleSlotClick(slot)}
                  >
                    {slot.label}
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

    </Sheet>
  );
};

export default TimeModal;
