import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import './PaymentPage.css';
import { QRCodeSVG } from 'qrcode.react';
import { api, restaurantCache } from '../services/api';
import IsometricBoxLoader from '../components/UI/IsometricBoxLoader';

import { useLanguage } from '../translations/LanguageContext';
import { formatCheckoutAddress, formatCourierComment } from '../utils/checkoutAddress';
import { ENABLE_CRYPTO_PAY } from '../config/features';
import { toast } from 'sonner';
import { formatPrice } from '../utils/formatPrice';

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



// Payment method marks (simple-icons, CC0). Monochrome: they inherit currentColor.
const PAY_MARKS: { name: string; d: string }[] = [
    { name: 'Visa', d: 'M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z' },
    { name: 'Mastercard', d: 'M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031zm5.241-13.447c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416zM12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08-.184-.156-.28-.231z' },
    { name: 'Apple Pay', d: 'M2.15 4.318a42.16 42.16 0 0 0-.454.003c-.15.005-.303.013-.452.04a1.44 1.44 0 0 0-1.06.772c-.07.138-.114.278-.14.43-.028.148-.037.3-.04.45A10.2 10.2 0 0 0 0 6.222v11.557c0 .07.002.138.003.207.004.15.013.303.04.452.027.15.072.291.142.429a1.436 1.436 0 0 0 .63.63c.138.07.278.115.43.142.148.027.3.036.45.04l.208.003h20.194l.207-.003c.15-.004.303-.013.452-.04.15-.027.291-.071.428-.141a1.432 1.432 0 0 0 .631-.631c.07-.138.115-.278.141-.43.027-.148.036-.3.04-.45.002-.07.003-.138.003-.208l.001-.246V6.221c0-.07-.002-.138-.004-.207a2.995 2.995 0 0 0-.04-.452 1.446 1.446 0 0 0-1.2-1.201 3.022 3.022 0 0 0-.452-.04 10.448 10.448 0 0 0-.453-.003zm0 .512h19.942c.066 0 .131.002.197.003.115.004.25.01.375.032.109.02.2.05.287.094a.927.927 0 0 1 .407.407.997.997 0 0 1 .094.288c.022.123.028.258.031.374.002.065.003.13.003.197v11.552c0 .065 0 .13-.003.196-.003.115-.009.25-.032.375a.927.927 0 0 1-.5.693 1.002 1.002 0 0 1-.286.094 2.598 2.598 0 0 1-.373.032l-.2.003H1.906c-.066 0-.133-.002-.196-.003a2.61 2.61 0 0 1-.375-.032c-.109-.02-.2-.05-.288-.094a.918.918 0 0 1-.406-.407 1.006 1.006 0 0 1-.094-.288 2.531 2.531 0 0 1-.032-.373 9.588 9.588 0 0 1-.002-.197V6.224c0-.065 0-.131.002-.197.004-.114.01-.248.032-.375.02-.108.05-.199.094-.287a.925.925 0 0 1 .407-.406 1.03 1.03 0 0 1 .287-.094c.125-.022.26-.029.375-.032.065-.002.131-.002.196-.003zm4.71 3.7c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955zm2.207.42v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979zm-3.154.3c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002zm8.204.397c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm1.94.072l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z' },
    { name: 'Google Pay', d: 'M3.963 7.235A3.963 3.963 0 00.422 9.419a3.963 3.963 0 000 3.559 3.963 3.963 0 003.541 2.184c1.07 0 1.97-.352 2.627-.957.748-.69 1.18-1.71 1.18-2.916a4.722 4.722 0 00-.07-.806H3.964v1.526h2.14a1.835 1.835 0 01-.79 1.205c-.356.241-.814.379-1.35.379-1.034 0-1.911-.697-2.225-1.636a2.375 2.375 0 010-1.517c.314-.94 1.191-1.636 2.225-1.636a2.152 2.152 0 011.52.594l1.132-1.13a3.808 3.808 0 00-2.652-1.033zm6.501.55v6.9h.886V11.89h1.465c.603 0 1.11-.196 1.522-.588a1.911 1.911 0 00.635-1.464 1.92 1.92 0 00-.635-1.456 2.125 2.125 0 00-1.522-.598zm2.427.85a1.156 1.156 0 01.823.365 1.176 1.176 0 010 1.686 1.171 1.171 0 01-.877.357H11.35V8.635h1.487a1.156 1.156 0 01.054 0zm4.124 1.175c-.842 0-1.477.308-1.907.925l.781.491c.288-.417.68-.626 1.175-.626a1.255 1.255 0 01.856.323 1.009 1.009 0 01.366.785v.202c-.34-.193-.774-.289-1.3-.289-.617 0-1.11.145-1.479.434-.37.288-.554.677-.554 1.165a1.476 1.476 0 00.525 1.156c.35.308.785.463 1.305.463.61 0 1.098-.27 1.465-.81h.038v.655h.848v-2.909c0-.61-.19-1.09-.568-1.44-.38-.35-.896-.525-1.551-.525zm2.263.154l1.946 4.422-1.098 2.38h.915L24 9.963h-.965l-1.368 3.391h-.02l-1.406-3.39zm-2.146 2.368c.494 0 .88.11 1.156.33 0 .372-.147.696-.44.973a1.413 1.413 0 01-.997.414 1.081 1.081 0 01-.69-.232.708.708 0 01-.293-.578c0-.257.12-.47.363-.647.24-.173.54-.26.9-.26Z' },
];

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
    const completedRef     = useRef(false);
    const createdOrderRef  = useRef<{ id: number; method: string } | null>(null);
    const onCompleteRef    = useRef(onPaymentComplete);
    onCompleteRef.current  = onPaymentComplete;
    const [replayKey, setReplayKey]       = useState(0);  // re-runs the "order placed" animation
    const [returned, setReturned]         = useState(false);
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

    // Order exists server-side -> hand over to the status page exactly once
    const complete = useCallback((m: string, id: number) => {
        if (completedRef.current) return;
        completedRef.current = true;
        try {
            onCompleteRef.current(m, id);
        } catch (navError) {
            console.error('Order created but post-success navigation failed', navError);
        }
    }, []);

    // Leaving this page after the order was created (system back etc.) must not
    // drop the user back into checkout with a full cart: finish the hand-over instead.
    useEffect(() => () => {
        const created = createdOrderRef.current;
        if (created && !completedRef.current) complete(created.method, created.id);
    }, [complete]);

    // Online payment: Keepz opens in another window. When the user comes back,
    // replay the "order placed" animation, then open the order status.
    useEffect(() => {
        if (screen !== 'pending_confirmation' || method === 'cash') return;
        let left = document.visibilityState === 'hidden';
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') { left = true; return; }
            if (!left) return;
            left = false;
            setReplayKey((k) => k + 1);
            setReturned(true);
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [screen, method]);

    useEffect(() => {
        if (!returned || !orderId || screen !== 'pending_confirmation') return;
        const timer = setTimeout(() => complete('card', orderId), 2600);
        return () => clearTimeout(timer);
    }, [returned, orderId, screen, complete]);

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
                discount:         Number(orderData?.discount ?? 0) || 0,
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
                toast.error(t('checkout.order_creation_error'));
                setScreen('select');
                orderCreatedRef.current = false;
                return;
            }

            setOrderId(result.id);
            createdOrderRef.current = { id: result.id, method: selectedMethod };

            // ── CASH: no payment confirmation needed ──────────────────────
            if (selectedMethod === 'cash') {
                setMethod('cash');
                setScreen('pending_confirmation');
                try { navigator.vibrate?.([12, 60, 12]); } catch { /* not supported */ }
                await new Promise(r => setTimeout(r, 3000));
                // Order is already committed server-side here: a failure in the parent's
                // completion callback shouldn't surface as "order failed" or reset the flow.
                complete(selectedMethod, result.id);
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
            toast.error(t('common.error') + ': ' + (e.message || t('checkout.order_failed')));
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
                discount:         Number(orderData?.discount ?? 0) || 0,
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
                toast.error(t('checkout.order_creation_error'));
                setScreen('select');
                orderCreatedRef.current = false;
                return;
            }

            setOrderId(result.id);
            createdOrderRef.current = { id: result.id, method: 'card' };

            // Backend ignores status on creation — update it separately
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

    // ─── Render ────────────────────────────────────────────────────────────

    const formatElapsed = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        if (m > 0) return t('checkout.time_format_min_sec').replace('{m}', String(m)).replace('{s}', String(s));
        return t('checkout.time_format_sec').replace('{s}', String(s));
    };

    if (screen === 'pending_confirmation') {
        const isCash = method === 'cash';
        return (
            <div className="mobile-payment-wrapper payment-v2-layout">
                <div className="mp-done" role="status" aria-live="polite">
                    <div className="mp-done-mark" key={replayKey}>
                        <svg viewBox="0 0 96 96" aria-hidden="true">
                            <circle className="mp-done-ring" cx="48" cy="48" r="45" />
                            <path className="mp-done-check" d="M30 49.5 42.5 62 66 36" />
                        </svg>
                    </div>
                    <h1 className="mp-done-title" key={`t${replayKey}`}>{t('checkout.order_placed')}</h1>
                    <p className="mp-done-text">
                        {isCash ? t('checkout.pay_cash_on_delivery') : t('checkout.waiting_payment_confirm')}
                    </p>
                    {orderId && <span className="mp-done-id">{t('common.order')} #{orderId}</span>}
                    {!isCash && (
                        <div className="mp-done-actions">
                            <button
                                type="button"
                                className="ds-btn ds-btn--secondary"
                                disabled={!orderId}
                                onClick={() => orderId && complete('card', orderId)}
                            >
                                {t('checkout.go_to_order')}
                            </button>
                            <button type="button" className="mp-done-link" onClick={() => openPaymentUrl(PAYMENT_URL)}>
                                {t('checkout.open_payment_page')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

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
                                        {t('checkout.pay_amount').replace('{amount}', formatPrice(totalAmount))}
                                    </button>
                                    <div className="mp-pay-marks" aria-label={PAY_MARKS.map((m) => m.name).join(', ')}>
                                        {PAY_MARKS.map((m) => (
                                            <svg key={m.name} viewBox="0 0 24 24" aria-hidden="true"><path d={m.d} /></svg>
                                        ))}
                                    </div>
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
