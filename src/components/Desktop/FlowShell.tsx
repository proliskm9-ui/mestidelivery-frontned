import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../../translations/LanguageContext';
import './FlowShell.css';

export type FlowStep = 'cart' | 'checkout' | 'payment';

interface FlowShellProps {
    step: FlowStep;
    /** Everything done (order placed): all steps get a check. */
    complete?: boolean;
    onBack?: () => void;
    backDisabled?: boolean;
    /** Optional action on the right of the bar (e.g. clear cart). */
    action?: React.ReactNode;
    children: React.ReactNode;
}

const STEPS: FlowStep[] = ['cart', 'checkout', 'payment'];

/**
 * Desktop order flow frame: a focused top bar (back, brand, steps) and a centred
 * content area. Cart, checkout and payment share it so the three read as one path.
 */
const FlowShell: React.FC<FlowShellProps> = ({ step, complete, onBack, backDisabled, action, children }) => {
    const { t, language } = useLanguage();
    const current = STEPS.indexOf(step);
    const labels: Record<FlowStep, string> = {
        cart: t('cart.title'),
        checkout: t('checkout.title'),
        payment: t('checkout.payment_page_title'),
    };

    return (
        <div className="dfs">
            <header className="dfs-bar">
                <div className="dfs-bar-side">
                    {onBack && (
                        <button type="button" className="dfs-back" onClick={onBack} disabled={backDisabled} aria-label={t('common.back')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                        </button>
                    )}
                    <a className="dfs-brand" href={`/${language}/restaurants`}>
                        <span className="dfs-brand-accent">MESTI</span>DELIVERY
                    </a>
                </div>

                <ol className="dfs-steps" aria-label="Checkout steps">
                    {STEPS.map((s, i) => {
                        const done = complete || i < current;
                        const active = !complete && i === current;
                        return (
                            <li key={s} className={`dfs-step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`} aria-current={active ? 'step' : undefined}>
                                <span className="dfs-step-dot">{done ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                                <span className="dfs-step-label">{labels[s]}</span>
                            </li>
                        );
                    })}
                </ol>

                <div className="dfs-bar-side dfs-bar-side--end">{action}</div>
            </header>

            <main className="dfs-main">{children}</main>
        </div>
    );
};

export default FlowShell;
