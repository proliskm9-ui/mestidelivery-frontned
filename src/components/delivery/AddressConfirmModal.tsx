import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/translations/LanguageContext';
import { useDeliveryLocationOptional } from '../../delivery/DeliveryLocationContext';
import { detectBrowserLocation } from '../../lib/delivery/geolocation';
import { reverseGeocode } from '../../lib/delivery/reverseGeocode';
import { parseCoordinates, resolveDeliveryPrice } from '../../utils/deliveryCalculator';
import './AddressConfirmModal.css';

const LocationPicker = lazy(() => import('./LocationPicker'));

interface AddressConfirmModalProps {
  open: boolean;
  onClose: () => void;
  userAddress?: any;
  onConfirm: (address: any) => void;
  variant?: 'pc' | 'mobile';
}

const AddressConfirmModal: React.FC<AddressConfirmModalProps> = ({
  open,
  onClose,
  userAddress,
  onConfirm,
  variant = 'pc',
}) => {
  const { t } = useLanguage();
  const deliveryLoc = useDeliveryLocationOptional();

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [approxLabel, setApproxLabel] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [landmark, setLandmark] = useState('');
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [showPinTip, setShowPinTip] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const geoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipStreetSyncRef = useRef(false);

  const isOutside = zoneId === 'outside';

  const refreshZone = useCallback((la: number, ln: number) => {
    setZoneId(resolveDeliveryPrice(la, ln).zoneId);
  }, []);

  const runReverseGeocode = useCallback((la: number, ln: number) => {
    if (geoTimerRef.current) clearTimeout(geoTimerRef.current);
    abortRef.current?.abort();
    geoTimerRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setIsGeocoding(true);
      const result = await reverseGeocode(la, ln, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setIsGeocoding(false);
      if (!result) {
        setApproxLabel(t('map.mestia'));
        return;
      }
      setApproxLabel(result.displayName);
      if (!skipStreetSyncRef.current) {
        setStreet(result.street);
        setHouse(result.house);
      }
    }, 380);
  }, []);

  useEffect(() => {
    if (!open) return;

    skipStreetSyncRef.current = false;
    setFieldsOpen(false);
    setShowPinTip(true);
    setApartment(userAddress?.apartment || '');
    setEntrance(userAddress?.entrance || '');
    setLandmark(userAddress?.landmark || '');
    setStreet(userAddress?.street || '');
    setHouse(userAddress?.house || '');

    deliveryLoc?.requestGeolocation({ force: true });

    const fromAddr = parseCoordinates(userAddress?.geo);
    const fromCtx =
      deliveryLoc?.lat != null && deliveryLoc?.lng != null
        ? ([deliveryLoc.lat, deliveryLoc.lng] as [number, number])
        : null;
    const seed = fromAddr || fromCtx;

    if (seed) {
      setLat(seed[0]);
      setLng(seed[1]);
      refreshZone(seed[0], seed[1]);
      runReverseGeocode(seed[0], seed[1]);
    } else {
      setLat(null);
      setLng(null);
      setZoneId(null);
      setApproxLabel('');
      setIsDetecting(true);
      detectBrowserLocation(
        (la, ln) => {
          setLat(la);
          setLng(ln);
          setIsDetecting(false);
          refreshZone(la, ln);
          runReverseGeocode(la, ln);
        },
        () => setIsDetecting(false)
      );
    }

    const tipTimer = setTimeout(() => setShowPinTip(false), 4200);
    return () => {
      clearTimeout(tipTimer);
      if (geoTimerRef.current) clearTimeout(geoTimerRef.current);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleLocationChange = (la: number, ln: number) => {
    skipStreetSyncRef.current = false;
    setLat(la);
    setLng(ln);
    refreshZone(la, ln);
    runReverseGeocode(la, ln);
  };

  const handleDetect = () => {
    setIsDetecting(true);
    skipStreetSyncRef.current = false;
    detectBrowserLocation(
      (la, ln) => {
        setLat(la);
        setLng(ln);
        setIsDetecting(false);
        refreshZone(la, ln);
        runReverseGeocode(la, ln);
      },
      () => setIsDetecting(false)
    );
  };

  const handleConfirm = () => {
    if (lat == null || lng == null || isOutside) return;
    const geo = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const zone = resolveDeliveryPrice(lat, lng);
    const finalStreet = (street || approxLabel).trim();
    const finalHouse = (house || '').trim() || '—';
    if (!finalStreet) return;

    onConfirm({
      ...userAddress,
      street: finalStreet,
      house: finalHouse,
      apartment: apartment.trim(),
      entrance: entrance.trim(),
      landmark: landmark.trim(),
      geo,
      deliveryZone: zone.zoneId,
    });
    onClose();
  };

  if (!open) return null;

  const addressLine = isGeocoding
    ? t('common.address_resolving')
    : approxLabel || t('common.address_resolving');

  return (
    <div
      className={`addr-confirm-overlay addr-confirm-overlay--${variant}`}
      onClick={onClose}
    >
      <div
        className={`addr-confirm addr-confirm--${variant}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="addr-confirm-title"
      >
        <button
          type="button"
          className="addr-confirm__close ui-circle-btn"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="addr-confirm__map">
          <Suspense fallback={<div className="addr-confirm__map-fallback" />}>
            <LocationPicker
              lat={lat}
              lng={lng}
              height="100%"
              onLocationChange={handleLocationChange}
              autoGeolocate={false}
              onGeolocateState={setIsDetecting}
            />
          </Suspense>

          {showPinTip && (
            <div className="addr-confirm__pin-tip" role="status">
              {t('common.address_pin_tip')}
            </div>
          )}

          <button
            type="button"
            className={`addr-confirm__locate${isDetecting ? ' is-busy' : ''}`}
            onClick={handleDetect}
            disabled={isDetecting}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            <span>{isDetecting ? '...' : t('map.where_am_i')}</span>
          </button>
        </div>

        <div className="addr-confirm__sheet">
          {isOutside ? (
            <>
              <h3 className="addr-confirm__title" id="addr-confirm-title">
                {t('common.address_outside_title')}
              </h3>
              <p className="addr-confirm__sub">{t('common.address_outside_sub')}</p>
              {approxLabel && <p className="addr-confirm__approx muted">{approxLabel}</p>}
              <button
                type="button"
                className="addr-confirm__cta"
                onClick={() => setShowPinTip(true)}
              >
                {t('common.address_change')}
              </button>
            </>
          ) : (
            <>
              <h3 className="addr-confirm__title" id="addr-confirm-title">
                {t('common.address_confirm_title')}
              </h3>

              <button
                type="button"
                className={`addr-confirm__place${fieldsOpen ? ' is-open' : ''}`}
                onClick={() => setFieldsOpen((v) => !v)}
                aria-expanded={fieldsOpen}
              >
                <span className="addr-confirm__place-text">
                  <strong>{addressLine}</strong>
                  {!fieldsOpen && (
                    <span className="addr-confirm__place-note">
                      {landmark.trim()
                        ? landmark.trim()
                        : t('common.address_landmark_note')}
                    </span>
                  )}
                </span>
                <svg
                  className="addr-confirm__chev"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {fieldsOpen && (
                <div className="addr-confirm__grid" role="group" aria-label={t('common.address_confirm_title')}>
                  <input
                    className="addr-confirm__cell addr-confirm__cell--wide"
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder={t('common.address_landmark_ph')}
                    autoComplete="off"
                  />
                  <input
                    className="addr-confirm__cell"
                    type="text"
                    value={street}
                    onChange={(e) => {
                      skipStreetSyncRef.current = true;
                      setStreet(e.target.value);
                    }}
                    placeholder={t('checkout.street')}
                  />
                  <input
                    className="addr-confirm__cell"
                    type="text"
                    value={house}
                    onChange={(e) => {
                      skipStreetSyncRef.current = true;
                      setHouse(e.target.value);
                    }}
                    placeholder={t('checkout.house')}
                  />
                  <input
                    className="addr-confirm__cell"
                    type="text"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    placeholder={t('checkout.apartment')}
                  />
                  <input
                    className="addr-confirm__cell"
                    type="text"
                    value={entrance}
                    onChange={(e) => setEntrance(e.target.value)}
                    placeholder={t('map.entrance')}
                  />
                </div>
              )}

              <button
                type="button"
                className="addr-confirm__cta"
                onClick={handleConfirm}
                disabled={lat == null || lng == null || (!approxLabel && !street) || isGeocoding}
              >
                {t('common.address_all_good')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressConfirmModal;
