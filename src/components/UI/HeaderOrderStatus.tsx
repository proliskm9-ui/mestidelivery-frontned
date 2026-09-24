import React, { useEffect, useState } from 'react';
import Sheet from './Sheet';
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
    pending: '#fbbf24',
    pending_payment: '#fbbf24',
    confirmed: '#3b82f6',
    accepted: '#3b82f6',
    preparing: '#8b5cf6',
    ready: '#10b981',
    delivering: '#21ea7c',
    delivered: '#f59e0b',
    scheduled: '#21ea7c',
};

/** Normalize backend status aliases to i18n keys under status.* */
const normalizeStatusKey = (status: string): string => {
    const base = String(status || '').split(':')[0]; // e.g. "scheduled:18:30"
    if (base === 'accepted') return 'confirmed';
    if (base === 'pending_payment') return 'pending';
    return base;
};

const ESTIMATED_TIMES: Record<string, string> = {
    pending: 'Ожидаем подтверждения',
    confirmed: 'Заказ передан на кухню',
    preparing: 'Ресторан начал готовку',
    ready: 'Ожидает курьера',
    delivering: 'Курьер уже едет к вам',
    delivered: 'Приятного аппетита!',
    scheduled: 'Заказ ко времени',
};

interface Props {
    onNavigate: (orderId: number) => void;
    compact?: boolean;
}

const HeaderOrderStatus: React.FC<Props> = ({ onNavigate, compact }) => {
    const { t, language } = useLanguage();
    const [order, setOrder] = useState<ActiveOrder | null>(null);
    const token = localStorage.getItem('token');

    // Rating state
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingValue, setRatingValue] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [prevStatus, setPrevStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const checkStatus = async () => {
            try {
                const data = await api.getActiveOrder();
                setOrder(data);
            } catch (error) {
                console.error("Status check failed", error);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s as fallback

        return () => clearInterval(interval);
    }, [token]);

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

    const statusKey = normalizeStatusKey(order.status);
    const color = STATUS_COLORS[statusKey] || STATUS_COLORS[order.status] || '#21ea7c';
    const isScheduled = statusKey === 'scheduled' || String(order.status).startsWith('scheduled');
    const scheduledAt = (raw: string | null | undefined): string => {
        if (!raw) return language === 'en' ? 'To opening time' : language === 'ka' ? 'გახსნის დროისთვის' : 'Ко времени открытия';
        const m = String(raw).match(/(\d{1,2}:\d{2})/);
        const time = m ? m[1] : String(raw);
        return language === 'en' ? `At ${time}` : language === 'ka' ? `${time}-ზე` : `К ${time}`;
    };
    const translatedStatus = t(`status.${statusKey}`);
    const statusText = order.status === 'delivered'
        ? t('status.courier_on_site')
        : (translatedStatus !== `status.${statusKey}`
            ? translatedStatus
            : (isScheduled
                ? (language === 'en' ? 'Scheduled order' : language === 'ka' ? 'შეკვეთა დროზე' : 'Заказ ко времени')
                : (ESTIMATED_TIMES[statusKey] || order.status)));
    const translatedDesc = t(`status.desc_${statusKey}`);
    const estimatedTime = translatedDesc !== `status.desc_${statusKey}`
        ? translatedDesc
        : (isScheduled
            ? scheduledAt((order as any).scheduled_time)
            : (ESTIMATED_TIMES[statusKey] || ESTIMATED_TIMES[order.status] || '...'));

    const getStatusIcon = (status: string) => {
        const size = compact ? 22 : 24;
        const strokeWidth = 2;
        const key = normalizeStatusKey(status);

        switch (key) {
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
            case 'scheduled':
                return <Clock size={size} strokeWidth={strokeWidth} className="simple-anim-pulse" />;
            case 'pending':
            default:
                return <Clock size={size} strokeWidth={strokeWidth} className="simple-anim-spin" />;
        }
    };

    if (compact) {
        return (
            <button
                type="button"
                className="hd-order-aob"
                onClick={(e) => {
                    e.stopPropagation();
                    if (order.status === 'delivered') setShowRatingModal(true);
                    else onNavigate(order.id);
                }}
                style={{ '--status-color': color } as React.CSSProperties}
            >
                <span className="aob-icon-wrapper" aria-hidden="true">
                    {getStatusIcon(order.status)}
                </span>
                <span className="aob-info">
                    <span className="aob-status">{statusText}</span>
                    <span className="aob-time">{estimatedTime}</span>
                </span>
            </button>
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

            <Sheet
                open={showRatingModal}
                onOpenChange={setShowRatingModal}
                title={t('menu.order_status_rating.delivered_title')}
                description={t('menu.order_status_rating.delivered_subtitle')}
                footer={
                    <>
                        <button type="button" className="ds-btn ds-btn--primary" onClick={handleRateSubmit} disabled={ratingValue === 0 || isSubmitting}>
                            {isSubmitting ? t('menu.order_status_rating.submit_loading') : t('menu.order_status_rating.submit_btn')}
                        </button>
                        <button type="button" className="md-dialog-cancel" onClick={() => setShowRatingModal(false)}>{t('menu.order_status_rating.later_btn')}</button>
                    </>
                }
            >
                <div className="od-rate-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" className="od-rate-star" onClick={() => setRatingValue(star)} aria-label={String(star)}>
                            <svg width="40" height="40" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                                fill={ratingValue >= star ? '#FFC53D' : 'none'} stroke={ratingValue >= star ? '#FFC53D' : 'rgba(255, 255, 255, 0.24)'}>
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </button>
                    ))}
                </div>
            </Sheet>
        </>
    );
};

export default HeaderOrderStatus;
