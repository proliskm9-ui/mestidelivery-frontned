import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './GlassBottomPanel.css';
import { useLanguage } from '../../translations/LanguageContext';
import { useDeliveryLocationOptional } from '../../delivery/DeliveryLocationContext';

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
    const { t } = useLanguage();
    const delivery = useDeliveryLocationOptional();
    const [isConditionsOpen, setIsConditionsOpen] = useState(false);

    const fee = deliveryFeeProp ?? delivery?.fee ?? null;
    const eta = deliveryTime || delivery?.etaLabel || t('cart.time');
    const preliminary = delivery?.preliminary;

    const deliveryLine = (() => {
        if (priceLabel) return priceLabel;
        if (fee != null) {
            const base = t('delivery.fee_with_eta')
                .replace('{fee}', String(Math.round(fee)))
                .replace('{eta}', eta);
            return preliminary ? `${base} (${t('delivery.preliminary')})` : base;
        }
        return t('delivery.need_location');
    })();

    const emptyLine = (() => {
        if (fee != null) {
            return t('delivery.fee_with_eta')
                .replace('{fee}', String(Math.round(fee)))
                .replace('{eta}', eta);
        }
        return t('delivery.need_location');
    })();

    if (totalItems === 0) {
        return (
            <div className="glass-panel-container">
                <div
                    className="glass-panel-content glass-panel-empty"
                    onClick={fee == null ? onOpenMap : undefined}
                    style={{ cursor: fee == null && onOpenMap ? 'pointer' : undefined }}
                >
                    <div className="panel-info-row">
                        <div className="panel-icon-left" style={{ background: 'transparent' }}>
                            <img
                                src="/Assets/иконка_человек_2 пнг 32.png"
                                alt="Courier"
                                style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                            />
                        </div>
                        <div className="panel-center-text">
                            <div className="delivery-text">{emptyLine}</div>
                        </div>
                        <div className="panel-icon-right">
                            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel-container">
            <div className="glass-panel-content glass-panel-active">
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
                    <div className="panel-icon-right">
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

            {isConditionsOpen && createPortal(
                <div className="v2-info-overlay active" onClick={() => setIsConditionsOpen(false)}>
                    <div className="v2-info-sheet active" onClick={(e) => e.stopPropagation()}>
                        <div className="v2-sheet-handle" onClick={() => setIsConditionsOpen(false)} />

                        <div className="v2-sheet-content">
                            <div className="v2-modal-card">
                                <h2 className="v2-sheet-title compact">{t('delivery.fee_label')}</h2>

                                <div className="v2-partner-info">
                                    <img
                                        src="/Assets/иконка_человек_2 пнг 32.png"
                                        alt="Courier"
                                        className="partner-icon"
                                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                    />
                                    <span>mestigo</span>
                                </div>

                                <div className="v2-info-row-item">
                                    <span className="info-label">{t('delivery.fee_label')}</span>
                                    <span className="info-value">
                                        {fee != null ? `${Math.round(fee)} ₾` : '—'}
                                    </span>
                                </div>
                                {preliminary && (
                                    <div className="v2-price-desc">{t('delivery.outside_zone')}</div>
                                )}
                                <div className="v2-info-row-item">
                                    <span className="info-label">{t('delivery.zone_center')}</span>
                                    <span className="info-value">8 ₾</span>
                                </div>
                                <div className="v2-info-row-item">
                                    <span className="info-label">{t('delivery.zone_airport')}</span>
                                    <span className="info-value">12 ₾</span>
                                </div>
                                <div className="v2-info-row-item">
                                    <span className="info-label">{t('delivery.zone_villages')}</span>
                                    <span className="info-value">20 ₾</span>
                                </div>
                            </div>

                            <div className="v2-modal-card">
                                <h2 className="v2-sheet-title compact" style={{ marginBottom: '8px' }}>{t('delivery.details_title')}</h2>
                                <div className="v2-info-row-item">
                                    <span className="info-label">{t('delivery.max_weight')}</span>
                                    <span className="info-value">45 кг</span>
                                </div>
                                <div className="v2-info-row-item">
                                    <span className="info-label">{t('delivery.service_work')}</span>
                                    <span className="info-value">от 0.99 GEL</span>
                                </div>
                                <div className="v2-sheet-legal-alt" style={{ padding: '12px 0 0 0', marginTop: '4px' }}>
                                    <p>{t('delivery.service_fee_legal')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default GlassBottomPanel;
