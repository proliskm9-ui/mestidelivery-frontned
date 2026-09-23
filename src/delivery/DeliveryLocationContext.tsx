import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { resolveDeliveryPrice } from '../utils/deliveryCalculator';
import { detectBrowserLocation } from '../lib/delivery/geolocation';
import type { ZonePriceResult } from '../types/delivery';

const STORAGE_KEY = 'delivery_location_v1';

export type DeliveryGeoStatus =
  | 'idle'
  | 'locating'
  | 'ready'
  | 'denied'
  | 'unsupported';

export interface DeliveryLocationState {
  lat: number | null;
  lng: number | null;
  zoneId: string | null;
  fee: number | null;
  preliminary: boolean;
  status: DeliveryGeoStatus;
  zoneName: ZonePriceResult['zoneName'] | null;
}

interface DeliveryLocationContextValue extends DeliveryLocationState {
  requestGeolocation: (opts?: { force?: boolean }) => void;
  setManualLocation: (lat: number, lng: number) => void;
  etaLabel: string;
}

const DeliveryLocationContext = createContext<DeliveryLocationContextValue | null>(null);

let geoInFlight = false;

function readStored(): Partial<DeliveryLocationState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persist(payload: {
  lat: number;
  lng: number;
  zoneId: string;
  fee: number;
  preliminary: boolean;
  zoneName: ZonePriceResult['zoneName'];
}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  try {
    const addrRaw = localStorage.getItem('user_address');
    const addr = addrRaw ? JSON.parse(addrRaw) : {};
    localStorage.setItem(
      'user_address',
      JSON.stringify({
        ...addr,
        geo: `${payload.lat.toFixed(6)}, ${payload.lng.toFixed(6)}`,
        deliveryZone: payload.zoneId,
      })
    );
  } catch {
    /* ignore */
  }
}

function applyCoords(lat: number, lng: number) {
  const zone = resolveDeliveryPrice(lat, lng);
  persist({
    lat,
    lng,
    zoneId: zone.zoneId,
    fee: zone.price,
    preliminary: !!zone.preliminary,
    zoneName: zone.zoneName,
  });
  return {
    lat,
    lng,
    zoneId: zone.zoneId,
    fee: zone.price,
    preliminary: !!zone.preliminary,
    zoneName: zone.zoneName,
    status: 'ready' as const,
  };
}

function parseGeoFromAddress(): [number, number] | null {
  try {
    const addrRaw = localStorage.getItem('user_address');
    if (!addrRaw) return null;
    const addr = JSON.parse(addrRaw);
    const match = String(addr.geo || '').match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    if (!match) return null;
    const a = parseFloat(match[1]);
    const b = parseFloat(match[2]);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    const lat = Math.abs(a - 43) <= Math.abs(b - 43) ? a : b;
    const lng = lat === a ? b : a;
    return [lat, lng];
  } catch {
    return null;
  }
}

