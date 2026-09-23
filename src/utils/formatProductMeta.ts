/** Format product weight/calories without duplicating units already in the DB value. */

export type PortionUnitLabels = {
    grams: string;
    ml: string;
    liter: string;
    pcs: string;
    kcal: string;
};

type UnitKind = 'grams' | 'ml' | 'liter' | 'pcs' | 'portion';

const UNIT_KIND: Record<string, UnitKind> = {
    порция: 'portion',
    порц: 'portion',
    portion: 'portion',
    portions: 'portion',
    ულუფა: 'portion',
    г: 'grams',
    'г.': 'grams',
    g: 'grams',
    gr: 'grams',
    gram: 'grams',
    grams: 'grams',
    გ: 'grams',
    'გ.': 'grams',
    мл: 'ml',
    'мл.': 'ml',
    ml: 'ml',
    მლ: 'ml',
    'მლ.': 'ml',
    л: 'liter',
    'л.': 'liter',
    l: 'liter',
    lit: 'liter',
    liter: 'liter',
    litre: 'liter',
    литр: 'liter',
    ლ: 'liter',
    'ლ.': 'liter',
    шт: 'pcs',
    'шт.': 'pcs',
    pc: 'pcs',
    pcs: 'pcs',
    piece: 'pcs',
    pieces: 'pcs',
    ც: 'pcs',
    ცალი: 'pcs',
};

function cleanLabel(label: string | null | undefined): string {
    return label ? String(label).replace(/\.+$/, '').trim() : '';
}

/** "250 г" / "350 мл" / "1 шт" / "0.5 л" → localized, no double units. */
export function formatPortionWeight(
    raw: string | number | null | undefined,
    labels: PortionUnitLabels,
): string | null {
    if (raw == null || raw === '') return null;
    const str = String(raw).trim();
    if (!str) return null;

    const match = str.match(/^([\d.,]+)\s*(.*)$/u);
    if (!match) return str;

    const amount = match[1];
    const unitRaw = (match[2] || '').trim().toLowerCase();
    if (!unitRaw) {
        return labels && labels.grams ? `${amount} ${cleanLabel(labels.grams)}` : `${amount} г`;
    }

    const kind = UNIT_KIND[unitRaw];
    const label = kind && labels ? (labels as Record<string, string | undefined>)[kind] : undefined;
    if (label) {
        return `${amount} ${cleanLabel(label)}`;
    }

    // Unknown unit already present — keep as stored
    return str;
}

/** "90" / "90 ккал" → "90 kcal" (localized), no double units. */
export function formatPortionCalories(
    raw: string | number | null | undefined,
    kcalLabel: string,
): string | null {
    if (raw == null || raw === '') return null;
    const str = String(raw).trim();
    if (!str) return null;

    const amount = str.replace(/\s*(ккал|kcal|კკალ)\.?$/iu, '').trim();
    const kcal = cleanLabel(kcalLabel);
    if (!amount || !/^[\d.,]+$/.test(amount)) {
        // Already a free-form string with unknown suffix
        if (/(ккал|kcal|კკალ)/iu.test(str)) return str;
        return kcal ? `${str} ${kcal}` : str;
    }
    return kcal ? `${amount} ${kcal}` : amount;
}

