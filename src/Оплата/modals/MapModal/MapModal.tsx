import React, { useCallback, useEffect, useState } from 'react';
import './MapModal.css';
import { useLanguage } from '../../../translations/LanguageContext';
import LocationPicker from '../../../components/delivery/LocationPicker';
import { detectBrowserLocation } from '../../../lib/delivery/geolocation';
import { resolveDeliveryPrice, parseCoordinates } from '../../../utils/deliveryCalculator';
import type { Language } from '../../../translations/LanguageContext';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (geoString: string, coords: [number, number], zoneId: string, deliveryPrice: number, preliminary: boolean) => void;
  initialGeo?: string;
}

const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, onConfirm, initialGeo }) => {
  const { t, language } = useLanguage();
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [pinSet, setPinSet] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const parsed = parseCoordinates(initialGeo);
    if (parsed) {
      setLat(parsed[0]);
      setLng(parsed[1]);
      setPinSet(true);
    } else {
      setLat(null);
      setLng(null);
      setPinSet(false);
    }
  }, [isOpen, initialGeo]);

  const handleLocationChange = useCallback((nextLat: number, nextLng: number) => {
    setLat(nextLat);
    setLng(nextLng);
    setPinSet(true);
  }, []);

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    detectBrowserLocation(
      (nextLat, nextLng) => {
        handleLocationChange(nextLat, nextLng);
        setIsDetectingLocation(false);
      },
      () => setIsDetectingLocation(false)
    );
  };

  if (!isOpen) return null;

  const zone =
    pinSet && lat != null && lng != null ? resolveDeliveryPrice(lat, lng) : null;
  const lang = (language || 'ru') as Language;
  const zoneLabel = zone
    ? zone.zoneName[lang] || zone.zoneName.ru
    : null;

  return (
    <div className={`mm-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className={`mm-bottom-sheet ${isOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="mm-header">
          <div>
            <h2 className="mm-title">{t('checkout.address_point_map')}</h2>
            <p className="mm-subtitle">{t('map.specify_location')}</p>
          </div>
        </div>

        <div className="mm-map-container">
          <LocationPicker
            lat={lat}
            lng={lng}
            onLocationChange={handleLocationChange}
            height={260}
            autoGeolocate={!initialGeo}
            onGeolocateState={setIsDetectingLocation}
          />
          <button
            className={`mm-detect-btn ${isDetectingLocation ? 'is-detecting' : ''}`}
            onClick={handleDetectLocation}
            disabled={isDetectingLocation}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            <span>{isDetectingLocation ? '...' : t('map.where_am_i')}</span>
          </button>
        </div>

        {zone && (
          <div className={`mm-zone-banner ${zone.preliminary ? 'is-prelim' : ''}`}>
            <span>
              {zone.preliminary
                ? t('delivery.outside_zone')
                : `${zoneLabel} — ${zone.price.toFixed(0)} ₾`}
            </span>
            {zone.preliminary && (
              <a
                href="https://t.me/MestigoSupport_Bot"
                target="_blank"
                rel="noopener noreferrer"
                className="mm-zone-tg"
                onClick={(e) => e.stopPropagation()}
              >
                {t('delivery.clarify_telegram')}
              </a>
            )}
          </div>
        )}

        <button
          className="mm-confirm-btn"
          type="button"
          disabled={!pinSet || lat == null || lng == null}
          onClick={() => {
            if (lat == null || lng == null || !zone) return;
            const geo = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onConfirm(geo, [lat, lng], zone.zoneId, zone.price, !!zone.preliminary);
          }}
        >
          {t('map.confirm_location')}
        </button>
      </div>
    </div>
  );
};

export default MapModal;
