import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../translations/LanguageContext';
import { useDeliveryLocationOptional } from '../../delivery/DeliveryLocationContext';
import './CookieConsentBanner.css';

const CONSENT_KEY = 'cookie_consent';
const CONSENT_AT_KEY = 'cookie_consent_at';
/** "Later" keeps analytics off and asks again after a week. */
const ASK_AGAIN_MS = 7 * 24 * 60 * 60 * 1000;

const LABELS: Record<string, { title: string; text: string; link: string; accept: string; later: string }> = {
    ru: {
        title: 'Файлы cookie',
        text: 'Мы используем файлы cookie для корректной работы сайта, запоминания языка и ваших предпочтений.',
        link: 'Подробнее',
        accept: 'Принять',
        later: 'Позже',
    },
    en: {
        title: 'Cookies',
        text: 'We use cookies to ensure the site works properly and to remember your language and preferences.',
        link: 'Learn more',
        accept: 'Accept',
        later: 'Later',
    },
    ka: {
        title: 'ქუქი-ფაილები',
        text: 'ჩვენ ვიყენებთ ქუქი-ფაილებს საიტის სწორი მუშაობისთვის, ენის და პარამეტრების შესანახად.',
        link: 'დეტალები',
        accept: 'მიღება',
        later: 'მოგვიანებით',
    },
};

/** Google Analytics runs in consent mode (see index.html): storage only after "Accept". */
function setAnalyticsConsent(granted: boolean) {
    try {
        (window as any).gtag?.('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    } catch { /* analytics unavailable */ }
}

function needsAsking(): boolean {
    try {
        const saved = localStorage.getItem(CONSENT_KEY);
        if (!saved) return true;
        if (saved === 'all') return false;
        const at = Number(localStorage.getItem(CONSENT_AT_KEY) || 0);
        return !at || Date.now() - at > ASK_AGAIN_MS;
    } catch {
        return false;
    }
}

const CookieConsentBanner: React.FC = () => {
    const { language } = useLanguage();
    const deliveryLoc = useDeliveryLocationOptional();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!needsAsking()) return;
        // Small delay so it doesn't flash instantly on load
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
    }, []);

    if (!visible) return null;

    const l = LABELS[language] ?? LABELS.en;

    const save = (value: 'all' | 'essential') => {
        try {
            localStorage.setItem(CONSENT_KEY, value);
            localStorage.setItem(CONSENT_AT_KEY, String(Date.now()));
        } catch { /* storage blocked */ }
        setAnalyticsConsent(value === 'all');
        setVisible(false);
        try {
            sessionStorage.removeItem('delivery_geo_prompted');
        } catch { /* ignore */ }
        deliveryLoc?.requestGeolocation({ force: true });
        window.dispatchEvent(new Event('mestigo:request-geo'));
    };

    return (
        <div className="ccb" role="dialog" aria-live="polite" aria-labelledby="ccb-title">
            <div className="ccb-head">
                <span className="ccb-icon" aria-hidden="true"><Cookie size={20} strokeWidth={1.9} /></span>
                <p className="ccb-text" id="ccb-title">
                    {l.text}{' '}
                    <Link to={`/${language}/privacy`} className="ccb-link">{l.link}</Link>
                </p>
            </div>
            <div className="ccb-actions">
                <button type="button" className="ccb-accept" onClick={() => save('all')}>{l.accept}</button>
                <button type="button" className="ccb-later" onClick={() => save('essential')}>{l.later}</button>
            </div>
        </div>
    );
};

export default CookieConsentBanner;
