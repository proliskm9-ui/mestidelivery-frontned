import React, { useState, useEffect } from 'react';
import {
  Star,
  ArrowRight,
  Utensils,
  History,
  Phone,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Store,
  Coins,
  ChevronRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { Order } from '../api';

interface ViewProps {
  userName: string;
  restaurantRevenue: number;
  activeOrders: Order[];
  historicOrders: Order[];
  onNavigate: (page: any) => void;
}

// --- Reusable Dashboard Components ---

function CircularProgress({ value, color }: { value: number, color: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const safeValue = isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="32" cy="32" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 800, color: '#fff' }}>{safeValue}%</span>
    </div>
  );
}

function MetricCard({ title, value, percentage, subtext, color }: { title: string, value: React.ReactNode, percentage: number, subtext: string, color: string }) {
  return (
    <div className="admin-card metric-card" style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden', marginBottom: 0 }}>
      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
        <div style={{ marginBottom: '8px', transform: 'translateY(-3px)' }}>
          <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
        </div>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '6px', color: '#fff', letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ color: 'rgba(33, 234, 124, 0.8)', fontSize: '0.85rem', fontWeight: 600 }}>{subtext}</div>
      </div>
      <div style={{ flexShrink: 0 }}><CircularProgress value={percentage} color={color} /></div>
    </div>
  );
}




// --- Restaurant Home View ---

// 1. HOME VIEW
export const RestaurantHome: React.FC<ViewProps> = ({
  userName,
  restaurantRevenue,
  activeOrders,
  historicOrders,
  onNavigate
}) => {
  const activeCount = activeOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const cancelledCount = [...activeOrders, ...historicOrders].filter(o => o.status === 'cancelled').length;
  const totalOrders = [...activeOrders, ...historicOrders].length;
  const deliveredCount = historicOrders.filter(o => o.status === 'delivered').length;

  return (
    <div className="partner-page">
      <div className="partner-page-head">
        <div>
          <p className="partner-page-kicker">Ресторан</p>
          <h1 className="partner-page-title">Главная</h1>
          <p className="partner-page-sub">Здравствуйте, {userName}</p>
        </div>
      </div>

      <div className="partner-metric-grid lg:hidden">
        <div className="partner-metric-tile">
          <span className="partner-metric-tile__label">Выручка</span>
          <div className="partner-metric-tile__value">
            {restaurantRevenue.toLocaleString()} <span style={{ fontSize: '1rem', color: '#21EA7C' }}>₾</span>
          </div>
          <div className="partner-metric-tile__sub">По доставленным</div>
        </div>
        <button
          type="button"
          className="partner-metric-tile"
          onClick={() => onNavigate('orders')}
          style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit' }}
        >
          <span className="partner-metric-tile__label">Заказы</span>
          <div className="partner-metric-tile__value">{activeCount}</div>
          <div className="partner-metric-tile__sub" style={{ color: '#60a5fa' }}>В работе</div>
        </button>
        <div className="partner-metric-tile">
          <span className="partner-metric-tile__label">Доставлено</span>
          <div className="partner-metric-tile__value">{deliveredCount}</div>
          <div className="partner-metric-tile__sub">Завершённых</div>
        </div>
        <div className="partner-metric-tile">
          <span className="partner-metric-tile__label">Отмены</span>
          <div className="partner-metric-tile__value">{cancelledCount}</div>
          <div className="partner-metric-tile__sub" style={{ color: '#ef4444' }}>Всего</div>
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-4 gap-6" style={{ marginBottom: 24 }}>
        <MetricCard
          title="Выручка"
          value={<>{restaurantRevenue.toLocaleString()} <span style={{ color: 'var(--admin-primary)', fontSize: '1.8rem' }}>₾</span></>}
          percentage={Math.min(Math.round((restaurantRevenue / 5000) * 100) || 0, 100)}
          subtext="По доставленным"
          color="#21EA7C"
        />
        <div onClick={() => onNavigate('orders')} className="cursor-pointer">
          <MetricCard title="Заказы" value={activeCount.toString()} percentage={Math.min(activeCount * 20, 100)} subtext="В работе" color="#3b82f6" />
        </div>
        <MetricCard title="Доставлено" value={deliveredCount.toString()} percentage={Math.min(deliveredCount * 5, 100)} subtext="Завершено" color="#21EA7C" />
        <MetricCard title="Отмены" value={cancelledCount.toString()} percentage={totalOrders > 0 ? Math.min(Math.round((cancelledCount / totalOrders) * 100), 100) : 0} subtext="Всего" color="#ef4444" />
      </div>

      <p className="partner-page-kicker" style={{ marginBottom: 10 }}>Быстрые действия</p>
      <div className="partner-action-list">
        <button type="button" className="partner-action-row" onClick={() => onNavigate('orders')}>
          <div className="partner-action-row__icon" style={{ background: 'rgba(33,234,124,0.14)', color: '#21EA7C' }}>
            <Utensils size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="partner-action-row__label">Заказы кухни</p>
            <p className="partner-action-row__desc">Принять, готовить, передать курьеру</p>
          </div>
          <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </button>
        <button type="button" className="partner-action-row" onClick={() => onNavigate('menu')}>
          <div className="partner-action-row__icon" style={{ background: 'rgba(96,165,250,0.14)', color: '#60a5fa' }}>
            <Store size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="partner-action-row__label">Меню</p>
            <p className="partner-action-row__desc">Позиции, цены и доступность</p>
          </div>
          <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </button>
        <button type="button" className="partner-action-row" onClick={() => onNavigate('stats')}>
          <div className="partner-action-row__icon" style={{ background: 'rgba(168,85,247,0.14)', color: '#a855f7' }}>
            <History size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="partner-action-row__label">Статистика</p>
            <p className="partner-action-row__desc">Выручка и итоги по заказам</p>
          </div>
          <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </button>
        <button type="button" className="partner-action-row" onClick={() => onNavigate('support')}>
          <div className="partner-action-row__icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
            <Phone size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="partner-action-row__label">Поддержка</p>
            <p className="partner-action-row__desc">Telegram и частые вопросы</p>
          </div>
          <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </button>
      </div>
    </div>
  );
};

