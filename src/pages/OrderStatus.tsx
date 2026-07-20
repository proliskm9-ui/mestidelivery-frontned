import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import FullPageLoader from '../components/UI/FullPageLoader';
import NetworkErrorState from '../components/UI/NetworkErrorState';
import './OrderStatus.css';
import { useLanguage } from '../translations/LanguageContext';
import {
    Clock,
    ClipboardCheck,
    ChefHat,
    ShoppingBag,
    Bike,
    MapPin,
    CheckCircle
} from 'lucide-react';

const IconChevronLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const IconStar = ({ filled = false, onClick }: { filled?: boolean; onClick?: () => void }) => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" onClick={onClick}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

interface Props {
    orderId: number;
    onBack: () => void;
    onViewDetails?: (orderId: number) => void;
}

const OrderStatus: React.FC<Props> = ({ orderId, onBack, onViewDetails }) => {
    const { t } = useLanguage();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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

    const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    const STATUS_STEPS = useMemo(() => [
        { key: 'pending', label: t('status.pending'), icon: <Clock strokeWidth={1.5} /> },
        { key: 'confirmed', label: t('status.confirmed'), icon: <ClipboardCheck strokeWidth={1.5} /> },
        { key: 'preparing', label: t('status.preparing'), icon: <ChefHat strokeWidth={1.5} /> },
        { key: 'ready', label: t('status.ready'), icon: <ShoppingBag strokeWidth={1.5} /> },
        { key: 'delivering', label: t('status.delivering'), icon: <Bike strokeWidth={1.5} /> },
        { key: 'delivered', label: t('status.delivered'), icon: <MapPin strokeWidth={1.5} /> },
    ], [t]);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await api.trackOrder(orderId);
                setOrder(data);
                setIsNetworkError(false);
            } catch (error) {
                console.error("Order fetch failed", error);
                setIsNetworkError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();

        // WebSocket Integration
        let activeSocket: any = null;
        let isMounted = true;
        
        import('../services/trackingSocket').then(({ TrackingSocket }) => {
            if (!isMounted) return;
            const socket = new TrackingSocket(orderId);
            activeSocket = socket;
            socket.connect();

            // Subscribe to updates
            socket.subscribe((msg: any) => {
                if (msg.type === 'location_update') {
                    // Update order courier coords locally
                    setOrder((prev: any) => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            courier_coords: {
                                latitude: msg.latitude,
                                longitude: msg.longitude
                            }
                        };
                    });
                } else if (msg.type === 'status_update') {
                    setOrder((prev: any) => {
                        if (!prev) return prev;
                        return { ...prev, status: msg.status };
                    });
                }
            });
        });

        // Cleanup
        return () => {
            isMounted = false;
            if (activeSocket) activeSocket.disconnect();
        };
    }, [orderId]);

    // Determine current step index
    const currentStepIndex = order ? STATUS_STEPS.findIndex(s => s.key === order.status || (order.status === 'pending_payment' && s.key === 'pending')) : 0;
    const activeStepIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

    // Scroll active step into view (mobile carousel only)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth > 1024) return;
        if (stepsRef.current[activeStepIndex] && scrollContainerRef.current) {
            stepsRef.current[activeStepIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [activeStepIndex, loading]);

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

    if (loading) return <FullPageLoader variant="order" />;
    
    if (isNetworkError) {
        return (
            <div className="order-status-page" style={{ display: 'flex', flexDirection: 'column' }}>
                <header className="os-header" style={{ position: 'relative' }}>
                    <div className="os-back-btn" onClick={onBack}>
                        <IconChevronLeft />
                    </div>
                </header>
                <NetworkErrorState />
            </div>
        );
    }

    if (!order) return <div className="order-status-page" style={{ paddingTop: 100, textAlign: 'center' }}>Order not found</div>;

    const currentStatusLabel = STATUS_STEPS[activeStepIndex]?.label || order.status;

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

    const items = parseItems(order.items);
    const itemsTotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const serviceFee = itemsTotal > 0 ? +(Math.max(0.99, Math.min(2.00, itemsTotal * 0.06)).toFixed(2)) : 0;
    const hasServiceFee = order.total >= (itemsTotal + serviceFee);
    const calculatedServiceFee = hasServiceFee ? serviceFee : 0;
    const deliveryFee = order.total > (itemsTotal + calculatedServiceFee) 
        ? +(order.total - itemsTotal - calculatedServiceFee).toFixed(2) 
        : 0;



    return (
        <div className="order-status-page page-layout">
            <div className="os-block-top">
                <header className="status-header">
                    <button type="button" className="back-btn-status" onClick={onBack} aria-label={t('common.back')}>
                        <IconChevronLeft />
                    </button>
                    <div className="header-title-block">
                        <h2>{t('common.order')} #{order.id}</h2>
                        <p>{t('status.est_time')}</p>
                    </div>
                </header>

                <div className="primary-status-label">
                    <h1>{currentStatusLabel}</h1>
                </div>

                <div className="status-scroll-container">
                    <div className="steps-track" ref={scrollContainerRef}>
                        <div className="progress-line-bg" style={{ display: 'none' }} />
                        {STATUS_STEPS.map((step, index) => {
                            const isActive = index === activeStepIndex;
                            const isCompleted = index < activeStepIndex;
                            const stepClass = `step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
                            return (
                                <div className={stepClass} key={step.key} ref={el => stepsRef.current[index] = el}>
                                    <div className="icon-circle">
                                        {isActive && <div className="active-ring-dashed" />}
                                        {isActive && <div className="active-ring-solid" />}
                                        {isActive ? step.icon : (isCompleted ? <CheckCircle strokeWidth={1.5} /> : step.icon)}
                                    </div>
                                    <span className="step-label">{step.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="os-block-bottom">
                <div className="info-section">
                    {/* Items */}
                    <h3 className="od-section-label">{t('order.items_structure')}</h3>
                    <div className="od-items-card">
                        {items.map((item, i) => (
                            <div className="od-item-row" key={i}>
                                <span className="od-item-name">
                                    {item.name}
                                    <span className="od-item-qty"> {item.quantity}x</span>
                                </span>
                                <span className="od-item-price">{(item.price * item.quantity).toFixed(2)} ₾</span>
                            </div>
                        ))}
                        {deliveryFee > 0 && (
                            <div className="od-item-row">
                                <span className="od-item-name">{t('order.delivery')}</span>
                                <span className="od-item-price">{deliveryFee.toFixed(2)} ₾</span>
                            </div>
                        )}
                    </div>

                    {/* Cost Summary */}
                    <h3 className="od-section-label">{t('order.cost')}</h3>
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
                            <span className="od-cost-value">{order.total?.toFixed(2)} ₾</span>
                        </div>
                    </div>

                    {/* Detailed Info Button */}
                    <button type="button" className="od-details-btn" onClick={() => onViewDetails?.(order.id)}>
                        {t('order.detailed_info')}
                    </button>

                {/* Rating Section (only if delivered) */}
                {order.status === 'delivered' && (
                    <div className="os-rating-card">
                        {ratingSubmitted || order.rating ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 'bold' }}>{t('order.evaluation')}</span>
                                <div className="os-stars">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <div key={star} className={`os-star ${(order.rating || rating) >= star ? 'active' : ''}`} style={{ cursor: 'default' }}>
                                            <IconStar filled={(order.rating || rating) >= star} />
                                        </div>
                                    ))}
                                </div>
                                <span style={{ color: '#21EA7C', fontSize: '14px' }}>{t('order.rating_thank_you')}</span>

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
                                    transition: 'background 0.2s'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                {t('order.rating_btn')}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showRatingModal && createPortal(
                <div className="premium-modal-overlay-global" onClick={() => setShowRatingModal(false)}>
                    <div className="premium-modal-content-global" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '40px 24px 32px' }}>
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
                                    onTouchStart={() => setRating(star)}
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
                                {t('order.later_btn')}
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
                                {isSubmittingRating ? t('menu.order_status_rating.submit_loading') : t('order.submit_rating')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            </div>
        </div>
    );
};

export default OrderStatus;
