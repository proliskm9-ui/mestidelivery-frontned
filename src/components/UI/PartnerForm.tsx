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
            // Updated to relative path
            const response = await fetch('/api/partners/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    ...formData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Ошибка отправки заявки');
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

    if (success) {
        return (
            <div className="partner-form-overlay" onClick={onClose}>
                <div className="partner-form-modal success" onClick={(e) => e.stopPropagation()}>
                    <div className="success-lottie">
                        <div className="success-icon">✓</div>
                    </div>
                    <h2>Заявка принята!</h2>
                    <p>Наш менеджер свяжется с вами в ближайшее время для уточнения деталей.</p>
                    <button className="done-btn" onClick={onClose}>Закрыть</button>
                </div>
            </div>
        );
    }

    return (
        <div className="partner-form-overlay" onClick={onClose}>
            <div className="partner-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-accent"></div>
                <button className="close-btn-minimal" onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <div className="form-head">
                    <div className="form-badge">
                        {type === 'restaurant' ? 'ПАРТНЁРСТВО' : 'РАБОТА'}
                    </div>
                    <h1>
                        {type === 'restaurant' ? 'Разместите ваш ресторан' : 'Станьте курьером MestiGo'}
                    </h1>
                    <p>
                        {type === 'restaurant' 
                            ? 'Присоединяйтесь к крупнейшей сети доставки в Местии и начните получать больше заказов.'
                            : 'Доставляйте заказы в свободное время и получайте выплаты каждую неделю.'}
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

                    <button type="submit" className="premium-submit-btn" disabled={loading}>
                        <span>{loading ? 'Отправляем данные...' : 'Отправить заявку'}</span>
                        {!loading && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>}
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
