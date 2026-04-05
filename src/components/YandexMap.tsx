import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        ymaps: any;
    }
}

interface YandexMapProps {
    center: [number, number]; // [lat, lng]
    zoom?: number;
    markers?: {
        pos: [number, number];
        icon?: 'courier' | 'restaurant' | 'customer';
        label?: string;
    }[];
    route?: {
        from: [number, number];
        to: [number, number];
    };
    height?: string;
    className?: string;
}

const YandexMap: React.FC<YandexMapProps> = ({ center, zoom = 15, markers = [], route, height = '300px', className }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const routeRef = useRef<any>(null);

    useEffect(() => {
        if (!window.ymaps) return;

        window.ymaps.ready(() => {
            if (!mapRef.current) return;

            // Initialize Map
            if (!mapInstance.current) {
                mapInstance.current = new window.ymaps.Map(mapRef.current, {
                    center: center,
                    zoom: zoom,
                    controls: ['zoomControl', 'fullscreenControl']
                });
            } else {
                mapInstance.current.setCenter(center);
                mapInstance.current.setZoom(zoom);
            }

            const map = mapInstance.current;
            map.geoObjects.removeAll();

            // Markers
            markers.forEach(m => {
                let preset = 'islands#blueIcon';
                let iconContent = m.label || '';

                if (m.icon === 'courier') preset = 'islands#darkGreenCircleIcon';
                if (m.icon === 'restaurant') preset = 'islands#orangeDotIcon';
                if (m.icon === 'customer') preset = 'islands#redDotIcon';

                const placemark = new window.ymaps.Placemark(m.pos, {
                    iconContent: iconContent,
                    balloonContent: m.label
                }, {
                    preset: preset
                });

                map.geoObjects.add(placemark);
            });

            // Route
            if (route) {
                const multiRoute = new window.ymaps.multiRouter.MultiRoute({
                    referencePoints: [
                        route.from,
                        route.to
                    ],
                    params: {
                        routingMode: 'auto'
                    }
                }, {
                    boundsAutoApply: true,
                    routeActiveStrokeColor: "#21EA7C",
                    routeActiveStrokeWidth: 5
                });

                map.geoObjects.add(multiRoute);
                routeRef.current = multiRoute;
            }
        });
    }, [center, zoom, markers, route]);

    return <div ref={mapRef} style={{ width: '100%', height: height, borderRadius: '16px', overflow: 'hidden' }} className={className} />;
};

export default YandexMap;
