import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Login.css';
import { useLanguage } from '../translations/LanguageContext';

const VerifyEmailPage: React.FC = () => {
    const { t } = useLanguage();
    const [params] = useSearchParams();
    const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = params.get('token');
        if (!token) {
            setState('error');
            setMessage(t('auth.verify_missing_token'));
            return;
        }

        const API_URL = (import.meta as any).env.VITE_API_URL || '';
        fetch(`${API_URL}/api/auth/customer/verify-email?token=${encodeURIComponent(token)}`)
            .then(async (res) => {
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    throw new Error(data?.error || t('auth.verify_error'));
                }
                setState('success');
            })
            .catch((err: any) => {
                setState('error');
                setMessage(err?.message || t('auth.verify_error'));
            });
    }, [params, t]);

    return (
        <div className="login-page">
            <div className="auth-atmosphere" aria-hidden>
                <div className="auth-sky" />
                <img className="auth-mtn auth-mtn--back" src="/Assets/Loading/mountains-background.png" alt="" />
                <img className="auth-mtn auth-mtn--front" src="/Assets/Loading/mountains-foreground.png" alt="" />
                <div className="auth-veil" />
                <div className="auth-green-wash" />
            </div>

            <div className="auth-stage">
                <header className="auth-brand">
                    <img className="auth-brand-mark" src="/Assets/general-green.png" alt="" />
                    <h1 className="auth-brand-name">MestiDelivery</h1>
                    <p className="auth-brand-tag">{t('auth.verify_title')}</p>
                </header>

                <div className="auth-panel">
                    <div className="auth-form">
                        {state === 'loading' && <p className="auth-hint">{t('auth.please_wait')}</p>}
                        {state === 'success' && (
                            <>
                                <p className="auth-success" role="status">{t('auth.verify_success')}</p>
                                <Link to="/ru/login" className="auth-cta auth-cta-link">{t('auth.back_to_login')}</Link>
                            </>
                        )}
                        {state === 'error' && (
                            <>
                                <div className="auth-error" role="alert">{message}</div>
                                <Link to="/ru/login" className="auth-link-btn auth-link-btn--block">{t('auth.back_to_login')}</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
