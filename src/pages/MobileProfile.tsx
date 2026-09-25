import React, { useState } from 'react';
import './MobileProfile.css';
import { useLanguage } from '../translations/LanguageContext';
import AvatarPickerSheet from '../components/UI/AvatarPickerSheet';
import Sheet from '../components/UI/Sheet';
import { restaurantCache } from '../services/api';
import { Link } from 'react-router-dom';

interface MobileProfileProps {
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


const MobileProfile: React.FC<MobileProfileProps> = ({
    userAddress,
    onUpdateAddress,
    userProfile,
    onUpdateProfile,
    orderHistory = [],
    onLogout,
    onBack,
    onOrderClick,
    onNavigate
}) => {
    const { t, language, setLanguage } = useLanguage();
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

    const openReferral = () => (window as any).MestiReferral?.open();
    const statusTone = (cls: string) => (cls === 'pending' ? 'warn' : cls === 'cancelled' ? 'danger' : 'ok');

    const renderDashboard = () => (
        <div className="mp-content">
            {/* Identity: avatar opens the picker, the rest opens personal data */}
            <div className="liquid-card mp-id-card">
                <button type="button" className="mp-id-avatar" onClick={() => setAvatarModal(true)} aria-label="Avatar">
                    {userProfile?.avatar && userProfile.avatar.length > 2 ? (
                        <img src={userProfile.avatar} alt="" />
                    ) : (
                        <span>{(userProfile?.name || '?').trim().charAt(0).toUpperCase()}</span>
                    )}
                    <i className="mp-id-avatar-edit"><IconEdit /></i>
                </button>
                <button type="button" className="mp-id-main" onClick={openPersonal}>
                    <span className="mp-id-text">
                        <span className="mp-id-name">{userProfile?.name || t('profile.user_fallback')}</span>
                        <span className="mp-id-phone">{userProfile?.phone || t('profile.phone')}</span>
                    </span>
                    <span className="mp-action-chevron"><IconChevron /></span>
                </button>
            </div>

            {/* Bonuses: the one bright spot of the page */}
            <div className="liquid-card mp-bonus">
                <button type="button" className="mp-bonus-balance" onClick={openReferral}>
                    <span className="mp-bonus-label">{t('profile.bonus_title')}</span>
                    <span className="mp-bonus-value">{userProfile?.points || 0}</span>
                    <span className="mp-bonus-hint"><span className="mp-action-bonus">{t('profile.invite_bonus')}</span> {t('profile.invite_sub')}</span>
                </button>
                <button type="button" className="ds-btn ds-btn--primary mp-bonus-cta" onClick={openReferral}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>
                    {t('profile.invite_button')}
                </button>
            </div>

            {/* Quick tiles */}
            <div className="mp-tiles">
                <button type="button" className="mp-tile" onClick={() => onNavigate?.('favorites')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    <span>{t('nav.favorites')}</span>
                </button>
                <button type="button" className="mp-tile" onClick={openAddresses}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span>{t('profile.tile_addresses')}</span>
                </button>
                <a className="mp-tile" href="https://t.me/MestigoSupport_Bot" target="_blank" rel="noopener noreferrer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" /></svg>
                    <span>{t('profile.support')}</span>
                </a>
            </div>

            {/* Recent orders: same grouped list, status as coloured text */}
            <section className="mp-recent">
                <div className="mp-recent-head">
                    <h3 className="mp-orders-title">{t('profile.history_title')}</h3>
                    {orderHistory.length > 0 && (
                        <button type="button" className="mp-recent-all" onClick={() => setView('orders')}>{t('menu.all')}</button>
                    )}
                </div>
                <div className="liquid-card mp-action-list">
                    {orderHistory.length === 0 ? (
                        <p className="mp-recent-empty">{t('profile.history_empty')}</p>
                    ) : orderHistory.slice(0, 3).map((order, i) => {
                        const statusInfo = getStatusLabel(order.status);
                        const img = orderImage(order);
                        return (
                            <a key={order.id || i} className="mp-action-item mp-recent-row" onClick={() => onOrderClick?.(order.id)}>
                                <span className="mp-recent-thumb">
                                    {img ? <img src={img} alt="" loading="lazy" /> : <img src="/Assets/general-green.png" alt="" className="is-logo" />}
                                </span>
                                <div className="mp-action-text">
                                    <h3 className="mp-action-title">{order.restaurant_name || `${t('common.order')} #${order.id}`}</h3>
                                    <p className="mp-action-subtitle">{[formatHeaderDate(order).split(',')[0], formatTime(order)].filter((s) => s && s !== '—').join(' · ')}</p>
                                </div>
                                <span className="mp-recent-side">
                                    <span className="mp-recent-price">{Number(order.total || 0).toFixed(2)} ₾</span>
                                    <span className={`mp-recent-status is-${statusTone(statusInfo.class)}`}>{statusInfo.label}</span>
                                </span>
                            </a>
                        );
                    })}
                </div>
            </section>

            {/* Language + documents */}
            <div className="liquid-card mp-action-list">
                <div className="mp-action-item mp-lang-row">
                    <div className="mp-action-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                    </div>
                    <div className="mp-action-text"><h3 className="mp-action-title">{t('home.language')}</h3></div>
                    <div className="mp-lang-seg" role="radiogroup">
                        {(['ru', 'en', 'ka'] as const).map((l) => (
                            <button key={l} type="button" role="radio" aria-checked={language === l} className={language === l ? 'is-active' : ''} onClick={() => setLanguage(l)}>
                                {l === 'ka' ? 'ქარ' : l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <Link className="mp-action-item" to={`/${language}/privacy`}>
                    <div className="mp-action-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
                    <div className="mp-action-text"><h3 className="mp-action-title">{t('home.footer_privacy')}</h3></div>
                    <div className="mp-action-chevron"><IconChevron /></div>
                </Link>
                <Link className="mp-action-item" to={`/${language}/terms`}>
                    <div className="mp-action-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg></div>
                    <div className="mp-action-text"><h3 className="mp-action-title">{t('home.footer_terms')}</h3></div>
                    <div className="mp-action-chevron"><IconChevron /></div>
                </Link>
            </div>

            <button className="mp-logout-btn" onClick={onLogout}>
                {t('profile.logout')}
            </button>

            <p className="mp-version">MestiDelivery · {t('profile.version')} {__APP_VERSION__} · {__BUILD_DATE__.split('-').reverse().join('.')}</p>
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
