import React, { useState, useEffect, ChangeEvent } from 'react';
import { useStore } from './store/useStore';
import { LoginScreen } from './components/LoginScreen';
import { CourierOrders } from './components/CourierOrders';
import { CourierStats } from './components/CourierStats';
import { CourierGuide } from './components/CourierGuide';
import { PartnerProfile } from './components/PartnerProfile';
import { PartnerSupport } from './components/PartnerSupport';
import { RestaurantOrders } from './components/RestaurantOrders';
import { RestaurantMenu } from './components/RestaurantMenu';
import { RestaurantStatsPage } from './components/RestaurantStatsPage';
import { RestaurantHome } from './components/DashboardViews';
import { useLanguage, type Language } from '../../translations/LanguageContext';

import {
  Home,
  BarChart2,
  ShoppingBag,
  History,
  Utensils,
  LogOut,
  ChevronRight,
  BookOpen,
  User,
  LifeBuoy,
  MoreHorizontal,
} from 'lucide-react';
import './index.css';
import '../Admin/AdminStyles.css';
import './partner-ui.css';


type CourierPage = 'orders' | 'stats' | 'guide' | 'profile' | 'support';
type RestaurantPage =
  | 'home'
  | 'orders'
  | 'stats'
  | 'menu'
  | 'history'
  | 'profile'
  | 'support';
type PartnerPage = CourierPage | RestaurantPage;

const PAGE_ALIASES: Record<string, PartnerPage> = {
  orders: 'orders',
  stats: 'stats',
  statistics: 'stats',
  guide: 'guide',
  shifts: 'guide',
  schedule: 'guide',
  profile: 'profile',
  support: 'support',
  home: 'home',
  menu: 'menu',
  history: 'history',
};

function pageFromUrl(role: 'courier' | 'restaurant'): PartnerPage | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('page')?.toLowerCase() || '';
    const mapped = PAGE_ALIASES[raw];
    if (!mapped) return null;
    if (role === 'courier') {
      return (['orders', 'stats', 'guide', 'profile', 'support'] as PartnerPage[]).includes(mapped)
        ? mapped
        : null;
    }
    return (['home', 'orders', 'stats', 'menu', 'history', 'profile', 'support'] as PartnerPage[]).includes(mapped)
      ? mapped
      : null;
  } catch {
    return null;
  }
}

