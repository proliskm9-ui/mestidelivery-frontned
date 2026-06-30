import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/translations/LanguageContext';
import HeaderOrderStatus from './HeaderOrderStatus';
import { YMaps, Map } from '@pbe/react-yandex-maps';
import './PCHeader.css';

const LANGUAGES = [
    { code: 'ru', name: 'Русский', flag: '/Assets/RU.png' },
    { code: 'ka', name: 'ქართული', flag: '/Assets/GE.png' },
    { code: 'en', name: 'English', flag: '/Assets/US.png' }
];

const SmallArrowIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M9 18l6-6-6-6"></path>
    </svg>
);

interface HeaderProps {
    onRestaurantClick?: (id: string) => void;
    userAddress?: any;
    onUpdateAddress?: (address: any) => void;
    userProfile?: any;
    onProfileClick?: () => void;
    onOrderClick?: (id: number) => void;
    onLogout?: () => void;
    searchQuery?: string;
    setSearchQuery?: (q: string) => void;
    showSearch?: boolean;
    onNavigate?: (page: string) => void;
    hideLogo?: boolean;
    searchPlaceholder?: string;
    onLogoClick?: () => void;
}

const PCHeader: React.FC<HeaderProps> = ({
    userAddress,
    onUpdateAddress,
    userProfile,
    onProfileClick,
    onOrderClick,
    searchQuery = '',
    setSearchQuery,
    showSearch = true,
    onNavigate,
    hideLogo = false,
    searchPlaceholder,
    onLogoClick
}) => {
    const { language, setLanguage, t } = useLanguage();
    const [langOpen, setLangOpen] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    const [tempStreet, setTempStreet] = useState('');
    const [tempHouse, setTempHouse] = useState('');
    const [tempApartment, setTempApartment] = useState('');
    const [tempEntrance, setTempEntrance] = useState('');

    useEffect(() => {
        if (mapOpen) {
            setTempStreet(userAddress?.street || '');
            setTempHouse(userAddress?.house || '');
            setTempApartment(userAddress?.apartment || '');
            setTempEntrance(userAddress?.entrance || '');
        }
    }, [mapOpen, userAddress]);

    const handleSaveAddress = () => {
        onUpdateAddress?.({
            ...userAddress,
            street: tempStreet,
            house: tempHouse,
            apartment: tempApartment,
            entrance: tempEntrance
        });
        setMapOpen(false);
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) return;
        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            const ymaps = (window as any).ymaps;
            if (ymaps && ymaps.geocode) {
                ymaps.geocode([latitude, longitude]).then((res: any) => {
                    const firstGeoObject = res.geoObjects.get(0);
                    if (firstGeoObject) {
                        const street = firstGeoObject.getThoroughfare() || firstGeoObject.getPremise() || '';
                        const house = firstGeoObject.getPremiseNumber() || '';
                        setTempStreet(street);
                        setTempHouse(house);
                    }
                }).finally(() => setIsDetectingLocation(false));
            } else {
                setIsDetectingLocation(false);
            }
        }, () => setIsDetectingLocation(false));
    };

    const handleMapBoundsChange = (e: any) => {
        const ymaps = (window as any).ymaps;
        if (!ymaps) return;
        
        const center = e.get('target').getCenter();
        ymaps.geocode(center).then((res: any) => {
            const firstGeoObject = res.geoObjects.get(0);
            if (firstGeoObject) {
                const street = firstGeoObject.getThoroughfare() || firstGeoObject.getPremise() || '';
                const house = firstGeoObject.getPremiseNumber() || '';
                if (street) setTempStreet(street);
                if (house) setTempHouse(house);
            }
        });
    };

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    return (
        <header className="pc-header-container">
            <div className="pc-header-content">
                {!hideLogo && (
                    <div className="pc-header-left" onClick={() => {
                        if (onLogoClick) onLogoClick();
                        else onNavigate?.('menu');
                    }}>
                        <img src="/Assets/Loading/logo.png" alt="MestiGo" className="pc-header-logo" />
                    </div>
                )}

                <div className="pc-header-center">
                    {showSearch && setSearchQuery && (
                        <div className="pc-search-pill">
                            <div className="pc-search-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder={searchPlaceholder || t('common.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="pc-header-right">
                    <div className="pc-address-pill" onClick={() => setMapOpen(true)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <div className="pc-ap-text">
                            <span className="pc-ap-title">{t('common.mestia')} <SmallArrowIcon style={{ marginLeft: '4px', transform: 'rotate(90deg)' }} /></span>
                            <span className="pc-ap-subtitle">
                                {(userAddress?.street || userAddress?.house)
                                    ? `${userAddress.street}${userAddress.house ? `, ${userAddress.house}` : ''}`
                                    : t('map.title')}
                            </span>
                        </div>
                    </div>

                    {onOrderClick && (
                        <HeaderOrderStatus onNavigate={onOrderClick} compact={true} />
                    )}

                    <div className="pc-lang-container">
                        <button className="pc-lang-btn" onClick={() => setLangOpen(!langOpen)}>
                            <img src={currentLang.flag} alt={currentLang.name} className="pc-lang-flag" />
                            <SmallArrowIcon style={{ transform: langOpen ? 'rotate(-90deg)' : 'rotate(90deg)', marginLeft: '6px' }} />
                        </button>
                        {langOpen && (
                            <>
                                <div className="pc-lang-modal-backdrop" onClick={() => setLangOpen(false)}></div>
                                <div className="pc-lang-modal">
                                    {LANGUAGES.map((lang) => (
                                        <div key={lang.code} className={`pc-lang-option ${language === lang.code ? 'active' : ''}`} onClick={() => { setLanguage(lang.code as any); setLangOpen(false); }}>
                                            <img src={lang.flag} alt={lang.name} />
                                            <span>{lang.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button className="pc-user-avatar" onClick={() => onProfileClick && onProfileClick()}>
                        {userProfile?.avatar && userProfile.avatar.length > 2 ? (
                            <img src={userProfile.avatar} alt="Profile" />
                        ) : (
                            <img src="/Assets/profile-green.png" alt="Profile" />
                        )}
                    </button>
                </div>
            </div>

            {mapOpen && (
                <>
                    <div className="modal-overlay pam-overlay" onClick={() => setMapOpen(false)} style={{ zIndex: 100000 }}></div>
                    <div className="premium-address-modal" onClick={e => e.stopPropagation()} style={{ zIndex: 100001, background: '#191917', border: '1px solid #333' }}>
                        <div className="pam-header">
                            <div>
                                <h3 className="pam-title" style={{ color: '#fff' }}>{t('common.mestia')}</h3>
                                <p className="pam-subtitle" style={{ color: '#aaa' }}>{t('map.title')}</p>
                            </div>
                        </div>

                        <div className="pc-pam-map-visual" style={{ height: '220px', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', position: 'relative' }}>
                            <YMaps query={{ apikey: '09cb021e-5a23-41f0-9979-14523fdbd16c', lang: 'ru_RU' }}>
                                <Map
                                    defaultState={{ center: [43.0445, 42.7278], zoom: 16 }}
                                    width="100%"
                                    height="100%"
                                    onBoundsChange={handleMapBoundsChange}
                                >
                                    <div className="map-center-marker">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#111"></path><circle cx="12" cy="10" r="3" fill="#21EA7C"></circle></svg>
                                    </div>
                                </Map>
                            </YMaps>
                            <button
                                className={`pam-detect-btn ${isDetectingLocation ? 'is-detecting' : ''}`}
                                onClick={handleDetectLocation}
                                disabled={isDetectingLocation}
                                style={{ position: 'absolute', bottom: '15px', right: '15px', zIndex: 10, background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                                <span>{isDetectingLocation ? '...' : t('map.where_am_i')}</span>
                            </button>
                        </div>

                        <div className="address-fields-mini am-fields-v2">
                            <div className="side-by-side" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className={`pam-input-group ${tempStreet ? 'has-value' : ''}`}>
                                    <label>{t('checkout.street')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('checkout.street')}
                                        value={tempStreet}
                                        onChange={e => setTempStreet(e.target.value)}
                                    />
                                </div>
                                <div className={`pam-input-group ${tempHouse ? 'has-value' : ''}`}>
                                    <label>{t('checkout.house')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('checkout.house')}
                                        value={tempHouse}
                                        onChange={e => setTempHouse(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="side-by-side" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div className={`pam-input-group ${tempApartment ? 'has-value' : ''}`}>
                                    <label>{t('checkout.apartment')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('checkout.apartment')}
                                        value={tempApartment}
                                        onChange={e => setTempApartment(e.target.value)}
                                    />
                                </div>
                                <div className={`pam-input-group ${tempEntrance ? 'has-value' : ''}`}>
                                    <label>{t('map.entrance')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('map.entrance')}
                                        value={tempEntrance}
                                        onChange={e => setTempEntrance(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            className="pam-save-btn ct-confirm-btn"
                            onClick={handleSaveAddress}
                            disabled={!tempStreet || !tempHouse}
                            style={{ width: '100%', background: '#21EA7C', color: '#000', border: 'none', borderRadius: '16px', padding: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}
                        >
                            {t('map.confirm')}
                        </button>
                    </div>
                </>
            )}
        </header>
    );
};

export default PCHeader;
