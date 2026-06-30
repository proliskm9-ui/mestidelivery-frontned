import React, { useState, useEffect, ChangeEvent } from 'react';
import { useStore } from './store/useStore';
import { LoginScreen } from './components/LoginScreen';
import { CourierOrders } from './components/CourierOrders';
import { CourierStats } from './components/CourierStats';
import { CourierSchedule } from './components/CourierSchedule';
import { CourierProfile } from './components/CourierProfile';
import { CourierSupport } from './components/CourierSupport';
import { RestaurantOrders } from './components/RestaurantOrders';
import { RestaurantMenu } from './components/RestaurantMenu';

import { 
  RestaurantHome, 
  RestaurantStats, 
  RestaurantReviews, 
  RestaurantSettings, 
  RestaurantHelp,
  RestaurantNews,
  RestaurantSupport
} from './components/DashboardViews';

import {
  Home,
  BarChart2,
  MessageSquare,
  ShoppingBag,
  History,
  Store,
  Utensils,
  LogOut,
  Menu,
  ChevronRight,
  Calendar,
  User,
  LifeBuoy
} from 'lucide-react';
import './index.css';
import '../Admin/AdminStyles.css';


type CourierPage = 'orders' | 'stats' | 'finance' | 'schedule' | 'profile' | 'support';
type RestaurantPage = 
  | 'home' 
  | 'orders' 
  | 'stats' 
  | 'reviews' 
  | 'restaurant' 
  | 'menu' 
  | 'help' 
  | 'history' 
  | 'news' 
  | 'support';
type PartnerPage = CourierPage | RestaurantPage;

interface SidebarItem {
  id: PartnerPage;
  label: string;
  Icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
}

const PRESET_AVATARS = [
  { id: 'av1', img: '/Assets/photo_2026-02-11_23-14-10.jpg', label: 'Art 1' },
  { id: 'av2', img: '/Assets/photo_2026-02-11_23-14-27.jpg', label: 'Art 2' },
  { id: 'av3', img: '/Assets/photo_2026-02-11_23-14-50.jpg', label: 'Art 3' },
  { id: 'av4', img: '/Assets/photo_2026-02-11_23-19-47.jpg', label: 'Art 4' }
];

