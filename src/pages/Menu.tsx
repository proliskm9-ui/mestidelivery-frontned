import React, { useState, useEffect, useRef } from 'react';
import { api, Restaurant, Store } from '../services/api';
import RestaurantCard from '../components/UI/RestaurantCard';
import StoreCard from '../components/UI/StoreCard';
import { useLanguage } from '../translations/LanguageContext';
import Header from '../components/UI/Header';
import FastTravelBlock from '../components/UI/FastTravelBlock';
import PromoBanner from '../components/UI/PromoBanner';
import MobileRestaurantCard from '../components/UI/MobileRestaurantCard';
import NetworkErrorState from '../components/UI/NetworkErrorState';

const CATEGORY_ICONS = [
    { key: 'fast_food', img: '/Assets/Ellipse 18.png', label: 'Фастфуд' },
    { key: 'local', img: '/Assets/Ellipse 35.png', label: 'Местная' },
    { key: 'georgian', img: '/Assets/Ellipse 33.png', label: 'Грузинская' },
    { key: 'europe', img: '/Assets/Ellipse 34.png', label: 'Европа' },
    { key: 'east', img: '/Assets/Ellipse 36.png', label: 'Восток' },
    { key: 'italy', img: '/Assets/Ellipse 37.png', label: 'Италия' },
    { key: 'japan', img: '/Assets/Ellipse 39.png', label: 'Япония' },
    { key: 'burgers', img: '/Assets/Ellipse 19.png', label: 'Бургеры' },
    { key: 'pizza', img: '/Assets/Ellipse 20.png', label: 'Пицца' },
    { key: 'shawarma', img: '/Assets/Ellipse 21.png', label: 'Шаурма' },
    { key: 'sandwiches', img: '/Assets/Ellipse 23.png', label: 'Сэндвичи' },
    { key: 'bakery', img: '/Assets/Ellipse 24.png', label: 'Выпечка' },
    { key: 'pancakes', img: '/Assets/Ellipse 25.png', label: 'Блины' },
    { key: 'desserts', img: '/Assets/Ellipse 26.png', label: 'Десерты' },
    { key: 'bbq', img: '/Assets/Ellipse 28.png', label: 'Шашлык' },
    { key: 'soups', img: '/Assets/Ellipse 30.png', label: 'Супы' },
    { key: 'coffee', img: '/Assets/Ellipse 29.png', label: 'Кофе' },
];

const RESTAURANT_TAG_DATA: Record<string, string[]> = {
    "Sunset Restaurant": ["pizza", "bakery", "bbq", "pasta", "soup", "coffee", "georgian", "local", "europe", "east", "italy", "fast_food"],
    "BBQ Garden": ["sandwiches", "bakery", "desserts", "bbq", "soup", "coffee", "georgian", "local", "europe", "fast_food"],
    "Dom Kubdari": ["bakery", "desserts", "bbq", "soup", "coffee", "georgian", "local", "east", "fast_food"],
    "sunset restaurant": ["pizza", "bakery", "bbq", "pasta", "soup", "coffee", "georgian", "local", "europe", "east", "italy", "fast_food"],
    "bbq garden": ["sandwiches", "bakery", "desserts", "bbq", "soup", "coffee", "georgian", "local", "europe", "fast_food"],
    "dom kubdari": ["bakery", "desserts", "bbq", "soup", "coffee", "georgian", "local", "east", "fast_food"],
};

const STORE_IMAGE_OVERRIDES: Record<string, string> = {
    'spar': '/Assets/Rectangle 16.png',
    'nikora': '/Assets/Rectangle 17.png',
    'magniti': '/Assets/Rectangle 20.png'
};

const SmallArrowIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M9 18l6-6-6-6"></path>
    </svg>
);


