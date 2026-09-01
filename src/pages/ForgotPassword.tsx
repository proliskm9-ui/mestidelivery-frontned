import React, { useState } from 'react';
import './Login.css';
import { useLanguage } from '../translations/LanguageContext';

interface ForgotPasswordProps {
    onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const API_URL = (import.meta as any).env.VITE_API_URL || '';
            const res = await fetch(`${API_URL}/api/auth/customer/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || t('auth.forgot_error'));
            }
            setSent(true);
        } catch (err: any) {
            setError(err?.message || t('auth.forgot_error'));
        } finally {
            setLoading(false);
        }
    };

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
                    <p className="auth-brand-tag">{t('auth.forgot_title')}</p>
                </header>

                <div className="auth-panel">
                    {sent ? (
                        <div className="auth-form">
                            <p className="auth-success" role="status">{t('auth.forgot_sent')}</p>
                            <p className="auth-verify-email">
                                {t('auth.forgot_sent_to')}: <strong>{email}</strong>
                            </p>
                            <p className="auth-verify-hint">{t('auth.forgot_spam_hint')}</p>
                            <button type="button" className="auth-cta" onClick={onBack}>
                                {t('auth.back_to_login')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <p className="auth-hint">{t('auth.forgot_desc')}</p>
                            <label className="auth-field auth-field--full">
                                <input
                                    type="email"
                                    placeholder={t('auth.email_address')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </label>
                            {error ? <div className="auth-error" role="alert">{error}</div> : null}
                            <button type="submit" className="auth-cta" disabled={loading}>
                                {loading ? t('auth.please_wait') : t('auth.forgot_submit')}
                            </button>
                            <button type="button" className="auth-link-btn auth-link-btn--muted auth-link-btn--block" onClick={onBack}>
                                {t('auth.back_to_login')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
