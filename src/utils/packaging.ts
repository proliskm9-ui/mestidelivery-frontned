import { restaurantCache } from '../services/api';

/**
 * Restaurant packaging fee (currently Sunset only).
 *
 * The rules live in /static/sunset-packaging-helper.js (server-managed), which also
 * adds the fee to the order total at submit time. We read the same rules here so the
 * client shows the fee and the total the order is actually created with. Once our
 * total already includes the fee, the helper's submit hook leaves it untouched.
 */
export function getPackagingFee(cartItems: { product: any; quantity: number }[] | null | undefined): number {
    const helper = (window as any).__MestiSunset;
    if (!helper || !cartItems?.length) return 0;
    const restaurantId = cartItems[0]?.product?.restaurant_id || '';
    const restaurantName = restaurantCache[`rest_${restaurantId}`]?.name || '';
    try {
        if (!helper.isSunsetRestaurant(restaurantId, restaurantName)) return 0;
        const fee = Number(helper.calculatePackagingFee(cartItems));
        return Number.isFinite(fee) && fee > 0 ? fee : 0;
    } catch {
        return 0;
    }
}
