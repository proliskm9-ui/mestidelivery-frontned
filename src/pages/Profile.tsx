import React, { useState, useEffect } from 'react';
import FlowShell from '../components/Desktop/FlowShell';
import './Profile.css';
import { useLanguage } from '../translations/LanguageContext';
import AvatarPickerSheet from '../components/UI/AvatarPickerSheet';
import MobileProfile from './MobileProfile';

const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

const SmallArrowIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const IconPlus = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
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
}

const ProfilePage: React.FC<ProfilePageProps> = ({
    userAddress,
    onUpdateAddress,
    userProfile,
    onUpdateProfile,
    onLogout,
    onBack,
    onOrderClick,
    orderHistory = []
}) => {
    const { t } = useLanguage();
    const [view, setView] = useState<ProfileSection>('dashboard');
    const [avatarModal, setAvatarModal] = useState(false);
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

    const renderDashboard = () => (
        <>
            {renderHeader(t('profile.title'), () => onBack?.())}
            <div className="bento-grid">
                <div className="bento-card card-profile-main">
                    <button type="button" className="main-avatar-box" onClick={() => setAvatarModal(true)} aria-label={t('profile.choose_avatar')}>
                        {userProfile?.avatar?.length > 2 ? (
                            <img src={userProfile.avatar} alt="" />
                        ) : (
                            <span className="main-avatar-fallback">{(userProfile?.name || '?').charAt(0).toUpperCase()}</span>
                        )}
                        <span className="edit-overlay-btn"><IconEdit /></span>
                    </button>
                    <div className="main-user-info">
                        <h2>{userProfile?.name || t('profile.user_fallback')}</h2>
                        <p>{userProfile?.phone || t('profile.phone')}</p>
                        <div className="points-pill">
                            <span>{userProfile?.points || 0} {t('profile.points_label')}</span>
                        </div>
                    </div>
                    <button type="button" className="bento-ghost-btn" onClick={openPersonal} aria-label={t('profile.personal_data')}>
                        <IconEdit />
                    </button>
                </div>

                <div className="bento-card card-orders">
                    <div className="card-orders-head">
                        <h3 className="card-label">{t('profile.history_title')}</h3>
                        {orderHistory.length > 0 && (
                            <button type="button" className="see-all" onClick={() => setView('history')}>
                                <span>{t('menu.all')}</span>
                                <span><SmallArrowIcon /></span>
                            </button>
                        )}
                    </div>
                    {orderHistory.length === 0 ? (
                        <div className="profile-empty">{t('profile.history_empty')}</div>
                    ) : (
                        <div className="orders-list">
                            {orderHistory.slice(0, 3).map(renderOrderItem)}
                        </div>
                    )}
                </div>

                <div className="bento-card card-address">
                    <div className="address-content-bento">
                        <div className="address-block-top">
                            <h3 className="card-label">{t('profile.addresses')}</h3>
                            <button
                                type="button"
                                className={`address-chip ${userAddress?.street ? 'has-address' : 'is-empty'}`}
                                onClick={openAddresses}
                            >
                                <span className="address-chip-icon" aria-hidden="true">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                </span>
                                <span className="address-chip-text">
                                    {userAddress?.street ? (
                                        <>
                                            <span className="address-chip-line">
                                                {userAddress.street}
                                                {userAddress.house ? `, ${userAddress.house}` : ''}
                                            </span>
                                            {(userAddress.apartment || userAddress.entrance) && (
                                                <span className="address-chip-meta">
                                                    {[
                                                        userAddress.apartment && `${userAddress.apartment}`,
                                                        userAddress.entrance && `${t('map.entrance')} ${userAddress.entrance}`,
                                                    ].filter(Boolean).join(' · ')}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="address-chip-line">{t('common.select_address')}</span>
                                    )}
                                </span>
                            </button>
                        </div>
                        <button type="button" className="bento-icon-btn" onClick={openAddresses} aria-label={t('profile.addresses')}>
                            <IconPlus />
                        </button>
                    </div>
                </div>

                <button type="button" className="bento-card card-invite" onClick={() => (window as any).MestiReferral?.open()}>
                    <h3 className="card-label">{t('profile.invite_title')}</h3>
                    <p className="support-preview">{t('profile.invite_sub')}</p>
                    <span className="card-invite-cta">{t('profile.invite_cta')} →</span>
                </button>

                <button
                    type="button"
                    className="bento-card card-support"
                    onClick={() => window.open('https://t.me/MestigoSupport_Bot', '_blank')}
                >
                    <h3 className="card-label">{t('profile.support')}</h3>
                    <p className="support-preview">{t('profile.support_desc')}</p>
                </button>

                <button type="button" className="logout-link-bento" onClick={onLogout}>
                    {t('profile.logout')}
                </button>
            </div>
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
