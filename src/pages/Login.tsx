import React, { useState } from 'react';
import './Login.css';
import { useLanguage } from '../translations/LanguageContext';

interface LoginPageProps {
    onLogin: (token: string) => void;
}

// Minimal Icons (replacing Lucide)
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const IconMail = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
const IconLock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconPhone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const IconEyeOff = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
const IconLoader = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin"><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" /></svg>;


const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Mouse move effect for thermal gradient
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        target.style.setProperty('--input-x', `${x}px`);
        target.style.setProperty('--input-y', `${y}px`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // API routes are mounted under /api in main.py
        const endpoint = isLogin ? '/api/auth/customer/login' : '/api/auth/customer/register';
        const body = !isLogin
            ? { email, password, full_name: fullName, phone }
            : { email, password };

        try {
            const API_URL = (import.meta as any).env.VITE_API_URL || '';

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || t('auth.error_auth'));
            }

            if (data.token) {
                if (!isLogin) {
                    if (phone) localStorage.setItem('user_phone', phone);
                    if (fullName) localStorage.setItem('user_name', fullName);
                }
                onLogin(data.token);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Dynamic Background */}
            <div className="auth-blobs">
                <div className="auth-blob blob-1" />
                <div className="auth-blob blob-2" />
                <div className="auth-blob blob-3" />
            </div>
            <div className="auth-bg-noise" />

            <div className={`auth-container ${!isLogin ? 'auth-container-wide' : ''}`}>

                {/* Logo */}
                <div className="auth-logo">
                    <img src="/Assets/general-green.png" alt="MESTIGO" />
                </div>

                {/* Auth Card */}
                <div className="auth-card">
                    <div className="auth-card-content">
                        <h1>{isLogin ? t('auth.welcome_back') : t('auth.join_mestigo')}</h1>
                        <p className="auth-subtitle">
                            {isLogin ? t('auth.sign_in_desc') : t('auth.register_desc')}
                        </p>

                        <form onSubmit={handleSubmit} className={`auth-form ${!isLogin ? 'registration-grid' : ''}`}>

                            {!isLogin && (
                                <>
                                    <div className="auth-input-group" onMouseMove={handleMouseMove}>
                                        <span className="auth-input-icon"><IconUser /></span>
                                        <input
                                            type="text"
                                            placeholder={t('auth.full_name')}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="auth-input-group" onMouseMove={handleMouseMove}>
                                        <span className="auth-input-icon"><IconPhone /></span>
                                        <input
                                            type="tel"
                                            placeholder={t('auth.phone_number')}
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <div className="auth-input-group full-width" onMouseMove={handleMouseMove}>
                                <span className="auth-input-icon"><IconMail /></span>
                                <input
                                    type="email"
                                    placeholder={t('auth.email_address')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="auth-input-group full-width" onMouseMove={handleMouseMove}>
                                <span className="auth-input-icon"><IconLock /></span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t('auth.password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <IconEyeOff /> : <IconEye />}
                                </button>
                            </div>

                            {error && <div className="auth-error">{error}</div>}

                            <button
                                type="submit"
                                className="auth-submit-btn full-width"
                                disabled={loading}
                            >
                                {loading ? <IconLoader /> : (isLogin ? t('auth.sign_in') : t('auth.create_account'))}
                            </button>
                        </form>

                        <button
                            className="auth-switch-btn"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                        >
                            {isLogin ? t('auth.dont_have_account') : t('auth.already_have_account')}
                        </button>
                    </div>
                </div>

                <div className="auth-footer">
                    {t('auth.terms_privacy')}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
