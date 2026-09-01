import React, { useEffect, useState } from 'react';
import './MobileRestaurantCard.css';
import { Restaurant, Store } from '../../services/api';
import { useLanguage, formatDuration } from '../../translations/LanguageContext';
import { pickI18nText } from '../../utils/i18nContent';
import { closedBadgeText } from '../../utils/workingHours';
import './cardImageSkeleton.css';

interface MobileRestaurantCardProps {
    item: Restaurant | Store;
    onClick: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

const MobileRestaurantCard: React.FC<MobileRestaurantCardProps> = ({ item, onClick, isFavorite, onToggleFavorite }) => {
    const { language } = useLanguage();
    const [imageOk, setImageOk] = useState(true);
    const hasImage = Boolean(item.img && item.img.trim());
    const showSkeleton = !hasImage || !imageOk;
    const closedText = closedBadgeText((item as Restaurant).working_hours, language);

    useEffect(() => {
        setImageOk(true);
    }, [item.img]);

    return (
        <div className={`allRestaurantCard${closedText ? ' allRestaurantCard--closed' : ''}`} onClick={onClick}>
            <div className={`allRestaurantPreview ${showSkeleton ? 'allRestaurantPreview--skeleton' : ''}`}>
                {hasImage && imageOk && (
                    <img
                        src={item.img}
                        alt=""
                        className="allRestaurantPreviewImg"
                        onError={() => setImageOk(false)}
                    />
                )}
                {showSkeleton && <div className="card-img-skeleton" aria-hidden="true" />}
                {closedText && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 8,
                            bottom: 8,
                            zIndex: 2,
                            background: 'rgba(15,17,23,0.82)',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: 8,
                            maxWidth: '90%',
                            lineHeight: 1.25,
                        }}
                    >
                        {closedText}
                    </div>
                )}
                {onToggleFavorite && (
                    <button
                        className={`allRestaurantFavorite ${isFavorite ? 'fav-active' : ''}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
                    >
                        <svg width="21" height="21" viewBox="0 0 24 24" fill={isFavorite ? "black" : "none"} stroke="black" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                )}
            </div>
                    <div className="allRestaurantInfo">
                <div className="allRestaurantNameRow">
                    <span className="allRestaurantName">{pickI18nText(item.name, language).replace(/Restaraunt/gi, 'Restaurant')}</span>
                    <span className="allRestaurantRating">
                        <span style={{ fontSize: '13px', lineHeight: '13px' }}>★</span>
                        {(item as Restaurant).rating || '4.8'}
                    </span>
                </div>
                <div className="allRestaurantDelivery">
                    <img src="/Assets/ChatGPT Image 23 нояб. 2025 г., 09_04_55 1.png" alt="" />
                    {formatDuration((item as Restaurant).delivery || '25–30 мин', language)}
                </div>
            </div>
        </div>
    );
};

export default MobileRestaurantCard;
