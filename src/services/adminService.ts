import { resolveImageUrl } from './api';

const API_URL = (import.meta as any).env.VITE_API_URL || '';// Admin Auth Types
export type UserRole = 'super_admin' | 'restaurant_admin' | 'courier' | 'editor' | 'dispatcher' | 'business_owner';

export type AdminUser = {
    id: number;
    username: string;
    role: UserRole;
    restaurant_id?: string;
};

// Storage Keys
const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

// Auth Service
export const adminAuth = {
    getToken: (): string | null => localStorage.getItem(TOKEN_KEY),

    getUser: (): AdminUser | null => {
        const data = localStorage.getItem(USER_KEY);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse admin user from localStorage:", e);
            localStorage.removeItem(USER_KEY);
            return null;
        }
    },

    setAuth: (token: string, user: AdminUser) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    clearAuth: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    login: async (username: string, password: string) => {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await res.json();
        adminAuth.setAuth(data.token, data.user);
        return data;
    },

    logout: () => {
        adminAuth.clearAuth();
        window.location.reload(); // Simple reload to reset state
    },

    isAuthenticated: (): boolean => !!adminAuth.getToken() && !!adminAuth.getUser(),

    isSuperAdmin: (): boolean => {
        const user = adminAuth.getUser();
        return user?.role === 'super_admin';
    }
};

// API Service
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = adminAuth.getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const res = await fetch(`${API_URL}/api${endpoint}`, {
        ...options,
        headers: { ...headers, ...options?.headers },
    });

    if (res.status === 401) {
        adminAuth.clearAuth();
        window.location.reload();
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        let errorMsg = `Error ${res.status}`;
        try {
            const err = await res.json();
            errorMsg = JSON.stringify(err);
        } catch (_) {
            // JSON parse failed, use generic error
        }
        throw new Error(errorMsg);
    }

    const data = await res.json();
    return processImages(data);
}

// Deep transform images
function processImages(obj: any): any {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(processImages);
    if (typeof obj === 'object') {
        const newObj = { ...obj };
        if (newObj.img && typeof newObj.img === 'string') newObj.img = resolveImageUrl(newObj.img);
        if (newObj.screen && typeof newObj.screen === 'string') newObj.screen = resolveImageUrl(newObj.screen);
        for (const key in newObj) {
            // Stop deep recursion beyond reasonable array nesting
            if (typeof newObj[key] === 'object' && key !== 'img' && key !== 'screen') {
                newObj[key] = processImages(newObj[key]);
            }
        }
        return newObj;
    }
    return obj;
}

