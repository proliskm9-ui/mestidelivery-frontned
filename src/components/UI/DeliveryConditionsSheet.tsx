import React from 'react';
import Sheet from './Sheet';
import { useLanguage } from '../../translations/LanguageContext';

interface DeliveryConditionsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Detected zone of the user's address, if known. */
    zoneId?: string | null;
    /** Fee the user pays right now (after the first-order promo). */
    fee: number;
    /** Fee before the promo. */
    baseFee: number;
    eta: string;
    /** New client (device + account have no orders): first-order promo applies. */
    promoEligible: boolean;
}

const ZONES = [
    { id: 'center', key: 'delivery.zone_center', price: 8, eta: '20–30' },
    { id: 'airport', key: 'delivery.zone_airport', price: 12, eta: '25–35' },
    { id: 'nearby_villages', key: 'delivery.zone_villages', price: 20, eta: '35–50' },
];

/** "Delivery terms": zone prices, service fee, weight limit. Plain list, nothing else. */
const DeliveryConditionsSheet: React.FC<DeliveryConditionsSheetProps> = ({ open, onOpenChange, zoneId, promoEligible }) => {
    const { t } = useLanguage();
    const min = t('common.min');

    return (
        <Sheet open={open} onOpenChange={onOpenChange} title={t('delivery.conditions_title')}>
            <div className="ds-stack">
                <ul className="ds-list">
                    {ZONES.map((z) => (
                        <li key={z.id} className="ds-row">
                            <span className="ds-row-main">
                                <span className="ds-row-title">{t(z.key)}</span>
                                <span className="ds-row-sub">
                                    {z.eta} {min}{z.id === zoneId ? ` · ${t('delivery.you_are_here')}` : ''}
                                </span>
                            </span>
                            <span className="ds-row-text">{z.price} ₾</span>
                        </li>
                    ))}
                    <li className="ds-row">
                        <span className="ds-row-main">
                            <span className="ds-row-title">{t('delivery.service_fee')}</span>
                            <span className="ds-row-sub">{t('delivery.service_fee_hint')}</span>
                        </span>
                        <span className="ds-row-text">0.99–2.00 ₾</span>
                    </li>
                    <li className="ds-row">
                        <span className="ds-row-label">{t('delivery.max_weight')}</span>
                        <span className="ds-row-text">45 {t('delivery.kg')}</span>
                    </li>
                </ul>
                {promoEligible && (
                    <p className="ds-caption"><b>{t('delivery.promo_title')}</b> — {t('delivery.promo_desc')}</p>
                )}
            </div>
        </Sheet>
    );
};

export default DeliveryConditionsSheet;
