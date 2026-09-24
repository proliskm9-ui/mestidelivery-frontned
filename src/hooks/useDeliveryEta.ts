import { useLanguage } from '../translations/LanguageContext';
import { useDeliveryLocationOptional } from '../delivery/DeliveryLocationContext';
import { useRushStatus } from '../utils/rushStatus';
import { deliveryLabel } from '../utils/eta';

/**
 * "15–25 мин" for a restaurant: its kitchen time + courier time to the visitor's zone,
 * slower while the server reports rush. Shops keep their own admin text (fallback).
 */
export function useDeliveryEta(restaurantId?: string | null, restaurantName?: string | null, fallback?: string | null): string {
    const { language } = useLanguage();
    const loc = useDeliveryLocationOptional();
    const isRestaurant = String(restaurantId || '').startsWith('rest-');
    const rush = useRushStatus(isRestaurant ? restaurantId : null);
    if (!isRestaurant) return fallback || '';
    return deliveryLabel({ restaurantId, restaurantName, zoneId: loc?.zoneId, rush: rush.isRush }, language);
}
