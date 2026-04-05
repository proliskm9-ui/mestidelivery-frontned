import React from 'react';
import { Store } from '../../services/api';

interface StoreCardProps {
    item: Store;
    onClick: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: (e: React.MouseEvent) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ item, onClick, isFavorite, onToggleFavorite }) => {
    return (
        <div className="store-card" onClick={onClick}>
            <div className="store-bg" style={{
                backgroundImage: item.img ? `url("${item.img}")` : 'none',
                transition: 'transform 0.3s ease',
                position: 'relative'
            }}>
                {onToggleFavorite && (
                    <button
                        className={`fav-btn ${isFavorite ? 'fav-active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(e); }}
                        style={{
                            width: '32px',
                            height: '32px',
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "black" : "none"} stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="store-name" style={{ marginTop: '0px', lineHeight: '1.2', fontWeight: 700, fontSize: '1.2rem' }}>{item.name}</div>
            <div className="store-meta" style={{ marginTop: '0px', color: '#21EA7C', fontSize: '0.85rem' }}>{item.delivery}</div>
        </div>
    );
};

export default StoreCard;
