import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Toggle } from './UI/Toggle';
import { Button } from './UI/Button';
import { Bike, Star, Phone, CheckCircle, Package } from 'lucide-react';
import { pickKitchenText } from '../../../utils/i18nContent';

export const CourierDashboard: React.FC = () => {
  const {
    userName,
    isOnline,
    toggleOnline,
    courierEarnings,
    courierDeliveriesCount,
    activeTab,
    activeOrders,
    acceptOrder,
    advanceCourierOrder,
    fetchOrders,
    isLoading
  } = useStore();

  // Реактивная подгрузка данных каждые 5 секунд для эффекта "WebSocket/Live API"
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Фильтруем доступные заказы (статусы 'confirmed', 'preparing', 'ready' и не назначен курьер)
  const availableOrders = activeOrders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status) && !o.assignedCourierName);

  // Ищем активный заказ текущего курьера
  const activeCourierOrder = activeOrders.find(
    o => o.assignedCourierName === userName && !['delivered', 'cancelled'].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-[#0F1210] text-white flex flex-col pb-28">
      {/* Шапка дашборда */}
      <div className="glass-card sticky top-0 z-30 p-5 rounded-b-3xl border-t-0 border-x-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <Bike size={24} className="text-[#00C853]" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{userName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="bg-emerald-500/10 text-[#00C853] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Star size={10} className="fill-[#00C853]" /> 4.95
                </span>
                <span className="text-xs text-zinc-500 font-medium">Курьер</span>
              </div>
            </div>
          </div>
          
          <Toggle
            checked={isOnline}
            onChange={toggleOnline}
            activeLabel="В сети"
            inactiveLabel="Офлайн"
          />
        </div>

        {/* Блок статистики */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-zinc-800/60">
          <div>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Баланс за сегодня</p>
            <p className="text-xl font-black text-[#00C853] mt-0.5">{courierEarnings.toLocaleString()} ₾</p>
          </div>
          <div className="border-l border-zinc-800/60 pl-4">
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Доставки</p>
            <p className="text-xl font-black text-white mt-0.5">{courierDeliveriesCount} зак.</p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 px-4 py-5 overflow-y-auto">
        {!isOnline ? (
          /* Экран Офлайн */
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-600 mb-5 relative">
              <Bike size={36} />
              <div className="absolute inset-0 border border-zinc-800 rounded-full animate-ping opacity-25" />
            </div>
            <h4 className="text-lg font-bold text-zinc-300">Вы не на линии</h4>
            <p className="text-zinc-500 text-sm mt-2 max-w-xs leading-relaxed">
              Переключите статус на «В сети» вверху экрана, чтобы начать принимать новые заказы на доставку.
            </p>
            <Button onClick={toggleOnline} className="mt-6 bg-[#00C853]/15 text-[#00C853] border border-[#00C853]/20 py-3 font-semibold">
              Включить статус сети
            </Button>
          </div>
        ) : activeTab === 'available' ? (
          /* Вкладка: ДОСТУПНЫЕ ЗАКАЗЫ */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Доступно заказов ({availableOrders.length})</h2>
              {isLoading && (
                <span className="text-xs text-emerald-500 flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Синхронизация...
                </span>
              )}
            </div>

            {availableOrders.length === 0 ? (
              /* Поиск заказов с Sonar анимацией */
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/30 border border-zinc-800/40 rounded-3xl p-6">
                <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                  {/* Концентрические кольца */}
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping duration-1000" />
                  <div className="absolute inset-2 bg-emerald-500/10 rounded-full animate-ping duration-2000" />
                  <div className="relative w-14 h-14 bg-emerald-500/10 border border-[#00C853]/20 rounded-full flex items-center justify-center text-[#00C853]">
                    <Bike size={24} className="animate-bounce" />
                  </div>
                </div>
                <h4 className="text-base font-bold text-zinc-300">Ищем заказы поблизости...</h4>
                <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
                  Как только ресторан приготовит заказ, он появится здесь. Держите приложение открытым.
                </p>
              </div>
            ) : (
              /* Список карточек доступных заказов */
              availableOrders.map(order => (
                <div key={order.id} className="glass-card rounded-3xl p-5 border border-zinc-800 flex flex-col justify-between transition-all duration-300 active:scale-[0.99]">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        order.status === 'ready' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {order.status === 'ready' ? 'Готов к выдаче' : 'Готовится в ресторане'}
                      </span>
                      <h4 className="text-base font-black mt-1.5 text-white">Заказ #{order.id}</h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{order.restaurantName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 font-medium">{order.distanceKm} км от вас</p>
                      <p className="text-lg font-black text-[#00C853] mt-0.5">+{order.deliveryFee} ₾</p>
                    </div>
                  </div>

                  {/* Маршрут */}
                  <div className="space-y-3 bg-[#0F1210]/50 rounded-2xl p-4 border border-zinc-800/30 mb-5 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs shrink-0 mt-0.5">А</div>
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Забрать из</p>
                        <p className="font-semibold text-zinc-200 mt-0.5">{order.pickupAddress}</p>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-dashed border-zinc-800 h-3 ml-2.5 my-1" />

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#00C853]/10 flex items-center justify-center text-[#00C853] text-xs shrink-0 mt-0.5">Б</div>
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Доставить на</p>
                        <p className="font-semibold text-zinc-200 mt-0.5">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Кнопка принять */}
                  <Button
                    onClick={() => acceptOrder(order.id)}
                    className="w-full font-bold py-3.5"
                  >
                    Принять и начать доставку
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Вкладка: АКТИВНЫЙ ЗАКАЗ */
          <div className="space-y-5">
            {!activeCourierOrder ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/30 border border-zinc-800/40 rounded-3xl p-6">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 mb-4">
                  <CheckCircle size={28} />
                </div>
                <h4 className="text-base font-bold text-zinc-300">Активных доставок нет</h4>
                <p className="text-xs text-zinc-500 mt-2 max-w-xs leading-relaxed">
                  Перейдите во вкладку «Доступные» и примите заказ, чтобы начать зарабатывать.
                </p>
              </div>
            ) : (
              /* Карточка активного заказа */
              <div className="space-y-5">
                <div className="glass-card rounded-3xl p-5 border border-zinc-800">
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-800/60 pb-4">
                    <div>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {['confirmed', 'preparing', 'ready'].includes(activeCourierOrder.status) 
                          ? 'Едем в ресторан' 
                          : activeCourierOrder.status === 'picked_up' ? 'Везем клиенту' : 'На адресе'}
                      </span>
                      <h4 className="text-lg font-black mt-1 text-white">Доставка #{activeCourierOrder.id}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Оплата за заказ</p>
                      <p className="text-xl font-black text-[#00C853] mt-0.5">+{activeCourierOrder.deliveryFee} ₾</p>
                    </div>
                  </div>

                  {/* Детали ресторана */}
                  <div className="bg-[#0F1210]/50 border border-zinc-800/30 rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Ресторан</p>
                        <p className="font-bold text-zinc-200 mt-0.5">{activeCourierOrder.restaurantName}</p>
                        <p className="text-zinc-400 text-xs mt-1">{activeCourierOrder.pickupAddress}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href="tel:+79998887766" className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
                          <Phone size={16} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Детали клиента */}
                  <div className="bg-[#0F1210]/50 border border-zinc-800/30 rounded-2xl p-4 mb-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Клиент</p>
                        <p className="font-bold text-zinc-200 mt-0.5">Дмитрий</p>
                        <p className="text-zinc-400 text-xs mt-1">{activeCourierOrder.deliveryAddress}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href="tel:+79991112233" className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
                          <Phone size={16} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Содержимое заказа */}
                  <div className="border-t border-zinc-800/60 pt-4 mt-4">
                    <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Package size={14} /> Состав отправления
                    </h5>
                    <div className="space-y-2.5">
                      {activeCourierOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-zinc-300">
                          <span>
                            <span className="text-[#00C853] font-bold mr-1">{item.quantity}x</span> {pickKitchenText(item.name)}
                          </span>
                          <span className="font-medium">{item.price * item.quantity} ₾</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Линейка таймлайна (Шаги) */}
                <div className="glass-card rounded-3xl p-5 border border-zinc-800 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Статус доставки</h4>
                  <div className="relative pl-6 space-y-5 border-l border-zinc-800 ml-2">
                    {/* Точка 1 */}
                    <div className="relative">
                      <span className={`absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full border-4 border-[#0F1210] ${
                        ['ready', 'picked_up', 'arrived'].includes(activeCourierOrder.status) ? 'bg-[#00C853]' : 'bg-orange-500'
                      }`} />
                      <p className={`text-xs font-bold ${['ready', 'picked_up', 'arrived'].includes(activeCourierOrder.status) ? 'text-zinc-200' : 'text-orange-400'}`}>
                        {['confirmed', 'preparing'].includes(activeCourierOrder.status) ? 'В ресторане (Готовится)' : 'Заказ готов в ресторане'}
                      </p>
                      <p className="text-[10px] text-zinc-500">Заберите коробку с кодом #{activeCourierOrder.id}</p>
                    </div>

                    {/* Точка 2 */}
                    <div className="relative">
                      <span className={`absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full border-4 border-[#0F1210] ${
                        activeCourierOrder.status === 'picked_up' || activeCourierOrder.status === 'arrived' 
                          ? 'bg-[#00C853]' 
                          : 'bg-zinc-800'
                      }`} />
                      <p className={`text-xs font-bold ${activeCourierOrder.status === 'picked_up' ? 'text-zinc-200' : 'text-zinc-500'}`}>
                        В пути к клиенту
                      </p>
                      <p className="text-[10px] text-zinc-500">Ориентировочное время: 15 минут</p>
                    </div>

                    {/* Точка 3 */}
                    <div className="relative">
                      <span className={`absolute -left-[30px] top-0.5 w-4.5 h-4.5 rounded-full border-4 border-[#0F1210] ${
                        activeCourierOrder.status === 'arrived' ? 'bg-[#00C853]' : 'bg-zinc-800'
                      }`} />
                      <p className={`text-xs font-bold ${activeCourierOrder.status === 'arrived' ? 'text-zinc-200' : 'text-zinc-500'}`}>
                        Прибытие на место
                      </p>
                      <p className="text-[10px] text-zinc-500">Передайте заказ и завершите доставку</p>
                    </div>
                  </div>
                </div>

                {/* CTA кнопка изменения статуса (прикреплена внизу над BottomNav) */}
                <div className="fixed bottom-20 left-0 right-0 p-4 z-30 max-w-md mx-auto">
                  <Button
                    onClick={() => advanceCourierOrder(activeCourierOrder.id)}
                    disabled={['confirmed', 'preparing'].includes(activeCourierOrder.status)}
                    className={`w-full font-black py-4 shadow-xl ${['confirmed', 'preparing'].includes(activeCourierOrder.status) ? 'bg-zinc-800 text-zinc-500' : 'pulsing-emerald'}`}
                  >
                    {['confirmed', 'preparing'].includes(activeCourierOrder.status) ? (
                      <>
                        <CheckCircle size={18} /> Ресторан готовит заказ...
                      </>
                    ) : activeCourierOrder.status === 'ready' ? (
                      <>
                        <CheckCircle size={18} /> Я забрал заказ из ресторана
                      </>
                    ) : activeCourierOrder.status === 'picked_up' ? (
                      <>
                        <CheckCircle size={18} /> Я прибыл к клиенту
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} /> Заказ доставлен (Получить {activeCourierOrder.deliveryFee} ₾)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
