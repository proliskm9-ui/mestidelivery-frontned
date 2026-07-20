import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../translations/LanguageContext';
import './StaffLogin.css';

/** Firebase email/password partner login — no registration, no Google */
const PartnerLoginPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { signInPartner, role, loading: authLoading, errorKey, clearError, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authLoading && user && role === 'partner') {
    return <Navigate to="/partners" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await signInPartner(email, password);
      navigate('/partners', { replace: true });
    } catch {
      /* errorKey set in context */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-page">
      <div className="staff-login-card">
        <h1 className="staff-login-title">{t('auth.partner_login_title')}</h1>
        <p className="staff-login-subtitle">{t('auth.partner_login_desc')}</p>

        {errorKey && <div className="staff-login-error">{t(errorKey)}</div>}

        <form onSubmit={handleSubmit} className="staff-login-form">
          <input
            className="staff-login-input"
            type="email"
            autoComplete="username"
            placeholder={t('auth.email_address')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            className="staff-login-input"
            type="password"
            autoComplete="current-password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="staff-login-btn" disabled={loading || authLoading}>
            {loading ? t('auth.please_wait') : t('auth.sign_in')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PartnerLoginPage;
