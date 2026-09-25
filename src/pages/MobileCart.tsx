import React, { useState, useEffect } from 'react';
import { useDeliveryEta } from '../hooks/useDeliveryEta';
import { api, Product, Restaurant } from '../services/api';
import './MobileCart.css';
import { useLanguage } from '../translations/LanguageContext';
import { pickI18nText } from '../utils/i18nContent';
import { formatPortionCalories, formatPortionWeight, isVisibleMenuProduct } from '../utils/formatProductMeta';
import { isModifierProduct } from '../utils/modifiers';
import GlassBottomPanel from '../components/UI/GlassBottomPanel';
import Dialog, { DialogClose } from '../components/UI/Dialog';
import AnimatedPrice from '../components/UI/AnimatedPrice';
import { formatPrice } from '../utils/formatPrice';

const IconBack = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const IconTrash = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </svg>
);

const IconCutlery = () => (
    <img src="/Assets/fork-and-spoon 1.png" alt="Cutlery" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
);

const IconComment = () => (
    <img src="/Assets/speech-bubble 1.png" alt="Comment" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
);

const IconChevron = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

interface MobileCartProps {
    onBack: () => void;
    initialCartItems?: { product: Product, quantity: number }[];
    onClearCart?: () => void;
    onUpdateQuantity?: (productId: string, delta: number) => void;
    onAddToCart?: (product: Product) => void;
    onCheckout?: (data: { comment: string, cutlery: number }) => void;
    deliveryFee?: number;
}

