import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MaplibreMap, Marker as MaplibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MESTIA_CENTER } from '../../types/delivery';
import { applyEnglishLabels, MAP_STYLE_URL } from '../../lib/delivery/mapTiles';
import './LocationPicker.css';

interface LocationPickerProps {
  lat?: number | null;
  lng?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number | string;
  className?: string;
  autoGeolocate?: boolean;
  onGeolocateState?: (detecting: boolean) => void;
}

const PIN_HTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#111"/><circle cx="12" cy="10" r="3" fill="#21EA7C"/></svg>`;

const LocationPicker: React.FC<LocationPickerProps> = ({
  lat,
  lng,
  onLocationChange,
  height = 235,
  className = '',
  autoGeolocate = false,
  onGeolocateState,
}) => {
  const hasPin = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng);
  const [pos, setPos] = useState<[number, number]>(hasPin ? [lat!, lng!] : MESTIA_CENTER);
  const geoTried = useRef(false);
  const seeded = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markerRef = useRef<MaplibreMarker | null>(null);
  const onChangeRef = useRef(onLocationChange);
  onChangeRef.current = onLocationChange;

  useEffect(() => {
    if (hasPin) setPos([lat!, lng!]);
  }, [hasPin, lat, lng]);

  useEffect(() => {
    if (!autoGeolocate || geoTried.current) return;
    if (!navigator.geolocation) {
      if (!hasPin) onLocationChange(MESTIA_CENTER[0], MESTIA_CENTER[1]);
      return;
    }
    geoTried.current = true;
    onGeolocateState?.(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const next: [number, number] = [p.coords.latitude, p.coords.longitude];
        setPos(next);
        onLocationChange(next[0], next[1]);
        onGeolocateState?.(false);
      },
      () => {
        if (!hasPin) onLocationChange(MESTIA_CENTER[0], MESTIA_CENTER[1]);
        onGeolocateState?.(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [autoGeolocate, hasPin, onLocationChange, onGeolocateState]);

  useEffect(() => {
    if (autoGeolocate || hasPin || seeded.current) return;
    seeded.current = true;
    onLocationChange(MESTIA_CENTER[0], MESTIA_CENTER[1]);
  }, [autoGeolocate, hasPin, onLocationChange]);

  // Init MapLibre once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [pos[1], pos[0]], // lng, lat
      zoom: 15,
      attributionControl: false,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    const el = document.createElement('div');
    el.className = 'mdp-pin';
    el.innerHTML = PIN_HTML;
    el.style.cursor = 'grab';

    const marker = new maplibregl.Marker({ element: el, draggable: true, anchor: 'bottom' })
      .setLngLat([pos[1], pos[0]])
      .addTo(map);

    marker.on('dragend', () => {
      const { lng, lat: nextLat } = marker.getLngLat();
      setPos([nextLat, lng]);
      onChangeRef.current(nextLat, lng);
    });

    map.on('click', (e) => {
      const { lng, lat: nextLat } = e.lngLat;
      marker.setLngLat([lng, nextLat]);
      setPos([nextLat, lng]);
      onChangeRef.current(nextLat, lng);
    });

    const forceEn = () => applyEnglishLabels(map);
    map.on('load', forceEn);
    map.on('style.load', forceEn);

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  // Sync external / state position → map
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLngLat([pos[1], pos[0]]);
    map.easeTo({ center: [pos[1], pos[0]], duration: 300 });
  }, [pos]);

  const style = useMemo(() => ({ height, width: '100%' as const }), [height]);

  return (
    <div className={`mdp-map ${className}`} style={style}>
      <div ref={containerRef} className="mdp-maplibre" />
    </div>
  );
};

export default LocationPicker;
