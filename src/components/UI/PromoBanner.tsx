import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../translations/LanguageContext';
import './PromoBanner.css';

interface PromoBannerProps {
    onFirstBannerClick?: () => void;
    onSecondBannerClick?: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ onFirstBannerClick, onSecondBannerClick }) => {
    const { language } = useLanguage();
    const [activeIndex, setActiveIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const mainBannerSrc = {
        ru: '/Assets/banners/RU_1_besplatnaya-dostavka.png',
        en: '/Assets/banners/EN_1_free-delivery.png',
        ka: '/Assets/banners/KA_1_free-delivery.png'
    }[language] || '/Assets/banners/RU_1_besplatnaya-dostavka.png';

    const refBannerSrc = {
        ru: '/Assets/banners/RU_2_skidka-za-druga.png',
        en: '/Assets/banners/EN_2_refer-a-friend.png',
        ka: '/Assets/banners/KA_2_refer-a-friend.png'
    }[language] || '/Assets/banners/RU_2_skidka-za-druga.png';

    const banners = [
        { src: mainBannerSrc, onClick: onFirstBannerClick },
        { src: refBannerSrc, onClick: onSecondBannerClick },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const distance = touchStartX.current - touchEndX.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            setActiveIndex((prev) => (prev + 1) % banners.length);
        } else if (isRightSwipe) {
            setActiveIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    return (
        <>
            {/* Mobile — auto-rotating carousel (as before) */}
            <div className="promoBannerWrap">
                <div
                    className="promoBannerTrack"
                    style={{ transform: activeIndex === 0 ? 'translateX(0)' : 'translateX(calc(-100% - 10px))' }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {banners.map((banner, index) => (
                        <div
                            className="promoBannerSlide"
                            key={index}
                            onClick={() => banner.onClick?.()}
                            style={{ cursor: banner.onClick ? 'pointer' : 'default', marginRight: index < banners.length - 1 ? '10px' : '0' }}
                            role={banner.onClick ? 'button' : undefined}
                        >
                            <img src={banner.src} alt="" className="promoBannerImg" />
                        </div>
                    ))}
                </div>

                <div className="promoBannerDots">
                    {banners.map((_, index) => (
                        <div
                            key={index}
                            className={`promoBannerDot${index === activeIndex ? ' active' : ''}`}
                        />
                    ))}
                </div>
            </div>

            {/* Desktop — side-by-side cards */}
            <div className="promoBannerSection">
                <div className="promoBannerScroller">
                    {banners.map((banner, index) => (
                        <button
                            type="button"
                            className="promoBannerCard"
                            key={index}
                            onClick={() => banner.onClick?.()}
                            aria-label={`Promo ${index + 1}`}
                        >
                            <img src={banner.src} alt="" className="promoBannerCardImg" />
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default PromoBanner;