export const DeliveryLocationProvider: React.FC<{
  children: ReactNode;
  onLocationSynced?: (payload: {
    lat: number;
    lng: number;
    zoneId: string;
    fee: number;
    geo: string;
  }) => void;
}> = ({ children, onLocationSynced }) => {
  const rawStored = readStored();
  // Ignore a stale 'outside' fix that isn't even near Mestia (prod)
  const stored = rawStored && (rawStored.zoneId !== 'outside'
    || (rawStored.lat != null && rawStored.lng != null && rawStored.lat >= 42.85 && rawStored.lat <= 43.25 && rawStored.lng >= 42.45 && rawStored.lng <= 43.15))
    ? rawStored
    : null;
  const [state, setState] = useState<DeliveryLocationState>(() => {
    if (stored?.lat != null && stored?.lng != null && stored.fee != null) {
      return {
        lat: stored.lat,
        lng: stored.lng,
        zoneId: stored.zoneId ?? null,
        fee: stored.fee,
        preliminary: !!stored.preliminary,
        zoneName: stored.zoneName ?? null,
        status: 'ready',
      };
    }
    // Default: Mestia center at the center price until the user sets an address (prod)
    return {
      lat: 43.0445,
      lng: 42.7278,
      zoneId: 'center',
      fee: 8,
      preliminary: true,
      zoneName: { ru: 'Центр', en: 'Center', ka: 'ცენტრი' },
      status: 'ready',
    };
  });

  const syncRef = useRef(onLocationSynced);
  syncRef.current = onLocationSynced;
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  const commit = useCallback((lat: number, lng: number) => {
    const next = applyCoords(lat, lng);
    setState(next);
    syncRef.current?.({
      lat,
      lng,
      zoneId: next.zoneId,
      fee: next.fee,
      geo: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  }, []);

  const requestGeolocation = useCallback((opts?: { force?: boolean }) => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, status: 'unsupported' }));
      return;
    }
    if (geoInFlight) return;
    if (!opts?.force && statusRef.current === 'ready') return;

    geoInFlight = true;
    setState((prev) => ({ ...prev, status: 'locating' }));

    detectBrowserLocation(
      (lat, lng) => {
        geoInFlight = false;
        commit(lat, lng);
      },
      () => {
        geoInFlight = false;
        setState((prev) => ({
          ...prev,
          status: prev.status === 'ready' ? 'ready' : 'denied',
        }));
      }
    );
  }, [commit]);

  const setManualLocation = useCallback(
    (lat: number, lng: number) => {
      commit(lat, lng);
    },
    [commit]
  );

  // Hydrate from cache / address only — do NOT call geolocation here (no user gesture → no dialog)
  useEffect(() => {
    if (statusRef.current === 'ready') return;

    const fromAddress = parseGeoFromAddress();
    if (fromAddress) {
      commit(fromAddress[0], fromAddress[1]);
      return;
    }

    void (async () => {
      try {
        const perm = await (navigator.permissions as Permissions)?.query({
          name: 'geolocation' as PermissionName,
        });
        if (perm.state === 'granted') {
          requestGeolocation({ force: true });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [commit, requestGeolocation]);

  // After cookies: ask for GPS once per session on first gesture
  useEffect(() => {
    const askIfAllowed = () => {
      if (geoInFlight) return;
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) return;
      try {
        if (sessionStorage.getItem('delivery_geo_prompted') === '1') return;
      } catch {
        /* ignore */
      }

      void (async () => {
        try {
          const perm = await (navigator.permissions as Permissions)?.query({
            name: 'geolocation' as PermissionName,
          });
          if (perm.state === 'denied') {
            try {
              sessionStorage.setItem('delivery_geo_prompted', '1');
            } catch { /* ignore */ }
            return;
          }
          try {
            sessionStorage.setItem('delivery_geo_prompted', '1');
          } catch { /* ignore */ }
          requestGeolocation({ force: true });
        } catch {
          try {
            sessionStorage.setItem('delivery_geo_prompted', '1');
          } catch { /* ignore */ }
          requestGeolocation({ force: true });
        }
      })();
    };

    window.addEventListener('pointerdown', askIfAllowed, true);
    window.addEventListener('touchstart', askIfAllowed, true);
    window.addEventListener('mestigo:request-geo', askIfAllowed as EventListener);

    return () => {
      window.removeEventListener('pointerdown', askIfAllowed, true);
      window.removeEventListener('touchstart', askIfAllowed, true);
      window.removeEventListener('mestigo:request-geo', askIfAllowed as EventListener);
    };
  }, [requestGeolocation]);

  const etaLabel = useMemo(() => {
    if (!state.zoneId) return '25–35 мин';
    if (state.zoneId === 'center') return '20–30 мин';
    if (state.zoneId === 'airport') return '25–35 мин';
    if (state.zoneId === 'nearby_villages') return '35–50 мин';
    return '40–60 мин';
  }, [state.zoneId]);

  const value = useMemo<DeliveryLocationContextValue>(
    () => ({
      ...state,
      requestGeolocation,
      setManualLocation,
      etaLabel,
    }),
    [state, requestGeolocation, setManualLocation, etaLabel]
  );

  return (
    <DeliveryLocationContext.Provider value={value}>{children}</DeliveryLocationContext.Provider>
  );
};

export function useDeliveryLocation(): DeliveryLocationContextValue {
  const ctx = useContext(DeliveryLocationContext);
  if (!ctx) {
    throw new Error('useDeliveryLocation must be used within DeliveryLocationProvider');
  }
  return ctx;
}

export function useDeliveryLocationOptional(): DeliveryLocationContextValue | null {
  return useContext(DeliveryLocationContext);
}
