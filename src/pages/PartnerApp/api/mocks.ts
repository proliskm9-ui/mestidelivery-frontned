export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | 'new'          // Ресторан: Новый заказ, ожидает подтверждения
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

// Начальные моковые данные
export const INITIAL_ORDERS: Order[] = [
  {
    id: '1001',
    restaurantName: 'Burger Street',
    pickupAddress: 'ул. Ленина, д. 45',
    deliveryAddress: 'пр. Мира, д. 12, кв. 89',
    distanceKm: 2.4,
    deliveryFee: 250,
    totalAmount: 1450,
    status: 'new',
    items: [
      { name: 'Дабл Чизбургер Барбекю', quantity: 2, price: 450 },
      { name: 'Картофель Фри XL', quantity: 1, price: 200 },
      { name: 'Кока-Кола Зеро 0.5л', quantity: 2, price: 175 }
    ],
    createdAt: new Date(Date.now() - 15 * 60000).toISOString() // 15 минут назад
  },
  {
    id: '1002',
    restaurantName: 'Burger Street',
    pickupAddress: 'ул. Ленина, д. 45',
    deliveryAddress: 'ул. Пушкина, д. 7, кв. 14',
    distanceKm: 4.1,
    deliveryFee: 380,
    totalAmount: 1880,
    status: 'preparing',
    items: [
      { name: 'Острый Бургер с Халапеньо', quantity: 1, price: 490 },
      { name: 'Сырные Палочки Моцарелла', quantity: 2, price: 280 },
      { name: 'Фирменный Соус Ранч', quantity: 3, price: 50 },
      { name: 'Лимонад Лесные Ягоды', quantity: 2, price: 340 }
    ],
    createdAt: new Date(Date.now() - 5 * 60000).toISOString() // 5 минут назад
  },
  {
    id: '1003',
    restaurantName: 'Burger Street',
    pickupAddress: 'ул. Ленина, д. 45',
    deliveryAddress: 'ул. Чехова, д. 22, кв. 105',
    distanceKm: 1.8,
    deliveryFee: 180,
    totalAmount: 980,
    status: 'ready',
    items: [
      { name: 'Комбо Гриль Ролл', quantity: 1, price: 650 },
      { name: 'Апельсиновый сок 0.3л', quantity: 1, price: 150 },
      { name: 'Донат Шоколадный', quantity: 1, price: 180 }
    ],
    createdAt: new Date(Date.now() - 35 * 60000).toISOString() // 35 минут назад
  }
];

export const HISTORIC_ORDERS: Order[] = [
  {
    id: '998',
    restaurantName: 'Burger Street',
    pickupAddress: 'ул. Ленина, д. 45',
    deliveryAddress: 'пр. Победы, д. 88, кв. 421',
    distanceKm: 3.5,
    deliveryFee: 300,
    totalAmount: 2150,
    status: 'delivered',
    items: [
      { name: 'Блэк Ангус Бургер XL', quantity: 2, price: 750 },
      { name: 'Наггетсы Куриные 9 шт', quantity: 2, price: 250 },
      { name: 'Соус Барбекю', quantity: 3, price: 50 }
    ],
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 часа назад
    assignedCourierName: 'Алексей'
  },
  {
    id: '997',
    restaurantName: 'Burger Street',
    pickupAddress: 'ул. Ленина, д. 45',
    deliveryAddress: 'ул. Кирова, д. 15, кв. 3',
    distanceKm: 2.0,
    deliveryFee: 200,
    totalAmount: 1100,
    status: 'cancelled',
    items: [
      { name: 'Веган Ролл с Овощами', quantity: 2, price: 450 },
      { name: 'Зеленый чай матча 0.4л', quantity: 1, price: 200 }
    ],
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString() // 4 часа назад
  }
];

// Вспомогательная функция для имитации сетевой задержки
const delay = (ms: number = 600) => new Promise((resolve) => setTimeout(resolve, ms));

// Имитация асинхронных запросов к API
export const mockApi = {
  // Получить все активные заказы
  getActiveOrders: async (): Promise<Order[]> => {
    await delay(600);
    return JSON.parse(localStorage.getItem('delivery_active_orders') || JSON.stringify(INITIAL_ORDERS));
  },

  // Получить историю заказов ресторана
  getHistoricOrders: async (): Promise<Order[]> => {
    await delay(700);
    return JSON.parse(localStorage.getItem('delivery_historic_orders') || JSON.stringify(HISTORIC_ORDERS));
  },

  // Обновить статус заказа
  updateOrderStatus: async (orderId: string, status: OrderStatus, assignedCourierName?: string): Promise<Order> => {
    await delay(800);
    
    // Получаем текущие списки
    const active: Order[] = JSON.parse(localStorage.getItem('delivery_active_orders') || JSON.stringify(INITIAL_ORDERS));
    const historic: Order[] = JSON.parse(localStorage.getItem('delivery_historic_orders') || JSON.stringify(HISTORIC_ORDERS));
    
    let updatedOrder: Order | null = null;
    
    // Ищем в активных
    const activeIndex = active.findIndex(o => o.id === orderId);
    if (activeIndex !== -1) {
      active[activeIndex].status = status;
      if (assignedCourierName) {
        active[activeIndex].assignedCourierName = assignedCourierName;
      }
      updatedOrder = active[activeIndex];
      
      // Если заказ перешел в статус Доставлен или Отменен, переносим его в историю
      if (status === 'delivered' || status === 'cancelled') {
        active.splice(activeIndex, 1);
        historic.unshift(updatedOrder);
      }
    } else {
      // Ищем в исторических
      const historicIndex = historic.findIndex(o => o.id === orderId);
      if (historicIndex !== -1) {
        historic[historicIndex].status = status;
        updatedOrder = historic[historicIndex];
      }
    }
    
    if (!updatedOrder) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    localStorage.setItem('delivery_active_orders', JSON.stringify(active));
    localStorage.setItem('delivery_historic_orders', JSON.stringify(historic));
    
    return updatedOrder;
  },

  // Создать новый заказ рестораном
  createOrder: async (items: OrderItem[]): Promise<Order> => {
    await delay(800);
    const active: Order[] = JSON.parse(localStorage.getItem('delivery_active_orders') || JSON.stringify(INITIAL_ORDERS));
    
    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const distanceKm = parseFloat((Math.random() * 4 + 1).toFixed(1));
    const deliveryFee = Math.round(distanceKm * 80 + 100);
    const totalAmount = itemsTotal + deliveryFee;
    
    const newOrder: Order = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      restaurantName: 'Burger Street',
      pickupAddress: 'ул. Ленина, д. 45',
      deliveryAddress: `ул. Строителей, д. ${Math.floor(Math.random() * 50 + 1)}, кв. ${Math.floor(Math.random() * 150 + 1)}`,
      distanceKm,
      deliveryFee,
      totalAmount,
      status: 'new',
      items,
      createdAt: new Date().toISOString()
    };
    
    active.unshift(newOrder);
    localStorage.setItem('delivery_active_orders', JSON.stringify(active));
    
    return newOrder;
  }
};
