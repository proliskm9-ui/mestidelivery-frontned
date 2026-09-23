import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point, polygon } from '@turf/helpers';
import type { DeliveryZone, ZonePriceResult } from '../../types/delivery';
import { FALLBACK_DELIVERY_PRICE } from '../../types/delivery';
import { deliveryZonesSeed } from './zonesSeed';

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function calculateZonePrice(
  lat: number,
  lng: number,
  zones: DeliveryZone[] = deliveryZonesSeed
): ZonePriceResult | null {
  const sortedZones = [...zones]
    .filter((z) => z.active)
    .sort((a, b) => a.priority - b.priority);

  for (const zone of sortedZones) {
    let hit = false;

    if (zone.type === 'circle') {
      const [centerLng, centerLat] = zone.center;
      hit = distanceMeters(lat, lng, centerLat, centerLng) <= zone.radiusMeters;
    } else {
      const pt = point([lng, lat]);
      const poly = polygon([zone.polygon]);
      hit = booleanPointInPolygon(pt, poly);
    }

    if (hit) {
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        price: zone.price,
      };
    }
  }

  return null;
}

/** Zone hit or preliminary fallback outside coverage */
export function resolveDeliveryPrice(
  lat: number,
  lng: number,
  zones: DeliveryZone[] = deliveryZonesSeed
): ZonePriceResult {
  // Far outside Mestia (bad GPS / tourists planning ahead): treat as center, preliminary
  if (lat < 42.85 || lat > 43.25 || lng < 42.45 || lng > 43.15) {
    return { zoneId: 'center', zoneName: { ru: 'Центр', en: 'Center', ka: 'ცენტრი' }, price: 8, preliminary: true };
  }
  const hit = calculateZonePrice(lat, lng, zones);
  if (hit) return hit;
  return {
    zoneId: 'nearby_villages',
    zoneName: {
      ru: 'Ближайшие деревни',
      en: 'Nearby villages',
      ka: 'ახლომდებარე სოფლები',
    },
    price: FALLBACK_DELIVERY_PRICE,
    preliminary: true,
  };
}
