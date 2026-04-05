import React, { useState, useRef, useMemo } from 'react';
import './PaymentPage.css';
import { api, restaurantCache } from '../services/api';
import IsometricBoxLoader from '../components/UI/IsometricBoxLoader';

// SVG Icons

const IconCrypto = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
    </svg>
);

const IconCard = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
);

const IconCash = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
    </svg>
);

// Lari symbol SVG for amount
const IconLari = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 22h-3v-4H8v-2h4v-2H8v-2h4V8a5.5 5.5 0 0 1 11 0v6.5a1.5 1.5 0 0 1-3 0V8a2.5 2.5 0 0 0-5 0v4h4v2h-4v2h4v2h-4v4z" />
    </svg>
);

interface MobilePaymentPageProps {
    onBack: () => void;
    totalAmount: number;
    orderData: any;
    cartItems: { product: any; quantity: number }[];
    onPaymentComplete: (method: string, orderId: number) => void;
}

const MobilePaymentPage: React.FC<MobilePaymentPageProps> = ({ onBack, totalAmount, orderData, cartItems, onPaymentComplete }) => {
    const [submitting, setSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [processingMethod, setProcessingMethod] = useState<string | null>(null);

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
            const userId = localStorage.getItem('user_id') || 'anonymous';
            const addr = orderData?.address || {};
            const fullAddress = [addr.street, addr.house, addr.apartment, addr.floor].filter(Boolean).join(', ');

            const items = (cartItems || []).map((ci: any) => ({
                product_id: ci.product.id,
                name: ci.product.name,
                price: ci.product.price,
                quantity: ci.quantity
            }));

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

            const result = await api.createOrder(payload);

            if (result && result.id) {
                orderCreatedRef.current = true;
                setIsSuccess(true);
                await new Promise(resolve => setTimeout(resolve, 2700));

                const paymentUrl = (result as any).payment_url;
                const finalUrl = paymentUrl || (method === 'crypto' 
                    ? `https://t.me/CryptoBot?start=pay_${result.id}` 
                    : `https://t.me/tribute?startapp=pay_${result.id}`);
                
                const tg = (window as any).Telegram?.WebApp;
                if (tg && method !== 'cash') {
                    if (tg.openInvoice && finalUrl.includes('t.me/$')) {
                        tg.openInvoice(finalUrl);
                    } else if (tg.openTelegramLink && finalUrl.includes('t.me')) {
                        tg.openTelegramLink(finalUrl);
                    } else if (tg.openLink) {
                        tg.openLink(finalUrl);
                    } else {
                        window.open(finalUrl, '_blank');
                    }
                } else if (method !== 'cash') {
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
        <div className="mobile-payment-wrapper">
            <div className="page">
                {/* Header matching Profile style */}
                <div className="profile-header" style={{ padding: '24px 20px 0 20px', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '32px', margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>ОПЛАТА</h1>
                    <div className="back-btn-minimal" onClick={onBack}>
                        Назад
                    </div>
                </div>

                <div className="mobile-payment-content">
                    {/* Amount Card */}
                    <div className="mp-amount-card">
                        <span className="mp-amount-label">К оплате (включая доставку)</span>
                        <h2 className="mp-amount-value">
                            {totalAmount.toFixed(2)} <IconLari />
                        </h2>
                    </div>

                    {/* Methods Card */}
                    <div className="mp-methods-card" style={{ position: 'relative' }}>
                        {submitting && (
                            <div className="mp-loading-overlay">
                                <IsometricBoxLoader isSuccess={isSuccess} />
                                <h3>{processingMethod === 'crypto' || processingMethod === 'card' ? 'Обрабатываем платеж...' : 'Формируем заказ...'}</h3>
                                <p>Это займет всего пару секунд</p>
                            </div>
                        )}
                        <h3 className="mp-methods-title">ВЫБЕРИТЕ СПОСОБ</h3>
                        
                        <div className="mp-method-btn" onClick={() => handlePaymentSelect('crypto')}>
                            <div className="mp-method-icon"><IconCrypto /></div>
                            <div className="mp-method-info">
                                <span className="mp-method-name">Криптовалюта</span>
                                <span className="mp-method-desc">Crypto Pay (USDT, TON)</span>
                            </div>
                            <div className="mp-method-arrow">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </div>
                        </div>

                        <div className="mp-method-btn" onClick={() => handlePaymentSelect('card')}>
                            <div className="mp-method-icon"><IconCard /></div>
                            <div className="mp-method-info">
                                <span className="mp-method-name">Картой онлайн</span>
                                <span className="mp-method-desc">Внутри Telegram (Tribute)</span>
                            </div>
                            <div className="mp-method-arrow">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </div>
                        </div>

                        <div className="mp-method-btn" onClick={() => handlePaymentSelect('cash')}>
                            <div className="mp-method-icon"><IconCash /></div>
                            <div className="mp-method-info">
                                <span className="mp-method-name">Наличными курьеру</span>
                                <span className="mp-method-desc">Оплата при получении заказа</span>
                            </div>
                            <div className="mp-method-arrow">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobilePaymentPage;
