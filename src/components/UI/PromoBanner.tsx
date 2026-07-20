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
        ru: '/Assets/banner_ru.jpeg',
        en: '/Assets/banner_en.jpeg',
        ka: '/Assets/banner_ge.jpeg'
    }[language] || '/Assets/banner_ru.jpeg';

    const refBannerSrc = {
        ru: '/Assets/ref_banner_ru.jpeg',
        en: '/Assets/ref_banner_en.jpeg',
        ka: '/Assets/ref_banner_ge.jpeg'
    }[language] || '/Assets/ref_banner_ru.jpeg';

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
                    style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {banners.map((banner, index) => (
                        <div
                            className="promoBannerSlide"
                            key={index}
                            onClick={() => banner.onClick?.()}
                            style={{ cursor: banner.onClick ? 'pointer' : 'default' }}
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
