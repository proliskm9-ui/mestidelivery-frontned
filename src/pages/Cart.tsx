import React, { useState, useEffect } from 'react';
import { api, Product } from '../services/api';
import './Cart.css';
import { useLanguage } from '../translations/LanguageContext';
import { pickI18nText } from '../utils/i18nContent';
import { formatPortionWeight } from '../utils/formatProductMeta';
import Dialog, { DialogClose } from '../components/UI/Dialog';
import { formatPrice } from '../utils/formatPrice';

// SVG Icons
const IconTrash = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const IconBack = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

const IconCutlery = () => (
    <img src="/Assets/fork-and-spoon 1.png" alt="" width={22} height={22} style={{ objectFit: 'contain' }} />
);

const IconComment = () => (
    <img src="/Assets/speech-bubble 1.png" alt="" width={22} height={22} style={{ objectFit: 'contain' }} />
);

interface CartPageProps {
    onBack: () => void;
    initialCartItems?: { product: Product, quantity: number }[];
    onClearCart?: () => void;
    onUpdateQuantity?: (productId: string, delta: number) => void;
    onAddToCart?: (product: Product) => void;
    onCheckout?: (data: { comment: string, cutlery: number }) => void;
    deliveryFee?: number;
}

const CartPage: React.FC<CartPageProps> = ({ onBack, initialCartItems = [], onClearCart, onUpdateQuantity, onAddToCart, onCheckout, deliveryFee = 6.00 }) => {
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

    // Local state for cutlery and comment
    const [comment, setComment] = useState('');
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [cutleryCount, setCutleryCount] = useState(1);

    // Recommendations State
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [showMinOrderModal, setShowMinOrderModal] = useState(false);

    // Calculate totals
    const subtotal = initialCartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
    // deliveryFee is received from props
    
    let serviceFee = 0;
    if (subtotal > 0) {
        serviceFee = Math.max(0.99, Math.min(2.00, subtotal * 0.06));
    }

    const total = subtotal + deliveryFee + serviceFee;
    const totalItems = initialCartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Sync cutlery with items logic
    useEffect(() => {
        if (totalItems > 0) setCutleryCount(Math.max(1, totalItems));
    }, [totalItems]);

    // Fetch Recommendations based on current restaurant
    useEffect(() => {
        if (initialCartItems.length === 0) return;

        const restaurantId = initialCartItems[0].product.restaurant_id;
        if (!restaurantId) return;

        const loadProducts = async () => {
            try {
                const allProducts = await api.getProducts(restaurantId);
                const cartIds = initialCartItems.map(i => i.product.id);
                // Filter out products already in cart, get top 6
                const recs = allProducts.filter(p => !cartIds.includes(p.id)).slice(0, 6);
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
            <div className="page-transition-wrapper">
                <div className="cart-page-container cart-page-empty">
                    <header className="empty-cart-header">
                        <button type="button" className="ui-circle-btn" onClick={onBack} aria-label={t('common.back')}>
                            <IconBack />
                        </button>
                        <h1>{t('cart.title')}</h1>
                        <div className="empty-cart-header-spacer" aria-hidden="true" />
                    </header>

                    <div className="empty-cart-view">
                        <div className="empty-cart-card">
                            <img className="empty-cart-illustration" src="/Assets/корзина.png" alt="" />
                            <h2>{t('cart.empty_subtitle')}</h2>
                            <p>
                                <span>{t('cart.empty_desc_1')}</span>
                                <br />
                                <span>{t('cart.empty_desc_2')}</span>
                            </p>
                            <button type="button" className="empty-cart-cta" onClick={onBack}>
                                {t('cart.go_to_restaurants')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-transition-wrapper">
            <div className="cart-page-container">

                <header className="cart-main-header">
                    <button type="button" className="ui-circle-btn" onClick={onBack} aria-label={t('common.back')}>
                        <IconBack />
                    </button>
                    <h1>{t('cart.title')}</h1>
                    <button type="button" className="clear-cart-btn" onClick={handleClearCart} aria-label={t('cart.clear')}>
                        <IconTrash />
                    </button>
                </header>

                <div className="cart-main-content">
                    <div className="items-column">
                        <div className="cart-glass-block">
                            {initialCartItems.map(({ product, quantity }, index) => (
                                <div
                                    key={product.id}
                                    className={`cart-premium-item${index < initialCartItems.length - 1 ? ' cart-premium-item--divided' : ''}`}
                                >
                                    <div className="item-image-container">
                                        <img src={product.img || '/Assets/default-food.png'} alt={locName(product.name)} />
                                    </div>

                                    <div className="item-details">
                                        <div className="item-main-info">
                                            <h3>{locName(product.name)}</h3>
                                            <div className="item-meta-row">
                                                <span className="item-pricing">
                                                    {(Number(product.price) * quantity).toFixed(2)} ₾
                                                </span>
                                                <span className="item-sep">·</span>
                                                <span className="item-weight">
                                                    {formatWeight(product.weight) || `350 ${portionLabels.grams}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="item-actions">
                                        <div className="qty-control">
                                            <button type="button" onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, -1)}>−</button>
                                            <span>{quantity}</span>
                                            <button type="button" onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, 1)}>+</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-extras-section">
                            <h3 className="extras-title">{t('cart.extras')}</h3>

                            <div className="cart-extras-row">
                                <div className="extra-card">
                                    <div className="extra-info">
                                        <IconCutlery />
                                        <span className="extra-label">{t('cart.cutlery')}</span>
                                    </div>
                                    <div className="qty-control">
                                        <button type="button" onClick={() => setCutleryCount(curr => Math.max(0, curr - 1))}>−</button>
                                        <span>{cutleryCount}</span>
                                        <button type="button" onClick={() => setCutleryCount(curr => curr + 1)}>+</button>
                                    </div>
                                </div>

                                <div className="comment-card">
                                    <div className="comment-header" onClick={() => setIsCommentOpen(!isCommentOpen)}>
                                        <div>
                                            <IconComment />
                                            <span>{t('cart.comment')}</span>
                                        </div>
                                        <span className="arrow-indicator">{isCommentOpen ? '▲' : '▼'}</span>
                                    </div>
                                    {isCommentOpen && (
                                        <textarea
                                            className="premium-textarea"
                                            placeholder={t('cart.comment_placeholder')}
                                            value={comment}
                                            onChange={e => setComment(e.target.value)}
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {recommendations.length > 0 && (
                            <div className="cart-recommendations-section">
                                <h3 className="extras-title">{t('cart.recs_title')}</h3>
                                <div className="recommendations-scroll">
                                    {recommendations.map(prod => (
                                        <div key={prod.id} className="rec-card">
                                            <div className="rec-img-wrapper">
                                                <img src={prod.img || '/Assets/default-food.png'} alt={locName(prod.name)} />
                                            </div>
                                            <div className="rec-info">
                                                <div className="rec-name">{locName(prod.name)}</div>
                                                <div className="rec-price">{formatPrice(prod.price)}</div>
                                            </div>
                                            <button type="button" className="rec-add-btn" onClick={() => onAddToCart && onAddToCart(prod)}>
                                                {t('cart.add_btn')}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="summary-column">
                        <div className="premium-summary-card">
                            <h2>{t('cart.details')}</h2>

                            <div className="summary-details">
                                <div className="summary-line">
                                    <span>{t('cart.items')} ({totalItems})</span>
                                    <span>{subtotal.toFixed(2)} ₾</span>
                                </div>
                                <div className="summary-line">
                                    <span>{t('cart.delivery')}</span>
                                    <span>{deliveryFee.toFixed(2)} ₾</span>
                                </div>
                                <div className="summary-line service">
                                    <span>{t('cart.service')}</span>
                                    <span>{serviceFee.toFixed(2)} ₾</span>
                                </div>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="total-line">
                                <div className="total-label">{t('common.total')}</div>
                                <div className="total-value">{total.toFixed(2)} ₾</div>
                            </div>

                            <button type="button" className="confirm-order-btn" onClick={handleCheckoutClick}>
                                {t('cart.checkout')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mobile-checkout-bar">
                    <div className="mobile-total-info">
                        <span>{t('common.total')}</span>
                        <span>{total.toFixed(2)} ₾</span>
                    </div>
                    <button type="button" className="mobile-confirm-btn" onClick={handleCheckoutClick}>
                        {t('cart.checkout')}
                    </button>
                </div>
            </div>

            <Dialog
                open={showMinOrderModal}
                onOpenChange={setShowMinOrderModal}
                title={t('checkout.min_order_title')}
                description={t('checkout.min_order_desc').split('{diff}').map((part, index, arr) => (
                    <React.Fragment key={index}>
                        {part}
                        {index < arr.length - 1 && <strong style={{ color: 'var(--color-accent)' }}>{formatPrice(50 - subtotal)}</strong>}
                    </React.Fragment>
                ))}
                actions={
                    <>
                        <button type="button" className="ds-btn ds-btn--primary" onClick={() => { setShowMinOrderModal(false); onBack(); }}>
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

export default CartPage;
