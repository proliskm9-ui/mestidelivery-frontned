import React, { useState, useEffect } from 'react';
import FlowShell from '../components/Desktop/FlowShell';
import './Profile.css';
import { useLanguage } from '../translations/LanguageContext';
import AvatarPickerSheet from '../components/UI/AvatarPickerSheet';
import MobileProfile from './MobileProfile';
import PromoCodesSheet from '../components/Profile/PromoCodesSheet';
import { restaurantCache } from '../services/api';

const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);


const IconChevronRight = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);


const IconBack = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

type ProfileSection = 'dashboard' | 'personal' | 'addresses' | 'history';

interface ProfilePageProps {
    userAddress?: any;
    onUpdateAddress?: (address: any) => void;
    userProfile?: any;
    onUpdateProfile?: (updates: any) => void;
    orderHistory?: any[];
    onLogout?: () => void;
    onBack?: () => void;
    onOrderClick?: (orderId: number) => void;
    onNavigate?: (page: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
    userAddress,
    onUpdateAddress,
    userProfile,
    onUpdateProfile,
    onLogout,
    onBack,
    onOrderClick,
    onNavigate,
    orderHistory = []
}) => {
    const { t, language, setLanguage } = useLanguage();
    const [view, setView] = useState<ProfileSection>('dashboard');
    const [avatarModal, setAvatarModal] = useState(false);
    const [promoOpen, setPromoOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [editProfile, setEditProfile] = useState({ name: '', phone: '' });
    const [editAddress, setEditAddress] = useState({ street: '', house: '', apartment: '', entrance: '' });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMobile) {
        return (
            <MobileProfile
                userAddress={userAddress}
                onUpdateAddress={onUpdateAddress}
                userProfile={userProfile}
                onUpdateProfile={onUpdateProfile}
                orderHistory={orderHistory}
                onLogout={onLogout}
                onBack={onBack}
                onOrderClick={onOrderClick}
                onNavigate={onNavigate}
            />
        );
    }

    const formatTime = (order: any) => {
        const raw = order.created_at || order.date || order.timestamp;
        if (!raw) return '—';
        try {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return '—';
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        } catch {
            return '—';
        }
    };

    const getStatusLabel = (status?: string): { label: string; className: string } => {
        const s = status?.toLowerCase() || 'delivered';
        switch (s) {
            case 'pending':
            case 'confirmed':
                return { label: t('status.pending'), className: 'pending' };
            case 'preparing':
                return { label: t('status.preparing'), className: 'pending' };
            case 'ready':
                return { label: t('status.ready'), className: 'pending' };
            case 'delivering':
                return { label: t('status.delivering'), className: 'pending' };
            case 'cancelled':
                return { label: t('status.cancelled'), className: 'cancelled' };
            default:
                return { label: t('status.delivered'), className: 'delivered' };
        }
    };

    const openPersonal = () => {
        setEditProfile({ name: userProfile?.name || '', phone: userProfile?.phone || '' });
        setView('personal');
    };

    const openAddresses = () => {
        setEditAddress({
            street: userAddress?.street || '',
            house: userAddress?.house || '',
            apartment: userAddress?.apartment || '',
            entrance: userAddress?.entrance || ''
        });
        setView('addresses');
    };

    const renderHeader = (title: string, onHeaderBack: () => void) => (
        <header className="profile-header">
            <button type="button" className="ui-circle-btn" onClick={onHeaderBack} aria-label={t('common.back')}>
                <IconBack />
            </button>
            <h1>{title}</h1>
            <div className="profile-header-spacer" aria-hidden="true" />
        </header>
    );

    const renderOrderItem = (order: any, i: number) => {
        const statusInfo = getStatusLabel(order.status);
        const orderName = order.restaurant_name || `${t('common.order')} #${order.id}`;
        const orderAddress = typeof order.address === 'string' ? order.address : (order.address?.street || '—');
        return (
            <button
                key={order.id || i}
                type="button"
                className="mini-order-item"
                onClick={() => onOrderClick?.(order.id)}
            >
                <div className="order-main-content">
                    <h4 className="order-vendor-name">
                        <span className="order-vendor-text">{orderName}</span>
                        <span className="order-vendor-time">{formatTime(order)}</span>
                    </h4>
                    <span className="order-meta-info">{orderAddress || '—'}</span>
                </div>
                <div className="order-side-info">
                    <span className="order-price-bold">{Number(order.total || 0).toFixed(2)} ₾</span>
                    <span className={`order-status-pill ${statusInfo.className}`}>{statusInfo.label}</span>
                </div>
            </button>
        );
    };

    const renderPersonal = () => (
        <>
            {renderHeader(t('profile.personal_data'), () => setView('dashboard'))}
            <div className="bento-card bento-card--form">
                <div className="personal-form-bento">
                    <div className="bento-input-group">
                        <label>{t('profile.name')}</label>
                        <input
                            className="bento-input"
                            value={editProfile.name}
                            onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                        />
                    </div>
                    <div className="bento-input-group">
                        <label>{t('profile.phone')}</label>
                        <input
                            className="bento-input"
                            value={editProfile.phone}
                            onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                        />
                    </div>
                    <button
                        type="button"
                        className="bento-primary-btn"
                        onClick={() => {
                            onUpdateProfile?.(editProfile);
                            setView('dashboard');
                        }}
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </>
    );

    const renderAddresses = () => (
        <>
            {renderHeader(t('profile.addresses'), () => setView('dashboard'))}
            <div className="bento-card bento-card--form">
                <div className="personal-form-bento">
                    <div className="bento-input-group">
                        <label>{t('profile.street')}</label>
                        <input
                            className="bento-input"
                            value={editAddress.street}
                            onChange={(e) => setEditAddress({ ...editAddress, street: e.target.value })}
                        />
                    </div>
                    <div className="bento-input-row">
                        <div className="bento-input-group">
                            <label>{t('profile.house')}</label>
                            <input
                                className="bento-input"
                                value={editAddress.house}
                                onChange={(e) => setEditAddress({ ...editAddress, house: e.target.value })}
                            />
                        </div>
                        <div className="bento-input-group">
                            <label>{t('map.entrance')}</label>
                            <input
                                className="bento-input"
                                value={editAddress.entrance}
                                onChange={(e) => setEditAddress({ ...editAddress, entrance: e.target.value })}
                            />
                        </div>
                        <div className="bento-input-group">
                            <label>{t('profile.apartment')}</label>
                            <input
                                className="bento-input"
                                value={editAddress.apartment}
                                onChange={(e) => setEditAddress({ ...editAddress, apartment: e.target.value })}
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        className="bento-primary-btn"
                        onClick={() => {
                            onUpdateAddress?.(editAddress);
                            setView('dashboard');
                        }}
                    >
                        {t('profile.update')}
                    </button>
                </div>
            </div>
        </>
    );

    const renderHistory = () => (
        <>
            {renderHeader(t('profile.history_title'), () => setView('dashboard'))}
            <div className="bento-card bento-card--form">
                {orderHistory.length === 0 ? (
                    <div className="profile-empty">{t('profile.history_empty')}</div>
                ) : (
                    <div className="history-grid">
                        {orderHistory.map(renderOrderItem)}
                    </div>
                )}
            </div>
        </>
    );

    const openReferral = () => (window as any).MestiReferral?.open();
    const orderImage = (order: any): string | undefined => restaurantCache[`rest_${order.restaurant_id}`]?.img || undefined;
    const orderDate = (order: any) => {
        const raw = order.created_at || order.date || order.timestamp;
        const d = raw ? new Date(raw) : null;
        if (!d || isNaN(d.getTime())) return '';
        const months = t('calendar.months') as unknown as string[];
        return `${d.getDate()} ${Array.isArray(months) ? months[d.getMonth()] : ''}`.trim();
    };
    const statusTone = (cls: string) => (cls === 'pending' ? 'warn' : cls === 'cancelled' ? 'danger' : 'ok');

    const renderDashboard = () => (
        <>
            {renderHeader(t('profile.title'), () => onBack?.())}
            <div className="bento-grid pd-grid">
                {/* Identity: avatar opens the picker, the rest opens personal data */}
                <div className="bento-card pd-id">
                    <button type="button" className="pd-id-avatar" onClick={() => setAvatarModal(true)} aria-label={t('profile.choose_avatar')}>
                        {userProfile?.avatar?.length > 2 ? (
                            <img src={userProfile.avatar} alt="" />
                        ) : (
                            <span>{(userProfile?.name || '?').charAt(0).toUpperCase()}</span>
                        )}
                        <i className="pd-id-avatar-edit"><IconEdit /></i>
                    </button>
                    <button type="button" className="pd-id-main" onClick={openPersonal}>
                        <span className="pd-id-text">
                            <span className="pd-id-name">{userProfile?.name || t('profile.user_fallback')}</span>
                            <span className="pd-id-phone">{userProfile?.phone || t('profile.phone')}</span>
                        </span>
                        <span className="pd-chevron"><IconChevronRight /></span>
                    </button>
                </div>

                {/* Bonuses */}
                <div className="bento-card pd-bonus">
                    <button type="button" className="pd-bonus-balance" onClick={openReferral}>
                        <span className="pd-bonus-head">
                            <span className="pd-bonus-title">{t('profile.bonus_title')}</span>
                            <span className="pd-bonus-note">{t('profile.bonus_spend')}</span>
                        </span>
                        <span className="pd-bonus-value">{userProfile?.points || 0}<small>GEL</small></span>
                    </button>
                    <div className="pd-bonus-foot">
                        <span className="pd-bonus-hint"><b>{t('profile.invite_bonus')}</b> {t('profile.invite_sub')}</span>
                        <button type="button" className="ds-btn ds-btn--primary pd-bonus-cta" onClick={openReferral}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>
                            {t('profile.invite_button')}
                        </button>
                    </div>
                </div>

                {/* Quick tiles */}
                <button type="button" className="bento-card pd-tile" onClick={() => setPromoOpen(true)}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M9 9h.01M15 15h.01M15.5 8.5l-7 7" /></svg>
                    <span className="pd-tile-title">{t('profile.promo_title')}</span>
                    <span className="pd-tile-sub">{t('profile.promo_sub')}</span>
                </button>
                <button type="button" className="bento-card pd-tile" onClick={openAddresses}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span className="pd-tile-title">{t('profile.tile_addresses')}</span>
                    <span className="pd-tile-sub">{userAddress?.street ? `${userAddress.street}${userAddress.house ? `, ${userAddress.house}` : ''}` : t('common.select_address')}</span>
                </button>
                <a className="bento-card pd-tile" href="https://t.me/MestigoSupport_Bot" target="_blank" rel="noopener noreferrer">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" /></svg>
                    <span className="pd-tile-title">{t('profile.support')}</span>
                    <span className="pd-tile-sub">{t('profile.info_support')}</span>
                </a>

                {/* Recent orders */}
                <div className="bento-card pd-orders">
                    <div className="pd-orders-head">
                        <h3 className="card-label">{t('profile.history_title')}</h3>
                        {orderHistory.length > 0 && (
                            <button type="button" className="pd-link" onClick={() => setView('history')}>{t('menu.all')}</button>
                        )}
                    </div>
                    {orderHistory.length === 0 ? (
                        <div className="profile-empty">{t('profile.history_empty')}</div>
                    ) : (
                        <div className="pd-orders-list">
                            {orderHistory.slice(0, 4).map((order, i) => {
                                const statusInfo = getStatusLabel(order.status);
                                const img = orderImage(order);
                                return (
                                    <button key={order.id || i} type="button" className="pd-order" onClick={() => onOrderClick?.(order.id)}>
                                        <span className="pd-order-thumb">
                                            {img ? <img src={img} alt="" loading="lazy" /> : <img src="/Assets/general-green.png" alt="" className="is-logo" />}
                                        </span>
                                        <span className="pd-order-main">
                                            <span className="pd-order-name">{order.restaurant_name || `${t('common.order')} #${order.id}`}</span>
                                            <span className="pd-order-meta">{[orderDate(order), formatTime(order)].filter((s) => s && s !== '—').join(' · ')}</span>
                                        </span>
                                        <span className="pd-order-side">
                                            <span className="pd-order-price">{Number(order.total || 0).toFixed(2)} ₾</span>
                                            <span className={`pd-order-status is-${statusTone(statusInfo.className)}`}>{statusInfo.label}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Language + logout */}
                <div className="pd-side">
                    <div className="bento-card pd-lang">
                        <span className="pd-lang-title">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                            {t('home.language')}
                        </span>
                        <div className="pd-lang-seg" role="radiogroup">
                            {(['ru', 'en', 'ka'] as const).map((l) => (
                                <button key={l} type="button" role="radio" aria-checked={language === l} className={language === l ? 'is-active' : ''} onClick={() => setLanguage(l)}>
                                    {l === 'ka' ? 'ქარ' : l.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="button" className="logout-link-bento pd-logout" onClick={onLogout}>
                        {t('profile.logout')}
                    </button>
                </div>
            </div>
            <p className="pd-version">MestiDelivery · {t('profile.version')} {__APP_VERSION__} · {__BUILD_DATE__.split('-').reverse().join('.')}</p>
        </>
    );

    return (
        <FlowShell desktopOnly onBack={() => (view === 'dashboard' ? onBack?.() : setView('dashboard'))}>
        <div className="profile-page-wrapper">
            <div className="profile-glow" aria-hidden="true" />
            <div className="profile-container">
                {view === 'dashboard' && renderDashboard()}
                {view === 'personal' && renderPersonal()}
                {view === 'addresses' && renderAddresses()}
                {view === 'history' && renderHistory()}
            </div>

            <PromoCodesSheet open={promoOpen} onOpenChange={setPromoOpen} />
            <AvatarPickerSheet
                open={avatarModal}
                onOpenChange={setAvatarModal}
                current={userProfile?.avatar}
                onPick={(avatar) => onUpdateProfile?.({ avatar })}
            />
        </div>
        </FlowShell>
    );
};

export default ProfilePage;
