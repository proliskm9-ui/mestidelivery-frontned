import React, { useState, useEffect } from 'react';
import { Restaurant } from '../../services/api';
import { adminApi, type Product } from '../../services/adminService';
import AddressSelector from '../../components/Map/AddressSelector';
import { fetchNormalizedPosterMenu, type NormalizedPosterProduct } from '../../services/posterService';

interface RestaurantEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Partial<Restaurant> | null;
    onSave: (data: Partial<Restaurant>) => Promise<void>;
}

type TabType = 'general' | 'media' | 'poster';

export default function RestaurantEditModal({
    isOpen,
    onClose,
    restaurant,
    onSave
}: RestaurantEditModalProps) {
    const [formData, setFormData] = useState<Partial<Restaurant>>({});
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [showMapSelector, setShowMapSelector] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Poster import state
    const [posterProducts, setPosterProducts] = useState<NormalizedPosterProduct[]>([]);
    const [selectedPosterIds, setSelectedPosterIds] = useState<Set<string>>(new Set());
    const [loadingPosterMenu, setLoadingPosterMenu] = useState(false);
    const [importingProducts, setImportingProducts] = useState(false);
    const [posterImportError, setPosterImportError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null);
    const [showImportSection, setShowImportSection] = useState(false);

    // Toggle body class to hide sidebar when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('admin-modal-open');
        } else {
            document.body.classList.remove('admin-modal-open');
        }
        return () => {
            document.body.classList.remove('admin-modal-open');
        };
    }, [isOpen]);

    // Initialize/sync local state with prop
    useEffect(() => {
        if (restaurant) {
            setFormData({ ...restaurant });
        } else {
            setFormData({});
        }
        setActiveTab('general');
    }, [restaurant, isOpen]);

    // Fetch products to verify integration status
    useEffect(() => {
        if (isOpen && restaurant?.id) {
            setLoadingProducts(true);
            adminApi.get<Product[]>(`/products/?restaurant_id=${restaurant.id}&limit=1000&_t=${Date.now()}`)
                .then(data => {
                    setProducts(data || []);
                })
                .catch(err => {
                    console.error('Error fetching products for integration status', err);
                })
                .finally(() => {
                    setLoadingProducts(false);
                });
        } else {
            setProducts([]);
        }
    }, [restaurant, isOpen]);

    if (!isOpen || !restaurant) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        
        // Ensure numeric type for fields if needed
        const payload = {
            ...formData,
            min_order: formData.min_order ? Number(formData.min_order) : undefined,
            latitude: formData.latitude ? Number(formData.latitude) : undefined,
            longitude: formData.longitude ? Number(formData.longitude) : undefined,
            poster_spot_id: formData.poster_spot_id ? Number(formData.poster_spot_id) : undefined
        };
        await onSave(payload);
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setIsUploadingLogo(true);
            try {
                const res = await adminApi.upload(e.target.files[0]);
                if (res.success) {
                    setFormData(prev => ({ ...prev, img: res.url }));
                }
            } catch (err) {
                alert('Ошибка загрузки логотипа');
            } finally {
                setIsUploadingLogo(false);
            }
        }
    };

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setIsUploadingCover(true);
            try {
                const res = await adminApi.upload(e.target.files[0]);
                if (res.success) {
                    setFormData(prev => ({ ...prev, screen: res.url }));
                }
            } catch (err) {
                alert('Ошибка загрузки обложки');
            } finally {
                setIsUploadingCover(false);
            }
        }
    };

    const isStep1Complete = !!formData.poster_token && (formData.poster_spot_id !== undefined && formData.poster_spot_id !== null && String(formData.poster_spot_id) !== '');
    const totalProductsCount = products.length;
    const mappedProductsCount = products.filter(p => !!p.external_id).length;
    const isStep2Complete = isStep1Complete && (totalProductsCount === 0 || mappedProductsCount === totalProductsCount);

    const getPosterStatus = () => {
        if (!isStep1Complete) {
            return {
                text: 'Интеграция не настроена',
                color: 'var(--admin-text-muted)',
                bgColor: 'rgba(255, 255, 255, 0.03)',
                description: 'Для запуска интеграции введите Poster API Token и Spot ID.'
            };
        }
        if (loadingProducts) {
            return {
                text: 'Проверка маппинга товаров...',
                color: 'var(--admin-primary)',
                bgColor: 'rgba(33, 234, 124, 0.03)',
                description: 'Загружаем список товаров ресторана...'
            };
        }
        if (!isStep2Complete) {
            return {
                text: 'Poster: ожидает маппинга товаров',
                color: '#ffb703',
                bgColor: 'rgba(255, 183, 3, 0.05)',
                description: `Связано ${mappedProductsCount} из ${totalProductsCount} товаров. Укажите external_id (Poster ID) для оставшихся товаров в разделе Товары.`
            };
        }
        return {
            text: 'Poster: активен',
            color: '#21EA7C',
            bgColor: 'rgba(33, 234, 124, 0.08)',
            description: 'Интеграция настроена и активна. Заказы будут отправляться на кассу Poster.'
        };
    };
    
    const posterStatus = getPosterStatus();

    // ─── Poster Menu Import Logic ───
    const handleFetchPosterMenu = async () => {
        if (!formData.poster_token) return;
        setLoadingPosterMenu(true);
        setPosterImportError(null);
        setImportResult(null);
        setPosterProducts([]);
        setSelectedPosterIds(new Set());
        try {
            const spotId = formData.poster_spot_id ? String(formData.poster_spot_id) : undefined;
            const { products: posterItems } = await fetchNormalizedPosterMenu(formData.poster_token, spotId);
            setPosterProducts(posterItems);
            // Pre-select all by default
            setSelectedPosterIds(new Set(posterItems.map(p => p.poster_product_id)));
            setShowImportSection(true);
        } catch (err: any) {
            setPosterImportError(err.message || 'Не удалось загрузить меню из Poster');
        } finally {
            setLoadingPosterMenu(false);
        }
    };

    const togglePosterProduct = (id: string) => {
        setSelectedPosterIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllPosterProducts = () => {
        if (selectedPosterIds.size === posterProducts.length) {
            setSelectedPosterIds(new Set());
        } else {
            setSelectedPosterIds(new Set(posterProducts.map(p => p.poster_product_id)));
        }
    };

    const handleImportSelected = async () => {
        if (!restaurant?.id || selectedPosterIds.size === 0) return;
        setImportingProducts(true);
        setImportResult(null);
        let created = 0;
        let skipped = 0;

        // Get existing products to avoid duplicates by external_id
        const existingExternalIds = new Set(products.map(p => p.external_id).filter(Boolean));

        for (const posterId of selectedPosterIds) {
            const posterItem = posterProducts.find(p => p.poster_product_id === posterId);
            if (!posterItem) continue;

            // Skip if already mapped
            if (existingExternalIds.has(posterId)) {
                skipped++;
                continue;
            }

            const productPayload = {
                id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                restaurant_id: restaurant.id,
                name: posterItem.name,
                price: posterItem.price,
                description: '',
                img: posterItem.photo_url || '',
                category: posterItem.category_name,
                weight: '0',
                calories: '0',
                proteins: '0',
                fats: '0',
                carbs: '0',
                ingredients: '',
                is_available: true,
                external_id: posterItem.poster_product_id
            };

            try {
                await adminApi.post('/products/', productPayload);
                created++;
                existingExternalIds.add(posterId);
                // Small delay to avoid overwhelming backend
                await new Promise(r => setTimeout(r, 100));
            } catch (err) {
                console.error(`Failed to import product ${posterItem.name}:`, err);
                skipped++;
            }
        }

        setImportResult({ created, skipped });
        setImportingProducts(false);

        // Refresh products list
        if (created > 0 && restaurant.id) {
            try {
                const freshProducts = await adminApi.get<Product[]>(`/products/?restaurant_id=${restaurant.id}&limit=1000&_t=${Date.now()}`);
                setProducts(freshProducts || []);
            } catch { /* silent */ }
        }
    };

    return (
        <div className="admin-centered-modal-overlay" onClick={handleOverlayClick}>
            <div className="admin-centered-modal">
                <div className="modal-header">
                    <h2 className="modal-title">
                        {formData.id ? 'Редактировать ресторан' : 'Новый ресторан'}
                    </h2>
                    <button className="modal-close-btn" type="button" onClick={onClose} title="Закрыть">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="admin-modal-tabs">
                    <button
                        type="button"
                        className={`admin-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        Основное
                    </button>
                    <button
                        type="button"
                        className={`admin-tab-btn ${activeTab === 'media' ? 'active' : ''}`}
                        onClick={() => setActiveTab('media')}
                    >
                        Медиа
                    </button>
                    <button
                        type="button"
                        className={`admin-tab-btn ${activeTab === 'poster' ? 'active' : ''}`}
                        onClick={() => setActiveTab('poster')}
                    >
                        Интеграции Poster
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-scroll-area">
                        {activeTab === 'general' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Название ресторана</label>
                                    <input
                                        className="admin-input"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Например: Sunset Restaurant"
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Рейтинг</label>
                                        <input
                                            className="admin-input"
                                            value={formData.rating || ''}
                                            onChange={e => setFormData({ ...formData, rating: e.target.value })}
                                            placeholder="5.0"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Время доставки</label>
                                        <input
                                            className="admin-input"
                                            value={formData.delivery || ''}
                                            onChange={e => setFormData({ ...formData, delivery: e.target.value })}
                                            placeholder="20-25 мин"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Мин. заказ (GEL)</label>
                                        <input
                                            className="admin-input"
                                            type="number"
                                            value={formData.min_order === undefined ? '' : formData.min_order}
                                            onChange={e => setFormData({ ...formData, min_order: e.target.value === '' ? undefined : Number(e.target.value) })}
                                            placeholder="50"
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Адрес</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            className="admin-input"
                                            placeholder="Введите адрес или выберите на карте"
                                            value={formData.address || ''}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="admin-btn"
                                            style={{ 
                                                padding: '0 16px', 
                                                fontSize: '1.2rem', 
                                                background: 'rgba(33, 234, 124, 0.1)', 
                                                borderColor: 'rgba(33, 234, 124, 0.2)', 
                                                color: 'var(--admin-primary)',
                                                borderRadius: 'var(--admin-radius-md)'
                                            }}
                                            onClick={() => setShowMapSelector(true)}
                                            title="Указать на карте"
                                        >
                                            🗺️
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Тип кухни / Категории (Кухня)</label>
                                    <input
                                        className="admin-input"
                                        value={formData.category || ''}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="Например: Грузинская кухня • Горячие блюда • Выпечка"
                                    />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', marginTop: '4px', display: 'block' }}>
                                        Разделяйте категории точкой ` • ` для красивого отображения в приложении.
                                    </span>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Промо-акция / Описание (Promo)</label>
                                    <textarea
                                        className="admin-input"
                                        style={{ minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' }}
                                        value={formData.promo || ''}
                                        onChange={e => setFormData({ ...formData, promo: e.target.value })}
                                        placeholder="Например: Скидка 10% на хинкали при первом заказе!"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'media' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* 1. LOGO UPLOAD BLOCK */}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Логотип заведения (Иконка)</label>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '20px', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        padding: '16px', 
                                        borderRadius: '16px', 
                                        border: '1px dashed rgba(255,255,255,0.1)' 
                                    }}>
                                        {formData.img ? (
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={formData.img}
                                                    alt="Preview Logo"
                                                    style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover', background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.08)' }}
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFormData({ ...formData, img: '' })}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-6px',
                                                        right: '-6px',
                                                        background: '#ef4444',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '20px',
                                                        height: '20px',
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                                        fontWeight: 'bold'
                                                    }}
                                                    title="Удалить логотип"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ 
                                                width: 80, 
                                                height: 80, 
                                                borderRadius: 16, 
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                background: 'rgba(255,255,255,0.03)', 
                                                fontSize: '0.7rem', 
                                                color: 'var(--admin-text-muted)', 
                                                border: '1px dashed rgba(255,255,255,0.08)',
                                                gap: '4px'
                                            }}>
                                                <span style={{ fontSize: '1.25rem' }}>📸</span>
                                                <span>Логотип</span>
                                            </div>
                                        )}
                                        
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div>
                                                <label className="admin-btn" style={{ 
                                                    cursor: 'pointer', 
                                                    display: 'inline-flex',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderColor: 'rgba(255,255,255,0.1)',
                                                    padding: '8px 16px',
                                                    fontSize: '0.85rem',
                                                    width: 'auto'
                                                }}>
                                                    {isUploadingLogo ? 'Загрузка...' : 'Выбрать файл'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={handleLogoChange}
                                                        disabled={isUploadingLogo}
                                                    />
                                                </label>
                                            </div>
                                            <input
                                                className="admin-input"
                                                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                                value={formData.img || ''}
                                                onChange={e => setFormData({ ...formData, img: e.target.value })}
                                                placeholder="Или ссылка на логотип"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. COVER HEADER UPLOAD BLOCK */}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Обложка заведения (Шапка ресторана)</label>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '20px', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        padding: '16px', 
                                        borderRadius: '16px', 
                                        border: '1px dashed rgba(255,255,255,0.1)' 
                                    }}>
                                        {formData.screen && formData.screen !== 'restaurant-default' ? (
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={formData.screen}
                                                    alt="Preview Cover"
                                                    style={{ width: 140, height: 80, borderRadius: 12, objectFit: 'cover', background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.08)' }}
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setFormData({ ...formData, screen: 'restaurant-default' })}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-6px',
                                                        right: '-6px',
                                                        background: '#ef4444',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '20px',
                                                        height: '20px',
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                                        fontWeight: 'bold'
                                                    }}
                                                    title="Сбросить обложку"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ 
                                                width: 140, 
                                                height: 80, 
                                                borderRadius: 12, 
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                background: 'rgba(255,255,255,0.03)', 
                                                fontSize: '0.7rem', 
                                                color: 'var(--admin-text-muted)', 
                                                border: '1px dashed rgba(255,255,255,0.08)',
                                                gap: '4px'
                                            }}>
                                                <span style={{ fontSize: '1.25rem' }}>🖼️</span>
                                                <span>По умолчанию</span>
                                            </div>
                                        )}
                                        
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div>
                                                <label className="admin-btn" style={{ 
                                                    cursor: 'pointer', 
                                                    display: 'inline-flex',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderColor: 'rgba(255,255,255,0.1)',
                                                    padding: '8px 16px',
                                                    fontSize: '0.85rem',
                                                    width: 'auto'
                                                }}>
                                                    {isUploadingCover ? 'Загрузка...' : 'Выбрать файл'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={handleCoverChange}
                                                        disabled={isUploadingCover}
                                                    />
                                                </label>
                                            </div>
                                            <input
                                                className="admin-input"
                                                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                                value={formData.screen || ''}
                                                onChange={e => setFormData({ ...formData, screen: e.target.value })}
                                                placeholder="Или ссылка на обложку"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'poster' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ 
                                    background: 'rgba(33, 234, 124, 0.03)', 
                                    border: '1px solid rgba(33, 234, 124, 0.1)', 
                                    padding: '16px', 
                                    borderRadius: '16px', 
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'flex-start'
                                }}>
                                    <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>🔌</span>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', lineHeight: '1.4' }}>
                                        <strong style={{ color: 'var(--admin-text)', display: 'block', marginBottom: '4px' }}>Интеграция с Poster POS</strong>
                                        Укажите токен доступа API и ID торговой точки (Spot ID) для автоматической синхронизации меню и заказов с системой Poster.
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Poster API Token</label>
                                    <input
                                        type="password"
                                        className="admin-input"
                                        value={formData.poster_token || ''}
                                        onChange={e => setFormData({ ...formData, poster_token: e.target.value })}
                                        placeholder="••••••••••••••••"
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Spot ID</label>
                                    <input
                                        type="number"
                                        className="admin-input"
                                        value={formData.poster_spot_id === undefined ? '' : formData.poster_spot_id}
                                        onChange={e => setFormData({ ...formData, poster_spot_id: e.target.value === '' ? undefined : Number(e.target.value) })}
                                        placeholder="Например: 1"
                                    />
                                </div>

                                {/* Checklist status wizard */}
                                <div style={{
                                    marginTop: '10px',
                                    padding: '16px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--admin-text)' }}>
                                        Статус подключения:
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {/* Step 1 */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                            <span style={{ 
                                                color: isStep1Complete ? '#21EA7C' : 'var(--admin-text-muted)',
                                                fontWeight: 'bold',
                                                fontSize: '1rem'
                                            }}>
                                                {isStep1Complete ? '✓' : '○'}
                                            </span>
                                            <span style={{ color: isStep1Complete ? 'var(--admin-text)' : 'var(--admin-text-muted)' }}>
                                                1. Ввести реквизиты Poster и сохранить
                                            </span>
                                        </div>

                                        {/* Step 2 */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                            <span style={{ 
                                                color: isStep2Complete ? '#21EA7C' : (isStep1Complete ? '#ffb703' : 'var(--admin-text-muted)'),
                                                fontWeight: 'bold',
                                                fontSize: '1rem'
                                            }}>
                                                {isStep2Complete ? '✓' : (isStep1Complete ? '⚠' : '○')}
                                            </span>
                                            <span style={{ color: isStep1Complete ? 'var(--admin-text)' : 'var(--admin-text-muted)' }}>
                                                2. Сопоставление товаров (маппинг): {loadingProducts ? 'загрузка...' : `${mappedProductsCount} из ${totalProductsCount}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Final Status Badge */}
                                    <div style={{
                                        marginTop: '4px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: posterStatus.bgColor,
                                        border: `1px solid ${posterStatus.color}22`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}>
                                        <span style={{ 
                                            fontWeight: 700, 
                                            color: posterStatus.color,
                                            fontSize: '0.85rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: posterStatus.color }}></span>
                                            {posterStatus.text}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', lineHeight: '1.3' }}>
                                            {posterStatus.description}
                                        </span>
                                    </div>
                                </div>

                                {/* ─── Import from Poster ─── */}
                                {isStep1Complete && (
                                    <div style={{
                                        marginTop: '10px',
                                        padding: '16px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--admin-text)' }}>
                                                📥 Импорт меню из Poster
                                            </h4>
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-primary"
                                                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                                                onClick={handleFetchPosterMenu}
                                                disabled={loadingPosterMenu}
                                            >
                                                {loadingPosterMenu ? '⏳ Загрузка...' : '🔄 Загрузить меню'}
                                            </button>
                                        </div>

                                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--admin-text-muted)', lineHeight: '1.4' }}>
                                            Подтянет все товары из Poster и создаст их в MestiDelivery с привязкой по <code style={{ color: '#21EA7C', background: 'rgba(33,234,124,0.08)', padding: '1px 5px', borderRadius: '4px' }}>external_id</code>. Существующие товары с тем же ID не дублируются.
                                        </p>

                                        {posterImportError && (
                                            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.82rem' }}>
                                                ❌ {posterImportError}
                                            </div>
                                        )}

                                        {importResult && (
                                            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(33, 234, 124, 0.08)', border: '1px solid rgba(33, 234, 124, 0.2)', color: '#21EA7C', fontSize: '0.82rem' }}>
                                                ✅ Создано: <strong>{importResult.created}</strong> товаров{importResult.skipped > 0 ? `, пропущено: ${importResult.skipped} (уже существуют)` : ''}
                                            </div>
                                        )}

                                        {showImportSection && posterProducts.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--admin-text)' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPosterIds.size === posterProducts.length}
                                                            onChange={toggleAllPosterProducts}
                                                            style={{ accentColor: '#21EA7C', width: '16px', height: '16px' }}
                                                        />
                                                        Выбрать все ({posterProducts.length})
                                                    </label>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                                                        Выбрано: {selectedPosterIds.size}
                                                    </span>
                                                </div>

                                                <div style={{
                                                    maxHeight: '250px',
                                                    overflowY: 'auto',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: '12px',
                                                    background: 'rgba(0,0,0,0.15)'
                                                }}>
                                                    {posterProducts.map(p => {
                                                        const isExisting = products.some(ep => ep.external_id === p.poster_product_id);
                                                        return (
                                                            <label
                                                                key={p.poster_product_id}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                    padding: '8px 12px',
                                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                                    cursor: isExisting ? 'not-allowed' : 'pointer',
                                                                    opacity: isExisting ? 0.45 : 1,
                                                                    fontSize: '0.82rem'
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedPosterIds.has(p.poster_product_id)}
                                                                    onChange={() => togglePosterProduct(p.poster_product_id)}
                                                                    disabled={isExisting}
                                                                    style={{ accentColor: '#21EA7C', width: '15px', height: '15px', flexShrink: 0 }}
                                                                />
                                                                {p.photo_url && (
                                                                    <img
                                                                        src={p.photo_url}
                                                                        alt=""
                                                                        style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                    />
                                                                )}
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                        {p.name}
                                                                        {isExisting && <span style={{ color: '#21EA7C', fontWeight: 400, marginLeft: '6px' }}>✓ уже есть</span>}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                                                        ID: {p.poster_product_id} · {p.category_name}
                                                                    </div>
                                                                </div>
                                                                <span style={{ color: '#21EA7C', fontWeight: 700, flexShrink: 0 }}>
                                                                    {p.price > 0 ? `${p.price} ₾` : '—'}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    type="button"
                                                    className="admin-btn admin-btn-primary"
                                                    style={{ width: '100%', marginTop: '4px', fontWeight: 700 }}
                                                    onClick={handleImportSelected}
                                                    disabled={importingProducts || selectedPosterIds.size === 0}
                                                >
                                                    {importingProducts
                                                        ? '⏳ Импортируем...'
                                                        : `📥 Создать ${selectedPosterIds.size} товаров в MestiDelivery`}
                                                </button>
                                            </div>
                                        )}

                                        {showImportSection && posterProducts.length === 0 && !loadingPosterMenu && !posterImportError && (
                                            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                                                В Poster нет товаров или все товары уже импортированы
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="admin-btn" onClick={onClose}>Отмена</button>
                        <button type="submit" className="admin-btn admin-btn-primary">Сохранить</button>
                    </div>
                </form>
            </div>

            {showMapSelector && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
                    <AddressSelector
                        onClose={() => setShowMapSelector(false)}
                        onSelect={(data) => {
                            setFormData(prev => ({
                                ...prev,
                                address: data.address,
                                latitude: data.coords[0],
                                longitude: data.coords[1]
                            }));
                            setShowMapSelector(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
