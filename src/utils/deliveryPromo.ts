/**
 * Delivery-zone detection by address text and the first-order delivery promo.
 * Ported 1:1 from the hand-patched production bundles (Checkout / CheckoutPage).
 */

const CENTER_RE = /сети|seti|სეტი|центр|center|ცენტრი|руставели|rustaveli|რუსთაველ|тамар|tamar|თამარ|габлиани|gabliani|გაბლიან|кахиани|kakhiani|კახიან|зулиаги|zuliagi|ზულიაგ|ланчвали|lanchvali|ლანჩვალ|лехтаги|lekhtagi|ლეხთაგ|сетия|სეტია/i;
const AIRPORT_RE = /аэропорт|airport|აეროპორტ/i;
const VILLAGES_RE = /ленджери|lenjeri|ლენჯერ|латали|latali|ლატალ|ушгули|ushguli|უშგულ|хешкили|heshkili|ჰეშქილ|мазери|mazeri|მაზერ|бечо|becho|ბეჩო|хацвали|hatsvali|khatsvali|ჰაწვალ|иели|ieli|იელ|цвирми|tsvirmi|წვირმ|кала|kala|კალ/i;

export type TextZone = 'center' | 'airport' | 'nearby_villages';

/** Zone from free-text address. `airportFirst` mirrors the order used by the price calculation. */
export function detectZoneFromText(text: string, airportFirst = false): TextZone | null {
    const t = (text || '').toLowerCase();
    if (airportFirst && AIRPORT_RE.test(t)) return 'airport';
    if (CENTER_RE.test(t)) return 'center';
    if (!airportFirst && AIRPORT_RE.test(t)) return 'airport';
    if (VILLAGES_RE.test(t)) return 'nearby_villages';
    return null;
}

export function addressText(a: { street?: string; landmark?: string; hotelName?: string; comment?: string } | null | undefined, withComment = true): string {
    if (!a) return '';
    return `${a.street || ''} ${a.landmark || ''} ${a.hotelName || ''}${withComment ? ` ${a.comment || ''}` : ''}`;
}

/** Device has placed an order before (set on proceeding to payment). */
export function deviceHasOrdered(): boolean {
    return localStorage.getItem('mesti_device_has_ordered') === '1' || localStorage.getItem('has_placed_order') === '1';
}

export function markDeviceOrdered(): void {
    localStorage.setItem('mesti_device_has_ordered', '1');
    localStorage.setItem('has_placed_order', '1');
}

/** Account has completed orders (orders_count is set elsewhere). */
export function accountHasOrders(): boolean {
    const count = localStorage.getItem('orders_count');
    return Boolean(count && count !== '0');
}
