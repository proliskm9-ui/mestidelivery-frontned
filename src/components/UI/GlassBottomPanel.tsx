import React, { useState } from 'react';
import './GlassBottomPanel.css';
import { useLanguage } from '../../translations/LanguageContext';
import { useDeliveryLocationOptional } from '../../delivery/DeliveryLocationContext';
import { deviceHasOrdered, accountHasOrders } from '../../utils/deliveryPromo';
import DeliveryConditionsSheet from './DeliveryConditionsSheet';

const FREE_DELIVERY_THRESHOLD = 100;

interface GlassBottomPanelProps {
    totalItems: number;
    totalPrice: number;
    deliveryTime?: string;
    onNext: () => void;
    buttonText?: string;
    showPriceInButton?: boolean;
    priceLabel?: string;
    /** Zone delivery fee; when set, drives the banner copy */
    deliveryFee?: number | null;
    onOpenMap?: () => void;
}

const GlassBottomPanel: React.FC<GlassBottomPanelProps> = ({
    totalItems,
    totalPrice,
    deliveryTime,
    onNext,
    buttonText,
    showPriceInButton = false,
    priceLabel,
    deliveryFee: deliveryFeeProp,
    onOpenMap,
}) => {
    const { t, language } = useLanguage();
    const delivery = useDeliveryLocationOptional();
    const [isConditionsOpen, setIsConditionsOpen] = useState(false);

    // First-order promo (prod): new device & account, cart >= 100 ₾ —
    // free delivery when the zone fee is <= 12 ₾, otherwise 10 ₾ off.
    const isEligible = !deviceHasOrdered() && !accountHasOrders();
    const baseFee = deliveryFeeProp ?? delivery?.fee ?? 8;
    const isVillage = Boolean(delivery && (delivery.zoneId === 'nearby_villages' || delivery.zoneId === 'outside')) || baseFee >= 20;
    const discountAchieved = isEligible && totalPrice >= FREE_DELIVERY_THRESHOLD;
    const deliveryDiscount = discountAchieved ? (baseFee <= 12 ? baseFee : 10) : 0;
    const fee = Math.max(0, baseFee - deliveryDiscount);
    const isFree = discountAchieved && baseFee <= 12;
    const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - totalPrice);
    const progressPct = Math.min(100, Math.round((totalPrice / FREE_DELIVERY_THRESHOLD) * 100));
    const eta = deliveryTime || delivery?.etaLabel || '20–30 мин';

    const pick = (en: string, ka: string, ru: string) => (language === 'en' ? en : language === 'ka' ? ka : ru);
    const promoLine = isFree
        ? pick(`Free delivery · ${eta}`, `უფასო მიტანა · ${eta}`, `Бесплатная доставка · ${eta}`)
        : discountAchieved && isVillage
            ? pick(`Delivery 10 ₾ (-10 ₾) · ${eta}`, `მიტანა 10 ₾ (-10 ₾) · ${eta}`, `Доставка 10 ₾ (скидка 10 ₾) · ${eta}`)
            : null;
    const feeLine = t('delivery.fee_with_eta').replace('{fee}', String(Math.round(fee))).replace('{eta}', eta);

    const deliveryLine = priceLabel || promoLine || feeLine;
    const emptyLine = promoLine || feeLine;

    const showProgress = isEligible && totalItems > 0 && !discountAchieved && (baseFee <= 12 || isVillage);
    const progressText = baseFee <= 12
        ? pick(`Add ${remaining.toFixed(2)} ₾ for free delivery`, `კიდევ ${remaining.toFixed(2)} ₾ უფასო მიტანამდე`, `Ещё ${remaining.toFixed(2)} ₾ до бесплатной доставки`)
        : pick(`Add ${remaining.toFixed(2)} ₾ for 10 ₾ off delivery`, `კიდევ ${remaining.toFixed(2)} ₾ მიტანის 10 ₾ ფასდაკლებამდე`, `Ещё ${remaining.toFixed(2)} ₾ до скидки 10 ₾ на доставку`);

    const conditionsSheet = (
        <DeliveryConditionsSheet
            open={isConditionsOpen}
            onOpenChange={setIsConditionsOpen}
            zoneId={delivery?.zoneId}
            fee={fee}
            baseFee={baseFee}
            eta={eta}
            promoEligible={isEligible}
        />
    );

    if (totalItems === 0) {
        return (
            <div className="glass-panel-container">
                <div
                    className="glass-panel-content glass-panel-empty"
                    onClick={fee == null ? onOpenMap : undefined}
                    style={{ cursor: fee == null && onOpenMap ? 'pointer' : undefined }}
                >
                    <div className="panel-info-row" style={{ marginBottom: 0 }}>
                        <div className="panel-icon-left" style={{ background: 'transparent' }}>
                            <img
                                src="/Assets/иконка_человек_2 пнг 32.png"
                                alt="Courier"
                                style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                            />
                        </div>
                        <div className="panel-center-text">
                            <div className="delivery-text">{emptyLine}</div>
                            <div
                                className="delivery-sub"
                                onClick={(e) => { e.stopPropagation(); setIsConditionsOpen(true); }}
                                style={{ cursor: 'pointer' }}
                            >
                                {t('delivery.conditions')}
                            </div>
                        </div>
                        <div
                            className="panel-icon-right"
                            onClick={(e) => { e.stopPropagation(); setIsConditionsOpen(true); }}
                            style={{ cursor: 'pointer' }}
                        >
                            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>
                {conditionsSheet}
            </div>
        );
    }

    return (
        <div className="glass-panel-container">
            <div className="glass-panel-content glass-panel-active">
                {showProgress && (
                    <div className="panel-promo-progress">
                        <div className="panel-promo-progress-row">
                            <span>{progressText}</span>
                            <span className="panel-promo-progress-pct">{progressPct}%</span>
                        </div>
                        <div className="panel-promo-progress-track">
                            <div className="panel-promo-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                )}
                <div className="panel-info-row">
                    <div className="panel-icon-left" style={{ background: 'transparent' }}>
                        <img
                            src="/Assets/иконка_человек_2 пнг 32.png"
                            alt="Courier"
                            style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                        />
                    </div>
                    <div className="panel-center-text">
                        <div className="delivery-text">{deliveryLine}</div>
                        <div
                            className="delivery-sub"
                            onClick={() => setIsConditionsOpen(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            {t('delivery.conditions')}
                        </div>
                    </div>
                    <div className="panel-icon-right" onClick={() => setIsConditionsOpen(true)} style={{ cursor: 'pointer' }}>
                        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>

                <button className="panel-btn-next" onClick={onNext}>
                    <span>{buttonText || t('common.next')}</span>
                    {showPriceInButton && (
                        <span className="panel-btn-price" style={{ marginLeft: 'auto', opacity: 0.9 }}>
                            {totalPrice.toFixed(2)} ₾
                        </span>
                    )}
                </button>
            </div>

            {conditionsSheet}
        </div>
    );
};

export default GlassBottomPanel;
