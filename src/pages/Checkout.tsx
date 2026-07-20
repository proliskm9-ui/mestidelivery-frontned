import React, { useState } from 'react';
import './Checkout.css';
import './MobileCheckout.css';
import { useLanguage } from '../translations/LanguageContext';
import { getDeliveryFeeForAddress } from '../utils/deliveryCalculator';
import TimeModal from '../Оплата/modals/TimeModal/TimeModal';
import PlaceTypeModal from '../Оплата/modals/PlaceTypeModal/PlaceTypeModal';
import MapModal from '../Оплата/modals/MapModal/MapModal';
import AddressBlock, { AddressData } from '../Оплата/blocks/AddressBlock/AddressBlock';

// SVG Icons
const IconArrowLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);
const IconMapPin = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);

const emptyAddress = (initial?: any, saved?: any, phone?: string): AddressData => ({
    type: (initial?.type || saved?.type || 'home') as AddressData['type'],
    street: initial?.street || saved?.street || '',
    house: initial?.house || saved?.house || '',
    apartment: initial?.apartment || saved?.apartment || '',
    floor: initial?.floor || saved?.floor || '',
    hotelName: initial?.hotelName || saved?.hotelName || '',
    room: initial?.room || saved?.room || '',
    deliveryNote: initial?.deliveryNote || saved?.deliveryNote || '',
    geo: initial?.geo || saved?.geo || '',
    landmark: initial?.landmark || saved?.landmark || '',
    comment: initial?.comment || '',
    phone: initial?.phone || phone || '',
    deliveryZone: initial?.deliveryZone || saved?.deliveryZone || 'center',
});

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
    onBack, totalAmount: _totalAmount, onOrderPlaced, initialAddress, restaurantId,
    cartItems, comment: restaurantComment, cutleryCount
}) => {
    const { t } = useLanguage();
    const [deliveryType, setDeliveryType] = useState<'standard' | 'scheduled'>('standard');
    const [isTimeModalOpen, setTimeModalOpen] = useState(false);
    const [isPlaceModalOpen, setPlaceModalOpen] = useState(false);
    const [isMapModalOpen, setMapModalOpen] = useState(false);
    const [scheduledTime, setScheduledTime] = useState<string | null>(null);

    const savedAddressRaw = localStorage.getItem('user_address');
    const savedAddress = savedAddressRaw ? (() => { try { return JSON.parse(savedAddressRaw) } catch { return null } })() : null;
    const savedPhone = localStorage.getItem('user_phone') || '';

    const [address, setAddress] = useState<AddressData>(() =>
        emptyAddress(initialAddress, savedAddress, savedPhone)
    );

    const subtotal = cartItems?.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0) || 0;
    const deliveryFee = getDeliveryFeeForAddress(address);
    const serviceFee = subtotal > 0 ? Math.max(0.99, Math.min(2.00, subtotal * 0.06)) : 0;
    const finalTotal = subtotal + deliveryFee + serviceFee;

    const handleUpdateAddress = (field: string, value: string) => {
        setAddress(prev => ({ ...prev, [field]: value }));
    };

    const handleFinalPayment = async () => {
        const hasLocation =
            address.type === 'map'
                ? !!address.geo?.trim()
                : address.type === 'hotel'
                    ? !!(address.hotelName?.trim() && address.room?.trim())
                    : !!address.street?.trim();

        if (!hasLocation || !address.phone?.trim()) {
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

    const showSavedChip =
        ((savedAddress?.street && !address.street) || (savedPhone && !address.phone))
        && address.type === 'home';

    return (
        <>
            <TimeModal
                isOpen={isTimeModalOpen}
                onClose={() => setTimeModalOpen(false)}
                currentTime={scheduledTime}
                onSelect={(time) => {
                    if (time) {
                        setScheduledTime(time);
                        setDeliveryType('scheduled');
                    } else {
                        setScheduledTime(null);
                        setDeliveryType('standard');
                    }
                    setTimeModalOpen(false);
                }}
            />

            <PlaceTypeModal
                isOpen={isPlaceModalOpen}
                onClose={() => setPlaceModalOpen(false)}
                selectedType={address.type}
                onSelectType={(typeId) => {
                    handleUpdateAddress('type', typeId);
                    setPlaceModalOpen(false);
                }}
            />

            <MapModal
                isOpen={isMapModalOpen}
                onClose={() => setMapModalOpen(false)}
                initialGeo={address.geo}
                onConfirm={(geo, _coords, zoneId) => {
                    setAddress(prev => ({
                        ...prev,
                        type: 'map',
                        geo,
                        landmark: geo,
                        deliveryZone: zoneId,
                    }));
                    setMapModalOpen(false);
                }}
            />

            <div className="page-transition-wrapper">
                <div className="checkout-page-container">
                    <header className="checkout-main-header">
                        <button type="button" className="back-circle-btn ui-circle-btn" onClick={onBack} aria-label={t('common.back')}>
                            <IconArrowLeft />
                        </button>
                        <h1>{t('checkout.title')}</h1>
                        <div className="checkout-header-spacer" aria-hidden="true" />
                    </header>

                    <div className="checkout-main-content">
                        <div className="forms-column">
                            {/* 1. Delivery Section */}
                            <div className="premium-card">
                                <h3 className="card-title">
                                    {scheduledTime ? `${t('checkout.time')}: ${scheduledTime}` : t('checkout.time')}
                                </h3>
                                <div className="delivery-options">
                                    <button
                                        type="button"
                                        className={`option-btn ${deliveryType === 'standard' ? 'active' : ''}`}
                                        onClick={() => { setDeliveryType('standard'); setScheduledTime(null); }}
                                    >
                                        <span className="title">{t('checkout.standard')}</span>
                                        <span className="subtitle">
                                            30-45 {t('common.min')}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`option-btn ${deliveryType === 'scheduled' ? 'active' : ''}`}
                                        onClick={() => setTimeModalOpen(true)}
                                    >
                                        <span className="title">{t('checkout.scheduled')}</span>
                                        <span className="subtitle">
                                            {scheduledTime || t('checkout.scheduled_desc')}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Address — same motion/UX as mobile */}
                            <div className="premium-card address-card address-card--live">
                                <h3 className="card-title address-live-heading">
                                    {t('checkout.address_title')}
                                </h3>

                                {showSavedChip && (
                                    <button
                                        type="button"
                                        className="saved-address-chip"
                                        onClick={() => {
                                            setAddress(prev => ({
                                                ...prev,
                                                type: 'home',
                                                street: savedAddress?.street || prev.street,
                                                house: savedAddress?.house || prev.house,
                                                apartment: savedAddress?.apartment || prev.apartment,
                                                floor: savedAddress?.floor || prev.floor,
                                                phone: savedPhone || prev.phone,
                                            }));
                                        }}
                                    >
                                        <span className="saved-address-chip-icon"><IconMapPin /></span>
                                        <span className="saved-address-chip-text">
                                            <strong>Использовать сохраненные данные</strong>
                                            <small>
                                                {savedAddress?.street ? `${savedAddress.street}, ${savedAddress.house || ''}` : ''}
                                                {savedAddress?.street && savedPhone ? ' • ' : ''}
                                                {savedPhone}
                                            </small>
                                        </span>
                                        <span className="saved-address-chip-action">Применить</span>
                                    </button>
                                )}

                                <AddressBlock
                                    address={address}
                                    updateAddress={handleUpdateAddress}
                                    onOpenPlaceModal={() => setPlaceModalOpen(true)}
                                    onOpenMapModal={() => setMapModalOpen(true)}
                                />
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
                                        <span>{subtotal.toFixed(2)} ₾</span>
                                    </div>
                                    <div className="summary-line">
                                        <span>{t('cart.delivery')}</span>
                                        <span>{deliveryFee.toFixed(2)} ₾</span>
                                    </div>
                                    <div className="summary-line">
                                        <span>{t('cart.service')}</span>
                                        <span>{serviceFee.toFixed(2)} ₾</span>
                                    </div>
                                </div>

                                <div className="summary-divider" />

                                <div className="total-line">
                                    <span className="total-label">{t('checkout.to_pay')}</span>
                                    <span className="total-value">{finalTotal.toFixed(2)} ₾</span>
                                </div>

                                <button type="button" className="pay-btn" onClick={handleFinalPayment}>
                                    {t('checkout.pay_btn')}
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Mobile Checkout Bar */}
            <div className="mobile-checkout-bar">
                <div className="total-info">
                    <span className="label">{t('checkout.to_pay')}</span>
                    <span className="value">{finalTotal.toFixed(2)} ₾</span>
                </div>
                <button type="button" className="mobile-confirm-btn" onClick={handleFinalPayment}>
                    {t('checkout.mobile_pay')}
                </button>
            </div>
        </>
    );
};

export default CheckoutPage;
