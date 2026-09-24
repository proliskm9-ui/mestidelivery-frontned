import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { api, Product, Restaurant, resolveImageUrl } from '../services/api';
import FullPageLoader from '../components/UI/FullPageLoader';
import NetworkErrorState from '../components/UI/NetworkErrorState';
import { useLanguage } from '../translations/LanguageContext';
import { useDeliveryLocationOptional } from '../delivery/DeliveryLocationContext';
import { matchesI18nContent, pickI18nText } from '../utils/i18nContent';
import { formatPortionCalories, formatPortionWeight, isVisibleMenuProduct, localizeMenuCategory, sortMenuCategories, sortProductsInCategory } from '../utils/formatProductMeta';
import { getMinimumOrderQuantity } from '../utils/minimumOrderQuantity';
import { closedBadgeText, isRestaurantOpenNow, nextOpenAt } from '../utils/workingHours';
import './Restaurant.css';
import './MobileRestaurant.css';
import { useBackToClose } from '../hooks/useBackToClose';
import { formatPrice } from '../utils/formatPrice';
import { deviceHasOrdered, accountHasOrders } from '../utils/deliveryPromo';
import { cuisineLine } from '../utils/restaurantCuisine';
import Sheet from '../components/UI/Sheet';
import DishModifiers from '../components/UI/DishModifiers';
import { acceptsModifiers, isAvailableModifier, isModifierProduct } from '../utils/modifiers';

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
    /** Delivery fee and order total as the cart computes them (first-order promo, service fee). */
    cartDeliveryFee?: number;
    orderTotal?: number;
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
    onNavigateToCart,
    cartDeliveryFee,
    orderTotal,
}) => {
    const { t, language } = useLanguage();
    const deliveryLoc = useDeliveryLocationOptional();
    const deliveryFee = deliveryLoc?.fee;
    const locName = (raw?: string | null) => pickI18nText(raw, language);
    const locDesc = (raw?: string | null) => pickI18nText(raw, language);
    const portionLabels = {
        grams: String(t('restaurant.grams')),
        ml: String(t('restaurant.ml')),
        liter: String(t('restaurant.liter')),
        pcs: String(t('restaurant.pcs')),
        kcal: String(t('restaurant.kcal')),
    };
    const formatWeight = (w?: string | number) => formatPortionWeight(w, portionLabels);
    const formatCalories = (c?: string | number) => formatPortionCalories(c, portionLabels.kcal);
    const getReviewsLabel = (r: Restaurant) => {
        const fromTags = String(r.filter_tags || '').match(/reviews:([^,]+)/i)?.[1]?.trim();
        if (fromTags) return fromTags;
        const byName: Record<string, string> = {
            Luizastan: '55+',
            'Sunset Restaraunt': '980+',
            'Sunset Restaurant': '980+',
            'BBQ Garden': '230+',
        };
        return byName[r.name] || '100+';
    };
    const getHoursLabel = (r: Restaurant) => {
        let hours: string | null = null;
        if (r.working_hours) {
            try {
                const parsed = JSON.parse(r.working_hours);
                const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
                hours = parsed?.[todayKey] || null;
            } catch { /* fall through */ }
        }
        if (!hours) {
            const fromTags = String(r.filter_tags || '').match(/hours:([^,]+)/i)?.[1]?.trim();
            const byName: Record<string, string> = {
                Luizastan: '10:00-23:00',
                'Sunset Restaraunt': '10:30-23:00',
                'Sunset Restaurant': '10:30-23:00',
                'BBQ Garden': '10:00-23:00',
            };
            hours = fromTags || byName[r.name] || null;
        }
        if (hours && String(hours).toLowerCase() === 'closed') {
            return language === 'en'
                ? 'Working hours: Temporarily closed'
                : language === 'ka'
                    ? 'სამუშაო საათები: დროებით დაკეტილია'
                    : 'Режим работы: Временно не принимает заказы';
        }
        return hours ? t('restaurant.hours_label').replace('{hours}', hours) : t('restaurant.seller_info_hours');
    };

    /** Cuisine line per restaurant (prod copy, localized). */
    const getCuisineLine = (r: Restaurant) =>
        cuisineLine(r?.name, language) || (language === 'en' ? 'Restaurant • Food delivery' : language === 'ka' ? 'რესტორანი • საკვების მიტანა' : 'Ресторан • Доставка еды');

    const getDeliveryTimeLine = (r: Restaurant) => {
        const d = String((r as any)?.delivery || '20-30 мин');
        if (language === 'en') return `Delivery time: ~${d.replace(/мин/g, 'min')}`;
        if (language === 'ka') return `მიტანის დრო: ~${d.replace(/мин/g, 'წთ')}`;
        return `Время доставки: ~${d}`;
    };

    const mestiaAddress = language === 'en' ? 'Mestia, Georgia' : language === 'ka' ? 'მესტია, საქართველო' : 'Местиа, Грузия';

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    // Sauces / bread: not a menu section, offered inside the dish card
    const [modifierProducts, setModifierProducts] = useState<Product[]>([]);
    const [pickedMods, setPickedMods] = useState<string[]>([]);
    const [, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [mobileSearchQuery, setMobileSearchQuery] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    // System Back closes the dish / info sheets instead of leaving the restaurant
    useBackToClose(Boolean(selectedProduct), () => setSelectedProduct(null));
    const cartWidgetRef = useRef<HTMLDivElement>(null);
    const infoCardRef = useRef<HTMLDivElement>(null);
    // Dish photo flies from the grid card into the sheet (View Transitions; plain open elsewhere)
    const dishCardImgRef = useRef<HTMLImageElement | null>(null);
    const canMorph = () =>
        typeof document !== 'undefined' &&
        'startViewTransition' in document &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const openDish = (product: Product, cardImg?: HTMLImageElement | null) => {
        dishCardImgRef.current = cardImg || null;
        if (!cardImg || !canMorph()) { setSelectedProduct(product); return; }
        cardImg.style.viewTransitionName = 'dish-photo';
        document.documentElement.classList.add('vt-dish');
        const vt = (document as any).startViewTransition(() => {
            cardImg.style.viewTransitionName = '';
            flushSync(() => setSelectedProduct(product));
        });
        vt.finished.finally(() => document.documentElement.classList.remove('vt-dish'));
    };
    const closeDish = () => {
        const cardImg = dishCardImgRef.current;
        if (!cardImg || !cardImg.isConnected || !canMorph()) { setSelectedProduct(null); return; }
        document.documentElement.classList.add('vt-dish');
        const vt = (document as any).startViewTransition(() => {
            flushSync(() => setSelectedProduct(null));
            cardImg.style.viewTransitionName = 'dish-photo';
        });
        vt.finished.finally(() => {
            cardImg.style.viewTransitionName = '';
            document.documentElement.classList.remove('vt-dish');
        });
    };

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
        flyDishToCart(imgEl || fromEl, resolveImageUrl(product.img || '') || '/Assets/default-food.png');
        onAddToCart(product);
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Desktop: compact title appears when info card leaves — categories are a single sticky nav (never duplicated).
    // Mobile: classic scroll threshold for v2-compact-header.
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                if (isMobile) {
                    setIsScrolled(window.scrollY > 90);
                } else {
                    const info = infoCardRef.current;
                    if (info) {
                        // 24 = sticky top offset, so compact turns on exactly when the chrome sticks
                        const bottom = info.getBoundingClientRect().bottom;
                        setIsScrolled((prev) => {
                            if (!prev && bottom <= 24) return true;
                            if (prev && bottom > 72) return false;
                            return prev;
                        });
                    }
                }
                ticking = false;
            });
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isMobile, restaurantId]);

    useEffect(() => {
        if (restaurant?.name) {
            document.title = `${locName(restaurant.name).replace(/Restaraunt/gi, 'Restaurant')} — MestiDelivery`;
        }
    }, [restaurant?.name, language]);

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

                const allProducts = await api.getProducts(restaurantId).catch(() => [] as Product[]);
                setModifierProducts(allProducts.filter(isAvailableModifier));
                const prodData = allProducts.filter((p) => isVisibleMenuProduct(p) && !isModifierProduct(p));
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

    // ----- Dish add-ons -----
    useEffect(() => { setPickedMods([]); }, [selectedProduct?.id]);
    const modOptions = selectedProduct && acceptsModifiers(selectedProduct)
        ? modifierProducts.map((m) => ({ id: m.id, name: locName(m.name), price: Number(m.price) || 0 }))
        : [];
    const toggleMod = (id: string) => setPickedMods((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    const pickedModsSum = modOptions.filter((o) => pickedMods.includes(o.id)).reduce((sum, o) => sum + o.price, 0);
    /** Adds the picked add-ons once per portion of the dish (they go to the order as their own items). */
    const addPickedMods = (portions: number) => {
        if (!selectedProduct || !pickedMods.length) return;
        // Another restaurant's cart: the switch dialog handles the dish; add-ons would overwrite it
        if (cart.length > 0 && cart[0].product.restaurant_id !== selectedProduct.restaurant_id) return;
        for (const mod of modifierProducts.filter((m) => pickedMods.includes(m.id))) {
            for (let i = 0; i < Math.max(1, portions); i++) onAddToCart(mod);
        }
    };

    // ----- MOBILE HOOKS (must be called unconditionally, before any early returns) -----
    const mobileCategories = sortMenuCategories(
        Array.from(new Set(products.map(p => p.category))).filter(Boolean) as string[],
    );
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Group products by category (drinks: coffee/tea first)
    const productsByCategory: Record<string, Product[]> = {};
    for (const cat of mobileCategories) {
        productsByCategory[cat] = sortProductsInCategory(
            cat,
            products.filter(p => p.category === cat),
        );
    }

    // Scroll-to-category handler
    const scrollToCategory = (cat: string) => {
        const el = sectionRefs.current[cat];
        if (el) {
            const offset = 150; // mobile v2 compact header
            const y = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setActiveCategory(cat);
    };

    // Scroll-spy: the active category is the last section whose top has passed under the
    // sticky header; before any has, it's the first one (fixes a random tab lit on open).
    useEffect(() => {
        if (mobileCategories.length === 0) return;
        let frame = 0;
        const update = () => {
            frame = 0;
            const line = isMobile ? 170 : 160;
            let current = mobileCategories[0];
            for (const cat of mobileCategories) {
                const el = sectionRefs.current[cat];
                if (el && el.getBoundingClientRect().top <= line) current = cat;
            }
            setActiveCategory(current);
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
    }, [isMobile, products]); // eslint-disable-line react-hooks/exhaustive-deps

    const scrollToCategoryDesktop = (cat: string) => {
        const el = sectionRefs.current[cat];
        if (el) {
            const offset = isScrolled ? 150 : 72; // sticky chrome: title+cats or cats only
            const y = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
        setActiveCategory(cat);
    };

    if (loading) return <FullPageLoader variant="restaurant" />;
    if (isNetworkError || !restaurant) return <NetworkErrorState />;

    const getCategoryDisplayName = (cat: string) => localizeMenuCategory(cat, t);
    const restaurantDisplayName = locName(restaurant.name).replace(/Restaraunt/gi, 'Restaurant');

    const restaurantClosedHint = closedBadgeText(restaurant.working_hours, language);
    const restaurantIsOpen = isRestaurantOpenNow(restaurant.working_hours);
    const hasNextOpen = Boolean(nextOpenAt(restaurant.working_hours));
    // "Label: value" copy -> [label, value] for the info rows
    const splitLine = (line: string): [string, string] => {
        const i = line.indexOf(': ');
        return i > 0 ? [line.slice(0, i), line.slice(i + 2)] : ['', line];
    };
    const [hoursLabel, hoursValue] = splitLine(getHoursLabel(restaurant));
    const [etaLabel, etaValue] = splitLine(getDeliveryTimeLine(restaurant));
    const infoSheet = (
        <Sheet
            open={isInfoModalOpen}
            onOpenChange={setIsInfoModalOpen}
            title={restaurantDisplayName}
            description={getCuisineLine(restaurant)}
        >
            <ul className="ds-list">
                <li className="ds-row">
                    <span className="ds-row-label">{t('restaurant.address_label')}</span>
                    <span className="ds-row-text">{restaurant.address || mestiaAddress}</span>
                </li>
                <li className="ds-row">
                    <span className="ds-row-main">
                        <span className="ds-row-label">{hoursLabel || t('restaurant.hours_short')}</span>
                        <span className={restaurantIsOpen ? 'ds-row-sub rest-open' : 'ds-row-sub rest-closed'}>
                            {restaurantIsOpen ? t('restaurant.open_now') : t('restaurant.closed_now')}
                        </span>
                    </span>
                    <span className="ds-row-text">{hoursValue}</span>
                </li>
                <li className="ds-row">
                    <span className="ds-row-label">{etaLabel || t('restaurant.delivery')}</span>
                    <span className="ds-row-text">{etaValue}</span>
                </li>
                {restaurant.rating ? (
                    <li className="ds-row">
                        <span className="ds-row-label">{t('restaurant.rating_label')}</span>
                        <span className="ds-row-text">★ {restaurant.rating} <span className="ds-row-text--muted">· {getReviewsLabel(restaurant)}</span></span>
                    </li>
                ) : null}
            </ul>
        </Sheet>
    );

    // Notices at the top of the menu (Yandex-style tiles): closed hours, first-order offer
    const showFirstOrderPromo = !deviceHasOrdered() && !accountHasOrders();
    const menuNotices = (!restaurantIsOpen && restaurantClosedHint) || showFirstOrderPromo ? (
        <div className="rest-notices">
            {!restaurantIsOpen && restaurantClosedHint && (
                <div className="rest-notice rest-notice--closed" role="status">
                    <span className="rest-notice-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                    </span>
                    <span className="rest-notice-text">
                        <span className="rest-notice-title">{restaurantClosedHint}</span>
                        {hasNextOpen && <span className="rest-notice-sub">{t('restaurant.closed_preorder')}</span>}
                    </span>
                </div>
            )}
            {showFirstOrderPromo && (
                <div className="rest-notice rest-notice--promo">
                    <span className="rest-notice-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" rx="1" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
                    </span>
                    <span className="rest-notice-text">
                        <span className="rest-notice-title">{t('restaurant.promo_free_title')}</span>
                        <span className="rest-notice-sub">{t('restaurant.promo_free_sub')}</span>
                    </span>
                </div>
            )}
        </div>
    ) : null;

    // ----- DESKTOP RENDER -----
    if (!isMobile) {
        const cartTotal = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

        const desktopFilteredProducts = mobileSearchQuery.trim()
            ? products.filter(p =>
                matchesI18nContent(p.name, mobileSearchQuery) ||
                (p.category && p.category.toLowerCase().includes(mobileSearchQuery.toLowerCase()))
            )
            : products;
        const desktopFilteredCategories = mobileSearchQuery.trim()
            ? Array.from(new Set(desktopFilteredProducts.map(p => p.category))).filter(Boolean) as string[]
            : mobileCategories;
        const desktopByCategory: Record<string, Product[]> = {};
        for (const cat of desktopFilteredCategories) {
            desktopByCategory[cat] = sortProductsInCategory(
                cat,
                desktopFilteredProducts.filter(p => p.category === cat),
            );
        }

        const renderDishCard = (product: Product) => {
            const count = getQuantity(product.id);
            return (
                <div key={product.id} className="dish-card-new" onClick={() => setSelectedProduct(product)}>
                    <div className="dcn-image">
                        <img loading="lazy" decoding="async" src={resolveImageUrl(product.img || '') || '/Assets/default-food.png'} alt={locName(product.name)} />
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
                    <div className="dcn-price">{formatPrice(product.price)}</div>
                    <div className="dcn-title">{locName(product.name)}</div>
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
                    placeholder={t('restaurant.search_placeholder').replace('{name}', restaurantDisplayName)}
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
                <div className="rest-content-wrapper">
                    <div className="rest-main-column">
                        <div className="rest-header-block">
                            <div className="rest-info-card" ref={infoCardRef}>
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

                                <h1 className="ric-title">{restaurantDisplayName}</h1>

                                <div className="ric-meta-row">
                                    <div className="ric-meta-item">
                                        <img src="/Assets/звезда-removebg-preview 48.png" alt="" style={{ width: 29, height: 29, objectFit: 'contain', opacity: 0.8 }} />
                                        <div className="ric-meta-text">
                                            <span className="ric-meta-val">{restaurant.rating}</span>
                                            <span className="ric-meta-sub">{getReviewsLabel(restaurant)} {t('restaurant.reviews_count')}</span>
                                        </div>
                                    </div>
                                    <div className="ric-meta-divider" />
                                    <div className="ric-meta-item">
                                        <img src="/Assets/иконка_человек_2 пнг 32.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                        <div className="ric-meta-text">
                                            <span className="ric-meta-val">{restaurant.delivery || t('cart.time')}</span>
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
                            </div>
                        </div>

                        {/* One category nav only — sticks; title row appears after info card leaves.
                            Must stay outside .rest-header-block: a sticky element cannot travel past its parent's box. */}
                        <div className={`rest-sticky-chrome ${isScrolled ? 'is-compact' : ''}`}>
                            <div className="rest-sticky-card">
                                {isScrolled && (
                                    isSearchOpen ? (
                                        <div className="rest-sticky-title-row rest-sticky-title-row--search">
                                            <button type="button" className="ui-circle-btn" onClick={onBack} aria-label={t('common.back')}>
                                                {iconBack}
                                            </button>
                                            {renderSearchField(true)}
                                        </div>
                                    ) : (
                                        <div className="rest-sticky-title-row">
                                            <button type="button" className="ui-circle-btn" onClick={onBack} aria-label={t('common.back')}>
                                                {iconBack}
                                            </button>
                                            <h2 className="rest-sticky-title">{restaurantDisplayName}</h2>
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
                                    )
                                )}
                                {renderCategoryNav('rest-sticky-cats')}
                            </div>
                        </div>

                        {menuNotices}

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
                                        <div key={item.product.id} className={`cw-item${isModifierProduct(item.product) ? ' cw-item-addon' : ''}`}>
                                            {!isModifierProduct(item.product) && (
                                                <img loading="lazy" decoding="async" src={resolveImageUrl(item.product.img || '') || '/Assets/default-food.png'} className="cw-item-img" alt={locName(item.product.name)} />
                                            )}
                                            <div className="cw-item-info">
                                                <div className="cw-item-name">{locName(item.product.name)}</div>
                                                <div className="cw-item-price-val">{formatPrice(item.product.price)}</div>
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
                                        {deliveryFee != null && cart.length > 0 && cartDeliveryFee === 0
                                            ? `${t('menu.free_delivery')} · ${deliveryLoc?.etaLabel || restaurant.delivery || t('cart.time')}`
                                            : deliveryFee != null
                                            ? t('delivery.fee_with_eta')
                                                .replace('{fee}', String(Math.round(cart.length > 0 ? (cartDeliveryFee ?? deliveryFee) : deliveryFee)))
                                                .replace('{eta}', deliveryLoc?.etaLabel || restaurant.delivery || t('cart.time'))
                                            : t('delivery.need_location')}
                                    </div>
                                    {restaurant.address && (
                                        <div className="cw-info-sub">{restaurant.address}</div>
                                    )}
                                </div>
                            </div>

                            {cart.length > 0 && (
                                <button type="button" className="cw-checkout-btn" onClick={onNavigateToCart}>
                                    {t('restaurant.proceed_to_payment')} · {formatPrice(orderTotal ?? (cartTotal + (deliveryFee || 0)))}
                                </button>
                            )}
                        </div>
                    </aside>
                </div>

                {selectedProduct && (
                    <div className="pc-dish-modal-overlay" onClick={() => setSelectedProduct(null)}>
                        <div className="pc-dish-modal" onClick={e => e.stopPropagation()}>
                            {/* Same card as on the phone: photo, details, footer with name / weight / price, quantity and Add */}
                            <button type="button" className="modal-close-btn" onClick={() => setSelectedProduct(null)} aria-label={t('common.cancel')}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                            <img src={resolveImageUrl(selectedProduct.img || '') || '/Assets/default-food.png'} alt={locName(selectedProduct.name)} className="pc-dish-modal-img" />
                            <div className="pc-dish-modal-body">
                                <p className="pc-dish-modal-desc">{locDesc(selectedProduct.description) || ''}</p>
                                <DishModifiers title={t('restaurant.add_to_dish')} options={modOptions} picked={pickedMods} onToggle={toggleMod} />
                                {/* Same nutrition block as the phone modal */}
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
                                        {locName(selectedProduct.name)}
                                        {formatWeight(selectedProduct.weight) && <span className="footer-dish-weight">{formatWeight(selectedProduct.weight)}</span>}
                                        {getMinimumOrderQuantity(selectedProduct) > 1 && (
                                            <span className="footer-dish-weight">мин. {getMinimumOrderQuantity(selectedProduct)} шт.</span>
                                        )}
                                    </h2>
                                    <span className="footer-dish-price">{formatPrice(Number(selectedProduct.price) + pickedModsSum)}</span>
                                </div>
                                <div className="footer-actions-row">
                                    <div className="modal-qty-selector">
                                        <button
                                            type="button"
                                            className="modal-qty-btn"
                                            onClick={() => onUpdateQuantity && onUpdateQuantity(selectedProduct.id, -1)}
                                            disabled={getQuantity(selectedProduct.id) === 0}
                                        >−</button>
                                        <span className="modal-qty-val">
                                            {getQuantity(selectedProduct.id) || getMinimumOrderQuantity(selectedProduct)}
                                        </span>
                                        <button
                                            type="button"
                                            className="modal-qty-btn"
                                            onClick={() => {
                                                if (getQuantity(selectedProduct.id) === 0) onAddToCart(selectedProduct);
                                                else onUpdateQuantity && onUpdateQuantity(selectedProduct.id, 1);
                                            }}
                                        >+</button>
                                    </div>
                                    <button type="button" className="modal-main-add-btn" onClick={(e) => {
                                        const inCart = getQuantity(selectedProduct.id);
                                        if (inCart === 0) addToCartAnimated(selectedProduct, e.currentTarget);
                                        addPickedMods(inCart || getMinimumOrderQuantity(selectedProduct));
                                        setSelectedProduct(null);
                                    }}>
                                        {t('restaurant.add')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {infoSheet}
            </div>
        );
    }

    // ----- MOBILE RENDER -----

    // Filter products when search is active
    const filteredProducts = mobileSearchQuery.trim()
        ? products.filter(p =>
            matchesI18nContent(p.name, mobileSearchQuery) ||
            (p.category && p.category.toLowerCase().includes(mobileSearchQuery.toLowerCase()))
        )
        : products;
    const filteredCategories = mobileSearchQuery.trim()
        ? Array.from(new Set(filteredProducts.map(p => p.category))).filter(Boolean)
        : mobileCategories;
    const filteredByCategory: Record<string, Product[]> = {};
    for (const cat of filteredCategories) {
        filteredByCategory[cat] = sortProductsInCategory(
            cat,
            filteredProducts.filter(p => p.category === cat),
        );
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
                                placeholder={t('restaurant.search_placeholder').replace('{name}', restaurantDisplayName)}
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
                                {restaurantDisplayName.toLowerCase().includes('sunset') ? 'Sunset' : (restaurantDisplayName.length > 18 ? restaurantDisplayName.substring(0, 16) + '...' : restaurantDisplayName)}
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
                                placeholder={t('restaurant.search_placeholder').replace('{name}', restaurantDisplayName)}
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
                    <h1 className="v2-header-title">{restaurantDisplayName}</h1>
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
                            <span className="v2-meta-sub">{getReviewsLabel(restaurant)} {t('restaurant.reviews_count')}</span>
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
                            <span className="v2-meta-val" style={{ color: '#21EA7C' }}>{restaurant.delivery || t('cart.time')}</span>
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
            {infoSheet}

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

                {!mobileSearchQuery.trim() && menuNotices}

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
                                            <div key={product.id} className="dish-card" onClick={(e) => openDish(product, (e.currentTarget as HTMLElement).querySelector<HTMLImageElement>('.dish-photo img'))}>
                                                <div className="dish-photo">
                                                    <img loading="lazy" decoding="async" src={resolveImageUrl(product.img || '') || '/Assets/default-food.png'} alt={locName(product.name)} />
                                                    <div className="dish-controls">
                                                        <div className={`quantity-counter ${count === 0 ? 'collapsed' : ''}`}>
                                                            <button
                                                                className="qty-btn qty-minus"
                                                                onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(product.id, -1); }}
                                                            />
                                                            <span className="qty-value" key={count}>{count > 0 ? count : ''}</span>
                                                            <button
                                                                className="qty-btn qty-plus"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Tiny haptic tick where supported (Android); iOS ignores it
                                                                    try { navigator.vibrate?.(8); } catch { /* not supported */ }
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
                                                    <div className="dish-price">{formatPrice(product.price)}</div>
                                                    <div className="dish-title">{locName(product.name)}</div>
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
                <div className="dish-modal-overlay" onClick={closeDish}>
                    <div className="dish-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-top">
                            <img src={resolveImageUrl(selectedProduct.img || '') || '/Assets/default-food.png'} alt={locName(selectedProduct.name)} className="modal-hero-img" style={{ viewTransitionName: 'dish-photo' }} />
                            <button className="modal-close-btn" onClick={closeDish}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-description">{locDesc(selectedProduct.description) || ''}</p>

                            <DishModifiers title={t('restaurant.add_to_dish')} options={modOptions} picked={pickedMods} onToggle={toggleMod} />

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
                                    {locName(selectedProduct.name)}
                                    {formatWeight(selectedProduct.weight) && <span className="footer-dish-weight">{formatWeight(selectedProduct.weight)}</span>}
                                    {getMinimumOrderQuantity(selectedProduct) > 1 && (
                                        <span className="footer-dish-weight">мин. {getMinimumOrderQuantity(selectedProduct)} шт.</span>
                                    )}
                                </h2>
                                <span className="footer-dish-price">{formatPrice(Number(selectedProduct.price) + pickedModsSum)}</span>
                            </div>

                            <div className="footer-actions-row">
                                <div className="modal-qty-selector">
                                    <button
                                        className="modal-qty-btn"
                                        onClick={() => onUpdateQuantity && onUpdateQuantity(selectedProduct.id, -1)}
                                        disabled={getQuantity(selectedProduct.id) === 0}
                                    >−</button>
                                    <span className="modal-qty-val">
                                        {getQuantity(selectedProduct.id) || getMinimumOrderQuantity(selectedProduct)}
                                    </span>
                                    <button
                                        className="modal-qty-btn"
                                        onClick={() => {
                                            if (getQuantity(selectedProduct.id) === 0) onAddToCart(selectedProduct);
                                            else onUpdateQuantity && onUpdateQuantity(selectedProduct.id, 1);
                                        }}
                                    >+</button>
                                </div>
                                <button className="modal-main-add-btn" onClick={() => {
                                    const inCart = getQuantity(selectedProduct.id);
                                    if (inCart === 0) onAddToCart(selectedProduct);
                                    addPickedMods(inCart || getMinimumOrderQuantity(selectedProduct));
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
