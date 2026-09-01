import { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Wifi,
} from 'lucide-react';
import { useLanguage } from '../../../translations/LanguageContext';

const STEP_ICONS = [Wifi, ShoppingBag, Package, MapPin] as const;

export function CourierGuide() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useLanguage();

  const steps = useMemo(
    () =>
      STEP_ICONS.map((Icon, i) => {
        const n = i + 1;
        return {
          title: t(`partnerApp.guide.step${n}_title`),
          text: t(`partnerApp.guide.step${n}_text`),
          Icon,
        };
      }),
    [t],
  );

  const faqs = useMemo(
    () =>
      [1, 2, 3, 4].map((n) => ({
        q: t(`partnerApp.guide.faq${n}_q`),
        a: t(`partnerApp.guide.faq${n}_a`),
      })),
    [t],
  );

  return (
    <div className="partner-page">
      <div className="partner-page-head">
        <div>
          <p className="partner-page-kicker">{t('partnerApp.guide.kicker')}</p>
          <h1 className="partner-page-title">{t('partnerApp.guide.title')}</h1>
          <p className="partner-page-sub">{t('partnerApp.guide.sub')}</p>
        </div>
      </div>

      <section className="partner-card partner-card--accent">
        <div className="partner-card__head">
          <h3>
            <BookOpen size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
            {t('partnerApp.guide.route_title')}
          </h3>
          <p>{t('partnerApp.guide.route_sub')}</p>
        </div>
        <ol className="partner-step-list">
          {steps.map(({ title, text, Icon }, i) => (
            <li key={title}>
              <div className="partner-step-list__num">{i + 1}</div>
              <div className="partner-step-list__icon"><Icon size={16} /></div>
              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="partner-card">
        <div className="partner-card__head">
          <h3>{t('partnerApp.guide.faq_title')}</h3>
          <p>{t('partnerApp.guide.faq_sub')}</p>
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

      <a
        className="partner-btn-primary"
        href="https://t.me/MestigoSupport_Bot"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none' }}
      >
        <Phone size={16} /> {t('partnerApp.guide.support_cta')}
      </a>

      <p className="partner-page-sub" style={{ textAlign: 'center', marginTop: 12 }}>
        <CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
        {t('partnerApp.guide.footer')}
      </p>
    </div>
  );
}
