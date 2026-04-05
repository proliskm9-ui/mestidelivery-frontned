import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../translations/LanguageContext';
import './PromoBanner.css';

interface PromoBannerProps {
    onFirstBannerClick?: () => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ onFirstBannerClick }) => {
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

    const banners = [mainBannerSrc, refBannerSrc];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % banners.length);
        }, 5000); // Auto-scroll every 5 seconds
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

    const handleSlideClick = (index: number) => {
        if (index === 0 && onFirstBannerClick) {
            onFirstBannerClick();
        }
    };

    return (
        <div className="promoBannerWrap mobile-only">
            <div
                className="promoBannerTrack"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {banners.map((src, index) => (
                    <div
                        className="promoBannerSlide"
                        key={index}
                        onClick={() => handleSlideClick(index)}
                        style={{ cursor: index === 0 ? 'pointer' : 'default' }}
                    >
                        <img src={src} alt={`Banner ${index + 1}`} className="promoBannerImg" />
                    </div>
                ))}
            </div>

            <div className="promoBannerDots">
                {banners.map((_, index) => (
                    <div
                        key={index}
                        className={`promoBannerDot ${index === activeIndex ? 'active' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default PromoBanner;
