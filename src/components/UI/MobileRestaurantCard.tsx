import React from 'react';
import './MobileRestaurantCard.css';
import { Restaurant, Store } from '../../services/api';
import { useLanguage, formatDuration } from '../../translations/LanguageContext';

interface MobileRestaurantCardProps {
    item: Restaurant | Store;
    onClick: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

const MobileRestaurantCard: React.FC<MobileRestaurantCardProps> = ({ item, onClick, isFavorite, onToggleFavorite }) => {
    const { language } = useLanguage();
    return (
        <div className="allRestaurantCard" onClick={onClick}>
            <div className="allRestaurantPreview" style={{ backgroundImage: `url("${item.img || '/Assets/default-restaurant.png'}")` }}>
                {onToggleFavorite && (
                    <button
                        className={`allRestaurantFavorite ${isFavorite ? 'fav-active' : ''}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill={isFavorite ? "black" : "none"} stroke="black" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                )}
            </div>
            <div className="allRestaurantInfo">
                <div className="allRestaurantNameRow">
                    <span className="allRestaurantName">{item.name}</span>
                    <span className="allRestaurantRating">{(item as Restaurant).rating || '4.8'} <span style={{ fontSize: '10px', verticalAlign: 'middle', paddingBottom: '2px', display: 'inline-block' }}>★</span></span>
                </div>
                <div className="allRestaurantDelivery">
                    <img src="/Assets/ChatGPT Image 23 нояб. 2025 г., 09_04_55 1.png" alt="Person" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                    {formatDuration((item as Restaurant).delivery || '25–30 мин', language)}
                    {'promo' in item && (item as any).promo && (
                        <span style={{ marginLeft: '10px', color: '#FDC505', fontSize: '12px' }}>
                            {(item as any).promo}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileRestaurantCard;
