import { useEffect, useState } from 'react';

export type RushState = { isRush: boolean; reason: string };

/** Evening rush in Mestia (Tbilisi time) — local fallback until the server answers. */
function localRushState(): RushState {
    let hour: number;
    try {
        hour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tbilisi', hour: 'numeric', hour12: false }).format(new Date()), 10);
    } catch {
        hour = (new Date().getUTCHours() + 4) % 24;
    }
    const isRush = hour >= 18 && hour < 22;
    return { isRush, reason: isRush ? 'evening_rush' : 'normal' };
}

/** Rush status from /api/bot/v1/rush-status (optionally per restaurant). */
export function useRushStatus(restaurantId?: string | number | null): RushState {
    const [rush, setRush] = useState<RushState>(localRushState);

    useEffect(() => {
        let active = true;
        const url = restaurantId
            ? `/api/bot/v1/rush-status?restaurant_id=${encodeURIComponent(String(restaurantId))}`
            : '/api/bot/v1/rush-status';
        fetch(url)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (active && d && typeof d.is_rush === 'boolean') {
                    setRush({ isRush: d.is_rush, reason: d.reason || 'evening_rush' });
                }
            })
            .catch(() => {});
        return () => { active = false; };
    }, [restaurantId]);

    return rush;
}

export function rushTitle(rush: RushState, language: string): string {
    if (language === 'en') return rush.reason === 'manual_on' ? 'High demand · Delivery ~45–65 min' : 'Evening rush hour · ~45–65 min';
    if (language === 'ka') return rush.reason === 'manual_on' ? 'მაღალი მოთხოვნა · მიტანა ~45–65 წთ' : 'საღამოს პიკის საათი · ~45–65 წთ';
    return rush.reason === 'manual_on' ? 'Высокий спрос · Доставка ~45–65 мин' : 'Вечерний час пик · ~45–65 мин';
}

export function rushDescription(language: string): string {
    if (language === 'en') return 'Kitchens and couriers in Mestia are busy right now. You can also schedule your order for a specific time.';
    if (language === 'ka') return 'რესტორნები და კურიერები დატვირთულია. შეგიძლიათ შეუკვეთოთ წინასწარ კონკრეტულ დროზე.';
    return 'В ресторанах Местии запара — кухни и курьеры загружены. Можно оформить заказ заранее ко времени.';
}
