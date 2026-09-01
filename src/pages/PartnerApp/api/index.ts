export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'arrived'
  | 'delivered'
  | 'cancelled';

export type CourierAction = 'accept' | 'arrived_rest' | 'waiting' | 'pick_up' | 'complete';

export interface Order {
  id: string;
  restaurantName: string;
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  assignedCourierName?: string;
  phone?: string;
  comment?: string;
  atRestaurant?: boolean;
}

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const ACCESS_KEY = 'delivery_jwt_token';
const REFRESH_KEY = 'partner_refresh_token';

export class PartnerAuthError extends Error {
  constructor(message = 'Сессия истекла') {
    super(message);
    this.name = 'PartnerAuthError';
  }
}

const getHeaders = (extra?: HeadersInit): HeadersInit => {
  const token = localStorage.getItem(ACCESS_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (extra) {
    const e = new Headers(extra);
    e.forEach((v, k) => {
      headers[k] = v;
    });
  }
  return headers;
};

const clearAuthStorage = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('admin_token');
  localStorage.removeItem('partner_auth_method');
};

const notifyAuthExpired = () => {
  window.dispatchEvent(new CustomEvent('partner-auth-expired'));
};

let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = async (): Promise<boolean> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) return false;
    try {
      const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      const access = data.access_token || data.token;
      const nextRefresh = data.refresh_token;
      if (!access) return false;
      localStorage.setItem(ACCESS_KEY, access);
      localStorage.setItem('admin_token', access);
      if (nextRefresh) localStorage.setItem(REFRESH_KEY, nextRefresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/** Authenticated fetch with one-shot refresh on 401. */
const partnerFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const doFetch = () =>
    fetch(url, {
      ...init,
      headers: getHeaders(init.headers),
    });

  let response = await doFetch();
  if (response.status !== 401) return response;

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    clearAuthStorage();
    notifyAuthExpired();
    throw new PartnerAuthError('Сессия истекла — войдите снова');
  }

  response = await doFetch();
  if (response.status === 401) {
    clearAuthStorage();
    notifyAuthExpired();
    throw new PartnerAuthError('Сессия истекла — войдите снова');
  }
  return response;
};

const asOrderArray = (data: unknown): Order[] => {
  if (!Array.isArray(data)) return [];
  return data.map(mapBackendOrderToFrontend);
};

export const mapBackendOrderToFrontend = (bo: any): Order => {
  let itemsParsed: OrderItem[] = [];
  if (bo.items) {
    try {
      itemsParsed = typeof bo.items === 'string' ? JSON.parse(bo.items) : bo.items;
      itemsParsed = itemsParsed.map((it: any) => ({
        name: it.name || it.product_id || 'Товар',
        quantity: it.quantity || 1,
        price: it.price || 0,
      }));
    } catch (e) {
      console.error('Error parsing items:', e);
    }
  }

  let status: OrderStatus = 'new';
  if (bo.status === 'pending') status = 'new';
  else if (bo.status === 'confirmed' || bo.status === 'accepted') status = 'confirmed';
  else if (bo.status === 'preparing') status = 'preparing';
  else if (bo.status === 'ready') status = 'ready';
  else if (bo.status === 'delivering') status = 'picked_up';
  else if (bo.status === 'delivered') status = 'delivered';
  else if (bo.status === 'cancelled') status = 'cancelled';

  const scrub = (v: unknown) => {
    const s = String(v ?? '').trim();
    if (!s) return '';
    const low = s.toLowerCase();
    if (low === 'unknown restaurant' || low === 'unknown address' || low === 'unknown') return '';
    return s;
  };

  const atRestaurant =
    localStorage.getItem(`order_at_restaurant_${bo.id}`) === '1' ||
    Boolean(bo.courier_confirmed);

  return {
    id: String(bo.id),
    restaurantName: scrub(bo.restaurant_name),
    pickupAddress: scrub(bo.restaurant_address),
    deliveryAddress: scrub(bo.address),
    distanceKm: typeof bo.distance_km === 'number' ? bo.distance_km : 0,
    deliveryFee: typeof bo.delivery_fee === 'number' ? bo.delivery_fee : 0,
    totalAmount: bo.total || bo.totalAmount || 0,
    status,
    items: itemsParsed,
    createdAt: bo.created_at || new Date().toISOString(),
    assignedCourierName: bo.courier_id ? `Курьер #${bo.courier_id}` : undefined,
    comment: typeof bo.comment === 'string' ? bo.comment : '',
    atRestaurant,
    ...(bo.phone || bo.customer_phone ? { phone: bo.phone || bo.customer_phone } : {}),
  } as Order;
};

