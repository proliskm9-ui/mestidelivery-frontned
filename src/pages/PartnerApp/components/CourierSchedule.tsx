import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Calendar, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Shift {
  id: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  zone: string;
  status: 'booked' | 'available' | 'active';
  demand: 'high' | 'medium' | 'normal';
}

export function CourierSchedule() {
  const { userName } = useStore();
  const [shifts, setShifts] = useState<Shift[]>([
    { id: 'SH-1', date: 'Сегодня, 21 июня', timeStart: '18:00', timeEnd: '22:00', zone: 'Сабуртало / Ваке', status: 'booked', demand: 'high' },
    { id: 'SH-2', date: 'Завтра, 22 июня', timeStart: '09:00', timeEnd: '15:00', zone: 'Старый город', status: 'booked', demand: 'medium' },
    { id: 'SH-3', date: 'Завтра, 22 июня', timeStart: '16:00', timeEnd: '21:00', zone: 'Сабуртало', status: 'available', demand: 'high' },
    { id: 'SH-4', date: 'Вт, 23 июня', timeStart: '12:00', timeEnd: '18:00', zone: 'Дидубе / Глдани', status: 'available', demand: 'normal' },
    { id: 'SH-5', date: 'Вт, 23 июня', timeStart: '18:00', timeEnd: '23:00', zone: 'Сабуртало / Ваке', status: 'available', demand: 'high' },
  ]);

  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  const toggleShiftBook = (id: string) => {
    setShifts(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: s.status === 'booked' ? 'available' : 'booked'
        };
      }
      return s;
    }));
  };

  const startShift = (shift: Shift) => {
    setActiveShift({ ...shift, status: 'active' });
    setShifts(prev => prev.map(s => s.id === shift.id ? { ...s, status: 'active' } : s));
  };

  const endShift = () => {
    if (!activeShift) return;
    const originalId = activeShift.id;
    setActiveShift(null);
    setShifts(prev => prev.map(s => s.id === originalId ? { ...s, status: 'booked' } : s));
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Смены</h1>
          <p className="admin-subtitle">График и зоны работы · {userName}</p>
        </div>
      </div>

      {/* Active Shift Card */}
      {activeShift ? (
        <div style={{
          background: 'linear-gradient(135deg, #162a20 0%, #0d1612 100%)',
          borderRadius: 24,
          padding: 24,
          border: '2.5px solid #21EA7C',
          marginBottom: 28,
          boxShadow: '0 8px 32px rgba(33, 234, 124, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <span style={{
                background: 'rgba(33, 234, 124, 0.1)', color: '#21EA7C',
                padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: 0.5
              }}>
                ● Активная смена
              </span>
              <h2 style={{ color: '#fff', fontSize: 22, margin: '12px 0 6px' }}>{activeShift.timeStart} — {activeShift.timeEnd}</h2>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>{activeShift.date}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#21EA7C', fontWeight: 700, fontSize: 14 }}>
                <MapPin size={16} /> {activeShift.zone}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            <button
              onClick={endShift}
              style={{
                flex: 1,
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                padding: '14px 20px',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Завершить смену
            </button>
          </div>
        </div>
      ) : (
        shifts.some(s => s.status === 'booked' && s.date.includes('Сегодня')) && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 24,
            padding: 24,
            marginBottom: 28,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontWeight: 800, fontSize: 14 }}>
                <AlertCircle size={18} /> У вас есть запланированная смена сегодня!
              </div>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: '6px 0 0' }}>
                Смена начнется в {shifts.find(s => s.status === 'booked' && s.date.includes('Сегодня'))?.timeStart}. Выйдите на смену вовремя, чтобы получать заказы.
              </p>
            </div>
            <button
              onClick={() => {
                const shift = shifts.find(s => s.status === 'booked' && s.date.includes('Сегодня'));
                if (shift) startShift(shift);
              }}
              style={{
                background: '#21EA7C',
                color: '#080c0a',
                border: 'none',
                borderRadius: 14,
                padding: '12px 20px',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(33,234,124,0.15)'
              }}
            >
              Выйти на смену 🚀
            </button>
          </div>
        )
      )}

      {/* Week overview */}
      <div className="admin-card" style={{ marginBottom: 28 }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Ваше расписание</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shifts.map((shift) => (
            <div
              key={shift.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: 18,
                background: shift.status === 'active' ? 'rgba(33, 234, 124, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${shift.status === 'active' ? '#21EA7C' : 'rgba(255, 255, 255, 0.04)'}`
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Calendar size={18} style={{ color: 'var(--admin-text-muted)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: 15 }}>
                      {shift.timeStart} — {shift.timeEnd}
                    </span>
                    {shift.demand === 'high' && (
                      <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6 }}>
                        Высокий спрос 🔥
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                    <span>{shift.date}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><MapPin size={12} /> {shift.zone}</span>
                  </div>
                </div>
              </div>

              <div>
                {shift.status === 'active' ? (
                  <span style={{ color: '#21EA7C', fontWeight: 800, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={16} /> На смене
                  </span>
                ) : (
                  <button
                    onClick={() => toggleShiftBook(shift.id)}
                    style={{
                      background: shift.status === 'booked' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                      color: shift.status === 'booked' ? '#ef4444' : 'var(--admin-text)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 12,
                      padding: '10px 16px',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {shift.status === 'booked' ? 'Отменить бронь' : 'Забронировать'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available zones card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Регионы работы</h2>
        </div>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>
          Вы можете бронировать смены в любом районе города. Убедитесь, что вы находитесь внутри выбранной зоны на момент начала смены.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'Сабуртало / Ваке', desc: 'Центральный район, высокая плотность заказов', multiplier: '1.2x' },
            { name: 'Старый город', desc: 'Пешеходные зоны, туристическая зона', multiplier: '1.3x' },
            { name: 'Дидубе / Глдани', desc: 'Спальные районы, стабильный спрос', multiplier: '1.0x' },
          ].map((zone, idx) => (
            <div key={idx} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.03)'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 13 }}>{zone.name}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>{zone.desc}</div>
              </div>
              <span style={{
                background: 'rgba(33, 234, 124, 0.1)', color: '#21EA7C',
                padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800
              }}>
                Коэфф: {zone.multiplier}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