function PartnerSidebar({
  role,
  activePage,
  onNavigate,
  isOpen,
  onClose,
}: {
  role: 'courier' | 'restaurant';
  activePage: PartnerPage;
  onNavigate: (p: PartnerPage) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { userName, logout } = useStore();

  const [avatar, setAvatar] = useState<string>(
    () => localStorage.getItem('partner_avatar') || localStorage.getItem('admin_avatar') || PRESET_AVATARS[0].img
  );
  const [avatarModal, setAvatarModal] = useState(false);

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
          localStorage.setItem('partner_avatar', reader.result);
          setAvatarModal(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const groups: SidebarGroup[] = role === 'courier' 
    ? [
        {
          items: [
            { id: 'orders' as PartnerPage, label: 'Заказы', Icon: ShoppingBag },
            { id: 'stats' as PartnerPage, label: 'Статистика', Icon: BarChart2 },
            { id: 'schedule' as PartnerPage, label: 'График смен', Icon: Calendar },
            { id: 'profile' as PartnerPage, label: 'Мой профиль', Icon: User },
            { id: 'support' as PartnerPage, label: 'Поддержка', Icon: LifeBuoy }
          ]
        }
      ]
    : [
        {
          items: [
            { id: 'home' as PartnerPage, label: 'Главная', Icon: Home },
            { id: 'stats' as PartnerPage, label: 'Статистика', Icon: BarChart2 },
            { id: 'reviews' as PartnerPage, label: 'Отзывы', Icon: MessageSquare }
          ]
        },
        {
          title: 'РАБОТА С ЗАКАЗАМИ',
          items: [
            { id: 'orders' as PartnerPage, label: 'Заказы', Icon: ShoppingBag },
            { id: 'history' as PartnerPage, label: 'История', Icon: History }
          ]
        },
        {
          title: 'УПРАВЛЕНИЕ',
          items: [
            { id: 'restaurant' as PartnerPage, label: 'Ресторан', Icon: Store },
            { id: 'menu' as PartnerPage, label: 'Меню', Icon: Utensils }
          ]
        }
      ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <img 
          src="/Assets/general-green.png" 
          alt="Logo" 
        />
        <span>
          MestiDelivery<br />
          <span style={{ color: 'var(--admin-primary)' }}>{role === 'courier' ? 'Courier' : 'Partners'}</span>
        </span>
      </div>


      {/* Navigation list */}
      <div className="sidebar-nav">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="sidebar-section">
            {group.title && (
              <div className="sidebar-section-header">
                {group.title}
              </div>
            )}
            <div className="sidebar-section-items">
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                >
                  <item.Icon size={20} className="nav-icon" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="admin-profile-section">
          <div className="admin-avatar-wrapper" onClick={() => setAvatarModal(true)}>
            <img src={avatar} alt="Partner Avatar" className="admin-avatar" />
            <div className="admin-avatar-edit-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
          </div>
          <div className="admin-profile-info">
            <span className="admin-username">{userName}</span>
            <span className="admin-role">{role === 'courier' ? 'COURIER' : 'PARTNER'}</span>
          </div>
        </div>
        
        <button
          className="nav-item logout-btn"
          onClick={logout}
          style={{ color: '#ff4444' }}
        >
          <LogOut size={20} className="nav-icon" />
          <span>Выйти</span>
        </button>
      </div>

      {avatarModal && (
        <div className="admin-avatar-modal-overlay" onClick={() => setAvatarModal(false)}>
          <div className="admin-avatar-modal" onClick={e => e.stopPropagation()}>
            <h3>Выбрать аватар</h3>
            <div className="admin-preset-avatars-grid">
              {PRESET_AVATARS.map(av => (
                <div
                  key={av.id}
                  className={`admin-preset-avatar-btn ${avatar === av.img ? 'active' : ''}`}
                  onClick={() => {
                    setAvatar(av.img);
                    localStorage.setItem('partner_avatar', av.img);
                    setAvatarModal(false);
                  }}
                >
                  <img src={av.img} alt={av.label} />
                </div>
              ))}
            </div>
            <label className="admin-upload-btn">
              Загрузить фото
              <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
            </label>
            <button className="admin-cancel-btn" onClick={() => setAvatarModal(false)}>Отмена</button>
          </div>
        </div>
      )}
    </aside>
  );
}

// Mobile More Menu overlay — bottom sheet with slide-up feel
function MobileMoreMenu({
  role,
  activePage,
  onNavigate,
  onClose,
}: {
  role: 'courier' | 'restaurant';
  activePage: PartnerPage;
  onNavigate: (p: PartnerPage) => void;
  onClose: () => void;
}) {
  const courierItems = [
    { id: 'schedule' as PartnerPage, label: 'График смен', icon: Calendar, desc: 'Бронирование зон и выходы', color: '#3b82f6' },
    { id: 'profile' as PartnerPage, label: 'Мой профиль', icon: User, desc: 'Личные данные, транспорт', color: '#f59e0b' },
    { id: 'support' as PartnerPage, label: 'Поддержка', icon: LifeBuoy, desc: 'Связаться с диспетчером', color: '#ef4444' },
  ];

  const restaurantItems = [
    { id: 'history' as PartnerPage, label: 'История заказов', icon: History, desc: 'Завершённые смены и продажи', color: '#3b82f6' },
    { id: 'stats' as PartnerPage, label: 'Статистика', icon: BarChart2, desc: 'Финансовая аналитика', color: '#a855f7' },
    { id: 'restaurant' as PartnerPage, label: 'Ресторан', icon: Store, desc: 'Настройки заведения', color: '#f59e0b' },
    { id: 'reviews' as PartnerPage, label: 'Отзывы ресторана', icon: MessageSquare, desc: 'Управление отзывами клиентов', color: '#21EA7C' },
  ];

  const items = role === 'courier' ? courierItems : restaurantItems;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }} />
      {/* Sheet */}
      <div
        style={{
          position: 'relative',
          borderRadius: '28px 28px 0 0',
          background: '#111614',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.8)',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        <div style={{ padding: '8px 20px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 12px' }}>Прочее</p>
        </div>

        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(({ id, label, icon: Icon, desc, color }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => { onNavigate(id); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: 18,
                  background: active ? `${color}10` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? `${color}30` : 'rgba(255,255,255,0.05)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? `${color}18` : 'rgba(255,255,255,0.06)',
                }}>
                  <Icon size={19} style={{ color: active ? color : 'rgba(255,255,255,0.5)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: active ? color : '#fff' }}>{label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</p>
                </div>
                <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

        {/* Safe area */}
        <div style={{ height: 'calc(20px + env(safe-area-inset-bottom, 0px))' }} />
      </div>

      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

// Premium 5-tab mobile bottom navigation
function MobileBottomNav({
  role,
  activePage,
  onNavigate,
  hasOrderBadge,
}: {
  role: 'courier' | 'restaurant';
  activePage: PartnerPage;
  onNavigate: (p: PartnerPage) => void;
  hasOrderBadge?: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  type NavItem = { id: PartnerPage; label: string; Icon: React.ElementType | any; badge?: boolean; targetSize?: number };

  const courierItems: NavItem[] = [
    { id: 'orders', label: 'Заказы', Icon: ShoppingBag, targetSize: 24 },
    { id: 'stats', label: 'Статистика', Icon: BarChart2, targetSize: 24 },
  ];

  const morePages = role === 'courier'
    ? ['schedule', 'profile', 'support']
    : ['history', 'stats', 'restaurant', 'reviews'];
  const isMoreActive = morePages.includes(activePage);

  const restaurantItems: NavItem[] = [
    { id: 'home', label: 'Главная', Icon: Home, targetSize: 26 }, // Visually matched to ShoppingBag
    { id: 'orders', label: 'Заказы', Icon: ShoppingBag, targetSize: 24, badge: hasOrderBadge }, // Base reference
    { id: 'menu', label: 'Меню', Icon: Utensils, targetSize: 22 }, // Slightly smaller because it's tall
  ];

  const items = role === 'courier' ? courierItems : restaurantItems;

  const TabBtn = ({ id, Icon, badge, targetSize = 24 }: { id: PartnerPage; label: string; Icon: React.ElementType; badge?: boolean; targetSize?: number }) => {
    const active = activePage === id && !isMoreActive;
    // Calculate precise strokeWidth so all lines are exactly visually 2px thick regardless of SVG scale
    const computedStroke = 2 * (24 / targetSize);
    
    return (
      <button
        onClick={() => { setMoreOpen(false); onNavigate(id); }}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer',
          position: 'relative', height: '100%', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {badge && (
          <span style={{
            position: 'absolute', top: '16px', right: 'calc(50% - 14px)',
            width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
            boxShadow: '0 0 0 2px rgba(60,60,60,0.8)', zIndex: 2,
          }} />
        )}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          width: 32, height: 32, transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <Icon
            size={targetSize}
            strokeWidth={computedStroke}
            style={{
              color: active ? '#21EA7C' : '#9ca3af',
              transition: 'all 0.2s ease',
              filter: active ? 'drop-shadow(0 0 8px rgba(33,234,124,0.3))' : 'none',
            }}
          />
        </div>
      </button>
    );
  };

  return (
    <>
      {moreOpen && (
        <MobileMoreMenu
          role={role}
          activePage={activePage}
          onNavigate={onNavigate}
          onClose={() => setMoreOpen(false)}
        />
      )}

      <div 
        className="mobile-only-nav"
        style={{
          position: 'fixed',
          bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '360px',
          height: '72px',
          zIndex: 9000,
          background: 'rgba(60, 60, 60, 0.3)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          borderRadius: '40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'inset 0 4px 6px -2px rgba(255, 255, 255, 0.2), inset 0 -4px 8px -2px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.5), 0 4px 10px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 16px',
        }}
      >
        {items.map(item => (
          <TabBtn key={item.id} id={item.id} label={item.label} Icon={item.Icon} badge={'badge' in item ? item.badge : undefined} targetSize={item.targetSize} />
        ))}

        {/* More button */}
        {(() => {
          const moreActive = isMoreActive || moreOpen;
          return (
            <button
              onClick={() => setMoreOpen(prev => !prev)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                position: 'relative', height: '100%', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                width: 32, height: 32, transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <Menu
                  size={26}
                  strokeWidth={2}
                  style={{
                    color: moreActive ? '#21EA7C' : '#9ca3af',
                    transition: 'all 0.2s ease',
                    filter: moreActive ? 'drop-shadow(0 0 8px rgba(33,234,124,0.3))' : 'none'
                  }}
                />
              </div>
            </button>
          );
        })()}
      </div>
    </>
  );
}

function PartnerApp() {
  const { 
    currentScreen, userRole, userName, 
    restaurantRevenue, activeOrders, historicOrders
  } = useStore();
  const [activePage, setActivePage] = useState<PartnerPage>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activePage]);

  // Set default page based on role when entering the app
  useEffect(() => {
    if (userRole === 'restaurant') {
      setActivePage('home');
    } else {
      setActivePage('orders');
    }
  }, [userRole]);

  if (currentScreen === 'login') {
    return <LoginScreen />;
  }

  const role = userRole === 'restaurant' ? 'restaurant' : 'courier';

  // Badge: new orders
  const newOrderCount = activeOrders.filter(o => o.status === 'new').length;
  const hasOrderBadge = newOrderCount > 0;

  return (
    <div className="admin-layout">
      {/* Mobile overlay for sidebar */}
      {sidebarOpen && (
        <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />
      )}

      <PartnerSidebar
        role={role}
        activePage={activePage}
        onNavigate={setActivePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main
        className="admin-main"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* ─── MOBILE TOP HEADER ─── Fixed at top, only on small screens (Couriers only) */}
        {role === 'courier' && (
          <>
            <div
              className="mobile-only-header"
              style={{
                position: 'fixed', top: 0, left: 0, right: 0,
                zIndex: 8000,
                background: 'rgba(8,12,10,0.88)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
                  gap: 12,
                }}
              >

                {/* Logo + Title */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src="/Assets/general-green.png"
                    alt="MestiDelivery"
                    className="w-7 h-7 object-contain flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none">ПАНЕЛЬ УПРАВЛЕНИЯ</p>
                    <p className="text-xs font-bold text-white truncate leading-tight">{userName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer for fixed mobile header — only on mobile */}
            <div className="mobile-only-header" style={{ height: 'calc(60px + env(safe-area-inset-top, 0px))' }} />
          </>
        )}

        {role === 'courier' && activePage === 'orders' && <CourierOrders />}

        {role === 'courier' && activePage === 'stats' && <CourierStats />}

        {role === 'courier' && activePage === 'schedule' && <CourierSchedule />}

        {role === 'courier' && activePage === 'profile' && <CourierProfile />}

        {role === 'courier' && activePage === 'support' && <CourierSupport />}
        
        {role === 'restaurant' && activePage === 'home' && (
          <RestaurantHome 
            userName={userName}
            restaurantRevenue={restaurantRevenue}
            activeOrders={activeOrders}
            historicOrders={historicOrders}
            onNavigate={setActivePage}
          />
        )}
        {role === 'restaurant' && activePage === 'stats' && (
          <RestaurantStats 
            userName={userName}
            restaurantRevenue={restaurantRevenue}
            activeOrders={activeOrders}
            historicOrders={historicOrders}
            onNavigate={setActivePage}
          />
        )}
        {role === 'restaurant' && activePage === 'reviews' && <RestaurantReviews />}
        {role === 'restaurant' && activePage === 'restaurant' && <RestaurantSettings />}
        {role === 'restaurant' && activePage === 'help' && <RestaurantHelp />}
        {role === 'restaurant' && activePage === 'orders' && <RestaurantOrders defaultTab="active" />}
        {role === 'restaurant' && activePage === 'history' && <RestaurantOrders defaultTab="history" />}
        {role === 'restaurant' && activePage === 'menu' && <RestaurantMenu />}
        {role === 'restaurant' && activePage === 'news' && <RestaurantNews />}
        {role === 'restaurant' && activePage === 'support' && <RestaurantSupport />}
      </main>

      <MobileBottomNav
        role={role}
        activePage={activePage}
        onNavigate={setActivePage}
        hasOrderBadge={hasOrderBadge}
      />
    </div>
  );
}

export default PartnerApp;
