import React, { useState, useEffect, useMemo } from 'react';
import './Checkout.css';
import './MobileCheckout.css';
import { useLanguage } from '../translations/LanguageContext';
import { api } from '../services/api';
import { getDeliveryFeeForAddress } from '../utils/deliveryCalculator';
import {
    closedBadgeText,
    generateRestaurantSlots,
    isRestaurantOpenNow,
} from '../utils/workingHours';
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
    const { t, language } = useLanguage();
    const [deliveryType, setDeliveryType] = useState<'standard' | 'scheduled'>('standard');
    const [isTimeModalOpen, setTimeModalOpen] = useState(false);
    const [isPlaceModalOpen, setPlaceModalOpen] = useState(false);
    const [isMapModalOpen, setMapModalOpen] = useState(false);
    const [scheduledTime, setScheduledTime] = useState<string | null>(null);
    const [workingHours, setWorkingHours] = useState<string>('');

    const rid = restaurantId || cartItems?.[0]?.product?.restaurant_id || null;

    useEffect(() => {
        if (!rid) return;
        let cancelled = false;
        api.getRestaurant(String(rid))
            .then((r) => {
                if (cancelled || !r) return;
                const hours = r.working_hours || '';
                setWorkingHours(hours);
                if (!isRestaurantOpenNow(hours)) {
                    setDeliveryType('scheduled');
                    const slots = generateRestaurantSlots(hours);
                    if (slots[0]) setScheduledTime(slots[0].value);
                }
            })
            .catch(() => { /* ignore */ });
        return () => { cancelled = true; };
    }, [rid]);

    const restaurantOpen = useMemo(() => isRestaurantOpenNow(workingHours), [workingHours]);
    const closedHint = useMemo(() => closedBadgeText(workingHours, language), [workingHours, language]);

    const scheduledDisplay = useMemo(() => {
        if (!scheduledTime) return null;
        const slots = generateRestaurantSlots(workingHours);
        return slots.find((s) => s.value === scheduledTime)?.label || scheduledTime;
    }, [scheduledTime, workingHours]);
    const [rushState, setRushState] = useState(() => {
        try {
            const H = parseInt(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tbilisi", hour: "numeric", hour12: false }).format(new Date()), 10);
            return { isRush: H >= 18 && H < 22, reason: H >= 18 && H < 22 ? "evening_rush" : "normal" };
        } catch {
            const H = (new Date().getUTCHours() + 4) % 24;
            return { isRush: H >= 18 && H < 22, reason: H >= 18 && H < 22 ? "evening_rush" : "normal" };
        }
    });

    useEffect(() => {
        let active = true;
        fetch('/api/bot/v1/rush-status')
            .then(r => r.ok ? r.json() : null)
            .then(d => {
                if (active && d && typeof d.is_rush === 'boolean') {
                    setRushState({ isRush: d.is_rush, reason: d.reason || 'evening_rush' });
                }
            })
            .catch(() => {});
        return () => { active = false; };
    }, []);


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

        if (!restaurantOpen && deliveryType !== 'scheduled') {
            alert(closedHint || 'Ресторан закрыт. Выберите доставку ко времени.');
            return;
        }
        if (deliveryType === 'scheduled' && !scheduledTime) {
            alert('Выберите время доставки');
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
                workingHours={workingHours}
                onSelect={(time) => {
                    if (time) {
                        setScheduledTime(time);
                        setDeliveryType('scheduled');
                    } else if (restaurantOpen) {
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
                                    {scheduledDisplay ? `${t('checkout.time')}: ${scheduledDisplay}` : t('checkout.time')}
                                </h3>
                                {!restaurantOpen && closedHint && (
                                    <p style={{ margin: '0 0 12px', color: '#f87171', fontSize: 14, fontWeight: 600 }}>
                                        {closedHint}. Сейчас оформить нельзя — выберите время на открытие.
                                    </p>
                                )}
                                <div className="delivery-options">
                                    <button
                                        type="button"
                                        className={`option-btn ${deliveryType === 'standard' ? 'active' : ''}`}
                                        disabled={!restaurantOpen}
                                        onClick={() => {
                                            if (!restaurantOpen) return;
                                            setDeliveryType('standard');
                                            setScheduledTime(null);
                                        }}
                                        style={!restaurantOpen ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                                    >
                                        <span className="title">{t('checkout.standard')}</span>
                                        <span className="subtitle">
                                            {rushState.isRush ? '45-65 ' : '30-45 '} {t('common.min')}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`option-btn ${deliveryType === 'scheduled' ? 'active' : ''}`}
                                        onClick={() => setTimeModalOpen(true)}
                                    >
                                        <span className="title">{t('checkout.scheduled')}</span>
                                        <span className="subtitle">
                                            {scheduledDisplay || t('checkout.scheduled_desc')}
                                        </span>
                                    </button>
                                </div>

                                {rushState.isRush && (
                                    <div className="rush-hour-badge">
                                        <div className="rush-hour-header">
                                            <span className="rush-flame">🔥</span>
                                            <span>
                                                {language === 'en'
                                                    ? (rushState.reason === 'manual_on' ? 'High demand · Delivery ~45–65 min' : 'Evening rush hour · ~45–65 min')
                                                    : language === 'ka'
                                                    ? (rushState.reason === 'manual_on' ? 'მაღალი მოთხოვნა · მიტანა ~45–65 წთ' : 'საღამოს პიკის საათი · ~45–65 წთ')
                                                    : (rushState.reason === 'manual_on' ? 'Высокий спрос · Доставка ~45–65 мин' : 'Вечерний час пик · ~45–65 мин')}
                                            </span>
                                        </div>
                                        <p className="rush-hour-desc">
                                            {language === 'en'
                                                ? 'Kitchens and couriers in Mestia are busy right now. You can also schedule your order for later.'
                                                : language === 'ka'
                                                ? 'სამზარეულოები და კურიერები მესტიაში დაკავებულები არიან. შეგიძლიათ შეუკვეთოთ წინასწარ.'
                                                : 'Кухни ресторанов и курьеры сейчас загружены. Вы также можете оформить предзаказ ко времени.'}
                                        </p>
                                    </div>
                                )}

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
                                            <strong>{t('checkout.use_saved')}</strong>
                                            <small>
                                                {savedAddress?.street ? `${savedAddress.street}, ${savedAddress.house || ''}` : ''}
                                                {savedAddress?.street && savedPhone ? ' • ' : ''}
                                                {savedPhone}
                                            </small>
                                        </span>
                                        <span className="saved-address-chip-action">{t('menu.apply')}</span>
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
