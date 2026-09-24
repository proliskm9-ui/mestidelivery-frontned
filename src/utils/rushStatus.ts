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

// One request per restaurant per 2 minutes, shared by every card / page that asks
const RUSH_TTL_MS = 2 * 60 * 1000;
const rushCache = new Map<string, { at: number; value: Promise<RushState | null> }>();

function fetchRush(restaurantId?: string | number | null): Promise<RushState | null> {
    const key = restaurantId ? String(restaurantId) : '';
    const hit = rushCache.get(key);
    if (hit && Date.now() - hit.at < RUSH_TTL_MS) return hit.value;
    const url = key
        ? `/api/bot/v1/rush-status?restaurant_id=${encodeURIComponent(key)}`
        : '/api/bot/v1/rush-status';
    const value = fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => (d && typeof d.is_rush === 'boolean' ? { isRush: d.is_rush, reason: d.reason || 'evening_rush' } : null))
        .catch(() => null);
    rushCache.set(key, { at: Date.now(), value });
    return value;
}

/** Rush status from /api/bot/v1/rush-status (optionally per restaurant). */
export function useRushStatus(restaurantId?: string | number | null): RushState {
    const [rush, setRush] = useState<RushState>(localRushState);

    useEffect(() => {
        let active = true;
        fetchRush(restaurantId).then((r) => { if (active && r) setRush(r); });
        return () => { active = false; };
    }, [restaurantId]);

    return rush;
}

export function rushTitle(rush: RushState, language: string, eta?: string): string {
    const time = eta || (language === 'en' ? '45–65 min' : language === 'ka' ? '45–65 წთ' : '45–65 мин');
    if (language === 'en') return rush.reason === 'manual_on' ? `High demand · Delivery ~${time}` : `Evening rush hour · ~${time}`;
    if (language === 'ka') return rush.reason === 'manual_on' ? `მაღალი მოთხოვნა · მიტანა ~${time}` : `საღამოს პიკის საათი · ~${time}`;
    return rush.reason === 'manual_on' ? `Высокий спрос · Доставка ~${time}` : `Вечерний час пик · ~${time}`;
}

export function rushDescription(language: string): string {
    if (language === 'en') return 'Kitchens and couriers in Mestia are busy right now. You can also schedule your order for a specific time.';
    if (language === 'ka') return 'რესტორნები და კურიერები დატვირთულია. შეგიძლიათ შეუკვეთოთ წინასწარ კონკრეტულ დროზე.';
    return 'В ресторанах Местии запара — кухни и курьеры загружены. Можно оформить заказ заранее ко времени.';
}
