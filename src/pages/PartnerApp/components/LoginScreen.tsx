import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Loader2, Lock, User } from 'lucide-react';
import { useLanguage } from '../../../translations/LanguageContext';
import { PartnerLangPicker } from './PartnerLangPicker';

export const LoginScreen: React.FC = () => {
  const login = useStore(state => state.login);
  const isLoading = useStore(state => state.isLoading);
  const { t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError(t('partnerApp.login.err_user')); return; }
    if (!password.trim()) { setError(t('partnerApp.login.err_pass')); return; }
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('partnerApp.login.err_auth'));
    }
  };

  return (
    <div className="partner-login">
      <div className="partner-login__atmosphere" aria-hidden>
        <div className="partner-login__sky" />
        <img
          className="partner-login__mtn partner-login__mtn--back"
          src="/Assets/Loading/mountains-background.png"
          alt=""
        />
        <img
          className="partner-login__mtn partner-login__mtn--front"
          src="/Assets/Loading/mountains-foreground.png"
          alt=""
        />
        <div className="partner-login__veil" />
        <div className="partner-login__wash" />
      </div>

      <div className="partner-login__stage">
        <header className="partner-login__brand">
          <img
            className="partner-login__logo"
            src="/Assets/general-green.png"
            alt=""
          />
          <h1 className="partner-login__title">MestiDelivery</h1>
          <p className="partner-login__sub">{t('partnerApp.login.sub')}</p>
          <PartnerLangPicker compact />
        </header>

        <div className="partner-login__card">
          <div className="partner-login__card-head">
            <p className="partner-login__eyebrow">{t('partnerApp.login.eyebrow')}</p>
            <h2 className="partner-login__card-title">{t('partnerApp.login.card_title')}</h2>
          </div>

          {error && <div className="partner-login__error">{error}</div>}

          <form onSubmit={handleSubmit} className="partner-login__form">
            <label className="partner-login__field">
              <span className="partner-login__field-icon"><User size={18} /></span>
              <input
                type="text"
                placeholder={t('partnerApp.login.username_ph')}
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isLoading}
                autoCapitalize="none"
                autoComplete="username"
                autoFocus
              />
            </label>

            <label className="partner-login__field">
              <span className="partner-login__field-icon"><Lock size={18} /></span>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={t('partnerApp.login.password_ph')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="partner-login__eye"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? t('partnerApp.login.hide') : t('partnerApp.login.show')}
              </button>
            </label>

            <button type="submit" className="partner-login__submit" disabled={isLoading}>
              {isLoading ? <Loader2 size={18} className="spin" /> : null}
              {t('partnerApp.login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
