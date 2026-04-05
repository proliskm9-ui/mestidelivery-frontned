import React, { useState, useEffect, useMemo } from 'react';
import './TimeModal.css';

interface TimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: string | null;
  onSelect: (timeSlot: string | null) => void;
}

const TimeModal: React.FC<TimeModalProps> = ({ isOpen, onClose, currentTime, onSelect }) => {

  const [localSelection, setLocalSelection] = useState<string | null>(currentTime);

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(currentTime);
    }
  }, [isOpen, currentTime]);

  const slots = useMemo<string[]>(() => {
    const timeSlots: string[] = [];
    for (let hour = 10; hour <= 21; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const startHour = hour.toString().padStart(2, '0');
        const startMin = min.toString().padStart(2, '0');

        const endMinRaw = min + 20;
        let endHour = hour;
        let endMinVal = endMinRaw;

        if (endMinRaw >= 60) {
          endHour = hour + 1;
          endMinVal = endMinRaw - 60;
        }

        if (endHour <= 22) {
          const endHourStr = endHour.toString().padStart(2, '0');
          const endMinStr = endMinVal.toString().padStart(2, '0');
          timeSlots.push(`${startHour}:${startMin}-${endHourStr}:${endMinStr}`);
        }
      }
    }
    return timeSlots;
  }, []);

  if (!isOpen) return null;

  const handleSlotClick = (slot: string): void => {
    if (localSelection === slot) {
      setLocalSelection(null);
    } else {
      setLocalSelection(slot);
    }
  };

  const handleFinalize = (): void => {
    onSelect(localSelection);
    onClose();
  };

  return (
    <>
      <div className="tm-overlay active" onClick={handleFinalize}></div>

      <div className="tm-bottom-sheet active">
        <div className="tm-header">
          <div>
            <h2 className="tm-title">Выбор времени</h2>
            <p className="tm-subtitle">
              Текущий: {localSelection || '—'}
            </p>
          </div>
        </div>

        <div className="tm-slots-grid">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              className={`tm-slot-btn ${localSelection === slot ? 'active' : ''}`}
              onClick={() => handleSlotClick(slot)}
            >
              {slot}
            </button>
          ))}
        </div>

        <button className="tm-confirm-btn" onClick={handleFinalize}>
          Готово
        </button>
      </div>
    </>
  );
};

export default TimeModal;