import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Wallet, TrendingUp, ArrowUpRight, CheckCircle2, Clock, DollarSign, X } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'delivery' | 'tips' | 'payout';
  status: 'completed' | 'pending' | 'failed';
  desc: string;
}

export function CourierFinance() {
  const { userName, courierEarnings } = useStore();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payouts, setPayouts] = useState<Transaction[]>([
    { id: 'TX-9841', date: '21.06.2026, 14:32', amount: 45.00, type: 'payout', status: 'pending', desc: 'Вывод на карту **** 4321' },
    { id: 'TX-9721', date: '20.06.2026, 19:15', amount: 15.50, type: 'delivery', status: 'completed', desc: 'Доставка заказа #2847' },
    { id: 'TX-9654', date: '20.06.2026, 17:40', amount: 5.00, type: 'tips', status: 'completed', desc: 'Чаевые от клиента (заказ #2847)' },
    { id: 'TX-9510', date: '19.06.2026, 12:00', amount: 120.00, type: 'payout', status: 'completed', desc: 'Вывод на карту **** 4321' },
    { id: 'TX-9488', date: '18.06.2026, 21:05', amount: 22.00, type: 'delivery', status: 'completed', desc: 'Доставка заказа #2812' },
    { id: 'TX-9411', date: '18.06.2026, 18:30', amount: 18.00, type: 'delivery', status: 'completed', desc: 'Доставка заказа #2799' }
  ]);

  const [balance, setBalance] = useState(138.50);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > balance) {
      alert('Недостаточно средств или неверная сумма');
      return;
    }

    // Add to pending transactions
    const newTx: Transaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleString('ru').slice(0, 17),
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

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Финансы</h1>
          <p className="admin-subtitle">Кошелек курьера · {userName}</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        {/* Wallet Balance Card */}
        <div style={{
          background: 'linear-gradient(135deg, #162a20 0%, #0d1612 100%)',
          borderRadius: 24,
          padding: 28,
          border: '1px solid rgba(33, 234, 124, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 180,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute', top: -50, right: -50,
            width: 150, height: 150, borderRadius: '50%',
            background: '#21EA7C', filter: 'blur(80px)', opacity: 0.15,
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Баланс к выводу
              </span>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                {balance.toFixed(2)} <span style={{ fontSize: 20, color: '#21EA7C' }}>₾</span>
              </div>
            </div>
            <div style={{
              background: 'rgba(33, 234, 124, 0.1)',
              borderRadius: 14,
              padding: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={24} style={{ color: '#21EA7C' }} />
            </div>
          </div>

          <button
            onClick={() => setShowWithdrawModal(true)}
            style={{
              background: '#21EA7C',
              color: '#080c0a',
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
              boxShadow: '0 4px 15px rgba(33, 234, 124, 0.2)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Вывести средства <ArrowUpRight size={18} />
          </button>
        </div>

        {/* Analytics Card */}
        <div className="stat-card" style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 24,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 180
        }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Доход за эту неделю
            </span>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--admin-text)', marginTop: 4 }}>
              {(balance + payouts.filter(tx => tx.type !== 'payout').reduce((acc, tx) => acc + tx.amount, 0)).toFixed(2)} ₾
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>За заказы</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--admin-text)', marginTop: 2 }}>
                {payouts.filter(tx => tx.type === 'delivery').reduce((acc, tx) => acc + tx.amount, 0).toFixed(2)} ₾
              </div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Чаевые</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#21EA7C', marginTop: 2 }}>
                {(courierEarnings + payouts.filter(tx => tx.type === 'tips').reduce((acc, tx) => acc + tx.amount, 0)).toFixed(2)} ₾
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Mini Chart / Weekday representation */}
      <div className="admin-card" style={{ marginBottom: 28 }}>
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} style={{ color: '#21EA7C' }} /> Активность доходов по дням
          </h2>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase' }}>Текущая неделя</span>
        </div>
        
        {/* Bars */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 20, paddingBottom: 10 }}>
          {[
            { day: 'Пн', amount: 15.50, height: '35%' },
            { day: 'Вт', amount: 22.00, height: '50%' },
            { day: 'Ср', amount: 0, height: '5%' },
            { day: 'Чт', amount: 35.00, height: '80%' },
            { day: 'Пт', amount: 48.00, height: '100%' },
            { day: 'Сб', amount: 18.00, height: '40%' },
            { day: 'Вс', amount: 12.00, height: '28%' }
          ].map((bar, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{bar.amount > 0 ? `${bar.amount}₾` : '-'}</span>
              <div style={{
                width: 14,
                height: 60,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: bar.height,
                  background: bar.amount > 30 ? 'linear-gradient(to top, #10b981, #21EA7C)' : 'rgba(33, 234, 124, 0.4)',
                  borderRadius: 4,
                  transition: 'height 0.8s ease-out'
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)' }}>{bar.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">История транзакций</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payouts.map((tx) => (
            <div
              key={tx.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)'
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: tx.type === 'payout' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(33, 234, 124, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {tx.type === 'payout' ? (
                    <ArrowUpRight size={18} style={{ color: '#ef4444' }} />
                  ) : (
                    <DollarSign size={18} style={{ color: '#21EA7C' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 14 }}>{tx.desc}</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>{tx.date} · {tx.id}</div>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: tx.type === 'payout' ? '#ef4444' : '#21EA7C'
                }}>
                  {tx.type === 'payout' ? '-' : '+'}{tx.amount.toFixed(2)} ₾
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: tx.status === 'completed' ? '#21EA7C' : tx.status === 'pending' ? '#f59e0b' : '#ef4444'
                }}>
                  {tx.status === 'completed' ? (
                    <><CheckCircle2 size={12} /> Успешно</>
                  ) : tx.status === 'pending' ? (
                    <><Clock size={12} /> В обработке</>
                  ) : (
                    <>Отклонено</>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Withdrawal Dialog */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setShowWithdrawModal(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
          
          {/* Modal Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 420,
            background: '#111614',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 28,
            padding: 28,
            boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
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

      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
