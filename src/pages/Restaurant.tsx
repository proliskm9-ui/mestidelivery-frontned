import React, { useState, useEffect, useRef } from 'react';
import { api, Product, Restaurant } from '../services/api';
import FullPageLoader from '../components/UI/FullPageLoader';
import NetworkErrorState from '../components/UI/NetworkErrorState';
import { useLanguage } from '../translations/LanguageContext';
import { useDeliveryLocationOptional } from '../delivery/DeliveryLocationContext';
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
    const { t } = useLanguage();
    const deliveryLoc = useDeliveryLocationOptional();
    const deliveryFee = deliveryLoc?.fee;

    const formatWeight = (w?: string | number) => {
        if (w == null || w === '') return null;
        const str = String(w).trim();
        // If it already has letters (except Russian/Georgian suffixes), keep as is
        if (/[a-zA-Z]/.test(str)) return str;
        return `${str} ${t('restaurant.grams')}`;
    };

    const formatCalories = (c?: string | number) => {
        if (c == null || c === '') return null;
        const str = String(c).trim();
        if (/[a-zA-Z]/.test(str)) return str;
        return `${str} ${t('restaurant.kcal')}`;
    };

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const cartWidgetRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    const flyDishToCart = (fromEl: HTMLElement | null, imgUrl: string) => {
        const cartEl = cartWidgetRef.current;
        if (!fromEl || !cartEl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const from = fromEl.getBoundingClientRect();
        const to = cartEl.getBoundingClientRect();
        const flyer = document.createElement('img');
        flyer.src = imgUrl || '/Assets/default-food.png';
        flyer.alt = '';
        flyer.className = 'cw-fly-img';
        flyer.style.left = `${from.left}px`;
        flyer.style.top = `${from.top}px`;
        flyer.style.width = `${Math.max(from.width, 48)}px`;
        flyer.style.height = `${Math.max(from.height, 48)}px`;
        document.body.appendChild(flyer);

        const targetX = to.left + to.width / 2 - 28;
        const targetY = to.top + Math.min(120, to.height * 0.35);

        requestAnimationFrame(() => {
            flyer.style.transform = 'translate3d(0,0,0) scale(1)';
            requestAnimationFrame(() => {
                flyer.style.left = `${targetX}px`;
                flyer.style.top = `${targetY}px`;
                flyer.style.width = '56px';
                flyer.style.height = '56px';
                flyer.style.opacity = '0.25';
                flyer.style.transform = 'translate3d(0,-12px,0) scale(0.45)';
                flyer.style.borderRadius = '14px';
            });
        });

        window.setTimeout(() => {
            flyer.remove();
        }, 620);
    };

    const addToCartAnimated = (product: Product, fromEl: HTMLElement | null) => {
        const img =
            (fromEl?.closest('.dish-card-new, .pc-dish-modal')?.querySelector('img') as HTMLImageElement | null)
            || fromEl;
        const imgEl = img instanceof HTMLImageElement ? img : null;
        flyDishToCart(imgEl || fromEl, product.img || '/Assets/default-food.png');
        onAddToCart(product);
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Scroll detection for compact header (mobile + desktop)
    useEffect(() => {
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
    }, []);

    // Fetch Data
    useEffect(() => {
        if (!restaurantId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                let restData = await api.getRestaurant(restaurantId);

                // getRestaurant returns null on 404 — store cards use store IDs
                if (!restData) {
                    const stores = await api.getStores().catch(() => []);
                    const store = stores.find(s => String(s.id) === String(restaurantId));
                    if (!store) {
                        setIsNetworkError(true);
                        setRestaurant(null);
                        return;
                    }
                    restData = {
                        id: store.id,
                        name: store.name,
                        rating: '',
                        delivery: store.delivery || '',
                        img: store.img || '',
                        screen: store.img || '',
                    };
                }

                const prodData = await api.getProducts(restaurantId).catch(() => []);
                const cats = Array.from(new Set(prodData.map(p => p.category))).filter(Boolean) as string[];

                setRestaurant(restData);
                setProducts(prodData);
                setCategories(cats);
                setActiveCategory(cats[0] || 'All');
                setIsNetworkError(false);
            } catch (err) {
                console.error(err);
                setIsNetworkError(true);
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
        if (mobileCategories.length === 0) return;
        const observerOptions = {
            root: null,
            rootMargin: isMobile ? '-140px 0px -60% 0px' : '-130px 0px -55% 0px',
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

    const scrollToCategoryDesktop = (cat: string) => {
        const el = sectionRefs.current[cat];
        if (el) {
            const offset = isScrolled ? 130 : 24;
            const y = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setActiveCategory(cat);
    };

    const getCategoryDisplayName = (cat: string) => {
        if (cat === 'Что нового') return t('restaurant.what_new');
        if (cat === 'Выбор пользователей') return t('restaurant.user_choice');
        if (cat === 'Акции') return t('restaurant.promotions');
        
        // Translate database categories
        const lowerCat = cat.toLowerCase();
        if (lowerCat === 'супы' || lowerCat === 'soups') return t('categories.soups');
        if (lowerCat === 'бургеры' || lowerCat === 'burgers') return t('categories.burgers');
        if (lowerCat === 'пицца' || lowerCat === 'pizza') return t('categories.pizza');
        if (lowerCat === 'шаурма' || lowerCat === 'shawarma') return t('categories.shawarma');
        if (lowerCat === 'сэндвичи' || lowerCat === 'sandwiches') return t('categories.sandwiches');
        if (lowerCat === 'выпечка' || lowerCat === 'bakery') return t('categories.bakery');
        if (lowerCat === 'блины' || lowerCat === 'pancakes') return t('categories.pancakes');
        if (lowerCat === 'десерты' || lowerCat === 'desserts') return t('categories.desserts');
        if (lowerCat === 'шашлык' || lowerCat === 'bbq') return t('categories.bbq');
        if (lowerCat === 'паста' || lowerCat === 'pasta') return t('categories.pasta');
        if (lowerCat === 'кофе' || lowerCat === 'coffee') return t('categories.coffee');
        if (lowerCat === 'ქართული' || lowerCat === 'грузинская' || lowerCat === 'georgian') return t('categories.georgian');
        
        return cat;
    };

    if (loading) return <FullPageLoader variant="restaurant" />;
    if (isNetworkError || !restaurant) return <NetworkErrorState />;

    // ----- DESKTOP RENDER -----
    if (!isMobile) {
        const cartTotal = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

        const desktopFilteredProducts = mobileSearchQuery.trim()
            ? products.filter(p =>
                p.name.toLowerCase().includes(mobileSearchQuery.toLowerCase()) ||
                (p.category && p.category.toLowerCase().includes(mobileSearchQuery.toLowerCase()))
            )
            : products;
        const desktopFilteredCategories = mobileSearchQuery.trim()
            ? Array.from(new Set(desktopFilteredProducts.map(p => p.category))).filter(Boolean) as string[]
            : mobileCategories;
        const desktopByCategory: Record<string, Product[]> = {};
        for (const cat of desktopFilteredCategories) {
            desktopByCategory[cat] = desktopFilteredProducts.filter(p => p.category === cat);
        }

        const renderDishCard = (product: Product) => {
            const count = getQuantity(product.id);
            return (
                <div key={product.id} className="dish-card-new" onClick={() => setSelectedProduct(product)}>
                    <div className="dcn-image">
                        <img src={product.img || '/Assets/default-food.png'} alt={product.name} />
                        <div className="dcn-controls">
                            <div className={`dcn-qty ${count === 0 ? 'collapsed' : ''}`}>
                                <button
                                    type="button"
                                    className="dcn-qty-btn dcn-qty-minus"
                                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(product.id, -1); }}
                                    aria-label="decrease"
                                />
                                <span className="dcn-qty-val">{count > 0 ? count : ''}</span>
                                <button
                                    type="button"
                                    className="dcn-qty-btn dcn-qty-plus"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (count === 0) addToCartAnimated(product, e.currentTarget);
                                        else onUpdateQuantity && onUpdateQuantity(product.id, 1);
                                    }}
                                    aria-label="increase"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="dcn-price">{product.price.toFixed(0)} ₾</div>
                    <div className="dcn-title">{product.name}</div>
                    <div className="dcn-meta">
                        {formatWeight(product.weight) && <span>{formatWeight(product.weight)}</span>}
                        {formatWeight(product.weight) && formatCalories(product.calories) && <span className="dcn-meta-dot">·</span>}
                        {formatCalories(product.calories) && <span>{formatCalories(product.calories)}</span>}
                    </div>
                </div>
            );
        };

        const renderCategoryNav = (className: string) => (
            mobileCategories.length > 0 ? (
                <nav className={className} aria-label="categories">
                    {mobileCategories.map(cat => (
                        <button
                            type="button"
                            key={cat}
                            className={`mn-item ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => scrollToCategoryDesktop(cat)}
                        >
                            {getCategoryDisplayName(cat)}
                        </button>
                    ))}
                </nav>
            ) : null
        );

        const iconBack = (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
        );
        const iconSearch = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        );
        const iconHeart = (
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "#21EA7C" : "none"} stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        );

        const renderSearchField = (autoFocus: boolean) => (
            <div className="rest-search-field">
                <input
                    className="rest-search-input"
                    type="text"
                    placeholder={t('restaurant.search_placeholder').replace('{name}', restaurant.name)}
                    value={mobileSearchQuery}
                    onChange={(e) => setMobileSearchQuery(e.target.value)}
                    autoFocus={autoFocus}
                />
                {mobileSearchQuery && (
                    <button type="button" className="rest-search-clear" onClick={() => setMobileSearchQuery('')} aria-label="clear">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                        </svg>
                    </button>
                )}
                <button
                    type="button"
                    className="rest-search-close"
                    onClick={() => { setIsSearchOpen(false); setMobileSearchQuery(''); }}
                    aria-label="close"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );

        return (
            <div className={`restaurant-page-container desktop-restaurant ${isScrolled ? 'is-scrolled' : ''}`}>
                {/* Compact header — appears on scroll (mobile pattern, desktop glass) */}
                <div className={`rest-compact-header ${isScrolled ? 'visible' : ''}`}>
                    <div className="rest-compact-inner">
                        <div className="rest-compact-main">
                            {isSearchOpen ? (
                                <div className="rest-compact-nav rest-compact-nav--search">
                                    <button type="button" className="ui-circle-btn" onClick={onBack} aria-label={t('common.back')}>
                                        {iconBack}
                                    </button>
                                    {renderSearchField(true)}
                                </div>
                            ) : (
                                <div className="rest-compact-nav">
                                    <button type="button" className="ui-circle-btn" onClick={onBack} aria-label={t('common.back')}>
                                        {iconBack}
                                    </button>
                                    <h2 className="rest-compact-title">{restaurant.name}</h2>
                                    <div className="ric-actions-right">
                                        <button type="button" className="ui-circle-btn" onClick={() => setIsSearchOpen(true)} aria-label="search">
                                            {iconSearch}
                                        </button>
                                        <button
                                            type="button"
                                            className="ui-circle-btn"
                                            onClick={() => onToggleFavorite && restaurantId && onToggleFavorite(restaurantId)}
                                            aria-label="favorite"
                                        >
                                            {iconHeart}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {renderCategoryNav('rest-compact-cats')}
                        </div>
                        <div className="rest-compact-side" aria-hidden="true" />
                    </div>
                </div>

                <div className="rest-content-wrapper">
                    <div className="rest-main-column">
                        <div className="rest-info-card">
                            {isSearchOpen && !isScrolled ? (
                                <div className="ric-actions-row">
                                    <button type="button" className="ui-circle-btn" onClick={onBack} aria-label={t('common.back')}>
                                        {iconBack}
                                    </button>
                                    {renderSearchField(true)}
                                </div>
                            ) : (
                                <div className="ric-actions-row">
                                    <button type="button" className="ui-circle-btn" onClick={onBack} aria-label={t('common.back')}>
                                        {iconBack}
                                    </button>
                                    <div className="ric-actions-right">
                                        <button type="button" className="ui-circle-btn" onClick={() => setIsSearchOpen(true)} aria-label="search">
                                            {iconSearch}
                                        </button>
                                        <button
                                            type="button"
                                            className="ui-circle-btn"
                                            onClick={() => onToggleFavorite && restaurantId && onToggleFavorite(restaurantId)}
                                            aria-label="favorite"
                                        >
                                            {iconHeart}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <h1 className="ric-title">{restaurant.name}</h1>

                            <div className="ric-meta-row">
                                <div className="ric-meta-item">
                                    <img src="/Assets/звезда-removebg-preview 48.png" alt="" style={{ width: 29, height: 29, objectFit: 'contain', opacity: 0.8 }} />
                                    <div className="ric-meta-text">
                                        <span className="ric-meta-val">{restaurant.rating}</span>
                                        <span className="ric-meta-sub">919 {t('restaurant.reviews_count')}</span>
                                    </div>
                                </div>
                                <div className="ric-meta-divider" />
                                <div className="ric-meta-item">
                                    <img src="/Assets/иконка_человек_2 пнг 32.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                    <div className="ric-meta-text">
                                        <span className="ric-meta-val">{restaurant.delivery || '20-30 мин'}</span>
                                        <span className="ric-meta-sub">{t('restaurant.delivery')}</span>
                                    </div>
                                </div>
                                <div className="ric-meta-divider" />
                                <button type="button" className="ric-dots-btn" onClick={() => setIsInfoModalOpen(true)} aria-label="info">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                                    </svg>
                                </button>
                            </div>

                            {renderCategoryNav('rest-card-cats')}
                        </div>

                        {desktopFilteredCategories.map((cat) => (
                            <div
                                key={cat}
                                className="menu-section"
                                id={`pc-cat-${cat.replace(/\s+/g, '-')}`}
                                data-category={cat}
                                ref={(el) => { sectionRefs.current[cat] = el; }}
                            >
                                <h2 className="ms-title">{getCategoryDisplayName(cat)}</h2>
                                <div className="menu-grid">
                                    {(desktopByCategory[cat] || []).map(renderDishCard)}
                                </div>
                            </div>
                        ))}

                        {desktopFilteredCategories.length === 0 && (
                            <div className="no-items">{t('restaurant.no_items_in_category')}</div>
                        )}
                    </div>

                    <aside className="rest-sidebar">
                        <div
                            ref={cartWidgetRef}
                            className={`cart-widget ${cart.length > 0 ? 'cart-widget--filled' : ''}`}
                        >
                            <div className="cw-header-row">
                                <div className="cw-title">{t('restaurant.cart')}</div>
                                {cart.length > 0 && (
                                    <button type="button" className="ui-circle-btn cw-trash-btn" onClick={onClearCart} aria-label={t('cart.clear')}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {cart.length === 0 ? (
                                <div className="cw-empty">
                                    <span>{t('restaurant.cart_empty')}</span>
                                </div>
                            ) : (
                                <div className="cw-items">
                                    {cart.map(item => (
                                        <div key={item.product.id} className="cw-item">
                                            <img src={item.product.img || '/Assets/default-food.png'} className="cw-item-img" alt={item.product.name} />
                                            <div className="cw-item-info">
                                                <div className="cw-item-name">{item.product.name}</div>
                                                <div className="cw-item-price-val">{item.product.price} ₾</div>
                                            </div>
                                            <div className="cw-item-counter">
                                                <button type="button" className="cw-count-btn" onClick={() => onUpdateQuantity && onUpdateQuantity(item.product.id, -1)}>−</button>
                                                <span className="cw-count-val">{item.quantity}</span>
                                                <button type="button" className="cw-count-btn" onClick={() => onUpdateQuantity && onUpdateQuantity(item.product.id, 1)}>+</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="cw-bottom-info">
                                <div className="cw-info-text">
                                    <div>
                                        {deliveryFee != null
                                            ? t('delivery.fee_with_eta')
                                                .replace('{fee}', String(Math.round(deliveryFee)))
                                                .replace('{eta}', deliveryLoc?.etaLabel || restaurant.delivery || '25–35 мин')
                                            : t('delivery.need_location')}
                                    </div>
                                    {restaurant.address && (
                                        <div className="cw-info-sub">{restaurant.address}</div>
                                    )}
                                </div>
                            </div>

                            {cart.length > 0 && (
                                <button type="button" className="cw-checkout-btn" onClick={onNavigateToCart}>
                                    {t('restaurant.proceed_to_payment')} · {(cartTotal + (deliveryFee || 0)).toFixed(0)} ₾
                                </button>
                            )}
                        </div>
                    </aside>
                </div>

                {selectedProduct && (
                    <div className="pc-dish-modal-overlay" onClick={() => setSelectedProduct(null)}>
                        <div className="pc-dish-modal" onClick={e => e.stopPropagation()}>
                            <button type="button" className="pc-dish-modal-close ui-circle-btn" onClick={() => setSelectedProduct(null)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                            <img src={selectedProduct.img || '/Assets/default-food.png'} alt={selectedProduct.name} className="pc-dish-modal-img" />
                            <div className="pc-dish-modal-body">
                                <div className="pc-dish-modal-header">
                                    <h2>{selectedProduct.name}</h2>
                                    <span>{selectedProduct.price.toFixed(0)} ₾</span>
                                </div>
                                <p className="pc-dish-modal-desc">{selectedProduct.description || ''}</p>
                                {(formatWeight(selectedProduct.weight) || formatCalories(selectedProduct.calories)) && (
                                    <div className="pc-dish-modal-meta">
                                        {formatWeight(selectedProduct.weight)}
                                        {formatWeight(selectedProduct.weight) && formatCalories(selectedProduct.calories) ? ' · ' : ''}
                                        {formatCalories(selectedProduct.calories)}
                                    </div>
                                )}
                                <button type="button" className="pc-dish-modal-add" onClick={(e) => {
                                    addToCartAnimated(selectedProduct, e.currentTarget);
                                    setSelectedProduct(null);
                                }}>
                                    {t('restaurant.add')} • {selectedProduct.price.toFixed(0)} ₾
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isInfoModalOpen && (
                    <div className="v2-info-overlay" onClick={() => setIsInfoModalOpen(false)}>
                        <div className="v2-info-sheet pc-info-sheet" onClick={(e) => e.stopPropagation()}>
                            <div className="v2-sheet-handle" onClick={() => setIsInfoModalOpen(false)} />
                            <div className="v2-sheet-content">
                                <h2 className="v2-sheet-title">{restaurant.name}</h2>
                                <div className="v2-sheet-section">
                                    <p className="v2-sheet-address">{restaurant.address || ''}</p>
                                </div>
                                <div className="v2-sheet-section">
                                    <p className="v2-sheet-tags">{restaurant.category || ''}</p>
                                </div>
                                <div className="v2-sheet-divider" />
                                <div className="v2-sheet-legal">
                                    <p>{t('restaurant.seller_info_legal').replace('{name}', restaurant.name)}</p>
                                    <p>{t('restaurant.seller_info_hours')}</p>
                                </div>
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
        <div className={`mobile-restaurant-page ${cart.length > 0 ? 'has-cart' : ''}`}>
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
                                placeholder={t('restaurant.search_placeholder').replace('{name}', restaurant.name)}
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
                            <span className="category-name">{getCategoryDisplayName(cat)}</span>
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
                                placeholder={t('restaurant.search_placeholder').replace('{name}', restaurant.name)}
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
                            <span className="v2-meta-sub">919 {t('restaurant.reviews_count')}</span>
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
                            <span className="v2-meta-sub">{t('restaurant.delivery')}</span>
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
                                <p>{t('restaurant.seller_info_legal').replace('{name}', restaurant.name)}</p>
                                <p>{t('restaurant.seller_info_hours')}</p>
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
                            <span className="category-name">{getCategoryDisplayName(cat)}</span>
                        </div>
                    ))}
                </div>

                {mobileSearchQuery.trim() && filteredProducts.length === 0 ? (
                    <div className="v2-search-empty">{t('restaurant.search_empty')}</div>
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
                                {catIndex > 0 && <h2 className="category-section-title">{getCategoryDisplayName(cat)}</h2>}
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
                                                        {formatWeight(product.weight) && <span>{formatWeight(product.weight)}</span>}
                                                        {formatWeight(product.weight) && formatCalories(product.calories) && <span style={{ margin: '0 4px' }}>·</span>}
                                                        {formatCalories(product.calories) && <span>{formatCalories(product.calories)}</span>}
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
                            <p className="modal-description">{selectedProduct.description || ''}</p>

                            <div className="kbju-section-v2">
                                <h3 className="section-label-v3">{t('restaurant.kbju')}</h3>
                                <div className="kbju-grid-modal">
                                    <div className="kbju-item-circle">
                                        <span className="kbju-val-circle">{selectedProduct.calories != null && selectedProduct.calories !== '' ? selectedProduct.calories : '—'}</span>
                                        <span className="kbju-lab-circle">{t('restaurant.kcal')}</span>
                                    </div>
                                    <div className="kbju-item-circle">
                                        <span className="kbju-val-circle">{selectedProduct.proteins != null && selectedProduct.proteins !== '' ? selectedProduct.proteins : '—'}</span>
                                        <span className="kbju-lab-circle">{t('restaurant.proteins')}</span>
                                    </div>
                                    <div className="kbju-item-circle">
                                        <span className="kbju-val-circle">{selectedProduct.fats != null && selectedProduct.fats !== '' ? selectedProduct.fats : '—'}</span>
                                        <span className="kbju-lab-circle">{t('restaurant.fats')}</span>
                                    </div>
                                    <div className="kbju-item-circle">
                                        <span className="kbju-val-circle">{selectedProduct.carbs != null && selectedProduct.carbs !== '' ? selectedProduct.carbs : '—'}</span>
                                        <span className="kbju-lab-circle">{t('restaurant.carbs')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer-v3">
                            <div className="footer-info-row">
                                <h2 className="footer-dish-name">
                                    {selectedProduct.name}
                                    {formatWeight(selectedProduct.weight) && <span className="footer-dish-weight">{formatWeight(selectedProduct.weight)}</span>}
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
                                    {t('restaurant.add')}
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
