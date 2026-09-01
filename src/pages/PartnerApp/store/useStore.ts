import { create } from 'zustand';
import { api } from '../api';
import type { Order, OrderItem } from '../api';

let locationWatchId: number | null = null;

const startLocationTracking = () => {
  if (locationWatchId !== null) return;
  
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    locationWatchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const { latitude, longitude, heading, speed } = position.coords;
          await api.updateLocation(latitude, longitude, heading ?? undefined, speed ?? undefined);
        } catch (e) {
          console.error("Failed to update GPS location:", e);
        }
      },
      (error) => {
        console.error("Error getting geolocation:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }
};

const stopLocationTracking = () => {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
};

const triggerHaptic = (_type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
  // Partner app is standalone — no Telegram WebApp coupling.
};

interface AppState {
  // Аутентификация и навигация
  userRole: 'courier' | 'restaurant' | 'none';
  userName: string;
  userPhone: string;
  currentScreen: 'login' | 'courier-dashboard' | 'restaurant-dashboard';
  activeTab: string; // 'available' | 'active' для курьера; 'active' | 'history' для ресторана
  isLoading: boolean;

  // Настройки роли
  isOnline: boolean; // Курьер
  isRestaurantOpen: boolean; // Ресторан
  courierEarnings: number;
  courierDeliveriesCount: number;
  restaurantRevenue: number;

  // Данные заказов
  activeOrders: Order[];
  historicOrders: Order[];

  // Действия (Actions)
  setLoading: (loading: boolean) => void;
  setScreen: (screen: 'login' | 'courier-dashboard' | 'restaurant-dashboard') => void;
  setActiveTab: (tab: string) => void;
  
  login: (username: string, password?: string) => Promise<void>;
  hydrateSession: () => void;
  logout: () => void;
  
  toggleOnline: () => void;
  toggleRestaurantOpen: () => void;
  
  fetchOrders: () => Promise<void>;
  
  // Действия курьера
  acceptOrder: (orderId: string) => Promise<void>;
  advanceCourierOrder: (orderId: string, status?: Order['status'], atRestaurant?: boolean) => Promise<void>;
  
  // Действия ресторана
  advanceRestaurantOrder: (orderId: string) => Promise<void>;
  cancelRestaurantOrder: (orderId: string) => Promise<void>;
  createOrderFromMenu: (items: OrderItem[]) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  userRole: 'none',
  userName: '',
  userPhone: '',
  currentScreen: 'login',
  activeTab: 'available',
  isLoading: false,

  isOnline: true,
  isRestaurantOpen: true,
  courierEarnings: 0,
  courierDeliveriesCount: 0,
  restaurantRevenue: 0,

  activeOrders: [],
  historicOrders: [],

  setLoading: (loading) => set({ isLoading: loading }),
  
  setScreen: (screen) => set({ currentScreen: screen }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const res = await api.login(username, password);
      triggerHaptic('success');
      localStorage.setItem('partner_auth_method', 'password');
      
      const isRestaurant = res.user.role === 'restaurant_admin' || res.user.role === 'super_admin';
      const role = isRestaurant ? 'restaurant' : 'courier';
      
      set({
        userRole: role,
        userName: res.user.username,
        userPhone: '',
        currentScreen: role === 'courier' ? 'courier-dashboard' : 'restaurant-dashboard',
        activeTab: role === 'courier' ? 'available' : 'active',
        isLoading: false
      });
      
      await get().fetchOrders();
    } catch (error) {
      set({ isLoading: false });
      triggerHaptic('error');
      console.error(error);
      throw error;
    }
  },

  hydrateSession: () => {
    const method = localStorage.getItem('partner_auth_method');
    const token = localStorage.getItem('delivery_jwt_token');
    const refresh = localStorage.getItem('partner_refresh_token');

    // Drop Telegram-linked leftover sessions — partner app is password-only.
    if (method !== 'password') {
      api.clearSession();
      set({
        userRole: 'none',
        userName: '',
        userPhone: '',
        currentScreen: 'login',
        activeOrders: [],
        historicOrders: [],
      });
      return;
    }

    // Old sessions without refresh_token will 401 after ~15m — force re-login.
    if (!token && !refresh) return;
    if (!refresh) {
      api.clearSession();
      set({
        userRole: 'none',
        userName: '',
        userPhone: '',
        currentScreen: 'login',
        activeOrders: [],
        historicOrders: [],
      });
      return;
    }

    try {
      const raw = localStorage.getItem('admin_user');
      const user = raw ? JSON.parse(raw) : null;
      if (!user?.username) {
        get().logout();
        return;
      }
      const isRestaurant = user.role === 'restaurant_admin' || user.role === 'super_admin';
      const role = isRestaurant ? 'restaurant' : 'courier';
      set({
        userRole: role,
        userName: user.username,
        userPhone: '',
        currentScreen: role === 'courier' ? 'courier-dashboard' : 'restaurant-dashboard',
        activeTab: role === 'courier' ? 'available' : 'active',
      });
      void (async () => {
        const ok = await api.ensureSession();
        if (!ok) {
          get().logout();
          return;
        }
        await get().fetchOrders();
      })();
    } catch {
      get().logout();
    }
  },

  logout: () => {
    stopLocationTracking();
    triggerHaptic('light');
    api.clearSession();
    set({
      userRole: 'none',
      userName: '',
      userPhone: '',
      currentScreen: 'login',
      activeOrders: [],
      historicOrders: []
    });
  },

  toggleOnline: async () => {
    const nextOnline = !get().isOnline;
    set({ isOnline: nextOnline });
    triggerHaptic('medium');
    if (nextOnline) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
    try {
      await api.updateCourierStatus(nextOnline);
    } catch (e) {
      console.error("Error updating online status:", e);
    }
  },

  toggleRestaurantOpen: () => {
    triggerHaptic('light');
    set(state => ({ isRestaurantOpen: !state.isRestaurantOpen }));
  },

  fetchOrders: async () => {
    set({ isLoading: true });
    try {
      let active: Order[] = [];
      let historic: Order[] = [];
      let restaurantRevenue = 0;
      let courierEarnings = get().courierEarnings;
      let courierDeliveriesCount = get().courierDeliveriesCount;

      if (get().userRole === 'courier') {
        const available = await api.getAvailableOrders();
        const myOrders = await api.getMyOrders();
        
        // Доступные заказы (свободные ready) + наши активные заказы
        active = [...available, ...myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')];
        // Убираем дубликаты по id
        const seen = new Set();
        active = active.filter(o => {
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        });
        historic = myOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled');
        
        // Получаем реальную статистику
        try {
          const stats = await api.getStats();
          if (stats) {
            courierEarnings = stats.total_tips_earned;
            courierDeliveriesCount = stats.total_deliveries;
            set({ isOnline: stats.is_online });
            if (stats.is_online) {
              startLocationTracking();
            } else {
              stopLocationTracking();
            }
          }
        } catch (e) {
          console.error("Error fetching stats:", e);
        }
      } else if (get().userRole === 'restaurant') {
        active = await api.getRestaurantActiveOrders();
        historic = await api.getRestaurantHistoricOrders();
        
        restaurantRevenue = historic
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + (o.totalAmount - o.deliveryFee), 0);
      }

      set({
        activeOrders: active,
        historicOrders: historic,
        restaurantRevenue,
        courierEarnings,
        courierDeliveriesCount,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      console.error(error);
    }
  },

  acceptOrder: async (orderId) => {
    set({ isLoading: true });
    try {
      await api.takeOrder(orderId);
      triggerHaptic('success');
      set({ activeTab: 'active' });
      await get().fetchOrders();
    } catch (error) {
      set({ isLoading: false });
      triggerHaptic('error');
      console.error(error);
    }
  },

  advanceCourierOrder: async (orderId, status?, atRestaurant?) => {
    const fromStore = get().activeOrders.find((o) => o.id === orderId);
    const currentStatus = status || fromStore?.status;
    if (!currentStatus) return;

    const atRest =
      typeof atRestaurant === 'boolean'
        ? atRestaurant
        : Boolean(fromStore?.atRestaurant) || localStorage.getItem(`order_at_restaurant_${orderId}`) === '1';

    set({ isLoading: true });
    try {
      await api.advanceOrderCourier(orderId, currentStatus, atRest);
      triggerHaptic('success');
      await get().fetchOrders();
    } catch (error) {
      set({ isLoading: false });
      triggerHaptic('error');
      console.error(error);
      throw error;
    }
  },

  advanceRestaurantOrder: async (orderId) => {
    const order = get().activeOrders.find(o => o.id === orderId);
    if (!order) return;

    set({ isLoading: true });
    try {
      let nextStatus: 'confirmed' | 'preparing' | 'ready' = 'preparing';
      if (order.status === 'new') {
        nextStatus = 'confirmed';
      } else if (order.status === 'confirmed') {
        nextStatus = 'preparing';
      } else if (order.status === 'preparing') {
        nextStatus = 'ready';
      }

      await api.updateOrderStatusRestaurant(orderId, nextStatus);
      triggerHaptic('medium');
      await get().fetchOrders();
    } catch (error) {
      set({ isLoading: false });
      triggerHaptic('error');
      console.error(error);
    }
  },

  cancelRestaurantOrder: async (orderId) => {
    set({ isLoading: true });
    try {
      await api.cancelOrder(orderId);
      triggerHaptic('warning');
      await get().fetchOrders();
    } catch (error) {
      set({ isLoading: false });
      triggerHaptic('error');
      console.error(error);
    }
  },

  createOrderFromMenu: async (items) => {
    set({ isLoading: true });
    try {
      await api.createOrderRestaurant(items);
      triggerHaptic('success');
      await get().fetchOrders();
    } catch (error) {
      set({ isLoading: false });
      triggerHaptic('error');
      console.error(error);
    }
  }
}));
