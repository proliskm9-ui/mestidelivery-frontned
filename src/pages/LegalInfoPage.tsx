import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, List, Settings } from 'lucide-react';
import { useLanguage } from '../translations/LanguageContext';

import {
    DOC_NAV,
    getLegalDoc,
    legalDocPath,
    resolveLegalDocId,
    type LegalDocId,
} from './legal/legalContent';

interface SettingsLabels {
    wideFormat: string;
    navigation: string;
    darkTheme: string;
    textSize: string;
    enabled: string;
    disabled: string;
    exitReadingMode: string;
    readingMode: string;
}

const SETTINGS_LOCALIZATION: Record<string, SettingsLabels> = {
    ru: {
        wideFormat: "Широкий формат",
        navigation: "Навигация по текущей статье",
        darkTheme: "Темная",
        textSize: "Размер текста",
        enabled: "Включен",
        disabled: "Выключен",
        exitReadingMode: "Выйти из режима чтения",
        readingMode: "Режим чтения"
    },
    en: {
        wideFormat: "Wide format",
        navigation: "Navigation",
        darkTheme: "Dark theme",
        textSize: "Text size",
        enabled: "On",
        disabled: "Off",
        exitReadingMode: "Exit Reading Mode",
        readingMode: "Reading Mode"
    },
    ka: {
        wideFormat: "ფართო ფორმატი",
        navigation: "სტატიის ნავიგაცია",
        darkTheme: "ბნელი თემა",
        textSize: "ტექსტის ზომა",
        enabled: "ჩართულია",
        disabled: "გამორთულია",
        exitReadingMode: "კითხვის რეჟიმიდან გამოსვლა",
        readingMode: "კითხვის რეჟიმი"
    }
};

const BADGE_TRANSLATIONS: Record<string, string> = {
    ru: "Правовые документы",
    en: "Legal Documents",
    ka: "სამართლებრივი დოკუმენტები"
};

