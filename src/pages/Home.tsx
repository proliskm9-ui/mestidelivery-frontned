import React, { useState } from 'react';
import './Home.css';
import TrailButton from '../components/UI/TrailButton';
import PartnerForm from '../components/UI/PartnerForm';
import { useLanguage } from '../translations/LanguageContext';

const HomePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const [showPartnerForm, setShowPartnerForm] = useState(false);
    const [partnerType, setPartnerType] = useState<'restaurant' | 'courier'>('restaurant');

    const openPartnerForm = (type: 'restaurant' | 'courier') => {
        setPartnerType(type);
        setShowPartnerForm(true);
    };
    return (
        <div className="home-page" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            <div className="home-bg" />
            <header className="hero">
                <h1 className="hero-title">
                    <span className="filled">{t('home.hero_title_1')}</span>
                    <span>{t('home.hero_title_2')}</span>
                </h1>
                <p className="hero-subtitle">
                    {t('home.hero_subtitle')}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <TrailButton onClick={() => onNavigate('menu')}>
                        {t('home.order_now')}
                    </TrailButton>
                </div>
            </header>

            {/* Partners Section */}
            <section className="partners-section">
                <div className="partners-header">
                    <h2>{t('home.partners_title') || 'Развивайте бизнес вместе с нами'}</h2>
                    <p>{t('home.partners_subtitle') || 'Присоединяйтесь к платформе MestiGo и получайте новые возможности'}</p>
                </div>
                
                <div className="partners-grid">
                    <div className="partner-card">
                        <div className="partner-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        </div>
                        <h3>Для ресторанов</h3>
                        <p>Увеличьте выручку, получая заказы через наше приложение. Удобная панель управления и прозрачная статистика.</p>
                        <button className="partner-btn" onClick={() => openPartnerForm('restaurant')}>Подключить заведение</button>
                    </div>

                    <div className="partner-card">
                        <div className="partner-icon" style={{ borderColor: 'rgba(255, 214, 10, 0.3)', color: '#FFD60A', background: 'rgba(255, 214, 10, 0.1)' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <h3>Для курьеров</h3>
                        <p>Доставляйте заказы в удобное время. Гибкий график, еженедельные выплаты и поддержка на каждом этапе.</p>
                        <button className="partner-btn" style={{ background: 'rgba(255, 214, 10, 0.1)', color: '#FFD60A' }} onClick={() => openPartnerForm('courier')}>Стать курьером</button>
                    </div>
                </div>
            </section>

            {showPartnerForm && (
                <PartnerForm 
                    type={partnerType} 
                    onClose={() => setShowPartnerForm(false)} 
                />
            )}
        </div>
    );
};

export default HomePage;
