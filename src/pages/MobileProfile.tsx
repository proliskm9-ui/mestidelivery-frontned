import React, { useState } from 'react';
import './MobileProfile.css';
import { useLanguage } from '../translations/LanguageContext';
import AvatarPickerSheet from '../components/UI/AvatarPickerSheet';
import Sheet from '../components/UI/Sheet';
import { restaurantCache } from '../services/api';

interface MobileProfileProps {
    userAddress?: any;
    onUpdateAddress?: (address: any) => void;
    userProfile?: any;
    onUpdateProfile?: (updates: any) => void;
    orderHistory?: any[];
    onLogout?: () => void;
    onBack?: () => void;
    onOrderClick?: (orderId: number) => void;
}

const IconArrowLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

const IconChevron = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const SmallArrowIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M9 18l6-6-6-6"></path>
    </svg>
);

const MobileProfile: React.FC<MobileProfileProps> = ({
    userAddress,
    onUpdateAddress,
    userProfile,
    onUpdateProfile,
    orderHistory = [],
    onLogout,
    onBack,
    onOrderClick
}) => {
    const { t } = useLanguage();
    const [view, setView] = useState<'dashboard' | 'personal' | 'addresses' | 'orders'>('dashboard');
    const [avatarModal, setAvatarModal] = useState(false);

    // Temp state for editing
    const [editProfile, setEditProfile] = useState({ name: '', phone: '' });

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

    const formatHeaderDate = (order: any) => {
        const raw = order.created_at || order.date || order.timestamp;
        if (!raw) return '';
        try {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return '';
            const day = d.getDate();
            const months = t('calendar.months') as unknown as string[];
            const dow = t('calendar.dow') as unknown as string[];
            return `${day} ${months[d.getMonth()]}, ${dow[d.getDay()]}`;
        } catch { return ''; }
    };

    const getStatusLabel = (status?: string): { label: string, class: string } => {
        const s = status?.toLowerCase() || 'delivered';
        switch (s) {
            case 'pending': return { label: t('status.pending'), class: 'pending' };
            case 'preparing': return { label: t('status.preparing'), class: 'pending' };
            case 'delivering': return { label: t('status.delivering'), class: 'pending' };
            case 'cancelled': return { label: t('status.cancelled'), class: 'cancelled' };
            default: return { label: t('status.delivered'), class: 'delivered' };
        }
    };
    const [editAddress, setEditAddress] = useState({ street: '', house: '', apartment: '', entrance: '' });

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

    const handleSavePersonal = () => {
        onUpdateProfile?.(editProfile);
        setView('dashboard');
    };

    const handleSaveAddress = () => {
        onUpdateAddress?.(editAddress);
        setView('dashboard');
    };

    const renderDashboard = () => (
        <div className="mp-content">
            {/* User Info Liquid Card */}
            <div className="liquid-card">
                <div className="mp-avatar-section">
                    <div className="mp-avatar-wrapper" onClick={() => setAvatarModal(true)}>
                        {userProfile?.avatar && userProfile.avatar.length > 2 ? (
                            <img src={userProfile.avatar} alt="Avatar" className="mp-avatar" />
                        ) : (
                            <span className="mp-avatar-initial">{(userProfile?.name || '?').trim().charAt(0).toUpperCase()}</span>
                        )}
                        <div className="mp-avatar-edit-icon"><IconEdit /></div>
                    </div>
                    <div className="mp-user-info">
                        <h2 className="mp-user-name">{userProfile?.name || t('profile.user_fallback')}</h2>
                        <p className="mp-user-phone">{userProfile?.phone || t('profile.phone')}</p>
                        <div className="mp-points-pill">
                            <span>{userProfile?.points || 0} {t('profile.points_label')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite: its own group, the reward is the hook */}
            <div className="liquid-card mp-action-list">
                <a className="mp-action-item" onClick={() => (window as any).MestiReferral?.open()}>
                    <div className="mp-action-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>
                    </div>
                    <div className="mp-action-text">
                        <h3 className="mp-action-title">{t('profile.invite_title')}</h3>
                        <p className="mp-action-subtitle"><span className="mp-action-bonus">{t('profile.invite_bonus')}</span> {t('profile.invite_sub')}</p>
                    </div>
                    <div className="mp-action-chevron"><IconChevron /></div>
                </a>
            </div>

            {/* Settings: one grouped list, rows split by hairlines */}
            <div className="liquid-card mp-action-list">
                <a className="mp-action-item" onClick={openPersonal}>
                    <div className="mp-action-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2">
<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div className="mp-action-text">
                        <h3 className="mp-action-title">{t('profile.personal_data')}</h3>
                        <p className="mp-action-subtitle">{t('profile.info_name_phone')}</p>
                    </div>
                    <div className="mp-action-chevron"><IconChevron /></div>
                </a>

                <a className="mp-action-item" onClick={openAddresses}>
                    <div className="mp-action-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2">
<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div className="mp-action-text">
                        <h3 className="mp-action-title">{t('profile.addresses')}</h3>
                        <p className="mp-action-subtitle">{userAddress?.street ? `${userAddress.street}, ${userAddress.house}` : t('common.select_address')}</p>
                    </div>
                    <div className="mp-action-chevron"><IconChevron /></div>
                </a>

                <a className="mp-action-item" href="https://t.me/MestigoSupport_Bot" target="_blank" rel="noopener noreferrer">
                    <div className="mp-action-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                        </svg>
                    </div>
                    <div className="mp-action-text">
                        <h3 className="mp-action-title">{t('profile.support')}</h3>
                        <p className="mp-action-subtitle">{t('profile.info_support')}</p>
                    </div>
                    <div className="mp-action-chevron"><IconChevron /></div>
                </a>
            </div>

            {/* Orders Mini Widget */}
            <div className="liquid-card" style={{ padding: '24px 20px' }}>
                <div className="mp-orders-header">
                    <h3 className="mp-orders-title">{t('profile.history_title')}</h3>
                    {orderHistory.length > 0 && (
                        <button className="see-all" onClick={() => setView('orders')}>
                            <span>{t('menu.all')}</span>
                            <span><SmallArrowIcon /></span>
                        </button>
                    )}
                </div>
                {orderHistory.length === 0 ? (
                    <div style={{ padding: '20px 0', opacity: 0.5, textAlign: 'center' }}>
                        {t('profile.history_empty')}
                    </div>
                ) : (
                    <div>
                        {orderHistory.slice(0, 2).map((order, i) => {
                            const statusInfo = getStatusLabel(order.status);
                            const orderName = order.restaurant_name || `${t('common.order')} #${order.id}`;
                            const orderAddress = typeof order.address === 'string'
                                ? order.address
                                : [order.address?.street, order.address?.house].filter(Boolean).join(', ');
                            return (
                                <div key={order.id || i} className="mp-order-item" onClick={() => onOrderClick?.(order.id)}>
                                    <div className="mp-order-main">
                                        <h4 className="mp-order-name">{orderName}, {formatTime(order)}</h4>
                                        <span className="mp-order-meta">{orderAddress || '—'}</span>
                                    </div>
                                    <div className="mp-order-side">
                                        <span className="mp-order-price">{Number(order.total || 0).toFixed(2)} ₾</span>
                                        <span className={`mp-order-status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Logout Button */}
            <button className="mp-logout-btn" onClick={onLogout}>
                {t('profile.logout')}
            </button>
        </div>
    );

    const renderPersonalForm = () => (
        <Sheet
            tall
            open={view === 'personal'}
            onOpenChange={(open) => { if (!open) setView('dashboard'); }}
            title={t('profile.personal_data')}
            footer={<button type="button" className="ds-btn ds-btn--primary" onClick={handleSavePersonal}>{t('common.save')}</button>}
        >
                <div className={`mp-ct-input-wrapper ${editProfile.name ? 'has-value' : ''}`}>
                    <span className="mp-ct-input-label">{t('profile.name')}</span>
                    <input
                        className="mp-ct-input"
                        value={editProfile.name}
                        onChange={e => setEditProfile({ ...editProfile, name: e.target.value })}
                        placeholder={editProfile.name ? '' : t('profile.name') as string}
                    />
                </div>
                <div className={`mp-ct-input-wrapper ${editProfile.phone ? 'has-value' : ''}`}>
                    <span className="mp-ct-input-label">{t('profile.phone')}</span>
                    <input
                        className="mp-ct-input"
                        value={editProfile.phone}
                        onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })}
                        placeholder={editProfile.phone ? '' : t('profile.phone') as string}
                    />
                </div>

        </Sheet>
    );

    const renderAddressesForm = () => (
        <Sheet
            tall
            open={view === 'addresses'}
            onOpenChange={(open) => { if (!open) setView('dashboard'); }}
            title={t('profile.addresses')}
            footer={<button type="button" className="ds-btn ds-btn--primary" onClick={handleSaveAddress}>{t('profile.update')}</button>}
        >
                <div className={`mp-ct-input-wrapper ${editAddress.street ? 'has-value' : ''}`}>
                    <span className="mp-ct-input-label">{t('profile.street')}</span>
                    <input
                        className="mp-ct-input"
                        value={editAddress.street}
                        onChange={e => setEditAddress({ ...editAddress, street: e.target.value })}
                        placeholder={editAddress.street ? '' : t('profile.street') as string}
                    />
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className={`mp-ct-input-wrapper ${editAddress.house ? 'has-value' : ''}`} style={{ flex: 1 }}>
                        <span className="mp-ct-input-label">{t('profile.house')}</span>
                        <input
                            className="mp-ct-input"
                            value={editAddress.house}
                            onChange={e => setEditAddress({ ...editAddress, house: e.target.value })}
                            placeholder={editAddress.house ? '' : t('profile.house') as string}
                        />
                    </div>
                      <div className={`mp-ct-input-wrapper ${editAddress.entrance ? 'has-value' : ''}`} style={{ flex: 1 }}>
                          <span className="mp-ct-input-label">{t('map.entrance')}</span>
                          <input
                              className="mp-ct-input"
                              value={editAddress.entrance || ''}
                              onChange={e => setEditAddress({ ...editAddress, entrance: e.target.value })}
                              placeholder={editAddress.entrance ? '' : t('map.entrance') as string}
                          />
                      </div>
                    <div className={`mp-ct-input-wrapper ${editAddress.apartment ? 'has-value' : ''}`} style={{ flex: 1 }}>
                        <span className="mp-ct-input-label">{t('profile.apartment')}</span>
                        <input
                            className="mp-ct-input"
                            value={editAddress.apartment}
                            onChange={e => setEditAddress({ ...editAddress, apartment: e.target.value })}
                            placeholder={editAddress.apartment ? '' : t('profile.apartment') as string}
                        />
                    </div>
                </div>

        </Sheet>
    );

    // Restaurant photo for an order row (restaurants are pre-fetched before the history)
    const orderImage = (order: any): string | undefined => restaurantCache[`rest_${order.restaurant_id}`]?.img || undefined;

    const renderOrdersForm = () => (
        <Sheet
            tall
            open={view === 'orders'}
            onOpenChange={(open) => { if (!open) setView('dashboard'); }}
            title={t('profile.history_title')}
        >
                {orderHistory.length === 0 ? (
                    <div style={{ padding: '20px 0', opacity: 0.5, textAlign: 'center' }}>
                        {t('profile.history_empty')}
                    </div>
                ) : (
                    <div className="mp-orders-list">
                        {orderHistory.map((order, i) => {
                            const statusInfo = getStatusLabel(order.status);
                             const orderName = order.restaurant_name || `${t('common.order')} #${order.id}`;
                            const orderAddress = typeof order.address === 'string'
                                ? order.address
                                : [order.address?.street, order.address?.house].filter(Boolean).join(', ');

                            // Date grouping logic
                            const currentDate = formatHeaderDate(order);
                            const prevOrder = i > 0 ? orderHistory[i - 1] : null;
                            const prevDate = prevOrder ? formatHeaderDate(prevOrder) : null;
                            const showDateHeader = currentDate && currentDate !== prevDate;

                            return (
                                <React.Fragment key={order.id || i}>
                                    {showDateHeader && (
                                        <div className="mp-history-date-header">{currentDate}</div>
                                    )}
                                    <div className="mp-order-item" onClick={() => onOrderClick?.(order.id)}>
                                        <div className="mp-order-icon-box">
                                            {orderImage(order) ? (
                                                <img className="mp-order-thumb" src={orderImage(order)} alt="" loading="lazy" />
                                            ) : (
                                                <img src="/Assets/general-green.png" alt="" style={{ objectFit: 'contain', padding: '6px' }} />
                                            )}
                                        </div>
                                        <div className="mp-order-main">
                                            <h4 className="mp-order-name">{orderName}, {formatTime(order)}</h4>
                                            <span className="mp-order-meta">{orderAddress || '—'}</span>
                                          </div>
                                        <div className="mp-order-side">
                                            <span className="mp-order-price">{Number(order.total || 0).toFixed(2)} ₾</span>
                                            <span className={`mp-order-status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
        </Sheet>
    );

    return (
        <div className="mobile-profile-container">
            <div className="mp-bg-glow"></div>

            {(
                <>
                    <header className="mp-header">
                        <div className="mp-back-btn" onClick={onBack}>
                            <IconArrowLeft />
                        </div>
                        <h1 className="mp-title">{t('profile.title')}</h1>
                        <div style={{ width: 44 }}></div>
                    </header>
                    {renderDashboard()}
                </>
            )}

            {renderPersonalForm()}
            {renderAddressesForm()}
            {renderOrdersForm()}

            <AvatarPickerSheet
                open={avatarModal}
                onOpenChange={setAvatarModal}
                current={userProfile?.avatar}
                onPick={(avatar) => onUpdateProfile?.({ avatar })}
            />
        </div>
    );
};

export default MobileProfile;
