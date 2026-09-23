import type { Language } from '../translations';

/** Short cuisine line per restaurant (prod copy, localized). null when there is nothing specific to say. */
export function cuisineLine(name: string | undefined | null, language: Language | string): string | null {
    const n = String(name || '').toLowerCase();
    const pick = (en: string, ka: string, ru: string) => (language === 'en' ? en : language === 'ka' ? ka : ru);
    if (n.includes('sunset')) return pick('European & Georgian cuisine • Breakfasts', 'ევროპული და ქართული სამზარეულო • საუზმე', 'Европейская и грузинская кухня • Завтраки');
    if (n.includes('burger')) return pick('Craft Burgers • Fries & Snacks • Street Food', 'ბურგერები • ფრი & წასახემსებლები', 'Крафтовые бургеры • Закуски фри • Стритфуд');
    if (n.includes('bbq')) return pick('BBQ & Grill • Kebabs • Caucasian cuisine', 'მწვადი და გრილი • კავკასიური სამზარეულო', 'Мангал & Гриль • Шашлык • Кавказская кухня');
    if (n.includes('luizastan')) return pick('Authentic Svan & Georgian cuisine', 'ტრადიციული სვანური და ქართული სამზარეულო', 'Традиционная сванская и грузинская кухня');
    return null;
}
