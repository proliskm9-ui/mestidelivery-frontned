import React from 'react';
import { Restaurant } from '../../services/api';
import { useLanguage, formatDuration } from '../../translations/LanguageContext';

interface RestaurantCardProps {
    item: Restaurant;
    onClick: () => void;
    isVertical?: boolean;
    isFavorite?: boolean;
    onToggleFavorite?: (e: React.MouseEvent) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ item, onClick, isVertical, isFavorite, onToggleFavorite }) => {
    const { language } = useLanguage();
    return (
        <div className={`rest-card ${isVertical ? 'rest-card-vertical' : ''}`} onClick={onClick}>
            <div className="rest-img" style={{
                backgroundImage: `url("${item.img || '/Assets/default-restaurant.png'}")`,
                transition: 'transform 0.3s ease',
                position: 'relative'
            }}>
                {onToggleFavorite && (
                    <button
                        className={`fav-btn ${isFavorite ? 'fav-active' : ''}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(e); }}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            top: '10px',
                            right: '12px',
                            padding: '0',
                            position: 'absolute',
                            border: 'none',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill={isFavorite ? "black" : "none"} stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: 'auto', pointerEvents: 'none' }}>
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="rest-details" style={{ marginTop: '0px', position: 'relative' }}>
                <div className="rest-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ margin: 0, padding: 0, lineHeight: '1.2' }}>{item.name}</h3>
                    <span className="rest-rating" style={{ fontWeight: 600 }}>
                        <span className="star-icon">★</span> {item.rating}
                    </span>
                </div>
                <div className="rest-sub" style={{ marginTop: '-4px', display: 'flex', alignItems: 'center' }}>
                    <img src="/Assets/ChatGPT Image 23 нояб. 2025 г., 09_04_55 1.png" alt="Person" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    <div className="rest-meta-content">
                        <span>{formatDuration(item.delivery || '25-35 мин', language)}</span>
                    </div>
                </div>
                {item.promo && (
                    <div style={{
                        marginTop: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: '#1F3426',
                        color: '#4AD378',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        marginLeft: '6px'
                    }}>
                        {item.promo}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantCard;
