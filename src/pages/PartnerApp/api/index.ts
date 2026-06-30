export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | 'new'          // Ресторан: Новый заказ, ожидает подтверждения
  | 'confirmed'    // Ресторан: Подтвержден, но еще не на кухне
  | 'preparing'    // Ресторан: Готовится на кухне
  | 'ready'        // Ресторан: Готов к выдаче (Курьер: Доступен для взятия)
  | 'picked_up'    // Курьер: Забрал из ресторана, везет клиенту
  | 'arrived'      // Курьер: Прибыл к клиенту, ожидает передачи
  | 'delivered'    // Завершен: Успешно доставлен
  | 'cancelled';   // Завершен: Отменен

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
}

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'https://mestigo.opik.net').replace(/\/$/, '');

// Вспомогательный метод для получения JWT токена
const getHeaders = () => {
  const token = localStorage.getItem('delivery_jwt_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Хелпер для маппинга заказов с бэкенда во фронтенд
export const mapBackendOrderToFrontend = (bo: any): Order => {
  let itemsParsed: OrderItem[] = [];
  if (bo.items) {
    try {
      itemsParsed = typeof bo.items === 'string' ? JSON.parse(bo.items) : bo.items;
      itemsParsed = itemsParsed.map((it: any) => ({
        name: it.name || it.product_id || 'Товар',
        quantity: it.quantity || 1,
        price: it.price || 0
      }));
    } catch (e) {
      console.error("Error parsing items:", e);
    }
  }

  let status: OrderStatus = 'new';
  if (bo.status === 'pending') status = 'new';
  else if (bo.status === 'confirmed' || bo.status === 'accepted') status = 'confirmed';
  else if (bo.status === 'preparing') status = 'preparing';
  else if (bo.status === 'ready') status = 'ready';
  else if (bo.status === 'delivering') {
    // Во время доставки курьер может быть в пути (picked_up) или уже у двери (arrived).
    // Будем использовать локальное сохранение статуса 'arrived' для сохранения состояния на клиенте.
    const localArrived = localStorage.getItem(`order_arrived_${bo.id}`);
    status = localArrived === 'true' ? 'arrived' : 'picked_up';
  }
  else if (bo.status === 'delivered') status = 'delivered';
  else if (bo.status === 'cancelled') status = 'cancelled';

  return {
    id: String(bo.id),
    restaurantName: bo.restaurant_name || 'SUNSET RESTAURANT',
    pickupAddress: bo.restaurant_address || 'Тбилиси, ул. Ираклия Абашидзе 25',
    deliveryAddress: bo.address || 'Не указан',
    distanceKm: bo.distance_km || 2.4,
    deliveryFee: bo.delivery_fee || 5.0,
    totalAmount: bo.total || bo.totalAmount || 0,
    status,
    items: itemsParsed,
    createdAt: bo.created_at || new Date().toISOString(),
    assignedCourierName: bo.courier_id ? `Курьер #${bo.courier_id}` : undefined
  };
};

export const api = {
  // Авторизация по логину и паролю
  login: async (username: string, password?: string): Promise<{ token: string; user: any }> => {
    let finalPassword = password || '123';
    if (!password) {
      if (username === 'admin') {
        finalPassword = 'admin123';
      }
    }
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: finalPassword })
    });

    if (!response.ok) {
      throw new Error('Неверное имя пользователя или пароль');
    }

    const data = await response.json();
    localStorage.setItem('delivery_jwt_token', data.token);
    localStorage.setItem('admin_token', data.token);
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

  // Telegram Пароль-лес вход для Mini App
  telegramLogin: async (telegramId: number, username?: string, name?: string): Promise<{ token: string; user: any }> => {
    const response = await fetch(`${BASE_URL}/api/auth/telegram-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: telegramId,
        username: username || `courier_${telegramId}`,
        first_name: name
      })
    });

    if (!response.ok) {
      throw new Error('Ошибка Telegram-авторизации');
    }

    const data = await response.json();
    localStorage.setItem('delivery_jwt_token', data.token);
    return data;
  },

  // Получить статистику курьера
  getStats: async (): Promise<any> => {
    const response = await fetch(`${BASE_URL}/api/courier/stats`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Ошибка загрузки статистики');
    return response.json();
  },

  // Получить доступные (свободные) заказы для курьера
  getAvailableOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${BASE_URL}/api/courier/available-orders`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Ошибка загрузки свободных заказов');
    const data = await response.json();
    return data
      .map(mapBackendOrderToFrontend)
      .filter((o: Order) => o.status === 'ready' || o.status === 'picked_up' || o.status === 'arrived');
  },

  // Получить заказы текущего курьера
  getMyOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${BASE_URL}/api/courier/my-orders`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Ошибка загрузки моих заказов');
    const data = await response.json();
    return data.map(mapBackendOrderToFrontend);
  },

  // Получить ВСЕ заказы (активные) для админа/ресторана
  getRestaurantActiveOrders: async (): Promise<Order[]> => {
    const roleId = localStorage.getItem('partner_role_id');
    const query = roleId ? `?role=restaurant_admin&role_id=${roleId}` : '?role=restaurant_admin';
    const response = await fetch(`${BASE_URL}/api/orders${query}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Ошибка загрузки заказов ресторана');
    const data = await response.json();
    // Фильтруем только активные статусы, исключая те, что ожидают оплату
    return data
      .filter((o: any) => {
        const isOnlinePending = o.status === 'pending' && o.comment?.includes('[Оплата: Онлайн]');
        if (isOnlinePending) return false;
        return !['delivered', 'cancelled'].includes(o.status);
      })
      .map(mapBackendOrderToFrontend);
  },

  // Получить историю выполненных/отмененных заказов
  getRestaurantHistoricOrders: async (): Promise<Order[]> => {
    const roleId = localStorage.getItem('partner_role_id');
    const query = roleId ? `?role=restaurant_admin&role_id=${roleId}` : '?role=restaurant_admin';
    const response = await fetch(`${BASE_URL}/api/orders${query}`, {
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Ошибка загрузки истории заказов');
    const data = await response.json();
    return data
      .filter((o: any) => ['delivered', 'cancelled'].includes(o.status))
      .map(mapBackendOrderToFrontend);
  },

  // Курьер: Принять заказ
  takeOrder: async (orderId: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/api/courier/take-order/${orderId}`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Не удалось принять заказ');
  },

  // Курьер: Обновить статус онлайн/офлайн
  updateCourierStatus: async (isOnline: boolean): Promise<void> => {
    const response = await fetch(`${BASE_URL}/api/courier/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ is_online: isOnline })
    });
    if (!response.ok) throw new Error('Не удалось изменить статус линии');
  },

  // Обновить статус заказа (Ресторан)
  updateOrderStatusRestaurant: async (orderId: string, status: 'confirmed' | 'preparing' | 'ready'): Promise<void> => {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Не удалось обновить статус заказа');
  },

  // Отменить заказ (Ресторан)
  cancelOrder: async (orderId: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Не удалось отменить заказ');
  },

  // Курьер: Локальное обновление до 'arrived' и отправка гео или статуса
  advanceOrderCourier: async (orderId: string, currentStatus: OrderStatus): Promise<void> => {
    if (currentStatus === 'ready') {
      // Забираем заказ из ресторана
      const response = await fetch(`${BASE_URL}/api/courier/pick-up/${orderId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Не удалось забрать заказ');
    } else if (currentStatus === 'picked_up') {
      // Сохраняем локально, что курьер прибыл к клиенту
      localStorage.setItem(`order_arrived_${orderId}`, 'true');
    } else if (currentStatus === 'arrived') {
      // Завершаем заказ на бэкенде
      const response = await fetch(`${BASE_URL}/api/courier/complete-delivery/${orderId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Не удалось завершить заказ');
      localStorage.removeItem(`order_arrived_${orderId}`);
    }
  },

  // Создать новый заказ рестораном
  createOrderRestaurant: async (items: OrderItem[]): Promise<Order> => {
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        user_id: `partner_restaurant_${Date.now()}`,
        restaurant_id: 'kubdari',
        restaurant_name: 'ДОМ КУБДАРИ',
        items: items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0) + 5, // Сумма + доставка
        customer_name: 'Иван Курьерский',
        phone: '+79998887766',
        address: 'ул. Пушкина, д. 10, кв. 25',
        comment: 'Доставка через Mini App',
        payment_method: 'cash'
      })
    });

    if (!response.ok) throw new Error('Не удалось создать заказ');
    const data = await response.json();
    return mapBackendOrderToFrontend(data);
  },

  // Отправка координат курьера
  updateLocation: async (latitude: number, longitude: number, heading?: number, speed?: number): Promise<void> => {
    const token = localStorage.getItem('delivery_jwt_token');
    if (!token) return; // Не отправляем без токена
    
    await fetch(`${BASE_URL}/api/courier/location`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        latitude,
        longitude,
        heading: heading || 0,
        speed: speed || 0
      })
    });
  }
};