/** Map DB category labels (usually RU) to translation keys under `categories.*`. */
const CATEGORY_KEY_BY_ALIAS: Record<string, string> = {
    'что нового': 'what_new',
    'выбор пользователей': 'user_choice',
    акции: 'promotions',
    завтрак: 'breakfast',
    breakfast: 'breakfast',
    основные: 'mains',
    mains: 'mains',
    'main dishes': 'mains',
    дополнения: 'extras',
    extras: 'extras',
    addons: 'extras',
    'add-ons': 'extras',
    снеки: 'snacks',
    snacks: 'snacks',
    snack: 'snacks',
    закуски: 'appetizers',
    appetizers: 'appetizers',
    appetizing: 'appetizers',
    салаты: 'salads',
    salads: 'salads',
    супы: 'soups',
    soups: 'soups',
    горячее: 'hot',
    hot: 'hot',
    'hot dishes': 'hot',
    выпечка: 'bakery',
    bakery: 'bakery',
    'сванские блюда': 'svan',
    svan: 'svan',
    'svan dishes': 'svan',
    гарниры: 'sides',
    sides: 'sides',
    side: 'sides',
    соусы: 'sauces',
    sauces: 'sauces',
    sauce: 'sauces',
    десерты: 'desserts',
    desserts: 'desserts',
    напитки: 'drinks',
    drinks: 'drinks',
    beverages: 'drinks',
    бургеры: 'burgers',
    burgers: 'burgers',
    пицца: 'pizza',
    pizza: 'pizza',
    шаурма: 'shawarma',
    shawarma: 'shawarma',
    сэндвичи: 'sandwiches',
    sandwiches: 'sandwiches',
    блины: 'pancakes',
    pancakes: 'pancakes',
    шашлык: 'bbq',
    bbq: 'bbq',
    паста: 'pasta',
    pasta: 'pasta',
    кофе: 'coffee',
    coffee: 'coffee',
    ქართული: 'georgian',
    грузинская: 'georgian',
    georgian: 'georgian',
};

export function localizeMenuCategory(
    cat: string,
    t: (key: string) => string,
): string {
    const alias = cat.trim().toLowerCase();
    const key = CATEGORY_KEY_BY_ALIAS[alias];
    if (!key) return cat;

    // Special restaurant chrome categories live under restaurant.*
    if (key === 'what_new' || key === 'user_choice' || key === 'promotions') {
        return t(`restaurant.${key}`);
    }
    return t(`categories.${key}`);
}

/** Preferred menu section order: mains first, add-ons near food, drinks last. */
const CATEGORY_SORT_ORDER: Record<string, number> = {
    what_new: 0,
    user_choice: 1,
    promotions: 2,
    mains: 10,
    hot: 11,
    bbq: 12,
    svan: 13,
    burgers: 14,
    pizza: 15,
    shawarma: 16,
    sandwiches: 17,
    pasta: 18,
    pancakes: 19,
    bakery: 20,
    appetizers: 30,
    salads: 31,
    sides: 32,
    soups: 40,
    extras: 50,
    sauces: 51,
    snacks: 55,
    breakfast: 60,
    desserts: 70,
    drinks: 80,
    coffee: 81,
    georgian: 90,
};

export function menuCategorySortKey(cat: string): number {
    const alias = cat.trim().toLowerCase();
    const key = CATEGORY_KEY_BY_ALIAS[alias];
    if (key && key in CATEGORY_SORT_ORDER) return CATEGORY_SORT_ORDER[key];
    return 500;
}

export function sortMenuCategories(cats: string[]): string[] {
    return [...cats].sort((a, b) => {
        const d = menuCategorySortKey(a) - menuCategorySortKey(b);
        if (d !== 0) return d;
        return a.localeCompare(b, 'ru');
    });
}

function productNameBlob(name: unknown): string {
    if (typeof name === 'string') {
        const trimmed = name.trim();
        if (trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed) as Record<string, string>;
                return `${parsed.ru || ''} ${parsed.en || ''} ${parsed.ka || ''}`.toLowerCase();
            } catch {
                /* ignore */
            }
        }
        return trimmed.toLowerCase();
    }
    if (name && typeof name === 'object') {
        const o = name as Record<string, string>;
        return `${o.ru || ''} ${o.en || ''} ${o.ka || ''}`.toLowerCase();
    }
    return '';
}

