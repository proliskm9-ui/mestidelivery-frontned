import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../translations/LanguageContext';
import './CompleteProfileModal.css';

interface Props {
  onSuccess: (token: string) => void;
}

/**
 * First-time Google customers: name + phone → backend JWT.
 * Identity comes from sessionStorage (not a live Firebase session).
 */
const CompleteProfileModal: React.FC<Props> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const {
    pendingGoogleIdentity,
    needsProfileCompletion,
    completeCustomerProfile,
    errorKey,
    clearError,
  } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (pendingGoogleIdentity?.displayName) {
      setDisplayName(pendingGoogleIdentity.displayName);
    }
  }, [pendingGoogleIdentity]);

  if (!needsProfileCompletion || !pendingGoogleIdentity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    setSaving(true);
    try {
      const token = await completeCustomerProfile(displayName, phone);
      onSuccess(token);
    } catch (err: any) {
      setLocalError(err?.message || (errorKey ? t(errorKey) : t('auth.errors.generic')));
    } finally {
      setSaving(false);
    }
  };

  const displayError = localError || (errorKey ? t(errorKey) : '');

  return (
    <div className="cpm-overlay" role="dialog" aria-modal="true" aria-labelledby="cpm-title">
      <div className="cpm-card">
        <h2 id="cpm-title" className="cpm-title">{t('auth.complete_profile_title')}</h2>
        <p className="cpm-subtitle">{t('auth.complete_profile_desc')}</p>
        {pendingGoogleIdentity.email ? (
          <p className="cpm-subtitle" style={{ marginTop: -8, opacity: 0.7 }}>
            {pendingGoogleIdentity.email}
          </p>
        ) : null}

        {displayError ? <div className="cpm-error">{displayError}</div> : null}

        <form onSubmit={handleSubmit} className="cpm-form">
          <label className="cpm-label">
            {t('auth.full_name')}
            <input
              className="cpm-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="cpm-label">
            {t('auth.phone_number')}
            <input
              className="cpm-input"
              type="tel"
              inputMode="tel"
              placeholder="+995 ..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="cpm-submit" disabled={saving}>
            {saving ? t('auth.please_wait') : t('auth.continue')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfileModal;
