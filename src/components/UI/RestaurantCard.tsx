import React, { useEffect, useState } from 'react';
import { useDeliveryEta } from '../../hooks/useDeliveryEta';
import { Restaurant } from '../../services/api';
import { useLanguage, formatDuration } from '../../translations/LanguageContext';
import { pickI18nText } from '../../utils/i18nContent';
import { closedBadgeText } from '../../utils/workingHours';
import './favBtn.css';
import './cardImageSkeleton.css';

interface RestaurantCardProps {
    item: Restaurant;
    onClick: () => void;
    isVertical?: boolean;
    isFavorite?: boolean;
    onToggleFavorite?: (e: React.MouseEvent) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ item, onClick, isVertical, isFavorite, onToggleFavorite }) => {
    const { language } = useLanguage();
    const eta = useDeliveryEta(String(item.id), pickI18nText(item.name, 'en'), formatDuration(item.delivery || '25-35 мин', language));
    const [imageOk, setImageOk] = useState(true);
    const hasImage = Boolean(item.img && item.img.trim());
    const showSkeleton = !hasImage || !imageOk;
    const closedText = closedBadgeText(item.working_hours, language);

    useEffect(() => {
        setImageOk(true);
    }, [item.img]);

    return (
        <div className={`rest-card ${isVertical ? 'rest-card-vertical' : ''}${closedText ? ' rest-card--closed' : ''}`} onClick={onClick}>
            <div
                className={`rest-img ${showSkeleton ? 'rest-img--skeleton' : ''}`}
                style={{ transition: 'transform 0.3s ease', position: 'relative' }}
            >
                {hasImage && imageOk && (
                    <img loading="lazy" decoding="async"
                        src={item.img}
                        alt=""
                        className="rest-img-photo"
                        onError={() => setImageOk(false)}
                    />
                )}
                {showSkeleton && <div className="card-img-skeleton" aria-hidden="true" />}
                {(item as any).promo && (
                    // Restaurant promo (admin → Promotions), shown to new customers only
                    <div className="card-promo-pill">{pickI18nText((item as any).promo, language)}</div>
                )}
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
                        type="button"
                        className={`fav-btn ${isFavorite ? 'fav-active' : ''}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(e); }}
                        aria-label="Add to favorites"
                    >
                        <svg viewBox="0 0 24 24" fill={isFavorite ? 'black' : 'none'} stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="rest-details" style={{ marginTop: '0px', position: 'relative' }}>
                <div className="rest-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <h3 style={{ margin: 0, padding: 0, lineHeight: '1.2' }}>{pickI18nText(item.name, language).replace(/Restaraunt/gi, 'Restaurant')}</h3>
                    <span className="rest-rating" style={{ fontWeight: 600 }}>
                        <span className="star-icon">★</span> {item.rating}
                    </span>
                </div>
                <div className="rest-sub" style={{ marginTop: '-4px', display: 'flex', alignItems: 'center' }}>
                    <img src="/Assets/ChatGPT Image 23 нояб. 2025 г., 09_04_55 1.png" alt="Person" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    <div className="rest-meta-content">
                        <span>{eta}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantCard;
