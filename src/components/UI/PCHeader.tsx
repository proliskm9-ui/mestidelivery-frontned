import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/translations/LanguageContext';
import HeaderOrderStatus from './HeaderOrderStatus';
import AddressConfirmModal from '../delivery/AddressConfirmModal';
import './PCHeader.css';

const LANGUAGES = [
    { code: 'ru', name: 'RU', flag: '/Assets/RU.png' },
    { code: 'ka', name: 'KA', flag: '/Assets/GE.png' },
    { code: 'en', name: 'EN', flag: '/Assets/US.png' }
];

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
    openAddressModalKey?: number;
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
    onLogoClick,
    openAddressModalKey = 0,
}) => {
    const { language, setLanguage, t } = useLanguage();
    const [langOpen, setLangOpen] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (openAddressModalKey > 0) {
            setMapOpen(true);
        }
    }, [openAddressModalKey]);

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
    const isGuest = !userProfile?.phone && !(userProfile?.name && userProfile.name !== '...' && userProfile.name.trim().length > 1);
    const addressLabel = (userAddress?.street || userAddress?.house)
        ? `${userAddress.street || ''}${userAddress.house ? `, ${userAddress.house}` : ''}`
        : (t('map.title') || 'Укажите адрес');

    return (
        <header className={`hd pc-hd${isScrolled ? ' is-scrolled' : ''}`}>
            <div className="hd-inner">
                {!hideLogo && (
                    <div
                        className="hd-logo"
                        onClick={() => {
                            if (onLogoClick) onLogoClick();
                            else onNavigate?.('menu');
                        }}
                    >
                        <span className="hd-logo-text">
                            <span className="solid">Mesti</span>
                            <span className="logo-delivery">Delivery</span>
                        </span>
                    </div>
                )}

                <div className="hd-catalog-mid">
                    {showSearch && setSearchQuery && (
                        <div className="hd-search">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder={searchPlaceholder || t('common.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}

                    <button
                        type="button"
                        className="hd-address"
                        onClick={() => setMapOpen(true)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="hd-address-text">{addressLabel}</span>
                    </button>
                </div>

                <div className="hd-actions">
                    <span className="hd-divider" />

                    {onOrderClick && (
                        <HeaderOrderStatus onNavigate={onOrderClick} compact={true} />
                    )}

                    <div className="hd-lang">
                        <button type="button" className="hd-lang-btn" onClick={() => setLangOpen(!langOpen)}>
                            <img src={currentLang.flag} alt="" className="hd-lang-flag" />
                            <span>{currentLang.name}</span>
                            <svg className={`hd-chev${langOpen ? ' open' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {langOpen && (
                            <>
                                <div className="hd-lang-backdrop" onClick={() => setLangOpen(false)} />
                                <div className="hd-lang-menu">
                                    {LANGUAGES.map(lang => (
                                        <div
                                            key={lang.code}
                                            className={`hd-lang-item${language === lang.code ? ' is-active' : ''}`}
                                            onClick={() => { setLanguage(lang.code as any); setLangOpen(false); }}
                                        >
                                            <img src={lang.flag} alt="" />
                                            <span>{lang.name}</span>
                                            {language === lang.code && (
                                                <svg className="hd-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {isGuest ? (
                        <button
                            type="button"
                            className="hd-cta"
                            onClick={() => {
                                if (onNavigate) onNavigate('login');
                                else onProfileClick?.();
                            }}
                        >
                            {t('auth.sign_in') || 'Войти'}
                        </button>
                    ) : (
                        <button type="button" className="hd-user-avatar" onClick={() => onProfileClick?.()}>
                            {userProfile?.avatar && userProfile.avatar.length > 2 && !String(userProfile.avatar).includes('profile-green') ? (
                                <img src={userProfile.avatar} alt="Profile" />
                            ) : (
                                <span>{(userProfile?.name || 'U').trim().charAt(0).toUpperCase()}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <AddressConfirmModal
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                userAddress={userAddress}
                onConfirm={(addr) => onUpdateAddress?.(addr)}
                variant="pc"
            />
        </header>
    );
};

export default PCHeader;