// Strip absolute localhost URLs back to relative paths before sending to backend
function unresolveImageUrl(url: string): string {
    if (!url) return url;
    // If it's a localhost or same-origin URL, extract just the relative path
    try {
        const parsed = new URL(url);
        // Only strip if it's pointing to our backend (localhost or same host)
        const apiUrl = (import.meta as any).env.VITE_API_URL || '';
        const apiHost = apiUrl ? new URL(apiUrl).host : window.location.host;
        if (parsed.host === apiHost || parsed.hostname === 'localhost') {
            // Return relative path without the leading /uploads/
            return parsed.pathname.replace(/^\/uploads\//, '');
        }
    } catch (_) {
        // Not a valid URL, return as-is (already relative)
    }
    return url;
}

// Sanitize payload: strip absolute image URLs before sending to backend
function sanitizePayload(data: unknown): unknown {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    const obj = { ...(data as Record<string, any>) };
    if (obj.img && typeof obj.img === 'string') obj.img = unresolveImageUrl(obj.img);
    if (obj.screen && typeof obj.screen === 'string') obj.screen = unresolveImageUrl(obj.screen);
    return obj;
}
// Cache store for fast preloading
const apiCache: Record<string, { data: any, promise: Promise<any> | null, timestamp: number }> = {};
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const adminApi = {
    preload: async () => {
        // Pre-fetch heavy endpoints in background
        const endpoints = ['/restaurants/', '/products/admin?limit=1000', '/orders/admin?limit=1000', '/stores/'];
        endpoints.forEach(ep => {
            adminApi.get(ep, true).catch(() => {}); // silent fail for preload
        });
    },
    invalidate: (url?: string) => {
        if (url) {
            // Invalidate cache by base path (e.g. /products/123 invalidates /products/admin)
            const parts = url.split('/').filter(Boolean);
            if (parts.length > 0) {
                const base = `/${parts[0]}`;
                Object.keys(apiCache).forEach(k => {
                    if (k.includes(base)) delete apiCache[k];
                });
            }
        } else {
            Object.keys(apiCache).forEach(k => delete apiCache[k]);
        }
    },
    get: async <T>(url: string, force = false): Promise<T> => {
        const now = Date.now();
        const cached = apiCache[url];
        
        if (!force && cached && cached.data && (now - cached.timestamp < CACHE_TTL)) {
            // Return cached instantly, but refetch in background to keep fresh SWR-style
            if (!cached.promise) {
                 cached.promise = request<T>(url).then(data => {
                     apiCache[url] = { data, promise: null, timestamp: Date.now() };
                     return data;
                 }).catch(() => null) as any;
            }
            return cached.data;
        }

        if (cached && cached.promise) {
            return cached.promise; // Await ongoing request
        }

        const promise = request<T>(url);
        apiCache[url] = { data: null, promise, timestamp: 0 };
        
        try {
            const data = await promise;
            apiCache[url] = { data, promise: null, timestamp: Date.now() };
            return data;
        } catch (e) {
            delete apiCache[url];
            throw e;
        }
    },
    post: async <T>(url: string, data: unknown) => {
        const res = await request<T>(url, { method: 'POST', body: JSON.stringify(sanitizePayload(data)) });
        adminApi.invalidate(url);
        return res;
    },
    patch: async <T>(url: string, data: unknown) => {
        const res = await request<T>(url, { method: 'PATCH', body: JSON.stringify(sanitizePayload(data)) });
        adminApi.invalidate(url);
        return res;
    },
    put: async <T>(url: string, data: unknown) => {
        const res = await request<T>(url, { method: 'PUT', body: JSON.stringify(sanitizePayload(data)) });
        adminApi.invalidate(url);
        return res;
    },
    delete: async <T>(url: string) => {
        const res = await request<T>(url, { method: 'DELETE' });
        adminApi.invalidate(url);
        return res;
    },
    upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = adminAuth.getToken();
        const headers: HeadersInit = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const res = await fetch(`${API_URL}/api/upload/`, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Upload failed');
        }
        const data = await res.json();
        return { success: true, url: resolveImageUrl(data.url || data.file_path) };
    }
};

// Types
export type Order = {
    id: number;
    user_id: string;
    restaurant_id: string;
    items: string;
    total: number;
    status: string;
    created_at: string;
    customer_name?: string;
    phone?: string;
    address?: string;
    comment?: string;
    restaurant_confirmed?: boolean;
    courier_confirmed?: boolean;
    courier_id?: number;
};

export type Product = {
    id: string;
    restaurant_id: string;
    name: string;
    description: string;
    price: number;
    img: string;
    category?: string;
    weight?: string;
    calories?: string;
    proteins?: string;
    fats?: string;
    carbs?: string;
    ingredients?: string;
    is_available?: boolean;
    external_id?: string;
};

export type CourierStats = {
    total_deliveries: number;
    total_tips_earned: number;
    total_order_value: number;
    active_orders: number;
    is_online: boolean;
};

export type AvailableOrder = {
    id: number;
    restaurant_id: string;
    restaurant_name: string;
    restaurant_address?: string;
    address: string;
    total: number;
    tips: number;
    distance_km: number;
    items_count: number;
    created_at?: string;
};

export type Restaurant = {
    id: string;
    name: string;
    rating: string | number;
    delivery: string;
    img: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    poster_api_token?: string;
    spot_id?: string;
    poster_token?: string;
    poster_spot_id?: number;
};
