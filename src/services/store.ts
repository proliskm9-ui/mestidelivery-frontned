import { create } from 'zustand';
import { obfuscateData, deobfuscateData, isJwtTokenValid } from '../utils/security';
import { getMinimumOrderQuantity } from '../utils/minimumOrderQuantity';

// ==========================================
// 1. Favorites Store
// ==========================================
interface FavoritesState {
    favorites: string[];
    toggleFavorite: (id: string) => void;
    setFavorites: (favorites: string[]) => void;
}

export const useFavoritesStore = create<FavoritesState>((set) => {
    // Initial fetch from localStorage
    const savedFavs = localStorage.getItem('favorites');
    const initialFavs: string[] = savedFavs ? JSON.parse(savedFavs) : [];

    return {
        favorites: initialFavs,
        toggleFavorite: (id) => set((state) => {
            const updated = state.favorites.includes(id)
                ? state.favorites.filter((favId) => favId !== id)
                : [...state.favorites, id];
            localStorage.setItem('favorites', JSON.stringify(updated));
            return { favorites: updated };
        }),
        setFavorites: (favorites) => set({ favorites }),
    };
});

// ==========================================
// 2. User Store (Authentication & Profile & Orders)
// ==========================================
interface UserProfile {
    name: string;
    phone: string;
    points: number;
    avatar: string;
}

interface UserState {
    token: string | null;
    userProfile: UserProfile;
    userAddress: any | null;
    orderHistory: any[];
    selectedOrderId: number | null;
    setToken: (token: string | null) => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    updateAddress: (newAddress: any) => void;
    setOrderHistory: (orders: any[]) => void;
    addOrderToHistory: (order: any) => void;
    setSelectedOrderId: (id: number | null) => void;
    logout: () => void;
}

export const useUserStore = create<UserState>((set) => {
    // Initialize values asynchronously or safely
    const storedToken = localStorage.getItem('token');
    const isTokenValid = isJwtTokenValid(storedToken);

    // If token is invalid/expired, automatically wipe it from localStorage
    if (storedToken && !isTokenValid) {
        localStorage.removeItem('token');
    }

    const token = isTokenValid ? storedToken : null;
    const userAddress = deobfuscateData<any>(localStorage.getItem('sec_address'));
    
    const storedName = deobfuscateData<string>(localStorage.getItem('sec_name')) || '...';
    const storedPhone = deobfuscateData<string>(localStorage.getItem('sec_phone')) || '';
    const storedAvatar = localStorage.getItem('user_avatar') || '👤';

    return {
        token,
        userProfile: {
            name: storedName,
            phone: storedPhone,
            points: 0,
            avatar: storedAvatar,
        },
        userAddress,
        orderHistory: [],
        selectedOrderId: null,
        setToken: (token) => set(() => {
            if (token) {
                localStorage.setItem('token', token);
            } else {
                localStorage.removeItem('token');
            }
            return { token };
        }),
        updateProfile: (updates) => set((state) => {
            const nextProfile = { ...state.userProfile, ...updates };
            if (updates.name !== undefined) localStorage.setItem('sec_name', obfuscateData(updates.name));
            if (updates.phone !== undefined) localStorage.setItem('sec_phone', obfuscateData(updates.phone));
            if (updates.avatar !== undefined) localStorage.setItem('user_avatar', updates.avatar);
            return { userProfile: nextProfile };
        }),
        updateAddress: (newAddress) => set(() => {
            localStorage.setItem('sec_address', obfuscateData(newAddress));
            if (newAddress && newAddress.phone) {
                localStorage.setItem('sec_phone', obfuscateData(newAddress.phone));
            }
            return { userAddress: newAddress };
        }),
        setOrderHistory: (orderHistory) => set({ orderHistory }),
        addOrderToHistory: (order) => set((state) => ({
            orderHistory: [order, ...state.orderHistory],
        })),
        setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),
        logout: () => set(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user_avatar');
            localStorage.removeItem('user_id');
            localStorage.removeItem('sec_name');
            localStorage.removeItem('sec_phone');
            localStorage.removeItem('sec_address');
            return {
                token: null,
                userProfile: { name: '...', phone: '', points: 0, avatar: '👤' },
                userAddress: null,
                orderHistory: [],
                selectedOrderId: null,
            };
        }),
    };
});

// ==========================================
// 3. Cart Store
// ==========================================
export interface CartItem {
    product: any;
    quantity: number;
}

interface CartState {
    cart: CartItem[];
    selectedRestaurantId: string | null;
    checkoutExtras: { comment: string; cutlery: number };
    addToCart: (product: any, restaurantId: string | null) => void;
    updateQuantity: (productId: string, delta: number) => void;
    clearCart: () => void;
    setCheckoutExtras: (extras: Partial<{ comment: string; cutlery: number }>) => void;
    setSelectedRestaurantId: (restaurantId: string | null) => void;
}

export const useCartStore = create<CartState>((set) => ({
    cart: [],
    selectedRestaurantId: null,
    checkoutExtras: { comment: '', cutlery: 1 },
    addToCart: (product, restaurantId) => set((state) => {
        // If switching restaurants, clear cart or handle appropriately.
        // For standard flow, we append or check if it matches existing restaurant.
        const existingItem = state.cart.find((item) => item.product.id === product.id);
        const nextCart = existingItem
            ? state.cart.map((item) =>
                  item.product.id === product.id
                      ? { ...item, quantity: item.quantity + 1 }
                      : item
              )
            : [...state.cart, { product, quantity: getMinimumOrderQuantity(product) }];

        return {
            cart: nextCart,
            selectedRestaurantId: restaurantId || state.selectedRestaurantId,
        };
    }),
    updateQuantity: (productId, delta) => set((state) => {
        const nextCart = state.cart.flatMap((item) => {
            if (item.product.id !== productId) return [item];

            const minimum = getMinimumOrderQuantity(item.product);
            if (delta < 0 && item.quantity <= minimum) return [];

            return [{ ...item, quantity: Math.max(minimum, item.quantity + delta) }];
        });

        return {
            cart: nextCart,
            selectedRestaurantId: nextCart.length === 0 ? null : state.selectedRestaurantId,
        };
    }),
    clearCart: () => set({ cart: [], selectedRestaurantId: null }),
    setCheckoutExtras: (extras) => set((state) => ({
        checkoutExtras: { ...state.checkoutExtras, ...extras },
    })),
    setSelectedRestaurantId: (selectedRestaurantId) => set({ selectedRestaurantId }),
}));
