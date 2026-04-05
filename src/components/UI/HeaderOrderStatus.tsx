import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useLanguage } from '../../translations/LanguageContext';

interface ActiveOrder {
    id: number;
    status: string;
    status_label: string;
    rating?: number | null;
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#fbbf24', // yellow
    confirmed: '#3b82f6', // blue
    preparing: '#8b5cf6', // purple
    ready: '#10b981', // green
    delivering: '#21ea7c', // bright green
    delivered: '#f59e0b', // gold for rating
};

const ESTIMATED_TIMES: Record<string, string> = {
    pending: 'Ожидаем подтверждения',
    confirmed: '~ 30-40 мин.',
    preparing: '~ 20-30 мин.',
    ready: 'Ожидает курьера',
    delivering: '~ 10-15 мин.',
    delivered: 'Оцените заказ',
};

interface Props {
    onNavigate: (orderId: number) => void;
    compact?: boolean;
}

const HeaderOrderStatus: React.FC<Props> = ({ onNavigate, compact }) => {
    const { t } = useLanguage();
    const [order, setOrder] = useState<ActiveOrder | null>(null);
    const userId = localStorage.getItem('user_id');

    // Rating state
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [ratingValue, setRatingValue] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [prevStatus, setPrevStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const checkStatus = async () => {
            try {
                const data = await api.getActiveOrder(userId);
                setOrder(data);
            } catch (error) {
                console.error("Status check failed", error);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s as fallback

        return () => clearInterval(interval);
    }, [userId]);

    // WebSocket logic specific to the current active order
    useEffect(() => {
        if (!order?.id) return;
        let activeSocket: any = null;
        let isMounted = true;

        import('../../services/trackingSocket').then(({ TrackingSocket }) => {
            if (!isMounted) return;
            activeSocket = new TrackingSocket(order.id);
            activeSocket.connect();
            
            activeSocket.subscribe((msg: any) => {
                if (msg.type === 'status_update') {
                    setOrder((prev: any) => {
                        if (!prev || prev.id !== order.id) return prev;
                        return { ...prev, status: msg.status };
                    });
                }
            });
        });

        return () => {
            isMounted = false;
            if (activeSocket) activeSocket.disconnect();
        };
    }, [order?.id]);

    useEffect(() => {
        if (order) {
            setPrevStatus(order.status);
        }
    }, [order, prevStatus]);

    if (!order) return null;

    const handleRateSubmit = async () => {
        if (ratingValue === 0) return;
        setIsSubmitting(true);
        try {
            await api.rateOrder(order.id, { rating: ratingValue, rating_comment: "" });
            setShowRatingModal(false);
            setOrder(null); // Remove it fully so the banner hides
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const color = STATUS_COLORS[order.status] || '#888';
    const statusText = order.status === 'delivered' ? 'Заказ доставлен' : (t(`status.${order.status}`) !== `status.${order.status}` ? t(`status.${order.status}`) : order.status_label);
    const estimatedTime = ESTIMATED_TIMES[order.status] || '...';

    const getStatusIcon = (status: string) => {
        const props = { width: 24, height: 24, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24" } as const;
        const expandedProps = { ...props, viewBox: "-2 -2 28 28" };

        switch (status) {
            case 'delivered':
                // Sparkling Star
                return (
                    <svg {...expandedProps} fill="none" stroke="currentColor" className="icon-star-sparkle">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="rgba(245, 158, 11, 0.2)"></path>
                    </svg>
                );
            case 'delivering':
                // Delivery Truck
                return (
                    <svg {...expandedProps} fill="none" stroke="currentColor" className="icon-truck-wrapper">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5" className="icon-wheel" strokeDasharray="2 2"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5" className="icon-wheel" strokeDasharray="2 2"></circle>
                    </svg>
                );
            case 'ready':
                // Shopping Bag
                return (
                    <svg {...expandedProps} fill="none" stroke="currentColor" className="icon-bag">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                );
            case 'preparing':
                // Flame / Cooking (Stroke based)
                return (
                    <svg {...expandedProps} fill="none" stroke="currentColor">
                        <path className="icon-flame" d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                    </svg>
                );
            case 'confirmed':
                // Check Circle
                return (
                    <svg {...expandedProps} fill="none" stroke="currentColor" className="icon-check-pulse">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                );
            default:
                // Clock Wait
                return (
                    <svg {...expandedProps} fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14" className="icon-clock-hand"></polyline>
                    </svg>
                );
        }
    };

    if (compact) {
        return (
            <div 
                className="compact-order-status-pill"
                onClick={(e) => {
                    e.stopPropagation();
                    if (order.status === 'delivered') setShowRatingModal(true);
                    else onNavigate(order.id);
                }}
                style={{ '--status-color': color } as React.CSSProperties}
            >
                <div className="compact-icon">
                    {getStatusIcon(order.status)}
                </div>
                <div className="compact-info">
                    <span className="compact-label">{statusText}</span>
                    {order.status !== 'delivered' && <span className="compact-time">{estimatedTime}</span>}
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="active-order-expand-banner"
                onClick={(e) => {
                    e.stopPropagation();
                    if (order.status === 'delivered') setShowRatingModal(true);
                    else onNavigate(order.id);
                }}
                style={{ '--status-color': color } as React.CSSProperties}
            >
                <div className="aob-left">
                    <div className="aob-icon-wrapper">
                        {getStatusIcon(order.status)}
                    </div>
                    <div className="aob-info">
                        <span className="aob-status">{statusText}</span>
                        <span className="aob-dot-separator"></span>
                        <span className="aob-time" style={{ color: order.status === 'delivered' ? color : undefined, fontWeight: order.status === 'delivered' ? 600 : 500 }}>{estimatedTime}</span>
                    </div>
                </div>
                <div className="aob-right">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
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
                        <h2 className="pam-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Заказ доставлен!</h2>
                        <p className="pam-subtitle" style={{ marginBottom: '24px' }}>Пожалуйста, оцените работу нашего сервиса и качество блюд.</p>
                        
                        <div className="stars-container" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="star-btn"
                                    onClick={() => setRatingValue(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', transition: 'transform 0.2s' }}
                                >
                                    <svg
                                        width="40" height="40" viewBox="0 0 24 24"
                                        fill={(hoverRating || ratingValue) >= star ? "#f59e0b" : "none"}
                                        stroke={(hoverRating || ratingValue) >= star ? "#f59e0b" : "#555"}
                                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ transform: (hoverRating || ratingValue) >= star ? 'scale(1.1)' : 'scale(1)' }}
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
                                style={{ flex: 1, backgroundColor: '#3A3A3C', color: '#fff' }}
                            >
                                Позже
                            </button>
                            <button
                                className="pam-save-btn ct-confirm-btn"
                                onClick={handleRateSubmit}
                                disabled={ratingValue === 0 || isSubmitting}
                                style={{
                                    flex: 1,
                                    background: ratingValue > 0 ? '#21EA7C' : '#3A3A3C',
                                    color: ratingValue > 0 ? '#000' : '#888',
                                    opacity: ratingValue > 0 ? 1 : 0.5,
                                    cursor: ratingValue > 0 ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isSubmitting ? 'Отправка...' : 'Оценить'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default HeaderOrderStatus;
