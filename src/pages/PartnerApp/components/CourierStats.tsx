import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api';
import { 
  Wallet, 
  ArrowUpRight, 
  X
} from 'lucide-react';

interface Stats {
  total_deliveries: number;
  total_tips_earned: number;
  is_online: boolean;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'delivery' | 'tips' | 'payout';
  status: 'completed' | 'pending' | 'failed';
  desc: string;
}

// --- Reusable Components ---

function CircularProgress({ value, color }: { value: number, color: string }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const safeValue = isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: '13px', fontWeight: 800, color: '#fff' }}>{safeValue}%</span>
    </div>
  );
}

function MetricCard({ title, value, percentage, subtext, color }: { title: string, value: React.ReactNode, percentage: number, subtext: string, color: string }) {
  return (
    <div className="admin-card metric-card" style={{ 
      padding: '24px 20px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: 0
    }}>
      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
        <div style={{ marginBottom: '8px', transform: 'translateY(-3px)' }}>
          <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '6px', color: '#fff', letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ color: 'rgba(33, 234, 124, 0.8)', fontSize: '0.85rem', fontWeight: 600 }}>{subtext}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <CircularProgress value={percentage} color={color} />
      </div>
    </div>
  );
}

const parseOrderDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  if (typeof dateInput === 'object' && dateInput.seconds) {
    return new Date(dateInput.seconds * 1000);
  }
  if (typeof dateInput === 'string') {
    let d = new Date(dateInput);
    if (!isNaN(d.getTime())) return d;
    const normalized = (dateInput.includes('Z') || dateInput.includes('+')) 
      ? dateInput 
      : dateInput.replace(' ', 'T');
    d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;
    d = new Date(normalized + 'Z');
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const formatSafeDate = (dateStr: any) => {
  const d = parseOrderDate(dateStr) || new Date();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getDate() === d2.getDate();

  const timeStr = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (isSameDay(d, today)) {
    return `Сегодня, ${timeStr}`;
  } else if (isSameDay(d, yesterday)) {
    return `Вчера, ${timeStr}`;
  }
  return d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
};

const getStatusLabel = (status?: string): { label: string, class: string } => {
  const s = status?.toLowerCase() || 'pending';
  switch (s) {
    case 'cancelled': return { label: 'Отменен', class: 'cancelled' };
    case 'delivered': return { label: 'Доставлен', class: 'delivered' };
    case 'ready': return { label: 'Готов', class: 'pending' };
    case 'picked_up': return { label: 'В пути', class: 'pending' };
    case 'arrived': return { label: 'Прибыл', class: 'pending' };
    default: return { label: 'Ожидание', class: 'pending' };
  }
};

const dashboardStyles = `
.see-all {
  background: rgba(30, 30, 30, 0.4);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #21EA7C;
  padding: 0;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 28px;
  flex-shrink: 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-out;
}
.see-all:active {
  transform: scale(0.96);
  background: rgba(40, 40, 40, 0.6);
}
.see-all span:first-child {
  margin-left: 6px;
}
.see-all span:last-child {
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(0deg) scale(0.8);
  margin-left: 2px;
  margin-top: -1.5px;
}
.chart-bar-container {
  width: 100%;
  height: 220px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  display: flex;
  align-items: flex-end;
  overflow: visible;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.04);
}
.chart-bar {
  width: 100%;
  border-radius: 8px;
  background: linear-gradient(180deg, #21EA7C 0%, #0db353 100%);
  position: relative;
  cursor: pointer;
  transition: height 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s;
}
.chart-bar:hover {
  filter: brightness(1.25);
}
.chart-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: #1a1d27;
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}
.chart-bar:hover .chart-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.chart-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #1a1d27 transparent transparent transparent;
}
.admin-card.metric-card {
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.admin-card.metric-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.15);
}

/* Status Badges Capsule for Table */
.status-badge-capsule {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  display: inline-block;
  border: 1px solid transparent;
  letter-spacing: 0.3px;
}
.status-badge-capsule.new, .status-badge-capsule.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}
.status-badge-capsule.confirmed {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.2);
}
.status-badge-capsule.preparing {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border-color: rgba(139, 92, 246, 0.2);
}
.status-badge-capsule.ready {
  background: rgba(33, 234, 124, 0.1);
  color: #21EA7C;
  border-color: rgba(33, 234, 124, 0.2);
}
.status-badge-capsule.delivering, .status-badge-capsule.picked_up, .status-badge-capsule.arrived {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  border-color: rgba(6, 182, 212, 0.2);
}
.status-badge-capsule.delivered {
  background: rgba(33, 234, 124, 0.1);
  color: #21EA7C;
  border-color: rgba(33, 234, 124, 0.2);
}
.status-badge-capsule.cancelled {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}
.dashboard-grid-middle {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 24px;
  margin-bottom: 36px;
}
@media (max-width: 1024px) {
  .dashboard-grid-middle {
    grid-template-columns: 1fr;
  }
}
@keyframes scaleUp {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
`;

export function CourierStats() {
  const { userName, courierEarnings, courierDeliveriesCount, historicOrders, fetchOrders } = useStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'volume' | 'value'>('volume');
  const [bottomTab, setBottomTab] = useState<'transactions' | 'orders'>('transactions');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Persisted state from localStorage
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('courier_balance');
    return saved !== null ? parseFloat(saved) : 138.50;
  });

  const [payouts, setPayouts] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('courier_payouts');
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'TX-9841', date: '21.06.2026, 14:32', amount: 45.00, type: 'payout', status: 'pending', desc: 'Вывод на карту **** 4321' },
      { id: 'TX-9721', date: '20.06.2026, 19:15', amount: 15.50, type: 'delivery', status: 'completed', desc: 'Доставка заказа #2847' },
      { id: 'TX-9654', date: '20.06.2026, 17:40', amount: 5.00, type: 'tips', status: 'completed', desc: 'Чаевые от клиента (заказ #2847)' },
      { id: 'TX-9510', date: '19.06.2026, 12:00', amount: 120.00, type: 'payout', status: 'completed', desc: 'Вывод на карту **** 4321' },
      { id: 'TX-9488', date: '18.06.2026, 21:05', amount: 22.00, type: 'delivery', status: 'completed', desc: 'Доставка заказа #2812' },
      { id: 'TX-9411', date: '18.06.2026, 18:30', amount: 18.00, type: 'delivery', status: 'completed', desc: 'Доставка заказа #2799' }
    ];
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('courier_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('courier_payouts', JSON.stringify(payouts));
  }, [payouts]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchOrders();
      const s = await api.getStats().catch(() => null);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalDeliveries = stats?.total_deliveries ?? courierDeliveriesCount ?? 0;
  const totalTips = stats?.total_tips_earned ?? courierEarnings ?? 0;

  // Aggregate delivery earnings from mock payouts or completed orders
  const totalDeliveriesAmount = payouts.filter(tx => tx.type === 'delivery').reduce((sum, o) => sum + o.amount, 0) || 55.00;
  const totalEarnings = totalDeliveriesAmount + totalTips;

  // Circular progress calculations (relative goals)
  const revenuePercent = Math.min(100, Math.round((totalEarnings / 250) * 100)) || 0;
  const deliveriesPercent = Math.min(100, Math.round((totalDeliveries / 15) * 100)) || 0;
  const tipsPercent = Math.min(100, Math.round((totalTips / 80) * 100)) || 0;

  // Payout submission
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > balance) {
      alert('Недостаточно средств или неверная сумма');
      return;
    }

    const newTx: Transaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString('ru-RU').slice(0, 17),
      amount: amountNum,
      type: 'payout',
      status: 'pending',
      desc: 'Вывод на карту **** 4321'
    };

    setBalance(prev => prev - amountNum);
    setPayouts(prev => [newTx, ...prev]);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };

  // Weekly analytics logic (based on the past 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const daysStr = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const daysLabels = last7Days.map(d => daysStr[d.getDay()]);

  const weeklyData = last7Days.map(d => {
    const dayStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const dayTxs = payouts.filter(tx => tx.date.startsWith(dayStr));
    const volume = dayTxs.filter(tx => tx.type !== 'payout').length;
    const value = dayTxs.filter(tx => tx.type !== 'payout').reduce((sum, tx) => sum + tx.amount, 0);
    
    // Premium fallback mock data per weekday if no real transaction exists yet
    const weekday = d.getDay();
    const defaultVolume = weekday === 0 ? 1 : weekday === 4 ? 2 : weekday === 5 ? 3 : 0;
    const defaultValue = weekday === 0 ? 12.00 : weekday === 4 ? 35.00 : weekday === 5 ? 48.00 : 0;

    return {
      date: dayStr,
      volume: volume || defaultVolume,
      value: value || defaultValue
    };
  });

  const maxVolume = Math.max(...weeklyData.map(d => d.volume), 1);
  const maxValue = Math.max(...weeklyData.map(d => d.value), 1);

  const growthPercentages = weeklyData.map(d => 
    chartMode === 'volume' ? Math.round((d.volume / maxVolume) * 100) : Math.round((d.value / maxValue) * 100)
  );

  return (
    <div className="admin-page" style={{ padding: '0', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{dashboardStyles}</style>

      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-1px', textTransform: 'uppercase' }}>Статистика</h1>
        <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>
          {userName} · Сводка показателей и баланс в реальном времени.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--admin-text-muted)' }}>Загрузка сводки...</div>
      ) : (
        <>
          {/* Top Row: Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '36px' }}>
            <MetricCard 
              title="Выручка" 
              value={<>{totalEarnings.toFixed(2)} <span style={{ color: 'var(--admin-primary)', fontSize: '1.5rem' }}>₾</span></>} 
              percentage={revenuePercent} 
              subtext="+12% к вчера" 
              color="#21EA7C" 
            />
            <MetricCard 
              title="Доставки" 
              value={`${totalDeliveries} зак.`} 
              percentage={deliveriesPercent} 
              subtext="+8% к вчера" 
              color="#3b82f6" 
            />
            <MetricCard 
              title="Чаевые" 
              value={<>{totalTips.toFixed(2)} <span style={{ color: 'var(--admin-primary)', fontSize: '1.5rem' }}>₾</span></>} 
              percentage={tipsPercent} 
              subtext="+15% к вчера" 
              color="#06b6d4" 
            />
            <MetricCard 
              title="Время доставки" 
              value="12 мин" 
              percentage={80} 
              subtext="Норматив: 10 мин" 
              color="#a855f7" 
            />
          </div>

          {/* Middle Row: Dynamics Chart & Wallet Balance */}
          <div className="dashboard-grid-middle">
            
            {/* Chart Column */}
            <div className="admin-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.3rem', margin: 0, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Динамика за неделю</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setChartMode('volume')}
                    style={{ 
                      padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                      background: chartMode === 'volume' ? 'var(--admin-primary)' : 'rgba(255,255,255,0.05)', 
                      color: chartMode === 'volume' ? '#000' : 'var(--admin-text-muted)', 
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >Количество</button>
                  <button 
                    onClick={() => setChartMode('value')}
                    style={{ 
                      padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                      background: chartMode === 'value' ? 'var(--admin-primary)' : 'rgba(255,255,255,0.05)', 
                      color: chartMode === 'value' ? '#000' : 'var(--admin-text-muted)', 
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >Сумма</button>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flex: 1, gap: '16px', paddingTop: '20px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--admin-card-border)', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '1px', background: 'var(--admin-card-border)', opacity: 0.5, zIndex: 0 }}></div>
                
                {growthPercentages.map((val, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1 }}>
                    <div className="chart-bar-container">
                      <div 
                        className="chart-bar"
                        style={{ 
                          height: `${Math.max(val || 0, 4)}%`, 
                        }}
                      >
                        <div className="chart-tooltip">
                          {chartMode === 'volume' ? `${weeklyData[idx].volume} шт.` : `${weeklyData[idx].value.toFixed(2)} ₾`}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', color: 'var(--admin-text-muted)', fontSize: '0.9rem', fontWeight: 700 }}>{daysLabels[idx]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet Balance Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Balance Card */}
              <div className="admin-card" style={{
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 180,
                marginBottom: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Баланс к выводу
                    </span>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      {balance.toFixed(2)} <span style={{ fontSize: '1.5rem', color: 'var(--admin-primary)' }}>₾</span>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 14,
                    padding: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--admin-primary)'
                  }}>
                    <Wallet size={24} />
                  </div>
                </div>

                <button
                  onClick={() => setShowWithdrawModal(true)}
                  style={{
                    background: 'var(--admin-primary)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 14,
                    padding: '14px 20px',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    width: '100%',
                    boxShadow: '0 4px 15px rgba(33, 234, 124, 0.2)',
                    marginTop: 20
                  }}
                >
                  Вывести средства <ArrowUpRight size={18} />
                </button>
              </div>

              {/* Weekly Income Breakdown Widget */}
              <div className="admin-card" style={{
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
                marginBottom: 0
              }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Доход за эту неделю
                  </span>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                    {(totalDeliveriesAmount + totalTips).toFixed(2)} <span style={{ color: 'var(--admin-primary)' }}>₾</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, marginTop: 16 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>За заказы</span>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                      {totalDeliveriesAmount.toFixed(2)} <span style={{ color: 'var(--admin-primary)' }}>₾</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: 16 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Чаевые</span>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                      {totalTips.toFixed(2)} <span style={{ color: 'var(--admin-primary)' }}>₾</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Row: History Table with Transaction/Orders toggle */}
          <div className="admin-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: 'none' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                {bottomTab === 'transactions' ? 'История транзакций' : 'История заказов'}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setBottomTab('transactions')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: bottomTab === 'transactions' ? 'var(--admin-primary)' : 'rgba(255,255,255,0.05)',
                    color: bottomTab === 'transactions' ? '#000' : 'var(--admin-text-muted)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Транзакции
                </button>
                <button
                  onClick={() => setBottomTab('orders')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: bottomTab === 'orders' ? 'var(--admin-primary)' : 'rgba(255,255,255,0.05)',
                    color: bottomTab === 'orders' ? '#000' : 'var(--admin-text-muted)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Заказы
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {bottomTab === 'transactions' ? (
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>ID</th>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Описание</th>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Сумма</th>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Статус</th>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>{tx.id}</td>
                        <td style={{ padding: '16px 20px', fontWeight: 600 }}>{tx.desc}</td>
                        <td style={{ padding: '16px 20px', fontWeight: 800, color: '#fff' }}>
                          <span style={{ color: tx.type === 'payout' ? '#ef4444' : '#21EA7C', marginRight: '4px' }}>
                            {tx.type === 'payout' ? '-' : '+'}
                          </span>
                          {tx.amount.toFixed(2)} <span style={{ color: 'var(--admin-primary)' }}>₾</span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span className={`status-badge-capsule ${tx.status === 'completed' ? 'ready' : tx.status === 'pending' ? 'pending' : 'cancelled'}`}>
                            {tx.status === 'completed' ? 'Успешно' : tx.status === 'pending' ? 'В обработке' : 'Отклонено'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--admin-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{tx.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>ID</th>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Ресторан</th>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Адрес доставки</th>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Оплата</th>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Статус</th>
                      <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--admin-text-muted)', background: 'transparent', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicOrders.map(o => {
                      const statusInfo = getStatusLabel(o.status);
                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '16px 20px', fontFamily: 'monospace', color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>#{o.id}</td>
                          <td style={{ padding: '16px 20px', fontWeight: 600 }}>{o.restaurantName}</td>
                          <td style={{ padding: '16px 20px', color: 'var(--admin-text-muted)', fontSize: '0.95rem' }}>{o.deliveryAddress}</td>
                          <td style={{ padding: '16px 20px', fontWeight: 800, color: '#fff' }}>
                            <span style={{ color: 'var(--admin-primary)', marginRight: '4px' }}>+</span>
                            {o.deliveryFee.toFixed(2)} <span style={{ color: 'var(--admin-primary)' }}>₾</span>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span className={`status-badge-capsule ${statusInfo.class}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right', color: 'var(--admin-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{formatSafeDate(o.createdAt)}</td>
                        </tr>
                      );
                    })}
                    {historicOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>Нет выполненных заказов</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Payout Withdrawal Dialog */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div
            onClick={() => setShowWithdrawModal(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
          
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 420,
            background: '#111614',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 28,
            padding: 28,
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxSizing: 'border-box'
          }}>
            <button
              onClick={() => setShowWithdrawModal(false)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: '50%',
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff'
              }}
            >
              <X size={16} />
            </button>

            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#fff' }}>Вывод средств</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
              Средства будут отправлены на вашу привязанную карту банка Bank of Georgia (**** 4321) в течение 10-15 минут.
            </p>

            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Сумма вывода (₾)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Доступно: ${balance.toFixed(2)}`}
                    required
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 16,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(balance.toString())}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(33, 234, 124, 0.1)',
                      border: 'none', borderRadius: 10,
                      padding: '6px 12px', color: '#21EA7C',
                      fontWeight: 800, fontSize: 12, cursor: 'pointer'
                    }}
                  >
                    Все
                  </button>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  background: '#21EA7C',
                  color: '#080c0a',
                  border: 'none',
                  borderRadius: 16,
                  padding: '16px',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: 'pointer',
                  marginTop: 10,
                  width: '100%'
                }}
              >
                Подтвердить перевод
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
