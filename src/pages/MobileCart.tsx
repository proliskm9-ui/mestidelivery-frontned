import React, { useState, useEffect } from 'react';
import { api, Product, Restaurant } from '../services/api';
import './MobileCart.css';
import { useLanguage } from '../translations/LanguageContext';
import GlassBottomPanel from '../components/UI/GlassBottomPanel';

const IconBack = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
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
}

const MobileCart: React.FC<MobileCartProps> = ({ onBack, initialCartItems = [], onClearCart, onUpdateQuantity, onAddToCart, onCheckout }) => {
    const { t } = useLanguage();

    const [comment, setComment] = useState('');
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [cutleryCount, setCutleryCount] = useState(1);
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

    const totalItems = initialCartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = initialCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;

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
                const recs = allProducts.filter(p => !cartIds.includes(p.id)).slice(0, 12);
                setRecommendations(recs);
            } catch (err) {
                console.error("Cannot load recommendations:", err);
            }
        };
        loadProducts();
    }, [initialCartItems]);

    const handleClearCart = () => {
        if (window.confirm(t('cart.clear_confirm') || 'Очистить корзину?')) {
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
            <div style={{ color: 'white', padding: '40px 40px 80px 40px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'var(--bg)', paddingTop: '80px' }}>
                <button
                    onClick={onBack}
                    style={{
                        position: 'absolute',
                        top: 'calc(24px + env(safe-area-inset-top, 0px))',
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
                        bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
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
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0px 4px 12px rgba(33, 234, 124, 0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                    Перейти к ресторанам
                </button>
            </div>
        );
    }

    return (
        <div className="mobile-cart-container">
            <header className="mobile-cart-header sticky-header">
                <button className="mc-back-btn" onClick={onBack}>
                    <IconBack />
                </button>
                <div className="mc-header-center">
                    <h1>{restaurant ? restaurant.name : 'КОРЗИНА'}</h1>
                    <div className="mc-header-subtitle">
                        {subtotal.toFixed(0)} GEL · {restaurant?.delivery || ''}
                    </div>
                </div>
                <button className="mc-clear-btn" onClick={handleClearCart}>
                    <IconTrash />
                </button>
            </header>

            <div className="mc-items-list">
                {initialCartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="mc-item-card">
                        <div className="mc-item-img">
                            <img src={product.img || '/Assets/default-food.png'} alt={product.name} />
                        </div>
                        <div className="mc-item-info">
                            <div className="mc-item-name">{product.name}</div>
                            <div className="mc-item-meta-row">
                                <span className="mc-item-price">{(product.price).toFixed(2)} GEL</span>
                                <span className="mc-item-sep">·</span>
                                <span className="mc-item-weight">{product.weight ? product.weight + 'г.' : ''}</span>
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
                                <span className="mc-extra-label">Добавить</span>
                                <span className="mc-extra-label">комментарий</span>
                            </div>
                        </div>
                        <IconChevron />
                    </div>
                </div>

                {isCommentOpen && (
                    <div className="mc-comment-box-floating">
                        <textarea
                            placeholder="Добавить комментарий к заказу..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {recommendations.length > 0 && (
                <div className="mc-recs-section">
                    <h3 className="mc-section-title">Что-то еще?</h3>
                    <div className="mc-recs-grid">
                        {recommendations.map(prod => (
                            <div key={prod.id} className="mc-rec-card">
                                <div className="mc-rec-img-container">
                                    <img src={prod.img || '/Assets/default-food.png'} alt={prod.name} className="mc-rec-img" />
                                    <button className="mc-rec-add-btn-round" onClick={() => onAddToCart && onAddToCart(prod)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div className="mc-rec-price-green">{prod.price.toFixed(2)} GEL</div>
                                <div className="mc-rec-name-white">{prod.name}</div>
                                <div className="mc-rec-meta">200 г. · 430 ккал</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <GlassBottomPanel
                totalItems={totalItems}
                totalPrice={total}
                deliveryTime={restaurant?.delivery || '30 мин'}
                onNext={handleCheckoutClick}
                buttonText="Оформить"
                showPriceInButton={false}
            />
        </div>
    );
};

export default MobileCart;
