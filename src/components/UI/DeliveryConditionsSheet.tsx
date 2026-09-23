import React from 'react';
import Sheet from './Sheet';
import { useLanguage } from '../../translations/LanguageContext';
import './DeliveryConditionsSheet.css';

interface DeliveryConditionsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Detected zone of the user's address, if known. */
    zoneId?: string | null;
    /** Fee the user pays right now (after the first-order promo). */
    fee: number;
    /** Fee before the promo, to show what was saved. */
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

const CourierIcon = () => (
    <img src="/Assets/иконка_человек_2 пнг 32.png" alt="" aria-hidden="true" width={26} height={26} />
);

/** "Delivery conditions" sheet opened from the cart/restaurant bottom panel. */
const DeliveryConditionsSheet: React.FC<DeliveryConditionsSheetProps> = ({
    open,
    onOpenChange,
    zoneId,
    fee,
    baseFee,
    eta,
    promoEligible,
}) => {
    const { t } = useLanguage();
    const min = t('common.min');
    const zone = ZONES.find((z) => z.id === zoneId) || null;
    const saved = Math.max(0, baseFee - fee);

    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={t('delivery.conditions_title')}
            description={t('delivery.courier_service')}
        >
            <div className="ds-stack">
                <section className="dc-hero">
                    <span className="dc-hero-icon"><CourierIcon /></span>
                    <div className="dc-hero-text">
                        <span className="dc-hero-caption">
                            {zone ? `${t('delivery.your_zone')} · ${t(zone.key)}` : t('delivery.fee_label')}
                        </span>
                        <span className="dc-hero-price">
                            {fee === 0 ? t('delivery.free') : `${Math.round(fee)} ₾`}
                            {saved > 0 && <s className="dc-hero-old">{Math.round(baseFee)} ₾</s>}
                        </span>
                    </div>
                    <span className="dc-hero-eta">{eta}</span>
                </section>

                {promoEligible && (
                    <p className="ds-note">
                        <b>{t('delivery.promo_title')}</b>
                        {t('delivery.promo_desc')}
                    </p>
                )}

                <p className="ds-label">{t('delivery.zones_title')}</p>
                <ul className="ds-card">
                    {ZONES.map((z) => {
                        const current = z.id === zone?.id;
                        return (
                            <li key={z.id} className="ds-row">
                                <span className="ds-row-main">
                                    <span className="ds-row-title">{t(z.key)}</span>
                                    <span className="ds-row-sub">{z.eta} {min}</span>
                                </span>
                                {current && <span className="ds-badge">{t('delivery.you_are_here')}</span>}
                                <span className="ds-row-value ds-row-value--accent">{z.price} ₾</span>
                            </li>
                        );
                    })}
                </ul>

                <p className="ds-label">{t('delivery.details_title')}</p>
                <ul className="ds-card">
                    <li className="ds-row">
                        <span className="ds-row-main">
                            <span className="ds-row-title">{t('delivery.service_fee')}</span>
                            <span className="ds-row-sub">{t('delivery.service_fee_hint')}</span>
                        </span>
                        <span className="ds-row-value">0.99–2.00 ₾</span>
                    </li>
                    <li className="ds-row">
                        <span className="ds-row-main">
                            <span className="ds-row-title">{t('delivery.max_weight')}</span>
                        </span>
                        <span className="ds-row-value">45 {t('delivery.kg')}</span>
                    </li>
                </ul>
            </div>
        </Sheet>
    );
};

export default DeliveryConditionsSheet;
