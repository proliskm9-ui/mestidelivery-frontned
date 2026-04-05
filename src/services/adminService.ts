const API_URL = (import.meta as any).env.VITE_API_URL || 'https://mestiapi.ddns.net';

// Admin Auth Types
export type UserRole = 'super_admin' | 'restaurant_admin' | 'courier';

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
        return data ? JSON.parse(data) : null;
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

    isAuthenticated: (): boolean => !!adminAuth.getToken(),

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
            if (err.detail) errorMsg = err.detail;
            else if (err.message) errorMsg = err.message;
        } catch (_) {
            // JSON parse failed, use generic error
        }
        throw new Error(errorMsg);
    }

    return res.json();
}

export const adminApi = {
    get: <T>(url: string) => request<T>(url),
    post: <T>(url: string, data: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(data) }),
    patch: <T>(url: string, data: unknown) => request<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
    put: <T>(url: string, data: unknown) => request<T>(url, { method: 'PUT', body: JSON.stringify(data) }),
    delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
    upload: async (file: File) => {
        const token = adminAuth.getToken();
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/api/upload/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Upload failed');
        }
        return res.json() as Promise<{ success: boolean; url: string }>;
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
};
