import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Login.css';
import { useLanguage } from '../translations/LanguageContext';

const ResetPasswordPage: React.FC = () => {
    const { t, language } = useLanguage();
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError(t('auth.reset_password_short'));
            return;
        }
        if (password !== confirm) {
            setError(t('auth.reset_password_mismatch'));
            return;
        }
        if (!token) {
            setError(t('auth.reset_missing_token'));
            return;
        }
        setLoading(true);
        try {
            const API_URL = (import.meta as any).env.VITE_API_URL || '';
            const res = await fetch(`${API_URL}/api/auth/customer/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(data?.error || t('auth.reset_error'));
            }
            setDone(true);
        } catch (err: any) {
            setError(err?.message || t('auth.reset_error'));
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
                    <p className="auth-brand-tag">{t('auth.reset_title')}</p>
                </header>

                <div className="auth-panel">
                    {done ? (
                        <div className="auth-form">
                            <p className="auth-success" role="status">{t('auth.reset_success')}</p>
                            <Link to={`/${language}/login`} className="auth-cta auth-cta-link">{t('auth.back_to_login')}</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <p className="auth-hint">{t('auth.reset_desc')}</p>
                            <label className="auth-field auth-field--full">
                                <input
                                    type="password"
                                    placeholder={t('auth.new_password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </label>
                            <label className="auth-field auth-field--full">
                                <input
                                    type="password"
                                    placeholder={t('auth.confirm_password')}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />
                            </label>
                            {error ? <div className="auth-error" role="alert">{error}</div> : null}
                            <button type="submit" className="auth-cta" disabled={loading || !token}>
                                {loading ? t('auth.please_wait') : t('auth.reset_submit')}
                            </button>
                            <Link to={`/${language}/login`} className="auth-link-btn auth-link-btn--block">{t('auth.back_to_login')}</Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
