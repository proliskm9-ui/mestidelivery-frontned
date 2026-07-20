import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { translations, Language } from './index';
export type { Language };

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const COOKIE_NAME = 'i18next';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

function getCookie(name: string): string | null {
    const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number): void {
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

// ─── Language detection ───────────────────────────────────────────────────────

const SUPPORTED: Language[] = ['ru', 'en', 'ka'];

/** Maps navigator.language to one of our supported locales */
function detectBrowserLanguage(): Language {
    const raw = (navigator.language || '').toLowerCase();
    if (raw.startsWith('ru')) return 'ru';
    if (raw.startsWith('ka')) return 'ka';
    if (raw.startsWith('en')) return 'en';
    return 'en'; // fallback — default to English
}

/**
 * Priority: cookie → localStorage → navigator.language → 'ru'
 * On first visit (no cookie, no localStorage) the result is written to
 * both storages immediately so the next call hits the fast path.
 */
function resolveInitialLanguage(): Language {
    // 1. Cookie
    const fromCookie = getCookie(COOKIE_NAME) as Language | null;
    if (fromCookie && SUPPORTED.includes(fromCookie)) return fromCookie;

    // 2. localStorage
    const fromStorage = localStorage.getItem('app_language') as Language | null;
    if (fromStorage && SUPPORTED.includes(fromStorage)) {
        // Sync missing cookie
        setCookie(COOKIE_NAME, fromStorage, COOKIE_MAX_AGE);
        return fromStorage;
    }

    // 3. navigator.language  (first visit)
    const detected = detectBrowserLanguage();
    // Write to both storages immediately
    setCookie(COOKIE_NAME, detected, COOKIE_MAX_AGE);
    localStorage.setItem('app_language', detected);
    return detected;
}




interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Reads: cookie → localStorage → navigator.language → 'ru'
    // On first visit also writes the detected value to both storages
    const [language, setLanguageState] = useState<Language>(resolveInitialLanguage);

    // Wrapper that syncs cookie + localStorage on every manual change
    const setLanguage = (lang: Language) => {
        setCookie(COOKIE_NAME, lang, COOKIE_MAX_AGE);
        localStorage.setItem('app_language', lang);
        setLanguageState(lang);
    };

    // Guard: keep storages in sync if state changes by any other means
    useEffect(() => {
        setCookie(COOKIE_NAME, language, COOKIE_MAX_AGE);
        localStorage.setItem('app_language', language);
    }, [language]);

    const t = (path: string): string => {
        const keys = path.split('.');
        let current: any = translations[language];

        for (const key of keys) {
            if (current[key] === undefined) {
                console.warn(`Translation missing for key: ${path} in language: ${language}`);
                return path;
            }
            current = current[key];
        }

        return current as string;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export function formatDuration(text: string | undefined, lang: Language): string {
    if (!text) return '';
    const cleanText = text.toString();
    if (lang === 'ka') {
        return cleanText
            .replace(/мин/g, 'წთ')
            .replace(/сек/g, 'წმ')
            .replace(/ч/g, 'სთ')
            .replace(/до/ig, 'მდე')
            .replace(/от/ig, '-დან');
    }
    if (lang === 'en') {
        return cleanText
            .replace(/мин/g, 'min')
            .replace(/сек/g, 'sec')
            .replace(/ч/g, 'h')
            .replace(/до/ig, 'up to')
            .replace(/от/ig, 'from');
    }
    return cleanText;
}
