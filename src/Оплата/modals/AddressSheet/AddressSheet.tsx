import React, { useEffect, useState } from 'react';
import { Building2, ChevronRight, Home, MapPin } from 'lucide-react';
import Sheet from '../../../components/UI/Sheet';
import { useLanguage } from '../../../translations/LanguageContext';
import type { AddressData } from '../../blocks/AddressBlock/AddressBlock';
import './AddressSheet.css';

type PlaceType = AddressData['type'];
type Draft = Pick<AddressData, 'type' | 'street' | 'house' | 'apartment' | 'floor' | 'hotelName' | 'room' | 'deliveryNote' | 'landmark'>;

interface AddressSheetProps {
    isOpen: boolean;
    onClose: () => void;
    address: Partial<AddressData>;
    /** Writes one field back to the checkout (same contract as the old inline block). */
    updateAddress: (field: string, value: string) => void;
    onOpenMap: () => void;
}

const FIELDS: Record<PlaceType, { key: keyof Draft; label: string; half?: boolean; third?: boolean; mode?: 'numeric' }[]> = {
    home: [
        { key: 'street', label: 'checkout.street' },
        { key: 'house', label: 'checkout.house', third: true },
        { key: 'apartment', label: 'profile.apartment', third: true },
        { key: 'floor', label: 'map.floor', third: true, mode: 'numeric' },
    ],
    hotel: [
        { key: 'hotelName', label: 'checkout.hotel_name' },
        { key: 'room', label: 'checkout.room_number', half: true },
        { key: 'deliveryNote', label: 'checkout.how_to_deliver', half: true },
    ],
    map: [
        { key: 'landmark', label: 'checkout.landmark' },
        { key: 'deliveryNote', label: 'checkout.how_to_deliver' },
    ],
};

const pick = (a: Partial<AddressData>): Draft => ({
    type: a.type || 'home',
    street: a.street || '',
    house: a.house || '',
    apartment: a.apartment || '',
    floor: a.floor || '',
    hotelName: a.hotelName || '',
    room: a.room || '',
    deliveryNote: a.deliveryNote || '',
    landmark: a.landmark || '',
});

/** Where to deliver: place type + the fields for it, in the app's sheet material. */
const AddressSheet: React.FC<AddressSheetProps> = ({ isOpen, onClose, address, updateAddress, onOpenMap }) => {
    const { t } = useLanguage();
    const [draft, setDraft] = useState<Draft>(() => pick(address));

    useEffect(() => { if (isOpen) setDraft(pick(address)); }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = (key: keyof Draft, value: string) => setDraft((d) => ({ ...d, [key]: value }));

    const save = () => {
        (Object.keys(draft) as (keyof Draft)[]).forEach((k) => {
            if ((address[k] || '') !== draft[k]) updateAddress(k, draft[k]);
        });
        onClose();
    };

    const types: { id: PlaceType; label: string; icon: React.ReactNode }[] = [
        { id: 'home', label: t('checkout.place_home'), icon: <Home size={18} strokeWidth={2} /> },
        { id: 'hotel', label: t('checkout.address_hotel_guest'), icon: <Building2 size={18} strokeWidth={2} /> },
        { id: 'map', label: t('checkout.address_point_map'), icon: <MapPin size={18} strokeWidth={2} /> },
    ];

    return (
        <Sheet
            open={isOpen}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title={t('checkout.address_title')}
            className="checkout-sheet"
            footer={<button type="button" className="md-sheet-cta" onClick={save}>{t('common.done')}</button>}
        >
            <div className="as-types" role="radiogroup">
                {types.map((ty) => (
                    <button
                        key={ty.id}
                        type="button"
                        role="radio"
                        aria-checked={draft.type === ty.id}
                        className={`as-type${draft.type === ty.id ? ' is-on' : ''}`}
                        onClick={() => set('type', ty.id)}
                    >
                        {ty.icon}
                        <span>{ty.label}</span>
                    </button>
                ))}
            </div>

            {draft.type === 'map' && (
                <button type="button" className="as-map-row" onClick={() => { save(); onOpenMap(); }}>
                    <span className="as-map-icon"><MapPin size={18} strokeWidth={2} /></span>
                    <span className="as-map-text">
                        <span className="as-map-title">{address.geo || t('checkout.determine_location')}</span>
                        {address.geo && <span className="as-map-sub">{t('checkout.determine_location')}</span>}
                    </span>
                    <ChevronRight size={18} className="as-map-chevron" />
                </button>
            )}

            <div className="as-fields">
                {FIELDS[draft.type].map((f) => (
                    <div key={f.key} className={`cm-input-wrapper as-field${f.half ? ' as-field--half' : ''}${f.third ? ' as-field--third' : ''}${draft[f.key] ? ' has-value' : ''}`}>
                        <label className="cm-input-label" htmlFor={`as-${f.key}`}>{t(f.label)}</label>
                        <input
                            id={`as-${f.key}`}
                            className="cm-input"
                            value={draft[f.key]}
                            placeholder={t(f.label)}
                            inputMode={f.mode}
                            onChange={(e) => set(f.key, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </Sheet>
    );
};

export default AddressSheet;
