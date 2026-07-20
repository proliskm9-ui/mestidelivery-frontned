import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../translations/LanguageContext';
import { useDeliveryLocationOptional } from '../../delivery/DeliveryLocationContext';

const CONSENT_KEY = 'cookie_consent';

const LABELS: Record<string, { text: string; link: string; accept: string; decline: string }> = {
    ru: {
        text: 'Мы используем файлы cookie для корректной работы сайта, запоминания языка и ваших предпочтений.',
        link: 'Подробнее',
        accept: 'Принять всё',
        decline: 'Только необходимые',
    },
    en: {
        text: 'We use cookies to ensure the site works properly, remember your language and preferences.',
        link: 'Learn more',
        accept: 'Accept all',
        decline: 'Essentials only',
    },
    ka: {
        text: 'ჩვენ ვიყენებთ ქუქი-ფაილებს საიტის სწორი მუშაობისთვის, ენის და პარამეტრების შესანახად.',
        link: 'დეტალები',
        accept: 'ყველას მიღება',
        decline: 'მხოლოდ საჭიროები',
    },
};

const CookieConsentBanner: React.FC = () => {
    const { language } = useLanguage();
    const deliveryLoc = useDeliveryLocationOptional();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(CONSENT_KEY);
        if (!saved) {
            // Small delay so it doesn't flash instantly on load
            const t = setTimeout(() => setVisible(true), 1200);
            return () => clearTimeout(t);
        }
    }, []);

    if (!visible) return null;

    const l = LABELS[language] ?? LABELS.en;

    const afterConsent = () => {
        try {
            sessionStorage.removeItem('delivery_geo_prompted');
        } catch { /* ignore */ }
        deliveryLoc?.requestGeolocation({ force: true });
        window.dispatchEvent(new Event('mestigo:request-geo'));
    };

    const handleAccept = () => {
        localStorage.setItem(CONSENT_KEY, 'all');
        setVisible(false);
        afterConsent();
    };

    const handleDecline = () => {
        localStorage.setItem(CONSENT_KEY, 'essential');
        setVisible(false);
        afterConsent();
    };

    return (
        <>
            <style>{`
                @keyframes cookieFadeUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
            <div style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 99999,
                width: 'min(calc(100vw - 32px), 680px)',
                background: 'rgba(14, 15, 17, 0.94)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '18px 22px 18px 20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                animation: 'cookieFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
            }}>
                {/* Icon */}
                <span style={{ fontSize: '26px', flexShrink: 0, lineHeight: 1, userSelect: 'none' }}>🍪</span>

                {/* Text */}
                <p style={{
                    flex: 1,
                    margin: 0,
                    fontSize: '0.86rem',
                    lineHeight: 1.55,
                    color: 'rgba(255,255,255,0.68)',
                    fontFamily: "'Inter', sans-serif",
                    minWidth: '180px',
                }}>
                    {l.text}{' '}
                    <Link
                        to="/legal#privacy"
                        style={{ color: '#21EA7C', textDecoration: 'none', fontWeight: 600 }}
                        onClick={handleAccept}
                    >
                        {l.link}
                    </Link>
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                        onClick={handleDecline}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.16)',
                            borderRadius: '100px',
                            color: 'rgba(255,255,255,0.65)',
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 600,
                            fontSize: '0.84rem',
                            padding: '9px 18px',
                            cursor: 'pointer',
                            transition: 'border-color .2s, background .2s',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        {l.decline}
                    </button>
                    <button
                        onClick={handleAccept}
                        style={{
                            background: '#21EA7C',
                            border: 'none',
                            borderRadius: '100px',
                            color: '#04130a',
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            padding: '9px 22px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 18px rgba(33,234,124,0.35)',
                            transition: 'transform .2s, box-shadow .2s',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 28px rgba(33,234,124,0.5)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 18px rgba(33,234,124,0.35)';
                        }}
                    >
                        {l.accept}
                    </button>
                </div>
            </div>
        </>
    );
};

export default CookieConsentBanner;

