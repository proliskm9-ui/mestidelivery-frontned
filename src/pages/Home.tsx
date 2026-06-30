import React, { useState, useEffect } from 'react';
import './Home.css';
import PartnerForm from '../components/UI/PartnerForm';
import { useLanguage } from '../translations/LanguageContext';
import ScrollHero from '../components/ScrollHero/ScrollHero';
import Counter from '../components/Home/Counter';
// Note: the page below is fully responsive (mobile → desktop). The old
// separate MobileHome is no longer routed to — one premium design adapts.

const MARQUEE_ITEMS: Record<string, string[]> = {
    ru: ['ГРУЗИНСКАЯ КУХНЯ', 'ХИНКАЛИ', 'ДОСТАВКА ИЗ ЛУЧШИХ РЕСТОРАНОВ', 'MESTIA', '30 МИНУТ', 'БЕСПЛАТНО', 'ОПЛАТА КАРТОЙ И КРИПТО'],
    en: ['GEORGIAN CUISINE', 'KHINKALI', 'TOP RESTAURANTS DELIVERED', 'MESTIA', '30 MINUTES', 'FREE', 'CARD & CRYPTO'],
    ka: ['ქართული სამზარეულო', 'ხინკალი', 'საუკეთესო რესტორნები', 'MESTIA', '30 წთ', 'უფასოდ', 'ბარათი და კრიპტო']
};

const HomePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
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
    const registerText = language === 'ru' ? 'Зарегистрироваться' : language === 'ka' ? 'რეგისტრაცია' : 'Register';
    const supportText = t('profile.support') || 'Поддержка';
    const marqueeItems = MARQUEE_ITEMS[language] || MARQUEE_ITEMS.en;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const openPartnerForm = (type: 'restaurant' | 'courier') => {
        setPartnerType(type);
        setShowPartnerForm(true);
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home-premium">
            <header className={`hd${isScrolled ? ' is-scrolled' : ''}`}>
                <div className="hd-inner">
                    <div className="hd-logo" onClick={() => onNavigate('menu')}>
                        <img src="/Assets/Loading/logo.png" alt="MestiDelivery" className="hd-logo-mark" />
                        <span className="hd-logo-text">Mesti<span className="acc">Delivery</span></span>
                    </div>

                    <div className="hd-actions">
                        <nav className="hd-nav">
                            <button className="hd-link" onClick={() => onNavigate('menu')}>{t('nav.menu')}<i /></button>
                            <a className="hd-link" href="https://t.me/MestigoSupport_Bot" target="_blank" rel="noopener noreferrer">{supportText}<i /></a>
                        </nav>
                        <span className="hd-divider" />
                        <div className="hd-lang">
                            <button className="hd-lang-btn" onClick={() => setLangOpen(!langOpen)}>
                                <img src={currentLang.flag} alt="" className="hd-lang-flag" />
                                <span>{currentLang.name}</span>
                                <svg className={`hd-chev${langOpen ? ' open' : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
                                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {langOpen && (
                                <>
                                    <div className="hd-lang-backdrop" onClick={() => setLangOpen(false)} />
                                    <div className="hd-lang-menu">
                                        {LANGUAGES.map(lang => (
                                            <div
                                                key={lang.code}
                                                className={`hd-lang-item${language === lang.code ? ' is-active' : ''}`}
                                                onClick={() => { setLanguage(lang.code as any); setLangOpen(false); }}
                                            >
                                                <img src={lang.flag} alt="" />
                                                <span>{lang.name}</span>
                                                {language === lang.code && (
                                                    <svg className="hd-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                        <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <button className="hd-cta" onClick={() => onNavigate('login')}>
                            {registerText}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <button className="hd-burger" onClick={() => setDrawerOpen(true)} aria-label="Menu">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {drawerOpen && (
                <div className="hd-drawer-overlay" onClick={() => setDrawerOpen(false)}>
                    <div className="hd-drawer" onClick={e => e.stopPropagation()}>
                        <div className="hd-drawer-head">
                            <div className="hd-logo" onClick={() => { setDrawerOpen(false); onNavigate('menu'); }}>
                                <img src="/Assets/Loading/logo.png" alt="MestiDelivery" className="hd-logo-mark" />
                                <span className="hd-logo-text">Mesti<span className="acc">Delivery</span></span>
                            </div>
                            <button className="hd-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <div className="hd-drawer-body">
                            <button className="hd-drawer-link" onClick={() => { setDrawerOpen(false); onNavigate('menu'); }}>
                                {t('nav.menu')}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <a className="hd-drawer-link" href="https://t.me/MestigoSupport_Bot" target="_blank" rel="noopener noreferrer" onClick={() => setDrawerOpen(false)}>
                                {supportText}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </a>

                            <div className="hd-drawer-lang">
                                <span className="hd-drawer-label">{t('home.language')}</span>
                                <div className="hd-drawer-langgrid">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            className={`hd-drawer-langcard${language === lang.code ? ' is-active' : ''}`}
                                            onClick={() => { setLanguage(lang.code as any); setDrawerOpen(false); }}
                                        >
                                            <img src={lang.flag} alt={lang.name} />
                                            <span>{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="hd-cta hd-drawer-cta" onClick={() => { setDrawerOpen(false); onNavigate('login'); }}>
                                {registerText}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ScrollHero onNavigate={onNavigate} />

            {/* Kinetic marquee — sets a designed tone right under the hero */}
            <div className="hm-marquee" aria-hidden="true">
                <div className="hm-marquee-row">
                    {[0, 1].map((dup) => (
                        <div className="hm-marquee-seq" key={dup}>
                            {marqueeItems.map((w, i) => (
                                <span key={i} className={i % 2 ? 'is-acc' : ''}>
                                    {w}<i className="hm-mk-dot" />
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="premium-container">

                {/* HOW IT WORKS — editorial index, not icon-cards */}
                <section className="hm-section hm-how reveal-on-scroll">
                    <header className="hm-head">
                        <span className="hm-kicker">{t('home.how_kicker')}</span>
                        <h2 className="hm-title">{t('home.how_title')}</h2>
                    </header>
                    <ol className="hm-steps">
                        {[1, 2, 3].map((n) => (
                            <li className="hm-step" key={n}>
                                <span className="hm-step-num">0{n}</span>
                                <div className="hm-step-body">
                                    <span className="hm-step-tag">{t(`home.step${n}_tag`)}</span>
                                    <h3>{t(`home.step${n}_title`)}</h3>
                                    <p>{t(`home.step${n}_desc`)}</p>
                                </div>
                                <svg className="hm-step-arrow" width="34" height="20" viewBox="0 0 34 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                    <path d="M2 10h28M22 3l8 7-8 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* WHY — bento with mixed, on-brand content */}
                <section className="hm-section hm-why">
                    <header className="hm-head reveal-on-scroll">
                        <span className="hm-kicker">{t('home.why_kicker')}</span>
                        <h2 className="hm-title">{t('home.why_us_title')}</h2>
                        <p className="hm-sub">{t('home.why_us_desc')}</p>
                    </header>

                    <div className="hm-bento">
                        <article className="hm-tile hm-tile--hero reveal-on-scroll" style={{ backgroundImage: "url('/hero-frames/desktop/frame_0240.webp')" }}>
                            <div className="hm-tile-ovl" />
                            <span className="hm-tile-kick">{t('home.stat_speed')}</span>
                            <div className="hm-stat-big"><Counter value={30} /><span className="hm-stat-unit">мин</span></div>
                            <svg className="hm-route" viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden="true">
                                <path d="M2 16 C 40 4, 70 22, 110 12 S 180 2, 238 14" fill="none" stroke="rgba(33,234,124,0.35)" strokeWidth="2" strokeLinecap="round" />
                                <circle className="hm-route-dot" cx="238" cy="14" r="4" fill="#21EA7C" />
                            </svg>
                        </article>

                        <article className="hm-tile hm-tile--rating reveal-on-scroll">
                            <div className="hm-stars" aria-hidden="true">★★★★★</div>
                            <div className="hm-stat-mid"><Counter value={4.9} decimals={1} /></div>
                            <span className="hm-tile-foot">{t('home.stat_rating')}</span>
                        </article>

                        <article className="hm-tile hm-tile--promo reveal-on-scroll">
                            <div className="hm-stat-mid hm-acc">−10₾</div>
                            <span className="hm-tile-foot">{t('home.stat_promo')}</span>
                            <span className="hm-promo-flag">promo</span>
                        </article>

                        <article className="hm-tile hm-tile--zone reveal-on-scroll" style={{ backgroundImage: "url('/Assets/mestia_3d_map_grey_1770421992583.png')" }}>
                            <div className="hm-tile-ovl hm-tile-ovl--map" />
                            <span className="hm-zone-dot" />
                            <span className="hm-tile-foot">{t('home.stat_zone')} · {t('home.stat_zone_name')}</span>
                        </article>

                        <article className="hm-tile hm-tile--live reveal-on-scroll">
                            <div className="hm-live-left">
                                <span className="hm-tile-kick">{t('home.lo_kicker')}</span>
                                <h3>{t('home.lo_title')}</h3>
                                <p>{t('home.why_us_feature1_desc')}</p>
                            </div>
                            <div className="hm-live-card">
                                <div className="hm-live-top">
                                    <span className="hm-live-rest">{t('home.lo_rest')}</span>
                                    <span className="hm-live-eta">{t('home.lo_eta')}</span>
                                </div>
                                <div className="hm-live-status">
                                    {[1, 2, 3].map((n) => (
                                        <span key={n} className={`hm-pill ${n < 3 ? 'is-done' : ''} ${n === 3 ? 'is-cur' : ''}`}>{t(`home.lo_status${n}`)}</span>
                                    ))}
                                </div>
                                <div className="hm-live-bar"><i /></div>
                            </div>
                        </article>
                    </div>
                </section>
            </div>

            {/* PARTNERS — full-bleed band over the Mestia mountains */}
            <section className="hm-partners reveal-on-scroll" style={{ backgroundImage: "url('/Assets/Loading/mountains-background.png')" }}>
                <div className="hm-partners-ovl" />
                <div className="hm-partners-inner">
                    <span className="hm-kicker">{t('home.part_kicker')}</span>
                    <h2 className="hm-partners-title">{t('home.partnership_title')}</h2>
                    <p className="hm-partners-sub">{t('home.partnership_subtitle')}</p>
                    <div className="hm-partners-cta">
                        <button className="hm-btn hm-btn--green" onClick={() => openPartnerForm('restaurant')}>
                            {t('home.partner_restaurant_btn')}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        <button className="hm-btn hm-btn--ghost" onClick={() => openPartnerForm('courier')}>
                            {t('home.partner_courier_btn')}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* Футер */}
            <footer className="home-footer">
                <div className="hm-footer-mark" aria-hidden="true">MestiDelivery</div>
                <div className="footer-content">
                    <div className="footer-logo">
                        <img src="/Assets/Loading/logo.png" alt="MestiDelivery" style={{ height: '36px', marginRight: '10px', verticalAlign: 'middle' }} />
                        <span>Mesti<span style={{ color: '#21EA7C' }}>Delivery</span></span>
                    </div>
                    <div className="footer-links">
                        <a href="#">{t('home.footer_about')}</a>
                        <a href="#">{t('home.footer_contacts')}</a>
                        <a href="#">{t('home.footer_faq')}</a>
                        <a href="#">{t('home.footer_terms')}</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} MestiDelivery. {t('home.footer_rights')}</p>
                </div>
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

export default HomePage;
