import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useLanguage } from '../../translations/LanguageContext';
import { Clock, ClipboardCheck, ChefHat, ShoppingBag, Bike, MapPin } from 'lucide-react';

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
    confirmed: 'Заказ передан на кухню',
    preparing: 'Ресторан начал готовку',
    ready: 'Ожидает курьера',
    delivering: 'Будет у вас через ~7 мин',
    delivered: 'Приятного аппетита!',
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
            if (order.status === 'delivered' && !order.rating && prevStatus && prevStatus !== 'delivered') {
                setShowRatingModal(true);
            }
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
    const statusText = order.status === 'delivered' ? t('status.courier_on_site') : (t(`status.${order.status}`) !== `status.${order.status}` ? t(`status.${order.status}`) : order.status_label);
    const estimatedTime = t(`status.desc_${order.status}`) !== `status.desc_${order.status}` ? t(`status.desc_${order.status}`) : (ESTIMATED_TIMES[order.status] || '...');

    const getStatusIcon = (status: string) => {
        const size = 24;
        const strokeWidth = 2;

        switch (status) {
            case 'delivered':
                return <MapPin size={size} strokeWidth={strokeWidth} className="simple-anim-pulse" />;
            case 'delivering':
                return <Bike size={size} strokeWidth={strokeWidth} className="simple-anim-pulse" />;
            case 'ready':
                return <ShoppingBag size={size} strokeWidth={strokeWidth} className="simple-anim-bounce" />;
            case 'preparing':
                return <ChefHat size={size} strokeWidth={strokeWidth} className="simple-anim-pulse" />;
            case 'confirmed':
                return <ClipboardCheck size={size} strokeWidth={strokeWidth} className="simple-anim-tada" />;
            case 'pending':
            default:
                return <Clock size={size} strokeWidth={strokeWidth} className="simple-anim-spin" />;
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
                    <span className="compact-time">{estimatedTime}</span>
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
                        <span className="aob-time" style={{ color: 'var(--status-color)' }}>{estimatedTime}</span>
                    </div>
                </div>
                <div className="aob-right">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
            </div>

            {showRatingModal && createPortal(
                <div className="premium-modal-overlay-global" onClick={() => setShowRatingModal(false)}>
                    <div className="premium-modal-content-global" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '40px 24px 32px' }}>
                        <div className="premium-icon-container">
                            <div className="premium-icon-glow"></div>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="icon-star-sparkle">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="rgba(245, 158, 11, 0.2)"></path>
                            </svg>
                        </div>
                        <h2 className="premium-modal-title">{t('menu.order_status_rating.delivered_title')}</h2>
                        <p className="premium-modal-subtitle">{t('menu.order_status_rating.delivered_subtitle')}</p>
                        
                        <div className="premium-stars-container">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`premium-star-btn ${(hoverRating || ratingValue) >= star ? 'active' : ''}`}
                                    onClick={() => setRatingValue(star)}
                                    onTouchStart={() => {
                                        // Prevent default to stop mouseEnter/click double firing on some mobile browsers
                                        // But actually just setting the value is enough for instant response
                                        setRatingValue(star);
                                    }}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                >
                                    <svg width="100%" height="100%" viewBox="0 0 24 24" fill={(hoverRating || ratingValue) >= star ? "#f59e0b" : "none"} stroke={(hoverRating || ratingValue) >= star ? "#f59e0b" : "rgba(255,255,255,0.2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                </button>
                            ))}
                        </div>

                        <div className="premium-modal-actions">
                            <button 
                                onClick={handleRateSubmit}
                                disabled={ratingValue === 0 || isSubmitting}
                                className={`premium-btn-submit ${ratingValue > 0 ? 'ready' : ''}`}
                            >
                                {isSubmitting ? t('menu.order_status_rating.submit_loading') : t('menu.order_status_rating.submit_btn')}
                            </button>
                            <button
                                onClick={() => setShowRatingModal(false)}
                                className="premium-btn-later"
                            >
                                {t('menu.order_status_rating.later_btn')}
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
