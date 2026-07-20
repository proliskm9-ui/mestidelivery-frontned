import React, { useState, useEffect, useRef } from 'react';
import './LiquidNavBar.css';

const LiquidNavBar: React.FC<{ activePage: string; onNavigate: (page: string) => void }> = ({ activePage, onNavigate }) => {
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const delta = currentScrollY - lastScrollY.current;

                    if (currentScrollY <= 10) {
                        setIsVisible(true);
                    } else if (delta > 20) {
                        // Scrolling down past threshold
                        setIsVisible(false);
                    } else if (delta < -20) {
                        // Scrolling up past threshold
                        setIsVisible(true);
                    }

                    lastScrollY.current = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []); // No deps — ref doesn't cause re-registration

    return (
        <div className={`matte-glass-navbar-container ${isVisible ? 'navbar-visible' : 'navbar-hidden'}`}>
            <nav className="matte-glass-navbar">
                <div className="liquid-nav-item" onClick={() => onNavigate('menu')}>
                    <NavIcon icon="menu-main" active={activePage === 'menu'} />
                </div>
                <div className="liquid-nav-item" onClick={() => onNavigate('favorites')}>
                    <NavIcon icon="favorites" active={activePage === 'favorites'} />
                </div>
                <div className="liquid-nav-item" onClick={() => onNavigate('cart')}>
                    <NavIcon icon="cart" active={activePage === 'cart'} />
                </div>
                <div className="liquid-nav-item" onClick={() => onNavigate('profile')}>
                    <NavIcon icon="profile" active={activePage === 'profile'} />
                </div>
            </nav>
        </div>
    );
};

const NavIcon = ({ icon, active }: { icon: string, active: boolean }) => {
    let src = '';

    // Icons mapping
    if (active) {
        if (icon === 'menu-main') src = '/Assets/general-green.png';
        if (icon === 'favorites') src = '/Assets/heart-green.png';
        if (icon === 'profile') src = '/Assets/profile-green.png';
        if (icon === 'cart') src = '/Assets/корзина.png';
    } else {
        if (icon === 'menu-main') src = '/Assets/general-gray.png';
        if (icon === 'favorites') src = '/Assets/heart-gray.png';
        if (icon === 'profile') src = '/Assets/profile-gray.png';
        if (icon === 'cart') src = '/Assets/basket-gray.png';
    }

    const isCart = icon === 'cart';
    return (
        <div className={`icon-wrapper ${active ? 'active' : ''} ${isCart ? 'icon-wrapper--cart' : ''}`}>
            <img
                src={src}
                alt={icon}
                className="nav-icon-img"
            />
        </div>
    );
};

export default LiquidNavBar;