const FilterIcon = ({ isActive }: { isActive?: boolean }) => (
    <div style={{ width: '22px', height: '16px', display: 'block', backgroundColor: isActive ? 'black' : '#21EA7C', WebkitMaskImage: 'url("/Assets/b9fda91f-b6f5-4794-8bf6-c7e1d8d36805-removebg-preview 2.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
);
const StarIcon = ({ isActive }: { isActive?: boolean }) => (
    <div style={{ width: '21px', height: '21px', display: 'block', backgroundColor: isActive ? 'black' : '#21EA7C', WebkitMaskImage: 'url("/Assets/звезда-removebg-preview 4.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', transform: 'translate(2px, -1px)' }} />
);
function ChevronDownIcon({ isActive }: { isActive?: boolean }) {
    return (
        <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "black" : "#21EA7C"} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translate(-2px, 0px)', marginLeft: '0px', display: 'block' }}
        >
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    );
}
const PercentIcon = ({ isActive }: { isActive?: boolean }) => (
    <div style={{ width: '18px', height: '18px', display: 'block', backgroundColor: isActive ? 'black' : '#21EA7C', WebkitMaskImage: 'url("/Assets/d161eaa8-90e3-4bb8-9906-b7e7acdd8ab1-removebg-preview 2.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
);
const RocketIcon = ({ isActive }: { isActive?: boolean }) => (
    <div style={{ width: '32px', height: '32px', display: 'block', backgroundColor: isActive ? 'black' : '#21EA7C', WebkitMaskImage: 'url("/Assets/cae5bdc6-7aea-48e8-83f1-ddb4c1b99856-removebg-preview 2.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', marginLeft: '-1px' }} />
);

const MenuPage: React.FC<{
    onRestaurantClick: (id: string) => void;
    favorites?: string[];
    onToggleFavorite?: (id: string) => void;
    userAddress?: any;
    onUpdateAddress?: (address: any) => void;
    userProfile?: any;
    onProfileClick?: () => void;
    onOrderClick?: (id: number) => void;
    onLogout?: () => void;
    onNavigate?: (page: string) => void;
}> = ({ onRestaurantClick, favorites = [], onToggleFavorite, userAddress, onUpdateAddress, userProfile, onProfileClick, onOrderClick, onLogout, onNavigate }) => {

    const { t } = useLanguage();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [stores, setStores] = useState<Store[]>([]);

    const [activeCollection, setActiveCollection] = useState<{
        title: string,
        items: (Restaurant | Store)[],
        type: 'store' | 'restaurant',
        isMobileSource?: boolean
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategories, setActiveCategories] = useState<string[]>([]);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [fastDeliveryFilter, setFastDeliveryFilter] = useState(false);
    const [promoFilter, setPromoFilter] = useState(false);
    const [taggedRestaurants, setTaggedRestaurants] = useState<any[]>([]);
    const [isNetworkError, setIsNetworkError] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                setCanScrollLeft(scrollRef.current.scrollLeft > 0);
            }
        };

        const currentRef = scrollRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
            // Initial check
            handleScroll();
        }

        return () => {
            if (currentRef) {
                currentRef.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const scrollCategories = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const toggleCategory = (catKey: string) => {
        setActiveCategories(prev =>
            prev.includes(catKey)
                ? prev.filter(c => c !== catKey)
                : [...prev, catKey]
        );
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rests, strs] = await Promise.all([
                    api.getRestaurants(),
                    api.getStores()
                ]);
                const labeledRests = rests.map(r => {
                    const tags = RESTAURANT_TAG_DATA[r.name] || RESTAURANT_TAG_DATA[r.name.toLowerCase()] || [];
                    return { ...r, tags };
                });
                const mappedStores = strs.map(s => {
                    const key = Object.keys(STORE_IMAGE_OVERRIDES).find(name =>
                        s.name.toLowerCase().includes(name)
                    );
                    const randomRating = (4.5 + Math.random() * 0.5).toFixed(1);
                    return {
                        ...(key ? { ...s, img: STORE_IMAGE_OVERRIDES[key] } : s),
                        rating: randomRating
                    };
                });
                setRestaurants(rests);
                setTaggedRestaurants(labeledRests);
                setStores(mappedStores);
                setIsNetworkError(false);
            } catch (error) {
                console.error("Failed to load data", error);
                setIsNetworkError(true);
            }
        };
        fetchData();
    }, []);

    const [sortOption, setSortOption] = useState<'default' | 'rating' | 'delivery'>('default');

    const getSortedRestaurants = (list: any[]) => {
        let sorted = [...list];
        if (sortOption === 'rating') {
            sorted.sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
        } else if (sortOption === 'delivery') {
            sorted.sort((a, b) => parseInt(a.delivery || '999') - parseInt(b.delivery || '999'));
        }
        return sorted;
    };

    const baseFiltered = taggedRestaurants.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategories.length === 0
            ? true
            : activeCategories.some(cat => r.tags?.includes(cat));

        const rRating = parseFloat(r.rating) || 0;
        const matchesRating = ratingFilter ? rRating >= ratingFilter : true;

        let matchesDelivery = true;
        if (fastDeliveryFilter && r.delivery) {
            const times = r.delivery.match(/\d+/g);
            if (times && times.length > 0) {
                const maxTime = Math.max(...times.map(Number));
                matchesDelivery = maxTime <= 30;
            } else {
                matchesDelivery = false;
            }
        }

        const matchesPromo = promoFilter
            ? !['dom kubdari', 'дом кубдари'].includes(r.name.toLowerCase())
            : true;

        return matchesSearch && matchesCategory && matchesRating && matchesDelivery && matchesPromo;
    });

    const filteredRestaurants = getSortedRestaurants(baseFiltered);
    const worthTryingRestaurants = taggedRestaurants.filter(r =>
        ["Дом Кубдари", "BBQ Garden", "Dom Kubdari"].includes(r.name) || r.name.toLowerCase().includes('sunset')
    ).sort((a, b) => {
        const getIndex = (name: string) => {
            if (name.includes('BBQ')) return 0;
            if (name.includes('Кубдари') || name.includes('Kubdari')) return 1;
            if (name.toLowerCase().includes('sunset')) return 2;
            return 3;
        };
        return getIndex(a.name) - getIndex(b.name);
    });

    const mustTryRestaurants = [...worthTryingRestaurants].sort((a, b) => {
        const getIndex = (name: string) => {
            if (name.includes('Кубдари') || name.includes('Kubdari')) return 0;
            if (name.toLowerCase().includes('sunset')) return 1;
            if (name.includes('BBQ')) return 2;
            return 3;
        };
        return getIndex(a.name) - getIndex(b.name);
    });

    const worthTryingFiltered = worthTryingRestaurants.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const mustTryFiltered = mustTryRestaurants.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredStores = stores.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderCategorySection = (hideTitle: boolean = false) => (
        <section className="categories-section sticky-categories" style={{ padding: '10px 0', margin: hideTitle ? '0 0 14px 0' : '14px 0' }}>
            {!hideTitle && (
                <div className="section-header mobile-only" style={{ marginBottom: '16px' }}>
                    <h2>{t('menu.dish_categories')}</h2>
                </div>
            )}
            <div className="categories-wrapper">
                {canScrollLeft && (
                    <button className="cat-scroll-btn cat-scroll-left" onClick={() => scrollCategories('left')}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-1px' }}>
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                )}
                <div className="categories-scroll-area" ref={scrollRef}>
                    {CATEGORY_ICONS.map((cat, idx) => {
                        const isActive = activeCategories.includes(cat.key);
                        return (
                            <div key={idx} className="cat-item" onClick={() => toggleCategory(cat.key)}>
                                <div className="cat-icon-wrapper">
                                    <img src={cat.img} alt={cat.key} />
                                </div>
                                <span className={`cat-label ${isActive ? 'active' : ''}`} style={{ color: isActive ? '#000000' : '#fff' }}>
                                    {t(`categories.${cat.key}` as any)}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <button className="cat-scroll-btn cat-scroll-right" onClick={() => scrollCategories('right')}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '1px' }}>
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>
        </section>
    );

    const renderFiltersRow = () => (
        <section className="section filters-row" style={{ margin: '-5px 0 20px 0', position: 'relative', zIndex: showFilterModal ? 1000 : 10 }}>
            <div className="horizontal-scroll">
                <button className="filter-pill icon-only" onClick={() => {
                    setShowFilterModal(!showFilterModal);
                    if (showRatingModal) setShowRatingModal(false);
                }}>
                    <FilterIcon />
                </button>
                <button className={`filter-pill rating-pill ${ratingFilter ? 'active' : ''}`} onClick={() => {
                    setShowRatingModal(!showRatingModal);
                    if (showFilterModal) setShowFilterModal(false);
                }}>
                    <StarIcon isActive={ratingFilter !== null} /> <span>{t('menu.rating')}</span> <ChevronDownIcon isActive={ratingFilter !== null} />
                </button>
                <button
                    className={`filter-pill rocket-pill ${fastDeliveryFilter ? 'active' : ''}`}
                    onClick={() => setFastDeliveryFilter(!fastDeliveryFilter)}
                >
                    <RocketIcon isActive={fastDeliveryFilter} /> <span style={{ marginLeft: '-9px' }}>{t('menu.under_30_min')}</span>
                </button>
                <button
                    className={`filter-pill ${promoFilter ? 'active' : ''}`}
                    onClick={() => setPromoFilter(!promoFilter)}
                >
                    <PercentIcon isActive={promoFilter} /> <span>{t('menu.promotions')}</span>
                </button>
            </div>
            {showFilterModal && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowFilterModal(false)} />
                    <div className="filter-popover" style={{
                        position: 'absolute', top: '55px', left: '0', width: '320px', background: '#2C2C2E',
                        borderRadius: '16px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        zIndex: 100, border: '1px solid #3A3A3C'
                    }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0', color: 'white' }}>{t('menu.sort_by')}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {(['default', 'rating', 'delivery'] as const).map((id) => {
                                const labels = { 
                                    default: t('menu.sort_options.default'), 
                                    rating: t('menu.sort_options.rating'), 
                                    delivery: t('menu.sort_options.delivery') 
                                };
                                return (
                                    <div key={id} onClick={() => setSortOption(id)} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px 0', cursor: 'pointer', borderBottom: id !== 'delivery' ? '1px solid #3A3A3C' : 'none'
                                    }}>
                                        <span style={{ fontSize: '1rem', fontWeight: 500, color: '#E5E5E7' }}>{labels[id]}</span>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%', background: sortOption === id ? '#21EA7C' : '#3A3A3C',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {sortOption === id && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button style={{
                            marginTop: '20px', width: '100%', padding: '14px', background: '#21EA7C', color: 'black', border: 'none',
                            borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'filter 0.2s'
                        }} onClick={() => setShowFilterModal(false)} onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}>
                            {t('menu.show_results')}
                        </button>
                    </div>
                </>
            )}

            {showRatingModal && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowRatingModal(false)} />
                    <div className="filter-popover" style={{
                        position: 'absolute', top: '55px', left: '0', width: '320px', background: '#2C2C2E',
                        borderRadius: '16px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        zIndex: 100, border: '1px solid #3A3A3C'
                    }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0', color: 'white' }}>{t('menu.rating')}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {([null, 4.9, 4.7, 4.5] as const).map((val) => {
                                const isActive = ratingFilter === val;
                                const label = val === null ? t('menu.sort_options.default') : `${t('menu.not_lower_than')} ${val}`;
                                return (
                                    <div key={val || 'any'} onClick={() => setRatingFilter(val)} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px 0', cursor: 'pointer', borderBottom: val !== 4.5 ? '1px solid #3A3A3C' : 'none'
                                    }}>
                                        <span style={{ fontSize: '1rem', fontWeight: 500, color: '#E5E5E7' }}>{label}</span>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%', background: isActive ? '#21EA7C' : '#3A3A3C',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {isActive && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button style={{
                            marginTop: '20px', width: '100%', padding: '14px', background: '#21EA7C', color: 'black', border: 'none',
                            borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'filter 0.2s'
                        }} onClick={() => setShowRatingModal(false)} onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}>
                            {t('menu.apply')}
                        </button>
                    </div>
                </>
            )}
        </section>
    );

    const renderRestaurantGrid = (items: any[]) => (
        <>
            <section className="section">
                <div className="vertical-grid">
                    {items.map(item => (
                        <RestaurantCard
                            key={item.id}
                            item={item}
                            onClick={() => onRestaurantClick(item.id)}
                            isVertical
                            isFavorite={favorites.includes(item.id)}
                            onToggleFavorite={() => onToggleFavorite && onToggleFavorite(item.id)}
                        />
                    ))}
                </div>
            </section>
            {activeCategories.length > 0 && items.length === 0 && (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>
                    <img src="/Assets/избранное.png" alt="Empty" style={{ width: '200px', height: 'auto', opacity: 0.5, marginBottom: '20px' }} />
                    <h3>{t('menu.category_empty')}</h3>
                    <p>{t('menu.try_another')}</p>
                </div>
            )}
        </>
    );

    return (
        <div className="menu-page">
            <Header
                onLogoClick={() => setActiveCollection(null)}
                userAddress={userAddress}
                onUpdateAddress={onUpdateAddress}
                userProfile={userProfile}
                onProfileClick={() => {
                    if (onProfileClick) onProfileClick();
                }}
                onOrderClick={onOrderClick}
                onLogout={onLogout}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showSearch={activeCollection?.title !== t('menu.stores') && activeCollection?.title !== 'Продукты'}
                onNavigate={onNavigate}
            />

            <div className="menu-container">
                {activeCollection ? (
                    <div className="screen" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'var(--bg)', zIndex: 99999, overflowY: 'auto' }}>
                        <div style={{
                            position: 'fixed',
                            top: '-100px',
                            right: '-50px',
                            width: '300px',
                            height: '300px',
                            background: 'radial-gradient(circle, rgba(33, 234, 124, 0.15) 0%, transparent 70%)',
                            borderRadius: '50%',
                            zIndex: 0,
                            pointerEvents: 'none'
                        }}></div>
                        <header style={{
                            position: 'relative',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            padding: 'calc(24px + env(safe-area-inset-top, 0px)) 20px 2px 20px',
                            justifyContent: 'space-between'
                        }}>
                            <div className="mp-back-btn" onClick={() => setActiveCollection(null)} style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(15px)',
                                WebkitBackdropFilter: 'blur(15px)',
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                cursor: 'pointer'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                                </svg>
                            </div>
                            <h1 style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                margin: 0,
                                color: 'white',
                                fontFamily: 'Inter, sans-serif',
                                textTransform: 'uppercase'
                            }}>
                                {activeCollection.title === 'Рестораны' ? t('menu.restaurants') : 
                                 activeCollection.title === 'Акции' ? t('menu.promotions') : 
                                 activeCollection.title === 'Продукты' || activeCollection.title === t('menu.stores') ? t('menu.stores') : 
                                 activeCollection.title}
                            </h1>
                            <div style={{ width: '44px' }}></div>
                        </header>
                        {activeCollection.title === 'Рестораны' ? (
                            <div className="content-pad" style={{ paddingTop: '0px' }}>
                                {renderCategorySection(true)}
                                {renderFiltersRow()}
                                {renderRestaurantGrid(filteredRestaurants)}
                            </div>
                        ) : activeCollection.title === 'Акции' || activeCollection.title === 'Популярное' || activeCollection.title === t('menu.must_try') || activeCollection.title === t('menu.worth_trying') ? (
                            <div className="content-pad" style={{ paddingTop: '25px' }}>
                                {renderRestaurantGrid(activeCollection.items)}
                            </div>
                        ) : activeCollection.title === 'Продукты' ? (
                            <div className="content-pad" style={{ paddingTop: '25px' }}>
                                <PromoBanner onFirstBannerClick={() => {
                                    setActiveCollection({
                                        title: 'Рестораны',
                                        items: taggedRestaurants,
                                        type: 'restaurant',
                                        isMobileSource: true
                                    });
                                }} />

                                <div className="search-pill" style={{ marginTop: '5px', marginBottom: '34px', display: 'flex' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.9 }}>
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder={t('menu.search_stores_placeholder')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ width: '100%', fontSize: '1.1rem', fontWeight: 500, background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                                    />
                                </div>

                                <section className="section popular-stores-collection" id="worth-trying-section">
                                    <div className="section-header">
                                        <h2>{t('menu.popular_stores')}</h2>
                                        <button className="see-all" onClick={() => setActiveCollection({ title: t('menu.popular_stores'), items: filteredStores, type: 'store', isMobileSource: true })}>
                                            <span>{t('menu.all')}</span>
                                            <span><SmallArrowIcon /></span>
                                        </button>
                                    </div>
                                    <div className="horizontal-scroll section-fade-edges">
                                        {filteredStores.map((store) => (
                                            <RestaurantCard
                                                key={store.id}
                                                item={store as any}
                                                onClick={() => onRestaurantClick(store.id)}
                                                isFavorite={favorites.includes(store.id)}
                                                onToggleFavorite={() => onToggleFavorite && onToggleFavorite(store.id)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="allRestaurantsList" style={{ padding: '0 16px', paddingBottom: '100px' }}>
                                {activeCollection.items.map((item: any) => (
                                    <MobileRestaurantCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => onRestaurantClick(item.id)}
                                        isFavorite={favorites.includes(item.id)}
                                        onToggleFavorite={() => onToggleFavorite && onToggleFavorite(item.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : isNetworkError && restaurants.length === 0 ? (
                    <NetworkErrorState />
                ) : (
                    <div className="content-pad">
                        <PromoBanner onFirstBannerClick={() => {
                            setActiveCollection({
                                title: 'Рестораны',
                                items: taggedRestaurants,
                                type: 'restaurant',
                                isMobileSource: true
                            });
                        }} />
                        <FastTravelBlock onNavigate={(tab) => {
                            if (tab === 'shops') {
                                setActiveCollection({
                                    title: t('menu.stores'),
                                    items: stores,
                                    type: 'store',
                                    isMobileSource: true
                                });
                            } else if (tab === 'restaurants') {
                                setActiveCollection({
                                    title: t('menu.restaurants'),
                                    items: taggedRestaurants,
                                    type: 'restaurant',
                                    isMobileSource: true
                                });
                            } else if (tab === 'promos') {
                                const promoItems = taggedRestaurants
                                    .filter(i => !['dom kubdari', 'дом кубдари'].includes(i.name.toLowerCase()))
                                    .map(i => ({ ...i, promo: t('menu.promo_first_order') }));

                                setActiveCollection({
                                    title: t('menu.promotions'),
                                    items: promoItems,
                                    type: 'restaurant',
                                    isMobileSource: true
                                });
                            }
                        }} />

                        {/* Promotions */}
                        <section className="section desktop-only">
                            <div className="section-header">
                                <h2>{t('menu.promotions')}</h2>
                            </div>
                            <div className="horizontal-scroll section-fade-edges" style={{ gap: '24px' }}>
                                {restaurants
                                    .filter(r => r.name.toLowerCase().includes('sunset'))
                                    .slice(0, 1)
                                    .map((item, index) => (
                                        <RestaurantCard
                                            key={`promo-${item.id}-${index}`}
                                            item={{ ...item, promo: t('menu.promo_first_order') }}
                                            onClick={() => onRestaurantClick(item.id)}
                                            isFavorite={favorites.includes(item.id)}
                                            onToggleFavorite={() => onToggleFavorite && onToggleFavorite(item.id)}
                                        />
                                    ))
                                }
                            </div>
                        </section>

                        {/* Stores */}
                        <section className="section desktop-only" id="stores-section">
                            <div className="section-header">
                                <h2>{t('menu.stores')}</h2>
                                <button className="see-all" onClick={() => setActiveCollection({ title: t('menu.stores'), items: filteredStores, type: 'store', isMobileSource: true })}>
                                    <span>{t('menu.all')}</span>
                                    <span><SmallArrowIcon /></span>
                                </button>
                            </div>
                            <div className="horizontal-scroll section-fade-edges">
                                {filteredStores.map((store) => (
                                    <StoreCard
                                        key={store.id}
                                        item={store}
                                        onClick={() => onRestaurantClick(store.id)}
                                        isFavorite={favorites.includes(store.id)}
                                        onToggleFavorite={() => onToggleFavorite && onToggleFavorite(store.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Must Try (Mobile Only) */}
                        <section className="section mobile-only" id="must-try-section">
                            <div className="section-header">
                                <h2>{t('menu.must_try')}</h2>
                                <button className="see-all" onClick={() => setActiveCollection({ title: t('menu.must_try'), items: mustTryFiltered, type: 'restaurant', isMobileSource: true })}>
                                    <span>{t('menu.all')}</span>
                                    <span><SmallArrowIcon /></span>
                                </button>
                            </div>
                            <div className="horizontal-scroll section-fade-edges">
                                {mustTryFiltered.map(item => (
                                    <RestaurantCard
                                        key={`must-try-${item.id}`}
                                        item={item}
                                        onClick={() => onRestaurantClick(item.id)}
                                        isFavorite={favorites.includes(item.id)}
                                        onToggleFavorite={() => onToggleFavorite && onToggleFavorite(item.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Worth Trying */}
                        <section className="section" id="worth-trying-section">
                            <div className="section-header">
                                <h2>{t('menu.worth_trying')}</h2>
                                <button className="see-all" onClick={() => setActiveCollection({ title: t('menu.worth_trying'), items: worthTryingFiltered, type: 'restaurant', isMobileSource: true })}>
                                    <span>{t('menu.all')}</span>
                                    <span><SmallArrowIcon /></span>
                                </button>
                            </div>
                            <div className="horizontal-scroll section-fade-edges">
                                {worthTryingFiltered.map(item => (
                                    <RestaurantCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => onRestaurantClick(item.id)}
                                        isFavorite={favorites.includes(item.id)}
                                        onToggleFavorite={() => onToggleFavorite && onToggleFavorite(item.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Extracted Render Sections for Main View */}
                        {renderCategorySection(false)}
                        {renderFiltersRow()}
                        {renderRestaurantGrid(filteredRestaurants)}
                    </div>
                )}
            </div>


            <style>{`
                /* Global Dark Theme */
                .menu-page {
                    background-color: var(--bg);
                    min-height: 100vh;
                    color: white;
                    font-family: 'Segoe UI', sans-serif;
                }
                .content-pad { padding: 32px 24px; padding-bottom: 120px; max-width: 1600px; margin: 0 auto; }
                /* --- Categories Section --- */
                .sticky-categories {
                    position: relative;
                    /* Removed sticky behavior according to user request */
                    z-index: 95;
                }
                .categories-section {
                    padding: 0; overflow: visible;
                }
                .categories-wrapper {
                    position: relative; /* anchor for absolute arrows */
                    overflow: visible;
                }
                .cat-item {
                    display: flex; flex-direction: column; align-items: center; gap: 12px;
                    width: 100px; min-width: 100px; flex-shrink: 0; cursor: pointer;
                }
                .categories-scroll-area {
                    display: flex; gap: 24px; overflow-x: auto; align-items: flex-start;
                    padding: 0; /* no extra padding — parent content-pad handles alignment */
                    scrollbar-width: none; -ms-overflow-style: none;
                    -webkit-overflow-scrolling: touch;
                }
                .categories-scroll-area::-webkit-scrollbar { display: none; }

                /* Scroll arrow buttons */
                .cat-scroll-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-70%); /* vertically center on images, slightly above center because label is below */
                    width: 42px; height: 42px;
                    border-radius: 50%;
                    background: rgba(33, 234, 124, 0.75);
                    border: none;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: background 0.2s, transform 0.2s;
                }
                .cat-scroll-left { left: 0px; }
                .cat-scroll-right { right: 0px; }
                .cat-scroll-btn:hover { background: rgba(33, 234, 124, 1); }

                .section-fade-edges {
                     mask-image: linear-gradient(to right, black 95%, transparent);
                     -webkit-mask-image: linear-gradient(to right, black 95%, transparent);
                }
                .horizontal-scroll::-webkit-scrollbar {
                    height: 8px;
                }
                .horizontal-scroll::-webkit-scrollbar-track {
                    background: #111; border-radius: 4px;
                }
                .horizontal-scroll::-webkit-scrollbar-thumb {
                    background: #444; border-radius: 4px;
                }
                .horizontal-scroll::-webkit-scrollbar-thumb:hover {
                    background: #666;
                }
                .cat-item {
                    display: flex; flex-direction: column; align-items: center; gap: 0px; cursor: pointer;
                }
                .cat-icon-wrapper {
                    width: 90px; height: 90px;
                    border-radius: 50%; overflow: hidden;
                }
                .cat-icon-wrapper img { width: 100%; height: 100%; object-fit: cover; }
                .cat-label { 
                    font-size: 1rem; color: #fff; font-weight: 500; text-align: center; line-height: 1.2;
                    white-space: normal; width: 100%; margin-top: 4px;
                }
                .section { margin-bottom: 60px; position: relative; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .section-header h2 { 
                    font-size: 22px; 
                    margin: 0; 
                    font-weight: 800; 
                    font-family: 'Inter', sans-serif;
                    color: #FFFFFF;
                    text-transform: none;
                }
                .see-all { 
                    background: rgba(30, 30, 30, 0.4);
                    backdrop-filter: blur(12px) saturate(180%);
                    -webkit-backdrop-filter: blur(12px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.05); 
                    color: #21EA7C; padding: 0; border-radius: 20px; 
                    cursor: pointer; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center;
                    width: 48px; height: 26px; flex-shrink: 0;
                    margin-right: 0px; transform: translateY(-1px);
                    opacity: 1 !important;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease-out;
                }
                .see-all:active {
                    transform: scale(0.96) translateY(-1px);
                    background: rgba(40, 40, 40, 0.6);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .see-all span:first-child,
                #must-try-section .see-all span:first-child,
                #worth-trying-section .see-all span:first-child,
                #stores-section .see-all span:first-child {
                    margin-left: 6px;
                    transform: translateY(-0.5px) !important;
                    display: inline-block;
                }
                .see-all span:last-child {
                    display: inline-block;
                    transform: rotate(0deg) scale(0.8) translateY(1.9px) !important;
                    margin-left: -1px;
                }
                #must-try-section .see-all span:last-child,
                #worth-trying-section .see-all span:last-child,
                #stores-section .see-all span:last-child {
                    display: inline-block;
                    transform: rotate(0deg) scale(0.8) translateY(1.9px) !important;
                    margin-left: -1px;
                }
                .horizontal-scroll { 
                    display: flex; gap: 24px; overflow-x: auto; padding-bottom: 15px; 
                    padding-left: 0; padding-right: 0; flex-wrap: nowrap;
                    scrollbar-width: thin; scrollbar-color: #444 #111; -webkit-overflow-scrolling: touch;
                }
                .expanded-grid {
                    display: grid !important; grid-template-columns: repeat(auto-fill, 286px);
                    gap: 24px; overflow: visible !important; flex-wrap: wrap; mask-image: none !important;
                    -webkit-mask-image: none !important;
                }
                .horizontal-scroll .rest-card { min-width: 361px; max-width: 361px; flex-shrink: 0; }
                .store-card { min-width: 361px; max-width: 361px; cursor: pointer; flex-shrink: 0; }
                .store-bg {
                    height: 182px; width: 361px; border-radius: 25px !important; margin-bottom: 4px;
                    background-size: cover; background-position: center; overflow: hidden; border: none; display: block;
                }
                .store-name { font-weight: 600; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .store-meta { font-size: 0.85rem; color: #21EA7C; }
                .discount-card {
                    min-width: 361px; height: 182px; border-radius: 24px; position: relative; overflow: hidden;
                    flex-shrink: 0; cursor: pointer;
                }
                .discount-bg {
                    width: 100%; height: 100%; background-size: cover; background-position: center; transition: transform 0.5s;
                }
                .discount-card:hover .discount-bg { transform: scale(1.05); }
                .discount-overlay {
                    position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, transparent 100%);
                }
                .discount-content {
                    position: absolute; top: 24px; left: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px;
                }
                .discount-tag {
                    align-self: flex-start; padding: 6px 14px; border-radius: 10px; color: black; font-weight: 700; font-size: 0.9rem;
                }
                .discount-content h4 { margin: 0; font-size: 1.6rem; line-height: 1.1; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
                .vertical-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, 361px); gap: 30px;
                }
                .rest-card { cursor: pointer; }
                .rest-img {
                    height: 182px; width: 361px; border-radius: 25px !important;
                    background-size: cover; background-position: center; margin-bottom: 4px;
                    overflow: hidden; transform: translateZ(0);
                }
                .rest-details h3 { margin: 0; font-size: 1.2rem; font-weight: 700; }
                .rest-sub { display: flex; gap: 2px; color: #21EA7C; font-size: 1rem; align-items: center; }
                .rest-meta-content { display: flex; gap: 10px; align-items: center; }
                .rest-sub span.separator { color: rgba(255, 255, 255, 0.85); }
                .rest-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
                .rest-rating { color: #21EA7C; font-weight: 500; font-size: 1rem; transform: translateY(-3px); margin-right: 15px; }
                .rest-img { position: relative; }

                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8); z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                }
                .map-modal-content {
                    background: #222; padding: 24px; border-radius: 24px; width: 90%; max-width: 600px;
                    display: flex; flex-direction: column; gap: 20px;
                }
                .close-btn {
                    padding: 12px; background: #21EA7C; color: black; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;
                }
                @media (max-width: 768px) {
                    .cat-scroll-btn {
                        display: none !important;
                    }
                    .content-pad { padding: 16px; padding-top: calc(160px + env(safe-area-inset-top, 0px)); padding-bottom: 100px; }
                    .categories-layout {
                        gap: 10px; margin: 20px 0;
                    }
                    .static-filter { min-width: 70px; width: 70px; margin-right: 5px; }
                    .cat-icon-filter { width: 70px; height: 70px; }
                    .cat-label { font-family: 'Inter', sans-serif !important; font-size: 13px !important; font-weight: 500 !important; margin-top: -2px !important; color: #fff !important; opacity: 0.85 !important; position: relative; z-index: 2; }
                    .cat-item { width: 90px !important; min-width: 90px !important; gap: 0 !important; }
                    .cat-icon-wrapper { width: 96px !important; height: 96px !important; margin-bottom: 0 !important; position: relative; z-index: 1; }
                    .categories-scroll-area { 
                        gap: 6px !important; 
                        padding-left: 9px !important; 
                        padding-right: 16px !important; 
                        margin-left: -16px !important; 
                        margin-right: -16px !important; 
                    }
                    .filters-row .horizontal-scroll {
                        gap: 7px !important;
                    }
                    .vertical-grid {
                        grid-template-columns: 1fr;
                    }
                    .horizontal-scroll .rest-card {
                        min-width: 286px;
                    }
                    #must-try-section,
                    #worth-trying-section {
                        margin-bottom: 15px !important; /* Reduced space between collections */
                    }
                    #must-try-section .section-header,
                    #worth-trying-section .section-header {
                        margin-bottom: 20px !important;
                    }
                    #must-try-section .horizontal-scroll,
                    #worth-trying-section .horizontal-scroll {
                        gap: 10px !important;
                        padding-left: 16px !important;
                        padding-right: 16px !important;
                        margin-left: -16px !important;
                        margin-right: -16px !important;
                    }
                    #must-try-section .rest-card,
                    #worth-trying-section .rest-card {
                        min-width: 286px;
                        max-width: 286px;
                    }
                    #must-try-section .rest-img,
                    #worth-trying-section .rest-img {
                        width: 286px;
                        height: 142px;
                        border-radius: 25px !important;
                        overflow: hidden; transform: translateZ(0);
                    }
                    .vertical-grid .rest-img {
                        border-radius: 25px !important;
                        overflow: hidden; transform: translateZ(0);
                    }
                    #must-try-section .fav-btn,
                    #worth-trying-section .fav-btn,
                    .vertical-grid .fav-btn {
                        width: 32px !important;
                        height: 32px !important;
                        top: 8px !important;
                        right: 8px !important;
                        background: #21EA7C !important;
                    }
                    #must-try-section .fav-btn svg,
                    /* --- Small Collection Cards (Must Try / Worth Trying) --- */
                    #must-try-section .fav-btn,
                    #worth-trying-section .fav-btn {
                        width: 32px !important;
                        height: 32px !important;
                        top: 8px !important;
                        right: 8px !important;
                        background: #21EA7C !important;
                    }
                    #must-try-section .fav-btn svg,
                    #worth-trying-section .fav-btn svg {
                        width: 20px !important;
                        height: 20px !important;
                        stroke: black !important;
                    }
                    #must-try-section .rest-details,
                    #worth-trying-section .rest-details {
                        margin-top: 0 !important;
                        position: relative !important;
                    }
                    #must-try-section .rest-header-row,
                    #worth-trying-section .rest-header-row {
                        align-items: flex-start !important;
                        margin-bottom: 0 !important;
                    }
                    #must-try-section .rest-details h3,
                    #worth-trying-section .rest-details h3 {
                        font-family: 'Inter', sans-serif !important;
                        font-size: 15px !important;
                        font-weight: 700 !important;
                        line-height: 10px !important;
                        color: #FFFFFF !important;
                        margin: 11px 0 0 5px !important;
                        padding: 0 !important;
                    }
                    #must-try-section .rest-rating,
                    #worth-trying-section .rest-rating {
                        font-size: 13px !important;
                        font-weight: 400 !important;
                        line-height: 15px !important;
                        color: #21EA7C !important;
                        transform: translateY(-1px) !important;
                        position: absolute !important;
                        top: 7px !important;
                        right: 5px !important;
                        margin: 0 !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 2px !important;
                    }
                    #must-try-section .rest-rating .star-icon,
                    #worth-trying-section .rest-rating .star-icon {
                        font-size: 12px !important;
                        line-height: 12px !important;
                        transform: translateY(0px) !important;
                    }
                    #must-try-section .rest-sub,
                    #worth-trying-section .rest-sub {
                        margin-top: 7px !important;
                        margin-left: 0 !important;
                        padding-left: 22px !important; 
                        position: relative !important;
                        min-height: 16px !important;
                        display: flex !important;
                        align-items: center !important;
                    }
                    #must-try-section .rest-sub img,
                    #worth-trying-section .rest-sub img {
                        position: absolute !important;
                        left: 5px !important;
                        width: 16px !important;
                        height: 16px !important;
                        object-fit: contain !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                    }
                    #must-try-section .rest-sub .rest-meta-content span,
                    #worth-trying-section .rest-sub .rest-meta-content span {
                        font-family: 'Inter', sans-serif !important;
                        font-size: 12px !important;
                        font-weight: 400 !important;
                        line-height: 13px !important;
                        color: #21EA7C !important;
                        display: inline-block !important;
                        transform: translateY(0px) !important;
                    }

                    /* --- Large Vertical Grid Cards (All Restaurants) --- */
                    .vertical-grid .fav-btn {
                        width: 38px !important;
                        height: 38px !important;
                        top: 10px !important;
                        right: 10px !important;
                        background: #21EA7C !important;
                    }
                    .vertical-grid .fav-btn svg {
                        width: 24px !important;
                        height: 24px !important;
                        stroke: black !important;
                    }
                    .vertical-grid .rest-details {
                        margin-top: 0 !important;
                        position: relative !important;
                    }
                    .vertical-grid .rest-header-row {
                        align-items: flex-start !important;
                        margin-bottom: 0 !important;
                    }
                    .vertical-grid .rest-details h3 {
                        font-family: 'Inter', sans-serif !important;
                        font-size: 16px !important;
                        font-weight: 800 !important;
                        line-height: 16px !important;
                        color: #FFFFFF !important;
                        margin: 7px 0 0 5px !important;
                        padding: 0 !important;
                    }
                    .vertical-grid .rest-rating {
                        font-size: 15px !important;
                        font-weight: 500 !important;
                        line-height: 17px !important;
                        color: #21EA7C !important;
                        position: absolute !important;
                        top: 6px !important;
                        right: 5px !important;
                        margin: 0 !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 3px !important;
                        transform: translateY(-2px) !important;
                    }
                    .vertical-grid .rest-rating .star-icon {
                        font-size: 14px !important;
                        line-height: 14px !important;
                        transform: translateY(0px) !important; /* Offset parent's extra -1px Y */
                    }
                    .vertical-grid .rest-sub {
                        margin-top: 6px !important;
                        margin-left: 0 !important;
                        padding-left: 27px !important; 
                        position: relative !important;
                        min-height: 20px !important;
                        display: flex !important;
                        align-items: center !important;
                    }
                    .vertical-grid .rest-sub img {
                        position: absolute !important;
                        left: 5px !important;
                        width: 20px !important;
                        height: 20px !important;
                        object-fit: contain !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                    }
                    .vertical-grid .rest-sub .rest-meta-content span {
                        font-family: 'Inter', sans-serif !important;
                        font-size: 14px !important;
                        font-weight: 500 !important;
                        line-height: 14px !important;
                        color: #21EA7C !important;
                        display: inline-block !important;
                        transform: translateY(0) !important;
                    }
                    .expanded-grid {
                        grid-template-columns: repeat(auto-fill, minmax(286px, 1fr));
                        gap: 20px;
                    }
                }

                .filters-row .horizontal-scroll {
                    overflow-x: auto; padding: 10px 16px; margin: -10px -16px 0 -16px;
                    scrollbar-width: none; -ms-overflow-style: none;
                    display: flex; gap: 12px; align-items: center; justify-content: flex-start;
                }
                @media (min-width: 769px) {
                    .filters-row .horizontal-scroll {
                        padding: 10px 24px; margin: -10px -24px 0 -24px;
                    }
                }
                .filter-pill {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
                    /* Removed backdrop-filter to make it solid */
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-top: 1px solid rgba(255, 255, 255, 0.12);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.2);
                    border-radius: 50px;
                    padding: 8px 16px;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    color: #21EA7C; font-size: 0.95rem; font-weight: 500;
                    cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    white-space: nowrap;
                    height: 48px;
                    flex-shrink: 0;
                    box-shadow:
                        inset 0 2px 4px rgba(255, 255, 255, 0.03),
                        0 4px 10px rgba(0, 0, 0, 0.4); 
                }
                .filter-pill span { transform: translateY(-1px); line-height: 1; } 
                .filter-pill:hover, .filter-pill:active { 
                    transform: scale(0.96);
                    box-shadow:
                        inset 0 2px 4px rgba(255, 255, 255, 0.05),
                        0 2px 8px rgba(0, 0, 0, 0.5);
                }
                .filter-pill.active {
                    background: #21EA7C;
                    border: 1px solid #21EA7C;
                    color: black;
                }
                .filter-pill.active span {
                    color: black;
                }
                .filter-pill.rating-pill {
                    padding: 8px 12px 8px 10px; /* Reduced length but a bit wider on the right */
                }
                .filter-pill.rocket-pill {
                    padding: 8px 19px 8px 9px; /* Increased right padding further */
                }
                .filter-pill.icon-only {
                    padding: 0; width: 48px; min-width: 48px; justify-content: center; border-radius: 50%;
                }

                .cat-label { 
                    font-size: 1.1rem; color: #fff; font-weight: 600; text-align: center;
                    white-space: nowrap; margin-top: 4px;
                    display: inline-flex; align-items: center; justify-content: center;
                    line-height: normal; margin-left: auto; margin-right: auto;
                }
                .cat-label.active {
                    background: #21EA7C;
                    color: black !important;
                    padding: 4px 12px;
                    border-radius: 20px;
                    height: auto;
                    width: fit-content;
                    box-sizing: border-box;
                    font-weight: 600 !important;
                    opacity: 1 !important;
                }


            `}</style>
        </div >
    );
};

export default MenuPage;
