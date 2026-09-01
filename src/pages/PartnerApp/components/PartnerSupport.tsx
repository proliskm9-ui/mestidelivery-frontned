import { useMemo, useState } from 'react';
import { ChevronDown, LifeBuoy, MessageCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../../translations/LanguageContext';

const SUPPORT_TG = 'https://t.me/MestigoSupport_Bot';

export function PartnerSupport({ role }: { role: 'courier' | 'restaurant' }) {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useLanguage();

  const faqs = useMemo(() => {
    if (role === 'courier') {
      return [
        { q: t('partnerApp.support.c_q1'), a: t('partnerApp.support.c_a1') },
        { q: t('partnerApp.support.c_q2'), a: t('partnerApp.support.c_a2') },
        { q: t('partnerApp.support.c_q3'), a: t('partnerApp.support.c_a3') },
      ];
    }
    return [
      { q: t('partnerApp.support.r_q1'), a: t('partnerApp.support.r_a1') },
      { q: t('partnerApp.support.r_q2'), a: t('partnerApp.support.r_a2') },
      { q: t('partnerApp.support.r_q3'), a: t('partnerApp.support.r_a3') },
    ];
  }, [role, t]);

  return (
    <div className="partner-page">
      <div className="partner-page-head">
        <div>
          <p className="partner-page-kicker">{t('partnerApp.support.kicker')}</p>
          <h1 className="partner-page-title">{t('partnerApp.support.title')}</h1>
          <p className="partner-page-sub">{t('partnerApp.support.sub')}</p>
        </div>
      </div>

      <a
        className="partner-support-hero"
        href={SUPPORT_TG}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="partner-support-hero__icon">
          <MessageCircle size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{t('partnerApp.support.hero_title')}</strong>
          <span>{t('partnerApp.support.hero_sub')}</span>
        </div>
        <ExternalLink size={16} />
      </a>

      <section className="partner-card">
        <div className="partner-card__head">
          <h3>
            <LifeBuoy size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            {t('partnerApp.support.faq_title')}
          </h3>
          <p>
            {role === 'courier'
              ? t('partnerApp.support.faq_sub_courier')
              : t('partnerApp.support.faq_sub_rest')}
          </p>
        </div>
        <div className="partner-faq">
          {faqs.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <button
                key={item.q}
                type="button"
                className={`partner-faq__item${isOpen ? ' is-open' : ''}`}
                onClick={() => setOpen(isOpen ? null : idx)}
              >
                <div className="partner-faq__q">
                  <span>{item.q}</span>
                  <ChevronDown size={16} />
                </div>
                {isOpen && <p className="partner-faq__a">{item.a}</p>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
