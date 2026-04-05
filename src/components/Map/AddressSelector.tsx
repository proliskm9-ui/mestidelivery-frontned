import React, { useState, useEffect, useRef } from 'react';
import { YMaps, Map, SearchControl, GeolocationControl } from '@pbe/react-yandex-maps';
import { useLanguage } from '../../translations/LanguageContext';

export interface AddressData {
    address: string;
    street: string;
    house: string;
    coords: [number, number];
    details: {
        apartment: string;
        entrance: string;
        floor: string;
        intercom: string;
        comment: string;
        type: 'apartment' | 'house' | 'office' | 'hotel';
    };
}

interface AddressSelectorProps {
    onClose: () => void;
    onSelect: (data: AddressData) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ onClose, onSelect }) => {
    const { t } = useLanguage();
    // Default to Tbilisi: 41.7151, 44.8271
    const [center, setCenter] = useState<[number, number]>([41.7151, 44.8271]);
    const [zoom] = useState(17);
    const [address, setAddress] = useState('');
    const [house, setHouse] = useState('');
    const [street, setStreet] = useState('');

    // Details
    const [details, setDetails] = useState({
        apartment: '',
        entrance: '',
        floor: '',
        intercom: '',
        comment: '',
        type: 'apartment' as const
    });

    const [view, setView] = useState<'map' | 'form'>('map');
    const mapRef = useRef<any>(null);
    const ymapsRef = useRef<any>(null);

    // Initial Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCenter([pos.coords.latitude, pos.coords.longitude]);
                    // Trigger geocode after map load via ref if needed, or just let user move
                },
                () => console.log('Geolocation denied')
            );
        }
    }, []);

    // Geocode function
    const geocode = async (coords: [number, number]) => {
        if (!ymapsRef.current) return;

        try {
            const res = await ymapsRef.current.geocode(coords);
            const firstGeoObject = res.geoObjects.get(0);

            if (firstGeoObject) {
                const addressLine = firstGeoObject.getAddressLine();
                const streetName = firstGeoObject.getThoroughfare() || firstGeoObject.getPremise() || '';
                const houseNumber = firstGeoObject.getPremiseNumber() || '';

                setAddress(addressLine);
                setStreet(streetName);
                setHouse(houseNumber);
            }
        } catch (e) {
            console.error('Geocode error', e);
        }
    };


    const confirmLocation = () => {
        setView('form');
    };

    const handleSave = () => {
        onSelect({
            address,
            street,
            house,
            coords: center,
            details
        });
    };

    return (
        <div className="address-selector-overlay">
            <div className={`address-selector-modal ${view === 'map' ? 'full-screen' : ''}`}>

                {view === 'map' && (
                    <div className="map-view-container">
                        <div className="map-header-floating">
                            <button className="close-btn-round" onClick={onClose}>✕</button>
                            <span className="map-title-floating">{t('map.title')}</span>
                        </div>

                        <div className="map-wrapper" style={{ width: '100%', height: '100%' }}>
                            <YMaps query={{ apikey: '09cb021e-5a23-41f0-9979-14523fdbd16c', lang: 'ru_RU' }}>
                                <Map
                                    defaultState={{ center, zoom }}
                                    state={{ center, zoom }}
                                    width="100%"
                                    height="100%"
                                    modules={['geocode']}
                                    onLoad={(ymaps) => {
                                        ymapsRef.current = ymaps;
                                        geocode(center);
                                    }}
                                    instanceRef={mapRef}
                                    onBoundsChange={() => {
                                        // Update local ref or similar to avoid re-renders if performance issues
                                        // But for drag-to-select, we need the center.  
                                        // Ideally, use a ref for the center to pass to confirm, 
                                        // and only geocode on 'actionend' (drag stop).
                                    }}
                                    onActionEnd={(e: any) => {
                                        const map = e.get('target');
                                        const newCenter = map.getCenter();
                                        // Update state to trigger re-renders if needed, 
                                        // but mainly to store the coordinate for confirmation.
                                        setCenter(newCenter);
                                        geocode(newCenter);
                                    }}
                                >
                                    {/* Center Pin (Visual only, map moves underneath) */}
                                    {/* Actually simpler to just have a fixed UI element in center of screen */}

                                    <GeolocationControl options={{ float: 'left' }} />
                                    <SearchControl options={{ float: 'right' }} />
                                </Map>
                            </YMaps>

                            {/* Static Central Pin */}
                            <div className="static-map-pin">
                                <div className="pin-icon">📍</div>
                                <div className="pin-shadow"></div>
                            </div>
                        </div>

                        <div className="map-footer-floating">
                            <div className="address-preview">
                                {address || t('map.detecting')}
                            </div>
                            <button className="confirm-btn-primary" onClick={confirmLocation}>
                                {t('map.confirm')}
                            </button>
                        </div>
                    </div>
                )}

                {view === 'form' && (
                    <div className="form-view-container">
                        <div className="modal-header">
                            <button className="back-btn" onClick={() => setView('map')}>←</button>
                            <h3>{t('map.details')}</h3>
                            <button className="close-btn" onClick={onClose}>✕</button>
                        </div>

                        <div className="form-content scrollable">
                            <div className="selected-address-summary">
                                <span className="icon">📍</span>
                                <span className="text">{address}</span>
                            </div>

                            <div className="form-grid">
                                <div className="full-width">
                                    <label>{t('map.type')}</label>
                                    <div className="type-selector">
                                        {[
                                            { id: 'apartment', label: t('map.apartment') },
                                            { id: 'house', label: t('map.house') },
                                            { id: 'office', label: t('map.office') },
                                            { id: 'hotel', label: t('map.hotel') }
                                        ].map(target => (
                                            <button
                                                key={target.id}
                                                className={`type-btn ${details.type === target.id ? 'active' : ''}`}
                                                onClick={() => setDetails({ ...details, type: target.id as any })}
                                            >
                                                {target.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(details.type === 'apartment' || details.type === 'office') && (
                                    <>
                                        <div className="input-group">
                                            <label>{t('map.apt_office')}</label>
                                            <input
                                                value={details.apartment}
                                                onChange={e => setDetails({ ...details, apartment: e.target.value })}
                                                placeholder="15"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>{t('map.entrance')}</label>
                                            <input
                                                value={details.entrance}
                                                onChange={e => setDetails({ ...details, entrance: e.target.value })}
                                                placeholder="1"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>{t('map.floor')}</label>
                                            <input
                                                value={details.floor}
                                                onChange={e => setDetails({ ...details, floor: e.target.value })}
                                                placeholder="5"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>{t('map.intercom')}</label>
                                            <input
                                                value={details.intercom}
                                                onChange={e => setDetails({ ...details, intercom: e.target.value })}
                                                placeholder="15K"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="full-width">
                                    <label>{t('map.comment')}</label>
                                    <textarea
                                        value={details.comment}
                                        onChange={e => setDetails({ ...details, comment: e.target.value })}
                                        placeholder={t('map.comment_ph')}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="confirm-btn-primary full" onClick={handleSave}>
                                {t('map.save')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .address-selector-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6);
                    z-index: 10000;
                    display: flex; justify-content: center; alignItems: flex-end;
                }
                @media (min-width: 768px) {
                    .address-selector-overlay { align-items: center; }
                    .address-selector-modal { 
                        width: 400px; height: auto; max-height: 90vh;
                        border-radius: 20px; overflow: hidden;
                    }
                    .address-selector-modal.full-screen {
                        width: 800px; height: 600px;
                    }
                }
                .address-selector-modal {
                    background: #1a1a1a;
                    width: 100%; height: 90vh;
                    border-radius: 20px 20px 0 0;
                    display: flex; flex-direction: column;
                    position: relative;
                }
                
                /* Map View */
                .map-view-container { position: relative; width: 100%; height: 100%; }
                .map-header-floating {
                    position: absolute; top: 20px; left: 20px; right: 20px;
                    z-index: 10; display: flex; align-items: center;
                    pointer-events: none;
                }
                .close-btn-round {
                    width: 40px; height: 40px; border-radius: 50%;
                    background: white; border: none; font-size: 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    pointer-events: auto; cursor: pointer;
                }
                .map-title-floating {
                    background: white; padding: 10px 20px; border-radius: 20px;
                    margin-left: 10px; font-weight: 600;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    pointer-events: auto;
                }
                .static-map-pin {
                    position: absolute; top: 50%; left: 50%;
                    transform: translate(-50%, -100%);
                    z-index: 5; pointer-events: none;
                }
                .pin-icon { font-size: 40px; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3)); }
                
                .map-footer-floating {
                    position: absolute; bottom: 30px; left: 20px; right: 20px;
                    z-index: 10;
                    background: white; padding: 20px; border-radius: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                .address-preview {
                    font-size: 16px; font-weight: 600; margin-bottom: 15px;
                    color: #1a1a1a;
                }
                .confirm-btn-primary {
                    width: 100%; padding: 14px; background: #21EA7C;
                    color: #000; font-weight: 700; border: none; border-radius: 12px;
                    font-size: 16px; cursor: pointer;
                }

                /* Form View */
                .form-view-container {
                     display: flex; flex-direction: column; height: 100%; color: white;
                }
                .modal-header {
                    padding: 20px; display: flex; align-items: center; justify-content: space-between;
                    border-bottom: 1px solid #333;
                }
                .modal-header h3 { margin: 0; }
                .close-btn, .back-btn {
                    background: none; border: none; color: white; font-size: 24px; cursor: pointer;
                }
                .form-content { padding: 20px; flex: 1; overflow-y: auto; }
                
                .selected-address-summary {
                    background: #333; padding: 15px; border-radius: 12px;
                    display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
                }
                
                .form-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 15px;
                }
                .full-width { grid-column: 1 / -1; }
                
                label { display: block; font-size: 12px; color: #888; margin-bottom: 5px; }
                input, textarea {
                    width: 100%; background: #2a2a2a; border: none;
                    padding: 12px; border-radius: 10px; color: white;
                    font-family: inherit;
                }
                
                .type-selector {
                    display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px;
                }
                .type-btn {
                    padding: 8px 16px; background: #2a2a2a; border: 1px solid #333;
                    border-radius: 20px; color: #aaa; white-space: nowrap; cursor: pointer;
                }
                .type-btn.active {
                    background: rgba(33,234,124,0.2); color: #21EA7C; border-color: #21EA7C;
                }
                
                .modal-footer { padding: 20px; border-top: 1px solid #333; }
            `}</style>
        </div>
    );
};

export default AddressSelector;
