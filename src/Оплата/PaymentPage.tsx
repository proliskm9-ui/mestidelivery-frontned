import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import './PaymentPage.css';
import { QRCodeSVG } from 'qrcode.react';
import { api, restaurantCache } from '../services/api';
import IsometricBoxLoader from '../components/UI/IsometricBoxLoader';
import { Clock } from 'lucide-react';
import { useLanguage } from '../translations/LanguageContext';
import { formatCheckoutAddress, formatCourierComment } from '../utils/checkoutAddress';
import { ENABLE_CRYPTO_PAY } from '../config/features';

/** Keepz payment link — Tribute removed. */
const PAYMENT_URL = 'https://app.keepz.me/pay?qrType=DEFAULT&receiverType=USER&receiverId=6ea6970c-20ee-4119-b25f-6ebcc8a888c6';

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconCrypto = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
    </svg>
);

const IconArrowLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

const IconCash = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
    </svg>
);



// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenState =
    | 'select'          // выбор метода
    | 'creating'        // создаём заказ (спиннер)
    | 'waiting'         // ждём вебхука (crypto/card)
    | 'success'         // подтверждено
    | 'pending_confirmation' // ожидание подтверждения оплаты админом
    | 'error';          // ошибка

interface MobilePaymentPageProps {
    onBack: () => void;
    totalAmount: number;
    orderData: any;
    cartItems: { product: any; quantity: number }[];
    onPaymentComplete: (method: string, orderId: number) => void;
}

// ─── Polling constants ────────────────────────────────────────────────────────

const POLL_INTERVAL_MS   = 3_000;   // опрашиваем каждые 3 секунды
const POLL_TIMEOUT_MS    = 10 * 60_000; // максимум 10 минут ждём

// ─── Component ────────────────────────────────────────────────────────────────

