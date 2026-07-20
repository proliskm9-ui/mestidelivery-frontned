import { deliveryZonesSeed } from '../lib/delivery/zonesSeed';
import { calculateZonePrice, resolveDeliveryPrice } from '../lib/delivery/calculateZonePrice';
import { FALLBACK_DELIVERY_PRICE, MESTIA_CENTER } from '../types/delivery';

export type { DeliveryZone, ZonePriceResult } from '../types/delivery';
export { calculateZonePrice, resolveDeliveryPrice, deliveryZonesSeed, FALLBACK_DELIVERY_PRICE, MESTIA_CENTER };

/** @deprecated shape kept for callers that still read id/name/price */
export const DELIVERY_ZONES = deliveryZonesSeed.map((z) => ({
  id: z.id,
  name: z.name as Record<string, string>,
  price: z.price,
  coords: MESTIA_CENTER as [number, number],
  maxDistanceMeters: 0,
}));

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
}

/** Polygon-based zone detection; falls back to farthest priced zone shape for legacy callers */
export function detectZone(lat: number, lon: number) {
  const hit = calculateZonePrice(lat, lon);
  if (hit) {
    const zone = deliveryZonesSeed.find((z) => z.id === hit.zoneId)!;
    return {
      id: zone.id,
      name: zone.name as Record<string, string>,
      price: zone.price,
      coords: MESTIA_CENTER as [number, number],
      maxDistanceMeters: 0,
    };
  }
  return {
    id: 'outside',
    name: { ru: 'Вне зоны', en: 'Outside zone', ka: 'ზონის გარეთ' },
    price: FALLBACK_DELIVERY_PRICE,
    coords: MESTIA_CENTER as [number, number],
    maxDistanceMeters: 0,
  };
}

export function parseCoordinates(geoString: string | undefined): [number, number] | null {
  if (!geoString) return null;
  const match = geoString.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (match) {
    const a = parseFloat(match[1]);
    const b = parseFloat(match[2]);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    // Heuristic: Mestia lat ~43, lng ~42. If first looks like lng, swap.
    if (a > 40 && a < 45 && b > 40 && b < 45) {
      // both in range — prefer lat,lng if first is closer to 43
      if (Math.abs(a - 43) <= Math.abs(b - 43)) return [a, b];
      return [b, a];
    }
    return [a, b];
  }
  return null;
}

export function getDeliveryFeeForAddress(addr: any): number {
  if (!addr) return 8;
  const coords = parseCoordinates(addr.geo);
  if (coords) {
    return resolveDeliveryPrice(coords[0], coords[1]).price;
  }
  if (addr.deliveryZone) {
    const match = deliveryZonesSeed.find((z) => z.id === addr.deliveryZone);
    if (match) return match.price;
  }
  return 8;
}
