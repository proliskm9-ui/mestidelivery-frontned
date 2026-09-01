import { useLanguage, type Language } from '../../../translations/LanguageContext';

const LANGS: { id: Language; flag: string; short: string }[] = [
  { id: 'ka', flag: '/Assets/GE.png', short: 'ქარ' },
  { id: 'ru', flag: '/Assets/RU.png', short: 'RU' },
  { id: 'en', flag: '/Assets/US.png', short: 'EN' },
];

export function PartnerLangPicker({ compact = false }: { compact?: boolean }) {
  const { t, language, setLanguage } = useLanguage();

  const pick = (lang: Language) => {
    localStorage.setItem('partner_lang_explicit', '1');
    setLanguage(lang);
  };

  const fullName = (id: Language) => {
    if (id === 'ka') return t('partnerApp.lang.ka');
    if (id === 'ru') return t('partnerApp.lang.ru');
    return t('partnerApp.lang.en');
  };

  return (
    <div className={`partner-lang-picker${compact ? ' is-compact' : ''}`}>
      {!compact && (
        <div className="partner-lang-picker__head">
          <strong>{t('partnerApp.lang.title')}</strong>
          <span>{t('partnerApp.lang.hint')}</span>
        </div>
      )}
      <div
        className="partner-lang-switch"
        role="radiogroup"
        aria-label={t('partnerApp.lang.title')}
      >
        {LANGS.map(({ id, flag, short }) => {
          const active = language === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={fullName(id)}
              title={fullName(id)}
              className={`partner-lang-switch__btn${active ? ' is-active' : ''}`}
              onClick={() => pick(id)}
            >
              <img className="partner-lang-switch__flag" src={flag} alt="" draggable={false} />
              <span className="partner-lang-switch__code">{short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
