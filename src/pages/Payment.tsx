import React, { useState, useRef, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './Payment.css';
import { api, restaurantCache } from '../services/api';
import IsometricBoxLoader from '../components/UI/IsometricBoxLoader';
import { useLanguage } from '../translations/LanguageContext';
import { formatCheckoutAddress, formatCourierComment } from '../utils/checkoutAddress';
import { ENABLE_CRYPTO_PAY } from '../config/features';
import { toast } from 'sonner';
import { formatPrice } from '../utils/formatPrice';
import PayMarks from '../components/Payment/PayMarks';
import { OrderPlacedActions, OrderPlacedMark } from '../components/Payment/OrderPlaced';
import { useOrderHandover } from '../hooks/useOrderHandover';
import { useDeliveryEta } from '../hooks/useDeliveryEta';
import FlowShell from '../components/Desktop/FlowShell';
import OrderAside from '../components/Desktop/OrderAside';
import { getPackagingFee } from '../utils/packaging';
import { pickI18nText } from '../utils/i18nContent';

/** Keepz payment link — same as mobile (no Tribute). */
const PAYMENT_URL = 'https://app.keepz.me/pay?qrType=DEFAULT&receiverType=USER&receiverId=6ea6970c-20ee-4119-b25f-6ebcc8a888c6';


const IconCrypto = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
    </svg>
);

const IconCash = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
    </svg>
);

type ScreenState = 'select' | 'creating' | 'pending_confirmation' | 'success' | 'error';

interface PaymentPageProps {
    onBack: () => void;
    totalAmount: number;
    orderData: any;
    cartItems: { product: any; quantity: number }[];
    onPaymentComplete: (method: string, orderId: number) => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({
    onBack,
    totalAmount,
    orderData,
    cartItems,
    onPaymentComplete,
}) => {
    const { t, language } = useLanguage();
    const [screen, setScreen] = useState<ScreenState>('select');
    const [method, setMethod] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<number | null>(null);

    const orderCreatedRef = useRef(false);
    const shellRef = useRef<HTMLDivElement>(null);
    // Same hand-over as on the phone: back from Keepz -> replay the mark -> order status
    const { complete, rememberOrder, replayKey } = useOrderHandover(
        onPaymentComplete,
        screen === 'pending_confirmation' && method !== 'cash',
        orderId,
    );
    const idempotencyKey = useMemo(() => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }, []);

