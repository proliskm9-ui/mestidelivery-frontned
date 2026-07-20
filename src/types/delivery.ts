export interface DeliveryZoneCircle {
  id: string;
  type: 'circle';
  name: { ru: string; en: string; ka: string };
  price: number;
  priority: number;
  center: [number, number]; // [lng, lat]
  radiusMeters: number;
  active: boolean;
}

export interface DeliveryZonePolygon {
  id: string;
  type: 'polygon';
  name: { ru: string; en: string; ka: string };
  price: number;
  priority: number;
  polygon: [number, number][]; // [lng, lat][]
  active: boolean;
}

export type DeliveryZone = DeliveryZoneCircle | DeliveryZonePolygon;

export interface ZonePriceResult {
  zoneId: string;
  zoneName: { ru: string; en: string; ka: string };
  price: number;
  preliminary?: boolean;
}

/** Mestia town center (lat, lng) — Leaflet order */
export const MESTIA_CENTER: [number, number] = [43.0445, 42.7278];

/** Outside all zones — preliminary fee until confirmed with support */
export const FALLBACK_DELIVERY_PRICE = 20;
