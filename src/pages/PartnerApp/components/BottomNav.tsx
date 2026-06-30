import React from 'react';
import { useStore } from '../store/useStore';
import { Bike, ClipboardList, ChefHat, History, LogOut } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { userRole, activeTab, setActiveTab, logout, activeOrders, userName } = useStore();

  if (userRole === 'none') return null;

  // Проверим, есть ли активные заказы
  const activeCourierOrder = activeOrders.find(
    o => (o.status === 'picked_up' || o.status === 'arrived') && o.assignedCourierName === userName
  );

  const newRestaurantOrdersCount = activeOrders.filter(o => o.status === 'new').length;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-40 pointer-events-none select-none">
      <div 
        className="mx-auto max-w-md w-full glass-nav rounded-3xl p-2 flex items-center justify-between pointer-events-auto"
        style={{
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))'
        }}
      >
        {userRole === 'courier' ? (
          <>
            {/* Доступные заказы */}
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 ${
                activeTab === 'available'
                  ? 'bg-emerald-500/10 text-[#00C853] font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Bike size={20} />
                {activeOrders.filter(o => o.status === 'ready').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00C853] rounded-full pulsing-emerald" />
                )}
              </div>
              <span className="text-[10px]">Доступные</span>
            </button>

            {/* Активный заказ */}
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 ${
                activeTab === 'active'
                  ? 'bg-emerald-500/10 text-[#00C853] font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <ClipboardList size={20} />
                {activeCourierOrder && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
              <span className="text-[10px]">Активный заказ</span>
            </button>
          </>
        ) : (
          <>
            {/* Активные заказы ресторана */}
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 ${
                activeTab === 'active'
                  ? 'bg-emerald-500/10 text-[#00C853] font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <ChefHat size={20} />
                {newRestaurantOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-[#0F1210] font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    {newRestaurantOrdersCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Заказы</span>
            </button>

            {/* История заказов ресторана */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-emerald-500/10 text-[#00C853] font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <History size={20} />
              <span className="text-[10px]">История</span>
            </button>
          </>
        )}

        {/* Выход из профиля */}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-2xl text-rose-500/80 hover:text-rose-500 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-[10px]">Выйти</span>
        </button>
      </div>
    </div>
  );
};
