import React from 'react';
import { Building2, ChevronRight, Home, MapPin, MessageSquare, Phone } from 'lucide-react';
import { useLanguage } from '../../../translations/LanguageContext';
import type { AddressData } from './AddressBlock';
import './AddressBlock.css';
import '../../modals/AddressSheet/AddressSheet.css';

interface AddressSummaryProps {
    address: Partial<AddressData>;
    onEditAddress: () => void;
    onEditComment: () => void;
    onEditPhone: () => void;
}

/** Phone checkout "Where to deliver?": three rows, each opens its own sheet. */
const AddressSummary: React.FC<AddressSummaryProps> = ({ address, onEditAddress, onEditComment, onEditPhone }) => {
    const { t } = useLanguage();
    const type = address.type || 'home';

    const join = (parts: (string | undefined | false)[]) => parts.filter(Boolean).join(', ');
    const line = type === 'hotel'
        ? join([address.hotelName, address.room && `${t('checkout.room_number')} ${address.room}`])
        : type === 'map'
            ? join([address.landmark, address.geo])
            : join([address.street, address.house]);
    const details = type === 'home'
        ? join([address.apartment && `${t('checkout.apt_short')} ${address.apartment}`, address.floor && `${t('checkout.floor_short')} ${address.floor}`])
        : address.deliveryNote || '';
    const typeLabel = type === 'hotel' ? t('checkout.address_hotel_guest') : type === 'map' ? t('checkout.address_point_map') : t('checkout.place_home');
    const TypeIcon = type === 'hotel' ? Building2 : type === 'map' ? MapPin : Home;

    return (
        <section className="delivery-card">
            <h2 className="delivery-title">{t('checkout.where_to_deliver')}</h2>
            <div className="ds-list ab-list">
                <button type="button" className="ds-row" onClick={onEditAddress}>
                    <span className="ds-row-icon"><TypeIcon size={18} strokeWidth={2} /></span>
                    <span className="ds-row-main">
                        <span className={`ds-row-title${line ? '' : ' ds-row-title--empty'}`}>{line || t('checkout.specify_address')}</span>
                        <span className="ds-row-sub">{details ? `${typeLabel} · ${details}` : typeLabel}</span>
                    </span>
                    <ChevronRight size={18} className="ds-row-chevron" />
                </button>
                <button type="button" className="ds-row" onClick={onEditComment}>
                    <span className="ds-row-icon"><MessageSquare size={18} strokeWidth={2} /></span>
                    <span className="ds-row-main">
                        <span className="ds-row-title">{address.comment || t('checkout.add_comment')}</span>
                        {address.comment && <span className="ds-row-sub">{t('checkout.comment_to_order')}</span>}
                    </span>
                    <ChevronRight size={18} className="ds-row-chevron" />
                </button>
                <button type="button" className="ds-row" onClick={onEditPhone}>
                    <span className="ds-row-icon"><Phone size={18} strokeWidth={2} /></span>
                    <span className="ds-row-main">
                        <span className={`ds-row-title${address.phone ? '' : ' ds-row-title--empty'}`}>{address.phone || t('checkout.phone_recipient')}</span>
                        {address.phone && <span className="ds-row-sub">{t('checkout.phone_recipient')}</span>}
                    </span>
                    <ChevronRight size={18} className="ds-row-chevron" />
                </button>
            </div>
        </section>
    );
};

export default AddressSummary;
