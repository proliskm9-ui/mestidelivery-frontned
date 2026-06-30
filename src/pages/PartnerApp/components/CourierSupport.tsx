import { useState } from 'react';
import { MessageSquare, PhoneCall, HelpCircle, Send, AlertTriangle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export function CourierSupport() {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [sentStatus, setSentStatus] = useState(false);

  const faqs: FaqItem[] = [
    { q: 'Что делать, если клиент не отвечает на звонки?', a: 'Позвоните клиенту минимум 3 раза с интервалом в 2 минуты. Если клиент так и не вышел на связь, свяжитесь с диспетчером через кнопку быстрой связи ниже. Не отменяйте заказ самостоятельно!' },
    { q: 'Как изменить или привязать новую банковскую карту?', a: 'Для изменения реквизитов вывода обратитесь в офис поддержки или пришлите скан-копию заявления на изменение реквизитов в чат технической поддержки.' },
    { q: 'Что делать в случае повреждения заказа при транспортировке?', a: 'Сделайте фотографию поврежденного блюда/упаковки, не отдавайте заказ клиенту и немедленно напишите диспетчеру поддержки. Мы свяжемся с клиентом и рестораном, чтобы сделать перезаказ.' },
    { q: 'Каковы требования к термосумке?', a: 'Вы обязаны носить чистую термосумку MestiDelivery на протяжении всей смены. Сумка должна быть закрыта во время езды. Раз в неделю проводится фотоконтроль чистоты термосумки.' },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSentStatus(true);
    setMessage('');
    setTimeout(() => {
      setSentStatus(false);
    }, 4000);
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Служба поддержки</h1>
          <p className="admin-subtitle">Помощь на дорогах и технические вопросы</p>
        </div>
      </div>

      {/* Speed Dial Contacts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        {/* Call Dispatcher */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(33, 234, 124, 0.08) 0%, rgba(33, 234, 124, 0.01) 100%)',
          border: '1px solid rgba(33, 234, 124, 0.2)',
          borderRadius: 24,
          padding: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#21EA7C', textTransform: 'uppercase', letterSpacing: 1 }}>Диспетчер заказов</span>
            <h3 style={{ margin: '8px 0 4px', fontSize: 18, color: '#fff', fontWeight: 800 }}>Экстренная связь</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: 0 }}>Вопросы по активным заказам и клиентам</p>
          </div>
          <a
            href="tel:+995599000000"
            style={{
              width: 52, height: 52, borderRadius: 16,
              background: '#21EA7C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#080c0a', transition: 'transform 0.2s',
              boxShadow: '0 4px 15px rgba(33, 234, 124, 0.2)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <PhoneCall size={22} />
          </a>
        </div>

        {/* SOS Road Accident */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.01) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 24,
          padding: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1 }}>Происшествия</span>
            <h3 style={{ margin: '8px 0 4px', fontSize: 18, color: '#fff', fontWeight: 800 }}>Кнопка SOS</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: 0 }}>ДТП, поломка транспорта, проблемы на дороге</p>
          </div>
          <a
            href="tel:+995599111111"
            style={{
              width: 52, height: 52, borderRadius: 16,
              background: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', transition: 'transform 0.2s',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <AlertTriangle size={22} />
          </a>
        </div>
      </div>

      {/* Grid: Support Form & FAQ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
        
        {/* FAQ list */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={20} style={{ color: '#21EA7C' }} /> Частые вопросы (FAQ)
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    overflow: 'hidden',
                    transition: 'all 0.28s'
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      color: isOpen ? '#21EA7C' : 'var(--admin-text)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 16px 16px',
                      color: 'var(--admin-text-muted)',
                      fontSize: 12,
                      lineHeight: 1.6,
                      borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                      paddingTop: 12
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Text support form */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={20} style={{ color: '#21EA7C' }} /> Написать в поддержку
            </h2>
          </div>
          
          <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              Опишите техническую проблему, и наши администраторы ответят вам в течение нескольких минут.
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ваш вопрос или сообщение..."
              required
              rows={4}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.5
              }}
            />

            <button
              type="submit"
              style={{
                background: '#21EA7C',
                color: '#080c0a',
                border: 'none',
                borderRadius: 14,
                padding: '12px 20px',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              Отправить сообщение <Send size={15} />
            </button>

            {sentStatus && (
              <div style={{
                background: 'rgba(33, 234, 124, 0.1)',
                border: '1px solid rgba(33, 234, 124, 0.2)',
                color: '#21EA7C',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 12,
                textAlign: 'center',
                fontWeight: 700
              }}>
                Сообщение доставлено диспетчеру!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
