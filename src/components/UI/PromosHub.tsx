import React, { useState } from 'react';
import { useLanguage } from '../../translations/LanguageContext';
import PromoCodesSheet from '../Profile/PromoCodesSheet';
import './PromosHub.css';

interface Props {
    /** Restaurants with an active promo (already filtered for this client). */
    promoCount: number;
    /** Renders the restaurant grid (same cards as everywhere in the menu). */
    grid: React.ReactNode;
    isNewClient: boolean;
    onBrowse: () => void;
}

const Chevron = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
);

/** Menu → Акции: restaurant promos plus the service's own offers, one grouped list like the profile. */
const PromosHub: React.FC<Props> = ({ promoCount, grid, isNewClient, onBrowse }) => {
    const { t } = useLanguage();
    const [promoOpen, setPromoOpen] = useState(false);

    return (
        <div className="content-pad ph">
            {promoCount > 0 && (
                <section className="ph-section">
                    <h2 className="ph-title">{t('promos_hub.restaurants')}</h2>
                    <p className="ph-sub">{t('promos_hub.restaurants_sub')}</p>
                    {grid}
                </section>
            )}

            <section className="ph-section">
                <h2 className="ph-title">{t('promos_hub.ours')}</h2>
                <div className="ph-list">
                    {isNewClient && (
                        <button type="button" className="ph-row" onClick={onBrowse}>
                            <span className="ph-icon" aria-hidden="true">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
                            </span>
                            <span className="ph-text">
                                <span className="ph-row-title">{t('promos_hub.free_title')}</span>
                                <span className="ph-row-sub">{t('promos_hub.free_sub')}</span>
                            </span>
                            <Chevron />
                        </button>
                    )}
                    <button type="button" className="ph-row" onClick={() => (window as any).MestiReferral?.open()}>
                        <span className="ph-icon" aria-hidden="true">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>
                        </span>
                        <span className="ph-text">
                            <span className="ph-row-title">{t('profile.invite_title')}</span>
                            <span className="ph-row-sub"><b>{t('profile.invite_bonus')}</b> {t('profile.invite_sub')}</span>
                        </span>
                        <Chevron />
                    </button>
                    <button type="button" className="ph-row" onClick={() => setPromoOpen(true)}>
                        <span className="ph-icon" aria-hidden="true">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M9 9h.01M15 15h.01M15.5 8.5l-7 7" /></svg>
                        </span>
                        <span className="ph-text">
                            <span className="ph-row-title">{t('profile.promo_title')}</span>
                            <span className="ph-row-sub">{t('profile.promo_sub')}</span>
                        </span>
                        <Chevron />
                    </button>
                </div>
            </section>

            {promoCount === 0 && (
                <p className="ph-note">{isNewClient ? t('menu.promos_empty_desc') : t('menu.promos_used_desc')}</p>
            )}

            <PromoCodesSheet open={promoOpen} onOpenChange={setPromoOpen} />
        </div>
    );
};

export default PromosHub;
