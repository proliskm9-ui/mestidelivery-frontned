import React, { useState, useEffect } from 'react';
import { api, Restaurant, Store } from '../services/api';
import { useLanguage } from '../translations/LanguageContext';
import RestaurantCard from '../components/UI/RestaurantCard';
import StoreCard from '../components/UI/StoreCard';
import FullPageLoader from '../components/UI/FullPageLoader';
import NetworkErrorState from '../components/UI/NetworkErrorState';

interface FavoritesPageProps {
    favorites: string[];
    onRestaurantClick: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onNavigate?: (page: string) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ favorites, onRestaurantClick, onToggleFavorite, onNavigate }) => {
    const { t } = useLanguage();
    const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
    const [allStores, setAllStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [searchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'restaurants' | 'stores'>('restaurants');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rests, strs] = await Promise.all([
                    api.getRestaurants(),
                    api.getStores()
                ]);
                setAllRestaurants(rests);
                setAllStores(strs);
                setIsNetworkError(false);
            } catch (error) {
                console.error("Failed to load data", error);
                setIsNetworkError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const favoriteRestaurants = allRestaurants.filter(r =>
        favorites.includes(r.id) &&
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const favoriteStores = allStores.filter(s =>
        favorites.includes(s.id) &&
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalFavoritesCount = favorites.length;

    if (loading) return <FullPageLoader variant="list" />;
    if (isNetworkError) return <NetworkErrorState />;

    if (totalFavoritesCount === 0) {
        return (
            <div style={{ color: 'white', padding: '40px 40px 80px 40px', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: '80px' }}>
                <button
                    onClick={() => onNavigate && onNavigate('menu')}
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

                <img src="/Assets/избранное.png" alt="Empty" style={{ width: '280px', height: '195px', marginBottom: '24px', objectFit: 'contain' }} />

                <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '16px', lineHeight: '22px', color: '#FFFFFF', margin: '0 0 8px 0', opacity: 1, textTransform: 'none', letterSpacing: 'normal' }}>
                    {t('favorites.empty_subtitle')}
                </h2>
                <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '22px', color: '#B5B5B5', margin: '0 0 0 0', opacity: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{t('favorites.empty_desc_1')}</span>
                    <span style={{ whiteSpace: 'nowrap' }}>{t('favorites.empty_desc_2')}</span>
                </div>

                <button
                    onClick={() => onNavigate && onNavigate('menu')}
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
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                    onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                    onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    {t('cart.go_to_restaurants')}
                </button>
            </div>
        );
    }

    const currentItems = activeTab === 'restaurants' ? favoriteRestaurants : favoriteStores;
    const noResults = currentItems.length === 0 && totalFavoritesCount > 0;

    return (
        <div className="favorites-page-container">
            <header style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                padding: 'calc(24px + env(safe-area-inset-top, 0px)) 20px 2px 20px',
                justifyContent: 'center',
                marginBottom: '20px'
            }}>
                {/* Back button */}
                <div style={{ position: 'absolute', left: '20px', display: 'flex' }}>
                    <div onClick={() => onNavigate && onNavigate('menu')} style={{
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
                </div>
                <h1 style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    margin: 0,
                    color: 'white',
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase',
                    textAlign: 'center'
                }}>
                    {t('favorites.title')}
                </h1>
            </header>

            {/* Category Toggle */}
            <div style={{ padding: '0 20px', marginTop: '25px', marginBottom: '24px' }}>
                <div className="fav-segment-toggle">
                    <div
                        className="fav-segment-indicator"
                        style={{ transform: activeTab === 'restaurants' ? 'translateX(0)' : 'translateX(100%)' }}
                    />
                    <button
                        className={`fav-segment-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
                        onClick={() => setActiveTab('restaurants')}
                    >
                        {t('favorites.restaurants')}
                    </button>
                    <button
                        className={`fav-segment-btn ${activeTab === 'stores' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stores')}
                    >
                        {t('favorites.stores')}
                    </button>
                </div>
            </div>

            {/* Cards list */}
            <div className="favorites-content" style={{ padding: '0 16px' }}>
                {activeTab === 'restaurants' && favoriteRestaurants.length > 0 && (
                    <div className="fav-vertical-grid">
                        {favoriteRestaurants.map((item) => (
                            <RestaurantCard
                                key={item.id}
                                item={item}
                                isVertical
                                onClick={() => onRestaurantClick(item.id)}
                                isFavorite={favorites.includes(item.id)}
                                onToggleFavorite={() => onToggleFavorite && onToggleFavorite(item.id)}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'stores' && favoriteStores.length > 0 && (
                    <div className="fav-vertical-grid">
                        {favoriteStores.map((item) => (
                            <StoreCard
                                key={item.id}
                                item={item}
                                onClick={() => onRestaurantClick(item.id)}
                                isFavorite={true}
                                onToggleFavorite={() => onToggleFavorite && onToggleFavorite(item.id)}
                            />
                        ))}
                    </div>
                )}

                {noResults && (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#666' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                            {activeTab === 'restaurants' ? '🍽️' : '🏪'}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#888' }}>
                            {searchQuery
                                ? t('favorites.no_results')
                                : activeTab === 'restaurants'
                                    ? t('favorites.no_restaurants')
                                    : t('favorites.no_stores')
                            }
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .favorites-page-container {
                    padding-bottom: 120px;
                    min-height: 100vh;
                    background-color: var(--bg);
                    font-family: 'Segoe UI', sans-serif;
                    color: white;
                }

                /* ===== Category Toggle ===== */
                .fav-segment-toggle {
                    display: flex;
                    position: relative;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 50px;
                    padding: 4px;
                    gap: 0;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    height: 48px;
                    align-items: center;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                }
                .fav-segment-indicator {
                    position: absolute;
                    top: 4px;
                    left: 4px;
                    width: calc(50% - 4px);
                    height: calc(100% - 8px);
                    background: #21EA7C;
                    border-radius: 40px;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    z-index: 0;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                .fav-segment-btn {
                    flex: 1;
                    position: relative;
                    z-index: 1;
                    background: none;
                    border: none;
                    height: 100%;
                    font-family: 'Inter', sans-serif;
                    font-size: 15px;
                    font-weight: 600;
                    color: #21EA7C;
                    cursor: pointer;
                    transition: color 0.3s ease;
                    border-radius: 40px;
                    -webkit-tap-highlight-color: transparent;
                }
                .fav-segment-btn.active {
                    color: #000000;
                }

                /* ===== Vertical Grid for Cards ===== */
                .fav-vertical-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0;
                }

                @media (min-width: 1025px) {
                    .favorites-page-container {
                        max-width: 1400px;
                        margin: 0 auto;
                        padding: 24px 24px 120px;
                    }
                    .favorites-content {
                        padding: 0 !important;
                    }
                    .fav-vertical-grid {
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 30px;
                    }
                    .fav-vertical-grid .rest-card,
                    .fav-vertical-grid .store-card {
                        margin-bottom: 0;
                    }
                    .fav-vertical-grid .rest-img,
                    .fav-vertical-grid .store-bg {
                        height: auto;
                        aspect-ratio: 2 / 1;
                    }
                }

                /* Restaurant card styling — matches menu large cards (small + ~12%) */
                .fav-vertical-grid .rest-card {
                    cursor: pointer;
                    margin-bottom: 18px;
                }
                .fav-vertical-grid .rest-img {
                    width: 100%;
                    height: auto;
                    aspect-ratio: 286 / 160;
                    border-radius: 25px !important;
                    background-size: cover;
                    background-position: center;
                    margin-bottom: 4px;
                    position: relative;
                    overflow: hidden;
                    transform: translateZ(0);
                }
                .fav-vertical-grid .fav-btn {
                    width: 34px !important;
                    height: 34px !important;
                    top: 8px !important;
                    right: 8px !important;
                    background: #21EA7C !important;
                }
                .fav-vertical-grid .fav-btn svg {
                    width: 21px !important;
                    height: 21px !important;
                    stroke: black !important;
                }
                .fav-vertical-grid .rest-details {
                    margin-top: 0 !important;
                    position: relative !important;
                }
                .fav-vertical-grid .rest-header-row {
                    align-items: flex-start !important;
                    margin-bottom: 0 !important;
                }
                .fav-vertical-grid .rest-details h3 {
                    font-family: 'Inter', sans-serif !important;
                    font-size: 16px !important;
                    font-weight: 700 !important;
                    line-height: 18px !important;
                    color: #FFFFFF !important;
                    margin: 10px 0 0 5px !important;
                    padding: 0 !important;
                    text-transform: uppercase;
                    max-width: calc(100% - 52px);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .fav-vertical-grid .rest-rating {
                    font-size: 14px !important;
                    font-weight: 400 !important;
                    line-height: 16px !important;
                    color: #21EA7C !important;
                    position: absolute !important;
                    top: 9px !important;
                    right: 5px !important;
                    margin: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 2px !important;
                    transform: none !important;
                }
                .fav-vertical-grid .rest-rating .star-icon {
                    font-size: 13px !important;
                    line-height: 13px !important;
                    transform: none !important;
                }
                .fav-vertical-grid .rest-sub {
                    margin-top: 6px !important;
                    margin-left: 0 !important;
                    padding-left: 24px !important;
                    position: relative !important;
                    min-height: 16px !important;
                    display: flex !important;
                    align-items: center !important;
                }
                .fav-vertical-grid .rest-sub img {
                    position: absolute !important;
                    left: 5px !important;
                    width: 17px !important;
                    height: 17px !important;
                    object-fit: contain !important;
                    top: 50% !important;
                    transform: translateY(-50%) !important;
                }
                .fav-vertical-grid .rest-sub .rest-meta-content span {
                    font-family: 'Inter', sans-serif !important;
                    font-size: 13px !important;
                    font-weight: 400 !important;
                    line-height: 14px !important;
                    color: #21EA7C !important;
                    display: inline-block !important;
                    transform: none !important;
                }

                /* Store card styling — matches menu large cards */
                .fav-vertical-grid .store-card {
                    cursor: pointer;
                    display: block;
                    margin-bottom: 18px;
                }
                .fav-vertical-grid .store-bg {
                    height: auto;
                    width: 100%;
                    aspect-ratio: 286 / 160;
                    border-radius: 25px !important;
                    margin-bottom: 4px;
                    background-size: cover;
                    background-position: center;
                    overflow: hidden;
                    border: none;
                    display: block;
                    transform: translateZ(0);
                    position: relative;
                }
                .fav-vertical-grid .store-name {
                    margin-top: 10px !important;
                    margin-left: 5px;
                    font-family: 'Inter', sans-serif !important;
                    font-weight: 700 !important;
                    font-size: 16px !important;
                    line-height: 18px !important;
                    color: #fff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    text-transform: uppercase;
                }
                .fav-vertical-grid .store-meta {
                    margin-left: 5px;
                    font-family: 'Inter', sans-serif !important;
                    font-size: 13px !important;
                    font-weight: 400 !important;
                    color: #21EA7C !important;
                    margin-top: 6px !important;
                }
            `}</style>
        </div>
    );
};

export default FavoritesPage;
