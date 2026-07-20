import { MESTIA_CENTER } from '../../types/delivery';

export interface ReverseGeocodeResult {
  displayName: string;
  street: string;
  house: string;
  locality: string;
}

type PhotonFeature = {
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    locality?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    osm_key?: string;
    osm_value?: string;
    type?: string;
  };
};

/** Common Mestia / Georgia labels when EN providers win */
const LOCALIZE_RU: Record<string, string> = {
  mestia: 'Местия',
  'tamar mepe street': 'ул. Тамар Мепе',
  'tamar mepe': 'ул. Тамар Мепе',
  'seti 2nd alley': '2-й переулок Сети',
  'seti 2 alley': '2-й переулок Сети',
  georgia: 'Грузия',
  'mingrelia-upper svaneti': 'Мегрелия — Верхняя Сванетия',
  'mestia municipality': 'муниципалитет Местия',
};

function nearMestia(lat: number, lng: number): boolean {
  const dLat = lat - MESTIA_CENTER[0];
  const dLng = lng - MESTIA_CENTER[1];
  return Math.hypot(dLat, dLng) < 0.08;
}

function looksLikeCoords(text: string): boolean {
  return /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(text.trim());
}

function localizeRu(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const mapped = LOCALIZE_RU[trimmed.toLowerCase()];
  if (mapped) return mapped;
  // Replace known phrases inside longer strings
  let out = trimmed;
  for (const [en, ru] of Object.entries(LOCALIZE_RU)) {
    out = out.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ru);
  }
  return out;
}

function buildResult(parts: {
  street?: string;
  house?: string;
  name?: string;
  locality?: string;
  lat: number;
  lng: number;
}): ReverseGeocodeResult {
  const localityRaw =
    parts.locality?.trim() ||
    (nearMestia(parts.lat, parts.lng) ? 'Местия' : '');
  const locality = localizeRu(localityRaw) || (nearMestia(parts.lat, parts.lng) ? 'Местия' : '');

  let street = localizeRu(parts.street || '') || localizeRu(parts.name || '') || '';

  if (!street || street === locality) {
    street = localizeRu(parts.name || '') || street || locality;
  }

  const house = parts.house?.trim() || '';
  const line = street && house ? `${street}, ${house}` : street || house;
  let displayName = [line, locality && locality !== street ? locality : '']
    .filter(Boolean)
    .join(', ');

  if (!displayName || looksLikeCoords(displayName)) {
    displayName = locality || (nearMestia(parts.lat, parts.lng) ? 'Местия' : '');
  }

  if (!displayName) {
    displayName = nearMestia(parts.lat, parts.lng)
      ? 'Местия'
      : `${parts.lat.toFixed(5)}, ${parts.lng.toFixed(5)}`;
  }

  return {
    displayName,
    street: street || locality || displayName,
    house,
    locality,
  };
}

async function fromNominatim(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResult | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}` +
    `&addressdetails=1&accept-language=ru`;

  const res = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const address = (data.address || {}) as Record<string, string | undefined>;

  const street =
    address.road ||
    address.pedestrian ||
    address.path ||
    address.residential ||
    address.neighbourhood ||
    '';

  const locality =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.county ||
    '';

  return buildResult({
    street,
    house: address.house_number,
    name: data.name || street,
    locality,
    lat,
    lng,
  });
}

async function fromPhoton(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResult | null> {
  // Photon: default | de | en | fr only (no ru)
  const url =
    `https://photon.komoot.io/reverse` +
    `?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&lang=en`;

  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = await res.json();
  const props = (data?.features?.[0] as PhotonFeature | undefined)?.properties;
  if (!props) return null;

  const street = props.street || '';
  const name =
    props.osm_key === 'highway' || props.type === 'street'
      ? props.name || street
      : props.street || props.name || '';

  return buildResult({
    street: street || name,
    house: props.housenumber,
    name: props.name,
    locality:
      props.city || props.town || props.village || props.locality || props.district || '',
    lat,
    lng,
  });
}

async function fromBigDataCloud(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResult | null> {
  const url =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}` +
    `&localityLanguage=ru`;

  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = await res.json();

  const street =
    data.localityInfo?.informative?.find((x: { description?: string }) =>
      /улиц|street|road|проезд|alley|переул/i.test(String(x.description || ''))
    )?.name ||
    data.locality ||
    '';

  const locality = data.city || data.locality || data.principalSubdivision || '';

  return buildResult({
    street: typeof street === 'string' ? street : '',
    name: data.locality,
    locality,
    lat,
    lng,
  });
}

function scoreRussian(result: ReverseGeocodeResult): number {
  // Prefer Cyrillic labels for RU UI
  const sample = `${result.displayName} ${result.street} ${result.locality}`;
  const cyr = (sample.match(/[А-Яа-яЁё]/g) || []).length;
  const latn = (sample.match(/[A-Za-z]/g) || []).length;
  return cyr * 3 - latn + (result.street ? 2 : 0) + (result.house ? 1 : 0);
}

/** Approximate address — prefer Russian labels (Nominatim ru → Photon → BigDataCloud) */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResult | null> {
  const providers = [fromNominatim, fromPhoton, fromBigDataCloud];
  let best: ReverseGeocodeResult | null = null;
  let bestScore = -Infinity;

  for (const provider of providers) {
    try {
      if (signal?.aborted) return null;
      const result = await provider(lat, lng, signal);
      if (!result || looksLikeCoords(result.displayName)) continue;
      const score = scoreRussian(result);
      if (score > bestScore) {
        best = result;
        bestScore = score;
      }
      // Good enough Cyrillic hit — stop early
      if (score >= 6) return result;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return null;
    }
  }

  if (best) return best;
  return buildResult({ lat, lng, locality: nearMestia(lat, lng) ? 'Местия' : '' });
}
