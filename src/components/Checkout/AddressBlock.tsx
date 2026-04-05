import React, { useState } from 'react';
import './AddressBlock.css';
import { AddressData } from './types'; // Types to be defined in Checkout.tsx or separate file

interface AddressBlockProps {
    address: AddressData;
    updateAddress: (field: string, value: string) => void;
    onOpenPlaceModal: () => void;
    onEditComment?: () => void;
    onEditPhone?: () => void;
}

const AddressBlock: React.FC<AddressBlockProps> = ({
    address,
    updateAddress,
    onOpenPlaceModal
}) => {
    const [isCommentFocused, setIsCommentFocused] = useState(false);
    // Safe object just in case
    const safeAddress = address || {};
    const currentType = safeAddress.type || 'home';

    const getCellClass = (val: string | undefined, extra = '') => {
        return `input-cell ${extra} ${val ? 'has-value' : ''}`;
    };

    const handleCellClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const input = e.currentTarget.querySelector('input');
        if (input) input.focus();
    };

    return (
        <section className="delivery-card">
            <h2 className="delivery-title">Куда доставить?</h2>

            <div className="delivery-content">

                {/* --- 1. PLACE TYPE --- */}
                <div className="place-type-row" onClick={onOpenPlaceModal}>
                    <div className="icon-fixed">
                        {currentType === 'home' && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        )}
                        {currentType === 'hotel' && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
                                <path d="M9 22v-4h6v4" />
                                <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
                            </svg>
                        )}
                        {currentType === 'map' && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        )}
                    </div>
                    <div className="place-text-col">
                        <p className="place-title">
                            {currentType === 'home' && 'Дом / Квартира'}
                            {currentType === 'hotel' && 'Отель / Гэстхаус'}
                            {currentType === 'map' && 'Точка на карте'}
                        </p>
                        <p className="place-subtitle">Выбрать тип помещения</p>
                    </div>
                    <div className="arrow-right">
                        <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                </div>

                <div className="divider-line full-width"></div>

                {/* --- 2. INPUT GRID --- */}
                <div className="fields-grid">
                    {/* HOME FIELDS */}
                    {currentType === 'home' && (
                        <>
                            <div className="grid-row">
                                <div className={getCellClass(safeAddress.street)} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.street || ''}
                                        onChange={(e) => updateAddress('street', e.target.value)}
                                    />
                                    <label className="floating-label">Улица</label>
                                    <div className="bottom-border"></div>
                                </div>
                                <div className={getCellClass(safeAddress.house)} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.house || ''}
                                        onChange={(e) => updateAddress('house', e.target.value)}
                                    />
                                    <label className="floating-label">Дом</label>
                                    <div className="bottom-border"></div>
                                </div>
                            </div>
                            <div className="grid-row">
                                <div className={getCellClass(safeAddress.apartment)} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.apartment || ''}
                                        onChange={(e) => updateAddress('apartment', e.target.value)}
                                    />
                                    <label className="floating-label">Кв/офис</label>
                                    <div className="bottom-border"></div>
                                </div>
                                <div className={getCellClass(safeAddress.floor)} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.floor || ''}
                                        onChange={(e) => updateAddress('floor', e.target.value)}
                                    />
                                    <label className="floating-label">Этаж</label>
                                    <div className="bottom-border"></div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* HOTEL FIELDS */}
                    {currentType === 'hotel' && (
                        <>
                            <div className="grid-row">
                                <div className={getCellClass(safeAddress.hotelName, 'full-width')} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.hotelName || ''}
                                        onChange={(e) => updateAddress('hotelName', e.target.value)}
                                    />
                                    <label className="floating-label">Название отеля</label>
                                    <div className="bottom-border"></div>
                                </div>
                            </div>
                            <div className="grid-row">
                                <div className={getCellClass(safeAddress.room)} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.room || ''}
                                        onChange={(e) => updateAddress('room', e.target.value)}
                                    />
                                    <label className="floating-label">Номер комнаты</label>
                                    <div className="bottom-border"></div>
                                </div>
                                <div className={getCellClass(safeAddress.deliveryNote)} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.deliveryNote || ''}
                                        onChange={(e) => updateAddress('deliveryNote', e.target.value)}
                                    />
                                    <label className="floating-label">Как передать</label>
                                    <div className="bottom-border"></div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* MAP FIELDS */}
                    {currentType === 'map' && (
                        <>
                            <div className="grid-row">
                                <div className={getCellClass(safeAddress.geo, 'full-width')} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.geo || ''}
                                        readOnly
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <label className="floating-label">Определить местоположение</label>
                                    <div className="bottom-border"></div>
                                </div>
                            </div>
                            <div className="grid-row">
                                <div className={getCellClass(safeAddress.landmark)} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.landmark || ''}
                                        onChange={(e) => updateAddress('landmark', e.target.value)}
                                    />
                                    <label className="floating-label">Ориентир</label>
                                    <div className="bottom-border"></div>
                                </div>
                                <div className={getCellClass(safeAddress.deliveryNote)} onClick={handleCellClick}>
                                    <input
                                        className="input-transparent"
                                        value={safeAddress.deliveryNote || ''}
                                        onChange={(e) => updateAddress('deliveryNote', e.target.value)}
                                    />
                                    <label className="floating-label">Как передать</label>
                                    <div className="bottom-border"></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* --- COMMENT --- */}
                <div className="icon-input-row" onClick={handleCellClick}>
                    <div className="icon-fixed">
                        {/* SVG Bubble */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>

                    <div className={getCellClass(safeAddress.comment)}>
                        <input
                            className="input-transparent"
                            value={safeAddress.comment || ''}
                            onChange={(e) => updateAddress('comment', e.target.value)}
                            onFocus={() => setIsCommentFocused(true)}
                            onBlur={() => setIsCommentFocused(false)}
                        />
                        <label className="floating-label">
                            {(isCommentFocused || safeAddress.comment) ? 'Комментарий к заказу' : 'Добавить комментарий'}
                        </label>
                    </div>
                </div>

                <div className="divider-line indented"></div>

                {/* --- PHONE --- */}
                <div className="icon-input-row phone-row" onClick={handleCellClick}>
                    <div className="icon-fixed">
                        {/* SVG Phone */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                    </div>

                    <div className={getCellClass(safeAddress.phone)}>
                        <input
                            className="input-transparent"
                            value={safeAddress.phone || ''}
                            onChange={(e) => updateAddress('phone', e.target.value)}
                            type="tel"
                            inputMode="tel"
                        />
                        <label className="floating-label">Телефон получателя</label>
                    </div>
                </div>

                <div className="phone-line"></div>
            </div>
        </section>
    );
};

export default AddressBlock;
