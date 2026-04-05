import React, { useState, useEffect, useRef } from 'react';
import { api, Product, Restaurant } from '../services/api';
import './Restaurant.css';
import './MobileRestaurant.css';

interface RestaurantPageProps {
    restaurantId: string | null;
    onBack: () => void;
    onAddToCart: (item: Product) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
    cart: { product: Product, quantity: number }[];
    onUpdateQuantity?: (pid: string, delta: number) => void;
    onClearCart?: () => void;
    onNavigateToCart?: () => void;
}

const RestaurantPage: React.FC<RestaurantPageProps> = ({ 
    restaurantId, 
    onBack, 
    onAddToCart, 
    isFavorite = false, 
    onToggleFavorite, 
    cart, 
    onUpdateQuantity, 
    onClearCart, 
    onNavigateToCart 
}) => {

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Scroll detection for compact header (same hysteresis as main page Header.tsx)
    useEffect(() => {
        if (!isMobile) return;
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    setIsScrolled((prev) => {
                        if (!prev && scrollY > 90) return true;
                        if (prev && scrollY < 10) return false;
                        return prev;
                    });
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isMobile]);

    // Fetch Data
    useEffect(() => {
        if (!restaurantId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const [restData, prodData] = await Promise.all([
                    api.getRestaurant(restaurantId),
                    api.getProducts(restaurantId)
                ]);

                // Get unique categories
                const cats = Array.from(new Set(prodData.map(p => p.category))).filter(Boolean);

                setRestaurant(restData);
                setProducts(prodData);
                setCategories(['Что нового', 'Выбор пользователей', 'Акции', ...cats]); // Used mainly for desktop
                setActiveCategory(cats[0] || 'All');
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [restaurantId]);

    // Local quantity helper mapped to global cart
    const getQuantity = (id: string) => {
        const item = cart.find(c => c.product.id === id);
        return item ? item.quantity : 0;
    };

    // ----- MOBILE HOOKS (must be called unconditionally, before any early returns) -----
    const mobileCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Group products by category (preserving order)
    const productsByCategory: Record<string, Product[]> = {};
    for (const cat of mobileCategories) {
        productsByCategory[cat] = products.filter(p => p.category === cat);
    }

    // Scroll-to-category handler
    const scrollToCategory = (cat: string) => {
        const el = sectionRefs.current[cat];
        if (el) {
            const offset = 130; // account for sticky compact header height
            const y = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setActiveCategory(cat);
    };

    // Scroll-spy: auto-highlight active category based on scroll position
    useEffect(() => {
        if (!isMobile || mobileCategories.length === 0) return;
        const observerOptions = {
            root: null,
            rootMargin: '-140px 0px -60% 0px',
            threshold: 0,
        };
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const cat = entry.target.getAttribute('data-category');
                    if (cat) setActiveCategory(cat);
                }
            }
        }, observerOptions);
        for (const cat of mobileCategories) {
            const el = sectionRefs.current[cat];
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, [isMobile, products]);

    if (loading) return <div style={{ color: 'white', padding: '100px', textAlign: 'center' }}>Loading Menu...</div>;
    if (!restaurant) return <div style={{ color: 'white', padding: '100px', textAlign: 'center' }}>Restaurant not found.</div>;

    // ----- DESKTOP RENDER -----
    if (!isMobile) {
        const renderSection = (title: string, items: Product[]) => {
            if (items.length === 0) return null;
            return (
                <div className="menu-section" key={title}>
                    <h2 className="ms-title">{title}</h2>
                    <div className="menu-grid">
                        {items.map(product => {
                            const count = getQuantity(product.id);
                            return (
                                <div key={product.id} className="dish-card-new" onClick={() => setSelectedProduct(product)}>
                                    <div className="dcn-image">
                                        <img src={product.img || '/Assets/default-food.png'} alt={product.name} />
                                    </div>
                                    <div className="dcn-price">{product.price.toFixed(0)} ₽</div>
                                    <div className="dcn-title">{product.name}</div>
                                    <button className="dcn-add-btn" onClick={(e) => {
                                        e.stopPropagation();
                                        onAddToCart(product);
                                    }}>
                                        {count > 0 ? `Добавлено (${count})` : 'Добавить'}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            );
        };

        return (
            <div className="restaurant-page-container">
                {/* Header removed according to user request */}

                <div className="rest-content-wrapper">
                    <button className="rest-back-arrow-fixed" onClick={onBack}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M15 18L9 12L15 6" />
                        </svg>
                    </button>

                    <div className="rest-main-column">
                        <div className="rest-info-card">
                            <div className="ric-header">
                                <h1 className="ric-title">{restaurant.name}</h1>
                                <button className="ric-fav-btn" onClick={() => onToggleFavorite && restaurantId && onToggleFavorite(restaurantId)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "white" : "none"} stroke="white" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </button>
                            </div>
                            <div className="ric-tags">
                                {restaurant.category || "Кофе, детское меню, блины, салаты, завтраки, десерты, пицца"}
                            </div>
                            <div className="ric-actions">
                                <button className="ric-btn ric-btn-primary">Заказать</button>
                                <button className="ric-btn ric-btn-secondary">Сходить</button>
                                <div className="ric-meta">
                                    <div className="ric-meta-item">
                                        <span style={{ color: '#FCD535' }}>★</span> {restaurant.rating}
                                    </div>
                                    <div className="ric-meta-item">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        20-25 мин
                                    </div>
                                    <div className="ric-meta-item info-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="menu-nav-sticky">
                            {categories.map(cat => (
                                <div key={cat} className={`mn-item ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                                    {cat}
                                </div>
                            ))}
                        </div>

                        {activeCategory === 'Выбор пользователей' || activeCategory === 'Что нового' || activeCategory === 'Акции' ? (
                            <div className="menu-section">
                                <h2 className="ms-title">{activeCategory}</h2>
                                <div className="menu-grid">
                                    {products.length > 0 ? products.map(product => {
                                        const count = getQuantity(product.id);
                                        return (
                                            <div key={product.id} className="dish-card-new" onClick={() => setSelectedProduct(product)}>
                                                <div className="dcn-image">
                                                    <img src={product.img || '/Assets/default-food.png'} alt={product.name} />
                                                </div>
                                                <div className="dcn-price">{product.price.toFixed(0)} ₽</div>
                                                <div className="dcn-title">{product.name}</div>
                                                <button className="dcn-add-btn" onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddToCart(product);
                                                }}>
                                                    {count > 0 ? `Добавлено (${count})` : 'Добавить'}
                                                </button>
                                            </div>
                                        )
                                    }) : <div className="no-items">В этой категории пока нет блюд</div>}
                                </div>
                            </div>
                        ) : (
                            renderSection(activeCategory, products.filter(p => p.category === activeCategory))
                        )}
                    </div>

                    <div className="rest-sidebar">
                        <div className="cart-widget">
                            <div className="cw-header-row">
                                <div className="cw-title">Корзина</div>
                                {cart.length > 0 && (
                                    <button className="cw-trash-btn" onClick={onClearCart}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {cart.length === 0 ? (
                                <div className="cw-empty">
                                    <svg className="cw-empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                    <span>В вашей корзине пока пусто</span>
                                </div>
                            ) : (
                                <div className="cw-items">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="cw-item">
                                            <img src={item.product.img} className="cw-item-img" alt={item.product.name} />
                                            <div className="cw-item-info">
                                                <div className="cw-item-name">{item.product.name}</div>
                                                <div className="cw-item-price-row">
                                                    <span className="cw-item-price-val">{item.product.price} ₽</span>
                                                </div>
                                            </div>
                                            <div className="cw-item-counter">
                                                <button className="cw-count-btn minus" onClick={() => onUpdateQuantity && onUpdateQuantity(item.product.id, -1)}>−</button>
                                                <span className="cw-count-val">{item.quantity}</span>
                                                <button className="cw-count-btn plus" onClick={() => onUpdateQuantity && onUpdateQuantity(item.product.id, 1)}>+</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="cw-checkout-btn" onClick={onNavigateToCart}>Верно, к оплате</button>
                                </div>
                            )}
                            <div className="cw-bottom-info">
                                <div className="cw-info-mini-badge">📦</div>
                                <div className="cw-info-text">
                                    <div>Самовывоз - 18 мин. Подробные условия</div>
                                    <div className="cw-info-sub">Российская Федерация, Санкт-Петербург...</div>
                                </div>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedProduct && (
                    <div className="dish-modal-overlay" onClick={() => setSelectedProduct(null)}>
                        <div className="dish-modal-content" onClick={e => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                            <div className="modal-top">
                                <img src={selectedProduct.img || '/Assets/default-food.png'} alt={selectedProduct.name} className="modal-hero-img" />
                            </div>
                            <div className="modal-body">
                                <div className="modal-header-row">
                                    <h2 className="modal-dish-name">{selectedProduct.name}</h2>
                                    <span className="modal-dish-price">{selectedProduct.price.toFixed(0)} ₽</span>
                                </div>
                                <p className="modal-description">{selectedProduct.description || 'Вкусное блюдо.'}</p>
                                <button className="modal-add-btn" onClick={() => {
                                    onAddToCart(selectedProduct);
                                    if (getQuantity(selectedProduct.id) === 0) {
                                        onUpdateQuantity && onUpdateQuantity(selectedProduct.id, 1);
                                    }
                                    setSelectedProduct(null);
                                }}>
                                    Добавить за {selectedProduct.price.toFixed(0)} ₽
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ----- MOBILE RENDER -----

    // Filter products when search is active
    const filteredProducts = mobileSearchQuery.trim()
        ? products.filter(p =>
            p.name.toLowerCase().includes(mobileSearchQuery.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(mobileSearchQuery.toLowerCase()))
        )
        : products;
    const filteredCategories = mobileSearchQuery.trim()
        ? Array.from(new Set(filteredProducts.map(p => p.category))).filter(Boolean)
        : mobileCategories;
    const filteredByCategory: Record<string, Product[]> = {};
    for (const cat of filteredCategories) {
        filteredByCategory[cat] = filteredProducts.filter(p => p.category === cat);
    }

    return (
        <div className="mobile-restaurant-page">
            {/* === Compact Sticky Header (appears on scroll) === */}
            <div className={`v2-compact-header ${isScrolled ? 'visible' : ''}`}>
                {/* Nav row OR Search bar */}
                {isSearchOpen ? (
                    <div className="v2-compact-nav v2-search-bar">
                        <button className="v2-nav-btn" onClick={() => { setIsSearchOpen(false); setMobileSearchQuery(''); }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                        </button>
                        <div className="v2-search-field">
                            <input
                                className="v2-search-input"
                                type="text"
                                placeholder={`Поиск в ${restaurant.name}`}
                                value={mobileSearchQuery}
                                onChange={(e) => setMobileSearchQuery(e.target.value)}
                                autoFocus={isScrolled}
                            />
                            {mobileSearchQuery && (
                                <button className="v2-search-clear" onClick={() => setMobileSearchQuery('')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="v2-compact-nav">
                        <button className="v2-nav-btn" onClick={onBack}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                        </button>
                        <div className="v2-compact-title-wrapper">
                            <h2 className="v2-compact-title">
                                {restaurant.name.toLowerCase().includes('sunset') ? 'Sunset' : (restaurant.name.length > 18 ? restaurant.name.substring(0, 16) + '...' : restaurant.name)}
                            </h2>
                        </div>
                        <div className="v2-compact-nav-right">
                            <button className="v2-nav-btn" onClick={() => setIsSearchOpen(true)}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                            <button className="v2-nav-btn" onClick={() => onToggleFavorite && restaurantId && onToggleFavorite(restaurantId)}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? "#21EA7C" : "none"} stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
                {/* Categories always stay visible */}
                <div className="v2-compact-categories">
                    {mobileCategories.map((cat) => (
                        <div
                            key={cat}
                            className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => scrollToCategory(cat)}
                        >
                            <span className="category-name">{cat}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* === Main Header (hides on scroll) === */}
            <div className="v2-header-block">
                {/* Nav row OR Search bar */}
                {isSearchOpen ? (
                    <div className="v2-nav-bar v2-search-bar">
                        <button className="v2-nav-btn" onClick={() => { setIsSearchOpen(false); setMobileSearchQuery(''); }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                        </button>
                        <div className="v2-search-field">
                            <input
                                className="v2-search-input"
                                type="text"
                                placeholder={`Поиск в ${restaurant.name}`}
                                value={mobileSearchQuery}
                                onChange={(e) => setMobileSearchQuery(e.target.value)}
                                autoFocus={!isScrolled}
                            />
                            {mobileSearchQuery && (
                                <button className="v2-search-clear" onClick={() => setMobileSearchQuery('')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="v2-nav-bar">
                        <button className="v2-nav-btn" onClick={onBack}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                        </button>
                        <div className="v2-nav-right">
                            <button className="v2-nav-btn" onClick={() => setIsSearchOpen(true)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </button>
                            <button className="v2-nav-btn" onClick={() => onToggleFavorite && restaurantId && onToggleFavorite(restaurantId)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "#21EA7C" : "none"} stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Restaurant info always stays visible */}
                <div className="v2-title-section">
                    <h1 className="v2-header-title">{restaurant.name}</h1>
                </div>

                <div className="v2-meta-row">
                    <div className="v2-meta-item">
                        <img
                            src="/Assets/звезда-removebg-preview 48.png"
                            alt="Rating"
                            style={{ width: '29px', height: '29px', objectFit: 'contain', opacity: 0.8 }}
                        />
                        <div className="v2-meta-text">
                            <span className="v2-meta-val" style={{ color: '#21EA7C' }}>{restaurant.rating}</span>
                            <span className="v2-meta-sub">919 оценок</span>
                        </div>
                    </div>
                    <div className="v2-meta-divider" />
                    <div className="v2-meta-item">
                        <img
                            src="/Assets/иконка_человек_2 пнг 32.png"
                            alt="Delivery"
                            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                        />
                        <div className="v2-meta-text">
                            <span className="v2-meta-val" style={{ color: '#21EA7C' }}>{restaurant.delivery || '20-30 мин'}</span>
                            <span className="v2-meta-sub">Доставка</span>
                        </div>
                    </div>
                    <div className="v2-meta-divider" />
                    <button className="v2-menu-btn" onClick={() => setIsInfoModalOpen(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* === Restaurant Info Bottom Sheet === */}
            {isInfoModalOpen && (
                <div className="v2-info-overlay" onClick={() => setIsInfoModalOpen(false)}>
                    <div className="v2-info-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="v2-sheet-handle" onClick={() => setIsInfoModalOpen(false)} />

                        <div className="v2-sheet-content">
                            <h2 className="v2-sheet-title">{restaurant.name}</h2>

                            <div className="v2-sheet-section">
                                <p className="v2-sheet-address">
                                    {restaurant.address || 'Грузия, Тбилиси, проспект Александра Казбеги, 25'}
                                </p>
                            </div>

                            <div className="v2-sheet-section">
                                <p className="v2-sheet-tags">
                                    {restaurant.category || 'Грузинская кухня • Горячие блюда • Выпечка'} • $$$
                                </p>
                            </div>

                            <div className="v2-sheet-divider" />

                            <div className="v2-sheet-legal">
                                <p>Исполнитель (продавец): ООО "{restaurant.name}", 0177, Грузия, г. Тбилиси, Казбеги, дом 25, ИНН 405234567, рег. номер 1027700251754</p>
                                <p>Информация о потребительских свойствах продукции доступна в ресторане и на сайте.</p>
                                <p>Режим работы: с 08:00 до 23:00</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="v2-menu-block">
                {/* Categories always stay visible */}
                <div className="categories-strip">
                    {mobileCategories.map((cat) => (
                        <div
                            key={cat}
                            className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => scrollToCategory(cat)}
                        >
                            <span className="category-name">{cat}</span>
                        </div>
                    ))}
                </div>

                {mobileSearchQuery.trim() && filteredProducts.length === 0 ? (
                    <div className="v2-search-empty">Ничего не найдено</div>
                ) : (
                    <div className="products-all-sections">
                        {filteredCategories.map((cat, catIndex) => (
                            <div
                                key={cat}
                                className="category-section"
                                id={`cat-${cat.replace(/\s+/g, '-')}`}
                                data-category={cat}
                                ref={(el) => { sectionRefs.current[cat] = el; }}
                            >
                                {catIndex > 0 && <h2 className="category-section-title">{cat}</h2>}
                                <div className="products-grid">
                                    {filteredByCategory[cat].map(product => {
                                        const count = getQuantity(product.id);
                                        return (
                                            <div key={product.id} className="dish-card" onClick={() => setSelectedProduct(product)}>
                                                <div className="dish-photo">
                                                    <img src={product.img || '/Assets/default-food.png'} alt={product.name} />
                                                    <div className="dish-controls">
                                                        <div className={`quantity-counter ${count === 0 ? 'collapsed' : ''}`}>
                                                            <button
                                                                className="qty-btn qty-minus"
                                                                onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(product.id, -1); }}
                                                            />
                                                            <span className="qty-value">{count > 0 ? count : ''}</span>
                                                            <button
                                                                className="qty-btn qty-plus"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (count === 0) {
                                                                        onAddToCart(product);
                                                                    } else {
                                                                        onUpdateQuantity && onUpdateQuantity(product.id, 1);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="dish-text">
                                                    <div className="dish-price">{product.price.toFixed(2)} GEL</div>
                                                    <div className="dish-title">{product.name}</div>
                                                    <div className="dish-meta">
                                                        <span>{product.weight}{product.weight && ' г.'}</span>
                                                        {product.weight && product.calories && <span style={{ margin: '0 4px' }}>·</span>}
                                                        <span>{product.calories}{product.calories && ' ккал'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedProduct && (
                <div className="dish-modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="dish-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-top">
                            <img src={selectedProduct.img || '/Assets/default-food.png'} alt={selectedProduct.name} className="modal-hero-img" />
                            <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-description">{selectedProduct.description || 'Вкусное блюдо, приготовленное из свежих ингредиентов.'}</p>

                            <div className="kbju-section-v2">
                                <h3 className="section-label-v3">КБЖУ</h3>
                                <div className="kbju-grid-modal">
                                    <div className="kbju-item-circle">
                                        <span className="kbju-val-circle">{selectedProduct.calories || '—'}</span>
                                        <span className="kbju-lab-circle">ккал</span>
                                    </div>
                                    <div className="kbju-item-circle">
                                        <span className="kbju-val-circle">{selectedProduct.proteins || '—'}</span>
                                        <span className="kbju-lab-circle">белки</span>
                                    </div>
                                    <div className="kbju-item-circle">
                                        <span className="kbju-val-circle">{selectedProduct.fats || '—'}</span>
                                        <span className="kbju-lab-circle">жиры</span>
                                    </div>
                                    <div className="kbju-item-circle">
                                        <span className="kbju-val-circle">{selectedProduct.carbs || '—'}</span>
                                        <span className="kbju-lab-circle">угли</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer-v3">
                            <div className="footer-info-row">
                                <h2 className="footer-dish-name">
                                    {selectedProduct.name}
                                    <span className="footer-dish-weight">{selectedProduct.weight}{selectedProduct.weight && ' г'}</span>
                                </h2>
                                <span className="footer-dish-price">{selectedProduct.price.toFixed(0)} GEL</span>
                            </div>

                            <div className="footer-actions-row">
                                <div className="modal-qty-selector">
                                    <button
                                        className="modal-qty-btn"
                                        onClick={() => onUpdateQuantity && onUpdateQuantity(selectedProduct.id, -1)}
                                        disabled={getQuantity(selectedProduct.id) <= 1}
                                    >−</button>
                                    <span className="modal-qty-val">{getQuantity(selectedProduct.id) || 1}</span>
                                    <button
                                        className="modal-qty-btn"
                                        onClick={() => {
                                            if (getQuantity(selectedProduct.id) === 0) onAddToCart(selectedProduct);
                                            else onUpdateQuantity && onUpdateQuantity(selectedProduct.id, 1);
                                        }}
                                    >+</button>
                                </div>
                                <button className="modal-main-add-btn" onClick={() => {
                                    if (getQuantity(selectedProduct.id) === 0) onAddToCart(selectedProduct);
                                    setSelectedProduct(null);
                                }}>
                                    Добавить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantPage;
