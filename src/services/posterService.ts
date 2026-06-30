/**
 * Poster POS API Service
 * 
 * Взаимодействие с Poster API через Vite proxy (/poster-api → joinposter.com/api).
 * Используется для импорта меню ресторана из Poster в MestiDelivery.
 */

// In dev: Vite proxy /api/poster-api → https://joinposter.com/api
// In prod: Go backend proxy /api/poster-api → https://joinposter.com/api
const API_URL = import.meta.env.VITE_API_URL || '';
const POSTER_PROXY_BASE = `${API_URL}/api/poster-api`;

export interface PosterProduct {
    product_id: string;
    product_name: string;
    menu_category_id: string;
    price: Record<string, string> | string;
    type: string; // "2" = тех.карта, "3" = товар
    photo?: string;
    photo_origin?: string;
    spots?: Array<{
        spot_id: string;
        price: string;
        visible: string;
    }>;
    group_modifications?: Array<{
        dish_modification_group_id: string;
        name: string;
        modifications: Array<{
            dish_modification_id: string;
            name: string;
            price?: string;
        }>;
    }>;
}

export interface PosterCategory {
    category_id: string;
    category_name: string;
    category_photo?: string;
    parent_category: string;
}

export interface PosterSpot {
    spot_id: string;
    name: string;
    address: string;
}

export interface PosterApiResponse<T> {
    response: T;
    error?: {
        code: number;
        message: string;
    };
}

/**
 * Parse Poster price (stored in kopecks/tiri as integers) to GEL decimal
 * Poster uses format: { "1": "2800" } where key is spot_id, value is price in kopecks
 */
function parsePosterPrice(price: Record<string, string> | string | undefined, spotId?: string): number {
    if (!price) return 0;
    
    let kopecks: number;
    if (typeof price === 'string') {
        kopecks = parseInt(price, 10) || 0;
    } else if (typeof price === 'object') {
        // Price is per-spot: { "1": "2800", "2": "2800" }
        const spotKey = spotId || Object.keys(price)[0];
        kopecks = parseInt(price[spotKey] || '0', 10) || 0;
    } else {
        kopecks = 0;
    }
    
    // Convert kopecks (tiri) to GEL: 2800 → 28.00
    return kopecks / 100;
}

/**
 * Get photo URL from Poster product
 */
function getPosterPhotoUrl(product: PosterProduct): string {
    if (product.photo_origin) {
        return `https://joinposter.com${product.photo_origin}`;
    }
    if (product.photo) {
        return `https://joinposter.com${product.photo}`;
    }
    return '';
}

async function posterRequest<T>(method: string, token: string, params?: Record<string, string>): Promise<T> {
    const queryParams = new URLSearchParams({
        token,
        format: 'json',
        ...params
    });
    
    const url = `${POSTER_PROXY_BASE}/${method}?${queryParams.toString()}`;
    
    const res = await fetch(url);
    
    if (!res.ok) {
        throw new Error(`Poster API error: ${res.status} ${res.statusText}`);
    }
    
    const data: PosterApiResponse<T> = await res.json();
    
    if (data.error) {
        const errMsg = data.error.message || `Error code ${data.error.code}`;
        throw new Error(`Poster: ${errMsg}`);
    }
    
    return data.response;
}

/**
 * Fetch products from Poster menu
 */
export async function fetchPosterProducts(token: string): Promise<PosterProduct[]> {
    // Не фильтруем по типу — нужны и тех.карты (type=2) и товары (type=3).
    // Тип 1 (полуфабрикаты) отсекаем ниже при нормализации.
    // Аналогично backend-методу GetMenuProducts (без параметра type).
    return posterRequest<PosterProduct[]>('menu.getProducts', token);
}

/**
 * Fetch categories from Poster menu
 */
export async function fetchPosterCategories(token: string): Promise<PosterCategory[]> {
    return posterRequest<PosterCategory[]>('menu.getCategories', token);
}

/**
 * Fetch spots (locations) from Poster
 */
export async function fetchPosterSpots(token: string): Promise<PosterSpot[]> {
    return posterRequest<PosterSpot[]>('spots.getSpots', token);
}

/**
 * Verify that a Poster token is valid by trying to fetch spots
 */
export async function verifyPosterToken(token: string): Promise<boolean> {
    try {
        const spots = await fetchPosterSpots(token);
        return Array.isArray(spots) && spots.length > 0;
    } catch {
        return false;
    }
}

export interface NormalizedPosterProduct {
    poster_product_id: string;
    name: string;
    price: number; // in GEL
    category_name: string;
    photo_url: string;
    type: string;
    has_modifications: boolean;
}

/**
 * Fetch and normalize Poster products for display/import
 * Filters out group items (type=3 without price) and returns clean list
 */
export async function fetchNormalizedPosterMenu(
    token: string, 
    spotId?: string
): Promise<{ products: NormalizedPosterProduct[]; categories: Record<string, string> }> {
    const [products, categories] = await Promise.all([
        fetchPosterProducts(token),
        fetchPosterCategories(token).catch(() => [] as PosterCategory[])
    ]);
    
    // Build category map
    const categoryMap: Record<string, string> = { '0': 'Основное' };
    for (const cat of categories) {
        categoryMap[cat.category_id] = cat.category_name;
    }
    
    // Normalize products
    const normalized: NormalizedPosterProduct[] = [];
    
    for (const p of products) {
        // Полуфабрикаты (type=1) — технические записи, не меню
        if (p.type === '1') continue;

        // Пробуем получить цену для конкретной точки (spot)
        let price = parsePosterPrice(p.price, spotId);

        // Тех.карты (type=2) хранят цену в верхнем объекте price: { "1": "2800" }
        // Товары (type=3) — цена может быть в spots[].price
        if (price === 0 && p.spots && p.spots.length > 0) {
            const targetSpot = spotId
                ? p.spots.find(s => s.spot_id === spotId)
                : p.spots[0];
            if (targetSpot) {
                price = parseInt(targetSpot.price || '0', 10) / 100;
            }
        }

        // Пропускаем type=3 без цены — это контейнеры-группы без цены
        if (p.type === '3' && price === 0) continue;

        const typeName = p.type === '3' ? 'товар' : p.type === '2' ? 'тех.карта' : p.type;
        
        normalized.push({
            poster_product_id: p.product_id,
            name: p.product_name,
            price,
            category_name: categoryMap[p.menu_category_id] || 'Основное',
            photo_url: getPosterPhotoUrl(p),
            type: typeName,
            has_modifications: !!(p.group_modifications && p.group_modifications.length > 0)
        });
    }
    
    // Sort by name
    normalized.sort((a, b) => a.name.localeCompare(b.name));
    
    return { products: normalized, categories: categoryMap };
}
