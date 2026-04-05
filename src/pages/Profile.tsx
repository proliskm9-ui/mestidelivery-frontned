import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useLanguage } from '../translations/LanguageContext';
import MobileProfile from './MobileProfile';

// --- Icons ---
const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

const SmallArrowIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M9 18l6-6-6-6"></path>
    </svg>
);

const IconPlus = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

type ProfileSection = 'dashboard' | 'personal' | 'addresses' | 'history' | 'support';

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

const PRESET_AVATARS = [
    { id: 'av1', img: '/Assets/photo_2026-02-11_23-14-10.jpg', label: 'Art 1' },
    { id: 'av2', img: '/Assets/photo_2026-02-11_23-14-27.jpg', label: 'Art 2' },
    { id: 'av3', img: '/Assets/photo_2026-02-11_23-14-50.jpg', label: 'Art 3' },
    { id: 'av4', img: '/Assets/photo_2026-02-11_23-19-47.jpg', label: 'Art 4' }
];

const IconArrowLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

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

    const formatTime = (order: any) => {
        const raw = order.created_at || order.date || order.timestamp;
        if (!raw) return '—';
        try {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return '—';
            const hours = d.getHours().toString().padStart(2, '0');
            const mins = d.getMinutes().toString().padStart(2, '0');
            return `${hours}:${mins}`;
        } catch { return '—'; }
    };

    const getStatusLabel = (status?: string): { label: string, class: string } => {
        const s = status?.toLowerCase() || 'delivered';
        switch (s) {
            case 'pending': return { label: 'Ожидание', class: 'pending' };
            case 'preparing': return { label: 'Готовится', class: 'pending' };
            case 'delivering': return { label: 'В пути', class: 'pending' };
            case 'cancelled': return { label: 'Отменен', class: 'cancelled' };
            default: return { label: 'Доставлен', class: 'delivered' };
        }
    };
    const [avatarModal, setAvatarModal] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleBack = () => setView('dashboard');

    if (isMobile) {
        return <MobileProfile userAddress={userAddress} onUpdateAddress={onUpdateAddress} userProfile={userProfile} onUpdateProfile={onUpdateProfile} orderHistory={orderHistory} onLogout={onLogout} onBack={onBack} onOrderClick={onOrderClick} />;
    }

    // Sub-renders
    const renderPersonal = () => (
        <div className="bento-card" style={{ gridColumn: 'span 6' }}>
            <div className="profile-header" style={{ marginBottom: 30 }}>
                <h2>{t('profile.personal_data')}</h2>
                <button className="back-btn-minimal" onClick={handleBack}>{t('common.back')}</button>
            </div>
            <div className="personal-form-bento">
                <div className="bento-input-group">
                    <label>{t('profile.name')}</label>
                    <input
                        className="bento-input"
                        value={userProfile?.name || ''}
                        onChange={e => onUpdateProfile?.({ name: e.target.value })}
                    />
                </div>
                <div className="bento-input-group">
                    <label>{t('profile.phone')}</label>
                    <input
                        className="bento-input"
                        value={userProfile?.phone || ''}
                        onChange={e => onUpdateProfile?.({ phone: e.target.value })}
                    />
                </div>
                <button className="bento-primary-btn" onClick={handleBack}>{t('common.save')}</button>
            </div>
        </div>
    );

    const renderAddresses = () => (
        <div className="bento-card" style={{ gridColumn: 'span 6' }}>
            <div className="profile-header" style={{ marginBottom: 30 }}>
                <h2>{t('profile.addresses')}</h2>
                <button className="back-btn-minimal" onClick={handleBack}>{t('common.back')}</button>
            </div>

            <div className="personal-form-bento">
                <div className="bento-input-group">
                    <label>{t('profile.street')}</label>
                    <input
                        className="bento-input"
                        value={userAddress?.street || ''}
                        onChange={e => onUpdateAddress?.({ ...userAddress, street: e.target.value })}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                    <div className="bento-input-group">
                        <label>{t('profile.house')}</label>
                        <input className="bento-input" value={userAddress?.house || ''} onChange={e => onUpdateAddress?.({ ...userAddress, house: e.target.value })} />
                    </div>
                    <div className="bento-input-group">
                        <label>{t('checkout.entrance') || 'Подъезд'}</label>
                        <input className="bento-input" value={userAddress?.entrance || ''} onChange={e => onUpdateAddress?.({ ...userAddress, entrance: e.target.value })} />
                    </div>
                    <div className="bento-input-group">
                        <label>{t('profile.apartment')}</label>
                        <input className="bento-input" value={userAddress?.apartment || ''} onChange={e => onUpdateAddress?.({ ...userAddress, apartment: e.target.value })} />
                    </div>
                </div>
                <button className="bento-primary-btn" onClick={handleBack}>{t('profile.update')}</button>
            </div>
        </div>
    );

    const renderHistory = () => (
        <div className="bento-card" style={{ gridColumn: 'span 12' }}>
            <div className="profile-header" style={{ marginBottom: 30 }}>
                <h2>{t('profile.history_title')}</h2>
                <button className="back-btn-minimal" onClick={handleBack}>{t('common.back')}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {orderHistory.map((order, i) => {
                    const statusInfo = getStatusLabel(order.status);
                    const orderName = order.restaurant_name || `Заказ #${order.id}`;
                    const orderAddress = order.address || '';
                    return (
                        <div key={order.id || i} className="mini-order-item" style={{ marginBottom: 0, cursor: 'pointer' }} onClick={() => onOrderClick?.(order.id)}>
                            <div className="order-icon-box">
                                <img src="/Assets/general-green.png" alt="MestiGo" style={{ objectFit: 'contain', padding: '6px' }} />
                            </div>
                            <div className="order-main-content">
                                <h4 className="order-vendor-name">{orderName}, {formatTime(order)}</h4>
                                <span className="order-meta-info">{orderAddress || '—'}</span>
                            </div>
                            <div className="order-side-info">
                                <span className="order-price-bold">{order.total?.toFixed(2)} ₾</span>
                                <span className={`order-status-pill ${statusInfo.class}`}>{statusInfo.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderDashboard = () => (
        <div className="bento-grid">
            {/* 1. Profile Summary Card */}
            <div className="bento-card card-profile-main">
                <div className="main-avatar-box" style={{ borderRadius: '50%' }} onClick={() => setAvatarModal(true)}>
                    {userProfile?.avatar?.length > 2 ? (
                        <img src={userProfile.avatar} alt="Avatar" style={{ borderRadius: '50%' }} />
                    ) : (
                        <span>👤</span>
                    )}
                    <div className="edit-overlay-btn" style={{ borderRadius: '50%' }}><IconEdit /></div>
                </div>
                <div className="main-user-info">
                    <h2>{userProfile?.name || 'Пользователь'}</h2>
                    <p>{userProfile?.phone || t('profile.phone')}</p>
                    <div className="points-pill">
                        <span>{userProfile?.points || 0} {t('profile.points_label') || 'баллов'}</span>
                    </div>
                </div>
                <button
                    className="bento-icon-btn"
                    style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    onClick={() => setView('personal')}
                >
                    <IconEdit />
                </button>
            </div>

            {/* 2. Order History Card */}
            <div className="bento-card card-orders">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <span className="card-label" style={{ margin: 0 }}>{t('profile.history_title')}</span>
                    {orderHistory.length > 0 && (
                        <button className="see-all" onClick={() => setView('history')}>
                            <span>{t('menu.all')}</span>
                            <span><SmallArrowIcon /></span>
                        </button>
                    )}
                </div>
                <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {orderHistory.length === 0 ? (
                        <div style={{ padding: '20px 0', opacity: 0.4 }}>{t('profile.history_empty')}</div>
                    ) : (
                        orderHistory.slice(0, 2).map((order, i) => {
                            const statusInfo = getStatusLabel(order.status);
                            const orderName = order.restaurant_name || `Заказ #${order.id}`;
                            const orderAddress = order.address || '';
                            return (
                                <div key={order.id || i} className="mini-order-item" onClick={() => onOrderClick?.(order.id)}>
                                    <div className="order-main-content">
                                        <h4 className="order-vendor-name">{orderName}, {formatTime(order)}</h4>
                                        <span className="order-meta-info">{orderAddress || '—'}</span>
                                    </div>
                                    <div className="order-side-info">
                                        <span className="order-price-bold">{order.total?.toFixed(2)} ₾</span>
                                        <span className={`order-status-pill ${statusInfo.class}`}>{statusInfo.label}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 3. Address Card */}
            <div className="bento-card card-address">
                <div className="address-content-bento">
                    <div>
                        <span className="card-label">{t('profile.addresses')}</span>
                        <p className="address-preview">
                            {userAddress?.street ? `${userAddress.street}, ${userAddress.house}` : t('common.select_address')}
                        </p>
                    </div>
                    <button className="bento-icon-btn" onClick={() => setView('addresses')}>
                        <IconPlus />
                    </button>
                </div>
            </div>

            {/* 4. Support Card */}
            <div className="bento-card card-support" onClick={() => window.open('https://t.me/MestigoSupport_Bot', '_blank')} style={{ cursor: 'pointer' }}>
                <span className="card-label">{t('profile.support')}</span>
                <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: '14px', color: 'var(--grey)' }}>{t('profile.support_desc')}</p>
                </div>
            </div>

            {/* Logout */}
            <div className="logout-link-bento" onClick={onLogout}>
                {t('profile.logout')}
            </div>
        </div>
    );

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container">
                <header className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h1>{view === 'dashboard' ? 'Профиль' : t('profile.title')}</h1>
                    {view === 'dashboard' && (
                        <button
                            onClick={onBack}
                            style={{
                                background: 'none',
                                border: 'none',
                                borderRadius: '0',
                                padding: '0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--primary)'}
                        >
                            <IconArrowLeft />
                        </button>
                    )}
                </header>

                <main>
                    {view === 'dashboard' && renderDashboard()}
                    {view === 'personal' && renderPersonal()}
                    {view === 'addresses' && renderAddresses()}
                    {view === 'history' && renderHistory()}
                </main>
            </div>

            {/* Avatar Modal */}
            {avatarModal && (
                <div className="bento-modal-overlay" onClick={() => setAvatarModal(false)}>
                    <div className="bento-modal" onClick={e => e.stopPropagation()}>
                        <h3 style={{ textAlign: 'center' }}>{t('profile.choose_avatar')}</h3>
                        <div className="emoji-grid">
                            {PRESET_AVATARS.map(av => (
                                <div
                                    key={av.id}
                                    className={`emoji-btn ${userProfile?.avatar === av.img ? 'active' : ''}`}
                                    onClick={() => {
                                        onUpdateProfile?.({ avatar: av.img });
                                        setAvatarModal(false);
                                    }}
                                    style={{
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        aspectRatio: '1',
                                        padding: 0,
                                        background: 'var(--card-bg)'
                                    }}
                                >
                                    <img src={av.img} alt={av.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                        <label className="bento-primary-btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid var(--card-border)' }}>
                            {t('profile.upload_photo')}
                            <input type="file" hidden accept="image/*" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => { onUpdateProfile?.({ avatar: reader.result }); setAvatarModal(false); };
                                    reader.readAsDataURL(file);
                                }
                            }} />
                        </label>
                        <button className="back-btn-minimal" style={{ width: '100%', marginTop: 16 }} onClick={() => setAvatarModal(false)}>{t('common.cancel')}</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
