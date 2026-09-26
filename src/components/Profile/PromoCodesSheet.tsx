import React, { useEffect, useState } from 'react';
import Sheet from '../UI/Sheet';
import { useLanguage } from '../../translations/LanguageContext';
import { api } from '../../services/api';
import { getPendingPromo, setPendingPromo } from '../../utils/pendingPromo';
import '../../Оплата/modals/PromoCodeModal/PromoCodeModal.css';
import './PromoCodesSheet.css';

/** Personal promo code as returned by GET /api/customer/promo-codes (see docs/ADMIN_CUSTOMERS_API.md). */
interface MyPromo {
    code: string;
    kind: 'percent' | 'fixed' | 'free_delivery';
    value: number;
    min_order?: number;
    ends_at?: string | null;
    used?: boolean;
    note?: string | null;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

const PromoCodesSheet: React.FC<Props> = ({ open, onOpenChange }) => {
    const { t, language } = useLanguage();
    const [value, setValue] = useState('');
    const [saved, setSaved] = useState(getPendingPromo());
    const [mine, setMine] = useState<MyPromo[] | null>(null);

    useEffect(() => {
        if (!open) return;
        setSaved(getPendingPromo());
        setValue('');
        let alive = true;
        fetch(`${API_URL}/api/customer/promo-codes`, { headers: api.getHeaders() })
            .then((r) => (r.ok ? r.json() : []))
            .then((list) => { if (alive) setMine(Array.isArray(list) ? list : []); })
            .catch(() => { if (alive) setMine([]); });
        return () => { alive = false; };
    }, [open]);

    const apply = (code: string) => {
        const clean = code.trim().toUpperCase();
        if (!clean) return;
        setPendingPromo(clean);
        setSaved(clean);
        setValue('');
    };

    const benefit = (p: MyPromo) =>
        p.kind === 'free_delivery' ? t('profile.promo_free_delivery')
            : p.kind === 'percent' ? `−${Number(p.value)}%`
                : `−${Number(p.value)} GEL`;

    const terms = (p: MyPromo) => {
        const parts: string[] = [];
        if (Number(p.min_order) > 0) parts.push(t('profile.promo_min').replace('{n}', String(Number(p.min_order))));
        if (p.ends_at) {
            const d = new Date(p.ends_at);
            if (!isNaN(d.getTime())) {
                parts.push(t('profile.promo_until').replace('{date}', d.toLocaleDateString(language === 'ka' ? 'ka-GE' : language === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long' })));
            }
        }
        return parts.join(' · ');
    };

    return (
        <Sheet
            tall
            open={open}
            onOpenChange={onOpenChange}
            title={t('profile.promo_title')}
            footer={
                <button type="button" className="md-sheet-cta" disabled={!value.trim()} onClick={() => apply(value)}>
                    {t('checkout.promo_apply')}
                </button>
            }
        >
            <div className={`pc-input-wrapper ${value ? 'has-value' : ''}`}>
                <label className="pc-input-label">{t('checkout.promo_code')}</label>
                <input
                    className="pc-input pcs-input"
                    value={value}
                    placeholder={value ? '' : t('checkout.promo_placeholder')}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') apply(value); }}
                />
            </div>

            {saved && (
                <div className="pcs-saved" role="status">
                    <span className="pcs-saved-main">
                        <span className="pcs-saved-code">{saved}</span>
                        <span className="pcs-saved-text">{t('profile.promo_saved')}</span>
                    </span>
                    <button type="button" className="pcs-saved-clear" onClick={() => { setPendingPromo(''); setSaved(''); }}>
                        {t('profile.promo_remove')}
                    </button>
                </div>
            )}

            <h4 className="pcs-section">{t('profile.promo_mine')}</h4>
            {mine === null ? (
                <div className="pcs-skeleton" aria-hidden="true" />
            ) : mine.length === 0 ? (
                <p className="pcs-empty">{t('profile.promo_empty')}</p>
            ) : (
                <div className="pcs-list">
                    {mine.map((p) => {
                        const isSaved = saved === p.code.toUpperCase();
                        return (
                            <div key={p.code} className={`pcs-item ${p.used ? 'is-used' : ''}`}>
                                <div className="pcs-item-main">
                                    <span className="pcs-item-benefit">{benefit(p)}</span>
                                    <span className="pcs-item-code">{p.code}</span>
                                    {terms(p) && <span className="pcs-item-terms">{terms(p)}</span>}
                                </div>
                                {p.used ? (
                                    <span className="pcs-item-state">{t('profile.promo_used')}</span>
                                ) : (
                                    <button type="button" className={`pcs-item-btn ${isSaved ? 'is-on' : ''}`} disabled={isSaved} onClick={() => apply(p.code)}>
                                        {isSaved ? t('profile.promo_selected') : t('profile.promo_use')}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Sheet>
    );
};

export default PromoCodesSheet;
