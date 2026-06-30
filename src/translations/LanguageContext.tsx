import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { translations, Language } from './index';
export type { Language };




interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('app_language');
        return (saved as Language) || 'ru';
    });

    useEffect(() => {
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
