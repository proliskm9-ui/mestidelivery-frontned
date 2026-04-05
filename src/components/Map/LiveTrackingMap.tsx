import React from 'react';
import { YMaps, Map, Placemark, Polyline } from '@pbe/react-yandex-maps';
import { useLanguage } from '../../translations/LanguageContext';

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
    className?: string; // e.g. "live-map-v3-full"
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ courierLocation, orderLocation, className }) => {
    const { t } = useLanguage();

    // Default Center (Tbilisi)
    const defaultState = {
        center: [41.7151, 44.8271],
        zoom: 13,
    };

    const state = {
        center: orderLocation
            ? [orderLocation.latitude, orderLocation.longitude]
            : (courierLocation ? [courierLocation.latitude, courierLocation.longitude] : defaultState.center),
        zoom: 14
    };

    return (
        <div className={className || "live-tracking-map"} style={{ width: '100%', height: '100%' }}>
            <YMaps query={{ apikey: '09cb021e-5a23-41f0-9979-14523fdbd16c', lang: 'ru_RU' }}>
                <Map
                    defaultState={defaultState}
                    state={state}
                    width="100%"
                    height="100%"
                    // Customize controls if needed
                    options={{ suppressMapOpenBlock: true }}
                >
                    {/* Customer Marker */}
                    {orderLocation && (
                        <Placemark
                            geometry={[orderLocation.latitude, orderLocation.longitude]}
                            properties={{
                                hintContent: t('map.client'),
                                balloonContent: t('checkout.address_title')
                            }}
                            options={{
                                preset: 'islands#blueHomeCircleIcon'
                            }}
                        />
                    )}

                    {/* Courier Marker */}
                    {courierLocation && (
                        <Placemark
                            geometry={[courierLocation.latitude, courierLocation.longitude]}
                            properties={{
                                hintContent: t('map.courier'),
                                iconContent: '🚘'
                            }}
                            options={{
                                preset: 'islands#darkGreenAutoCircleIcon',
                                // Smooth movement not natively supported by React wrapper for ONE placemark
                                // effectively, but re-renders are fast enough for 3s polling.
                            }}
                        />
                    )}

                    {/* Route Line */}
                    {orderLocation && courierLocation && (
                        <Polyline
                            geometry={[
                                [courierLocation.latitude, courierLocation.longitude],
                                [orderLocation.latitude, orderLocation.longitude]
                            ]}
                            options={{
                                strokeColor: "#21EA7C",
                                strokeWidth: 4,
                                strokeOpacity: 0.8,
                                strokeStyle: 'shortdash'
                            }}
                        />
                    )}
                </Map>
            </YMaps>
        </div>
    );
};

export default LiveTrackingMap;
