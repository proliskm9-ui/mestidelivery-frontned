import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import './OrderStatus.css';
import { useLanguage } from '../translations/LanguageContext';

// SVG Icons
const IconClock = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const IconCheckFull = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>);
const IconChef = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" /><line x1="6" y1="17" x2="18" y2="17" /></svg>);
const IconBag = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>);
const IconBike = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="2.5" /><circle cx="18.5" cy="17.5" r="2.5" /><path d="M15 6h-5a2 2 0 1 0 0 4h3l3.5 3.5" /><path d="M5.5 15h13" /></svg>);
const IconHome = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>);
const IconBox = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>);
const IconChevronLeft = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>);

const IconStar = ({ filled = false, onClick }: { filled?: boolean; onClick?: () => void }) => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" onClick={onClick}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

interface Props {
    orderId: number;
    onBack: () => void;
}

const OrderStatus: React.FC<Props> = ({ orderId, onBack }) => {
    const { t } = useLanguage();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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
        { key: 'pending', label: t('status.pending'), icon: <IconClock /> },
        { key: 'confirmed', label: t('status.confirmed'), icon: <IconCheckFull /> },
        { key: 'preparing', label: t('status.preparing'), icon: <IconChef /> },
        { key: 'ready', label: t('status.ready'), icon: <IconBag /> },
        { key: 'delivering', label: t('status.delivering'), icon: <IconBike /> },
        { key: 'delivered', label: t('status.delivered'), icon: <IconHome /> },
    ], [t]);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await api.trackOrder(orderId);
                setOrder(data);
            } catch (error) {
                console.error("Order fetch failed", error);
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
    const currentStepIndex = order ? STATUS_STEPS.findIndex(s => s.key === order.status) : 0;
    const activeStepIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

    // Scroll active step into view
    useEffect(() => {
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

    if (loading) return <div className="order-status-page" style={{ paddingTop: 100, textAlign: 'center' }}>{t('common.loading')}</div>;
    if (!order) return <div className="order-status-page" style={{ paddingTop: 100, textAlign: 'center' }}>Order not found</div>;

    const currentStatusLabel = STATUS_STEPS[activeStepIndex]?.label || order.status;

    return (
        <div className="order-status-page">
            <header className="status-header">
                <button className="back-btn-status" onClick={onBack}>
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
                                    {isActive ? step.icon : (isCompleted ? <IconCheckFull /> : step.icon)}
                                </div>
                                <span className="step-label">{step.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="info-section">
                <div className="info-card">
                    <div className="card-title"><IconBox /> {t('status.order_items')}</div>
                    <div className="items-list">
                        {order.items.map((item: any, i: number) => (
                            <div className="item-row" key={i}>
                                <div className="item-name">
                                    <span className="item-qty">{item.quantity}x</span>
                                    <span>{item.name}</span>
                                </div>
                                <span>{(item.price * item.quantity).toFixed(2)} ₾</span>
                            </div>
                        ))}
                    </div>
                    <div className="total-row">
                        <span>{t('common.total')}</span>
                        <span className="total-price">{order.total} ₾</span>
                    </div>
                </div>

                {/* Rating Section (only if delivered) */}
                {order.status === 'delivered' && (
                    <div className="os-rating-card">
                        {ratingSubmitted || order.rating ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 'bold' }}>Оценка заказа</span>
                                <div className="os-stars">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <div key={star} className={`os-star ${(order.rating || rating) >= star ? 'active' : ''}`} style={{ cursor: 'default' }}>
                                            <IconStar filled={(order.rating || rating) >= star} />
                                        </div>
                                    ))}
                                </div>
                                <span style={{ color: '#21EA7C', fontSize: '14px' }}>Спасибо за вашу оценку!</span>

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
                                Оценить заказ
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showRatingModal && createPortal(
                <div className="rating-modal-overlay" onClick={() => setShowRatingModal(false)}>
                    <div className="rating-modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ marginBottom: '16px' }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon-star-sparkle">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="rgba(245, 158, 11, 0.2)"></path>
                            </svg>
                        </div>
                        <h2 className="pam-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Заказ доставлен!</h2>
                        <p className="pam-subtitle" style={{ marginBottom: '24px', color: '#888' }}>Пожалуйста, оцените работу нашего сервиса и качество блюд.</p>
                        
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
                                Позже
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
                                {isSubmittingRating ? 'Отправка...' : 'Оценить'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default OrderStatus;