const LegalInfoPage: React.FC = () => {
    const { language, setLanguage } = useLanguage();
    const location = useLocation();
    const [langOpen, setLangOpen] = useState(false);

    // Interactive settings states
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isWideFormat, setIsWideFormat] = useState(false);
    const [showNavigation, setShowNavigation] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('small');
    const [isReadingMode, setIsReadingMode] = useState(false);
    const [tocOpen, setTocOpen] = useState(false);
    const [docMenuOpen, setDocMenuOpen] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState<string>('');
    const mobileChromeRef = useRef<HTMLDivElement | null>(null);

    const activeDocId: LegalDocId = resolveLegalDocId(location.pathname, location.hash);
    const doc = getLegalDoc(language, activeDocId);
    const docNav = DOC_NAV[language as keyof typeof DOC_NAV] || DOC_NAV.ru;
    const sLabels = SETTINGS_LOCALIZATION[language] || SETTINGS_LOCALIZATION.ru;

    const navSections = useMemo(
        () => doc.sections.filter((s) => !s.id.endsWith('-meta')),
        [doc.sections],
    );

    const activeSectionTitle = useMemo(() => {
        const found = navSections.find((s) => s.id === activeSectionId);
        return found?.title || navSections[0]?.title || doc.inThisArticle;
    }, [navSections, activeSectionId, doc.inThisArticle]);

    useEffect(() => {
        setTocOpen(false);
        setDocMenuOpen(false);
        setActiveSectionId(navSections[0]?.id || '');
    }, [activeDocId, language, navSections]);

    useEffect(() => {
        if (!tocOpen && !docMenuOpen) return;
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            if (mobileChromeRef.current && !mobileChromeRef.current.contains(target)) {
                setTocOpen(false);
                setDocMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [tocOpen, docMenuOpen]);

    useEffect(() => {
        const nodes = navSections
            .map((s) => document.getElementById(s.id))
            .filter((el): el is HTMLElement => Boolean(el));
        if (!nodes.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]?.target?.id) {
                    setActiveSectionId(visible[0].target.id);
                }
            },
            {
                rootMargin: '-30% 0px -55% 0px',
                threshold: [0, 0.25, 0.5],
            },
        );
        nodes.forEach((n) => observer.observe(n));
        return () => observer.disconnect();
    }, [navSections, language, activeDocId]);

    useEffect(() => {
        const handleScroll = () => {
            const path = (location.pathname || '').replace(/\/+$/, '').toLowerCase();
            if (path === '/contact' || path === '/support') {
                const contacts = document.getElementById('t-contacts');
                if (contacts) {
                    contacts.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveSectionId('t-contacts');
                }
                return;
            }

            const hash = window.location.hash;
            if (!hash) return;
            const id = hash.replace('#', '');
            if (id === 'privacy' || id === 'terms' || id === 'returns' || id === 'refunds') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };

        const timer = setTimeout(handleScroll, 100);
        return () => clearTimeout(timer);
    }, [location.hash, location.pathname, language, activeDocId]);

    // Esc key listener to exit reading mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsReadingMode(false);
                setTocOpen(false);
                setDocMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const LANGUAGES = [
        { code: 'ru', name: 'RU', flag: '/Assets/RU.png' },
        { code: 'ka', name: 'KA', flag: '/Assets/GE.png' },
        { code: 'en', name: 'EN', flag: '/Assets/US.png' }
    ];

    const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

    return (
        <div className={`legal-page-wrapper-v2 
            ${isDarkMode ? 'dark-mode-legal' : ''} 
            ${isWideFormat ? 'wide-format-active' : ''} 
            ${!showNavigation ? 'no-navigation-active' : ''} 
            ${isReadingMode ? 'reading-mode-active' : ''} 
            size-${textSize}`}
        >
            <style>{`
                .legal-page-wrapper-v2 {
                    background-color: #ffffff;
                    color: #222222;
                    font-family: 'Inter', sans-serif;
                    min-height: 100vh;
                    padding-bottom: 100px;
                    transition: background-color 0.25s ease, color 0.25s ease;
                    /* clip (not hidden) — overflow-x:hidden breaks position:sticky */
                    overflow-x: clip;
                    width: 100%;
                    max-width: 100%;
                }
                
                /* Header Styling — fixed like Home .hd */
                .legal-header-v2 {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    width: 100%;
                    z-index: 1000;
                    background: #ffffff;
                    border-bottom: 1px solid #e2e8f0;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    transition: background-color 0.25s ease, border-color 0.25s ease;
                }
                .legal-header-inner-v2 {
                    max-width: 1280px;
                    width: 100%;
                    margin: 0 auto;
                    padding: 0 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .legal-page-offset {
                    padding-top: 70px;
                }
                .legal-logo-v2 {
                    font-family: 'Outfit', sans-serif;
                    font-weight: 800;
                    font-size: 1.25rem;
                    color: #000000;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .legal-logo-v2 span {
                    color: #000000;
                }
                .legal-logo-v2 .badge {
                    background: #f1f5f9;
                    color: #64748b;
                    font-size: 0.75rem;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-weight: 500;
                    transition: background-color 0.2s, color 0.2s;
                }
                .legal-header-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                /* Language Dropdown - CLEANED: No border, No Globe icon */
                .lang-switcher-wrapper {
                    position: relative;
                }
                .lang-btn-v2 {
                    background: none;
                    border: none;
                    padding: 6px 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    color: #334155;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: color 0.2s;
                }
                .lang-btn-v2:hover {
                    color: #005bff;
                }
                .lang-btn-v2 img {
                    width: 18px;
                    height: 12px;
                    object-fit: cover;
                    border-radius: 2px;
                }
                .lang-dropdown-v2 {
                    position: absolute;
                    top: calc(100% + 6px);
                    right: 0;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    width: 120px;
                    display: flex;
                    flex-direction: column;
                    padding: 4px;
                    z-index: 1001;
                }
                .lang-opt-v2 {
                    background: none;
                    border: none;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    width: 100%;
                    text-align: left;
                    font-size: 0.875rem;
                    color: #334155;
                    border-radius: 6px;
                    transition: background-color 0.2s;
                }
                .lang-opt-v2:hover {
                    background-color: #f1f5f9;
                }
                .lang-opt-v2 img {
                    width: 18px;
                    height: 12px;
                    object-fit: cover;
                    border-radius: 2px;
                }
                
                /* Settings Button & Popover overlay style (Image 1 replica) */
                .settings-icon-v2-wrapper {
                    position: relative;
                }
                .settings-btn-v2 {
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    transition: color 0.2s;
                    padding: 6px;
                }
                .settings-btn-v2:hover {
                    color: #334155;
                }
                .settings-dropdown-v2 {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                    width: 290px;
                    padding: 16px;
                    z-index: 2000;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    color: #0f172a;
                    transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease;
                }
                .settings-row-v2 {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .settings-row-left {
                    display: flex;
                    flex-direction: column;
                }
                .settings-row-label {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: #0f172a;
                    transition: color 0.25s;
                }
                .settings-row-sub {
                    font-size: 0.72rem;
                    color: #64748b;
                    margin-top: 1px;
                    transition: color 0.25s;
                }

                /* iOS/Android Custom Switch (Yandex style) */
                .switch-v2 {
                    position: relative;
                    display: inline-block;
                    width: 40px;
                    height: 22px;
                }
                .switch-v2 input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider-v2 {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #cbd5e1;
                    transition: .25s;
                    border-radius: 22px;
                }
                .slider-v2:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .25s;
                    border-radius: 50%;
                }
                input:checked + .slider-v2 {
                    background-color: #005bff;
                }
                input:checked + .slider-v2:before {
                    transform: translateX(18px);
                }

                /* A A A Text size selectors */
                .size-choices-v2 {
                    display: flex;
                    background: #f1f5f9;
                    border-radius: 8px;
                    padding: 3px;
                    width: fit-content;
                    gap: 4px;
                    transition: background-color 0.25s;
                }
                .size-btn-v2 {
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    border-radius: 6px;
                    transition: background 0.2s, color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 28px;
                    width: 32px;
                    font-weight: 600;
                }
                .size-btn-v2.active {
                    background: #ffffff;
                    color: #0f172a;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .size-btn-v2.size-s { font-size: 0.7rem; }
                .size-btn-v2.size-m { font-size: 0.9rem; }
                .size-btn-v2.size-l { font-size: 1.15rem; }

                /* Breadcrumbs & Navigation Back */
                .breadcrumbs-bar {
                    background-color: #f8fafc;
                    border-bottom: 1px solid #f1f5f9;
                    padding: 12px 0;
                    transition: background-color 0.25s ease, border-color 0.25s ease;
                }
                .breadcrumbs-inner {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .breadcrumbs-text {
                    font-size: 0.8rem;
                    color: #64748b;
                    font-weight: 400;
                }
                .breadcrumbs-back {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #005bff;
                    text-decoration: none;
                    font-size: 0.8rem;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                .breadcrumbs-back:hover {
                    color: #0045c4;
                }

                /* Main layout */
                .legal-content-grid {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 40px 24px 0;
                    display: grid;
                    grid-template-columns: 1fr 280px;
                    gap: 48px;
                    transition: max-width 0.25s ease, grid-template-columns 0.25s ease;
                }
                
                .legal-main-col {
                    max-width: 800px;
                    transition: max-width 0.25s ease;
                }

                .title-row-v2 {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 28px;
                    position: relative;
                }

                .legal-page-title {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #000000;
                    line-height: 1.25;
                    letter-spacing: -0.02em;
                    margin: 0;
                    flex: 1;
                }

                /* Reading Mode corner-bracket button */
                .reading-mode-toggle-btn {
                    background: none;
                    border: 1px solid #005bff;
                    border-radius: 8px;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    color: #005bff;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .reading-mode-toggle-btn:hover {
                    color: #0045c4;
                    border-color: #0045c4;
                    background-color: rgba(0, 91, 255, 0.05);
                }
                .reading-mode-toggle-btn .tooltip-text {
                    visibility: hidden;
                    width: 110px;
                    background-color: #334155;
                    color: #fff;
                    text-align: center;
                    border-radius: 6px;
                    padding: 6px 0;
                    position: absolute;
                    z-index: 10;
                    bottom: 125%;
                    left: 50%;
                    transform: translateX(-50%);
                    opacity: 0;
                    transition: opacity 0.2s;
                    font-size: 0.725rem;
                    font-weight: 500;
                    pointer-events: none;
                }
                .reading-mode-toggle-btn:hover .tooltip-text {
                    visibility: visible;
                    opacity: 1;
                }

                .legal-doc-nav {
                    display: inline-flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 2px;
                    margin: 0 0 32px;
                    padding: 4px;
                    border-radius: 14px;
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                }
                .legal-doc-nav a {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 18px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    letter-spacing: -0.01em;
                    text-decoration: none;
                    color: #64748b;
                    background: transparent;
                    border: 1px solid transparent;
                    transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
                }
                .legal-doc-nav a:hover {
                    color: #0f172a;
                    background: rgba(255, 255, 255, 0.7);
                }
                .legal-doc-nav a.is-active {
                    color: #0f172a;
                    background: #ffffff;
                    border-color: rgba(15, 23, 42, 0.04);
                    box-shadow:
                        0 1px 2px rgba(15, 23, 42, 0.06),
                        0 0 0 1px rgba(33, 234, 124, 0.35);
                }
                .dark-mode-legal .legal-doc-nav {
                    background: #1a1a1a;
                    border-color: #2a2a2a;
                }
                .dark-mode-legal .legal-doc-nav a {
                    color: rgba(255, 255, 255, 0.55);
                    background: transparent;
                }
                .dark-mode-legal .legal-doc-nav a:hover {
                    color: #fff;
                    background: rgba(255, 255, 255, 0.06);
                }
                .dark-mode-legal .legal-doc-nav a.is-active {
                    color: #0b0f0c;
                    background: #21EA7C;
                    border-color: transparent;
                    box-shadow: none;
                }

                /* Mobile-only nav chrome (back + doc + toc) — scrolls with page */
                .legal-mobile-sticky-chrome {
                    display: none;
                }

                .legal-doc-intro {
                    font-size: 0.95rem;
                    line-height: 1.6;
                    color: #475569;
                    margin-bottom: 32px;
                }

                .legal-section-block {
                    margin-bottom: 40px;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 32px;
                }
                .legal-section-block:last-child {
                    border-bottom: none;
                }

                .legal-section-block h2 {
                    font-size: 1.15rem;
                    font-weight: 600;
                    color: #000000;
                    margin-bottom: 16px;
                    scroll-margin-top: 90px;
                    letter-spacing: -0.01em;
                }
                
                .legal-section-block p {
                    line-height: 1.65;
                    color: #334155;
                    margin-bottom: 14px;
                }
                .legal-section-block p:last-child {
                    margin-bottom: 0;
                }

                .legal-section-block.legal-section-meta {
                    margin-top: 2.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(0, 0, 0, 0.08);
                }

                .legal-section-block.legal-section-meta h2 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--legal-muted, #6b7280);
                }

                .legal-section-block.legal-section-meta p {
                    font-size: 0.88rem;
                    color: var(--legal-muted, #6b7280);
                }

                .dark-mode-legal .legal-section-block.legal-section-meta {
                    border-top-color: rgba(255, 255, 255, 0.1);
                }

                /* Sidebar Index */
                .legal-sidebar-col {
                    position: relative;
                }
                .legal-sticky-index {
                    position: sticky;
                    top: 110px;
                    background: #ffffff;
                    border-left: 1px solid #e2e8f0;
                    padding-left: 20px;
                    transition: background-color 0.25s ease, border-color 0.25s ease;
                }
                .index-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: #94a3b8;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    margin-bottom: 16px;
                }
                .index-links-list {
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .index-link-item a {
                    font-size: 0.825rem;
                    color: #64748b;
                    text-decoration: none;
                    transition: color 0.2s;
                    font-weight: 500;
                    line-height: 1.3;
                    display: block;
                }
                .index-link-item a:hover {
                    color: #005bff;
                }

                /* ----------------- DYNAMIC LAYOUT MODES ----------------- */
                
                /* 1. Wide Format Mode */
                .wide-format-active .legal-content-grid {
                    max-width: 95% !important;
                }
                .wide-format-active .legal-main-col {
                    max-width: 100% !important;
                }

                /* 2. Hide Navigation Mode */
                .no-navigation-active .legal-sidebar-col {
                    display: none !important;
                }
                .no-navigation-active .legal-content-grid {
                    grid-template-columns: 1fr !important;
                }

                /* 3. Dark Theme Mode */
                .dark-mode-legal {
                    background-color: #151514 !important;
                    color: rgba(255, 255, 255, 0.75) !important;
                }
                .dark-mode-legal .settings-dropdown-v2 {
                    background: #232322 !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                    color: #ffffff !important;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
                }
                .dark-mode-legal .settings-row-label {
                    color: #ffffff !important;
                }
                .dark-mode-legal .settings-row-sub {
                    color: #94a3b8 !important;
                }
                .dark-mode-legal .slider-v2 {
                    background-color: #4a4a49 !important;
                }
                .dark-mode-legal .size-choices-v2 {
                    background: #3e3e3d !important;
                }
                .dark-mode-legal .size-btn-v2 {
                    color: #94a3b8 !important;
                }
                .dark-mode-legal .size-btn-v2.active {
                    background: #ffffff !important;
                    color: #000000 !important;
                    box-shadow: none !important;
                }
                .dark-mode-legal .legal-header-v2 {
                    background-color: #151514 !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                }
                .dark-mode-legal .legal-logo-v2,
                .dark-mode-legal .legal-logo-v2 span {
                    color: #ffffff !important;
                }
                .dark-mode-legal .legal-logo-v2 .badge {
                    background: rgba(255, 255, 255, 0.05) !important;
                    color: rgba(255, 255, 255, 0.6) !important;
                }
                .dark-mode-legal .lang-btn-v2 {
                    color: rgba(255, 255, 255, 0.8) !important;
                }
                .dark-mode-legal .lang-btn-v2:hover {
                    color: #21EA7C !important;
                }
                .dark-mode-legal .lang-dropdown-v2 {
                    background: #232322 !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                }
                .dark-mode-legal .lang-opt-v2 {
                    color: rgba(255, 255, 255, 0.8) !important;
                }
                .dark-mode-legal .lang-opt-v2:hover {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                }
                .dark-mode-legal .settings-btn-v2 {
                    color: rgba(255, 255, 255, 0.6) !important;
                }
                .dark-mode-legal .settings-btn-v2:hover {
                    color: #ffffff !important;
                }
                .dark-mode-legal .breadcrumbs-bar {
                    background-color: #181817 !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .dark-mode-legal .breadcrumbs-text {
                    color: rgba(255, 255, 255, 0.5) !important;
                }
                .dark-mode-legal .legal-page-title,
                .dark-mode-legal .legal-section-block h2 {
                    color: #ffffff !important;
                }
                .dark-mode-legal .reading-mode-toggle-btn {
                    border-color: #21EA7C;
                    color: #21EA7C;
                }
                .dark-mode-legal .reading-mode-toggle-btn:hover {
                    color: #1bca6a;
                    border-color: #1bca6a;
                    background-color: rgba(33, 234, 124, 0.05);
                }
                .dark-mode-legal .legal-doc-intro {
                    color: rgba(255, 255, 255, 0.6) !important;
                }
                .dark-mode-legal .legal-section-block {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                }
                .dark-mode-legal .legal-section-block p {
                    color: rgba(255, 255, 255, 0.7) !important;
                }
                .dark-mode-legal .legal-sticky-index {
                    background: #151514 !important;
                    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
                }
                .dark-mode-legal .index-link-item a {
                    color: rgba(255, 255, 255, 0.5) !important;
                }
                .dark-mode-legal .index-link-item a:hover {
                    color: #21EA7C !important;
                }
                .dark-mode-legal .breadcrumbs-back {
                    color: #21EA7C !important;
                }
                .dark-mode-legal .breadcrumbs-back:hover {
                    color: #1bca6a !important;
                }

                /* 4. Text Font Size Classes */
                .size-small p {
                    font-size: 0.925rem !important;
                }
                .size-medium p {
                    font-size: 1.1rem !important;
                }
                .size-large p {
                    font-size: 1.3rem !important;
                }

                /* 5. Reading Mode (Focused view overrides) */
                .reading-mode-active .legal-header-v2 {
                    display: none !important;
                }
                .reading-mode-active .legal-page-offset {
                    padding-top: 0 !important;
                }
                .reading-mode-active .breadcrumbs-bar {
                    display: none !important;
                }
                .reading-mode-active .legal-mobile-sticky-chrome {
                    display: none !important;
                }
                .reading-mode-active .legal-sidebar-col {
                    display: none !important;
                }
                .reading-mode-active .legal-content-grid {
                    grid-template-columns: 1fr !important;
                    max-width: 720px !important;
                    padding-top: 70px !important;
                }
                .reading-mode-active .reading-mode-toggle-btn {
                    display: none !important;
                }

                /* Exit floating panel for Reading Mode */
                .reading-mode-exit-bar {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(35, 35, 34, 0.9);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 8px 18px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
                    z-index: 10000;
                    color: #ffffff;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .exit-btn-v2 {
                    background: #005bff;
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }
                .exit-btn-v2:hover {
                    background: #0045c4;
                }

                @media (max-width: 900px) {
                    .legal-page-wrapper-v2 {
                        padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
                    }

                    .legal-header-v2 {
                        height: calc(58px + env(safe-area-inset-top, 0px));
                        padding-top: env(safe-area-inset-top, 0px);
                        box-sizing: border-box;
                    }
                    .legal-page-offset {
                        padding-top: calc(58px + env(safe-area-inset-top, 0px));
                    }
                    .legal-header-inner-v2 {
                        padding: 0 16px;
                        height: 58px;
                    }
                    .legal-logo-v2 {
                        font-size: 1.05rem;
                        gap: 6px;
                        min-width: 0;
                    }
                    .legal-logo-v2 .badge {
                        display: none;
                    }
                    .legal-header-right {
                        gap: 4px;
                        flex-shrink: 0;
                    }
                    .lang-btn-v2 {
                        padding: 6px;
                    }
                    .lang-btn-v2 span {
                        display: none;
                    }
                    .settings-btn-v2 {
                        width: 36px;
                        height: 36px;
                    }
                    .settings-dropdown-v2 {
                        width: min(300px, calc(100vw - 24px));
                        right: -4px;
                    }

                    .breadcrumbs-bar {
                        display: none !important;
                    }

                    .legal-content-grid {
                        grid-template-columns: 1fr !important;
                        padding: 28px 16px 0;
                        gap: 0;
                    }
                    .legal-sidebar-col {
                        display: none !important;
                    }
                    .legal-main-col {
                        max-width: 100%;
                        min-width: 0;
                        overflow-wrap: anywhere;
                    }

                    .legal-doc-nav {
                        display: none !important;
                    }

                    .legal-mobile-sticky-chrome {
                        display: block;
                        position: relative;
                        z-index: 1;
                        background: #ffffff;
                        border-bottom: none;
                    }
                    .dark-mode-legal .legal-mobile-sticky-chrome {
                        background: #0f0f0f;
                    }
                    .legal-mobile-chrome-card {
                        margin: 10px 12px 0;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        background: #f8fafc;
                        overflow: hidden;
                    }
                    .dark-mode-legal .legal-mobile-chrome-card {
                        border-color: #333;
                        background: #1a1a1a;
                    }
                    .legal-mobile-chrome-row {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 11px 12px;
                        border: none;
                        background: transparent;
                        cursor: pointer;
                        text-align: left;
                        color: #111;
                        font: inherit;
                    }
                    .dark-mode-legal .legal-mobile-chrome-row {
                        color: #fff;
                    }
                    .legal-mobile-chrome-row + .legal-mobile-chrome-row,
                    .legal-mobile-chrome-panel + .legal-mobile-chrome-row,
                    .legal-mobile-chrome-divider + .legal-mobile-chrome-row {
                        border-top: 1px solid #e2e8f0;
                    }
                    .dark-mode-legal .legal-mobile-chrome-row + .legal-mobile-chrome-row,
                    .dark-mode-legal .legal-mobile-chrome-panel + .legal-mobile-chrome-row,
                    .dark-mode-legal .legal-mobile-chrome-divider + .legal-mobile-chrome-row {
                        border-top-color: #333;
                    }
                    .legal-mobile-chrome-icon {
                        flex-shrink: 0;
                        color: #64748b;
                        display: flex;
                    }
                    .dark-mode-legal .legal-mobile-chrome-icon {
                        color: rgba(255,255,255,0.55);
                    }
                    .legal-mobile-chrome-label {
                        flex: 1;
                        min-width: 0;
                        font-size: 0.86rem;
                        font-weight: 600;
                        line-height: 1.3;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .legal-mobile-chrome-label.is-section {
                        font-size: 0.8rem;
                        font-weight: 700;
                        letter-spacing: 0.02em;
                        text-transform: uppercase;
                        color: #475569;
                    }
                    .dark-mode-legal .legal-mobile-chrome-label.is-section {
                        color: rgba(255,255,255,0.7);
                    }
                    .legal-mobile-chrome-chevron {
                        flex-shrink: 0;
                        color: #94a3b8;
                        transition: transform 0.2s ease;
                    }
                    .legal-mobile-chrome-chevron.is-open {
                        transform: rotate(180deg);
                    }
                    .legal-mobile-chrome-panel {
                        padding: 0 8px 10px;
                        border-top: 1px solid #e2e8f0;
                        background: #ffffff;
                    }
                    .dark-mode-legal .legal-mobile-chrome-panel {
                        border-top-color: #333;
                        background: #141414;
                    }
                    .legal-mobile-chrome-panel.is-toc {
                        max-height: min(48vh, 340px);
                        overflow-y: auto;
                        -webkit-overflow-scrolling: touch;
                        padding: 0 12px 12px;
                    }
                    .legal-mobile-doc-panel a {
                        display: block;
                        padding: 11px 10px;
                        border-radius: 8px;
                        font-size: 0.88rem;
                        font-weight: 500;
                        line-height: 1.35;
                        color: #334155;
                        text-decoration: none;
                    }
                    .legal-mobile-doc-panel a.is-active {
                        background: #f1f5f9;
                        color: #111;
                        font-weight: 700;
                    }
                    .dark-mode-legal .legal-mobile-doc-panel a {
                        color: rgba(255,255,255,0.7);
                    }
                    .dark-mode-legal .legal-mobile-doc-panel a.is-active {
                        background: rgba(255,255,255,0.08);
                        color: #21EA7C;
                    }
                    .legal-mobile-toc-label {
                        font-size: 0.72rem;
                        font-weight: 600;
                        color: #94a3b8;
                        margin: 10px 0 6px;
                    }
                    .legal-mobile-toc-list {
                        list-style: none;
                        margin: 0;
                        padding: 0 0 0 12px;
                        border-left: 2px solid #e2e8f0;
                        display: flex;
                        flex-direction: column;
                        gap: 0;
                    }
                    .dark-mode-legal .legal-mobile-toc-list {
                        border-left-color: #333;
                    }
                    .legal-mobile-toc-list a {
                        display: block;
                        padding: 9px 8px 9px 12px;
                        margin-left: -14px;
                        border-left: 2px solid transparent;
                        font-size: 0.84rem;
                        font-weight: 500;
                        line-height: 1.35;
                        color: #475569;
                        text-decoration: none;
                    }
                    .legal-mobile-toc-list a.is-active {
                        color: #0f172a;
                        font-weight: 700;
                        border-left-color: #111;
                    }
                    .dark-mode-legal .legal-mobile-toc-list a {
                        color: rgba(255,255,255,0.6);
                    }
                    .dark-mode-legal .legal-mobile-toc-list a.is-active {
                        color: #21EA7C;
                        border-left-color: #21EA7C;
                    }

                    .legal-page-title {
                        font-size: 1.45rem;
                        letter-spacing: -0.025em;
                        margin-bottom: 12px;
                        line-height: 1.3;
                        overflow-wrap: anywhere;
                    }
                    .legal-doc-intro {
                        font-size: 0.9rem;
                        margin-bottom: 22px;
                        line-height: 1.55;
                    }

                    .legal-section-block {
                        padding-bottom: 26px;
                        margin-bottom: 8px;
                    }
                    .legal-section-block h2 {
                        font-size: 1.05rem;
                        margin: 0 0 12px;
                        line-height: 1.35;
                        scroll-margin-top: calc(58px + env(safe-area-inset-top, 0px) + 16px);
                    }
                    .legal-section-block p {
                        font-size: 0.95rem;
                        line-height: 1.65;
                        margin: 0 0 12px;
                    }

                    .reading-mode-exit-bar {
                        left: 12px;
                        right: 12px;
                        width: auto;
                        transform: none;
                        top: calc(12px + env(safe-area-inset-top, 0px));
                        font-size: 0.85rem;
                    }

                    .reading-mode-active .legal-content-grid {
                        padding-top: 90px !important;
                        padding-left: 16px !important;
                        padding-right: 16px !important;
                    }
                }

                @media (min-width: 901px) {
                    .legal-mobile-sticky-chrome {
                        display: none !important;
                    }
                }

                @media (max-width: 480px) {
                    .legal-page-title {
                        font-size: 1.28rem;
                    }
                    .legal-section-block p {
                        font-size: 0.92rem;
                    }
                    .legal-mobile-chrome-label {
                        font-size: 0.82rem;
                    }
                    .legal-mobile-chrome-label.is-section {
                        font-size: 0.76rem;
                    }
                }
            `}</style>

            {/* Exit overlay for reading mode */}
            {isReadingMode && (
                <div className="reading-mode-exit-bar">
                    <span>{sLabels.readingMode}</span>
                    <button className="exit-btn-v2" onClick={() => setIsReadingMode(false)}>
                        {sLabels.exitReadingMode} (Esc)
                    </button>
                </div>
            )}

            <header className="legal-header-v2">
                <div className="legal-header-inner-v2">
                    <Link to="/" className="legal-logo-v2">
                        <span>MestiDelivery</span>
                        <span className="badge">{BADGE_TRANSLATIONS[language] || BADGE_TRANSLATIONS.ru}</span>
                    </Link>
                    <div className="legal-header-right">
                        <div className="lang-switcher-wrapper">
                            <button className="lang-btn-v2" onClick={() => setLangOpen(!langOpen)}>
                                <img src={currentLang.flag} alt={currentLang.name} />
                                <span>{currentLang.name}</span>
                            </button>
                            {langOpen && (
                                <div className="lang-dropdown-v2">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            className="lang-opt-v2"
                                            onClick={() => {
                                                setLanguage(lang.code as any);
                                                setLangOpen(false);
                                            }}
                                        >
                                            <img src={lang.flag} alt={lang.name} />
                                            <span>{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="settings-icon-v2-wrapper">
                            <button className="settings-btn-v2" onClick={() => setSettingsOpen(!settingsOpen)}>
                                <Settings size={18} />
                            </button>
                            {settingsOpen && (
                                <div className="settings-dropdown-v2">
                                    <div className="settings-row-v2">
                                        <div className="settings-row-left">
                                            <span className="settings-row-label">{sLabels.wideFormat}</span>
                                            <span className="settings-row-sub">
                                                {isWideFormat ? sLabels.enabled : sLabels.disabled}
                                            </span>
                                        </div>
                                        <label className="switch-v2">
                                            <input 
                                                type="checkbox" 
                                                checked={isWideFormat} 
                                                onChange={e => setIsWideFormat(e.target.checked)} 
                                            />
                                            <span className="slider-v2"></span>
                                        </label>
                                    </div>

                                    <div className="settings-row-v2">
                                        <div className="settings-row-left">
                                            <span className="settings-row-label">{sLabels.navigation}</span>
                                            <span className="settings-row-sub">
                                                {showNavigation ? sLabels.enabled : sLabels.disabled}
                                            </span>
                                        </div>
                                        <label className="switch-v2">
                                            <input 
                                                type="checkbox" 
                                                checked={showNavigation} 
                                                onChange={e => setShowNavigation(e.target.checked)} 
                                            />
                                            <span className="slider-v2"></span>
                                        </label>
                                    </div>

                                    <div className="settings-row-v2">
                                        <div className="settings-row-left">
                                            <span className="settings-row-label">{sLabels.darkTheme}</span>
                                            <span className="settings-row-sub">
                                                {isDarkMode ? sLabels.enabled : sLabels.disabled}
                                            </span>
                                        </div>
                                        <label className="switch-v2">
                                            <input 
                                                type="checkbox" 
                                                checked={isDarkMode} 
                                                onChange={e => setIsDarkMode(e.target.checked)} 
                                            />
                                            <span className="slider-v2"></span>
                                        </label>
                                    </div>

                                    <div className="settings-row-v2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                                        <span className="settings-row-label">{sLabels.textSize}</span>
                                        <div className="size-choices-v2">
                                            <button 
                                                className={`size-btn-v2 size-s ${textSize === 'small' ? 'active' : ''}`} 
                                                onClick={() => setTextSize('small')}
                                            >
                                                А
                                            </button>
                                            <button 
                                                className={`size-btn-v2 size-m ${textSize === 'medium' ? 'active' : ''}`} 
                                                onClick={() => setTextSize('medium')}
                                            >
                                                А
                                            </button>
                                            <button 
                                                className={`size-btn-v2 size-l ${textSize === 'large' ? 'active' : ''}`} 
                                                onClick={() => setTextSize('large')}
                                            >
                                                А
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="legal-page-offset">
            <div className="breadcrumbs-bar">
                <div className="breadcrumbs-inner">
                    <span className="breadcrumbs-text">{doc.breadcrumbs}</span>
                    <Link to="/" className="breadcrumbs-back">
                        <ArrowLeft size={14} />
                        <span>{doc.backToHome}</span>
                    </Link>
                </div>
            </div>

            <div className="legal-mobile-sticky-chrome" ref={mobileChromeRef}>
                <div className="legal-mobile-chrome-card">
                    <button
                        type="button"
                        className="legal-mobile-chrome-row"
                        aria-expanded={docMenuOpen}
                        aria-controls="legal-mobile-doc-panel"
                        onClick={() => {
                            setDocMenuOpen((v) => !v);
                            setTocOpen(false);
                        }}
                    >
                        <span className="legal-mobile-chrome-label">{docNav[activeDocId]}</span>
                        <ChevronDown
                            size={18}
                            className={`legal-mobile-chrome-chevron${docMenuOpen ? ' is-open' : ''}`}
                            aria-hidden="true"
                        />
                    </button>
                    {docMenuOpen && (
                        <nav
                            id="legal-mobile-doc-panel"
                            className="legal-mobile-chrome-panel legal-mobile-doc-panel"
                            aria-label="Legal documents"
                        >
                            {(['terms', 'privacy', 'returns'] as LegalDocId[]).map((id) => (
                                <Link
                                    key={id}
                                    to={legalDocPath(id, language)}
                                    className={activeDocId === id ? 'is-active' : undefined}
                                    onClick={() => {
                                        setDocMenuOpen(false);
                                        setTocOpen(false);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    {docNav[id]}
                                </Link>
                            ))}
                        </nav>
                    )}
                    <button
                        type="button"
                        className="legal-mobile-chrome-row"
                        aria-expanded={tocOpen}
                        aria-controls="legal-mobile-toc-panel"
                        onClick={() => {
                            setTocOpen((v) => !v);
                            setDocMenuOpen(false);
                        }}
                    >
                        <span className="legal-mobile-chrome-icon" aria-hidden="true">
                            <List size={16} strokeWidth={2} />
                        </span>
                        <span className="legal-mobile-chrome-label is-section">{activeSectionTitle}</span>
                        <ChevronDown
                            size={18}
                            className={`legal-mobile-chrome-chevron${tocOpen ? ' is-open' : ''}`}
                            aria-hidden="true"
                        />
                    </button>
                    {tocOpen && (
                        <nav
                            id="legal-mobile-toc-panel"
                            className="legal-mobile-chrome-panel is-toc"
                            aria-label={doc.inThisArticle}
                        >
                            <div className="legal-mobile-toc-label">{doc.inThisArticle}</div>
                            <ul className="legal-mobile-toc-list">
                                {navSections.map((section) => (
                                    <li key={`m-${section.id}`}>
                                        <a
                                            href={`#${section.id}`}
                                            className={activeSectionId === section.id ? 'is-active' : undefined}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setTocOpen(false);
                                                setActiveSectionId(section.id);
                                                window.location.hash = section.id;
                                            }}
                                        >
                                            {section.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}
                </div>
            </div>

            <div className="legal-content-grid">
                <main className="legal-main-col">
                    <nav className="legal-doc-nav" aria-label="Legal documents">
                        {(['terms', 'privacy', 'returns'] as LegalDocId[]).map((id) => (
                            <Link
                                key={id}
                                to={legalDocPath(id, language)}
                                className={activeDocId === id ? 'is-active' : undefined}
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            >
                                {docNav[id]}
                            </Link>
                        ))}
                    </nav>

                    <h1 className="legal-page-title">{doc.title}</h1>

                    {doc.sections.map(section => (
                        <div
                            key={section.id}
                            className={`legal-section-block${section.id.endsWith('-meta') ? ' legal-section-meta' : ''}`}
                        >
                            <h2 id={section.id}>{section.title}</h2>
                            {section.paragraphs.map((p, idx) => (
                                <p key={idx}>{p}</p>
                            ))}
                        </div>
                    ))}
                </main>

                <aside className="legal-sidebar-col">
                    <div className="legal-sticky-index">
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
                            <button 
                                className="reading-mode-toggle-btn"
                                onClick={() => setIsReadingMode(true)}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                </svg>
                                <span className="tooltip-text">{sLabels.readingMode}</span>
                            </button>
                        </div>
                        <div className="index-label">{doc.inThisArticle}</div>
                        <ul className="index-links-list">
                            {doc.sections.map(section => (
                                <li key={section.id} className="index-link-item">
                                    <a href={`#${section.id}`} onClick={(e) => {
                                        e.preventDefault();
                                        window.location.hash = section.id;
                                    }}>
                                        {(section.title.includes('. ')
                                            ? section.title.split('. ').slice(1).join('. ')
                                            : section.title)}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </div>
            </div>
        </div>
    );
};

export default LegalInfoPage;
