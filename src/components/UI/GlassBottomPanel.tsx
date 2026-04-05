import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './GlassBottomPanel.css';
import { useLanguage } from '../../translations/LanguageContext';

interface GlassBottomPanelProps {
    totalItems: number;
    totalPrice: number;
    deliveryTime?: string;
    onNext: () => void;
    buttonText?: string;
    showPriceInButton?: boolean;
    priceLabel?: string;
}

const GlassBottomPanel: React.FC<GlassBottomPanelProps> = ({
    totalItems,
    totalPrice,
    deliveryTime,
    onNext,
    buttonText,
    showPriceInButton = false,
    priceLabel
}) => {
    const { t } = useLanguage();
    const [isConditionsOpen, setIsConditionsOpen] = useState(false);

    // We assume empty state is just delivery banner
    if (totalItems === 0) {
        return (
            <div className="glass-panel-container">
                <div className="glass-panel-content glass-panel-empty">
                    <div className="panel-info-row">
                        <div className="panel-icon-left" style={{ background: 'transparent' }}>
                            {/* Courier Icon Placeholder */}
                            <img
                                src="/Assets/иконка_человек_2 пнг 32.png"
                                alt="Courier"
                                style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                            />
                        </div>
                        <div className="panel-center-text">
                            <div className="delivery-text">{deliveryTime || '35–45 мин'} · {t('menu.free_delivery')}</div>
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

    // Active state with items
    return (
        <div className="glass-panel-container">
            <div className="glass-panel-content glass-panel-active">
                <div className="panel-info-row">
                    <div className="panel-icon-left" style={{ background: 'transparent' }}>
                        {/* Courier Icon Placeholder */}
                        <img
                            src="/Assets/иконка_человек_2 пнг 32.png"
                            alt="Courier"
                            style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                        />
                    </div>
                    <div className="panel-center-text">
                        <div className="delivery-text">{priceLabel || `${totalPrice.toFixed(2)} GEL`} · {deliveryTime || '35–45 мин'}</div>
                        <div className="delivery-sub" onClick={() => setIsConditionsOpen(true)} style={{ cursor: 'pointer' }}>
                            Подробные условия
                        </div>
                    </div>
                    <div className="panel-icon-right">
                        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>

                <button className="panel-btn-next" onClick={onNext}>
                    <span>{buttonText || t('menu.next') || 'Далее'}</span>
                    {showPriceInButton && (
                        <span className="panel-btn-price" style={{ marginLeft: 'auto', opacity: 0.9 }}>
                            {totalPrice.toFixed(2)} ₾
                        </span>
                    )}
                </button>
            </div>

            {/* Service Conditions Modal (Matching V2 Info Sheet Style) */}
            {isConditionsOpen && createPortal(
                <div className="v2-info-overlay active" onClick={() => setIsConditionsOpen(false)}>
                    <div className="v2-info-sheet active" onClick={(e) => e.stopPropagation()}>
                        <div className="v2-sheet-handle" onClick={() => setIsConditionsOpen(false)} />

                        <div className="v2-sheet-content">
                            {/* Section 1: Delivery Cost */}
                            <div className="v2-modal-card">
                                <h2 className="v2-sheet-title compact">Стоимость доставки</h2>

                                <div className="v2-partner-info">
                                    <img
                                        src="/Assets/иконка_человек_2 пнг 32.png"
                                        alt="Courier"
                                        className="partner-icon"
                                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                    />
                                    <span>Доставит партнер mestigo</span>
                                </div>

                                <div className="v2-price-desc">Цена ниже за каждый GEL в заказе</div>

                                <div className="v2-info-row-item">
                                    <span className="info-label">Заказ до 50 GEL</span>
                                    <span className="info-value">10 GEL</span>
                                </div>
                                <div className="v2-info-row-item">
                                    <span className="info-label">Заказ от 200 GEL</span>
                                    <span className="info-value">0 GEL</span>
                                </div>
                            </div>

                            {/* Section 2: Details */}
                            <div className="v2-modal-card">
                                <h2 className="v2-sheet-title compact" style={{ marginBottom: '8px' }}>Детали</h2>

                                <div className="v2-info-row-item">
                                    <span className="info-label">Максимальный вес заказа</span>
                                    <span className="info-value">45 кг</span>
                                </div>
                                <div className="v2-info-row-item">
                                    <span className="info-label">Работа сервиса</span>
                                    <span className="info-value">от 0.99 GEL</span>
                                </div>
                                <div className="v2-sheet-legal-alt" style={{ padding: '12px 0 0 0', marginTop: '4px' }}>
                                    <p>Сервисный сбор составляет 6% от суммы заказа, но не более 2.00 GEL и не менее 0.99 GEL. Этот сбор помогает нам покрыть расходы на обработку заказов, поддержку клиентов и улучшение сервиса.</p>
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
