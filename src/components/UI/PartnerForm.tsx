import React, { useState } from 'react';
import './PartnerForm.css';

interface PartnerFormProps {
    type: 'restaurant' | 'courier';
    onClose: () => void;
}

const PartnerForm: React.FC<PartnerFormProps> = ({ type, onClose }) => {
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
                let message = 'Ошибка отправки заявки';
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
            setError(err.message || 'Произошла ошибка. Попробуйте позже.');
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
                        <h2 className="partner-success-title">Заявка принята!</h2>
                        <p className="partner-success-text">
                            Наш менеджер свяжется с вами в ближайшее время для уточнения деталей.
                        </p>
                        <button type="button" className="partner-success-btn" onClick={onClose}>
                            Закрыть
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
                    aria-label="Close"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="form-head">
                    <div className="form-badge">
                        {type === 'restaurant' ? 'ПАРТНЁРСТВО' : 'КУРЬЕРАМ'}
                    </div>
                    <h1>
                        {type === 'restaurant'
                            ? 'Разместите ваш ресторан'
                            : 'Станьте курьером MestiDelivery'}
                    </h1>
                    <p>
                        {type === 'restaurant'
                            ? 'MestiDelivery объединяет все рестораны Местии в одном приложении. Разместите меню — и станьте видны каждому, кто ищет, где заказать еду в городе.'
                            : 'Доставляйте заказы в свободное время и получайте выплаты, когда удобно вам.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="premium-form">
                    <div className="input-row">
                        <div className="premium-input-group">
                            <label>Как вас зовут?</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Имя Фамилия"
                            />
                        </div>
                    </div>

                    <div className="input-row side-by-side">
                        <div className="premium-input-group">
                            <label>Телефон для связи</label>
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
                            <label>Ваш Email (необяз.)</label>
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
                                <label>Название заведения</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Напр. Cafe Laila"
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-row">
                        <div className="premium-input-group">
                            <label>Дополнительно</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={3}
                                placeholder={type === 'restaurant' 
                                    ? 'Адрес заведения, кухня, пожелания...'
                                    : 'Наличие транспорта, удобное время для работы...'}
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
                        {loading ? 'Отправляем данные...' : 'Отправить заявку'}
                    </button>
                    
                    <p className="form-footer-note">
                        Нажимая на кнопку, вы соглашаетесь с условиями оферты и политикой конфиденциальности.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default PartnerForm;