/** Next courier CTA matching bot next_allowed_action. */
export function resolveCourierAction(
  status: OrderStatus,
  atRestaurant: boolean,
): CourierAction {
  if (status === 'picked_up' || status === 'arrived') return 'complete';
  if (status === 'ready' && atRestaurant) return 'pick_up';
  if (status === 'ready' && !atRestaurant) return 'arrived_rest';
  if (!atRestaurant && ['new', 'confirmed', 'preparing'].includes(status)) return 'arrived_rest';
  if (atRestaurant && status === 'preparing') return 'waiting';
  if (atRestaurant && ['new', 'confirmed'].includes(status)) return 'waiting';
  return 'waiting';
}

export const api = {
  login: async (username: string, password?: string): Promise<{ token: string; user: any }> => {
    let finalPassword = password || '123';
    if (!password && username === 'admin') finalPassword = 'admin123';

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: finalPassword }),
    });

    if (!response.ok) {
      throw new Error('Неверное имя пользователя или пароль');
    }

    const data = await response.json();
    localStorage.setItem(ACCESS_KEY, data.token);
    localStorage.setItem('admin_token', data.token);
    if (data.refresh_token) {
      localStorage.setItem(REFRESH_KEY, data.refresh_token);
    }
    if (data.user) {
      localStorage.setItem('admin_user', JSON.stringify(data.user));
    }

    if (data.user?.restaurant_id) {
      localStorage.setItem('partner_role_id', data.user.restaurant_id);
    } else if (data.user?.id) {
      localStorage.setItem('partner_role_id', String(data.user.id));
    }
    return data;
  },

  /** Ensure access token is valid (refresh if needed). Returns false if must re-login. */
  ensureSession: async (): Promise<boolean> => {
    const access = localStorage.getItem(ACCESS_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) {
      if (access) {
        // Legacy session without refresh — force re-login once.
        clearAuthStorage();
      }
      return false;
    }

    if (access) {
      try {
        const payload = JSON.parse(atob(access.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        const expMs = (payload?.exp ?? 0) * 1000;
        if (expMs > Date.now() + 20_000) return true;
      } catch {
        // fall through to refresh
      }
    }

    return refreshAccessToken();
  },

  clearSession: clearAuthStorage,

  getStats: async (): Promise<any> => {
    const response = await partnerFetch('/api/courier/stats');
    if (!response.ok) throw new Error('Ошибка загрузки статистики');
    return response.json();
  },

  getAvailableOrders: async (): Promise<Order[]> => {
    const response = await partnerFetch('/api/courier/available-orders');
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || 'Ошибка загрузки свободных заказов');
    }
    const data = await response.json();
    return asOrderArray(data).filter((o) => !['delivered', 'cancelled'].includes(o.status));
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await partnerFetch('/api/courier/my-orders');
    if (!response.ok) throw new Error('Ошибка загрузки моих заказов');
    const data = await response.json();
    return asOrderArray(data);
  },

  getRestaurantActiveOrders: async (): Promise<Order[]> => {
    const roleId = localStorage.getItem('partner_role_id');
    const query = roleId ? `?role=restaurant_admin&role_id=${roleId}` : '?role=restaurant_admin';
    const response = await partnerFetch(`/api/orders${query}`);
    if (!response.ok) throw new Error('Ошибка загрузки заказов ресторана');
    const data = await response.json();
    return data
      .filter((o: any) => {
        const isOnlinePending = o.status === 'pending' && o.comment?.includes('[Оплата: Онлайн]');
        if (isOnlinePending) return false;
        return !['delivered', 'cancelled'].includes(o.status);
      })
      .map(mapBackendOrderToFrontend);
  },

  getRestaurantHistoricOrders: async (): Promise<Order[]> => {
    const roleId = localStorage.getItem('partner_role_id');
    const query = roleId ? `?role=restaurant_admin&role_id=${roleId}` : '?role=restaurant_admin';
    const response = await partnerFetch(`/api/orders${query}`);
    if (!response.ok) throw new Error('Ошибка загрузки истории заказов');
    const data = await response.json();
    return data
      .filter((o: any) => ['delivered', 'cancelled'].includes(o.status))
      .map(mapBackendOrderToFrontend);
  },

  takeOrder: async (orderId: string): Promise<void> => {
    const response = await partnerFetch(`/api/courier/take-order/${orderId}`, { method: 'POST' });
    if (!response.ok) throw new Error('Не удалось принять заказ');
  },

  updateCourierStatus: async (isOnline: boolean): Promise<void> => {
    const response = await partnerFetch('/api/courier/status', {
      method: 'POST',
      body: JSON.stringify({ is_online: isOnline }),
    });
    if (!response.ok) throw new Error('Не удалось изменить статус линии');
  },

  updateOrderStatusRestaurant: async (
    orderId: string,
    status: 'confirmed' | 'preparing' | 'ready',
  ): Promise<void> => {
    const response = await partnerFetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Не удалось обновить статус заказа');
  },

  cancelOrder: async (orderId: string): Promise<void> => {
    const response = await partnerFetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Не удалось отменить заказ');
  },

  advanceOrderCourier: async (orderId: string, currentStatus: OrderStatus, atRestaurant = false): Promise<void> => {
    const action = resolveCourierAction(currentStatus, atRestaurant);
    if (action === 'arrived_rest') {
      const response = await partnerFetch(`/api/courier/arrived-restaurant/${orderId}`, { method: 'POST' });
      if (!response.ok) {
        if (response.status === 404) {
          await partnerFetch('/api/courier/confirm-handover', {
            method: 'POST',
            body: JSON.stringify({ order_id: Number(orderId), confirmed_by: 'courier' }),
          }).catch(() => null);
          localStorage.setItem(`order_at_restaurant_${orderId}`, '1');
          return;
        }
        const detail = await response.text().catch(() => '');
        throw new Error(detail || 'Не удалось отметить прибытие');
      }
      localStorage.setItem(`order_at_restaurant_${orderId}`, '1');
      return;
    }
    if (action === 'pick_up') {
      const response = await partnerFetch(`/api/courier/pick-up/${orderId}`, { method: 'POST' });
      if (response.ok) return;
      if (response.status === 404) {
        const fallback = await partnerFetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'delivering' }),
        });
        if (!fallback.ok) {
          const detail = await fallback.text().catch(() => '');
          throw new Error(detail || 'Не удалось забрать заказ');
        }
        return;
      }
      const detail = await response.text().catch(() => '');
      throw new Error(detail || 'Не удалось забрать заказ');
    }
    if (action === 'complete') {
      const response = await partnerFetch(`/api/courier/complete-delivery/${orderId}`, { method: 'POST' });
      if (!response.ok) throw new Error('Не удалось завершить заказ');
      localStorage.removeItem(`order_at_restaurant_${orderId}`);
      localStorage.removeItem(`order_arrived_${orderId}`);
    }
  },

  createOrderRestaurant: async (items: OrderItem[]): Promise<Order> => {
    const response = await partnerFetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        user_id: `partner_restaurant_${Date.now()}`,
        restaurant_id: 'kubdari',
        restaurant_name: 'ДОМ КУБДАРИ',
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0) + 5,
        customer_name: 'Иван Курьерский',
        phone: '+79998887766',
        address: 'ул. Пушкина, д. 10, кв. 25',
        comment: 'Доставка через Mini App',
        payment_method: 'cash',
      }),
    });

    if (!response.ok) throw new Error('Не удалось создать заказ');
    const data = await response.json();
    return mapBackendOrderToFrontend(data);
  },

  updateLocation: async (
    latitude: number,
    longitude: number,
    heading?: number,
    speed?: number,
  ): Promise<void> => {
    if (!localStorage.getItem(ACCESS_KEY)) return;
    await partnerFetch('/api/courier/location', {
      method: 'POST',
      body: JSON.stringify({
        latitude,
        longitude,
        heading: heading || 0,
        speed: speed || 0,
      }),
    });
  },
};
