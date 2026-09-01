import type { Language } from '../translations';
import type { Restaurant } from '../services/api';

export const SUPPORTED_LANGUAGES: Language[] = ['ru', 'en', 'ka'];
export const DEFAULT_LANGUAGE: Language = 'en';

const RESTAURANT_IDS_BY_SLUG: Record<string, string> = {
  luizastan: 'rest-1785095837937828031',
  sunset: 'rest-1785108442716453469',
  'bbq-garden': 'rest-1785110335267403964',
  burgers: 'rest-1785203738440428065',
};

const RESTAURANT_SLUGS_BY_ID = Object.fromEntries(
  Object.entries(RESTAURANT_IDS_BY_SLUG).map(([slug, id]) => [id, slug]),
) as Record<string, string>;

export type CustomerPage =
  | 'home'
  | 'login'
  | 'forgot_password'
  | 'menu'
  | 'restaurant'
  | 'cart'
  | 'checkout'
  | 'payment'
  | 'favorites'
  | 'profile'
  | 'order_status'
  | 'order_details';

export interface ParsedCustomerPath {
  language: Language | null;
  page: CustomerPage | null;
  restaurantSlug?: string;
  orderId?: number;
  legacyLegalPath?: string;
}

export function isLanguage(value: string | null | undefined): value is Language {
  return Boolean(value && SUPPORTED_LANGUAGES.includes(value as Language));
}

export function languageFromPath(pathname: string): Language | null {
  const segment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return isLanguage(segment) ? segment : null;
}

export function stripLanguagePrefix(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isLanguage(parts[0])) parts.shift();
  return `/${parts.join('/')}`.replace(/\/+$/, '') || '/';
}

export function replaceLanguageInPath(pathname: string, language: Language): string {
  const path = stripLanguagePrefix(pathname);
  return path === '/' ? `/${language}` : `/${language}${path}`;
}

export function slugifyRestaurantName(name: string): string {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/restaraunt|restaurant/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function restaurantSlug(restaurantOrId: Restaurant | string, name = ''): string {
  const id = typeof restaurantOrId === 'string' ? restaurantOrId : restaurantOrId.id;
  const restaurantName = typeof restaurantOrId === 'string' ? name : restaurantOrId.name;
  return RESTAURANT_SLUGS_BY_ID[id] || slugifyRestaurantName(restaurantName) || id;
}

export function restaurantIdFromSlug(slug: string): string | null {
  if (!slug) return null;
  if (RESTAURANT_IDS_BY_SLUG[slug]) return RESTAURANT_IDS_BY_SLUG[slug];
  if (slug.startsWith('rest-')) return slug;
  return null;
}

export function resolveRestaurantId(slug: string, restaurants: Restaurant[]): string | null {
  const known = restaurantIdFromSlug(slug);
  if (known) return known;
  return restaurants.find((restaurant) => restaurantSlug(restaurant) === slug)?.id || null;
}

export function pagePath(
  language: Language,
  page: CustomerPage,
  options: { restaurant?: Restaurant | string; restaurantName?: string; orderId?: number } = {},
): string {
  const base = `/${language}`;
  switch (page) {
    case 'home': return base;
    case 'login':
      return `${base}/login`;
    case 'forgot_password':
      return `${base}/forgot-password`;
    case 'menu': return `${base}/restaurants`;
    case 'restaurant': {
      const restaurant = options.restaurant;
      if (!restaurant) return `${base}/restaurants`;
      return `${base}/restaurant/${restaurantSlug(restaurant, options.restaurantName)}`;
    }
    case 'order_status':
      return options.orderId ? `${base}/orders/${options.orderId}` : `${base}/restaurants`;
    case 'order_details':
      return options.orderId ? `${base}/orders/${options.orderId}/details` : `${base}/profile`;
    default:
      return `${base}/${page.replace('_', '-')}`;
  }
}

export function parseCustomerPath(pathname: string): ParsedCustomerPath {
  const parts = pathname.split('/').filter(Boolean);
  const language = isLanguage(parts[0]) ? parts.shift() as Language : null;
  const first = parts[0] || '';

  if (!language) {
    const legacyLegal = ['legal', 'terms', 'privacy', 'returns', 'refunds', 'contact', 'support'];
    return {
      language: null,
      page: null,
      legacyLegalPath: legacyLegal.includes(first) ? `/${first}` : undefined,
    };
  }

  if (!first) return { language, page: 'home' };
  if (first === 'restaurants' || first === 'menu') return { language, page: 'menu' };
  if (first === 'restaurant' && parts[1]) {
    return { language, page: 'restaurant', restaurantSlug: decodeURIComponent(parts[1]) };
  }
  if (first === 'orders' && /^\d+$/.test(parts[1] || '')) {
    return {
      language,
      page: parts[2] === 'details' ? 'order_details' : 'order_status',
      orderId: Number(parts[1]),
    };
  }

  const map: Record<string, CustomerPage> = {
    login: 'login',
    'forgot-password': 'forgot_password',
    cart: 'cart',
    checkout: 'checkout',
    payment: 'payment',
    favorites: 'favorites',
    profile: 'profile',
  };
  return { language, page: map[first] || null };
}

export function queryLanguage(search: string): Language | null {
  const value = new URLSearchParams(search).get('lang')?.toLowerCase();
  return isLanguage(value) ? value : null;
}

export function isServicePath(pathname: string): boolean {
  const path = stripLanguagePrefix(pathname);
  return /^\/(admin|partners|verify|reset-password|auth)(\/|$)/.test(path);
}
