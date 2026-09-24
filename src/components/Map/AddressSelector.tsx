import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../translations/LanguageContext';
import LocationPicker from '../delivery/LocationPicker';
import { MESTIA_CENTER } from '../../types/delivery';
import './AddressSelector.css';

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
    const [lat, setLat] = useState(MESTIA_CENTER[0]);
    const [lng, setLng] = useState(MESTIA_CENTER[1]);
    const [address, setAddress] = useState('');
    const [house, setHouse] = useState('');
    const [street, setStreet] = useState('');

    const [details, setDetails] = useState({
        apartment: '',
        entrance: '',
        floor: '',
        intercom: '',
        comment: '',
        type: 'apartment' as const
    });

    const [view, setView] = useState<'map' | 'form'>('map');

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
            },
            () => undefined
        );
    }, []);

    useEffect(() => {
        const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setAddress(label);
        if (!street) setStreet(label);
    }, [lat, lng, street]);

    const handleSave = () => {
        onSelect({
            address: address || street,
            street,
            house,
            coords: [lat, lng],
            details
        });
    };

    return (
        <div className="address-selector-overlay">
            <div className={`address-selector-modal ${view === 'map' ? 'full-screen' : ''}`}>
                {view === 'map' && (
                    <div className="map-view-container">
                        <div className="map-header-floating">
                            <button className="close-btn-round" onClick={onClose} type="button" aria-label="Close"><X size={20} strokeWidth={2.4} /></button>
                            <span className="map-title-floating">{t('map.title')}</span>
                        </div>

                        <div className="map-wrapper" style={{ width: '100%', height: '100%' }}>
                            <LocationPicker
                                lat={lat}
                                lng={lng}
                                height="100%"
                                onLocationChange={(nextLat, nextLng) => {
                                    setLat(nextLat);
                                    setLng(nextLng);
                                }}
                            />
                        </div>

                        <div className="map-footer-floating">
                            <div className="address-preview">
                                {address || t('map.detecting')}
                            </div>
                            <button className="confirm-btn-primary" type="button" onClick={() => setView('form')}>
                                {t('map.confirm')}
                            </button>
                        </div>
                    </div>
                )}

                {view === 'form' && (
                    <div className="form-view-container">
                        <div className="form-header">
                            <button className="back-btn" type="button" onClick={() => setView('map')}>←</button>
                            <h3>{t('map.details')}</h3>
                            <button className="close-btn-text" type="button" onClick={onClose} aria-label="Close"><X size={20} strokeWidth={2.4} /></button>
                        </div>

                        <div className="form-body">
                            <div className="input-group">
                                <label>{t('checkout.street')}</label>
                                <input value={street} onChange={(e) => setStreet(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>{t('checkout.house')}</label>
                                <input value={house} onChange={(e) => setHouse(e.target.value)} />
                            </div>
                            <div className="input-row">
                                <div className="input-group">
                                    <label>{t('checkout.apartment')}</label>
                                    <input value={details.apartment} onChange={(e) => setDetails({ ...details, apartment: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>{t('map.entrance')}</label>
                                    <input value={details.entrance} onChange={(e) => setDetails({ ...details, entrance: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-row">
                                <div className="input-group">
                                    <label>{t('map.floor')}</label>
                                    <input value={details.floor} onChange={(e) => setDetails({ ...details, floor: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>{t('map.intercom')}</label>
                                    <input value={details.intercom} onChange={(e) => setDetails({ ...details, intercom: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>{t('map.comment')}</label>
                                <textarea
                                    value={details.comment}
                                    onChange={(e) => setDetails({ ...details, comment: e.target.value })}
                                    placeholder={t('map.comment_ph')}
                                />
                            </div>
                        </div>

                        <div className="form-footer">
                            <button className="confirm-btn-primary" type="button" onClick={handleSave}>
                                {t('map.save')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressSelector;