/** Hot drinks: tea first, ice coffee, then coffee by volume desc, then sodas/water. */
const DRINK_PRIORITY: { re: RegExp; rank: number }[] = [
    { re: /травян|herbal/i, rank: 12 },
    { re: /зелён|зелен|green tea/i, rank: 11 },
    { re: /чёрн|черн|black tea/i, rank: 10 },
    { re: /чай|tea/i, rank: 13 },
    { re: /айс|ice\s*-?\s*(кофе|coffee|латте|latte)|кофе.*морож|морож.*кофе/i, rank: 20 },
    { re: /латте|latte/i, rank: 30 },
    { re: /капучино|cappuccino/i, rank: 40 },
    { re: /американо|americano/i, rank: 50 },
    { re: /турецк|turkish/i, rank: 60 },
    { re: /эспрессо|espresso/i, rank: 70 },
    { re: /coca|кола|cola/i, rank: 100 },
    { re: /fanta|фанта/i, rank: 110 },
    { re: /sprite|спрайт/i, rank: 120 },
    { re: /лимонад|lemonade/i, rank: 130 },
    { re: /газирован|sparkling/i, rank: 140 },
    { re: /минерал|water|вода/i, rank: 150 },
];

function drinkSortRank(name: unknown): number {
    const blob = productNameBlob(name);
    for (const { re, rank } of DRINK_PRIORITY) {
        if (re.test(blob)) return rank;
    }
    return 500;
}

export function isVisibleMenuProduct(p: {
    category?: string | null;
    is_available?: boolean | null;
    img?: string | null;
    name?: unknown;
}): boolean {
    // Explicitly unavailable (API may also send 0)
    if (p.is_available === false || (p as { is_available?: unknown }).is_available === 0) return false;
    const cat = (p.category || '').trim().toLowerCase();
    if (cat === 'скрыто' || cat === 'hidden') return false;
    // No photo yet → hide from customer menu (e.g. juice / energy until assets ready)
    if (!(p.img || '').trim()) return false;
    const blob = productNameBlob(p.name).trim().toLowerCase();
    if (blob === 'сок' || blob === 'энергетик' || blob === 'juice' || blob === 'energy drink') return false;
    return true;
}

/** BBQ Garden / generic appetizers: salads → pkhali+rullets → sides → snacks. */
const APPETIZER_PRIORITY: { re: RegExp; rank: number }[] = [
    { re: /греческ|greek/i, rank: 30 },
    { re: /с куриц|chicken salad|salad.*chicken/i, rank: 40 },
    { re: /апельсин|orange/i, rank: 50 },
    { re: /сулугун|suluguni/i, rank: 60 },
    { re: /пхали|phali|pkhali/i, rank: 70 },
    { re: /рулетик|eggplant|баклажан/i, rank: 80 },
    { re: /гриб|mushroom|горшоч/i, rank: 90 },
    { re: /мексикан|mexican/i, rank: 100 },
    { re: /фри|fries|fry/i, rank: 110 },
    { re: /авокадо|avocado/i, rank: 120 },
    { re: /ассорти.*сыр|сыр.*ассорти|cheese (plate|assort)/i, rank: 130 },
    { re: /маринован|pickle/i, rank: 140 },
];

function appetizerSortRank(name: unknown): number {
    const blob = productNameBlob(name);
    // Tomato salads first (walnut variant right after plain) — never let «орех» pull eggplant rolls up
    if (/помидор|tomato|огур|cucumber/i.test(blob) && /салат|salad/i.test(blob)) {
        return /орех|walnut/i.test(blob) ? 20 : 10;
    }
    for (const { re, rank } of APPETIZER_PRIORITY) {
        if (re.test(blob)) return rank;
    }
    return 500;
}

/** Eggplant dishes sit in the salad section but aren't salads — keep them after the real ones. */
function saladSortRank(name: unknown): number {
    return /баклажан|eggplant|ბადრიჯან/i.test(productNameBlob(name)) ? 90 : 10;
}

