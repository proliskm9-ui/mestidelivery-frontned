import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../translations/LanguageContext';
import { languageFromPath, parseCustomerPath, SUPPORTED_LANGUAGES } from './paths';

const ORIGIN = 'https://mestidelivery.com';

const COPY: Record<string, { homeTitle: string; homeDesc: string; menuTitle: string; menuDesc: string }> = {
  ru: {
    homeTitle: 'MestiDelivery — Доставка еды в Местиа, Сванетия',
    homeDesc: 'Быстрая доставка еды из ресторанов Местиа, Сванетия. Заказывайте блюда грузинской и сванской кухни онлайн прямо к вашей двери.',
    menuTitle: 'Рестораны Местиа — Доставка еды | MestiDelivery',
    menuDesc: 'Выберите ресторан в Местиа и закажите доставку: BBQ Garden, Sunset, Luizastan, BURGERS и другие.',
  },
  en: {
    homeTitle: 'MestiDelivery — Food Delivery in Mestia, Svaneti, Georgia',
    homeDesc: 'Order food delivery from the best restaurants in Mestia, Svaneti. Fast delivery of Georgian and Svan cuisine straight to your door.',
    menuTitle: 'Restaurants in Mestia — Food Delivery | MestiDelivery',
    menuDesc: 'Choose a restaurant in Mestia and order delivery: BBQ Garden, Sunset, Luizastan, BURGERS and more.',
  },
  ka: {
    homeTitle: 'MestiDelivery — საკვების მიწოდება მესტიაში, სვანეთი',
    homeDesc: 'შეუკვეთეთ საკვები მესტიისა და სვანეთის საუკეთესო რესტორნებიდან. სწრაფი მიწოდება პირდაპირ თქვენს კართან.',
    menuTitle: 'მესტიის რესტორნები — მიწოდება | MestiDelivery',
    menuDesc: 'აირჩიეთ რესტორანი მესტიაში და შეუკვეთეთ მიწოდება.',
  },
};

function upsertMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    document.head.appendChild(el);
  }
  if (selector.startsWith('link')) {
    const link = el as HTMLLinkElement;
    const rel = selector.match(/rel="([^"]+)"/)?.[1];
    const hreflang = selector.match(/hreflang="([^"]+)"/)?.[1];
    if (rel) link.rel = rel;
    if (hreflang) link.setAttribute('hreflang', hreflang);
    link.setAttribute(attr, value);
  } else {
    const meta = el as HTMLMetaElement;
    const name = selector.match(/name="([^"]+)"/)?.[1];
    const prop = selector.match(/property="([^"]+)"/)?.[1];
    if (name) meta.setAttribute('name', name);
    if (prop) meta.setAttribute('property', prop);
    meta.setAttribute(attr, value);
  }
}

export default function SeoHead() {
  const { language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const parsed = parseCustomerPath(location.pathname);
    const lang = parsed.language || languageFromPath(location.pathname) || language;
    const copy = COPY[lang] || COPY.en;
    const pathWithoutLang = location.pathname.replace(/^\/(ru|en|ka)(?=\/|$)/, '') || '/';
    const canonical = `${ORIGIN}/${lang}${pathWithoutLang === '/' ? '' : pathWithoutLang}`;

    let title = copy.homeTitle;
    let description = copy.homeDesc;
    if (parsed.page === 'menu') {
      title = copy.menuTitle;
      description = copy.menuDesc;
    } else if (parsed.page === 'restaurant' && parsed.restaurantSlug) {
      const name = parsed.restaurantSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      title = `${name} — MestiDelivery`;
      description = copy.menuDesc;
    } else if (isLegalish(pathWithoutLang)) {
      title = `MestiDelivery`;
    }

    document.title = title;
    document.documentElement.lang = lang;
    upsertMeta('meta[name="description"]', 'content', description);
    upsertMeta('link[rel="canonical"]', 'href', canonical);
    upsertMeta('meta[property="og:title"]', 'content', title);
    upsertMeta('meta[property="og:description"]', 'content', description);
    upsertMeta('meta[property="og:url"]', 'content', canonical);
    upsertMeta('meta[property="og:locale"]', 'content', lang === 'ka' ? 'ka_GE' : lang === 'en' ? 'en_US' : 'ru_RU');

    SUPPORTED_LANGUAGES.forEach((alt) => {
      const href = `${ORIGIN}/${alt}${pathWithoutLang === '/' ? '' : pathWithoutLang}`;
      upsertMeta(`link[rel="alternate"][hreflang="${alt}"]`, 'href', href);
    });
    upsertMeta('link[rel="alternate"][hreflang="x-default"]', 'href', `${ORIGIN}/en${pathWithoutLang === '/' ? '' : pathWithoutLang}`);
  }, [language, location.pathname]);

  return null;
}

function isLegalish(path: string) {
  return /\/(legal|terms|privacy|returns|refunds|contact|support)\/?$/.test(path);
}
