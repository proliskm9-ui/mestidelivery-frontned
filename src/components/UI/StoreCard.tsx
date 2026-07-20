import React, { useEffect, useState } from 'react';
import { Store } from '../../services/api';
import { useLanguage, formatDuration } from '../../translations/LanguageContext';
import './favBtn.css';
import './StoreCard.css';
import './cardImageSkeleton.css';

interface StoreCardProps {
    item: Store;
    onClick: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: (e: React.MouseEvent) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ item, onClick, isFavorite, onToggleFavorite }) => {
    const { language } = useLanguage();
    const [imageOk, setImageOk] = useState(true);
    const hasImage = Boolean(item.img && item.img.trim());
    const showSkeleton = !hasImage || !imageOk;

    useEffect(() => {
        setImageOk(true);
    }, [item.img]);

    return (
        <div className="store-card" onClick={onClick}>
            <div className={`store-bg ${showSkeleton ? 'store-bg--skeleton' : 'store-bg--image'}`}>
                {hasImage && imageOk && (
                    <img
                        src={item.img}
                        alt=""
                        className="store-bg-img"
                        onError={() => setImageOk(false)}
                    />
                )}
                {showSkeleton && <div className="card-img-skeleton" aria-hidden="true" />}
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
            <div className="store-name" style={{ marginTop: '0px', lineHeight: '1.2', fontWeight: 700, fontSize: '1.2rem' }}>{item.name}</div>
            <div className="store-meta" style={{ marginTop: '0px', color: '#21EA7C', fontSize: '0.85rem' }}>{formatDuration(item.delivery, language)}</div>
        </div>
    );
};

export default StoreCard;
