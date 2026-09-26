/**
 * A promo code the customer picked in Profile → Promo codes.
 * Checkout starts with it pre-filled; it is cleared once an order is created.
 */
const KEY = 'mesti_pending_promo';

export function getPendingPromo(): string {
    try {
        return localStorage.getItem(KEY) || '';
    } catch {
        return '';
    }
}

export function setPendingPromo(code: string): void {
    try {
        if (code) localStorage.setItem(KEY, code);
        else localStorage.removeItem(KEY);
    } catch {
        /* storage unavailable: the code just is not remembered */
    }
}
