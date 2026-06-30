import React, { useState, useEffect } from 'react';
import { YMaps, Map } from '@pbe/react-yandex-maps';
import './MapModal.css';
import { useLanguage } from '../../../translations/LanguageContext';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (geoString: string) => void;
  initialGeo?: string;
}

const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, onConfirm, initialGeo }) => {
  const { t } = useLanguage();
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCurrentLocation(initialGeo || '');
    }
  }, [isOpen, initialGeo]);

  const handleMapBoundsChange = (e: any) => {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    const center = e.get('target').getCenter();
    ymaps.geocode(center).then((res: any) => {
      const firstGeoObject = res.geoObjects.get(0);
      if (firstGeoObject) {
        const street = firstGeoObject.getThoroughfare() || firstGeoObject.getPremise() || '';
        const house = firstGeoObject.getPremiseNumber() || '';
        const locString = [street, house].filter(Boolean).join(', ');
        if (locString) {
          setCurrentLocation(locString);
        }
      }
    });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const ymaps = (window as any).ymaps;
      if (ymaps && ymaps.geocode) {
        ymaps.geocode([latitude, longitude]).then((res: any) => {
          const firstGeoObject = res.geoObjects.get(0);
          if (firstGeoObject) {
            const street = firstGeoObject.getThoroughfare() || firstGeoObject.getPremise() || '';
            const house = firstGeoObject.getPremiseNumber() || '';
            const locString = [street, house].filter(Boolean).join(', ');
            if (locString) {
              setCurrentLocation(locString);
            }
          }
        }).finally(() => setIsDetectingLocation(false));
      } else {
        setIsDetectingLocation(false);
      }
    }, () => {
      setIsDetectingLocation(false);
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`mm-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
        <div className={`mm-bottom-sheet ${isOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="mm-header">
            <div>
               <h2 className="mm-title">{t('checkout.address_point_map')}</h2>
               <p className="mm-subtitle">{t('map.specify_location')}</p>
            </div>
          </div>

          <div className="mm-map-container">
            <YMaps query={{ apikey: 'd2c1ea35-43ea-42b7-a35b-d36cfae4f808', lang: 'ru_RU' }}>
              <Map
                defaultState={{ center: [43.0445, 42.7278], zoom: 16 }}
                width="100%"
                height="100%"
                onBoundsChange={handleMapBoundsChange}
              >
                <div className="map-center-marker" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', zIndex: 10, pointerEvents: 'none' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#111"></path>
                    <circle cx="12" cy="10" r="3" fill="#21EA7C"></circle>
                  </svg>
                </div>
              </Map>
            </YMaps>
            <button
              className={`mm-detect-btn ${isDetectingLocation ? 'is-detecting' : ''}`}
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
              <span>{isDetectingLocation ? '...' : t('map.where_am_i')}</span>
            </button>
          </div>

          <button
            className="mm-confirm-btn"
            onClick={() => onConfirm(currentLocation)}
          >
            {t('map.confirm_location')}
          </button>
        </div>
      </div>
    </>
  );
};

export default MapModal;
