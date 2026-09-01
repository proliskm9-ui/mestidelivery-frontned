import React, { useState } from 'react';
import './PartnerForm.css';
import { useLanguage } from '../../translations/LanguageContext';

interface PartnerFormProps {
    type: 'restaurant' | 'courier';
    onClose: () => void;
}

const PartnerForm: React.FC<PartnerFormProps> = ({ type, onClose }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        company_name: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                type,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                email: formData.email.trim(),
                company_name: formData.company_name.trim(),
                message: formData.message.trim(),
            };

            const response = await fetch('/api/partners/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const detail = data?.detail ?? data?.error ?? data?.message;
                let message = t('partner.form.error_submit');
                if (typeof detail === 'string' && detail.trim()) {
                    message = detail;
                } else if (Array.isArray(detail) && detail.length > 0) {
                    message = detail
                        .map((item: { msg?: string }) => item?.msg)
                        .filter(Boolean)
                        .join('. ') || message;
                }
                throw new Error(message);
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || t('partner.form.error_generic'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const isFormReady =
        formData.name.trim().length > 0 &&
        formData.phone.trim().length > 0 &&
        (type !== 'restaurant' || formData.company_name.trim().length > 0);

    if (success) {
        return (
            <div className="partner-form-overlay partner-form-overlay--success" onClick={onClose}>
                <div className="partner-form-modal partner-form-success" onClick={(e) => e.stopPropagation()}>
                    <div className="partner-success">
                        <div className="partner-success-icon" aria-hidden="true">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="partner-success-title">{t('partner.form.success_title')}</h2>
                        <p className="partner-success-text">
                            {t('partner.form.success_text')}
                        </p>
                        <button type="button" className="partner-success-btn" onClick={onClose}>
                            {t('partner.form.close')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="partner-form-overlay" onClick={onClose}>
            <div className="partner-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-accent"></div>
                <button
                    type="button"
                    className="partner-form-close"
                    onClick={onClose}
                    aria-label={t('partner.form.close')}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="form-head">
                    <div className="form-badge">
                        {type === 'restaurant' ? t('partner.form.badge_restaurant') : t('partner.form.badge_courier')}
                    </div>
                    <h1>
                        {type === 'restaurant'
                            ? t('partner.form.title_restaurant')
                            : t('partner.form.title_courier')}
                    </h1>
                    <p>
                        {type === 'restaurant'
                            ? t('partner.form.desc_restaurant')
                            : t('partner.form.desc_courier')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="premium-form">
                    <div className="input-row">
                        <div className="premium-input-group">
                            <label>{t('partner.form.name_label')}</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder={t('partner.form.name_ph')}
                            />
                        </div>
                    </div>

                    <div className="input-row side-by-side">
                        <div className="premium-input-group">
                            <label>{t('partner.form.phone_label')}</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="+995 5xx xxx xxx"
                            />
                        </div>
                        <div className="premium-input-group">
                            <label>{t('partner.form.email_label')}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="example@mail.com"
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {type === 'restaurant' && (
                        <div className="input-row">
                            <div className="premium-input-group">
                                <label>{t('partner.form.company_label')}</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('partner.form.company_ph')}
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-row">
                        <div className="premium-input-group">
                            <label>{t('partner.form.extra_label')}</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={3}
                                placeholder={type === 'restaurant'
                                    ? t('partner.form.extra_ph_restaurant')
                                    : t('partner.form.extra_ph_courier')}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="form-error-pill">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`premium-submit-btn${isFormReady ? ' is-ready' : ''}`}
                        disabled={loading || !isFormReady}
                    >
                        {loading ? t('partner.form.submitting') : t('partner.form.submit')}
                    </button>
                    
                    <p className="form-footer-note">
                        {t('partner.form.terms')}
                    </p>
                </form>
            </div>
        </div>
    );
};

export default PartnerForm;
