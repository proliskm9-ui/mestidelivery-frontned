
export interface Restaurant {
    id: string;
    name: string;
    rating: string;
    delivery: string;
    img: string; // URL
    screen: string; // Hero/Cover image
    category_id?: string;
    // Computed/Client types
    category?: string;
    min_order?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
    working_hours?: string;
    promo?: string;
    promo_text?: string;
    has_promo?: boolean;
    is_must_try?: boolean;
    is_worth_trying?: boolean;
    must_try_sort?: number;
    worth_trying_sort?: number;
    filter_tags?: string;
    tags?: string[];
    poster_api_token?: string;
    spot_id?: string;
    poster_token?: string;
    poster_spot_id?: number;
}

export interface Product {
    id: string;
    restaurant_id: string;
    name: string;
    description: string;
    price: number;
    img: string;
    category: string;
    weight?: string;
    calories?: string;
    proteins?: string;
    fats?: string;
    carbs?: string;
    ingredients?: string;
    is_available?: boolean;
    external_id?: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
}

export interface Store {
    id: string;
    name: string;
    img: string;
    delivery: string;
    sort_order: number;
}

const API_URL = (import.meta as any).env.VITE_API_URL || '';
const API_BASE = `${API_URL}/api`;

export function resolveImageUrl(path: string): string {
    if (!path) return '';
    // SEC-04: Prevent Path Traversal attempts
    if (path.includes('..') || path.includes('%2e%2e') || path.includes('%2E%2E')) {
        return '';
    }
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }
    const safePath = path.replace(/^\/?(uploads\/)?/, '');
    return `${API_URL}/uploads/${safePath}`;
}

// PERF-03 & PERF-04: Robust, expiring caching (TTL and eviction storage)
class TTLStorage {
    private store = new Map<string, { value: any; expiry: number }>();
    private maxEntries = 80;
    private defaultTtlMs = 3 * 60 * 1000; // 3 minutes standard TTL

    get(key: string): any {
        const item = this.store.get(key);
        if (!item) return undefined;
        if (Date.now() > item.expiry) {
            this.store.delete(key);
            return undefined;
        }
        return item.value;
    }

    set(key: string, value: any, ttlMs = this.defaultTtlMs): void {
        if (this.store.size >= this.maxEntries) {
            // Evict oldest entry (First-In, First-Out)
            const oldestKey = this.store.keys().next().value;
            if (oldestKey) this.store.delete(oldestKey);
        }
        this.store.set(key, { value, expiry: Date.now() + ttlMs });
    }

    has(key: string): boolean {
        return this.get(key) !== undefined;
    }
}

const ttlCache = new TTLStorage();

// Proxy wrapper to maintain backwards compatibility with bracket notation (e.g. cache[key])
const cache = new Proxy({} as Record<string, any>, {
    get(_, prop: string) {
        return ttlCache.get(prop);
    },
    set(_, prop: string, value: any) {
        ttlCache.set(prop, value);
        return true;
    },
    has(_, prop: string) {
        return ttlCache.has(prop);
    }
});

export { cache as restaurantCache };

