import { pickI18nText } from './i18nContent';

const THREE_PIECE_RESTAURANT_IDS = new Set([
    'rest-1785095837937828031', // Luizastan
    'rest-1785108442716453469', // Sunset
]);

const THREE_PIECE_PRODUCTS = new Set([
    'хинкали',
    'хинкали с грибами',
    'хинкали с сыром',
]);

type QuantityProduct = {
    restaurant_id?: string | null;
    name?: string | null;
};

export function getMinimumOrderQuantity(product: QuantityProduct): number {
    if (!product.restaurant_id || !THREE_PIECE_RESTAURANT_IDS.has(product.restaurant_id)) return 1;

    const russianName = pickI18nText(product.name, 'ru').trim().toLowerCase();
    return THREE_PIECE_PRODUCTS.has(russianName) ? 3 : 1;
}
