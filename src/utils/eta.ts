/**
 * Delivery time estimate: kitchen time of the restaurant + courier time for the zone,
 * with the server's rush flag (/api/bot/v1/rush-status) making kitchens slower.
 * One source for cards, restaurant page, cart, checkout and the order status.
 */
type Range = [number, number];

const BBQ_ID = 'rest-1785110335267403964';
const SUNSET_ID = 'rest-1785108442716453469';

/** Kitchen time, minutes: [normal, rush]. */
function prepRange(restaurantId?: string | null, name?: string | null, rush = false): Range {
    const id = String(restaurantId || '');
    const n = String(name || '').toLowerCase();
    if (id === BBQ_ID || n.includes('bbq')) return rush ? [15, 25] : [10, 15];
    if (id === SUNSET_ID || n.includes('sunset')) return rush ? [30, 40] : [20, 30];
    return rush ? [25, 35] : [15, 25];
}

/** Courier time from the restaurant to the customer's zone, minutes. */
function courierRange(zoneId?: string | null): Range {
    if (!zoneId || zoneId === 'center') return [7, 10];
    if (zoneId === 'airport') return [10, 15];
    if (zoneId === 'nearby_villages') return [20, 30];
    return [30, 45];
}

const floor5 = (m: number) => Math.max(5, Math.floor(m / 5) * 5);
const ceil5 = (m: number) => Math.ceil(m / 5) * 5;

export interface EtaInput {
    restaurantId?: string | null;
    restaurantName?: string | null;
    zoneId?: string | null;
    rush?: boolean;
}

/** Total minutes from placing the order to the door, rounded to 5. */
export function deliveryWindow({ restaurantId, restaurantName, zoneId, rush }: EtaInput): Range {
    const prep = prepRange(restaurantId, restaurantName, rush);
    const road = courierRange(zoneId);
    return [floor5(prep[0] + road[0]), ceil5(prep[1] + road[1])];
}

/** Remaining time rounded to 5 minutes for display: "15–20 мин", never "0–3". */
export function roundRange([a, b]: Range): Range {
    const lo = Math.max(5, Math.round(a / 5) * 5);
    return [lo, Math.max(lo + 5, Math.round(b / 5) * 5)];
}

export function minutesLabel([a, b]: Range, language: string): string {
    const unit = language === 'en' ? 'min' : language === 'ka' ? 'წთ' : 'мин';
    return `${a}–${b} ${unit}`;
}

export function deliveryLabel(input: EtaInput, language: string): string {
    return minutesLabel(deliveryWindow(input), language);
}

export type OrderStage = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered';

/**
 * Remaining minutes for a live order, from its stage and how long ago it was placed.
 * Returns null when there's nothing honest to say (delivered, unknown).
 */
export function remainingWindow(
    stage: OrderStage,
    createdAt: string | number | Date | null | undefined,
    input: EtaInput,
    now = Date.now(),
): Range | null {
    if (stage === 'delivered') return null;
    const prep = prepRange(input.restaurantId, input.restaurantName, input.rush);
    const road = courierRange(input.zoneId);
    if (stage === 'delivering') return road;
    if (stage === 'ready') return [road[0] + 2, road[1] + 3];

    const created = createdAt ? new Date(createdAt).getTime() : NaN;
    // Server clocks/timezones can disagree; ignore implausible ages
    const elapsed = Number.isFinite(created) ? (now - created) / 60000 : 0;
    const age = elapsed > 0 && elapsed < 180 ? elapsed : 0;

    const left: Range = [Math.max(0, prep[0] - age), Math.max(0, prep[1] - age)];
    // Once the kitchen is behind schedule, promise a short honest remainder, not zero
    const kitchen: Range = left[1] <= 0 ? [3, 7] : [Math.max(left[0], 3), Math.max(left[1], 5)];
    return [Math.round(kitchen[0] + road[0]), Math.round(kitchen[1] + road[1])];
}

/** "14:25" in Mestia time. */
export function clockAt(minutesFromNow: number, now = Date.now()): string {
    const d = new Date(now + minutesFromNow * 60000);
    try {
        return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
    } catch {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
}