/** Fried chicken was added late, so pull it up next to the other grills, ahead of the pork mtsvadi. */
function reorderHotDishes<T extends { name?: unknown }>(items: T[]): T[] {
    const fried = items.find(p => /жарен\w*\s+куриц|fried chicken/i.test(productNameBlob(p.name)));
    if (!fried) return items;
    const rest = items.filter(p => p !== fried);
    const porkAt = rest.findIndex(p => /шашлык из свинины|pork mtsvadi/i.test(productNameBlob(p.name)));
    if (porkAt < 0) return items;
    return [...rest.slice(0, porkAt), fried, ...rest.slice(porkAt)];
}

/** Put Lobiani before Mchadi so the 3 large Georgian round pies stay together. */
function reorderBakeryDishes<T extends { name?: unknown }>(items: T[]): T[] {
    const mchadi = items.find(p => /мчади|mchadi|მჭადი/i.test(productNameBlob(p.name)));
    const lobiani = items.find(p => /лобиани|lobiani|ლობიანი/i.test(productNameBlob(p.name)));
    if (!mchadi || !lobiani) return items;
    const mchadiIdx = items.indexOf(mchadi);
    const lobianiIdx = items.indexOf(lobiani);
    if (mchadiIdx < lobianiIdx) {
        const copy = [...items];
        copy[mchadiIdx] = lobiani;
        copy[lobianiIdx] = mchadi;
        return copy;
    }
    return items;
}

export function sortProductsInCategory<T extends { name?: unknown }>(
    category: string,
    items: T[],
): T[] {
    const key = CATEGORY_KEY_BY_ALIAS[category.trim().toLowerCase()];
    if (key === 'bakery') {
        return reorderBakeryDishes(items);
    }
    if (key === 'salads') {
        return [...items].sort((a, b) => saladSortRank(a.name) - saladSortRank(b.name));
    }
    if (key === 'hot') {
        return reorderHotDishes(items);
    }
    if (key === 'drinks') {
        return [...items].sort((a, b) => {
            const d = drinkSortRank(a.name) - drinkSortRank(b.name);
            if (d !== 0) return d;
            return productNameBlob(a.name).localeCompare(productNameBlob(b.name), 'ru');
        });
    }
    if (key === 'appetizers') {
        return [...items].sort((a, b) => {
            const d = appetizerSortRank(a.name) - appetizerSortRank(b.name);
            if (d !== 0) return d;
            return productNameBlob(a.name).localeCompare(productNameBlob(b.name), 'ru');
        });
    }
    if (key === 'desserts') {
        return [...items].sort((a, b) => {
            const d = dessertSortRank(a.name) - dessertSortRank(b.name);
            if (d !== 0) return d;
            return productNameBlob(a.name).localeCompare(productNameBlob(b.name), 'ru');
        });
    }
    return items;
}

/** Desserts: cake/tiramisu/fruit first, pudding then ice cream at the end. */
const DESSERT_PRIORITY: { re: RegExp; rank: number }[] = [
    { re: /тирамису|tiramisu/i, rank: 10 },
    { re: /десерт дня|dessert of|cake|торт/i, rank: 20 },
    { re: /фруктов|fruit/i, rank: 30 },
    { re: /пудинг|pudding/i, rank: 40 },
    { re: /ваниль|vanilla/i, rank: 50 },
    { re: /шоколад.*морож|морож.*шоколад|chocolate ice/i, rank: 60 },
    { re: /морож|ice\s*cream/i, rank: 55 },
];

function dessertSortRank(name: unknown): number {
    const blob = productNameBlob(name);
    if (/пудинг|pudding/i.test(blob)) return 40;
    if (/ваниль|vanilla/i.test(blob)) return 50;
    if (/шоколад/i.test(blob) && /морож|ice/i.test(blob)) return 60;
    if (/морож|ice\s*cream/i.test(blob)) return 55;
    for (const { re, rank } of DESSERT_PRIORITY) {
        if (re.test(blob)) return rank;
    }
    return 25;
}
