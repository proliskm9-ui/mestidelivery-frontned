import React, { useState } from 'react';
import './Checkout.css';
import './MobileCheckout.css';
import { useLanguage } from '../translations/LanguageContext';

// SVG Icons
const IconArrowLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);
const IconMapPin = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
const IconClock = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const IconPhone = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
const IconMessage = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
const IconHome = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>);
const IconHash = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>);

// Time Picker Component
const TimePickerModal: React.FC<{ isOpen: boolean; onClose: () => void; onSelect: (time: string) => void }> = ({ isOpen, onClose, onSelect }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    // Generate time slots (e.g. next 24h, 30 min intervals)
    const slots = [];
    const now = new Date();
    // Start from next 30 min slot
    let start = new Date(Math.ceil(now.getTime() / (30 * 60000)) * (30 * 60000) + 30 * 60000);
    for (let i = 0; i < 10; i++) {
        const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        slots.push(timeStr);
        start = new Date(start.getTime() + 30 * 60000);
    }

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                background: '#1a1a1a', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '320px',
                color: 'white', textAlign: 'center'
            }}>
                <h3 style={{ marginBottom: '16px' }}>{t('checkout.select_time')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {slots.map(s => (
                        <button key={s} onClick={() => onSelect(s)} style={{
                            padding: '10px', background: '#333', border: 'none', borderRadius: '8px', color: 'white'
                        }}>
                            {s}
                        </button>
                    ))}
                </div>
                <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', background: 'transparent', color: '#ff4444', border: 'none' }}>
                    {t('common.cancel')}
                </button>
            </div>
        </div>
    );
};

