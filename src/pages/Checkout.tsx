import React, { useState, useEffect, useMemo } from 'react';
import { Flame } from 'lucide-react';
import './Checkout.css';
import { useRushStatus, rushTitle, rushDescription } from '../utils/rushStatus';
import { deliveryLabel } from '../utils/eta';
import { deviceHasOrdered, accountHasOrders } from '../utils/deliveryPromo';
import './MobileCheckout.css';
import { useLanguage } from '../translations/LanguageContext';
import { api, restaurantCache } from '../services/api';
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
import { toast } from 'sonner';
import { getPackagingFee } from '../utils/packaging';
import TipsBlock from '../Оплата/blocks/TipsBlock/TipsBlock';
import CustomTipModal from '../Оплата/modals/CustomTipModal/CustomTipModal';
import SummaryBlock from '../Оплата/blocks/SummaryBlock/SummaryBlock';
import { formatPrice } from '../utils/formatPrice';

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
    const rushState = useRushStatus(rid);


    const savedAddressRaw = localStorage.getItem('user_address');
    const savedAddress = savedAddressRaw ? (() => { try { return JSON.parse(savedAddressRaw) } catch { return null } })() : null;
    const savedPhone = localStorage.getItem('user_phone') || '';

    const [address, setAddress] = useState<AddressData>(() =>
        emptyAddress(initialAddress, savedAddress, savedPhone)
    );

    const subtotal = cartItems?.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0) || 0;
    // First-order promo (prod): new device & account, order >= 100 ₾ — free delivery in center/airport, else -10 ₾ when fee >= 20
    const baseDeliveryFee = getDeliveryFeeForAddress(address);
    const firstOrderEligible = !deviceHasOrdered() && !accountHasOrders();
    const promoZone = address.deliveryZone || 'center';
    const deliveryDiscount = firstOrderEligible && subtotal >= 100
        ? (promoZone === 'center' || promoZone === 'airport' ? baseDeliveryFee : (baseDeliveryFee >= 20 ? 10 : 0))
        : 0;
    const deliveryFee = Math.max(0, baseDeliveryFee - deliveryDiscount);
    const serviceFee = subtotal > 0 ? Math.max(0.99, Math.min(2.00, subtotal * 0.06)) : 0;
    // Same breakdown as the phone: packaging (Sunset) and courier tips included in the total
    const packagingFee = getPackagingFee(cartItems);
    const [tip, setTip] = useState(0);
    const [customTipOpen, setCustomTipOpen] = useState(false);
    const finalTotal = subtotal + deliveryFee + serviceFee + packagingFee + tip;

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
            toast.error(t('checkout.fill_alert'));
            return;
        }

        if (!restaurantOpen && deliveryType !== 'scheduled') {
            toast.error(closedHint || t('checkout.closed_pick_time'));
            return;
        }
        if (deliveryType === 'scheduled' && !scheduledTime) {
            toast.error(t('checkout.pick_time_alert'));
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
            tip,
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
            <CustomTipModal
                isOpen={customTipOpen}
                onClose={() => setCustomTipOpen(false)}
                currentTip={tip}
                onApply={(amount: number) => setTip(amount)}
            />

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
                                        {closedHint}. {t('checkout.closed_pick_open')}
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
                                            {deliveryLabel({ restaurantId: rid, restaurantName: rid ? restaurantCache[`rest_${rid}`]?.name : null, zoneId: address.deliveryZone, rush: rushState.isRush }, language)}
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
                                            <Flame className="rush-flame" size={15} strokeWidth={2.2} aria-hidden="true" />
                                            <span>
                                                {rushTitle(rushState, language, deliveryLabel({ restaurantId: rid, restaurantName: rid ? restaurantCache[`rest_${rid}`]?.name : null, zoneId: address.deliveryZone, rush: true }, language))}
                                            </span>
                                        </div>
                                        <p className="rush-hour-desc">
                                            {rushDescription(language)}
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

                            {/* Courier tips, as on the phone */}
                            <div className="premium-card ck-tips-card">
                                <TipsBlock tipAmount={tip} setTipAmount={setTip} onOpenCustomTip={() => setCustomTipOpen(true)} />
                            </div>
                        </div>

                        {/* Summary Sidebar (Visible on PC) */}
                        <aside className="summary-column">
                            <div className="premium-summary-card">
                                <div className="summary-header">
                                    <h3>{t('checkout.order_summary')}</h3>
                                </div>

                                <SummaryBlock
                                    items={cartItems || []}
                                    subtotal={subtotal}
                                    baseDeliveryFee={baseDeliveryFee}
                                    deliveryDiscount={deliveryDiscount}
                                    serviceFee={serviceFee}
                                    packagingFee={packagingFee}
                                    tip={tip}
                                    total={finalTotal}
                                    freeDeliveryLeft={firstOrderEligible && subtotal < 100 ? 100 - subtotal : 0}
                                    showTotal={false}
                                />

                                <div className="summary-divider" />

                                <div className="total-line">
                                    <span className="total-label">{t('checkout.to_pay')}</span>
                                    <span className="total-value">{formatPrice(finalTotal)}</span>
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
                    <span className="value">{formatPrice(finalTotal)}</span>
                </div>
                <button type="button" className="mobile-confirm-btn" onClick={handleFinalPayment}>
                    {t('checkout.mobile_pay')}
                </button>
            </div>
        </>
    );
};

export default CheckoutPage;
