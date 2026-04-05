
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
    promo?: string;
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

function resolveImageUrl(path: string): string {
    if (path && path.startsWith('/uploads/')) {
        return `${API_URL}${path}`;
    }
    return path;
}

const cache: Record<string, any> = {};
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
            return []; // Fallback to empty
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
            return [];
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
            const res = await fetch(`${API_BASE}/products/?restaurant_id=${restaurantId}`);
            if (!res.ok) throw new Error('Failed to fetch products');
            const data = await res.json();
            data.forEach((p: Product) => { p.img = resolveImageUrl(p.img); });
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
        if (!res.ok) throw new Error('Failed to fetch profile');
        return await res.json();
    },

    updateProfile: async (updates: any) => {
        const res = await fetch(`${API_BASE}/profile/me`, {
            method: 'PUT',
            headers: api.getHeaders(),
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update profile');
        return await res.json();
    },

    getOrderHistory: async () => {
        const res = await fetch(`${API_BASE}/profile/orders`, {
            headers: api.getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch order history');
        return await res.json();
    },

    trackOrder: async (orderId: number) => {
        const res = await fetch(`${API_BASE}/orders/track/${orderId}`, {
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
        // Add Telegram init data if present
        try {
            if ((window as any).Telegram?.WebApp?.initData) {
                headers['X-Telegram-Init-Data'] = (window as any).Telegram.WebApp.initData;
            }
        } catch { }

        const res = await fetch(`${API_BASE}/orders/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
            throw new Error(err.detail || 'Failed to create order');
        }
        return await res.json();
    },

    getActiveOrder: async (userId: string) => {
        const res = await fetch(`${API_BASE}/orders/active/${userId}`, {
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
    }
};
