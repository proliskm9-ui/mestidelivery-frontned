import React from 'react';
import { useLanguage } from '../../translations/LanguageContext';
import './NetworkErrorState.css';

interface NetworkErrorStateProps {
    onRetry?: () => void;
}

const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({ onRetry }) => {
    const { t } = useLanguage();

    const handleRetry = () => {
        if (onRetry) onRetry();
        else window.location.reload();
    };

    return (
        <section className="nes" role="alert" aria-live="polite">
            <div className="nes-glow nes-glow--a" aria-hidden="true" />
            <div className="nes-glow nes-glow--b" aria-hidden="true" />

            <div className="nes-inner">
                <div className="nes-visual" aria-hidden="true">
                    <span className="nes-ring" />
                    <div className="nes-icon">
                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                className="nes-wave nes-wave--3"
                                d="M8 20c8.8-8.8 23.2-8.8 32 0"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                            />
                            <path
                                className="nes-wave nes-wave--2"
                                d="M13.5 25.5c5.8-5.8 15.2-5.8 21 0"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                            />
                            <path
                                className="nes-wave"
                                d="M19 31c2.8-2.8 7.2-2.8 10 0"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                            />
                            <circle cx="24" cy="37" r="2.6" fill="currentColor" />
                            <path
                                d="M15 12.5l18 23"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                opacity="0.95"
                            />
                        </svg>
                    </div>
                </div>

                <h3 className="nes-title">{t('common.network_error_title')}</h3>
                <p className="nes-desc">{t('common.network_error_desc')}</p>

                <button type="button" className="nes-btn" onClick={handleRetry}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-2.6-6.3" />
                        <polyline points="21 3 21 9 15 9" />
                    </svg>
                    {t('common.reload')}
                </button>
            </div>
        </section>
    );
};

export default NetworkErrorState;
