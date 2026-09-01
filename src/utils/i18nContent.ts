import type { Language } from '../translations';

export type I18nMap = Partial<Record<Language, string>> & Record<string, string | undefined>;

const LANG_FALLBACK: Language[] = ['ru', 'en', 'ka'];

function isI18nMap(value: unknown): value is I18nMap {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Parse DB string that may be plain text, legacy "ka / ru", or JSON i18n map. */
export function parseI18nContent(raw: string | null | undefined): I18nMap | string {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('{')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (isI18nMap(parsed)) return parsed;
        } catch {
            // fall through
        }
    }

    // Legacy Luizastan format: "ქართული / Русский"
    if (trimmed.includes(' / ')) {
        const [ka, ru] = trimmed.split(' / ').map((s) => s.trim());
        if (ka && ru) {
            return { ka, ru, en: ru };
        }
    }

    return trimmed;
}

function looksCyrillic(text: string): boolean {
    return /[а-яё]/i.test(text);
}

function looksLatin(text: string): boolean {
    return /[a-z]/i.test(text);
}

function looksGeorgian(text: string): boolean {
    return /[\u10A0-\u10FF]/.test(text);
}

/**
 * Whether a string stored under `lang` is a real translation for that language
 * (filters out RU stubs copied into ka/en fields).
 */
function isRealTranslation(text: string, lang: Language, map: I18nMap): boolean {
    const value = text.trim();
    if (!value) return false;
    if (lang === 'ru') return true;

    const ru = map.ru?.trim();
    if (ru && value === ru && looksCyrillic(value)) return false;

    if (lang === 'ka' && looksCyrillic(value) && !looksGeorgian(value)) return false;
    if (lang === 'en' && looksCyrillic(value) && !looksLatin(value)) return false;
    return true;
}

export function pickI18nText(
    raw: string | null | undefined,
    language: Language,
    fallbackOrder: Language[] = LANG_FALLBACK,
): string {
    const parsed = parseI18nContent(raw);
    if (typeof parsed === 'string') return parsed;

    const order = [language, ...fallbackOrder.filter((l) => l !== language)];
    for (const lang of order) {
        const value = parsed[lang];
        if (typeof value === 'string' && isRealTranslation(value, lang, parsed)) {
            return value.trim();
        }
    }

    const first = Object.values(parsed).find((v) => typeof v === 'string' && v.trim());
    return (first || '').trim();
}

export function buildI18nJson(parts: I18nMap): string {
    const clean: I18nMap = {};
    (['ka', 'ru', 'en'] as Language[]).forEach((lang) => {
        const v = parts[lang]?.trim();
        if (v) clean[lang] = v;
    });
    return JSON.stringify(clean);
}

/** For order tickets / kitchen: prefer Georgian, then Russian. */
export function pickKitchenText(raw: string | null | undefined): string {
    return pickI18nText(raw, 'ka', ['ka', 'ru', 'en']);
}

/** Search across all language variants + plain text. */
export function matchesI18nContent(raw: string | null | undefined, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const parsed = parseI18nContent(raw);
    if (typeof parsed === 'string') return parsed.toLowerCase().includes(q);
    return Object.values(parsed).some((v) => typeof v === 'string' && v.toLowerCase().includes(q));
}