function ensurePartnerDefaultLang(setLanguage: (lang: Language) => void) {
  // Partners market default: Georgian, unless user explicitly chose a language.
  if (localStorage.getItem('partner_lang_explicit') === '1') return;
  setLanguage('ka');
}

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
  const { t } = useLanguage();

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
            { id: 'orders' as PartnerPage, label: t('partnerApp.nav.orders'), Icon: ShoppingBag },
            { id: 'stats' as PartnerPage, label: t('partnerApp.nav.stats_full'), Icon: BarChart2 },
            { id: 'guide' as PartnerPage, label: t('partnerApp.nav.guide'), Icon: BookOpen },
            { id: 'profile' as PartnerPage, label: t('partnerApp.nav.profile'), Icon: User },
            { id: 'support' as PartnerPage, label: t('partnerApp.nav.support'), Icon: LifeBuoy }
          ]
        }
      ]
    : [
        {
          items: [
            { id: 'home' as PartnerPage, label: t('partnerApp.nav.home'), Icon: Home },
            { id: 'orders' as PartnerPage, label: t('partnerApp.nav.orders'), Icon: ShoppingBag },
            { id: 'history' as PartnerPage, label: t('partnerApp.nav.history'), Icon: History },
            { id: 'menu' as PartnerPage, label: t('partnerApp.nav.menu'), Icon: Utensils },
            { id: 'stats' as PartnerPage, label: t('partnerApp.nav.stats_full'), Icon: BarChart2 },
            { id: 'profile' as PartnerPage, label: t('partnerApp.nav.profile'), Icon: User },
            { id: 'support' as PartnerPage, label: t('partnerApp.nav.support'), Icon: LifeBuoy }
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
          <span>{t('partnerApp.profile.logout')}</span>
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
  const { t } = useLanguage();

  const courierItems = [
    { id: 'guide' as PartnerPage, label: t('partnerApp.nav.guide'), icon: BookOpen, desc: t('partnerApp.more.guide_desc'), color: '#3b82f6' },
    { id: 'profile' as PartnerPage, label: t('partnerApp.nav.profile'), icon: User, desc: t('partnerApp.more.profile_desc'), color: '#f59e0b' },
    { id: 'support' as PartnerPage, label: t('partnerApp.nav.support'), icon: LifeBuoy, desc: t('partnerApp.more.support_desc'), color: '#ef4444' },
  ];

  const restaurantItems = [
    { id: 'history' as PartnerPage, label: t('partnerApp.nav.history'), icon: History, desc: t('partnerApp.more.history_desc'), color: '#3b82f6' },
    { id: 'stats' as PartnerPage, label: t('partnerApp.nav.stats_full'), icon: BarChart2, desc: t('partnerApp.more.stats_desc'), color: '#21EA7C' },
    { id: 'profile' as PartnerPage, label: t('partnerApp.nav.profile'), icon: User, desc: t('partnerApp.more.profile_rest_desc'), color: '#f59e0b' },
    { id: 'support' as PartnerPage, label: t('partnerApp.nav.support'), icon: LifeBuoy, desc: t('partnerApp.more.support_rest_desc'), color: '#ef4444' },
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
      <div className="partner-sheet-backdrop" />
      <div className="partner-sheet" onClick={e => e.stopPropagation()}>
        <div className="partner-sheet__handle" />

        <div style={{ padding: '8px 20px 16px' }}>
          <p className="partner-page-kicker" style={{ marginBottom: 0 }}>{t('partnerApp.nav.other')}</p>
        </div>

        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(({ id, label, icon: Icon, desc, color }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                type="button"
                className="partner-action-row"
                onClick={() => { onNavigate(id); onClose(); }}
                style={{
                  background: active ? `${color}12` : undefined,
                  borderColor: active ? `${color}40` : undefined,
                }}
              >
                <div className="partner-action-row__icon" style={{
                  background: active ? `${color}18` : 'rgba(255,255,255,0.06)',
                }}>
                  <Icon size={19} style={{ color: active ? color : 'rgba(255,255,255,0.5)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="partner-action-row__label" style={{ color: active ? color : undefined }}>{label}</p>
                  <p className="partner-action-row__desc">{desc}</p>
                </div>
                <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

        <div style={{ height: 'calc(88px + env(safe-area-inset-bottom, 0px))' }} />
      </div>
    </div>
  );
}

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
  const { t } = useLanguage();

  type NavItem = { id: PartnerPage; label: string; Icon: React.ElementType; badge?: boolean };

  const morePages = role === 'courier'
    ? ['guide', 'profile', 'support']
    : ['history', 'stats', 'profile', 'support'];
  const isMoreActive = morePages.includes(activePage);

  const courierItems: NavItem[] = [
    { id: 'orders', label: t('partnerApp.nav.orders'), Icon: ShoppingBag },
    { id: 'stats', label: t('partnerApp.nav.stats'), Icon: BarChart2 },
  ];

  const restaurantItems: NavItem[] = [
    { id: 'home', label: t('partnerApp.nav.home'), Icon: Home },
    { id: 'orders', label: t('partnerApp.nav.orders'), Icon: ShoppingBag, badge: hasOrderBadge },
    { id: 'menu', label: t('partnerApp.nav.menu'), Icon: Utensils },
  ];

  const items = role === 'courier' ? courierItems : restaurantItems;
  const moreActive = isMoreActive || moreOpen;

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

      <nav className="partner-bottom-nav" aria-label="Навигация">
        {items.map(({ id, label, Icon, badge }) => {
          const active = activePage === id && !isMoreActive;
          return (
            <button
              key={id}
              type="button"
              className={`partner-tab${active ? ' is-active' : ''}`}
              onClick={() => { setMoreOpen(false); onNavigate(id); }}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
            >
              {badge ? <span className="partner-tab-badge" /> : null}
              <Icon size={24} strokeWidth={active ? 2.35 : 1.9} />
              <span>{label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`partner-tab${moreActive ? ' is-active' : ''}`}
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-label={t('partnerApp.nav.more')}
          aria-expanded={moreOpen}
        >
          <MoreHorizontal size={24} strokeWidth={moreActive ? 2.35 : 1.9} />
          <span>{t('partnerApp.nav.more')}</span>
        </button>
      </nav>
    </>
  );
}

function MobileTopChrome({
  role,
}: {
  role: 'courier' | 'restaurant';
  userName?: string;
}) {
  const { isOnline, toggleOnline } = useStore();
  const { t } = useLanguage();
  return (
    <>
      <header className="partner-mobile-chrome">
        <div className="partner-chrome-brand" aria-label="MestiDelivery Partners">
          <p className="partner-chrome-wordmark">
            <span className="partner-chrome-wordmark__mesti">Mesti</span>
            <span className="partner-chrome-wordmark__delivery">Delivery</span>
          </p>
          <p className="partner-chrome-partners">Partners</p>
        </div>
        {role === 'courier' ? (
          <button
            type="button"
            className={`partner-online-toggle${isOnline ? ' is-on' : ''}`}
            onClick={() => toggleOnline()}
            aria-pressed={isOnline}
          >
            <span className="partner-online-dot" />
            {isOnline ? t('partnerApp.chrome.online') : t('partnerApp.chrome.offline')}
          </button>
        ) : (
          <span className="partner-online-toggle is-on" aria-label={t('partnerApp.chrome.open')}>
            <span className="partner-online-dot" />
            {t('partnerApp.chrome.open')}
          </span>
        )}
      </header>
      <div className="partner-chrome-spacer" />
    </>
  );
}

function PartnerApp() {
  const { 
    currentScreen, userRole, userName, 
    restaurantRevenue, activeOrders, historicOrders,
    hydrateSession,
  } = useStore();
  const { setLanguage } = useLanguage();
  const [activePage, setActivePage] = useState<PartnerPage>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (!tg) return;
      tg.ready?.();
      tg.expand?.();
      tg.setHeaderColor?.('#0b120e');
      tg.setBackgroundColor?.('#0b120e');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    ensurePartnerDefaultLang(setLanguage);
  }, [setLanguage]);

  useEffect(() => {
    const onExpired = () => useStore.getState().logout();
    window.addEventListener('partner-auth-expired', onExpired);
    return () => window.removeEventListener('partner-auth-expired', onExpired);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activePage]);

  // Default page from role, or ?page= deep link from Telegram bot buttons
  useEffect(() => {
    if (userRole !== 'restaurant' && userRole !== 'courier') return;
    const role = userRole === 'restaurant' ? 'restaurant' : 'courier';
    const fromUrl = pageFromUrl(role);
    if (fromUrl) {
      setActivePage(fromUrl);
      return;
    }
    setActivePage(role === 'restaurant' ? 'home' : 'orders');
  }, [userRole]);

  if (currentScreen === 'login') {
    return (
      <div className="partner-app">
        <LoginScreen />
      </div>
    );
  }

  const role = userRole === 'restaurant' ? 'restaurant' : 'courier';

  // Badge: new orders
  const newOrderCount = activeOrders.filter(o => o.status === 'new').length;
  const hasOrderBadge = newOrderCount > 0;

  return (
    <div className="admin-layout partner-app partner-app--mobile-pad">
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

      <main className="admin-main">
        <MobileTopChrome role={role} />

        {role === 'courier' && activePage === 'orders' && <CourierOrders />}
        {role === 'courier' && activePage === 'stats' && <CourierStats />}
        {role === 'courier' && activePage === 'guide' && <CourierGuide />}
        {role === 'courier' && activePage === 'profile' && <PartnerProfile role="courier" />}
        {role === 'courier' && activePage === 'support' && <PartnerSupport role="courier" />}

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
          <RestaurantStatsPage
            restaurantRevenue={restaurantRevenue}
            activeOrders={activeOrders}
            historicOrders={historicOrders}
            onNavigate={(page) => setActivePage(page as typeof activePage)}
          />
        )}
        {role === 'restaurant' && activePage === 'orders' && <RestaurantOrders defaultTab="active" />}
        {role === 'restaurant' && activePage === 'history' && <RestaurantOrders defaultTab="history" />}
        {role === 'restaurant' && activePage === 'menu' && <RestaurantMenu />}
        {role === 'restaurant' && activePage === 'profile' && <PartnerProfile role="restaurant" />}
        {role === 'restaurant' && activePage === 'support' && <PartnerSupport role="restaurant" />}
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
