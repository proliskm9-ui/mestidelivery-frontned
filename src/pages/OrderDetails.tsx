import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './OrderDetails.css';
import { api, restaurantCache } from '../services/api';
import FullPageLoader from '../components/UI/FullPageLoader';
import NetworkErrorState from '../components/UI/NetworkErrorState';
import { useLanguage } from '../translations/LanguageContext';
import { pickI18nText } from '../utils/i18nContent';

// SVG Icons
const IconBack = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

const IconHelp = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const IconPin = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const IconComment = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const IconStar = ({ filled = false, onClick }: { filled?: boolean; onClick?: () => void }) => (
    <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 24 24" 
        fill={filled ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth={filled ? "0" : "2"} 
        strokeLinecap="round" 
        strokeLinejoin="round"
        onClick={onClick}
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

interface OrderDetailsProps {
    orderId: number;
    onBack: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onBack }) => {
    const { t, language } = useLanguage();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    const [showRatingModal, setShowRatingModal] = useState(false);
    const [prevStatus, setPrevStatus] = useState<string | null>(null);

    useEffect(() => {
        if (order) {
            if (order.status === 'delivered' && !order.rating && prevStatus !== 'delivered') {
                setShowRatingModal(true);
            }
            setPrevStatus(order.status);
        }
    }, [order, prevStatus]);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await api.trackOrder(orderId);
                // Enrich restaurant_name from cache if missing
                if (!data.restaurant_name && data.restaurant_id) {
                    const cached = restaurantCache[`rest_${data.restaurant_id}`];
                    if (cached) data.restaurant_name = cached.name;
                }
                setOrder(data);
                setIsNetworkError(false);
            } catch (err) {
                console.error('Failed to fetch order details:', err);
                setIsNetworkError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();

        let activeSocket: any = null;
        let isMounted = true;
        
        import('../services/trackingSocket').then(({ TrackingSocket }) => {
            if (!isMounted) return;
            activeSocket = new TrackingSocket(orderId);
            activeSocket.connect();
            
            activeSocket.subscribe((msg: any) => {
                if (msg.type === 'status_update') {
                    setOrder((prev: any) => {
                        if (!prev) return prev;
                        return { ...prev, status: msg.status };
                    });
                }
            });
        });

        return () => {
            isMounted = false;
            if (activeSocket) activeSocket.disconnect();
        };
    }, [orderId]);

    const formatDate = (raw: string) => {
        if (!raw) return '—';
        try {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return '—';
            const day = d.getDate().toString().padStart(2, '0');
            const months = t('calendar.months') as unknown as string[];
            const month = months[d.getMonth()] || '';
            const hours = d.getHours().toString().padStart(2, '0');
            const mins = d.getMinutes().toString().padStart(2, '0');
            return `${day} ${month}, ${hours}:${mins}`;
        } catch { return '—'; }
    };

    const getStatusInfo = (status?: string): { label: string; cls: string } => {
        const s = status?.toLowerCase() || 'pending';
        switch (s) {
            case 'scheduled': return { label: t('status.scheduled'), cls: 'pending' };
            case 'new':
            case 'pending':
            case 'pending_payment': return { label: t('status.pending'), cls: 'pending' };
            case 'confirmed': return { label: t('status.confirmed'), cls: 'pending' };
            case 'preparing': return { label: t('status.preparing'), cls: 'pending' };
            case 'ready': return { label: t('status.ready'), cls: 'pending' };
            case 'delivering':
            case 'picked_up':
            case 'arrived': return { label: t('status.delivering'), cls: 'pending' };
            case 'cancelled': return { label: t('status.cancelled'), cls: 'cancelled' };
            case 'delivered': return { label: t('status.delivered'), cls: 'delivered' };
            default: return { label: t('status.pending'), cls: 'pending' };
        }
    };

    // Parse items — API may return string or array
    const parseItems = (items: any): { name: string; price: number; quantity: number }[] => {
        if (!items) return [];
        if (Array.isArray(items)) return items;
        try {
            const parsed = JSON.parse(items);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };



    const handleModalSubmit = async () => {
        if (!rating) return;
        setIsSubmittingRating(true);
        try {
            await api.rateOrder(orderId, { rating, rating_comment: "" });
            setRatingSubmitted(true);
            setOrder((prev: any) => ({ ...prev, rating, rating_comment: "" }));
            setShowRatingModal(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmittingRating(false);
        }
    };

    if (loading) {
        return <FullPageLoader text={t('order.loading_data')} />;
    }

    if (isNetworkError) {
        return (
            <div className="od-page" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="od-header">
                    <button className="od-back-btn" onClick={onBack}><IconBack /></button>
                </div>
                <NetworkErrorState />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="od-page">
                <div className="od-bg-glow" />
                <div className="od-header">
                    <button className="od-back-btn" onClick={onBack}><IconBack /></button>
                    <span className="od-header-title">{t('order.not_found')}</span>
                    <div className="od-header-spacer" />
                </div>
            </div>
        );
    }

    const items = parseItems(order.items);
    const statusInfo = getStatusInfo(order.status);
    const restName = order.restaurant_name || `${t('common.order')} #${order.id}`;
    const dateStr = formatDate(order.created_at || order.date);
    const address = order.address || '—';
    const comment = order.comment?.replace(/\[Оплата:.*?\]/g, '').trim();
    const itemsTotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const serviceFee = itemsTotal > 0 ? +(Math.max(0.99, Math.min(2.00, itemsTotal * 0.06)).toFixed(2)) : 0;
    const hasServiceFee = order.total >= (itemsTotal + serviceFee);
    const calculatedServiceFee = hasServiceFee ? serviceFee : 0;
    const rawDeliveryFee = order.total > (itemsTotal + calculatedServiceFee)
        ? +(order.total - itemsTotal - calculatedServiceFee).toFixed(2)
        : 0;
    // Orders from 100 ₾: delivery shown with the free-delivery promo applied (prod)
    const promoFree = itemsTotal >= 100 && rawDeliveryFee <= 12;
    const promoMinus10 = itemsTotal >= 100 && rawDeliveryFee >= 20;
    const deliveryFee = promoFree ? 0 : promoMinus10 ? 10 : rawDeliveryFee;
    const displayTotal = promoFree
        ? itemsTotal + calculatedServiceFee
        : promoMinus10 ? itemsTotal + calculatedServiceFee + 10 : order.total;

    return (
        <div className="od-page">
            <div className="od-bg-glow" />
            <div className="od-shell">
                {/* Header — restaurant name centered, date below */}
                <div className="od-header">
                    <button className="od-back-btn" onClick={onBack}><IconBack /></button>
                    <div className="od-header-center">
                        <span className="od-header-title">{restName}</span>
                        <span className="od-header-subtitle od-header-subtitle-mobile">{displayTotal?.toFixed(2)} ₾ · {dateStr}</span>
                        <span className="od-header-subtitle od-header-subtitle-pc">{dateStr !== '—' ? dateStr : ''}</span>
                    </div>
                    <div className="od-header-spacer" />
                </div>

                {/* Content */}
                <div className="od-content">
                    {/* PC-only hero */}
                    <div className="od-pc-hero">
                        <div className="od-pc-hero-total">
                            <span className="od-pc-hero-label">{t('order.total')}</span>
                            <span className="od-pc-hero-value">{displayTotal?.toFixed(2)} ₾</span>
                        </div>
                        <span className={`od-status-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                    </div>

                    {/* Help Button (mobile original) */}
                    <a
                        className="od-help-btn"
                        href="https://t.me/MestigoSupport_Bot"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <IconHelp />
                        {t('order.help')}
                    </a>

                    {/* Address */}
                    <div className="od-address-card">
                        <div className="od-address-icon"><IconPin /></div>
                        <div className="od-address-copy">
                            <span className="od-address-label">{t('checkout.address_title')}</span>
                            <span className="od-address-text">{address}</span>
                        </div>
                    </div>

                    {/* Comment (if any) */}
                    {comment && (
                        <div className="od-comment-card">
                            <div className="od-comment-icon"><IconComment /></div>
                            <span className="od-comment-text">{comment}</span>
                        </div>
                    )}

                    <div className="od-pc-receipt">
                        <div className="od-pc-col od-pc-col-items">
                            <h3 className="od-section-label od-label-items">{t('order.items_structure')}</h3>
                            <div className="od-items-card">
                                {items.map((item, i) => (
                                    <div className="od-item-row" key={i}>
                                        <span className="od-item-name">
                                            {pickI18nText(item.name, language)}
                                            <span className="od-item-qty od-item-qty-mobile"> {item.quantity}x</span>
                                            <span className="od-item-qty od-item-qty-pc"> ×{item.quantity}</span>
                                        </span>
                                        <span className="od-item-price">{(item.price * item.quantity).toFixed(2)} ₾</span>
                                    </div>
                                ))}
                                {deliveryFee > 0 && (
                                    <div className="od-item-row od-item-row-delivery">
                                        <span className="od-item-name">{t('order.delivery')}</span>
                                        <span className="od-item-price">{deliveryFee.toFixed(2)} ₾</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="od-pc-col od-pc-col-cost">
                            <h3 className="od-section-label od-label-cost">{t('order.cost')}</h3>
                            <div className="od-cost-card">
                                <div className="od-cost-row">
                                    <span>{t('order.goods')}</span>
                                    <span className="od-cost-value">{itemsTotal.toFixed(2)} ₾</span>
                                </div>
                                <div className="od-cost-row">
                                    <span>{t('order.delivery')}</span>
                                    <span className="od-cost-value">{deliveryFee > 0 ? `${deliveryFee.toFixed(2)} ₾` : t('favorites.free')}</span>
                                </div>
                                {calculatedServiceFee > 0 && (
                                    <div className="od-cost-row">
                                        <span>{t('order.service_fee')}</span>
                                        <span className="od-cost-value">{calculatedServiceFee.toFixed(2)} ₾</span>
                                    </div>
                                )}
                                <div className="od-cost-row total">
                                    <span>{t('order.total')}</span>
                                    <span className="od-cost-value">{displayTotal?.toFixed(2)} ₾</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status (mobile) */}
                    <div className="od-status-section">
                        <span className="od-status-label">{t('order.status')}</span>
                        <span className={`od-status-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                    </div>

                    {/* Rating Section (only if delivered) */}
                    {order.status === 'delivered' && (
                        <div className="od-rating-card">
                            {ratingSubmitted || order.rating ? (
                                <div className="od-rating-submitted">
                                    <span className="od-rating-title">{t('order.rating_title')}</span>
                                    <div className="od-stars">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <div key={star} className={`od-star ${(order.rating || rating) >= star ? 'active' : ''}`} style={{ cursor: 'default' }}>
                                                <IconStar filled={(order.rating || rating) >= star} />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="od-rating-submitted-text">{t('order.thanks_rating')}</span>

                                </div>
                            ) : (
                                <button 
                                    onClick={() => setShowRatingModal(true)}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        background: 'rgba(33, 234, 124, 0.1)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(33, 234, 124, 0.3)',
                                        color: '#21EA7C',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        transition: 'background 0.2s',
                                        marginTop: '12px'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                    {t('order.rate_order')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showRatingModal && createPortal(
                <div className="rating-modal-overlay" onClick={() => setShowRatingModal(false)}>
                    <div className="rating-modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '16px' }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon-star-sparkle">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="rgba(245, 158, 11, 0.2)"></path>
                            </svg>
                        </div>
                        <h2 className="pam-title" style={{ fontSize: '24px', marginBottom: '8px' }}>{t('order.delivered_title')}</h2>
                        <p className="pam-subtitle" style={{ marginBottom: '24px', color: '#888' }}>{t('order.delivered_subtitle')}</p>
                        
                        <div className="stars-container" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="star-btn"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', transition: 'transform 0.2s' }}
                                >
                                    <svg
                                        width="40" height="40" viewBox="0 0 24 24"
                                        fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                                        stroke={(hoverRating || rating) >= star ? "#f59e0b" : "#555"}
                                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)' }}
                                    >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="pam-save-btn ct-confirm-btn"
                                onClick={() => setShowRatingModal(false)}
                                style={{ background: '#3A3A3C', color: '#fff', flex: 1 }}
                            >
                                {t('order.later')}
                            </button>
                            <button
                                className="pam-save-btn ct-confirm-btn"
                                onClick={handleModalSubmit}
                                disabled={rating === 0 || isSubmittingRating}
                                style={{
                                    flex: 1,
                                    background: rating > 0 ? '#21EA7C' : '#3A3A3C',
                                    color: rating > 0 ? '#000' : '#888',
                                    opacity: rating > 0 ? 1 : 0.5,
                                    cursor: rating > 0 ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isSubmittingRating ? t('order.sending') : t('order.rate')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default OrderDetails;
