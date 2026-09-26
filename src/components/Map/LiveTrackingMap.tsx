import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../../translations/LanguageContext';
import { MESTIA_CENTER } from '../../types/delivery';
import { MAP_TILE_ATTR, MAP_TILE_OPTIONS, MAP_TILE_URL } from '../../lib/delivery/mapTiles';

interface LiveTrackingMapProps {
    courierLocation?: {
        latitude: number;
        longitude: number;
        heading?: number;
    };
    orderLocation?: {
        latitude: number;
        longitude: number;
    };
    className?: string;
}

const customerIcon = L.divIcon({
    className: 'ltm-pin',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 0 2px #3b82f6"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

const courierIcon = L.divIcon({
    className: 'ltm-pin',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#21EA7C;display:grid;place-items:center;box-shadow:0 0 0 3px rgba(33,234,124,.25),0 4px 12px rgba(0,0,0,.4)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0c1c11" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

function FitBounds({
    points,
}: {
    points: [number, number][];
}) {
    const map = useMap();
    useEffect(() => {
        if (points.length === 0) return;
        if (points.length === 1) {
            map.setView(points[0], 14);
            return;
        }
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }, [map, points]);
    return null;
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ courierLocation, orderLocation, className }) => {
    const { t } = useLanguage();

    const points = useMemo(() => {
        const list: [number, number][] = [];
        if (orderLocation) list.push([orderLocation.latitude, orderLocation.longitude]);
        if (courierLocation) list.push([courierLocation.latitude, courierLocation.longitude]);
        return list;
    }, [orderLocation, courierLocation]);

    const center = points[0] || MESTIA_CENTER;

    return (
        <div className={className || 'live-tracking-map'} style={{ width: '100%', height: '100%' }} title={t('map.title')}>
            <MapContainer
                center={center}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url={MAP_TILE_URL}
                    attribution={MAP_TILE_ATTR}
                    maxZoom={MAP_TILE_OPTIONS.maxZoom}
                />
                <FitBounds points={points.length ? points : [MESTIA_CENTER]} />
                {orderLocation && (
                    <Marker
                        position={[orderLocation.latitude, orderLocation.longitude]}
                        icon={customerIcon}
                    />
                )}
                {courierLocation && (
                    <Marker
                        position={[courierLocation.latitude, courierLocation.longitude]}
                        icon={courierIcon}
                    />
                )}
                {orderLocation && courierLocation && (
                    <Polyline
                        positions={[
                            [courierLocation.latitude, courierLocation.longitude],
                            [orderLocation.latitude, orderLocation.longitude],
                        ]}
                        pathOptions={{ color: '#21EA7C', weight: 4, opacity: 0.85, dashArray: '6 8' }}
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default LiveTrackingMap;
