/** OpenFreeMap vector style — English labels applied at runtime in LocationPicker */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export const MAP_TILE_ATTR =
  '&copy; OpenStreetMap &copy; OpenFreeMap';

/**
 * Leaflet raster tiles (courier map, admin dispatch) — OpenStreetMap.
 * Carto basemaps started answering "API KEY REQUIRED" (Sept 2026), so they are no longer used.
 */
export const MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MAP_TILE_OPTIONS = {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap',
};

/** English / Latin only — skip local script (ka) so labels stay readable */
export const ENGLISH_TEXT_FIELD = [
  'case',
  ['has', 'name:en'],
  ['get', 'name:en'],
  ['has', 'name_en'],
  ['get', 'name_en'],
  ['has', 'name:latin'],
  ['get', 'name:latin'],
  ['has', 'name:int'],
  ['get', 'name:int'],
  '',
] as unknown[];

export function applyEnglishLabels(map: {
  getStyle: () => { layers?: Array<{ id: string; layout?: Record<string, unknown> }> };
  setLayoutProperty: (id: string, key: string, value: unknown) => void;
}) {
  const layers = map.getStyle().layers || [];
  for (const layer of layers) {
    if (layer.layout && 'text-field' in layer.layout) {
      try {
        map.setLayoutProperty(layer.id, 'text-field', ENGLISH_TEXT_FIELD);
      } catch {
        /* some symbol layers reject overrides */
      }
    }
  }
}
