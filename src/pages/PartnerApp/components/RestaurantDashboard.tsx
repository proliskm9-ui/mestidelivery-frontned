import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Toggle } from './UI/Toggle';
import { Button } from './UI/Button';
import { Store, Clock, ChefHat, Check, User, AlertCircle, Plus } from 'lucide-react';
import type { OrderItem } from '../api';
import { pickKitchenText } from '../../../utils/i18nContent';

export const RestaurantDashboard: React.FC = () => {
  const {
    userName,
    isRestaurantOpen,
    toggleRestaurantOpen,
    restaurantRevenue,
    activeTab,
    activeOrders,
    historicOrders,
    advanceRestaurantOrder,
    cancelRestaurantOrder,
    createOrderFromMenu,
    fetchOrders
  } = useStore();

  // Реактивная подгрузка данных каждые 5 секунд для эффекта "WebSocket/Live API"
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Фильтруем активные заказы ресторана (статусы 'new', 'preparing', 'ready', 'picked_up', 'arrived')
  const currentActiveOrders = activeOrders.filter(
    o => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  // Выручка
  const revenueTotal = restaurantRevenue;
  
  // Тестовые блюда для генерации заказа
  const handleCreateTestOrder = async () => {
    const dishes = [
      { name: 'Дабл Чизбургер Барбекю', price: 450 },
      { name: 'Картошель Фри XL', price: 200 },
      { name: 'Кока-Кола Зеро 0.5л', price: 175 },
      { name: 'Острый Бургер с Халапеньо', price: 490 },
      { name: 'Сырные Палочки Моцарелла', price: 280 }
    ];
    
    // Выбираем 2 случайных блюда
    const selectedDishes: OrderItem[] = [];
    const count = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < count; i++) {
      const dish = dishes[Math.floor(Math.random() * dishes.length)];
      selectedDishes.push({
        name: dish.name,
        quantity: Math.floor(Math.random() * 2) + 1,
        price: dish.price
      });
    }
    
    await createOrderFromMenu(selectedDishes);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="text-[10px] bg-amber-500/10 text-amber-500 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">Новый</span>;
      case 'preparing':
        return <span className="text-[10px] bg-blue-500/10 text-blue-400 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">Готовится</span>;
      case 'ready':
        return <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">Готов / Ждет курьера</span>;
      case 'picked_up':
      case 'arrived':
        return <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">В доставке</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1210] text-white flex flex-col pb-28">
      {/* Шапка дашборда */}
      <div className="glass-card sticky top-0 z-30 p-5 rounded-b-3xl border-t-0 border-x-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <Store size={24} className="text-[#00C853]" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Burger Street</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-zinc-500 font-medium">Ресторатор: {userName}</span>
              </div>
            </div>
          </div>

          <Toggle
            checked={isRestaurantOpen}
            onChange={toggleRestaurantOpen}
            activeLabel="Открыт"
            inactiveLabel="Закрыт"
          />
        </div>

        {/* Блок статистики */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-zinc-800/60">
          <div>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Выручка сегодня</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <p className="text-xl font-black text-[#00C853]">{revenueTotal.toLocaleString()} ₾</p>
              <span className="text-[10px] text-zinc-600 font-bold">без доставки</span>
            </div>
          </div>
          <div className="border-l border-zinc-800/60 pl-4">
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Новые заказы</p>
            <p className="text-xl font-black text-white mt-0.5">{activeOrders.filter(o => o.status === 'new').length} зак.</p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 px-4 py-5 overflow-y-auto">
        {!isRestaurantOpen ? (
          /* Экран Закрыт */
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-600 mb-5">
              <Store size={36} />
            </div>
            <h4 className="text-lg font-bold text-zinc-300">Ресторан закрыт</h4>
            <p className="text-zinc-500 text-sm mt-2 max-w-xs leading-relaxed">
              Переключите тумблер «Открыт» вверху экрана, чтобы начать прием заказов и передачу их курьерам.
            </p>
            <Button onClick={toggleRestaurantOpen} className="mt-6 bg-[#00C853]/15 text-[#00C853] border border-[#00C853]/20 py-3 font-semibold">
              Открыть ресторан
            </Button>
          </div>
        ) : activeTab === 'active' ? (
          /* Вкладка: АКТИВНЫЕ ЗАКАЗЫ */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Кухня и Выдача ({currentActiveOrders.length})</h2>
              
              <button
                onClick={handleCreateTestOrder}
                className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-[#00C853] font-bold px-3 py-1.5 rounded-full hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus size={12} /> Тестовый заказ
              </button>
            </div>

            {currentActiveOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/30 border border-zinc-800/40 rounded-3xl p-6">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 mb-4">
                  <ChefHat size={28} />
                </div>
                <h4 className="text-base font-bold text-zinc-300">Все заказы выполнены!</h4>
                <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
                  Нажмите на кнопку «Тестовый заказ» вверху, чтобы сгенерировать новые блюда для готовки.
                </p>
              </div>
            ) : (
              currentActiveOrders.map(order => (
                <div key={order.id} className="glass-card rounded-3xl p-5 border border-zinc-800 flex flex-col justify-between">
                  {/* Шапка карточки заказа */}
                  <div className="flex items-start justify-between border-b border-zinc-800/60 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-white">Заказ #{order.id}</h4>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                        <Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 font-medium">{order.deliveryAddress.split(',')[0]}</p>
                      <p className="text-sm font-bold text-[#00C853] mt-0.5">{order.totalAmount - order.deliveryFee} ₾</p>
                    </div>
                  </div>

                  {/* Содержимое блюд */}
                  <div className="space-y-3 my-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span className="bg-emerald-500/10 text-[#00C853] text-xs font-black px-2.5 py-1 rounded-lg mr-3 min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <span className="font-semibold text-zinc-200">{pickKitchenText(item.name)}</span>
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">{item.price * item.quantity} ₾</span>
                      </div>
                    ))}
                  </div>

                  {/* Назначенный курьер */}
                  {order.assignedCourierName ? (
                    <div className="bg-emerald-500/5 border border-[#00C853]/10 rounded-2xl p-3.5 mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#00C853]/10 flex items-center justify-center text-[#00C853]">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Доставляет курьер</p>
                          <p className="text-xs font-bold text-zinc-200 mt-0.5">{order.assignedCourierName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-[#00C853]/15 text-[#00C853] font-bold px-2 py-0.5 rounded-full">
                        В пути
                      </span>
                    </div>
                  ) : order.status === 'ready' ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 mt-3 flex items-center gap-2.5 text-zinc-500">
                      <AlertCircle size={16} className="text-amber-500" />
                      <span className="text-xs font-semibold">Ищем курьера на линии...</span>
                    </div>
                  ) : null}

                  {/* Кнопка смены статуса (для новых и готовых) */}
                  <div className="flex gap-2.5 mt-4 pt-3 border-t border-zinc-800/60">
                    {order.status === 'new' && (
                      <>
                        <button
                          onClick={() => cancelRestaurantOrder(order.id)}
                          className="flex-1 text-xs bg-rose-500/10 text-rose-500 font-bold py-3.5 rounded-full border border-rose-500/10 active:scale-95 transition-all"
                        >
                          Отменить
                        </button>
                        <Button
                          onClick={() => advanceRestaurantOrder(order.id)}
                          className="flex-2 py-3.5"
                        >
                          Начать готовить
                        </Button>
                      </>
                    )}

                    {order.status === 'preparing' && (
                      <Button
                        onClick={() => advanceRestaurantOrder(order.id)}
                        fullWidth
                        className="py-3.5 bg-indigo-500 text-white font-bold hover:bg-indigo-600 shadow-indigo-950/20"
                      >
                        Приготовлено, выдать курьеру
                      </Button>
                    )}

                    {order.status === 'ready' && (
                      <div className="w-full text-center text-xs text-zinc-400 font-semibold py-3 border border-dashed border-zinc-800 rounded-full select-none bg-zinc-900/10">
                        Ожидает курьера для забора с кухни
                      </div>
                    )}

                    {(order.status === 'picked_up' || order.status === 'arrived') && (
                      <div className="w-full text-center text-xs text-emerald-500 font-semibold py-3 border border-emerald-500/10 bg-emerald-500/5 rounded-full select-none flex items-center justify-center gap-1.5">
                        <Check size={14} /> Курьер везет заказ к клиенту
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Вкладка: ИСТОРИЯ ЗАКАЗОВ РЕСТОРАНА */
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider px-1">Завершенные смены ({historicOrders.length})</h2>

            {historicOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/30 border border-zinc-800/40 rounded-3xl p-6">
                <h4 className="text-base font-bold text-zinc-400">История пуста</h4>
                <p className="text-xs text-zinc-600 mt-1">Сегодня еще не было завершенных заказов.</p>
              </div>
            ) : (
              historicOrders.map(order => (
                <div key={order.id} className="glass-card rounded-2xl p-4.5 border border-zinc-800/80 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-white">Заказ #{order.id}</h4>
                      {order.status === 'delivered' ? (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-md uppercase">Выполнен</span>
                      ) : (
                        <span className="text-[9px] bg-rose-500/10 text-rose-500 font-extrabold px-1.5 py-0.5 rounded-md uppercase">Отменен</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {order.items.map(i => `${i.quantity}x ${i.name.split(' ')[0]}`).join(', ')}
                    </p>
                    {order.assignedCourierName && (
                      <p className="text-[9px] text-zinc-600 mt-0.5">Курьер: {order.assignedCourierName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-zinc-300">+{order.totalAmount - order.deliveryFee} ₾</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
