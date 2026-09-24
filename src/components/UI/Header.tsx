import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { useLanguage } from '@/translations/LanguageContext';
import HeaderOrderStatus from './HeaderOrderStatus';
import AddressConfirmModal from '../delivery/AddressConfirmModal';
import PCHeader from './PCHeader';
import './Header.css';

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
    openAddressModalKey?: number;
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
    
    const { language, setLanguage, t } = useLanguage();
    const [langOpen, setLangOpen] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [referralModalOpen, setReferralModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const openAddressModalKey = props.openAddressModalKey ?? 0;

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth > 1024);
        };
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    useEffect(() => {
        if (openAddressModalKey > 0) {
            setMapOpen(true);
        }
    }, [openAddressModalKey]);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    setIsScrolled(prev => {
                        if (!prev && scrollY > 80) return true;
                        if (prev && scrollY < 20) return false;
                        return prev;
                    });
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
            {/* === Main header — fixed, slides up on scroll === */}
            <header className={`custom-header${isScrolled ? ' header-scrolled' : ''}`}>
                <div className="header-container">
                    <div className="header-content">
                        {!hideLogo && (
                            <div className="header-left clickable" onClick={() => {
                                if (onLogoClick) onLogoClick();
                                else onNavigate?.('menu');
                            }}>
                                <img src="/Assets/Loading/logo.png" alt="MestiDelivery" className="header-logo" />
                            </div>
                        )}

                        <div className="header-center">
                            {showSearch && setSearchQuery && (
                                <div className="search-pill">
                                    <div className="search-icon">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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

                        <div className="header-right">
                            <div className="address-pill" onClick={() => setMapOpen(true)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#21EA7C' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                <div className="ap-text">
                                    <span className="ap-title">{t('common.mestia')} <SmallArrowIcon style={{ marginLeft: '4px', transform: 'rotate(90deg)' }} /></span>
                                    <span className="ap-subtitle">
                                        {(userAddress?.street || userAddress?.house)
                                            ? `${userAddress.street}${userAddress.house ? `, ${userAddress.house}` : ''}`
                                            : t('map.title')}
                                    </span>
                                </div>
                            </div>

                            <div className="right-controls-wrapper">
                                <div className="lang-container" style={{ position: 'relative' }}>
                                    <button className="lang-btn" onClick={() => setLangOpen(!langOpen)}>
                                        <img src={currentLang.flag} alt={currentLang.name} className="lang-flag" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
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
                                <button type="button" className="user-avatar" onClick={() => onProfileClick && onProfileClick()}>
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

            {/* === Compact sticky header — slides in from top on scroll (mobile only) === */}
            <div className={`menu-compact-header ${isScrolled ? 'visible' : ''}`}>
                <div className="mch-search-row">
                    {showSearch && setSearchQuery && (
                        <div className="mch-search-pill">
                            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input
                                type="text"
                                placeholder={searchPlaceholder || t('common.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}
                    <button className="lang-btn mch-lang-btn" onClick={() => setLangOpen(!langOpen)}>
                        <img src={currentLang.flag} alt={currentLang.name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
                    </button>
                </div>
                {onOrderClick && <HeaderOrderStatus onNavigate={onOrderClick} />}
            </div>

            <AddressConfirmModal
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                userAddress={userAddress}
                onConfirm={(addr) => onUpdateAddress?.(addr)}
                variant="mobile"
            />

            {referralModalOpen && (
                <div className="modal-overlay pam-overlay" onClick={() => setReferralModalOpen(false)}>
                    <div className="premium-address-modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
                        <Gift size={48} strokeWidth={1.6} color="#21EA7C" style={{ marginBottom: '20px' }} aria-hidden="true" />
                        <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', color: '#fff' }}>{t('referral.title')}</h2>
                        <p style={{ color: '#8E8E93', marginBottom: '32px', lineHeight: 1.5 }}>
                            {t('referral.desc').split('{bonuses}')[0]}
                            <span style={{ color: '#21EA7C', fontWeight: 700 }}>{t('referral.bonuses')}</span>
                            {t('referral.desc').split('{bonuses}')[1]}
                        </p>
                        <div style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(33, 234, 124, 0.3)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700, letterSpacing: '2px' }}>MESTIGO500</span>
                            <button onClick={() => { navigator.clipboard.writeText('MESTIGO500'); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }} style={{ background: '#21EA7C', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>
                                {shareCopied ? t('referral.copied') : t('referral.copy')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {paymentModalOpen && (
                <div className="modal-overlay pam-overlay" onClick={() => setPaymentModalOpen(false)}>
                    <div className="premium-address-modal" style={{ padding: '24px' }}>
                        <h3 className="pam-title">{t('checkout.payment_method_title')}</h3>
                        {/* Simplified methods */}
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
