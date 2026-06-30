import React from 'react';
import './PlaceTypeModal.css';
import { useLanguage } from '../../../translations/LanguageContext';

type PlaceType = 'home' | 'hotel' | 'map';

interface PlaceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: PlaceType;
  onSelectType: (type: PlaceType) => void;
}

const PlaceTypeModal: React.FC<PlaceTypeModalProps> = ({ isOpen, onClose, selectedType, onSelectType }) => {
  const { t } = useLanguage();

  const getTitle = (type: PlaceType): string => {
    switch (type) {
      case 'home': return t('checkout.place_home');
      case 'hotel': return t('checkout.address_hotel_guest');
      case 'map': return t('checkout.address_point_map');
      default: return t('checkout.not_chosen');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="pt-overlay active place-modal-overlay" onClick={onClose}>
        <div className="pt-bottom-sheet active place-modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="pt-header">
          <div>
            <h2 className="pt-title">{t('checkout.select_premise')}</h2>
            <p className="pt-subtitle">{t('checkout.current_selection')} {getTitle(selectedType)}</p>
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
            <div className="place-option-title">{t('checkout.place_home')}</div>
            <div className="place-option-sub">{t('checkout.place_home_desc')}</div>
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
            <div className="place-option-title">{t('checkout.address_hotel_guest')}</div>
            <div className="place-option-sub">{t('checkout.place_hotel_desc')}</div>
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
            <div className="place-option-title">{t('checkout.address_point_map')}</div>
            <div className="place-option-sub">{t('checkout.place_map_desc')}</div>
          </div>
          <div className="place-option-arrow">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M1 1L5 5L1 9" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <button className="pt-confirm-btn" onClick={onClose}>
          {t('common.done')}
        </button>

      </div>
      </div>
    </>
  );
};

export default PlaceTypeModal;