export const api = {
    getStores: async (): Promise<Store[]> => {
        try {
            const res = await fetch(`${API_BASE}/stores/`);
            if (!res.ok) throw new Error('Failed to fetch stores');
            const data = await res.json();
            data.forEach((s: Store) => { s.img = resolveImageUrl(s.img); });
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    createStore: async (store: Omit<Store, 'id'>): Promise<Store> => {
        const res = await fetch(`${API_BASE}/stores/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(store)
        });
        if (!res.ok) throw new Error('Failed to create store');
        return await res.json();
    },
    updateStore: async (id: string, store: Partial<Store>): Promise<Store> => {
        const res = await fetch(`${API_BASE}/stores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(store)
        });
        if (!res.ok) throw new Error('Failed to update store');
        return await res.json();
    },
    deleteStore: async (id: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/stores/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete store');
    },

    getRestaurants: async (): Promise<Restaurant[]> => {
        try {
            const res = await fetch(`${API_BASE}/restaurants/`);
            if (!res.ok) throw new Error('Failed to fetch restaurants');
            const data = await res.json();
            data.forEach((r: Restaurant) => {
                r.img = resolveImageUrl(r.img);
                r.screen = resolveImageUrl(r.screen);
                cache[`rest_${r.id}`] = r;
            });
            return data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    createRestaurant: async (restaurant: Omit<Restaurant, 'id'>): Promise<Restaurant> => {
        const res = await fetch(`${API_BASE}/restaurants/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(restaurant)
        });
        if (!res.ok) throw new Error('Failed to create restaurant');
        return await res.json();
    },
    updateRestaurant: async (id: string, restaurant: Partial<Restaurant>): Promise<Restaurant> => {
        const res = await fetch(`${API_BASE}/restaurants/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(restaurant)
        });
        if (!res.ok) throw new Error('Failed to update restaurant');
        return await res.json();
    },
    deleteRestaurant: async (id: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/restaurants/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete restaurant');
    },

    getRestaurant: async (id: string): Promise<Restaurant | null> => {
        if (cache[`rest_${id}`]) return cache[`rest_${id}`];
        try {
            const res = await fetch(`${API_BASE}/restaurants/${id}`);
            if (!res.ok) throw new Error('Failed to fetch restaurant');
            const data = await res.json();
            data.img = resolveImageUrl(data.img);
            data.screen = resolveImageUrl(data.screen);
            cache[`rest_${id}`] = data;
            return data;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    getProducts: async (restaurantId: string): Promise<Product[]> => {
        if (cache[`prods_${restaurantId}`]) return cache[`prods_${restaurantId}`];
        try {
            const res = await fetch(`${API_BASE}/products/?restaurant_id=${restaurantId}&limit=1000`);
            if (!res.ok) throw new Error('Failed to fetch products');
            const data = await res.json();
            data.forEach((p: Product) => { p.img = resolveImageUrl(p.img); });
            
            // Sort chronologically (oldest first)
            data.sort((a: Product, b: Product) => {
                const tsA = parseInt(a.id.replace('prod-', '')) || 0;
                const tsB = parseInt(b.id.replace('prod-', '')) || 0;
                if (tsA && tsB) return tsA - tsB;
                return a.id.localeCompare(b.id);
            });

            cache[`prods_${restaurantId}`] = data;
            return data;
        } catch (error) {
            console.error(error);
            return [];
        }
    },
    createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
        const res = await fetch(`${API_BASE}/products/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!res.ok) throw new Error('Failed to create product');
        return await res.json();
    },
    updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!res.ok) throw new Error('Failed to update product');
        return await res.json();
    },
    deleteProduct: async (id: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete product');
    },
    deleteAllProducts: async (): Promise<void> => {
        const res = await fetch(`${API_BASE}/products/all`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete all products');
    },

    getCategories: async (restaurantId: string): Promise<string[]> => {
        try {
            const res = await fetch(`${API_BASE}/products/categories/${restaurantId}`);
            if (!res.ok) throw new Error('Failed to fetch categories');
            const data = await res.json();
            return data.categories || [];
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    // --- Profile API ---
    getHeaders: () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    },

    getProfile: async () => {
        const res = await fetch(`${API_BASE}/profile/me`, {
            headers: api.getHeaders()
        });
        if (res.status === 401) {
            localStorage.removeItem('token');
            throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Failed to fetch profile');
        return await res.json();
    },

    updateProfile: async (updates: any) => {
        const res = await fetch(`${API_BASE}/profile/me`, {
            method: 'PUT',
            headers: api.getHeaders(),
            body: JSON.stringify(updates)
        });
        if (res.status === 401) {
            localStorage.removeItem('token');
            throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Failed to update profile');
        return await res.json();
    },

    linkTelegramAccount: async (initData: string, language: string) => {
        const res = await fetch(`${API_BASE}/profile/telegram-link`, {
            method: 'POST',
            headers: {
                ...api.getHeaders(),
                'X-Telegram-Init-Data': initData,
                'X-App-Language': language,
            },
            body: JSON.stringify({ init_data: initData, language }),
        });
        if (res.status === 401) {
            localStorage.removeItem('token');
            throw new Error('Unauthorized');
        }
        if (!res.ok) {
            throw new Error('Failed to link telegram account');
        }
        return await res.json();
    },

    getOrderHistory: async () => {
        const res = await fetch(`${API_BASE}/profile/orders`, {
            headers: api.getHeaders()
        });
        if (res.status === 401) {
            localStorage.removeItem('token');
            throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Failed to fetch order history');
        return await res.json();
    },

    trackOrder: async (orderId: number) => {
        const res = await fetch(`${API_BASE}/orders/${orderId}`, {
            headers: api.getHeaders()
        });
        if (!res.ok) throw new Error('Failed to track order');
        return await res.json();
    },

    rateOrder: async (orderId: number, data: { rating: number; rating_comment?: string }) => {
        const res = await fetch(`${API_BASE}/orders/${orderId}/rate`, {
            method: 'POST',
            headers: api.getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to rate order');
        return await res.json();
    },

    createOrder: async (data: any): Promise<{ success: boolean; id: number }> => {
        const token = localStorage.getItem('token');
        const headers: any = {
            'Content-Type': 'application/json',
        };
        // Add Bearer token if present
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Add Telegram init data if present (only for non-partner apps)
        try {
            const isPartnerApp = window.location.pathname.startsWith('/partners');
            if (!isPartnerApp && (window as any).Telegram?.WebApp?.initData) {
                headers['X-Telegram-Init-Data'] = (window as any).Telegram.WebApp.initData;
            }
        } catch { }

        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
            throw new Error(err.detail || 'Failed to create order');
        }
        const result = await res.json();
        return { ...result, id: result.order_id || result.id };
    },

    getActiveOrder: async () => {
        const res = await fetch(`${API_BASE}/orders/active`, {
            headers: api.getHeaders()
        });
        if (res.status === 404 || res.status === 204) return null; // Handle not found
        if (!res.ok) return null;
        try {
            return await res.json();
        } catch {
            return null;
        }
    },

    estimateDelivery: async (data: { restaurant_id: string; latitude: number; longitude: number }) => {
        try {
            const res = await fetch(`${API_BASE}/orders/estimate-delivery`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(data)
            });
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    },

    updateOrderStatus: async (orderId: number, status: string) => {
        const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: api.getHeaders(),
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Failed to update order status');
        return await res.json();
    }
};
