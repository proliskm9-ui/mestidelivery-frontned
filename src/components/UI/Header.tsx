import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/translations/LanguageContext';
import HeaderOrderStatus from './HeaderOrderStatus';
import { YMaps, Map } from '@pbe/react-yandex-maps';
import PCHeader from './PCHeader';

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

const Header: React.FC<HeaderProps> = (props) => {
    const {
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
    } = props;
    
    const { language, setLanguage } = useLanguage();
    const [langOpen, setLangOpen] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [referralModalOpen, setReferralModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth > 768);
        };
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

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

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 20;
            if (scrolled !== isScrolled) {
                setIsScrolled(scrolled);
                setHasScrolled(true);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isScrolled]);

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
            // Use the global ymaps object if available
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

    useEffect(() => {
        if (mapOpen || referralModalOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [mapOpen, referralModalOpen]);

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    if (isDesktop) {
        return <PCHeader {...props} />;
    }

    return (
        <>
            <header className={`custom-header ${isScrolled ? 'header-scrolled' : (hasScrolled ? 'header-unscrolled' : '')}`}>
                <div className="header-container">
                    <div className="header-content">
                        {!hideLogo && (
                            <div className="header-left clickable" onClick={() => {
                                if (onLogoClick) onLogoClick();
                                else onNavigate?.('menu');
                            }}>
                                <img src="/Assets/Loading/logo.png" alt="MestiGo" className="header-logo" />
                            </div>
                        )}

                        <div className="header-center">
                            {showSearch && setSearchQuery && (
                                <div className="search-pill">
                                    <div className="search-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={searchPlaceholder || "Искать в mestigo"}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="header-right">
                            <div className="address-pill" onClick={() => setMapOpen(true)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#21EA7C' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                <div className="ap-text">
                                    <span className="ap-title">Местия <SmallArrowIcon style={{ marginLeft: '4px', transform: 'rotate(90deg)' }} /></span>
                                    <span className="ap-subtitle">
                                        {(userAddress?.street || userAddress?.house)
                                            ? `${userAddress.street}${userAddress.house ? `, ${userAddress.house}` : ''}`
                                            : 'Укажите адрес доставки'}
                                    </span>
                                </div>
                            </div>

                            <div className="right-controls-wrapper">
                                <div className="lang-container" style={{ position: 'relative' }}>
                                    <button className="lang-btn" onClick={() => setLangOpen(!langOpen)}>
                                        <img src={currentLang.flag} alt={currentLang.name} className="lang-flag" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'none' }}><path d="M6 9l6 6 6-6"></path></svg>
                                    </button>
                                    {langOpen && (
                                        <>
                                            <div className="lang-modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 190 }} onClick={() => setLangOpen(false)}></div>
                                            <div className="lang-modal">
                                                {LANGUAGES.map((lang) => (
                                                    <div key={lang.code} className={`lang-option ${language === lang.code ? 'active' : ''}`} onClick={() => { setLanguage(lang.code as any); setLangOpen(false); }}>
                                                        <img src={lang.flag} alt={lang.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                                                        <span>{lang.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="profile-container">
                                <button className="user-avatar" onClick={() => onProfileClick && onProfileClick()}>
                                    {userProfile?.avatar && userProfile.avatar.length > 2 ? (
                                        <img src={userProfile.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <img src="/Assets/profile-green.png" alt="Profile" style={{ width: '24px', height: '24px' }} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {onOrderClick && <HeaderOrderStatus onNavigate={onOrderClick} />}
            </header>

            {mapOpen && (
                <>
                    <div className="modal-overlay pam-overlay" onClick={() => setMapOpen(false)}></div>
                    <div className="premium-address-modal" onClick={e => e.stopPropagation()}>
                        <div className="pam-header">
                            <div>
                                <h3 className="pam-title">г. Местия</h3>
                                <p className="pam-subtitle">Укажите адрес доставки</p>
                            </div>
                        </div>

                        <div className="pam-map-visual" style={{ padding: 0, position: 'relative', overflow: 'hidden', height: '180px', borderRadius: '16px', marginBottom: '16px' }}>
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
                                <span>{isDetectingLocation ? '...' : 'Где я?'}</span>
                            </button>
                        </div>

                        <div className="address-fields-mini am-fields-v2">
                            <div className="side-by-side">
                                <div className={`pam-input-group ${tempStreet ? 'has-value' : ''}`}>
                                    <label>Улица</label>
                                    <input
                                        type="text"
                                        placeholder="Улица"
                                        value={tempStreet}
                                        onChange={e => setTempStreet(e.target.value)}
                                    />
                                </div>
                                <div className={`pam-input-group ${tempHouse ? 'has-value' : ''}`}>
                                    <label>Дом</label>
                                    <input
                                        type="text"
                                        placeholder="Дом"
                                        value={tempHouse}
                                        onChange={e => setTempHouse(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="side-by-side">
                                <div className={`pam-input-group ${tempApartment ? 'has-value' : ''}`}>
                                    <label>Кв. / Офис</label>
                                    <input
                                        type="text"
                                        placeholder="Кв. / Офис"
                                        value={tempApartment}
                                        onChange={e => setTempApartment(e.target.value)}
                                    />
                                </div>
                                <div className={`pam-input-group ${tempEntrance ? 'has-value' : ''}`}>
                                    <label>Подъезд</label>
                                    <input
                                        type="text"
                                        placeholder="Подъезд"
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
                        >
                            Подтвердить адрес
                        </button>
                    </div>
                </>
            )}

            {referralModalOpen && (
                <div className="modal-overlay pam-overlay" onClick={() => setReferralModalOpen(false)}>
                    <div className="premium-address-modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎁</div>
                        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', color: '#fff' }}>Пригласи друга!</h2>
                        <p style={{ color: '#8E8E93', marginBottom: '32px', lineHeight: 1.5 }}>
                            Поделись своим кодом с друзьями и получите по <span style={{ color: '#21EA7C', fontWeight: 700 }}>500 бонусов</span> на следующий заказ!
                        </p>
                        <div style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(33, 234, 124, 0.3)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700, letterSpacing: '2px' }}>MESTIGO500</span>
                            <button onClick={() => { navigator.clipboard.writeText('MESTIGO500'); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }} style={{ background: '#21EA7C', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>
                                {shareCopied ? 'Скопировано!' : 'Копировать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {paymentModalOpen && (
                <div className="modal-overlay pam-overlay" onClick={() => setPaymentModalOpen(false)}>
                    <div className="premium-address-modal" style={{ padding: '24px' }}>
                        <h3 className="pam-title">Способы оплаты</h3>
                        {/* Simplified methods */}
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