const MobilePaymentPage: React.FC<MobilePaymentPageProps> = ({
    onBack,
    totalAmount,
    orderData,
    cartItems,
    onPaymentComplete,
}) => {
    const { t } = useLanguage();
    const [screen, setScreen]             = useState<ScreenState>('select');
    const [method, setMethod]             = useState<string | null>(null);
    const [orderId, setOrderId]           = useState<number | null>(null);
    const [elapsed, setElapsed]           = useState(0);      // секунды ожидания

    const orderCreatedRef  = useRef(false);
    const pollTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
    const deadlineRef      = useRef<number>(0);

    const idempotencyKey = useMemo(() => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }, []);

    // ── Stop polling cleanup ────────────────────────────────────────────────
    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, []);

    useEffect(() => () => stopPolling(), [stopPolling]);

    // ── Start polling order status ──────────────────────────────────────────
    const startPolling = useCallback((id: number, selectedMethod: string) => {
        deadlineRef.current = Date.now() + POLL_TIMEOUT_MS;

        pollTimerRef.current = setInterval(async () => {
            // Check timeout
            if (Date.now() > deadlineRef.current) {
                stopPolling();
                setScreen('error');
                return;
            }

            setElapsed(prev => prev + POLL_INTERVAL_MS / 1000);

            try {
                const status = await api.trackOrder(id);
                if (status?.status === 'confirmed' || status?.status === 'preparing' || status?.status === 'ready' || status?.status === 'delivering' || status?.status === 'delivered') {
                    // Webhook confirmed — show success
                    stopPolling();
                    setScreen('success');
                    await new Promise(r => setTimeout(r, 1800));
                    try {
                        onPaymentComplete(selectedMethod, id);
                    } catch (navError) {
                        console.error('Order confirmed but post-success navigation failed', navError);
                    }
                }
            } catch (e) {
                // Only swallow genuine polling/network errors; onPaymentComplete errors
                // are handled above so they don't get misread as "keep polling".
                console.warn('Order status poll failed, will retry', e);
            }
        }, POLL_INTERVAL_MS);
    }, [stopPolling, onPaymentComplete]);

    // ── Open payment URL ────────────────────────────────────────────────────
    const openPaymentUrl = (url: string) => {
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            if (tg.openInvoice && url.includes('t.me/$')) {
                tg.openInvoice(url);
            } else if (tg.openTelegramLink && url.includes('t.me')) {
                tg.openTelegramLink(url);
            } else if (tg.openLink) {
                tg.openLink(url);
            } else {
                window.open(url, '_blank');
            }
        } else {
            window.open(url, '_blank');
        }
    };

    // ── Main handler ────────────────────────────────────────────────────────
    const handlePaymentSelect = async (selectedMethod: string) => {
        if (orderCreatedRef.current) return;
        orderCreatedRef.current = true;

        setMethod(selectedMethod);
        setScreen('creating');

        try {
            const userId      = localStorage.getItem('user_id') || 'anonymous';
            const addr        = orderData?.address || {};
            const fullAddress = formatCheckoutAddress(addr);
            const restaurantId = cartItems?.[0]?.product?.restaurant_id || '';

            const items = (cartItems || []).map((ci: any) => ({
                product_id: ci.product.id,
                name:       ci.product.name,
                price:      ci.product.price,
                quantity:   ci.quantity,
            }));

            const payload = {
                user_id:          userId,
                restaurant_id:    restaurantId,
                restaurant_name:  restaurantCache[`rest_${restaurantId}`]?.name || '',
                items,
                total:            totalAmount,
                customer_name:    addr.customerName || localStorage.getItem('user_name') || t('checkout.customer_fallback'),
                phone:            addr.phone || '',
                address:          fullAddress,
                comment:          (orderData?.restaurantComment || '') + ` [Оплата: ${selectedMethod === 'cash' ? 'Cash' : selectedMethod === 'card' ? 'Card' : 'Crypto'}]`,
                courier_comment:  formatCourierComment(addr),
                cutlery_count:    orderData?.cutleryCount || 0,
                apartment:        addr.apartment || '',
                entrance:         addr.entrance || '',
                floor:            addr.floor || '',
                intercom:         addr.intercom || '',
                place_type:       addr.type || 'home',
                scheduled_time:   orderData?.deliveryType === 'scheduled' ? orderData?.scheduledTime : null,
                promo_code:       orderData?.promoCode || '',
                tips:             orderData?.tip || 0,
                delivery_fee:     Number(orderData?.deliveryFee ?? 0) || 0,
                service_fee:      Number(orderData?.serviceFee ?? 0) || 0,
                delivery_lat:     Number(orderData?.deliveryLat ?? 0) || 0,
                delivery_lng:     Number(orderData?.deliveryLng ?? 0) || 0,
                idempotency_key:  idempotencyKey,
                payment_method:   selectedMethod,
            };

            const result = await api.createOrder(payload);

            if (!result?.id) {
                alert(t('checkout.order_creation_error'));
                setScreen('select');
                orderCreatedRef.current = false;
                return;
            }

            setOrderId(result.id);

            // ── CASH: no payment confirmation needed ──────────────────────
            if (selectedMethod === 'cash') {
                setMethod('cash');
                setScreen('pending_confirmation');
                await new Promise(r => setTimeout(r, 3000));
                // Order is already committed server-side here: a failure in the parent's
                // completion callback shouldn't surface as "order failed" or reset the flow.
                try {
                    onPaymentComplete(selectedMethod, result.id);
                } catch (navError) {
                    console.error('Order created but post-success navigation failed', navError);
                }
                return;
            }

            // ── CARD / CRYPTO: open Keepz payment, wait for confirmation path ──
            const paymentUrl = (result as any).payment_url || PAYMENT_URL;

            // Small delay so user sees the "creating" state
            await new Promise(r => setTimeout(r, 800));

            openPaymentUrl(paymentUrl);
            setScreen('waiting');
            setElapsed(0);
            startPolling(result.id, selectedMethod);

        } catch (e: any) {
            console.error('Order creation error:', e);
            alert(t('common.error') + ': ' + (e.message || t('checkout.order_failed')));
            setScreen('select');
            orderCreatedRef.current = false;
        }
    };

    // ── Handle "I paid" — create order with pending_payment status ──────────
    const handleConfirmPaid = async () => {
        if (orderCreatedRef.current) return;
        orderCreatedRef.current = true;

        // Synchronously open payment URL immediately on click so Safari/Chrome never blocks it
        openPaymentUrl(PAYMENT_URL);

        setMethod('card');
        setScreen('pending_confirmation');

        try {
            const userId      = localStorage.getItem('user_id') || 'anonymous';
            const addr        = orderData?.address || {};
            const fullAddress = formatCheckoutAddress(addr);
            const restaurantId = cartItems?.[0]?.product?.restaurant_id || '';

            const items = (cartItems || []).map((ci: any) => ({
                product_id: ci.product.id,
                name:       ci.product.name,
                price:      ci.product.price,
                quantity:   ci.quantity,
            }));

            const isScheduled = orderData?.deliveryType === 'scheduled' && orderData?.scheduledTime;
            const commentSuffix = isScheduled 
                ? ` [Оплата: Онлайн] [Ко времени: ${orderData.scheduledTime}]` 
                : ' [Оплата: Онлайн]';

            const payload = {
                user_id:          userId,
                restaurant_id:    restaurantId,
                restaurant_name:  restaurantCache[`rest_${restaurantId}`]?.name || '',
                items,
                total:            totalAmount,
                customer_name:    addr.customerName || localStorage.getItem('user_name') || t('checkout.customer_fallback'),
                phone:            addr.phone || '',
                address:          fullAddress,
                comment:          (orderData?.restaurantComment || '') + commentSuffix,
                courier_comment:  formatCourierComment(addr),
                cutlery_count:    orderData?.cutleryCount || 0,
                apartment:        addr.apartment || '',
                entrance:         addr.entrance || '',
                floor:            addr.floor || '',
                intercom:         addr.intercom || '',
                place_type:       addr.type || 'home',
                scheduled_time:   orderData?.deliveryType === 'scheduled' ? orderData?.scheduledTime : null,
                promo_code:       orderData?.promoCode || '',
                tips:             orderData?.tip || 0,
                delivery_fee:     Number(orderData?.deliveryFee ?? 0) || 0,
                service_fee:      Number(orderData?.serviceFee ?? 0) || 0,
                delivery_lat:     Number(orderData?.deliveryLat ?? 0) || 0,
                delivery_lng:     Number(orderData?.deliveryLng ?? 0) || 0,
                idempotency_key:  idempotencyKey,
                payment_method:   'card',
                status:           'pending_payment',
            };

            const result = await api.createOrder(payload);

            if (!result?.id) {
                alert(t('checkout.order_creation_error'));
                setScreen('select');
                orderCreatedRef.current = false;
                return;
            }

            setOrderId(result.id);

            // Backend ignores status on creation — update it separately
            try {
                await api.updateOrderStatus(result.id, 'pending:card');
            } catch (e) {
                console.warn('Could not set pending status:', e);
            }

            setScreen('pending_confirmation');

        } catch (e: any) {
            console.error('Order creation error:', e);
            alert(t('common.error') + ': ' + (e.message || t('checkout.order_failed')));
            setScreen('select');
            orderCreatedRef.current = false;
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────

    const formatElapsed = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        if (m > 0) return t('checkout.time_format_min_sec').replace('{m}', String(m)).replace('{s}', String(s));
        return t('checkout.time_format_sec').replace('{s}', String(s));
    };

    return (
        <div className="mobile-payment-wrapper payment-v2-layout">
            <div className="page">
                <div className="payment-block-top">
                    {/* Header */}
                    <header className="mp-header">
                        <div
                            className="mp-back-btn"
                            onClick={() => {
                                if (screen === 'waiting') {
                                    stopPolling();
                                }
                                onBack();
                            }}
                        >
                            <IconArrowLeft />
                        </div>
                        <h1 className="mp-title">{t('checkout.payment_page_title')}</h1>
                        <div style={{ width: 44 }}></div>
                    </header>

                    <div className="mp-header-divider"></div>

                    <div className="mobile-payment-content">
                        {/* ── Amount card ─────────────────────────────────── */}
                        <div className="mp-amount-card">
                            <span className="mp-amount-label">{t('checkout.total_with_delivery')}</span>
                            <h2 className="mp-amount-value">
                                {totalAmount.toFixed(2)} ₾
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="payment-block-bottom">
                    <div className="mobile-payment-content" style={{ paddingTop: 0 }}>
                        {/* ── Methods / status card ────────────────────────── */}
                        <div className="mp-methods-card" style={{ position: 'relative' }}>

                        {/* CREATING — spinner */}
                        {screen === 'creating' && (
                            <div className="mp-loading-overlay">
                                <div className="mp-simple-spinner" />
                                <span className="mp-simple-loading-text">{t('order.loading_data')}</span>
                            </div>
                        )}

                        {/* WAITING — waiting for webhook */}
                        {screen === 'waiting' && (
                            <div className="mp-loading-overlay mp-waiting-overlay">
                                <div className="mp-pulse-ring" />
                                <div className="mp-waiting-icon">⏳</div>
                                <h3>{t('checkout.awaiting_confirmation')}</h3>
                                <p className="mp-waiting-desc">
                                    {t('checkout.pay_in_window')}
                                    <br />{t('checkout.will_confirm_auto')}
                                </p>
                                <div className="mp-waiting-timer">
                                    {t('checkout.elapsed_waiting')} {formatElapsed(elapsed)}
                                </div>
                                {orderId && (
                                    <div className="mp-order-badge">{t('common.order')} #{orderId}</div>
                                )}
                                <button
                                    className="mp-reopen-btn"
                                    onClick={() => {
                                        if (!orderId) return;
                                        openPaymentUrl(PAYMENT_URL);
                                    }}
                                >
                                    {t('checkout.open_payment_page')}
                                </button>
                            </div>
                        )}

                        {/* SUCCESS */}
                        {screen === 'success' && (
                            <div className="mp-loading-overlay">
                                <IsometricBoxLoader isSuccess={true} />
                                <h3>{method === 'cash' ? t('checkout.order_placed') : t('checkout.payment_confirmed')}</h3>
                                <p>{method === 'cash' ? t('checkout.pay_cash_desc') : t('checkout.order_sent_to_restaurant')}</p>
                            </div>
                        )}

                        {/* PENDING CONFIRMATION — waiting for admin to verify payment */}
                        {screen === 'pending_confirmation' && (
                            <div className="mp-premium-waiting-container">
                                <div className="mp-premium-spinner">
                                    <div className="mp-premium-icon">
                                        {method === 'cash' ? (
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#21ea7c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        ) : (
                                            <Clock color="#21ea7c" size={40} strokeWidth={2} />
                                        )}
                                    </div>
                                </div>
                                <h3 className="mp-premium-title">{t('checkout.order_placed').toUpperCase()}</h3>
                                <p className="mp-premium-subtitle">
                                    {method === 'cash' ? (
                                        <>
                                            {t('checkout.pay_cash_on_delivery')}
                                        </>
                                    ) : (
                                        <>
                                            {t('checkout.waiting_payment_confirm')}
                                        </>
                                    )}
                                </p>
                                {orderId && (
                                    <div className="mp-premium-badge">{t('common.order')} #{orderId}</div>
                                )}
                                {method !== 'cash' && orderId && (
                                    <div className="mp-pending-actions">
                                        <button
                                            type="button"
                                            className="mp-btn-view-order-clean"
                                            onClick={() => onPaymentComplete('card', orderId)}
                                        >
                                            <span>Открыть заказ</span>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className="mp-btn-reopen-link"
                                            onClick={() => openPaymentUrl(PAYMENT_URL)}
                                        >
                                            <span>{t('checkout.open_payment_page')}</span>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M7 17L17 7" />
                                                <path d="M8 7h9v9" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ERROR — timeout */}
                        {screen === 'error' && (
                            <div className="mp-loading-overlay mp-error-overlay">
                                <div style={{ fontSize: '48px' }}>⚠️</div>
                                <h3>{t('checkout.waiting_timeout')}</h3>
                                <p>{t('checkout.check_telegram_status')}</p>
                                {orderId && (
                                    <div className="mp-order-badge">{t('common.order')} #{orderId}</div>
                                )}
                                <button className="mp-reopen-btn" onClick={() => {
                                    setScreen('select');
                                    orderCreatedRef.current = false;
                                }}>
                                    {t('checkout.try_again')}
                                </button>
                            </div>
                        )}

                        {/* SELECT — default */}
                        {screen === 'select' && (
                            <>
                                <div className="mp-qr-section">
                                    <h3 className="mp-methods-title">{t('checkout.qr_title')}</h3>
                                    <div className="mp-qr-container">
                                        <div className="mp-qr-frame">
                                            <QRCodeSVG 
                                                value={PAYMENT_URL}
                                                size={180}
                                                bgColor={"transparent"}
                                                fgColor={"#000000"}
                                                level={"L"}
                                                includeMargin={false}
                                            />
                                        </div>
                                        <p className="mp-qr-hint">{t('checkout.qr_hint')}</p>
                                    </div>
                                    <button 
                                        type="button"
                                        className="mp-pay-button-primary"
                                        onClick={handleConfirmPaid}
                                    >
                                        {t('checkout.pay_online')}
                                    </button>
                                </div>

                                <div className="mp-separator">
                                    <span>{t('checkout.or_other_methods')}</span>
                                </div>

                                {ENABLE_CRYPTO_PAY ? (
                                    <div className="mp-method-btn" onClick={() => {
                                        handleConfirmPaid();
                                    }}>
                                        <div className="mp-method-icon"><IconCrypto /></div>
                                        <div className="mp-method-info">
                                            <span className="mp-method-name">{t('checkout.crypto')}</span>
                                            <span className="mp-method-desc">Crypto Pay (USDT, TON)</span>
                                        </div>
                                        <div className="mp-method-arrow">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="mp-method-btn" onClick={() => handlePaymentSelect('cash')}>
                                    <div className="mp-method-icon"><IconCash /></div>
                                    <div className="mp-method-info">
                                        <span className="mp-method-name">{t('checkout.cash_courier')}</span>
                                        <span className="mp-method-desc">{t('checkout.cash_courier_desc')}</span>
                                    </div>
                                    <div className="mp-method-arrow">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default MobilePaymentPage;
