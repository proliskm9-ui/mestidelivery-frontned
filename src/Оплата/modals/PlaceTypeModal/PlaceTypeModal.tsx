import React from 'react';
import './PlaceTypeModal.css';

type PlaceType = 'home' | 'hotel' | 'map';

interface PlaceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: PlaceType;
  onSelectType: (type: PlaceType) => void;
}

const PlaceTypeModal: React.FC<PlaceTypeModalProps> = ({ isOpen, onClose, selectedType, onSelectType }) => {

  const getTitle = (type: PlaceType): string => {
    switch (type) {
      case 'home': return 'Дом / Квартира';
      case 'hotel': return 'Отель / Гэстхаус';
      case 'map': return 'Точка на карте';
      default: return 'Не выбрано';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="pt-overlay active" onClick={onClose}></div>

      <div className="pt-bottom-sheet active" onClick={(e) => e.stopPropagation()}>

        <div className="pt-header">
          <div>
            <h2 className="pt-title">Выбор помещения</h2>
            <p className="pt-subtitle">Текущий: {getTitle(selectedType)}</p>
          </div>
        </div>

        {/* --- Опция: Дом / Квартира --- */}
        <div
          className={`place-option ${selectedType === 'home' ? 'active' : ''}`}
          onClick={() => onSelectType('home')}
        >
          <div className="place-option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="place-option-text">
            <div className="place-option-title">Дом / Квартира</div>
            <div className="place-option-sub">Адрес, подъезд, этаж</div>
          </div>
          <div className="place-option-arrow">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M1 1L5 5L1 9" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* --- Опция: Отель / Гэстхаус --- */}
        <div
          className={`place-option ${selectedType === 'hotel' ? 'active' : ''}`}
          onClick={() => onSelectType('hotel')}
        >
          <div className="place-option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
            </svg>
          </div>
          <div className="place-option-text">
            <div className="place-option-title">Отель / Гэстхаус</div>
            <div className="place-option-sub">Поиск по названию</div>
          </div>
          <div className="place-option-arrow">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M1 1L5 5L1 9" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* --- Опция: Точка на карте --- */}
        <div
          className={`place-option ${selectedType === 'map' ? 'active' : ''}`}
          onClick={() => onSelectType('map')}
        >
          <div className="place-option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="place-option-text">
            <div className="place-option-title">Точка на карте</div>
            <div className="place-option-sub">Если адрес неизвестен</div>
          </div>
          <div className="place-option-arrow">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M1 1L5 5L1 9" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <button className="pt-confirm-btn" onClick={onClose}>
          Готово
        </button>

      </div>
    </>
  );
};

export default PlaceTypeModal;