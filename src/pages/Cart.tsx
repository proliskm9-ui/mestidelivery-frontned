import React, { useState, useEffect } from 'react';
import { api, Product } from '../services/api';
import './Cart.css';
import { useLanguage } from '../translations/LanguageContext';

// SVG Icons
const IconTrash = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const IconBack = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const IconCutlery = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 21l-4.35-4.35M9 3v10c0 1.1.9 2 2 2h0c1.1 0 2-.9 2-2V3m-4 0v18m14-18v18" />
    </svg>
);

const IconComment = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

interface CartPageProps {
    onBack: () => void;
    initialCartItems?: { product: Product, quantity: number }[];
    onClearCart?: () => void;
    onUpdateQuantity?: (productId: string, delta: number) => void;
    onAddToCart?: (product: Product) => void;
    onCheckout?: (data: { comment: string, cutlery: number }) => void;
}

const CartPage: React.FC<CartPageProps> = ({ onBack, initialCartItems = [], onClearCart, onUpdateQuantity, onAddToCart, onCheckout }) => {
    const { t } = useLanguage();

    // Local state for cutlery and comment
    const [comment, setComment] = useState('');
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [cutleryCount, setCutleryCount] = useState(1);

    // Recommendations State
    const [recommendations, setRecommendations] = useState<Product[]>([]);

    // Calculate totals
    const subtotal = initialCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const deliveryFee = 5.00; // Fixed for now
    const total = subtotal + deliveryFee;
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

    const handleClearCart = () => {
        if (window.confirm(t('cart.clear_confirm'))) {
            onClearCart && onClearCart();
        }
    }

    const handleCheckoutClick = () => {
        if (onCheckout) {
            onCheckout({ comment, cutlery: cutleryCount });
        }
    };

    if (initialCartItems.length === 0) {
        return (
            <div className="page-transition-wrapper">
                <div style={{ color: 'white', padding: '40px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: '#000000' }}>
                    <button
                        onClick={onBack}
                        style={{
                            position: 'absolute',
                            top: 'max(24px, env(safe-area-inset-top))',
                            left: '20px',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backdropFilter: 'blur(15px)',
                            WebkitBackdropFilter: 'blur(15px)',
                            zIndex: 10
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    <img src="/Assets/корзина.png" alt="Empty" style={{ width: '280px', height: '195px', marginBottom: '24px', objectFit: 'contain' }} />

                    <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', lineHeight: '22px', color: '#FFFFFF', margin: '0 0 8px 0', opacity: 1, textTransform: 'none', letterSpacing: 'normal' }}>
                        Похоже, тут ничего нет.
                    </h2>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#B5B5B5', margin: '0 0 0 0', opacity: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ whiteSpace: 'nowrap' }}>У нас большой выбор ресторанов и магазинов,</span>
                        <span style={{ whiteSpace: 'nowrap' }}>выбирайте и заказывайте из понравившихся.</span>
                    </div>

                    <button
                        onClick={onBack}
                        style={{
                            position: 'fixed',
                            bottom: 'calc(24px + env(safe-area-inset-bottom))',
                            left: '0',
                            right: '0',
                            margin: '0 auto',
                            width: '361px',
                            maxWidth: 'calc(100vw - 32px)',
                            height: '56px',
                            background: '#21EA7C',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '16px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            fontSize: '17px',
                            lineHeight: '10px',
                            letterSpacing: '-0.2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            zIndex: 100
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        Перейти к ресторанам
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-transition-wrapper">
            <div className="cart-page-container">

                {/* Desktop Layout Header */}
                <header className="cart-main-header">
                    <div className="header-left">
                        <button className="back-circle-btn" onClick={onBack}>
                            <IconBack />
                        </button>
                        <h1>{t('cart.title')}</h1>
                    </div>

                    <div className="header-right">
                        <button className="clear-liquid-btn" onClick={handleClearCart}>
                            <IconTrash />
                            <span>{t('cart.clear')}</span>
                        </button>
                    </div>
                </header>

                <div className="cart-main-content">
                    {/* ITEMS SECTION */}
                    <div className="items-column">
                        <div className="items-scroll-pane">
                            {initialCartItems.map(({ product, quantity }) => (
                                <div key={product.id} className="cart-premium-item">
                                    <div className="item-image-container">
                                        <img src={product.img || '/Assets/default-food.png'} alt={product.name} />
                                    </div>

                                    <div className="item-details">
                                        <div className="item-main-info">
                                            <h3>{product.name}</h3>
                                            <p>{product.weight || '350г'}</p>
                                        </div>
                                        <div className="item-pricing">
                                            {(product.price * quantity).toFixed(2)} ₾
                                        </div>
                                    </div>

                                    <div className="item-actions">
                                        <div className="premium-qty-selector">
                                            <button onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, -1)}>−</button>
                                            <span>{quantity}</span>
                                            <button onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, 1)}>+</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>



                        {/* Redesigned Sleek Extras */}
                        <div className="cart-extras-section">
                            <h3 className="extras-title">{t('cart.extras') || 'Дополнения'}</h3>

                            <div className="sleek-extra-row">
                                <div className="sleek-extra-left">
                                    <IconCutlery />
                                    <span>{t('cart.cutlery') || 'Приборы'}</span>
                                </div>
                                <div className="sleek-qty-selector">
                                    <button onClick={() => setCutleryCount(curr => Math.max(0, curr - 1))}>−</button>
                                    <span>{cutleryCount}</span>
                                    <button onClick={() => setCutleryCount(curr => curr + 1)}>+</button>
                                </div>
                            </div>

                            <div className={`sleek-comment-container ${isCommentOpen ? 'open' : ''}`}>
                                <div className="sleek-extra-row comment-toggle" onClick={() => setIsCommentOpen(!isCommentOpen)}>
                                    <div className="sleek-extra-left">
                                        <IconComment />
                                        <span>{t('cart.comment') || 'Комментарий к заказу'}</span>
                                    </div>
                                    <span className="arrow-indicator">{isCommentOpen ? '▲' : '▼'}</span>
                                </div>
                                {isCommentOpen && (
                                    <textarea
                                        className="sleek-textarea"
                                        placeholder={t('cart.comment_placeholder')}
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        autoFocus
                                    />
                                )}
                            </div>
                        </div>

                        {/* Recommendations Section */}
                        {recommendations.length > 0 && (
                            <div className="cart-recommendations-section">
                                <h3 className="extras-title">{t('cart.recommendations') || 'Рекомендуем к заказу'}</h3>
                                <div className="recommendations-scroll">
                                    {recommendations.map(prod => (
                                        <div key={prod.id} className="rec-card">
                                            <div className="rec-img-wrapper">
                                                <img src={prod.img || '/Assets/default-food.png'} alt={prod.name} />
                                            </div>
                                            <div className="rec-info">
                                                <div className="rec-name">{prod.name}</div>
                                                <div className="rec-price">{prod.price.toFixed(0)} ₾</div>
                                            </div>
                                            <button className="rec-add-btn" onClick={() => onAddToCart && onAddToCart(prod)}>
                                                + Добавить
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SUMMARY SECTION (Sticky) */}
                    <div className="summary-column">
                        <div className="premium-summary-card">
                            <div className="summary-header">
                                <h3>{t('cart.details')}</h3>
                            </div>

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
                                    <span>0.00 ₾</span>
                                </div>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="total-line">
                                <div className="total-label">{t('common.total')}</div>
                                <div className="total-value">{total.toFixed(2)} ₾</div>
                            </div>

                            <button className="confirm-order-btn" onClick={handleCheckoutClick}>
                                {t('cart.checkout')}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>

                            <div className="summary-badges">
                                <div className="badge">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                    {t('cart.safe_payment')}
                                </div>
                                <div className="badge">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                    {t('cart.time')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MOBILE FIXED BOTTOM BAR (Visible only on mobile) */}
                <div className="mobile-checkout-bar">
                    <button className="mobile-confirm-btn" onClick={handleCheckoutClick}>
                        {t('cart.checkout')} - {total.toFixed(2)} ₾
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
