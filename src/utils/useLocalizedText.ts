import { useLanguage } from '../translations/LanguageContext';
import { pickI18nText } from './i18nContent';

/** Localized product/catalog fields bound to current UI language. */
export function useLocalizedText(raw: string | null | undefined): string {
    const { language } = useLanguage();
    return pickI18nText(raw, language);
}

export function useLocalizedProductFields(product: {
    name?: string | null;
    description?: string | null;
}) {
    const { language } = useLanguage();
    return {
        name: pickI18nText(product.name, language),
        description: pickI18nText(product.description, language),
        language,
    };
}
