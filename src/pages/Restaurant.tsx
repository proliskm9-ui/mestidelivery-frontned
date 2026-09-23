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
import Sheet from '../components/UI/Sheet';

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
    const getCuisineLine = (r: Restaurant) => {
        const name = String(r?.name || '').toLowerCase();
        const pick = (en: string, ka: string, ru: string) => (language === 'en' ? en : language === 'ka' ? ka : ru);
        if (name.includes('sunset')) return pick('European & Georgian cuisine • Breakfasts', 'ევროპული და ქართული სამზარეულო • საუზმე', 'Европейская и грузинская кухня • Завтраки');
        if (name.includes('burger')) return pick('Craft Burgers • Fries & Snacks • Street Food', 'ბურგერები • ფრი & წასახემსებლები', 'Крафтовые бургеры • Закуски фри • Стритфуд');
        if (name.includes('bbq')) return pick('BBQ & Grill • Kebabs • Caucasian cuisine', 'მწვადი და გრილი • კავკასიური სამზარეულო', 'Мангал & Гриль • Шашлык • Кавказская кухня');
        if (name.includes('luizastan')) return pick('Authentic Svan & Georgian cuisine', 'ტრადიციული სვანური და ქართული სამზარეულო', 'Традиционная сванская и грузинская кухня');
        return pick('Restaurant • Food delivery', 'რესტორანი • საკვების მიტანა', 'Ресторан • Доставка еды');
    };

    const getDeliveryTimeLine = (r: Restaurant) => {
        const d = String((r as any)?.delivery || '20-30 мин');
        if (language === 'en') return `Delivery time: ~${d.replace(/мин/g, 'min')}`;
        if (language === 'ka') return `მიტანის დრო: ~${d.replace(/мин/g, 'წთ')}`;
        return `Время доставки: ~${d}`;
    };

    const mestiaAddress = language === 'en' ? 'Mestia, Georgia' : language === 'ka' ? 'მესტია, საქართველო' : 'Местиа, Грузия';

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
    // System Back closes the dish / info sheets instead of leaving the restaurant
    useBackToClose(Boolean(selectedProduct), () => setSelectedProduct(null));
    const cartWidgetRef = useRef<HTMLDivElement>(null);
    const infoCardRef = useRef<HTMLDivElement>(null);
    const heroImgRef = useRef<HTMLImageElement>(null);
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
                    const hero = heroImgRef.current;
                    const y = window.scrollY;
                    if (hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                        // Pull-down stretches the cover, scrolling lets it lag behind (native feel)
                        hero.style.transform = y < 0 ? `scale(${1 + -y / 260})` : `translate3d(0, ${Math.min(y, 400) * 0.35}px, 0)`;
                    }
                    setIsScrolled(y > (hero ? 230 : 90));
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

                const prodData = (await api.getProducts(restaurantId).catch(() => [])).filter(isVisibleMenuProduct);
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

    // Scroll-spy: auto-highlight active category based on scroll position
    useEffect(() => {
        if (mobileCategories.length === 0) return;
        const observerOptions = {
            root: null,
            rootMargin: isMobile ? '-140px 0px -60% 0px' : '-145px 0px -55% 0px',
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
    // Cover: dedicated hero image, else the card photo the user just tapped in the catalog
    const heroImage = restaurant.screen || restaurant.img || '';

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
            <div className="ds-stack">
                {!restaurantIsOpen && restaurantClosedHint && (
                    <p className="ds-note ds-note--warn"><b>{restaurantClosedHint}</b></p>
                )}
                <ul className="ds-card">
                    <li className="ds-row">
                        <span className="ds-row-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        </span>
                        <span className="ds-row-main">
                            <span className="ds-row-title">{restaurant.address || mestiaAddress}</span>
                            <span className="ds-row-sub">{t('restaurant.address_label')}</span>
                        </span>
                    </li>
                    <li className="ds-row">
                        <span className="ds-row-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                        </span>
                        <span className="ds-row-main">
                            <span className="ds-row-title">{hoursValue}</span>
                            {hoursLabel && <span className="ds-row-sub">{hoursLabel}</span>}
                        </span>
                        <span className={restaurantIsOpen ? 'ds-badge' : 'ds-badge ds-badge--danger'}>
                            {restaurantIsOpen ? t('restaurant.open_now') : t('restaurant.closed_now')}
                        </span>
                    </li>
                    <li className="ds-row">
                        <span className="ds-row-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="7" width="13" height="10" rx="2" /><path d="M14 10h4l3 3v4h-7" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
                        </span>
                        <span className="ds-row-main">
                            <span className="ds-row-title">{etaValue}</span>
                            {etaLabel && <span className="ds-row-sub">{etaLabel}</span>}
                        </span>
                    </li>
                    {restaurant.rating ? (
                        <li className="ds-row">
                            <span className="ds-row-icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
                            </span>
                            <span className="ds-row-main">
                                <span className="ds-row-title">{restaurant.rating}</span>
                                <span className="ds-row-sub">{getReviewsLabel(restaurant)} {t('restaurant.reviews_count')}</span>
                            </span>
                        </li>
                    ) : null}
                </ul>
            </div>
        </Sheet>
    );

    const closedBanner = !restaurantIsOpen && restaurantClosedHint ? (
        <div className="rest-closed-banner" role="status">
            <strong>{restaurantClosedHint}</strong>
            {hasNextOpen && <span>Можно собрать корзину и оформить ко времени на открытие.</span>}
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
                                {closedBanner}

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
                                            <img loading="lazy" decoding="async" src={resolveImageUrl(item.product.img || '') || '/Assets/default-food.png'} className="cw-item-img" alt={locName(item.product.name)} />
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
                            <button type="button" className="pc-dish-modal-close ui-circle-btn" onClick={() => setSelectedProduct(null)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                            <img src={resolveImageUrl(selectedProduct.img || '') || '/Assets/default-food.png'} alt={locName(selectedProduct.name)} className="pc-dish-modal-img" />
                            <div className="pc-dish-modal-body">
                                <div className="pc-dish-modal-header">
                                    <h2>{locName(selectedProduct.name)}</h2>
                                    <span>{formatPrice(selectedProduct.price)}</span>
                                </div>
                                <p className="pc-dish-modal-desc">{locDesc(selectedProduct.description) || ''}</p>
                                {(formatWeight(selectedProduct.weight) || formatCalories(selectedProduct.calories)) && (
                                    <div className="pc-dish-modal-meta">
                                        {formatWeight(selectedProduct.weight)}
                                        {formatWeight(selectedProduct.weight) && formatCalories(selectedProduct.calories) ? ' · ' : ''}
                                        {formatCalories(selectedProduct.calories)}
                                        {getMinimumOrderQuantity(selectedProduct) > 1
                                            ? ` · минимум ${getMinimumOrderQuantity(selectedProduct)} шт.`
                                            : ''}
                                    </div>
                                )}
                                <button type="button" className="pc-dish-modal-add" onClick={(e) => {
                                    addToCartAnimated(selectedProduct, e.currentTarget);
                                    setSelectedProduct(null);
                                }}>
                                    {t('restaurant.add')}
                                    {getMinimumOrderQuantity(selectedProduct) > 1
                                        ? ` ${getMinimumOrderQuantity(selectedProduct)} шт.`
                                        : ''}
                                    {' • '}
                                    {formatPrice(selectedProduct.price * getMinimumOrderQuantity(selectedProduct))}
                                </button>
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
            <div className={heroImage ? 'v2-header-block has-hero' : 'v2-header-block'}>
                {heroImage && (
                    <div className="v2-hero" aria-hidden="true">
                        <img ref={heroImgRef} className="v2-hero-img" src={heroImage} alt="" decoding="async" />
                    </div>
                )}
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
                    {closedBanner}
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
                                <span className="footer-dish-price">{formatPrice(selectedProduct.price)}</span>
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
