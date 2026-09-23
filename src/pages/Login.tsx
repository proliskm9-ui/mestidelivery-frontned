import React, { useEffect, useState } from 'react';
import './Login.css';
import { useLanguage } from '../translations/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { preloadGoogleAuth } from '../auth/googleSignIn';

interface LoginPageProps {
    onLogin: (token: string) => void;
    onForgotPassword?: () => void;
}

const IconMail = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);
const IconLock = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const IconUser = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);
const IconPhone = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);
const IconEye = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const IconEyeOff = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);
const IconLoader = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="auth-spin">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
);

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onForgotPassword }) => {
    const { t } = useLanguage();
    const { signInWithGoogle, clearError, errorKey } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        void preloadGoogleAuth();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const authError = params.get('error');
        if (authError) {
            setError(t('auth.errors.generic'));
        }

        const waitingRedirect = sessionStorage.getItem('mesti_google_redirect') === '1';
        if (waitingRedirect) {
            setGoogleLoading(true);
        }

        const stopWait = () => setGoogleLoading(false);
        window.addEventListener('mestigo-google-token', stopWait);
        window.addEventListener('mestigo-google-pending', stopWait);
        window.addEventListener('mestigo-google-failed', stopWait);

        // Safety net: never spin forever if redirect/auth consume stalls
        let watchdog: number | undefined;
        if (waitingRedirect) {
            watchdog = window.setTimeout(() => {
                sessionStorage.removeItem('mesti_google_redirect');
                setGoogleLoading(false);
            }, 12000);
        }

        return () => {
            if (watchdog !== undefined) window.clearTimeout(watchdog);
            window.removeEventListener('mestigo-google-token', stopWait);
            window.removeEventListener('mestigo-google-pending', stopWait);
            window.removeEventListener('mestigo-google-failed', stopWait);
        };
    }, [t]);

    useEffect(() => {
        if (errorKey) setError(t(errorKey));
    }, [errorKey, t]);

    const switchMode = (login: boolean) => {
        setIsLogin(login);
        setError('');
        clearError();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        clearError();

        // Registration requires a verified phone (Firebase SMS via /static/mesti-phone-auth.js)
        const phoneAuth = (window as any).MestiPhoneAuth;
        if (!isLogin && phoneAuth && !phoneAuth.isVerified(phone)) {
            try {
                await phoneAuth.open({ phone });
            } catch {
                return;
            }
        }
        setLoading(true);

        const endpoint = isLogin ? '/api/auth/customer/login' : '/api/auth/customer/register';
        const body = !isLogin
            ? { email, password, full_name: fullName, phone, firebase_token: (phoneAuth && phoneAuth.getVerifiedToken()) || '' }
            : { email, password };

        try {
            const API_URL = (import.meta as any).env.VITE_API_URL || '';
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            let data: any = null;
            try {
                data = await res.json();
            } catch {
                throw new Error(t('auth.error_auth'));
            }

            if (!res.ok) {
                const raw = typeof data?.detail === 'string'
                    ? data.detail
                    : typeof data?.error === 'string'
                        ? data.error
                        : Array.isArray(data?.detail)
                            ? data.detail.map((d: any) => d.msg || d).join(', ')
                            : '';
                const detail = !raw || /unexpected error/i.test(raw)
                    ? t('auth.error_auth')
                    : raw;
                throw new Error(detail);
            }
            if (!data?.token) throw new Error(t('auth.error_auth'));

            if (!isLogin) {
                if (phone) localStorage.setItem('user_phone', phone);
                if (fullName) localStorage.setItem('user_name', fullName);
            }
            onLogin(data.token);
        } catch (err: any) {
            setError(err?.message || t('auth.error_auth'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        clearError();
        setGoogleLoading(true);
        let keepLoading = false;
        try {
            const result = await signInWithGoogle();
            if (result.status === 'ready') {
                onLogin(result.token);
            } else if (result.status === 'redirecting') {
                keepLoading = true;
                return;
            }
        } catch (err: any) {
            const code = String(err?.code || err?.message || '');
            if (code === 'redirecting') {
                keepLoading = true;
                return;
            }
            if (/unauthorized-domain/i.test(code)) {
                setError('Google пока не подключён к mestidelivery.com. Войдите по email и паролю — это работает.');
            } else {
                setError(!code || /unexpected error|Google auth failed/i.test(code)
                    ? t('auth.errors.generic')
                    : code);
            }
        } finally {
            if (!keepLoading) setGoogleLoading(false);
        }
    };

    const busy = loading || googleLoading;

    return (
        <div className="login-page">
            <div className="auth-atmosphere" aria-hidden>
                <div className="auth-sky" />
                <img
                    className="auth-mtn auth-mtn--back"
                    src="/Assets/Loading/mountains-background.png"
                    alt=""
                />
                <img
                    className="auth-mtn auth-mtn--front"
                    src="/Assets/Loading/mountains-foreground.png"
                    alt=""
                />
                <div className="auth-veil" />
                <div className="auth-green-wash" />
            </div>

            <div className="auth-stage">
                <header className="auth-brand">
                    <img
                        className="auth-brand-mark"
                        src="/Assets/general-green.png"
                        alt=""
                    />
                    <h1 className="auth-brand-name">MestiDelivery</h1>
                    <p className="auth-brand-tag">{t('auth.brand_tagline')}</p>
                </header>

                <div className={`auth-panel ${!isLogin ? 'auth-panel--register' : ''}`}>
                    <nav className="auth-tabs" role="tablist" aria-label="auth mode">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isLogin}
                            className={`auth-tab ${isLogin ? 'is-active' : ''}`}
                            onClick={() => switchMode(true)}
                        >
                            {t('auth.sign_in')}
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={!isLogin}
                            className={`auth-tab ${!isLogin ? 'is-active' : ''}`}
                            onClick={() => switchMode(false)}
                        >
                            {t('auth.register')}
                        </button>
                    </nav>

                    <form
                        onSubmit={handleSubmit}
                        className={`auth-form ${!isLogin ? 'auth-form--register' : ''}`}
                    >
                        {!isLogin && (
                            <>
                                <label className="auth-field">
                                    <span className="auth-field-icon"><IconUser /></span>
                                    <input
                                        type="text"
                                        placeholder={t('auth.full_name')}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        autoComplete="name"
                                    />
                                </label>
                                <label className="auth-field">
                                    <span className="auth-field-icon"><IconPhone /></span>
                                    <input
                                        type="tel"
                                        placeholder={t('auth.phone_number')}
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                        autoComplete="tel"
                                    />
                                </label>
                            </>
                        )}

                        <label className="auth-field auth-field--full">
                            <span className="auth-field-icon"><IconMail /></span>
                            <input
                                type="email"
                                placeholder={t('auth.email_address')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </label>

                        <div className="auth-password-group">
                            <label className="auth-field auth-field--full">
                                <span className="auth-field-icon"><IconLock /></span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t('auth.password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    className="auth-eye"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                                >
                                    {showPassword ? <IconEyeOff /> : <IconEye />}
                                </button>
                            </label>
                            {isLogin && onForgotPassword ? (
                                <div className="auth-password-meta">
                                    <button
                                        type="button"
                                        className="auth-forgot-link"
                                        onClick={onForgotPassword}
                                    >
                                        {t('auth.forgot_password')}
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        {error ? <div className="auth-error" role="alert">{error}</div> : null}

                        <button type="submit" className="auth-cta" disabled={busy}>
                            {loading ? <IconLoader /> : (isLogin ? t('auth.sign_in') : t('auth.create_account'))}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>{t('auth.or')}</span>
                    </div>

                    <button
                        type="button"
                        className="auth-google"
                        onClick={handleGoogle}
                        disabled={busy}
                        aria-busy={googleLoading}
                    >
                        {googleLoading ? <IconLoader /> : <GoogleIcon />}
                        <span>{t('auth.google_continue')}</span>
                    </button>

                    <p className="auth-legal">{t('auth.terms_privacy')}</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
