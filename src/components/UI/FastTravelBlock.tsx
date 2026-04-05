import React from 'react';
import './FastTravelBlock.css';

interface FastTravelBlockProps {
    onNavigate: (tab: string) => void;
}

const FastTravelBlock: React.FC<FastTravelBlockProps> = ({ onNavigate }) => {
    return (
        <div className="cardsBlock mobile-only">
            {/* Restaurants */}
            <div
                className="card card--restaurants"
                onClick={() => onNavigate('restaurants')}
                role="button"
                tabIndex={0}
            />
            <img
                src="/Assets/Group 1321314497.png"
                className="card--img1"
                alt="Restaurants"
            />
            <div className="cardLabel cardLabel--restaurants">Рестораны</div>

            {/* Shops */}
            <div
                className="card card--shops"
                onClick={() => onNavigate('shops')}
                role="button"
                tabIndex={0}
            />
            <img
                src="/Assets/раздел_магазины-removebg-preview-removebg-preview 4.png"
                className="card--img2"
                alt="Shops"
            />
            <div className="cardLabel cardLabel--shops">Магазины</div>

            {/* Promos */}
            <div
                className="card card--promos"
                onClick={() => onNavigate('promos')}
                role="button"
                tabIndex={0}
            />
            <img
                src="/Assets/раздел_акции-removebg-preview 4.png"
                className="card--img3"
                alt="Promos"
            />
            <div className="cardLabel cardLabel--promos">Акции</div>
        </div>
    );
};

export default FastTravelBlock;
