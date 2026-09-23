import React, { useState, useEffect } from 'react';
import './MobileHome.css';
import PartnerForm from '../components/UI/PartnerForm';
import { useLanguage } from '../translations/LanguageContext';

const MobileHome: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const { t, language, setLanguage } = useLanguage();
    const [showPartnerForm, setShowPartnerForm] = useState(false);
    const [partnerType, setPartnerType] = useState<'restaurant' | 'courier'>('restaurant');
    const [langOpen, setLangOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const LANGUAGES = [
        { code: 'ru', name: 'RU', flag: '/Assets/RU.png' },
        { code: 'ka', name: 'KA', flag: '/Assets/GE.png' },
        { code: 'en', name: 'EN', flag: '/Assets/US.png' }
    ];

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
    const registerText = t('auth.register');
    const supportText = t('profile.support') || 'Поддержка';

    const openPartnerForm = (type: 'restaurant' | 'courier') => {
        setPartnerType(type);
        setShowPartnerForm(true);
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.mobile-reveal').forEach((el) => {
            observer.observe(el);
        });
        
        return () => observer.disconnect();
    }, []);

    return (
        <div className="mobile-home-premium">
            <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
                <div className="landing-header-container">
                    <div className="landing-logo" onClick={() => onNavigate('menu')}>
                        <img src="/Assets/Loading/logo.png" alt="MestiDelivery" className="landing-logo-img" />
                        <span>Mesti<span style={{ color: '#21EA7C' }}>Delivery</span></span>
                    </div>

                    <div className="landing-nav-right">
                        <div className="landing-lang-selector">
                            <button className="landing-lang-btn" onClick={() => setLangOpen(!langOpen)}>
                                <img src={currentLang.flag} alt={currentLang.name} className="landing-lang-flag" />
                                <span>{currentLang.name}</span>
                                <svg className={`lang-arrow ${langOpen ? 'open' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            {langOpen && (
                                <>
                                    <div className="landing-lang-backdrop" onClick={() => setLangOpen(false)} />
                                    <div className="landing-lang-dropdown">
                                        {LANGUAGES.map(lang => (
                                            <div 
                                                key={lang.code} 
                                                className={`landing-lang-option ${language === lang.code ? 'active' : ''}`} 
                                                onClick={() => { setLanguage(lang.code as any); setLangOpen(false); }}
                                            >
                                                <img src={lang.flag} alt={lang.name} />
                                                <span>{lang.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <a href="https://t.me/MestigoSupport_Bot" target="_blank" rel="noopener noreferrer" className="landing-nav-link">
                            {supportText}
                        </a>

                        <button className="landing-register-btn" onClick={() => onNavigate('login')}>
                            {registerText}
                        </button>

                        <button className="landing-burger-btn" onClick={() => setDrawerOpen(true)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {drawerOpen && (
                <div className="landing-drawer-overlay" onClick={() => setDrawerOpen(false)}>
                    <div className="landing-drawer" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <div className="landing-logo">
                                <img src="/Assets/Loading/logo.png" alt="MestiDelivery" className="landing-logo-img" />
                                <span>Mesti<span style={{ color: '#21EA7C' }}>Delivery</span></span>
                            </div>
                            <button className="drawer-close-btn" onClick={() => setDrawerOpen(false)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="drawer-body">
                            <a href="https://t.me/MestigoSupport_Bot" target="_blank" rel="noopener noreferrer" className="drawer-link" onClick={() => setDrawerOpen(false)}>
                                {supportText}
                            </a>
                            
                            <div className="drawer-lang-section">
                                <span className="drawer-section-title">{t('home.language')}</span>
                                <div className="drawer-lang-grid">
                                    {LANGUAGES.map(lang => (
                                        <button 
                                            key={lang.code} 
                                            className={`drawer-lang-card ${language === lang.code ? 'active' : ''}`}
                                            onClick={() => { setLanguage(lang.code as any); setDrawerOpen(false); }}
                                        >
                                            <img src={lang.flag} alt={lang.name} />
                                            <span>{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="drawer-register-btn" onClick={() => { onNavigate('login'); setDrawerOpen(false); }}>
                                {registerText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mobile-bg">
                <div className="mobile-bg-image" />
                <div className="mobile-bg-overlay" />
            </div>

            <div className="mobile-container">
                <header className="mobile-hero">
                    <div className="mobile-hero-content">
                        <h1 className="mobile-hero-title">
                            <span className="solid-text">{t('home.hero_title_1') || 'ДОСТАВКА'}</span>
                            <br />
                            <span className="outline-text">{t('home.hero_title_2') || 'НОВОГО УРОВНЯ'}</span>
                        </h1>
                        <p className="mobile-hero-description mobile-reveal" style={{ transitionDelay: '0.1s' }}>
                            {t('home.hero_subtitle') || 'Заказывай любимые блюда из лучших ресторанов с быстрой доставкой и максимальным удобством.'}
                        </p>
                        <button className="mobile-glass-btn mobile-reveal" style={{ transitionDelay: '0.2s' }} onClick={() => onNavigate('menu')}>
                            {t('home.order_now') || 'Выбрать блюда'}
                        </button>
                    </div>
                </header>

                <section className="mobile-section">
                    <div className="mobile-section-head mobile-reveal">
                        <h2>{t('home.steps_title')}</h2>
                    </div>
                    <div className="mobile-steps">
                        {/* 01 */}
                        <div className="mobile-step-card mobile-reveal">
                            <div className="step-num">01</div>
                            <div className="step-text">
                                <h3>{t('home.step1_title')}</h3>
                                <p>{t('home.step1_desc')}</p>
                            </div>
                        </div>
                        {/* 02 */}
                        <div className="mobile-step-card mobile-reveal">
                            <div className="step-num">02</div>
                            <div className="step-text">
                                <h3>{t('home.step2_title')}</h3>
                                <p>{t('home.step2_desc')}</p>
                            </div>
                        </div>
                        {/* 03 */}
                        <div className="mobile-step-card mobile-reveal">
                            <div className="step-num">03</div>
                            <div className="step-text">
                                <h3>{t('home.step3_title')}</h3>
                                <p>{t('home.step3_desc')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mobile-section mobile-partners-area">
                    <div className="mobile-section-head mobile-reveal">
                        <h2>{t('home.partnership_title')}</h2>
                        <p>{t('home.partnership_subtitle')}</p>
                    </div>

                    <div className="mobile-partner-cards">
                        <div className="mobile-partner-card mobile-reveal" style={{ transitionDelay: '0s' }}>
                            <h3>🍽 {t('home.why_us_feature3_title')}</h3>
                            <p>{t('home.partner_restaurant_desc')}</p>
                            <button className="mobile-btn-green" onClick={() => openPartnerForm('restaurant')}>
                                {t('home.partner_restaurant_btn')}
                            </button>
                        </div>

                        <div className="mobile-partner-card mobile-reveal" style={{ transitionDelay: '0.2s' }}>
                            <h3>🚴 {t('home.partner_courier_title')}</h3>
                            <p>{t('home.partner_courier_desc')}</p>
                            <button className="mobile-btn-outline" onClick={() => openPartnerForm('courier')}>
                                {t('home.partner_courier_form_btn')}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="mobile-footer">
                <p>&copy; {new Date().getFullYear()} MestiDelivery. {t('home.footer_rights')}</p>
            </footer>

            {showPartnerForm && (
                <PartnerForm 
                    type={partnerType} 
                    onClose={() => setShowPartnerForm(false)} 
                />
            )}
        </div>
    );
};

export default MobileHome;
