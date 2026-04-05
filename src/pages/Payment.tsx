import React, { useState, useRef, useMemo } from 'react';
import './Payment.css';
import { api, restaurantCache } from '../services/api';
import IsometricBoxLoader from '../components/UI/IsometricBoxLoader';

// Enhanced SVG Icons
const IconBack = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const IconCrypto = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
    </svg>
);

const IconCard = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
);

const IconCash = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
    </svg>
);

interface PaymentPageProps {
    onBack: () => void;
    totalAmount: number;
    orderData: any;
    cartItems: { product: any; quantity: number }[];
    onPaymentComplete: (method: string, orderId: number) => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ onBack, totalAmount, orderData, cartItems, onPaymentComplete }) => {
    const [submitting, setSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [processingMethod, setProcessingMethod] = useState<string | null>(null);

    // Double-order protection
    const orderCreatedRef = useRef(false);
    const idempotencyKey = useMemo(() => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }, []);

    const handlePaymentSelect = async (method: string) => {
        if (submitting || orderCreatedRef.current) return;
        setSubmitting(true);
        setProcessingMethod(method);

        try {
            // Get user_id from token (decode JWT or use stored ID)
            const userId = localStorage.getItem('user_id') || 'anonymous';

            // Build full address string
            const addr = orderData?.address || {};
            const fullAddress = [addr.street, addr.house, addr.apartment, addr.floor]
                .filter(Boolean).join(', ');

            // Build items array for API
            const items = (cartItems || []).map((ci: any) => ({
                product_id: ci.product.id,
                name: ci.product.name,
                price: ci.product.price,
                quantity: ci.quantity
            }));

            // Get restaurant_id from first cart item
            const restaurantId = cartItems?.[0]?.product?.restaurant_id || '';

            const payload = {
                user_id: userId,
                restaurant_id: restaurantId,
                restaurant_name: restaurantCache[`rest_${restaurantId}`]?.name || '',
                items: items,
                total: totalAmount,
                customer_name: addr.customerName || localStorage.getItem('user_name') || 'Клиент',
                phone: addr.phone || '',
                address: fullAddress,
                comment: (orderData?.restaurantComment || '') + ` [Оплата: ${method === 'cash' ? 'Наличные' : (method === 'card' ? 'Карта' : 'Crypto')}]`,
                courier_comment: addr.comment || '',
                cutlery_count: orderData?.cutleryCount || 0,
                apartment: addr.apartment || '',
                entrance: addr.entrance || '',
                floor: addr.floor || '',
                intercom: addr.intercom || '',
                place_type: addr.type || 'home',
                scheduled_time: orderData?.deliveryType === 'scheduled' ? orderData?.scheduledTime : null,
                promo_code: orderData?.promoCode || '',
                tips: orderData?.tip || 0,
                idempotency_key: idempotencyKey,
                payment_method: method,
            };

            console.log('Creating order with payload:', payload);

            const result = await api.createOrder(payload);

            if (result && result.id) {
                orderCreatedRef.current = true;
                setIsSuccess(true);
                // Wait for success animation
                await new Promise(resolve => setTimeout(resolve, 2700));

                // Use server-generated payment URL if available, else fallback
                const paymentUrl = (result as any).payment_url;
                const finalUrl = paymentUrl || (method === 'crypto' 
                    ? `https://t.me/CryptoBot?start=pay_${result.id}` 
                    : `https://t.me/tribute?startapp=pay_${result.id}`);
                
                const tg = (window as any).Telegram?.WebApp;
                if (tg) {
                    if (tg.openInvoice && finalUrl.includes('t.me/$')) {
                        tg.openInvoice(finalUrl);
                    } else if (tg.openTelegramLink && finalUrl.includes('t.me')) {
                        tg.openTelegramLink(finalUrl);
                    } else if (tg.openLink) {
                        tg.openLink(finalUrl);
                    } else {
                        window.open(finalUrl, '_blank');
                    }
                } else {
                    window.open(finalUrl, '_blank');
                }
                
                onPaymentComplete(method, result.id);
            } else {
                alert('Ошибка создания заказа');
                setSubmitting(false);
                setIsSuccess(false);
            }
        } catch (e: any) {
            console.error('Order creation error:', e);
            alert('Ошибка: ' + (e.message || 'Не удалось создать заказ'));
            setSubmitting(false);
            setIsSuccess(false);
        }
    };

    return (
        <div className="page-transition-wrapper">
            <div className="payment-page-container">
                <header className="payment-header">
                    <button className="back-circle-btn" onClick={onBack} aria-label="Назад" disabled={submitting}>
                        <IconBack />
                    </button>
                    <h1>Оплата</h1>
                </header>

                <div className="payment-content">
                    <div className="amount-summary">
                        <span className="label">Сумма к оплате</span>
                        <h2 className="value">{totalAmount.toFixed(2)} ₾</h2>
                    </div>

                    {submitting ? (
                        <div className="payment-loading-fullscreen">
                            <div className="mestigo-loading-container">
                                <IsometricBoxLoader isSuccess={isSuccess} />
                                <h2>{processingMethod === 'crypto' || processingMethod === 'card' ? 'Обрабатываем платеж...' : 'Формируем заказ...'}</h2>
                                <p>Это займет всего пару секунд</p>
                            </div>
                        </div>
                    ) : (
                        <div className="payment-methods-grid">
                            <div className="payment-method-card" onClick={() => handlePaymentSelect('crypto')}>
                                <div className="method-icon crypto">
                                    <IconCrypto />
                                </div>
                                <div className="method-info">
                                    <h3>Криптовалюта</h3>
                                    <p>Crypto Pay (USDT, TON, BTC)</p>
                                </div>
                                <div className="arrow">→</div>
                            </div>

                            <div className="payment-method-card" onClick={() => handlePaymentSelect('card')}>
                                <div className="method-icon card">
                                    <IconCard />
                                </div>
                                <div className="method-info">
                                    <h3>Банковская карта</h3>
                                    <p>Оплата через Tribute (SBP/Stars)</p>
                                </div>
                                <div className="arrow">→</div>
                            </div>

                            <div className="payment-method-card" onClick={() => handlePaymentSelect('cash')}>
                                <div className="method-icon cash">
                                    <IconCash />
                                </div>
                                <div className="method-info">
                                    <h3>Наличными</h3>
                                    <p>Оплата курьеру при получении</p>
                                </div>
                                <div className="arrow">→</div>
                            </div>
                        </div>
                    )}

                    <footer className="payment-footer">
                        <p>Безопасные платежи через Telegram API</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