const MobileCart: React.FC<MobileCartProps> = ({ onBack, initialCartItems = [], onClearCart, onUpdateQuantity, onAddToCart, onCheckout, deliveryFee = 6.00 }) => {
    const { t, language } = useLanguage();
    const locName = (raw?: string | null) => pickI18nText(raw, language);
    const portionLabels = {
        grams: String(t('restaurant.grams')),
        ml: String(t('restaurant.ml')),
        liter: String(t('restaurant.liter')),
        pcs: String(t('restaurant.pcs')),
        kcal: String(t('restaurant.kcal')),
    };
    const formatWeight = (w?: string | number | null) => formatPortionWeight(w, portionLabels);
    const formatCalories = (c?: string | number | null) => formatPortionCalories(c, portionLabels.kcal);

    const [comment, setComment] = useState('');
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [cutleryCount, setCutleryCount] = useState(1);
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const cartEta = useDeliveryEta(initialCartItems[0]?.product?.restaurant_id || null, null, null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [showMinOrderModal, setShowMinOrderModal] = useState(false);

    const totalItems = initialCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = initialCartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
    // deliveryFee is received from props
    
    let serviceFee = 0;
    if (subtotal > 0) {
        serviceFee = Math.max(0.99, Math.min(2.00, subtotal * 0.06));
    }
    const total = subtotal + deliveryFee + serviceFee;

    useEffect(() => {
        if (totalItems > 0) setCutleryCount(Math.max(1, totalItems));
    }, [totalItems]);

    useEffect(() => {
        if (initialCartItems.length === 0) return;
        const restaurantId = initialCartItems[0].product.restaurant_id;
        if (!restaurantId) return;

        const loadProducts = async () => {
            try {
                // Load restaurant data
                const rest = await api.getRestaurant(restaurantId);
                setRestaurant(rest);

                const allProducts = await api.getProducts(restaurantId);
                const cartIds = initialCartItems.map(i => i.product.id);
                // Only real menu dishes: no add-ons (sauces) and nothing without a photo
                const recs = allProducts.filter(p => !cartIds.includes(p.id) && isVisibleMenuProduct(p) && !isModifierProduct(p)).slice(0, 12);
                setRecommendations(recs);
            } catch (err) {
                console.error("Cannot load recommendations:", err);
            }
        };
        loadProducts();
    }, [initialCartItems]);

    const [confirmClearOpen, setConfirmClearOpen] = useState(false);
    const handleClearCart = () => setConfirmClearOpen(true);
    const confirmClear = () => {
        setConfirmClearOpen(false);
        onClearCart && onClearCart();
    };

    const handleCheckoutClick = () => {
        if (subtotal < 50) {
            setShowMinOrderModal(true);
            return;
        }
        if (onCheckout) {
            onCheckout({ comment, cutlery: cutleryCount });
        }
    };

    if (initialCartItems.length === 0) {
        return (
            <div style={{ color: 'white', padding: '40px 40px 80px 40px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'var(--bg)', paddingTop: '80px' }}>
<img src="/Assets/корзина.png" alt="Empty" style={{ width: '280px', height: '195px', marginBottom: '24px', objectFit: 'contain' }} />

                <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', lineHeight: '22px', color: '#FFFFFF', margin: '0 0 8px 0', opacity: 1, textTransform: 'none', letterSpacing: 'normal' }}>
                    {t('cart.empty_subtitle')}
                </h2>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#B5B5B5', margin: '0 0 0 0', opacity: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{t('cart.empty_desc_1')}</span>
                    <span style={{ whiteSpace: 'nowrap' }}>{t('cart.empty_desc_2')}</span>
                </div>

                <button
                    type="button"
                    className="mc-empty-cta"
                    onClick={onBack}
                    style={{
                        position: 'fixed',
                        bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
                        left: '0',
                        right: '0',
                        margin: '0 auto',
                        width: '361px',
                        maxWidth: 'calc(100vw - 32px)',
                        height: '56px',
                        background: '#21EA7C',
                        color: 'var(--btn-primary-text)',
                        border: 'none',
                        borderRadius: 'var(--control-radius)',
                        boxShadow: 'var(--btn-primary-shadow)',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 700,
                        fontSize: '17px',
                        letterSpacing: '-0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 100
                    }}
                >
                    {t('cart.go_to_restaurants')}
                </button>
            </div>
        );
    }

    return (
        <div className="mobile-cart-container cart-v2-layout">
            <div className="cart-block-top">
                <header className="mobile-cart-header sticky-header">
                    <button type="button" className="mc-back-btn" onClick={onBack} aria-label={t('common.back')}>
                        <IconBack />
                    </button>
                    <div className="mc-header-center">
                        <h1>{restaurant ? restaurant.name : t('cart.title')}</h1>
                        <div className="mc-header-subtitle">
                            <AnimatedPrice value={total} /> · {cartEta || restaurant?.delivery || ''}
                        </div>
                    </div>
                    <button className="mc-clear-btn" onClick={handleClearCart}>
                        <IconTrash />
                    </button>
                </header>

                <div className="mc-items-list">
                    {initialCartItems.map(({ product, quantity }) => isModifierProduct(product) ? (
                        // Add-on (sauce, bread): a compact line under the dishes, no photo
                        <div key={product.id} className="mc-item-card mc-item-addon">
                            <div className="mc-item-info">
                                <div className="mc-item-name">{locName(product.name)}</div>
                                <div className="mc-item-meta-row">
                                    <span className="mc-item-price">{formatPrice(product.price)}</span>
                                </div>
                            </div>
                            <div className="mc-qty-control-v2">
                                <button onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, -1)}>−</button>
                                <span className="mc-qty-val">{quantity}</span>
                                <button onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, 1)}>+</button>
                            </div>
                        </div>
                    ) : (
                        <div key={product.id} className="mc-item-card">
                            <div className="mc-item-img">
                                <img src={product.img || '/Assets/default-food.png'} alt={locName(product.name)} />
                            </div>
                            <div className="mc-item-info">
                                <div className="mc-item-name">{locName(product.name)}</div>
                                <div className="mc-item-meta-row">
                                    <span className="mc-item-price">{formatPrice(product.price)}</span>
                                    <span className="mc-item-sep">·</span>
                                    <span className="mc-item-weight">{formatWeight(product.weight) || ''}</span>
                                </div>
                            </div>
                            <div className="mc-qty-control-v2">
                                <button onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, -1)}>−</button>
                                <span className="mc-qty-val">{quantity}</span>
                                <button onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, 1)}>+</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mc-extras-container" style={{ marginTop: '16px' }}>
                    <div className="mc-extras-row">
                        <div className="mc-extra-pill-card cutlery">
                            <IconCutlery />
                            <div className="mc-qty-control-v2">
                                <button onClick={() => setCutleryCount(curr => Math.max(0, curr - 1))}>−</button>
                                <span className="mc-qty-val">{cutleryCount}</span>
                                <button onClick={() => setCutleryCount(curr => curr + 1)}>+</button>
                            </div>
                        </div>

                        <div className="mc-extra-pill-card comment" onClick={() => setIsCommentOpen(!isCommentOpen)}>
                            <div className="mc-comment-content">
                                <IconComment />
                                <div className="mc-comment-text-group">
                                    <span className="mc-extra-label">{t('cart.add_comment_line1')}</span>
                                    <span className="mc-extra-label">{t('cart.add_comment_line2')}</span>
                                </div>
                            </div>
                            <IconChevron />
                        </div>
                    </div>

                    {isCommentOpen && (
                        <div className="mc-comment-box-floating">
                            <textarea
                                placeholder={t('cart.comment_placeholder_mobile')}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            </div>

            {recommendations.length > 0 && (
                <div className="cart-block-bottom">
                    <div className="mc-recs-section">
                        <h3 className="mc-section-title">{t('cart.something_else')}</h3>
                        <div className="mc-recs-grid">
                            {recommendations.map(prod => (
                                <div key={prod.id} className="mc-rec-card">
                                    <div className="mc-rec-img-container">
                                        <img src={prod.img || '/Assets/default-food.png'} alt={locName(prod.name)} className="mc-rec-img" />
                                        <button className="mc-rec-add-btn-round" onClick={() => onAddToCart && onAddToCart(prod)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="mc-rec-price-green">{formatPrice(prod.price)}</div>
                                    <div className="mc-rec-name-white">{locName(prod.name)}</div>
                                    <div className="mc-rec-meta">{formatWeight(prod.weight) || `200 ${portionLabels.grams}`} · {formatCalories(prod.calories) || `430 ${portionLabels.kcal}`}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <GlassBottomPanel
                totalItems={totalItems}
                // Dishes only: the 100 ₾ free-delivery threshold is on the subtotal (as at checkout)
                totalPrice={subtotal}
                deliveryTime={cartEta || restaurant?.delivery || `30-35 ${t('checkout.min_short')}`}
                deliveryFee={deliveryFee}
                onNext={handleCheckoutClick}
                buttonText={t('cart.checkout_btn')}
                showPriceInButton={false}
            />

            <Dialog
                open={showMinOrderModal}
                onOpenChange={setShowMinOrderModal}
                title={t('checkout.min_order_title')}
                description={t('checkout.min_order_desc').split('{diff}').map((part, index, arr) => (
                    <React.Fragment key={index}>
                        {part}
                        {index < arr.length - 1 && <strong className="mc-accent">{formatPrice(50 - subtotal)}</strong>}
                    </React.Fragment>
                ))}
                actions={
                    <>
                    <button
                        type="button"
                        className="ds-btn ds-btn--primary"
                        onClick={() => { setShowMinOrderModal(false); onBack(); }}
                    >
                        {t('cart.go_to_restaurant')}
                    </button>
                        <DialogClose className="md-dialog-cancel">{t('common.cancel')}</DialogClose>
                    </>
                }
            />
            <Dialog
                open={confirmClearOpen}
                onOpenChange={setConfirmClearOpen}
                title={t('cart.clear_confirm')}
                description={t('cart.clear_confirm_desc')}
                actions={
                    <>
                        <button type="button" className="ds-btn ds-btn--danger" onClick={confirmClear}>
                            {t('cart.clear')}
                        </button>
                        <DialogClose className="md-dialog-cancel">{t('common.cancel')}</DialogClose>
                    </>
                }
            />
        </div>
    );
};

export default MobileCart;
