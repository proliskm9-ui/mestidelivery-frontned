import React, { useState, useEffect } from 'react';
import FullPageLoader from '../../components/UI/FullPageLoader';
import { adminApi, type Restaurant } from '../../services/adminService';
import { TrashIcon } from '../../components/icons/StatusIcons';
import './AdminStyles.css';

type RestMode = 'new' | 'existing';

interface PartnerRequest {
    id: number;
    type: 'restaurant' | 'courier';
    name: string;
    phone: string;
    email?: string;
    company_name?: string;
    message?: string;
    status: 'pending' | 'contacted' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    notes?: string;
}

const EyeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

function FilterBtn({ active, onClick, children }: {
    active: boolean; onClick: () => void; children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? '#21ea7c' : '#222532',
                color: active ? '#0f1117' : '#9ca3af',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '100px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = '#2a2e3d';
                    e.currentTarget.style.color = '#fff';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = '#222532';
                    e.currentTarget.style.color = '#9ca3af';
                }
            }}
        >
            {children}
        </button>
    );
}

const AdminPartners: React.FC = () => {
    const [view, setView] = useState<'wizard' | 'requests'>('wizard');

    // --- WIZARD STATE ---
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
    const [role, setRole] = useState<'courier' | 'restaurant' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // User fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Restaurant fields
    const [restMode, setRestMode] = useState<RestMode>('new');
    const [restName, setRestName] = useState('');
    const [restAddress, setRestAddress] = useState('');
    const [restDelivery, setRestDelivery] = useState('30-45 min');
    const [existingRestaurants, setExistingRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestId, setSelectedRestId] = useState('');
    const [loadingRestaurants, setLoadingRestaurants] = useState(false);
    
    // Success Data
    const [createdPartner, setCreatedPartner] = useState<{role: string, username: string, pass: string, restaurant?: string} | null>(null);

    // --- REQUESTS STATE ---
    const [requests, setRequests] = useState<PartnerRequest[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (view === 'requests') {
            fetchRequests();
        }
    }, [view, filter]);

    useEffect(() => {
        if (wizardStep === 2 && role === 'restaurant') {
            loadExistingRestaurants();
        }
    }, [wizardStep, role]);

    const loadExistingRestaurants = async () => {
        setLoadingRestaurants(true);
        try {
            let data: Restaurant[] | null = null;
            try {
                data = await adminApi.get<Restaurant[]>('/restaurants/admin');
            } catch {
                data = await adminApi.get<Restaurant[]>('/restaurants/');
            }
            const list = Array.isArray(data) ? data : [];
            setExistingRestaurants(
                [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))
            );
        } catch (err) {
            console.error('Error loading restaurants:', err);
            setExistingRestaurants([]);
        } finally {
            setLoadingRestaurants(false);
        }
    };

    const fetchRequests = async () => {
        setRequestsLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            let url = '/api/partners/requests';
            if (filter !== 'all') {
                url += `?status_filter=${filter}`;
            }
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching partner requests:', error);
        } finally {
            setRequestsLoading(false);
        }
    };

    const updateStatus = async (requestId: number, status: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`/api/partners/requests/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status, notes })
            });
            if (response.ok) {
                fetchRequests();
                setSelectedRequest(null);
                setNotes('');
            }
        } catch (error) {
            console.error('Error updating request:', error);
        }
    };

    const deleteRequest = async (requestId: number) => {
        if (!confirm('Удалить эту заявку?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`/api/partners/requests/${requestId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchRequests();
            }
        } catch (error) {
            console.error('Error deleting request:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Новая',
            contacted: 'Связались',
            approved: 'Одобрена',
            rejected: 'Отклонена'
        };
        const label = labels[status] || status;
        return (
            <span className={`status-badge-capsule ${status}`}>
                {label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const isRest = type === 'restaurant';
        return (
            <span style={{ 
                padding: '6px 12px', 
                borderRadius: '12px', 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: isRest ? 'rgba(33, 234, 124, 0.08)' : 'rgba(255, 214, 10, 0.08)', 
                color: isRest ? '#21EA7C' : '#FFD60A',
                border: isRest ? '1px solid rgba(33, 234, 124, 0.15)' : '1px solid rgba(255, 214, 10, 0.15)',
                whiteSpace: 'nowrap'
            }}>
                {isRest ? '🏪 Ресторан' : '🚴 Курьер'}
            </span>
        );
    };

    // --- WIZARD SUBMIT ---
    const handleWizardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (username.length < 3) {
            setError('Username должен быть минимум 3 символа');
            return;
        }
        if (password.length < 6) {
            setError('Пароль должен быть минимум 6 символов');
            return;
        }
        if (role === 'restaurant') {
            if (restMode === 'new' && !restName.trim()) {
                setError('Укажите название ресторана');
                return;
            }
            if (restMode === 'existing' && !selectedRestId) {
                setError('Выберите ресторан из списка');
                return;
            }
        }

        setLoading(true);
        try {
            let linkedRestName = '';

            if (role === 'courier') {
                await adminApi.post('/admin/users', {
                    username,
                    password,
                    role: 'courier'
                });
            } else if (role === 'restaurant') {
                let actualRestId: string;

                if (restMode === 'existing') {
                    actualRestId = selectedRestId;
                    linkedRestName =
                        existingRestaurants.find(r => String(r.id) === String(selectedRestId))?.name ||
                        selectedRestId;
                } else {
                    const createdRest = await adminApi.post<any>('/restaurants/', {
                        name: restName,
                        address: restAddress,
                        delivery: restDelivery,
                        rating: '5.0',
                        img: '',
                        screen: 'restaurant-default'
                    });

                    actualRestId = createdRest?.restaurant?.id || createdRest?.id;
                    if (!actualRestId) {
                        throw new Error('Не удалось получить ID созданного ресторана от сервера');
                    }
                    linkedRestName = restName;
                }

                await adminApi.post('/admin/users', {
                    username,
                    password,
                    role: 'restaurant_admin',
                    restaurant_id: String(actualRestId)
                });
            }
            
            setCreatedPartner({
                role: role === 'courier' ? 'Курьер' : 'Ресторан',
                username,
                pass: password,
                restaurant: linkedRestName || undefined
            });
            setWizardStep(3);
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка при регистрации');
        } finally {
            setLoading(false);
        }
    };

    const resetWizard = () => {
        setRole(null);
        setUsername('');
        setPassword('');
        setRestMode('new');
        setRestName('');
        setRestAddress('');
        setRestDelivery('30-45 min');
        setSelectedRestId('');
        setCreatedPartner(null);
        setError('');
        setWizardStep(1);
    };

    const copyCredentials = () => {
        if (!createdPartner) return;
        const restLine = createdPartner.restaurant ? `\nРесторан: ${createdPartner.restaurant}` : '';
        const text = `Партнер: ${createdPartner.role}${restLine}\nЛогин: ${createdPartner.username}\nПароль: ${createdPartner.pass}\nСсылка для входа: https://mestidelivery.com/partners`;
        navigator.clipboard.writeText(text);
        alert('Данные партнера успешно скопированы!');
    };

    return (
        <div className="admin-content">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Партнеры</h1>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                    <FilterBtn active={view === 'wizard'} onClick={() => setView('wizard')}>
                        Регистрация
                    </FilterBtn>
                    <FilterBtn active={view === 'requests'} onClick={() => setView('requests')}>
                        Заявки на подключение
                    </FilterBtn>
                </div>
            </div>

            {view === 'wizard' && (
                <div className="admin-card-premium" style={{ maxWidth: '640px', margin: '0 auto', padding: '40px' }}>
                    
                    {wizardStep === 1 && (
                        <div className="fade-in-up">
                            <h2 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '1.6rem', fontWeight: 800 }}>Кого вы хотите зарегистрировать?</h2>
                            <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', marginBottom: '36px', fontSize: '0.95rem' }}>Выберите тип партнера для создания профиля и доступов</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div 
                                    onClick={() => { setRole('courier'); setWizardStep(2); }}
                                    style={{ 
                                        background: 'rgba(255, 214, 10, 0.02)', 
                                        border: '1px solid rgba(255, 214, 10, 0.12)', 
                                        borderRadius: '20px', 
                                        padding: '40px 24px', 
                                        textAlign: 'center', 
                                        cursor: 'pointer', 
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 214, 10, 0.4)';
                                        e.currentTarget.style.background = 'rgba(255, 214, 10, 0.05)';
                                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 214, 10, 0.12)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 214, 10, 0.12)';
                                        e.currentTarget.style.background = 'rgba(255, 214, 10, 0.02)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ 
                                        width: '70px', 
                                        height: '70px', 
                                        borderRadius: '50%', 
                                        background: 'rgba(255, 214, 10, 0.08)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '36px', 
                                        margin: '0 auto 20px',
                                        border: '1px solid rgba(255, 214, 10, 0.15)'
                                    }}>
                                        🚴
                                    </div>
                                    <h3 style={{ color: '#FFD60A', margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>Курьер</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', lineHeight: '1.5', margin: 0 }}>Создать аккаунт для курьера с доступом к приложению доставки</p>
                                </div>

                                <div 
                                    onClick={() => { setRole('restaurant'); setWizardStep(2); }}
                                    style={{ 
                                        background: 'rgba(33, 234, 124, 0.02)', 
                                        border: '1px solid rgba(33, 234, 124, 0.12)', 
                                        borderRadius: '20px', 
                                        padding: '40px 24px', 
                                        textAlign: 'center', 
                                        cursor: 'pointer', 
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.borderColor = 'rgba(33, 234, 124, 0.4)';
                                        e.currentTarget.style.background = 'rgba(33, 234, 124, 0.05)';
                                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(33, 234, 124, 0.12)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'rgba(33, 234, 124, 0.12)';
                                        e.currentTarget.style.background = 'rgba(33, 234, 124, 0.02)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ 
                                        width: '70px', 
                                        height: '70px', 
                                        borderRadius: '50%', 
                                        background: 'rgba(33, 234, 124, 0.08)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '36px', 
                                        margin: '0 auto 20px',
                                        border: '1px solid rgba(33, 234, 124, 0.15)'
                                    }}>
                                        🏪
                                    </div>
                                    <h3 style={{ color: '#21EA7C', margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800 }}>Ресторан</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', lineHeight: '1.5', margin: 0 }}>Создать профиль ресторана и аккаунт управляющего</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {wizardStep === 2 && (
                        <div className="fade-in-up">
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', gap: '16px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setWizardStep(1)} 
                                    className="btn-action-glass"
                                    style={{ width: '40px', height: '40px' }}
                                >
                                    ←
                                </button>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                                    Регистрация: {role === 'courier' ? 'Курьер 🚴' : 'Ресторан 🏪'}
                                </h2>
                            </div>

                            <form onSubmit={handleWizardSubmit} className="admin-form">
                                {error && (
                                    <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', color: '#ef4444', fontSize: '0.9rem', marginBottom: '24px' }}>
                                        {error}
                                    </div>
                                )}

                                {role === 'restaurant' && (
                                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                                        <h3 className="section-subtitle">Данные ресторана</h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                                            <button
                                                type="button"
                                                onClick={() => { setRestMode('new'); setError(''); }}
                                                style={{
                                                    background: restMode === 'new' ? 'rgba(33, 234, 124, 0.12)' : 'rgba(255,255,255,0.03)',
                                                    color: restMode === 'new' ? '#21EA7C' : 'var(--admin-text-muted)',
                                                    border: restMode === 'new' ? '1px solid rgba(33, 234, 124, 0.35)' : '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '12px',
                                                    padding: '12px 14px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Новый ресторан
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setRestMode('existing'); setError(''); }}
                                                style={{
                                                    background: restMode === 'existing' ? 'rgba(33, 234, 124, 0.12)' : 'rgba(255,255,255,0.03)',
                                                    color: restMode === 'existing' ? '#21EA7C' : 'var(--admin-text-muted)',
                                                    border: restMode === 'existing' ? '1px solid rgba(33, 234, 124, 0.35)' : '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '12px',
                                                    padding: '12px 14px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Существующий
                                            </button>
                                        </div>

                                        {restMode === 'existing' ? (
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Выберите ресторан</label>
                                                {loadingRestaurants ? (
                                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', padding: '10px 0' }}>
                                                        Загрузка списка...
                                                    </div>
                                                ) : existingRestaurants.length === 0 ? (
                                                    <div style={{ color: '#ef4444', fontSize: '0.9rem', padding: '10px 0' }}>
                                                        Рестораны не найдены. Создайте новый или заполните профиль в разделе «Рестораны».
                                                    </div>
                                                ) : (
                                                    <select
                                                        className="admin-input"
                                                        value={selectedRestId}
                                                        onChange={e => setSelectedRestId(e.target.value)}
                                                        required
                                                    >
                                                        <option value="">— Выберите ресторан —</option>
                                                        {existingRestaurants.map(r => (
                                                            <option key={r.id} value={String(r.id)}>
                                                                {r.name}{r.address ? ` · ${r.address}` : ''} ({r.id})
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: 'var(--admin-text-muted)', lineHeight: 1.4 }}>
                                                    Аккаунт партнёра будет привязан к уже заполненному профилю — дубль не создаётся.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="form-group">
                                                    <label className="form-label">Название ресторана</label>
                                                    <input className="admin-input" value={restName} onChange={e => setRestName(e.target.value)} placeholder="Например: Дом Кубдари" required={restMode === 'new'} />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Адрес</label>
                                                    <input className="admin-input" value={restAddress} onChange={e => setRestAddress(e.target.value)} placeholder="Например: ул. Ираклия Абашидзе 25" />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label">Время доставки (текст)</label>
                                                    <input className="admin-input" value={restDelivery} onChange={e => setRestDelivery(e.target.value)} placeholder="30-45 min" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '16px', marginBottom: '28px' }}>
                                    <h3 className="section-subtitle">Данные для входа в панель</h3>
                                    <div className="form-group">
                                        <label className="form-label">Username (Логин)</label>
                                        <input className="admin-input" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} placeholder={role === 'courier' ? "courier_ivan" : "restaurant_kubdari"} required minLength={3} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Пароль</label>
                                        <input type="password" className="admin-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 6 символов" required minLength={6} />
                                    </div>
                                </div>

                                <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }} disabled={loading || (role === 'restaurant' && restMode === 'existing' && (loadingRestaurants || !selectedRestId))}>
                                    {loading
                                        ? 'Создание профиля...'
                                        : role === 'restaurant' && restMode === 'existing'
                                            ? 'Привязать партнера'
                                            : 'Создать партнера'}
                                </button>
                            </form>
                        </div>
                    )}

                    {wizardStep === 3 && createdPartner && (
                        <div className="fade-in-up" style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                background: 'rgba(33, 234, 124, 0.1)', 
                                color: '#21EA7C', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '40px', 
                                margin: '0 auto 24px',
                                border: '2px solid rgba(33, 234, 124, 0.25)',
                                boxShadow: '0 0 24px rgba(33, 234, 124, 0.2)'
                            }}>
                                ✓
                            </div>
                            <h2 style={{ marginBottom: '10px', fontSize: '1.6rem', fontWeight: 800 }}>Партнер успешно зарегистрирован!</h2>
                            <p style={{ color: 'var(--admin-text-muted)', marginBottom: '32px', fontSize: '0.95rem' }}>Скопируйте эти данные и передайте их партнеру.</p>

                            <div className="admin-card-premium" style={{ 
                                padding: '24px', 
                                textAlign: 'left', 
                                marginBottom: '32px', 
                                display: 'inline-block', 
                                minWidth: '340px' 
                            }}>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--admin-text-muted)' }}>Роль:</span> 
                                    <strong style={{ color: '#fff' }}>{createdPartner.role}</strong>
                                </div>
                                {createdPartner.restaurant && (
                                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ color: 'var(--admin-text-muted)', flexShrink: 0 }}>Ресторан:</span>
                                        <strong style={{ color: '#fff', textAlign: 'right' }}>{createdPartner.restaurant}</strong>
                                    </div>
                                )}
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--admin-text-muted)' }}>Логин:</span> 
                                    <strong style={{ color: '#21EA7C', fontSize: '1.1rem' }}>{createdPartner.username}</strong>
                                </div>
                                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--admin-text-muted)' }}>Пароль:</span> 
                                    <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{createdPartner.pass}</strong>
                                </div>
                                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--admin-text-muted)', lineHeight: '1.5' }}>
                                    Ссылка для входа: <br/>
                                    <strong style={{ color: '#fff' }}>https://mestidelivery.com/partners</strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                <button className="admin-btn" style={{ height: '44px', padding: '0 24px' }} onClick={copyCredentials}>Копировать всё</button>
                                <button className="admin-btn admin-btn-primary" style={{ height: '44px', padding: '0 24px' }} onClick={resetWizard}>Добавить еще</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'requests' && (
                <>
                    {requestsLoading ? (
                        <FullPageLoader variant="list" />
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', width: '100%' }}>
                                {[
                                    { id: 'all', label: 'Все' },
                                    { id: 'pending', label: 'Новые' },
                                    { id: 'contacted', label: 'В работе' },
                                    { id: 'approved', label: 'Одобренные' }
                                ].map(item => (
                                    <FilterBtn 
                                        key={item.id} 
                                        active={filter === item.id} 
                                        onClick={() => setFilter(item.id)}
                                    >
                                        {item.label}
                                    </FilterBtn>
                                ))}
                            </div>
                            
                            {requests.length === 0 ? (
                                <div className="admin-card-premium" style={{ padding: '48px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Нет заявок в данной категории</p>
                                </div>
                            ) : (
                                <div className="admin-table-premium">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Тип</th>
                                                <th>Имя</th>
                                                <th>Телефон</th>
                                                <th>Email</th>
                                                <th>Статус</th>
                                                <th>Дата</th>
                                                <th style={{ textAlign: 'right' }}>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requests.map((r) => (
                                                <tr key={r.id}>
                                                    <td>#{r.id}</td>
                                                    <td>{getTypeBadge(r.type)}</td>
                                                    <td className="product-name-cell" style={{ fontWeight: 700 }}>{r.name}</td>
                                                    <td>{r.phone}</td>
                                                    <td>{r.email || '——'}</td>
                                                    <td>{getStatusBadge(r.status)}</td>
                                                    <td>{new Date(r.created_at).toLocaleDateString('ru-RU')}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="admin-action-btns-gap" style={{ justifyContent: 'flex-end' }}>
                                                            <button 
                                                                className="btn-action-glass btn-edit" 
                                                                title="Просмотр" 
                                                                onClick={() => { setSelectedRequest(r); setNotes(r.notes || ''); }}
                                                            >
                                                                <EyeIcon />
                                                            </button>
                                                            <button 
                                                                className="btn-action-glass btn-delete" 
                                                                title="Удалить" 
                                                                onClick={() => deleteRequest(r.id)}
                                                            >
                                                                <TrashIcon size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {selectedRequest && (
                <div className="admin-modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Заявка #{selectedRequest.id}</h2>
                            <button className="modal-close" onClick={() => setSelectedRequest(null)}>×</button>
                        </div>
                        <div className="modal-scroll-area">
                            <div className="admin-card-premium" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem' }}>Имя:</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{selectedRequest.name}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem' }}>Телефон:</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{selectedRequest.phone}</strong>
                                </div>
                                {selectedRequest.email && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem' }}>Email:</span>
                                        <strong style={{ fontSize: '1.1rem' }}>{selectedRequest.email}</strong>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem' }}>Тип партнера:</span>
                                    {getTypeBadge(selectedRequest.type)}
                                </div>
                                {selectedRequest.message && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.95rem' }}>Сообщение:</span>
                                        <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '16px', borderRadius: '12px', color: 'var(--admin-text)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            {selectedRequest.message}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group" style={{ marginTop: '12px' }}>
                                <label className="form-label">Заметки администратора</label>
                                <textarea 
                                    className="admin-input" 
                                    rows={4} 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)} 
                                    placeholder="Введите внутренние заметки по этой заявке..."
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="admin-btn admin-btn-danger" style={{ marginRight: 'auto', height: '44px', padding: '0 20px' }} onClick={() => updateStatus(selectedRequest.id, 'rejected')}>Отклонить</button>
                            <button className="admin-btn" style={{ height: '44px', padding: '0 20px' }} onClick={() => updateStatus(selectedRequest.id, 'contacted')}>Связались</button>
                            <button className="admin-btn admin-btn-primary" style={{ height: '44px', padding: '0 20px' }} onClick={() => updateStatus(selectedRequest.id, 'approved')}>Одобрить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPartners;