    // Cursor green glow — same idea as ScrollHero on the home page
    useEffect(() => {
        const shell = shellRef.current;
        if (!shell) return;
        let raf = 0;
        let mx = 50;
        let my = 50;
        const apply = () => {
            raf = 0;
            shell.style.setProperty('--mx', `${mx}%`);
            shell.style.setProperty('--my', `${my}%`);
        };
        const onMove = (e: PointerEvent) => {
            const rect = shell.getBoundingClientRect();
            mx = ((e.clientX - rect.left) / rect.width) * 100;
            my = ((e.clientY - rect.top) / rect.height) * 100;
            if (!raf) raf = requestAnimationFrame(apply);
        };
        shell.addEventListener('pointermove', onMove, { passive: true });
        return () => {
            shell.removeEventListener('pointermove', onMove);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    const openPaymentUrl = (url: string) => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            if (tg.openLink) tg.openLink(url);
            else window.open(url, '_blank');
        } else {
            window.open(url, '_blank');
        }
    };

    const buildOrderPayload = (paymentMethod: string, extras: Record<string, unknown> = {}) => {
        const userId = localStorage.getItem('user_id') || 'anonymous';
        const addr = orderData?.address || {};
        const fullAddress = formatCheckoutAddress(addr);
        const restaurantId = cartItems?.[0]?.product?.restaurant_id || '';

        const items = (cartItems || []).map((ci: any) => ({
            product_id: ci.product.id,
            name: ci.product.name,
            price: ci.product.price,
            quantity: ci.quantity,
        }));

        return {
            user_id: userId,
            restaurant_id: restaurantId,
            restaurant_name: restaurantCache[`rest_${restaurantId}`]?.name || '',
            items,
            total: totalAmount,
            customer_name: addr.customerName || localStorage.getItem('user_name') || t('checkout.customer_fallback'),
            phone: addr.phone || '',
            address: fullAddress,
            courier_comment: formatCourierComment(addr),
            cutlery_count: orderData?.cutleryCount || 0,
            apartment: addr.apartment || '',
            entrance: addr.entrance || '',
            floor: addr.floor || '',
            intercom: addr.intercom || '',
            place_type: addr.type || 'home',
            scheduled_time: null,
            promo_code: orderData?.promoCode || '',
            tips: orderData?.tip || 0,
            delivery_fee: Number(orderData?.deliveryFee ?? 0) || 0,
            service_fee: Number(orderData?.serviceFee ?? 0) || 0,
            delivery_lat: Number(orderData?.deliveryLat ?? 0) || 0,
            delivery_lng: Number(orderData?.deliveryLng ?? 0) || 0,
            idempotency_key: idempotencyKey,
            payment_method: paymentMethod,
            ...extras,
        };
    };

    const handleCashSelect = async () => {
        if (orderCreatedRef.current) return;
        orderCreatedRef.current = true;

        setMethod('cash');
        setScreen('creating');

        try {
            const payload = buildOrderPayload('cash', {
                comment: (orderData?.restaurantComment || '') + ' [Оплата: Cash]',
                scheduled_time: orderData?.deliveryType === 'scheduled' ? orderData?.scheduledTime : null,
            });

            const result = await api.createOrder(payload);
            if (!result?.id) {
                toast.error(t('checkout.order_creation_error'));
                setScreen('select');
                orderCreatedRef.current = false;
                return;
            }

            setOrderId(result.id);
            rememberOrder(result.id, 'cash');
            setScreen('pending_confirmation');
            await new Promise(r => setTimeout(r, 3000));
            complete('cash', result.id);
        } catch (e: any) {
            console.error('Order creation error:', e);
            toast.error(t('common.error') + ': ' + (e.message || t('checkout.order_failed')));
            setScreen('select');
            orderCreatedRef.current = false;
        }
    };

    const handleConfirmPaid = async () => {
        if (orderCreatedRef.current) return;
        orderCreatedRef.current = true;

        // Synchronously open payment URL immediately on click so Safari/Chrome never blocks it
        openPaymentUrl(PAYMENT_URL);

        setMethod('card');
        setScreen('pending_confirmation');

        try {
            const isScheduled = orderData?.deliveryType === 'scheduled' && orderData?.scheduledTime;
            const commentSuffix = isScheduled
                ? ` [Оплата: Онлайн] [Ко времени: ${orderData.scheduledTime}]`
                : ' [Оплата: Онлайн]';

            const payload = buildOrderPayload('card', {
                comment: (orderData?.restaurantComment || '') + commentSuffix,
                status: 'pending_payment',
            });

            const result = await api.createOrder(payload);
            if (!result?.id) {
                toast.error(t('checkout.order_creation_error'));
                setScreen('select');
                orderCreatedRef.current = false;
                return;
            }

            setOrderId(result.id);
            rememberOrder(result.id, 'card');

            try {
                await api.updateOrderStatus(result.id, 'pending:card');
            } catch (e) {
                console.warn('Could not set pending status:', e);
            }

            setScreen('pending_confirmation');
        } catch (e: any) {
            console.error('Order creation error:', e);
            toast.error(t('common.error') + ': ' + (e.message || t('checkout.order_failed')));
            setScreen('select');
            orderCreatedRef.current = false;
        }
    };

    const busy = screen === 'creating' || screen === 'success';

    // Order card on the right: the same breakdown the user saw in checkout
    const asideRestaurantId = cartItems?.[0]?.product?.restaurant_id || null;
    const asideRestaurant = asideRestaurantId ? pickI18nText(restaurantCache[`rest_${asideRestaurantId}`]?.name || '', language) : null;
    const asideSubtotal = (cartItems || []).reduce((sum, ci) => sum + Number(ci.product?.price || 0) * ci.quantity, 0);
    const asideService = Number(orderData?.serviceFee ?? 0) || 0;
    const asideTip = Number(orderData?.tip ?? 0) || 0;
    const asidePackaging = getPackagingFee(cartItems);
    const asideDelivery = Math.max(0, +(totalAmount - asideSubtotal - asideService - asideTip - asidePackaging).toFixed(2));
    const scheduledLabel = orderData?.deliveryType === 'scheduled' && orderData?.scheduledTime
        ? String(orderData.scheduledTime).split(' ').pop() || null
        : null;
    const liveEta = useDeliveryEta(asideRestaurantId, null, null);
    const asideEta = scheduledLabel ? t('status.deliver_at').replace('{time}', scheduledLabel) : liveEta;

    return (
        <FlowShell step="payment" complete={screen === 'pending_confirmation'} onBack={onBack} backDisabled={busy}>
            <div className="dfs-grid pc-pay-desk">
                <div className="pc-payment">
                    <div className="pc-payment-shell" ref={shellRef}>
                        <div className="pc-payment-glow" aria-hidden="true" />

                    {screen !== 'select' ? (
                        <div className="pc-payment-status">
                            {screen === 'creating' && (
                                <>
                                    <IsometricBoxLoader isSuccess={false} />
                                    <h2>{t('checkout.placing_order')}</h2>
                                    <p>{t('checkout.wait_seconds')}</p>
                                </>
                            )}

                            {screen === 'pending_confirmation' && (
                                <div className="pc-placed" role="status" aria-live="polite">
                                    <OrderPlacedMark key={replayKey} />
                                    <h2 className="pc-placed-title" key={`t${replayKey}`}>
                                        {orderId ? t('checkout.order_placed_n').replace('{id}', String(orderId)) : t('checkout.order_placed')}
                                    </h2>
                                    <p className="pc-placed-text">
                                        {method === 'cash' ? t('checkout.pay_cash_on_delivery') : t('checkout.placed_card_desc')}
                                    </p>
                                    {method !== 'cash' && <OrderPlacedActions onOpenKeepz={() => openPaymentUrl(PAYMENT_URL)} />}
                                </div>
                            )}

                            {screen === 'success' && (
                                <>
                                    <IsometricBoxLoader isSuccess={true} />
                                    <h2>{method === 'cash' ? t('checkout.order_placed') : t('checkout.payment_confirmed')}</h2>
                                </>
                            )}

                            {screen === 'error' && (
                                <>
                                    <h2>{t('checkout.waiting_timeout')}</h2>
                                    <button type="button" className="pc-pay-btn primary" onClick={() => setScreen('select')}>
                                        {t('checkout.try_again')}
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="pc-payment-grid">
                            <div className="pc-qr-panel">
                                <h3 className="pc-section-title">{t('checkout.qr_title')}</h3>
                                <div className="pc-qr-frame">
                                    <QRCodeSVG
                                        value={PAYMENT_URL}
                                        size={240}
                                        bgColor="transparent"
                                        fgColor="#000000"
                                        level="L"
                                        includeMargin={false}
                                    />
                                </div>
                                <p className="pc-qr-hint">{t('checkout.qr_hint')}</p>
                            </div>

                            <div className="pc-actions-panel">
                                <div className="pc-amount-card">
                                    <span className="pc-amount-label">{t('checkout.total_with_delivery')}</span>
                                    <h2 className="pc-amount-value">{totalAmount.toFixed(2)} ₾</h2>
                                </div>

                                <button
                                    type="button"
                                    className="pc-pay-btn primary"
                                    onClick={handleConfirmPaid}
                                >
                                    {t('checkout.pay_amount').replace('{amount}', formatPrice(totalAmount))}
                                </button>
                                <PayMarks />

                                <div className="pc-pay-separator">
                                    <span>{t('checkout.or_other_methods')}</span>
                                </div>

                                {ENABLE_CRYPTO_PAY ? (
                                    <button
                                        type="button"
                                        className="pc-method-row"
                                        onClick={() => {
                                            handleConfirmPaid();
                                        }}
                                    >
                                        <div className="pc-method-icon crypto"><IconCrypto /></div>
                                        <div className="pc-method-info">
                                            <span className="pc-method-name">{t('checkout.crypto')}</span>
                                            <span className="pc-method-desc">Crypto Pay (USDT, TON)</span>
                                        </div>
                                        <span className="pc-method-arrow">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </span>
                                    </button>
                                ) : null}

                                <button type="button" className="pc-method-row" onClick={handleCashSelect}>
                                    <div className="pc-method-icon cash"><IconCash /></div>
                                    <div className="pc-method-info">
                                        <span className="pc-method-name">{t('checkout.cash_courier')}</span>
                                        <span className="pc-method-desc">{t('checkout.cash_courier_desc')}</span>
                                    </div>
                                    <span className="pc-method-arrow">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                    </div>
                </div>

                <OrderAside
                    restaurantName={asideRestaurant}
                    eta={asideEta}
                    items={cartItems || []}
                    subtotal={asideSubtotal}
                    baseDeliveryFee={asideDelivery}
                    serviceFee={asideService}
                    packagingFee={asidePackaging}
                    tip={asideTip}
                    total={totalAmount}
                />
            </div>
        </FlowShell>
    );
};

export default PaymentPage;