interface CheckoutPageProps {
    onBack: () => void;
    totalAmount: number;
    onOrderPlaced?: (order: any) => void;
    initialAddress?: any;
    restaurantId?: string | null;
    cartItems?: any[];
    comment?: string;
    cutleryCount?: number;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({
    onBack, totalAmount, onOrderPlaced, initialAddress, restaurantId,
    /* cartItems, */ comment: restaurantComment, cutleryCount
}) => {
    const { t } = useLanguage();
    const [deliveryType, setDeliveryType] = useState<'standard' | 'scheduled'>('standard');
    const [isTimeModalOpen, setTimeModalOpen] = useState(false);
    const [scheduledTime, setScheduledTime] = useState<string | null>(null);

    const savedAddressRaw = localStorage.getItem('user_address');
    const savedAddress = savedAddressRaw ? (() => { try { return JSON.parse(savedAddressRaw) } catch { return null } })() : null;
    const savedPhone = localStorage.getItem('user_phone') || '';

    const [address, setAddress] = useState({
        street: initialAddress?.street || savedAddress?.street || '',
        house: initialAddress?.house || savedAddress?.house || '',
        apartment: initialAddress?.apartment || savedAddress?.apartment || '',
        floor: initialAddress?.floor || savedAddress?.floor || '',
        entrance: initialAddress?.entrance || savedAddress?.entrance || '',
        intercom: initialAddress?.intercom || savedAddress?.intercom || '',
        comment: initialAddress?.comment || '',
        phone: initialAddress?.phone || savedPhone || ''
    });

    const deliveryFee = 5.00;
    const finalTotal = totalAmount + deliveryFee;

    const handleUpdateAddress = (field: string, value: string) => {
        setAddress((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleFinalPayment = async () => {
        if (!address.street || !address.phone) {
            alert(t('checkout.fill_alert'));
            return;
        }

        const orderData = {
            deliveryType,
            scheduledTime,
            address: {
                ...address,
                customerName: localStorage.getItem('user_name') || ''
            },
            total: finalTotal,
            timestamp: new Date().toISOString(),
            restaurant_id: restaurantId,
            restaurantComment,
            cutleryCount
        };

        if (onOrderPlaced) {
            onOrderPlaced(orderData);
        }
    };

    return (
        <>
            <TimePickerModal
                isOpen={isTimeModalOpen}
                onClose={() => setTimeModalOpen(false)}
                onSelect={(time) => {
                    setScheduledTime(time);
                    setDeliveryType('scheduled');
                    setTimeModalOpen(false);
                }}
            />

            <div className="page-transition-wrapper">
                <div className="checkout-page-container">
                    <header className="checkout-main-header">
                        <div className="back-circle-btn" onClick={onBack}>
                            <IconArrowLeft />
                        </div>
                        <h1>{t('checkout.title')}</h1>
                        <div style={{ width: 44 }}></div>
                    </header>

                    <div className="checkout-main-content">
                        <div className="forms-column">
                            {/* 1. Delivery Section */}
                            <div className="premium-card">
                                <h3 className="card-title">
                                    <IconClock />
                                    {scheduledTime ? `${t('checkout.time')}: ${scheduledTime}` : t('checkout.time')}
                                </h3>
                                <div className="delivery-options">
                                    <button
                                        className={`option-btn ${deliveryType === 'standard' ? 'active' : ''}`}
                                        onClick={() => { setDeliveryType('standard'); setScheduledTime(null); }}
                                    >
                                        <span className="title">{t('checkout.standard')}</span>
                                        <span className="subtitle">
                                            30-45 {t('common.min')}
                                        </span>
                                    </button>
                                    <button
                                        className={`option-btn ${deliveryType === 'scheduled' ? 'active' : ''}`}
                                        onClick={() => setTimeModalOpen(true)}
                                    >
                                        <span className="title">{t('checkout.scheduled')}</span>
                                        <span className="subtitle">{t('checkout.scheduled_desc')}</span>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Address Section */}
                            <div className="premium-card">
                                <h3 className="card-title" style={{ margin: 0 }}>
                                    <IconMapPin />
                                    {t('checkout.address_title')}
                                </h3>
                            </div>

                            {/* Saved Address Suggestion */}
                            {((savedAddress?.street && address.street === '') || (savedPhone && address.phone === '')) && (
                                <div style={{
                                    background: 'rgba(33, 234, 124, 0.1)',
                                    border: '1px solid rgba(33, 234, 124, 0.3)',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    marginBottom: '20px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'background 0.2s'
                                }} onClick={() => {
                                    setAddress(prev => ({
                                        ...prev,
                                        street: savedAddress?.street || prev.street,
                                        house: savedAddress?.house || prev.house,
                                        apartment: savedAddress?.apartment || prev.apartment,
                                        floor: savedAddress?.floor || prev.floor,
                                        entrance: savedAddress?.entrance || prev.entrance,
                                        intercom: savedAddress?.intercom || prev.intercom,
                                        phone: savedPhone || prev.phone
                                    }));
                                }}>
                                    <div style={{ background: '#21EA7C', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', flexShrink: 0 }}>
                                        <IconMapPin />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>Использовать сохраненные данные</div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                                            {savedAddress?.street ? `${savedAddress.street}, ${savedAddress.house || ''}` : ''}
                                            {savedAddress?.street && savedPhone ? ' • ' : ''}
                                            {savedPhone}
                                        </div>
                                    </div>
                                    <div style={{ color: '#21EA7C', fontWeight: 600, fontSize: '14px' }}>Применить</div>
                                </div>
                            )}

                            <div className="fields-grid">
                                <div className="field-group full-width">
                                    <label><IconMapPin /> {t('checkout.street')}</label>
                                    <input
                                        className="premium-input"
                                        placeholder={t('checkout.street_ph')}
                                        value={address.street}
                                        onChange={e => handleUpdateAddress('street', e.target.value)}
                                    />
                                </div>
                                <div className="field-group">
                                    <label><IconHome /> {t('checkout.house')}</label>
                                    <input
                                        className="premium-input"
                                        placeholder={t('checkout.house_ph')}
                                        value={address.house}
                                        onChange={e => handleUpdateAddress('house', e.target.value)}
                                    />
                                </div>
                                <div className="field-group">
                                    <label><IconHash /> {t('checkout.entrance') || 'Подъезд'}</label>
                                    <input
                                        className="premium-input"
                                        placeholder="Напр. 1"
                                        value={address.entrance || ''}
                                        onChange={e => handleUpdateAddress('entrance', e.target.value)}
                                    />
                                </div>
                                <div className="field-group">
                                    <label><IconHash /> {t('checkout.floor')}</label>
                                    <input
                                        className="premium-input"
                                        placeholder={t('checkout.floor_ph')}
                                        value={address.floor}
                                        onChange={e => handleUpdateAddress('floor', e.target.value)}
                                    />
                                </div>
                                <div className="field-group">
                                    <label><IconHash /> {t('checkout.apartment')}</label>
                                    <input
                                        className="premium-input"
                                        placeholder={t('checkout.apartment_ph')}
                                        value={address.apartment}
                                        onChange={e => handleUpdateAddress('apartment', e.target.value)}
                                    />
                                </div>
                                <div className="field-group full-width">
                                    <label><IconPhone /> {t('checkout.phone')}</label>
                                    <input
                                        className="premium-input"
                                        placeholder={t('checkout.phone_ph')}
                                        type="tel"
                                        value={address.phone}
                                        onChange={e => handleUpdateAddress('phone', e.target.value)}
                                    />
                                </div>
                                <div className="field-group full-width">
                                    <label><IconMessage /> {t('checkout.courier_comment')}</label>
                                    <textarea
                                        className="premium-textarea"
                                        placeholder={t('checkout.courier_comment_ph')}
                                        value={address.comment}
                                        onChange={e => handleUpdateAddress('comment', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary Sidebar (Visible on PC) */}
                        <aside className="summary-column">
                            <div className="premium-summary-card">
                                <div className="summary-header">
                                    <h3>{t('checkout.order_summary')}</h3>
                                </div>

                                <div className="summary-details">
                                    <div className="summary-line">
                                        <span>{t('cart.items')}</span>
                                        <span>{totalAmount.toFixed(2)} ₾</span>
                                    </div>
                                    <div className="summary-line">
                                        <span>{t('cart.delivery')}</span>
                                        <span>{deliveryFee.toFixed(2)} ₾</span>
                                    </div>
                                    <div className="summary-line">
                                        <span>{t('cart.service')}</span>
                                        <span>0.00 ₾</span>
                                    </div>
                                </div>

                                <div className="summary-divider" />

                                <div className="total-line">
                                    <span className="total-label">{t('checkout.to_pay')}</span>
                                    <span className="total-value">{finalTotal.toFixed(2)} ₾</span>
                                </div>

                                <button className="pay-btn" onClick={handleFinalPayment}>
                                    {t('checkout.pay_btn')}
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </div >

            {/* Mobile Checkout Bar */}
            < div className="mobile-checkout-bar" >
                <div className="total-info">
                    <span className="label">{t('checkout.to_pay')}</span>
                    <span className="value">{finalTotal.toFixed(2)} ₾</span>
                </div>
                <button className="mobile-confirm-btn" onClick={handleFinalPayment}>
                    {t('checkout.mobile_pay')}
                </button>
            </div >
        </>
    );
};

export default CheckoutPage;
