/** Courier-facing address locale: EN for ru/en UI, KA for Georgian. Mirrors bot.py. */

type Loc = 'en' | 'ka';

type Rule = {
  re: RegExp;
  forms: { en: string; ka: string };
};

const RULES: Rule[] = [
  {
    re: /пл(?:ощад[ьи])?\.?\s*сети|площадь\s+сети|seti\s+square|seti\s+sq\.?/gi,
    forms: { en: 'Seti Square', ka: 'სეტის მოედანი' },
  },
  {
    re: /(\d+)[\-\s]*й?\s*переулок\s+сети|seti\s+(\d+)(?:st|nd|rd|th)?\s*(?:lane|alley|side\s*street)/gi,
    forms: { en: 'Seti {n} Lane', ka: 'სეტის მე-{n} შესახვევი' },
  },
  {
    re: /переулок\s+сети|seti\s+(?:lane|alley)/gi,
    forms: { en: 'Seti Lane', ka: 'სეტის შესახვევი' },
  },
  {
    re: /ул\.?\s*тамар[аы]\s*мепе|тамар[аы]\s*мепе|tamar(?:a)?\s*mepe|queen\s+tamar(?:a)?(?:\s+st(?:reet)?)?/gi,
    forms: { en: 'Tamar Mepe St', ka: 'თამარ მეფის ქუჩა' },
  },
  {
    re: /ул\.?\s*витт?орио\s*селл[аы]|витт?орио\s*селл[аы]|vittorio\s*sella/gi,
    forms: { en: 'Vittorio Sella St', ka: 'ვიტორიო სელას ქუჩა' },
  },
  {
    re: /ул\.?\s*кахиани|кахиани|kakhiani/gi,
    forms: { en: 'Kakhiani St', ka: 'კახიანის ქუჩა' },
  },
  {
    re: /ул\.?\s*лестничн\w*|лестничн\w*\s*ул\.?|ladder\s*st/gi,
    forms: { en: 'Ladder St', ka: 'კიბეების ქუჩა' },
  },
  {
    re: /\bместия\b|\bmestia\b|\bმესტია\b/gi,
    forms: { en: 'Mestia', ka: 'მესტია' },
  },
  {
    re: /(?<![\p{L}\p{N}])эт\.?\s*(\d+)|(?<![\p{L}\p{N}])этаж\s*(\d+)|\bfloor\s*(\d+)|\bfl\.?\s*(\d+)|სართ\.?\s*(\d+)/giu,
    forms: { en: 'fl. {n}', ka: 'სართ. {n}' },
  },
  {
    re: /(?<![\p{L}\p{N}])кв\.?\s*(\d+)|(?<![\p{L}\p{N}])квартира\s*(\d+)|\bapt\.?\s*(\d+)|\bapartment\s*(\d+)|ბინა\s*(\d+)/giu,
    forms: { en: 'apt {n}', ka: 'ბინა {n}' },
  },
  {
    re: /(?<![\p{L}\p{N}])подъезд\s*(\d+)|\bentrance\s*(\d+)|სადარბაზო\s*(\d+)/giu,
    forms: { en: 'entrance {n}', ka: 'სადარბაზო {n}' },
  },
  {
    re: /(?<![\p{L}\p{N}])д\.?\s*(\d+)\b|(?<![\p{L}\p{N}])дом\s*(\d+)|\bhouse\s*(\d+)/giu,
    forms: { en: '{n}', ka: '{n}' },
  },
  {
    re: /(?<![\p{L}\p{N}])пер\.?\s*/giu,
    forms: { en: 'Lane ', ka: 'შესახვევი ' },
  },
  {
    re: /переулок/gi,
    forms: { en: 'Lane', ka: 'შესახვევი' },
  },
  {
    re: /(?<![\p{L}\p{N}])пр(?:оспект)?\.?\s+|(?<![\p{L}\p{N}])пр-т\.?\s*/giu,
    forms: { en: 'Ave ', ka: 'გამზირი ' },
  },
  {
    re: /(?<![\p{L}\p{N}])ул\.?\s*/giu,
    forms: { en: '', ka: '' },
  },
  {
    re: /улица/gi,
    forms: { en: 'St', ka: 'ქუჩა' },
  },
];

const TOKENS: Rule[] = [
  { re: /набережн\w*/giu, forms: { en: 'embankment', ka: 'სანაპირო' } },
  { re: /шоссе/giu, forms: { en: 'highway', ka: 'გზატკეცილი' } },
  { re: /площад[ьи]/giu, forms: { en: 'square', ka: 'მოედანი' } },
  { re: /центр/giu, forms: { en: 'center', ka: 'ცენტრი' } },
];

function localeKey(lang: string): Loc {
  return (lang || '').toLowerCase().startsWith('ka') ? 'ka' : 'en';
}

function applyRule(text: string, rule: Rule, loc: Loc): string {
  return text.replace(rule.re, (...args) => {
    const groups = args.slice(1, -2) as Array<string | undefined>;
    const tpl = rule.forms[loc] || rule.forms.en;
    if (tpl.includes('{n}')) {
      const n = groups.find((g) => g != null && g !== '') || '';
      return tpl.replace('{n}', n);
    }
    return tpl;
  });
}

/** Address for couriers: English (ru/en UI) or Georgian (ka). Never keep Russian street labels. */
export function localizeAddressForCourier(address: string, lang: string = 'en'): string {
  let text = (address || '').trim();
  if (!text || text === '—') return text || '—';

  const loc = localeKey(lang);
  let out = text;
  for (const rule of RULES) out = applyRule(out, rule, loc);
  for (const rule of TOKENS) out = applyRule(out, rule, loc);

  out = out.replace(/\s{2,}/g, ' ');
  out = out.replace(/\s*,\s*,+/g, ', ');
  out = out.replace(/^\s*,\s*|\s*,\s*$/g, '');
  return out.trim() || text;
}
