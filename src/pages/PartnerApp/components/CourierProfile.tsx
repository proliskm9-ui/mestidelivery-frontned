import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Star, Bike, Car, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export function CourierProfile() {
  const { userName } = useStore();
  const [vehicle, setVehicle] = useState<'bike' | 'car' | 'moto'>('bike');
  const [phone, setPhone] = useState('+995 599 123 456');
  const [email, setEmail] = useState('jora.courier@mesti.ge');

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Мой профиль</h1>
          <p className="admin-subtitle">Персональная карточка курьера</p>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="admin-card" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: 24,
        padding: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
        marginBottom: 28
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #21EA7C)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 900, color: '#080c0a',
          boxShadow: '0 8px 24px rgba(33,234,124,0.2)',
          flexShrink: 0
        }}>
          {userName.slice(0, 1).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff' }}>{userName}</h2>
            <span style={{
              background: 'rgba(33, 234, 124, 0.1)', color: '#21EA7C',
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
              display: 'inline-flex', alignItems: 'center', gap: 4
            }}>
              <ShieldCheck size={12} /> Проверен
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>
              <Star size={16} fill="#f59e0b" /> 4.92 рейтинг
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
            <span style={{ color: 'var(--admin-text-muted)', fontSize: 13, fontWeight: 600 }}>
              156 доставок всего
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Vehicle Selector & Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        {/* Vehicle Selection Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Транспорт доставки</h2>
          </div>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
            Тип транспорта влияет на радиус заказов и расчетное время доставки.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { id: 'bike', label: 'Велосипед', Icon: Bike },
              { id: 'car', label: 'Машина', Icon: Car },
              { id: 'moto', label: 'Мопед', Icon: Bike }, // reusing Bike icon visually or can change labels
            ].map((v) => {
              const active = vehicle === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setVehicle(v.id as any)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 10px',
                    borderRadius: 16,
                    background: active ? 'rgba(33, 234, 124, 0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? '#21EA7C' : 'rgba(255,255,255,0.05)'}`,
                    color: active ? '#21EA7C' : 'var(--admin-text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <v.Icon size={24} />
                  <span style={{ fontSize: 11, fontWeight: 800 }}>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contacts details */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Контакты курьера</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Телефон</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Verification & Documents Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Документы курьера</h2>
        </div>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
          Ниже приведен список документов, необходимых для работы на платформе MestiDelivery.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { name: 'Паспорт / ID-карта', status: 'verified', details: 'Срок действия: до 2031 г.' },
            { name: 'Водительское удостоверение', status: 'verified', details: 'Категория B, C' },
            { name: 'Справка о несудимости', status: 'verified', details: 'Обновлено 3 месяца назад' },
            { name: 'Регистрация ТС', status: 'optional', details: 'Не требуется для велосипеда' }
          ].map((doc, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <FileText size={18} style={{ color: 'var(--admin-text-muted)' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: 14 }}>{doc.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>{doc.details}</div>
                </div>
              </div>

              <div>
                {doc.status === 'verified' ? (
                  <span style={{ color: '#21EA7C', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={14} /> Подтвержден
                  </span>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}>
                    Не применимо
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
