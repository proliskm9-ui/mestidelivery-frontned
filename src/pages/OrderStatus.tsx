import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import FullPageLoader from '../components/UI/FullPageLoader';
import NetworkErrorState from '../components/UI/NetworkErrorState';
import './OrderStatus.css';
import { formatPrice } from '../utils/formatPrice';
import { useLanguage } from '../translations/LanguageContext';
import { pickI18nText } from '../utils/i18nContent';
import {
    Clock,
    ClipboardCheck,
    ChefHat,
    ShoppingBag,
    Bike,
    MapPin,
    CheckCircle,
    Utensils,
    Flame,
    Package,
    Leaf,
    Zap,
    UserCheck,
    Snowflake,
    PackageX,
    UtensilsCrossed,
    AlertTriangle,
    Check,
    X,
    Coins,
    HeartHandshake,
    ThumbsDown,
} from 'lucide-react';

const KEEPZ_PAY_URL = 'https://app.keepz.me/pay?qrType=DEFAULT&receiverType=USER&receiverId=6ea6970c-20ee-4119-b25f-6ebcc8a888c6';

const IconChevronLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const StarIcon = ({ filled = false, size = 38 }: { filled?: boolean; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? "#FFB800" : "none"}
        stroke={filled ? "#FFB800" : "rgba(255, 255, 255, 0.22)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: filled ? "drop-shadow(0 0 10px rgba(255, 184, 0, 0.55))" : "none", transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

// Smart tags: click → appended to comment textarea
const REST_TAGS_POSITIVE = [
    { id: 'tasty',       label: 'Очень вкусно',       icon: Utensils },
    { id: 'hot',         label: 'Горячее',             icon: Flame },
    { id: 'packaging',   label: 'Отличная упаковка',   icon: Package },
    { id: 'fresh',       label: 'Свежие продукты',     icon: Leaf },
    { id: 'big_portion', label: 'Большая порция',      icon: ChefHat },
];

const REST_TAGS_NEGATIVE = [
    { id: 'cold',        label: 'Холодное',            icon: Snowflake },
    { id: 'not_tasty',   label: 'Не понравился вкус',  icon: ThumbsDown },
    { id: 'no_cutlery',  label: 'Не положили приборы', icon: UtensilsCrossed },
    { id: 'damaged_pkg', label: 'Помялась упаковка',   icon: PackageX },
    { id: 'wrong_order', label: 'Не тот заказ',        icon: AlertTriangle },
];

const COURIER_TAGS_POSITIVE = [
    { id: 'fast',    label: 'Быстро привезли',     icon: Zap },
    { id: 'polite',  label: 'Вежливый',            icon: UserCheck },
    { id: 'careful', label: 'Аккуратная доставка', icon: Package },
    { id: 'called',  label: 'Позвонил заранее',    icon: CheckCircle },
];

const COURIER_TAGS_NEGATIVE = [
    { id: 'slow',    label: 'Долгая доставка', icon: Clock },
    { id: 'rude',    label: 'Был грубым',      icon: ThumbsDown },
    { id: 'spilled', label: 'Пролил / помял',  icon: PackageX },
    { id: 'lost',    label: 'Заблудился',      icon: AlertTriangle },
];

const TIP_PRESETS = [2, 4, 7, 10];

type RatingStep = 'restaurant' | 'courier' | 'success';

interface Props {
    orderId: number;
    onBack: () => void;
    onViewDetails?: (orderId: number) => void;
}

const OrderStatus: React.FC<Props> = ({ orderId, onBack, onViewDetails }) => {
    const { t, language } = useLanguage();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showTipsModal, setShowTipsModal] = useState(false);
    const [prevStatus, setPrevStatus] = useState<string | null>(null);

    // Multi-step state
    const [ratingStep, setRatingStep] = useState<RatingStep>('restaurant');
    const [restRating, setRestRating] = useState(0);
    const [restHover, setRestHover] = useState(0);
    const [restComment, setRestComment] = useState('');
    const [courierRating, setCourierRating] = useState(0);
    const [courierHover, setCourierHover] = useState(0);
    const [courierComment, setCourierComment] = useState('');

    // Tips state (shared between modal step and standalone modal)
    const [selectedTip, setSelectedTip] = useState<number>(0);
    const [customTip, setCustomTip] = useState<string>('');
    const [isCustomTipActive, setIsCustomTipActive] = useState<boolean>(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [tipsSent, setTipsSent] = useState<boolean>(false);
    const [isSubmittingTips, setIsSubmittingTips] = useState<boolean>(false);

    const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (order) {
            if (order.status === 'delivered' && !order.rating && prevStatus !== 'delivered') {
                setShowRatingModal(true);
            }
            setPrevStatus(order.status);
        }
    }, [order, prevStatus]);

    const STATUS_STEPS = useMemo(() => [
        { key: 'pending',    label: t('status.pending'),    icon: <Clock strokeWidth={1.5} /> },
        { key: 'confirmed',  label: t('status.confirmed'),  icon: <ClipboardCheck strokeWidth={1.5} /> },
        { key: 'preparing',  label: t('status.preparing'),  icon: <ChefHat strokeWidth={1.5} /> },
        { key: 'ready',      label: t('status.ready'),      icon: <ShoppingBag strokeWidth={1.5} /> },
        { key: 'delivering', label: t('status.delivering'), icon: <Bike strokeWidth={1.5} /> },
        { key: 'delivered',  label: t('status.delivered'),  icon: <MapPin strokeWidth={1.5} /> },
    ], [t]);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const data = await api.trackOrder(orderId);
                setOrder(data);
                setIsNetworkError(false);
            } catch (error) {
                console.error('Order fetch failed', error);
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
            const socket = new TrackingSocket(orderId);
            activeSocket = socket;
            socket.connect();
            socket.subscribe((msg: any) => {
                if (msg.type === 'location_update') {
                    setOrder((prev: any) => {
                        if (!prev) return prev;
                        return { ...prev, courier_coords: { latitude: msg.latitude, longitude: msg.longitude } };
                    });
                } else if (msg.type === 'status_update') {
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

    const currentStepIndex = order
        ? STATUS_STEPS.findIndex(s => s.key === order.status || (order.status === 'pending_payment' && s.key === 'pending'))
        : 0;
    const activeStepIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

    useEffect(() => {
        if (typeof window !== 'undefined' && window.innerWidth > 1024) return;
        if (stepsRef.current[activeStepIndex] && scrollContainerRef.current) {
            stepsRef.current[activeStepIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeStepIndex, loading]);

    // Tag click appends label text to the comment field
    const appendTag = (label: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        setter(prev => {
            const trimmed = prev.trim();
            if (!trimmed) return label;
            if (trimmed.toLowerCase().includes(label.toLowerCase())) return trimmed;
            return `${trimmed}, ${label}`;
        });
    };

    const isTagUsed = (label: string, comment: string) =>
        comment.toLowerCase().includes(label.toLowerCase());

    const handleSubmitRating = async () => {
        if (restRating === 0) return;
        setIsSubmitting(true);
        try {
            const parts: string[] = [];
            if (restComment.trim()) parts.push(restComment.trim());
            if (courierComment.trim()) parts.push(`Курьер: ${courierComment.trim()}`);
            const fullComment = parts.join('\n\n');

            await api.rateOrder(orderId, { rating: restRating, rating_comment: fullComment });

            try {
                fetch('/api/bot/v1/orders/review', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_id: orderId, rating: restRating, courier_rating: courierRating, comment: fullComment }),
                }).catch(() => {});
            } catch (_) {}

            const effectiveTip = isCustomTipActive ? (parseFloat(customTip) || 0) : selectedTip;
            if (effectiveTip > 0) {
                window.open(KEEPZ_PAY_URL, '_blank', 'noopener,noreferrer');
                try {
                    fetch('/api/bot/v1/orders/tips', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_id: orderId, tips: effectiveTip }),
                    }).catch(() => {});
                } catch (_) {}
                setTipsSent(true);
            }

            setRatingSubmitted(true);
            setOrder((prev: any) => ({ ...prev, rating: restRating, rating_comment: fullComment }));
            setRatingStep('success');
            setTimeout(() => { setShowRatingModal(false); setRatingStep('restaurant'); }, 2400);
        } catch (err) {
            console.error('Rate order failed', err);
            setShowRatingModal(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const effectiveTipModal = isCustomTipActive ? (parseFloat(customTip) || 0) : selectedTip;

    const closeAndResetModal = () => {
        setShowRatingModal(false);
        setTimeout(() => setRatingStep('restaurant'), 300);
    };

    const effectiveTipStandalone = isCustomTipActive ? (parseFloat(customTip) || 0) : selectedTip;

    const handleDirectTipsPay = async () => {
        if (effectiveTipStandalone <= 0) return;
        setIsSubmittingTips(true);
        try {
            window.open(KEEPZ_PAY_URL, '_blank', 'noopener,noreferrer');
            fetch('/api/bot/v1/orders/tips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, tips: effectiveTipStandalone }),
            }).catch(() => {});
            setTipsSent(true);
            setTimeout(() => { setShowTipsModal(false); setTipsSent(false); }, 2200);
        } finally {
            setIsSubmittingTips(false);
        }
    };

    if (loading) return <FullPageLoader variant="order" />;

    if (isNetworkError) {
        return (
            <div className="order-status-page" style={{ display: 'flex', flexDirection: 'column' }}>
                <header className="os-header" style={{ position: 'relative' }}>
                    <div className="os-back-btn" onClick={onBack}><IconChevronLeft /></div>
                </header>
                <NetworkErrorState />
            </div>
        );
    }

    if (!order) return <div className="order-status-page" style={{ paddingTop: 100, textAlign: 'center' }}>{t('order.not_found')}</div>;

    const currentStatusLabel = STATUS_STEPS[activeStepIndex]?.label || order.status;

    const parseItems = (items: any): { name: string; price: number; quantity: number }[] => {
        if (!items) return [];
        if (Array.isArray(items)) return items;
        try { const p = JSON.parse(items); return Array.isArray(p) ? p : []; } catch { return []; }
    };

    const items = parseItems(order.items);
    const itemsTotal = items.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
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
                    <h3 className="od-section-label">{t('order.items_structure')}</h3>
                    <div className="od-items-card">
                        {items.map((item: any, i: number) => (
                            <div className="od-item-row" key={i}>
                                <span className="od-item-name">
                                    {pickI18nText(item.name, language)}
                                    <span className="od-item-qty"> {item.quantity}x</span>
                                </span>
                                <span className="od-item-price">{(item.price * item.quantity).toFixed(2)} &#8382;</span>
                            </div>
                        ))}
                        {deliveryFee > 0 && (
                            <div className="od-item-row fee-row">
                                <span className="od-item-name">{t('order.delivery')}</span>
                                <span className="od-item-price">{deliveryFee.toFixed(2)} &#8382;</span>
                            </div>
                        )}
                        {calculatedServiceFee > 0 && (
                            <div className="od-item-row fee-row">
                                <span className="od-item-name">{t('order.service_fee')}</span>
                                <span className="od-item-price">{calculatedServiceFee.toFixed(2)} &#8382;</span>
                            </div>
                        )}
                        <div className="od-cost-row total">
                            <span>{t('order.total')}</span>
                            <span className="od-cost-value">{displayTotal?.toFixed(2)} &#8382;</span>
                        </div>
                    </div>

                    <button type="button" className="od-details-btn" onClick={() => onViewDetails?.(order.id)}>
                        {t('order.detailed_info')}
                    </button>

                    {order.status === 'delivered' && (
                        <div className="os-rating-card">
                            {ratingSubmitted || order.rating ? (
                                <div className="os-rating-submitted-box">
                                    <div className="os-rating-submitted-header">
                                        <span className="os-rating-done-title">{t('rating.your_rating')}</span>
                                        <div className="os-rating-submitted-stars">
                                            {[1,2,3,4,5].map((star) => (
                                                <StarIcon key={star} filled={(order.rating || restRating) >= star} size={20} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="os-rating-done-desc">{t('rating.thanks_rating')}</span>
                                    {!tipsSent ? (
                                        <button type="button" className="os-post-tip-btn" onClick={() => setShowTipsModal(true)}>
                                            <Coins size={16} strokeWidth={2.2} />
                                            <span>{t('rating.leave_tip')}</span>
                                        </button>
                                    ) : (
                                        <span className="os-tips-sent-label">
                                            <Check size={14} /> {t('rating.tips_sent')}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="os-rate-trigger-btn"
                                    onClick={() => { setRatingStep('restaurant'); setShowRatingModal(true); }}
                                >
                                    <StarIcon filled={true} size={20} />
                                    <span>{t('rating.rate_order')}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════ DUAL-STEP PREMIUM RATING MODAL ═══════ */}
            {showRatingModal && createPortal(
                <div
                    className="y-rate-overlay"
                    onClick={() => { if (ratingStep !== 'success') closeAndResetModal(); }}
                >
                    <div className="y-rate-sheet" onClick={e => e.stopPropagation()}>
                        <div className="y-rate-drag-handle" />

                        {/* Header */}
                        <div className="y-rate-header">
                            <div className="y-rate-badge">
                                <span>
                                    {ratingStep === 'restaurant' && '\u{1F37D}\uFE0F'}
                                    {ratingStep === 'courier' && '\u{1F6F5}'}
                                    {ratingStep === 'success' && '\u2705'}
                                </span>
                                <span className="y-rate-badge-rest">
                                    {ratingStep === 'restaurant' && t('rating.rate_restaurant')}
                                    {ratingStep === 'courier' && t('rating.how_was_delivery')}
                                    {ratingStep === 'success' && t('rating.thanks_short')}
                                </span>
                            </div>
                            {ratingStep !== 'success' && (
                                <button type="button" className="y-rate-close-btn" onClick={closeAndResetModal}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Step progress dots */}
                        {ratingStep !== 'success' && (
                            <div className="y-rate-stepper">
                                <div className={`y-rate-step-indicator ${ratingStep === 'restaurant' ? 'active' : 'completed'}`}>
                                    {ratingStep === 'courier' ? <Check size={13} /> : <span>1</span>}
                                    <span>{t('rating.step_restaurant')}</span>
                                </div>
                                <div className="y-rate-step-dot" />
                                <div className={`y-rate-step-indicator ${ratingStep === 'courier' ? 'active' : ''}`}>
                                    <span>2</span>
                                    <span>{t('rating.step_courier')}</span>
                                </div>
                            </div>
                        )}

                        {/* ── Step 1: Restaurant ── */}
                        {ratingStep === 'restaurant' && (
                            <div className="y-rate-step-body">
                                <div className="y-rate-entity-icon y-rate-entity-icon--rest">
                                    <span style={{ fontSize: 28 }}>&#127869;&#65039;</span>
                                </div>
                                <h2 className="y-rate-title">{t('rating.rate_restaurant')}</h2>
                                <p className="y-rate-subtitle">
                                    {order.restaurant_name ? t('rating.dishes_question_from').replace('{name}', order.restaurant_name) : t('rating.dishes_question')}
                                </p>

                                <div className="y-rate-stars-wrapper">
                                    <div className="y-rate-stars">
                                        {[1,2,3,4,5].map(star => (
                                            <button key={star} type="button" className="y-star-btn"
                                                onClick={() => setRestRating(star)}
                                                onMouseEnter={() => setRestHover(star)}
                                                onMouseLeave={() => setRestHover(0)}
                                            >
                                                <StarIcon filled={(restHover || restRating) >= star} size={44} />
                                            </button>
                                        ))}
                                    </div>
                                    {(restHover || restRating) > 0 && (
                                        <span className="y-rate-rating-caption">
                                            {t(`rating.caption_${restHover || restRating}`)}
                                        </span>
                                    )}
                                </div>

                                {restRating > 0 && (
                                    <div className="y-rate-tags-block">
                                        <div className="y-rate-tags-grid">
                                            {(restRating >= 4 ? REST_TAGS_POSITIVE : REST_TAGS_NEGATIVE).map(tag => {
                                                const IconComp = tag.icon;
                                                const used = isTagUsed(t(`rating.tag_${tag.id}`), restComment);
                                                return (
                                                    <button key={tag.id} type="button"
                                                        className={`y-rate-chip ${used ? 'used' : ''}`}
                                                        onClick={() => !used && appendTag(t(`rating.tag_${tag.id}`), setRestComment)}
                                                        disabled={used}
                                                    >
                                                        <IconComp size={13} strokeWidth={2.2} />
                                                        <span>{t(`rating.tag_${tag.id}`)}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="y-rate-input-wrap">
                                            <textarea className="y-rate-textarea" rows={2}
                                                placeholder={t('rating.dishes_placeholder')}
                                                value={restComment}
                                                onChange={e => setRestComment(e.target.value)}
                                                maxLength={400}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="y-rate-actions" style={{ marginTop: restRating > 0 ? 0 : 24 }}>
                                    <button type="button" className="y-rate-skip-btn" onClick={closeAndResetModal}>
                                        {t('rating.not_now')}
                                    </button>
                                    <button type="button"
                                        className={`y-rate-primary-btn ${restRating > 0 ? 'active' : ''}`}
                                        disabled={restRating === 0}
                                        onClick={() => setRatingStep('courier')}
                                    >
                                        {t('rating.next')} &#8594;
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Courier ── */}
                        {ratingStep === 'courier' && (
                            <div className="y-rate-step-body">
                                <div className="y-rate-entity-icon y-rate-entity-icon--courier">
                                    <span style={{ fontSize: 28 }}>&#128693;</span>
                                </div>
                                <h2 className="y-rate-title">{t('rating.how_was_delivery')}</h2>
                                <p className="y-rate-subtitle">{t('rating.courier_subtitle')}</p>

                                <div className="y-rate-stars-wrapper">
                                    <div className="y-rate-stars">
                                        {[1,2,3,4,5].map(star => (
                                            <button key={star} type="button" className="y-star-btn"
                                                onClick={() => setCourierRating(star)}
                                                onMouseEnter={() => setCourierHover(star)}
                                                onMouseLeave={() => setCourierHover(0)}
                                            >
                                                <StarIcon filled={(courierHover || courierRating) >= star} size={44} />
                                            </button>
                                        ))}
                                    </div>
                                    {(courierHover || courierRating) > 0 && (
                                        <span className="y-rate-rating-caption">
                                            {t(`rating.caption_${courierHover || courierRating}`)}
                                        </span>
                                    )}
                                </div>

                                {courierRating > 0 && (
                                    <div className="y-rate-tags-block">
                                        <div className="y-rate-tags-grid">
                                            {(courierRating >= 4 ? COURIER_TAGS_POSITIVE : COURIER_TAGS_NEGATIVE).map(tag => {
                                                const IconComp = tag.icon;
                                                const used = isTagUsed(t(`rating.tag_${tag.id}`), courierComment);
                                                return (
                                                    <button key={tag.id} type="button"
                                                        className={`y-rate-chip ${used ? 'used' : ''}`}
                                                        onClick={() => !used && appendTag(t(`rating.tag_${tag.id}`), setCourierComment)}
                                                        disabled={used}
                                                    >
                                                        <IconComp size={13} strokeWidth={2.2} />
                                                        <span>{t(`rating.tag_${tag.id}`)}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="y-rate-input-wrap">
                                            <textarea className="y-rate-textarea" rows={2}
                                                placeholder={t('rating.courier_placeholder')}
                                                value={courierComment}
                                                onChange={e => setCourierComment(e.target.value)}
                                                maxLength={400}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Tips inside courier step */}
                                <div className="y-rate-tips-section">
                                    <div className="y-rate-tips-header">
                                        <HeartHandshake size={15} color="#21EA7C" />
                                        <span>{t('rating.tips_title')}</span>
                                        <span className="y-rate-tips-caption">{t('rating.tips_caption')}</span>
                                    </div>
                                    <div className="y-rate-tips-grid">
                                        {TIP_PRESETS.map(preset => (
                                            <button key={preset} type="button"
                                                className={`y-rate-tip-chip ${!isCustomTipActive && selectedTip === preset ? 'active' : ''}`}
                                                onClick={() => { setIsCustomTipActive(false); setSelectedTip(preset); }}
                                            >
                                                {preset} &#8382;
                                            </button>
                                        ))}
                                        <button type="button"
                                            className={`y-rate-tip-chip ${isCustomTipActive ? 'active' : ''}`}
                                            onClick={() => { setIsCustomTipActive(true); setSelectedTip(0); }}
                                        >
                                            {t('rating.tip_custom')}
                                        </button>
                                    </div>
                                    {isCustomTipActive && (
                                        <div className="y-rate-custom-tip-wrap">
                                            <input type="number" step="0.5" min="1" max="50"
                                                placeholder={t('rating.tip_amount')}
                                                className="y-rate-custom-tip-input"
                                                value={customTip}
                                                onChange={e => setCustomTip(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="y-rate-actions" style={{ marginTop: 16 }}>
                                    <button type="button" className="y-rate-skip-btn y-rate-back-btn"
                                        onClick={() => setRatingStep('restaurant')}
                                    >
                                        &#8592; {t('rating.back')}
                                    </button>
                                    <button type="button"
                                        className={`y-rate-primary-btn ${courierRating > 0 ? 'active' : ''}`}
                                        disabled={courierRating === 0 || isSubmitting}
                                        onClick={handleSubmitRating}
                                    >
                                        {isSubmitting
                                            ? t('rating.sending')
                                            : effectiveTipModal > 0
                                                ? t('rating.send_with_tip').replace('{sum}', formatPrice(effectiveTipModal))
                                                : t('rating.send_review')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── Success ── */}
                        {ratingStep === 'success' && (
                            <div className="y-rate-success-body">
                                <div className="y-rate-success-icon-wrap">
                                    <div className="y-rate-success-glow" />
                                    <Check size={36} color="#21EA7C" strokeWidth={3} />
                                </div>
                                <h2 className="rate-success-title">{t('rating.thanks_title')}</h2>
                                <div className="rate-success-desc">
                                    <span className="rate-success-line">{t('rating.thanks_line')}</span>
                                    {effectiveTipModal > 0 ? (
                                        <span className="rate-success-line">{t('rating.thanks_tip')}</span>
                                    ) : (
                                        <span className="rate-success-line">{t('rating.thanks_feedback')}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* ═══════ STANDALONE TIPS MODAL ═══════ */}
            {showTipsModal && createPortal(
                <div className="y-rate-overlay" onClick={() => setShowTipsModal(false)}>
                    <div className="y-rate-sheet" onClick={e => e.stopPropagation()}>
                        <div className="y-rate-drag-handle" />
                        <div className="y-rate-header">
                            <div className="y-rate-badge">
                                <span>{t('rating.tips_order').replace('{id}', String(order.id))}</span>
                            </div>
                            <button type="button" className="y-rate-close-btn" onClick={() => setShowTipsModal(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        {!tipsSent ? (
                            <div className="y-rate-step-body">
                                <div className="y-rate-tip-icon-big">
                                    <HeartHandshake size={32} color="#21EA7C" />
                                </div>
                                <h2 className="y-rate-title" style={{ marginBottom: '8px' }}>{t('rating.thank_courier')}</h2>
                                <p className="y-rate-tip-subtitle">{t('rating.tips_direct')}</p>
                                <div className="y-rate-tips-grid" style={{ marginTop: '16px', marginBottom: '16px' }}>
                                    {TIP_PRESETS.map(preset => (
                                        <button key={preset} type="button"
                                            className={`y-rate-tip-chip ${!isCustomTipActive && selectedTip === preset ? 'active' : ''}`}
                                            onClick={() => { setIsCustomTipActive(false); setSelectedTip(preset); }}
                                        >
                                            {preset} &#8382;
                                        </button>
                                    ))}
                                    <button type="button"
                                        className={`y-rate-tip-chip ${isCustomTipActive ? 'active' : ''}`}
                                        onClick={() => { setIsCustomTipActive(true); setSelectedTip(0); }}
                                    >
                                        {t('rating.tip_custom_long')}
                                    </button>
                                </div>
                                {isCustomTipActive && (
                                    <div className="y-rate-custom-tip-wrap" style={{ marginBottom: '16px' }}>
                                        <input type="number" step="0.5" min="1" max="50"
                                            placeholder={t('rating.enter_amount')}
                                            className="y-rate-custom-tip-input"
                                            value={customTip}
                                            onChange={e => setCustomTip(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                )}
                                <div className="y-rate-actions">
                                    <button type="button"
                                        className={`y-rate-primary-btn ${effectiveTipStandalone > 0 ? 'active' : ''}`}
                                        onClick={handleDirectTipsPay}
                                        disabled={effectiveTipStandalone <= 0 || isSubmittingTips}
                                    >
                                        {isSubmittingTips
                                            ? t('rating.sending')
                                            : effectiveTipStandalone > 0
                                                ? `${t('rating.pay')} ${formatPrice(effectiveTipStandalone)}`
                                                : t('rating.pay')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="y-rate-success-body">
                                <div className="y-rate-success-icon-wrap">
                                    <div className="y-rate-success-glow" />
                                    <Check size={36} color="#21EA7C" strokeWidth={3} />
                                </div>
                                <h2 className="rate-success-title">{t('rating.tips_sent')}</h2>
                                <p className="rate-success-desc">{t('rating.tips_sent_desc')}</p>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default OrderStatus;
