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
            <div className="dc">
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
                    <section className="dc-promo">
                        <p className="dc-promo-title">{t('delivery.promo_title')}</p>
                        <p className="dc-promo-desc">{t('delivery.promo_desc')}</p>
                    </section>
                )}

                <p className="dc-label">{t('delivery.zones_title')}</p>
                <ul className="dc-card">
                    {ZONES.map((z) => {
                        const current = z.id === zone?.id;
                        return (
                            <li key={z.id} className={current ? 'dc-row is-current' : 'dc-row'}>
                                <span className="dc-row-main">
                                    <span className="dc-row-title">{t(z.key)}</span>
                                    <span className="dc-row-sub">{z.eta} {min}</span>
                                </span>
                                {current && <span className="dc-row-badge">{t('delivery.you_are_here')}</span>}
                                <span className="dc-row-value">{z.price} ₾</span>
                            </li>
                        );
                    })}
                </ul>

                <p className="dc-label">{t('delivery.details_title')}</p>
                <ul className="dc-card">
                    <li className="dc-row">
                        <span className="dc-row-main">
                            <span className="dc-row-title">{t('delivery.service_fee')}</span>
                            <span className="dc-row-sub">{t('delivery.service_fee_hint')}</span>
                        </span>
                        <span className="dc-row-value dc-row-value--plain">0.99–2.00 ₾</span>
                    </li>
                    <li className="dc-row">
                        <span className="dc-row-main">
                            <span className="dc-row-title">{t('delivery.max_weight')}</span>
                        </span>
                        <span className="dc-row-value dc-row-value--plain">45 {t('delivery.kg')}</span>
                    </li>
                </ul>
            </div>
        </Sheet>
    );
};

export default DeliveryConditionsSheet;