// 2. STATS VIEW

// 2. STATS VIEW
export const RestaurantStats: React.FC<ViewProps> = ({
  restaurantRevenue,
  historicOrders
}) => {
  const completedOrders = historicOrders.filter(o => o.status === 'delivered');
  const avgOrderPrice = completedOrders.length > 0
    ? Math.round(restaurantRevenue / completedOrders.length)
    : 0;

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Статистика и аналитика</h1>
          <p className="admin-subtitle">
            Обзор ваших финансовых показателей и объема продаж.
          </p>
        </div>
      </div>

      {/* Mini grid */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-label">Всего заработано сегодня</span>
          <span className="stat-value" style={{ color: 'var(--admin-primary)' }}>{restaurantRevenue.toLocaleString()} ₾</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Выполнено заказов</span>
          <span className="stat-value">{completedOrders.length} зак.</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Средний чек</span>
          <span className="stat-value">{avgOrderPrice} ₾</span>
        </div>
      </div>

      {/* Categories & Top Sellers Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="admin-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
          <h2 style={{ fontSize: '1.3rem', margin: '0 0 24px 0', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', color: '#fff' }}>
            Популярные категории блюд
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Бургеры</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-primary)' }}>72% заказов</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ background: 'linear-gradient(90deg, var(--admin-primary) 0%, #1dd470 100%)', height: '100%', borderRadius: '4px', width: '72%' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Закуски</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>45% заказов</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', height: '100%', borderRadius: '4px', width: '45%' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Напитки</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>30% заказов</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)', height: '100%', borderRadius: '4px', width: '30%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="admin-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
          <h2 style={{ fontSize: '1.3rem', margin: '0 0 24px 0', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', color: '#fff' }}>
            Топ продаваемых позиций
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 'var(--admin-radius-md)',
                border: '1px solid var(--admin-card-border)',
                background: 'rgba(255,255,255,0.01)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'var(--admin-primary)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                e.currentTarget.style.borderColor = 'var(--admin-card-border)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(33, 234, 124, 0.1)', border: '1px solid rgba(33, 234, 124, 0.2)', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  1
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Дабл Чизбургер Барбекю</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.01)' }}>
                45 порций
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 'var(--admin-radius-md)',
                border: '1px solid var(--admin-card-border)',
                background: 'rgba(255,255,255,0.01)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'var(--admin-primary)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                e.currentTarget.style.borderColor = 'var(--admin-card-border)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  2
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Картошка фри XL</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.01)' }}>
                32 порции
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 'var(--admin-radius-md)',
                border: '1px solid var(--admin-card-border)',
                background: 'rgba(255,255,255,0.01)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'var(--admin-primary)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                e.currentTarget.style.borderColor = 'var(--admin-card-border)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                  3
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Сырные Палочки Моцарелла</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.01)' }}>
                28 порций
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. REVIEWS VIEW
export const RestaurantReviews: React.FC = () => {
  const reviews = [
    { name: 'Александр М.', rating: 5, date: 'Сегодня, 18:24', text: 'Бургеры сочные, картошка горячая. Доставили за 20 минут! Рекомендую.' },
    { name: 'Екатерина В.', rating: 5, date: 'Вчера, 14:15', text: 'Заказываем здесь постоянно. Сырные палочки просто бомбические, а соус барбекю великолепен.' },
    { name: 'Дмитрий С.', rating: 4, date: '16.06.2026', text: 'Котлета в бургере супер, прожарка отличная. Снял одну звезду за то, что забыли положить дополнительные салфетки.' },
    { name: 'Юлия К.', rating: 5, date: '15.06.2026', text: 'Очень крутое заведение! Доставка через MestiDelivery работает быстро, курьер был вежлив.' }
  ];

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Отзывы клиентов</h1>
          <p className="admin-subtitle">
            Оценки и отзывы, оставленные гостями о ваших блюдах.
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px',
          borderRadius: 'var(--admin-radius-md)',
          border: '1px solid var(--admin-card-border)',
          background: 'rgba(255, 255, 255, 0.02)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>4.8</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-primary)', background: 'rgba(33, 234, 124, 0.1)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(33, 234, 124, 0.2)' }}>
            <Star size={16} fill="currentColor" />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>(128 отзывов)</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {reviews.map((rev, idx) => (
          <div
            key={idx}
            className="admin-card"
            style={{
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transition: 'all 0.3s ease',
              marginBottom: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--admin-card-border)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(33, 234, 124, 0.05)',
                  border: '1px solid rgba(33, 234, 124, 0.15)',
                  color: 'var(--admin-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem'
                }}>
                  {rev.name[0]}
                </div>
                <div>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>{rev.name}</h5>
                  <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '4px 0 0 0', fontWeight: 500 }}>{rev.date}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={14}
                    className={`${s <= rev.rating ? 'fill-[#21EA7C] text-[#21EA7C]' : 'text-zinc-700'}`}
                  />
                ))}
              </div>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#e4e4e7', lineHeight: '1.6', margin: 0, paddingLeft: '60px' }}>
              {rev.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. SETTINGS VIEW
export const RestaurantSettings: React.FC = () => {
  const [initialData, setInitialData] = useState({
    restName: 'Burger Street',
    phone: '+995 599 123 456',
    address: 'ул. Ираклия Абашидзе 25, Тбилиси',
    hours: '10:00 - 23:00',
    minOrder: '50'
  });

  const [restName, setRestName] = useState(initialData.restName);
  const [phone, setPhone] = useState(initialData.phone);
  const [address, setAddress] = useState(initialData.address);
  const [hours, setHours] = useState(initialData.hours);
  const [minOrder, setMinOrder] = useState(initialData.minOrder);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const isDirty =
    restName !== initialData.restName ||
    phone !== initialData.phone ||
    address !== initialData.address ||
    hours !== initialData.hours ||
    minOrder !== initialData.minOrder;

  // Hours Modal state
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [startHour, setStartHour] = useState('10:00');
  const [endHour, setEndHour] = useState('23:00');

  const [activeTimeTab, setActiveTimeTab] = useState<'start' | 'end' | null>(null);

  const openHoursModal = () => {
    const parts = hours.split(' - ');
    setStartHour(parts[0] || '10:00');
    setEndHour(parts[1] || '23:00');
    setIsHoursModalOpen(true);
    setActiveTimeTab(null);
    document.body.classList.add('admin-modal-open');
  };

  const closeHoursModal = () => {
    setIsHoursModalOpen(false);
    document.body.classList.remove('admin-modal-open');
  };

  // Auto-scroll selected times into view when modal/tab opens
  useEffect(() => {
    if (isHoursModalOpen && activeTimeTab) {
      setTimeout(() => {
        const id = activeTimeTab === 'start' ? `start-time-${startHour}` : `end-time-${endHour}`;
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }, [isHoursModalOpen, activeTimeTab, startHour, endHour]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setInitialData({ restName, phone, address, hours, minOrder });
      setTimeout(() => setSuccess(false), 3000);
    }, 800);
  };

  // Generate 30min intervals
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${String(h).padStart(2, '0')}:${m}`;
  });

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in">
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Ресторан</h1>
          <p className="admin-subtitle">
            Настройка информации о заведении, контактов и часов работы.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Card 1: General Info */}
          <div className="settings-section-card">
            <div className="settings-card-header">
              <div className="settings-card-icon-wrapper">
                <Store size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Основная информация</h3>
                <p className="settings-card-desc">Публичные данные, которые увидят клиенты</p>
              </div>
            </div>

            <div className="settings-card-body space-y-8">
              <div className="custom-form-group">
                <label className="custom-form-label">Название заведения</label>
                <div className="custom-input-wrapper">
                  <input
                    type="text"
                    value={restName}
                    onChange={e => setRestName(e.target.value)}
                    className="custom-admin-input"
                    placeholder="Введите название заведения"
                  />
                  <Store className="custom-input-icon" size={18} />
                </div>
              </div>

              <div className="custom-form-group">
                <label className="custom-form-label">Номер телефона</label>
                <div className="custom-input-wrapper">
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="custom-admin-input"
                    placeholder="Введите номер телефона"
                  />
                  <Phone className="custom-input-icon" size={18} />
                </div>
              </div>

              <div className="custom-form-group">
                <label className="custom-form-label">Фактический адрес</label>
                <div className="custom-input-wrapper">
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="custom-admin-input"
                    placeholder="Укажите фактический адрес"
                  />
                  <MapPin className="custom-input-icon" size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Operational Params */}
          <div className="settings-section-card">
            <div className="settings-card-header">
              <div className="settings-card-icon-wrapper">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Рабочие параметры</h3>
                <p className="settings-card-desc">Режим работы и минимальные условия заказа</p>
              </div>
            </div>

            <div className="settings-card-body space-y-8">
              <div className="custom-form-group">
                <label className="custom-form-label">Режим работы</label>
                <div
                  onClick={openHoursModal}
                  className="interactive-hours-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="hours-icon-container">
                      <Clock size={18} />
                    </div>
                    <div className="text-left">
                      <span className="hours-status-badge">Активен</span>
                      <span className="hours-time-value">{hours}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="hours-chevron" />
                </div>
              </div>

              <div className="custom-form-group">
                <label className="custom-form-label">Минимальная сумма заказа</label>
                <div className="custom-input-wrapper">
                  <input
                    type="number"
                    value={minOrder}
                    onChange={e => setMinOrder(e.target.value)}
                    className="custom-admin-input min-order-input"
                    placeholder="50"
                  />
                  <Coins className="custom-input-icon" size={18} />
                  <span className="currency-suffix-badge">₾</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Action Button and Success Toast */}
        {(isDirty || success || saving) && (
          <div className="actions-bar-container animate-fade-in">
            <div className="flex items-center justify-between gap-6 w-full">
              <button
                type="submit"
                disabled={saving || (!isDirty && !saving)}
                className="admin-btn admin-btn-primary"
                style={{ height: '48px', padding: '0 32px' }}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>

              {success && (
                <div style={{
                  background: 'rgba(33, 234, 124, 0.1)',
                  border: '1px solid rgba(33, 234, 124, 0.2)',
                  color: '#21EA7C',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  <CheckCircle2 size={20} />
                  <span>Настройки успешно сохранены</span>
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      {isHoursModalOpen && (
        <div className="hours-modal-overlay" onClick={closeHoursModal}>
          <div className="hours-modal-container" onClick={e => e.stopPropagation()}>
            <div className="hours-modal-header">
              <h2 className="hours-modal-title">Режим работы</h2>
              <button className="hours-modal-close" onClick={closeHoursModal}>
                <X size={24} />
              </button>
            </div>

            <div className="hours-modal-body modal-scroll-area flex-1 flex flex-col gap-4">
              <p className="hours-modal-desc" style={{ margin: '4px 0 16px 0' }}>
                Укажите часы, в которые ресторан принимает заказы. Выбранное время: <span style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)' }}>{startHour} - {endHour}</span>
              </p>

              {/* Время открытия */}
              <div className="custom-form-group">
                <label className="custom-form-label" style={{ color: activeTimeTab === 'start' ? '#21EA7C' : 'rgba(255, 255, 255, 0.4)' }}>Время открытия</label>
                <div
                  onClick={() => setActiveTimeTab(prev => prev === 'start' ? null : 'start')}
                  className="custom-admin-input"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderColor: activeTimeTab === 'start' ? '#21EA7C' : 'rgba(255, 255, 255, 0.08)',
                    background: activeTimeTab === 'start' ? '#0F1117' : 'rgba(15, 17, 23, 0.6)',
                    boxShadow: activeTimeTab === 'start' ? '0 0 0 4px rgba(33, 234, 124, 0.15)' : 'none',
                    paddingRight: '20px',
                    paddingLeft: '20px',
                    height: '56px'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Clock size={18} style={{ color: activeTimeTab === 'start' ? '#21EA7C' : 'rgba(255, 255, 255, 0.4)' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{startHour}</span>
                  </div>
                  <ChevronRight size={18} style={{ color: 'rgba(255, 255, 255, 0.3)', transition: 'transform 0.3s', transform: activeTimeTab === 'start' ? 'rotate(90deg)' : 'none' }} />
                </div>

                {activeTimeTab === 'start' && (
                  <div className="animate-fade-in" style={{
                    marginTop: '8px',
                    padding: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.01)'
                  }}>
                    <div className="time-picker-scroll grid grid-cols-4 gap-2 overflow-y-auto pr-1 mt-1" style={{ maxHeight: '200px' }}>
                      {timeOptions.map(t => {
                        const isSelected = t === startHour;
                        return (
                          <div
                            key={t}
                            id={`start-time-${t}`}
                            onClick={() => { setStartHour(t); setActiveTimeTab('end'); }}
                            className={`time-option-btn ${isSelected ? 'active' : ''}`}
                          >
                            {t}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Время закрытия */}
              <div className="custom-form-group">
                <label className="custom-form-label" style={{ color: activeTimeTab === 'end' ? '#21EA7C' : 'rgba(255, 255, 255, 0.4)' }}>Время закрытия</label>
                <div
                  onClick={() => setActiveTimeTab(prev => prev === 'end' ? null : 'end')}
                  className="custom-admin-input"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderColor: activeTimeTab === 'end' ? '#21EA7C' : 'rgba(255, 255, 255, 0.08)',
                    background: activeTimeTab === 'end' ? '#0F1117' : 'rgba(15, 17, 23, 0.6)',
                    boxShadow: activeTimeTab === 'end' ? '0 0 0 4px rgba(33, 234, 124, 0.15)' : 'none',
                    paddingRight: '20px',
                    paddingLeft: '20px',
                    height: '56px'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Clock size={18} style={{ color: activeTimeTab === 'end' ? '#21EA7C' : 'rgba(255, 255, 255, 0.4)' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{endHour}</span>
                  </div>
                  <ChevronRight size={18} style={{ color: 'rgba(255, 255, 255, 0.3)', transition: 'transform 0.3s', transform: activeTimeTab === 'end' ? 'rotate(90deg)' : 'none' }} />
                </div>

                {activeTimeTab === 'end' && (
                  <div className="animate-fade-in" style={{
                    marginTop: '8px',
                    padding: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.01)'
                  }}>
                    <div className="time-picker-scroll grid grid-cols-4 gap-2 overflow-y-auto pr-1 mt-1" style={{ maxHeight: '200px' }}>
                      {timeOptions.map(t => {
                        const isSelected = t === endHour;
                        return (
                          <div
                            key={t}
                            id={`end-time-${t}`}
                            onClick={() => { setEndHour(t); setActiveTimeTab(null); }}
                            className={`time-option-btn ${isSelected ? 'active' : ''}`}
                          >
                            {t}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="hours-modal-footer">
              <button
                type="button"
                className="hours-btn-cancel"
                onClick={closeHoursModal}
              >
                Отмена
              </button>
              <button
                type="button"
                className="hours-btn-apply"
                onClick={() => {
                  setHours(`${startHour} - ${endHour}`);
                  closeHoursModal();
                }}
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hours-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          animation: hoursFadeIn 0.3s ease forwards;
        }

        .hours-modal-container {
          background: #1a1d27;
          border-radius: 25px;
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: hoursScaleIn 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }

        @keyframes hoursFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes hoursScaleIn {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .hours-modal-header {
          padding: 24px 24px 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: #1a1d27;
        }

        .hours-modal-title {
          margin: 0;
          font-weight: 800;
          font-size: 18px;
          line-height: 1;
          color: rgba(255, 255, 255, 0.85);
        }

        .hours-modal-close {
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          color: #21EA7C;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease;
        }

        .hours-modal-close:hover {
          opacity: 0.85;
        }

        .hours-modal-close svg {
          width: 24px;
          height: 24px;
        }

        .hours-modal-body {
          padding: 0 24px 20px;
          overflow-y: auto;
        }

        .hours-modal-desc {
          margin: 12px 0 20px 0;
          font-weight: 500;
          font-size: 13px;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.60);
        }
        /* Time option buttons inside the picker grid - copied from .tm-slot-btn */
        .time-option-btn {
          height: 44px;
          border: 2px solid #2D2D2B;
          border-radius: 12px;
          background: transparent;
          font-family: inherit;
          font-weight: 550;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease;
          white-space: nowrap;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .time-option-btn:hover {
          border-color: rgba(33, 234, 124, 0.4);
        }

        .time-option-btn.active {
          border-color: rgba(33, 234, 124, 0.85);
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          font-weight: 600;
        }

        .hours-modal-footer {
          padding: 16px 24px 24px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #1a1d27;
        }

        .hours-btn-cancel {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 12px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .hours-btn-cancel:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
        }

        /* Confirm button - copied from .tm-confirm-btn */
        .hours-btn-apply {
          flex: 1;
          height: 48px;
          background: #21EA7C;
          border: none;
          border-radius: 14px;
          font-family: inherit;
          font-weight: 700;
          font-size: 16px;
          color: #161616;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0px 4px 5px 0px rgba(59, 180, 74, 0.20);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hours-btn-apply:hover {
          background: #1ee075;
          box-shadow: 0px 6px 10px 0px rgba(59, 180, 74, 0.30);
          transform: translateY(-1px);
        }

        .time-picker-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .time-picker-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .time-picker-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .time-picker-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(33, 234, 124, 0.3);
        }

        /* Settings layout cards */
        .settings-section-card {
          background: #1A1D27;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 32px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .settings-section-card:hover {
          border-color: rgba(33, 234, 124, 0.15);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
          transform: translateY(-2px);
        }

        /* Card Headers */
        .settings-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 20px;
        }
        .settings-card-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(33, 234, 124, 0.1);
          border: 1px solid rgba(33, 234, 124, 0.2);
          color: #21EA7C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .settings-card-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .settings-card-desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          margin: 2px 0 0 0;
          font-weight: 500;
        }

        /* Form Groups and Inputs */
        .custom-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .custom-form-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding-left: 2px;
          transition: color 0.2s ease;
          transform: translateY(4px);
        }
        .custom-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        
        .custom-admin-input {
          width: 100%;
          padding: 16px 20px 16px 52px;
          border-radius: 16px;
          background: rgba(15, 17, 23, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-admin-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
        .custom-admin-input:hover {
          border-color: rgba(33, 234, 124, 0.3);
          background: rgba(15, 17, 23, 0.8);
        }
        .custom-admin-input:focus {
          outline: none;
          border-color: #21EA7C;
          background: #0F1117;
          box-shadow: 0 0 0 4px rgba(33, 234, 124, 0.15);
        }
        .custom-input-icon {
          position: absolute;
          left: 18px;
          color: #21EA7C;
          transition: color 0.25s ease;
          pointer-events: none;
        }
        
        /* Change label and icon color on focus using CSS sibling selectors */
        .custom-admin-input:focus ~ .custom-input-icon {
          color: #21EA7C;
        }
        .custom-form-group:focus-within .custom-form-label {
          color: #21EA7C;
        }
        
        /* Currency Suffix Badge */
        .currency-suffix-badge {
          position: absolute;
          right: 20px;
          color: #21EA7C;
          font-weight: 800;
          font-size: 1.1rem;
          pointer-events: none;
        }
        .min-order-input {
          padding-right: 48px;
        }

        /* Interactive hours selector */
        .interactive-hours-card {
          width: 100%;
          padding: 16px 20px;
          border-radius: 16px;
          background: rgba(15, 17, 23, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .interactive-hours-card:hover {
          border-color: rgba(33, 234, 124, 0.3);
          background: rgba(33, 234, 124, 0.03);
        }
        .interactive-hours-card:hover .hours-chevron {
          color: #21EA7C;
          transform: translateX(2px);
        }
        .hours-icon-container {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }
        .interactive-hours-card:hover .hours-icon-container {
          background: rgba(33, 234, 124, 0.15);
          color: #21EA7C;
        }
        .hours-status-badge {
          display: block;
          font-size: 0.62rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #21EA7C;
        }
        .hours-time-value {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          margin-top: 1px;
        }
        .hours-chevron {
          color: rgba(255, 255, 255, 0.25);
          transition: all 0.25s ease;
        }

        /* Actions Bar Container */
        .actions-bar-container {
          background: rgba(26, 29, 39, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 16px 28px;
          display: flex;
          align-items: center;
          margin-top: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        }

        /* Save Button Adjustments */
        .settings-save-btn {
          height: 48px;
          padding: 0 32px !important;
          border-radius: 14px !important;
          font-size: 0.95rem !important;
          letter-spacing: -0.2px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 !important;
        }

        /* Success Toast Aligned */
        .settings-success-toast {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 24px;
          height: 48px;
          background: rgba(33, 234, 124, 0.06);
          border: 1px solid rgba(33, 234, 124, 0.2);
          border-radius: 14px;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 700;
          animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .toast-icon-check {
          color: #21EA7C;
          animation: checkPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes checkPop {
          0% {
            transform: scale(0.6);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

// 5. HELP VIEW
export const RestaurantHelp: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Как работает прием и приготовление заказов?',
      a: 'Все новые заказы от клиентов попадают во вкладку «Заказы» (раздел РАБОТА С ЗАКАЗАМИ). Нажмите «Начать готовить» для перевода заказа на кухню. После приготовления нажмите «Приготовлено, выдать курьеру» — курьер на линии получит уведомление и прибудет для забора.'
    },
    {
      q: 'Как временно закрыть ресторан для заказов?',
      a: 'В верхней части бокового меню расположен компактный тумблер («Открыт / Закрыт»). Переключите его в положение «Закрыт». В этом состоянии клиенты в приложении увидят статус «Закрыт» и не смогут отправлять новые заказы.'
    },
    {
      q: 'Что делать, если курьер задерживается или не назначен?',
      a: 'Обычно поиск курьера начинается автоматически после смены статуса на «Готов к выдаче». Если курьер не назначен в течение 10 минут, пожалуйста, обратитесь в службу поддержки партнеров в Telegram (@MestigoSupport_Bot) с указанием ID заказа.'
    },
    {
      q: 'Как отредактировать меню или изменить цены?',
      a: 'Перейдите в раздел «Меню» в блоке УПРАВЛЕНИЕ РЕСТОРАНОМ. Здесь можно отредактировать блюда, изменить их цену, фото, описание, а также временно скрыть позицию с помощью тумблера «Доступно/Скрыто».'
    }
  ];

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Справка и поддержка</h1>
          <p className="admin-subtitle">
            Ответы на часто задаваемые вопросы по работе с дашбордом.
          </p>
        </div>
      </div>

      <div className="bg-[#1A1D27] border border-white/5 rounded-[24px] p-8 divide-y divide-white/5">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="py-4 first:pt-0 last:pb-0">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex justify-between items-center text-left focus:outline-none"
              >
                <span className="text-xs font-bold text-white leading-snug">{faq.q}</span>
                <span className="text-zinc-500 ml-4 flex-shrink-0">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {isOpen && (
                <div className="mt-3 text-xs text-zinc-400 leading-relaxed animate-fade-in-up pl-1">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support contact info */}
      <div className="p-6 border border-white/5 bg-[#0F1117] rounded-[24px] flex items-start gap-4">
        <div className="p-3 bg-[#21EA7C]/10 border border-[#21EA7C]/20 text-[#21EA7C] rounded-xl flex-shrink-0">
          <HelpCircle size={20} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Нужна дополнительная помощь?</h4>
          <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">
            Если вашего вопроса нет в списке или возникла нештатная ситуация с оплатой или работой приложения, напишите нам в круглосуточную службу заботы о партнерах.
          </p>
          <a
            href="https://t.me/MestigoSupport_Bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#21EA7C] font-extrabold hover:underline mt-2.5"
          >
            Написать в Telegram @MestigoSupport_Bot <ArrowRight size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};

// 6. NEWS VIEW
export const RestaurantNews: React.FC = () => {
  const newsItems = [
    {
      title: 'Обновление автоназначения курьеров',
      date: 'Сегодня, 10:15',
      badge: 'Новое',
      badgeColor: 'bg-emerald-500/10 text-[#21EA7C] border-emerald-500/20',
      text: 'Мы оптимизировали алгоритм подбора курьеров для горячих блюд. Теперь среднее время ожидания назначения сократилось на 4 минуты. Убедитесь, что вы переводите заказ в статус «Готов к выдаче» вовремя.',
    },
    {
      title: 'Новые правила компенсаций за задержки',
      date: '15 июня 2026',
      badge: 'Важно',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      text: 'Вступили в силу обновленные регламенты компенсаций за ожидание курьеров на точке. Если курьер прибыл, но заказ не готов в течение 15 минут после указанного времени, система автоматически начислит компенсацию.',
    },
    {
      title: 'Летнее спецпредложение для партнеров',
      date: '10 июня 2026',
      badge: 'Акция',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      text: 'Запустите промокод со скидкой от 15% на выделенные позиции меню до конца июня, и мы бесплатно поднимем ваш ресторан на первые строчки в категории «Скидки» в приложении для клиентов.',
    }
  ];

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Новости платформы</h1>
          <p className="admin-subtitle">
            Информация об обновлениях сервиса, акциях и технических изменениях.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {newsItems.map((item, idx) => (
          <div key={idx} className="bg-[#1A1D27] border border-white/5 rounded-[24px] p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <h3 className="text-sm font-bold text-white mt-1">{item.title}</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-semibold">{item.date}</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 7. SUPPORT VIEW
export const RestaurantSupport: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Поддержка партнеров</h1>
          <p className="admin-subtitle">
            Свяжитесь с нашей службой заботы или техническим отделом.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1A1D27] border border-white/5 rounded-[24px] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-[14px] bg-[#21EA7C]/10 border border-[#21EA7C]/20 text-[#21EA7C] flex items-center justify-center">
              <Phone size={22} />
            </div>
            <h3 className="text-base font-bold text-white">Круглосуточный чат-бот</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Наш бот в Telegram поможет мгновенно связаться с оператором, сообщить о проблеме с курьером или заказом, а также задать финансовые вопросы.
            </p>
          </div>
          <a
            href="https://t.me/MestigoSupport_Bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '16px',
              borderRadius: 'var(--admin-radius-md)',
              background: 'rgba(33, 234, 124, 0.03)',
              border: '1px solid rgba(33, 234, 124, 0.2)',
              color: 'var(--admin-primary)',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              marginTop: '24px',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--admin-primary)';
              e.currentTarget.style.borderColor = 'var(--admin-primary)';
              e.currentTarget.style.color = '#0f1117';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(33, 234, 124, 0.25)';
              e.currentTarget.style.transform = 'translateY(-1.5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(33, 234, 124, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(33, 234, 124, 0.2)';
              e.currentTarget.style.color = 'var(--admin-primary)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
              <path d="M11.944 0C5.344 0 0 5.344 0 12c0 6.656 5.344 12 11.944 12 6.656 0 12-5.344 12-12 0-6.656-5.344-12-12-12zm5.892 8.243l-1.897 8.93c-.14.627-.512.784-1.04.485l-2.895-2.136-1.396 1.343c-.155.155-.285.285-.585.285l.207-2.943 5.35-4.834c.232-.206-.05-.32-.36-.114l-6.616 4.16-2.855-.892c-.62-.193-.632-.62.13-.918l11.16-4.302c.518-.193.97.114.796.98z" />
            </svg>
            Написать в Telegram
          </a>
        </div>

        <div className="bg-[#1A1D27] border border-white/5 rounded-[24px] p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-[14px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Clock size={22} />
            </div>
            <h3 className="text-base font-bold text-white">Режим работы отделов</h3>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Служба доставки (операторы)</span>
                <span className="text-white font-semibold">24 / 7</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Финансовый отдел</span>
                <span className="text-white font-semibold">Пн-Пт, 09:00 - 18:00</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Технический отдел</span>
                <span className="text-white font-semibold">Ежедневно, 10:00 - 22:00</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 text-center mt-6">
            Среднее время ответа оператора составляет 3-5 минут
          </div>
        </div>
      </div>
    </div>
  );
};
