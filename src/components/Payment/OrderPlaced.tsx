import React from 'react';
import { CreditCard, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../translations/LanguageContext';
import './OrderPlaced.css';

export const SUPPORT_URL = 'https://t.me/MestigoSupport_Bot';

/** Ring draws, check draws, one soft pulse. Re-key it to replay. */
export const OrderPlacedMark: React.FC = () => (
    <div className="mp-done-mark">
        <svg viewBox="0 0 96 96" aria-hidden="true">
            <circle className="mp-done-ring" cx="48" cy="48" r="45" />
            <path className="mp-done-check" d="M30 49.5 42.5 62 66 36" />
        </svg>
    </div>
);

/** Round actions under "order placed" for online payment: reopen Keepz, support. */
export const OrderPlacedActions: React.FC<{ onOpenKeepz: () => void }> = ({ onOpenKeepz }) => {
    const { t } = useLanguage();
    return (
        <div className="mp-round-actions">
            <button type="button" className="mp-round-btn" onClick={onOpenKeepz}>
                <span className="mp-round-icon"><CreditCard size={22} strokeWidth={2} /></span>
                <span className="mp-round-label">{t('checkout.action_open_keepz')}</span>
            </button>
            <a className="mp-round-btn" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                <span className="mp-round-icon"><MessageCircle size={22} strokeWidth={2} /></span>
                <span className="mp-round-label">{t('checkout.action_support')}</span>
            </a>
        </div>
    );
};
