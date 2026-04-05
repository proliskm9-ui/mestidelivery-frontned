import { useState, useEffect } from 'react';
import { adminApi, adminAuth, type Product, type Restaurant } from '../../services/adminService';
import { EditIcon, TrashIcon, PlusIcon, RefreshIcon } from '../../components/icons/StatusIcons';
import './AdminStyles.css';

/* ─── Simple SVG Icons ─────────────────────────── */
const ChevronDown = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
);
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const InfoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
);
const CopyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);

export function AdminProducts() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);

    // Restaurant selector
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Product modal
    const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Restaurant info panel
    const [showRestaurantInfo, setShowRestaurantInfo] = useState(false);
    const [editRestaurant, setEditRestaurant] = useState<Partial<Restaurant> | null>(null);
    const [savingRestaurant, setSavingRestaurant] = useState(false);

    // Category filter
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const user = adminAuth.getUser();

    // Load restaurants on mount
    useEffect(() => {
        loadRestaurants();
    }, []);

    const loadRestaurants = async () => {
        setLoading(true);
        try {
            const data = await adminApi.get<Restaurant[]>('/restaurants/');
            setRestaurants(data);

            // Auto-select first restaurant or user's restaurant
            if (data.length > 0) {
                const userRest = user?.restaurant_id ? data.find(r => r.id === user.restaurant_id) : null;
                const target = userRest || data[0];
                setSelectedRestaurant(target);
                setEditRestaurant({ ...target });
                loadProducts(target.id);
            }
        } catch (err) {
            console.error('Failed to load restaurants:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async (restaurantId: string) => {
        setProductsLoading(true);
        try {
            const allProducts = await adminApi.get<Product[]>('/products/admin');
            const filtered = allProducts.filter(p => p.restaurant_id === restaurantId);
            setProducts(filtered);
        } catch (err) {
            console.error('Failed to load products:', err);
            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    };

    const selectRestaurant = (r: Restaurant) => {
        setSelectedRestaurant(r);
        setEditRestaurant({ ...r });
        setSelectorOpen(false);
        setSearchTerm('');
        setCategoryFilter('all');
        loadProducts(r.id);
    };

    // ─── Product CRUD ───
    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProduct || !selectedRestaurant) return;

        if (!editProduct.name || !editProduct.price) {
            alert('Название и цена обязательны');
            return;
        }

        const isNew = !editProduct.id;
        const productId = editProduct.id || `prod-${Date.now()}`;

        const payload = {
            ...editProduct,
            id: productId,
            name: editProduct.name,
            price: Number(editProduct.price),
            restaurant_id: selectedRestaurant.id,
            img: editProduct.img || '',
            category: editProduct.category || 'main',
            description: editProduct.description || '',
            weight: editProduct.weight || '0г',
            calories: editProduct.calories || '0',
            proteins: editProduct.proteins || '0',
            fats: editProduct.fats || '0',
            carbs: editProduct.carbs || '0',
            ingredients: editProduct.ingredients || ''
        };

        try {
            if (isNew) {
                await adminApi.post('/products/', payload);
            } else {
                await adminApi.put(`/products/${productId}`, payload);
            }
            setIsProductModalOpen(false);
            setEditProduct(null);
            loadProducts(selectedRestaurant.id);
        } catch (err: any) {
            alert('Ошибка сохранения: ' + (err.message || 'Проверьте консоль'));
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Удалить эту позицию?')) return;
        try {
            await adminApi.delete(`/products/${id}`);
            if (selectedRestaurant) loadProducts(selectedRestaurant.id);
        } catch {
            alert('Ошибка удаления');
        }
    };

    const handleDuplicateProduct = (p: Product) => {
        setEditProduct({
            ...p,
            id: undefined,
            name: `${p.name} (копия)`
        });
        setIsProductModalOpen(true);
    };

    const openEditProduct = (p: Product) => {
        setEditProduct({ ...p });
        setIsProductModalOpen(true);
    };

    const openNewProduct = () => {
        if (!selectedRestaurant) return;
        setEditProduct({
            restaurant_id: selectedRestaurant.id,
            price: 0,
            category: 'main'
        });
        setIsProductModalOpen(true);
    };

    // ─── Restaurant Info Save ───
    const handleSaveRestaurantInfo = async () => {
        if (!editRestaurant || !editRestaurant.id) return;
        setSavingRestaurant(true);
        try {
            await adminApi.put(`/restaurants/${editRestaurant.id}`, editRestaurant);
            // Update local state
            setRestaurants(prev => prev.map(r => r.id === editRestaurant.id ? { ...r, ...editRestaurant } as Restaurant : r));
            setSelectedRestaurant(prev => prev?.id === editRestaurant.id ? { ...prev, ...editRestaurant } as Restaurant : prev);
            setShowRestaurantInfo(false);
        } catch (err: any) {
            alert('Ошибка сохранения: ' + (err.message || ''));
        } finally {
            setSavingRestaurant(false);
        }
    };

    // ─── Filtering ───
    const categories = ['all', ...Array.from(new Set(products.map(p => p.category || 'main').filter(Boolean)))];
    const filteredProducts = categoryFilter === 'all' ? products : products.filter(p => (p.category || 'main') === categoryFilter);
    const filteredRestaurants = restaurants.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Stats
    const totalItems = products.length;
    const avgPrice = products.length > 0 ? (products.reduce((a, p) => a + p.price, 0) / products.length).toFixed(2) : '0';
    const categoriesCount = new Set(products.map(p => p.category || 'main')).size;

    if (loading) return <div className="admin-loading">Загрузка...</div>;

    return (
        <div className="admin-page">
            {/* ─── Restaurant Selector Bar ─── */}
            <div className="page-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '250px' }}>
                    {/* Restaurant Dropdown */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <button
                            className="admin-btn"
                            onClick={() => setSelectorOpen(!selectorOpen)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                padding: '10px 16px',
                                fontSize: '15px',
                                fontWeight: 600,
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {selectedRestaurant?.img ? (
                                    <img src={selectedRestaurant.img} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                                        {selectedRestaurant?.name?.[0] || '?'}
                                    </div>
                                )}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {selectedRestaurant?.name || 'Выберите ресторан'}
                                </span>
                            </div>
                            <ChevronDown />
                        </button>

                        {/* Dropdown */}
                        {selectorOpen && (
                            <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => { setSelectorOpen(false); setSearchTerm(''); }} />
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 6px)',
                                    left: 0,
                                    right: 0,
                                    zIndex: 100,
                                    background: 'rgba(25, 25, 30, 0.98)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '8px',
                                    maxHeight: '340px',
                                    overflowY: 'auto',
                                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)'
                                }}>
                                    {/* Search */}
                                    <div style={{ position: 'relative', marginBottom: '6px' }}>
                                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>
                                            <SearchIcon />
                                        </div>
                                        <input
                                            className="admin-input"
                                            placeholder="Найти ресторан..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            autoFocus
                                            style={{ paddingLeft: '38px', borderRadius: '12px', fontSize: '14px' }}
                                        />
                                    </div>
                                    {filteredRestaurants.map(r => (
                                        <div
                                            key={r.id}
                                            onClick={() => selectRestaurant(r)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s',
                                                background: selectedRestaurant?.id === r.id ? 'rgba(33,234,124,0.1)' : 'transparent',
                                                border: selectedRestaurant?.id === r.id ? '1px solid rgba(33,234,124,0.3)' : '1px solid transparent'
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = selectedRestaurant?.id === r.id ? 'rgba(33,234,124,0.15)' : 'rgba(255,255,255,0.05)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = selectedRestaurant?.id === r.id ? 'rgba(33,234,124,0.1)' : 'transparent')}
                                        >
                                            {r.img ? (
                                                <img src={r.img} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                    {r.name[0]}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.name}</div>
                                                <div style={{ fontSize: '12px', color: '#888' }}>★ {r.rating} · {r.delivery}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredRestaurants.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '16px', color: '#666', fontSize: '14px' }}>
                                            Ничего не найдено
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Restaurant Info button */}
                    {selectedRestaurant && (
                        <button
                            className="admin-btn"
                            onClick={() => { setEditRestaurant({ ...selectedRestaurant }); setShowRestaurantInfo(!showRestaurantInfo); }}
                            title="Информация о ресторане"
                            style={{ borderRadius: '12px', padding: '10px 14px' }}
                        >
                            <InfoIcon />
                        </button>
                    )}
                </div>

                <div className="header-actions">
                    <button className="admin-btn" onClick={() => selectedRestaurant && loadProducts(selectedRestaurant.id)} title="Обновить">
                        <RefreshIcon size={18} />
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={openNewProduct} disabled={!selectedRestaurant}>
                        <PlusIcon size={18} style={{ marginRight: 8 }} /> Добавить блюдо
                    </button>
                </div>
            </div>

            {/* ─── Restaurant Info Panel (collapsible) ─── */}
            {showRestaurantInfo && editRestaurant && (
                <div className="admin-card" style={{ marginBottom: '20px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>📋 Информация о ресторане</h3>
                        <button className="admin-btn" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setShowRestaurantInfo(false)}>Свернуть</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Название</label>
                            <input className="admin-input" value={editRestaurant.name || ''} onChange={e => setEditRestaurant({ ...editRestaurant, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Рейтинг</label>
                            <input className="admin-input" value={editRestaurant.rating || ''} onChange={e => setEditRestaurant({ ...editRestaurant, rating: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Время доставки</label>
                            <input className="admin-input" value={editRestaurant.delivery || ''} onChange={e => setEditRestaurant({ ...editRestaurant, delivery: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Адрес</label>
                            <input className="admin-input" value={editRestaurant.address || ''} onChange={e => setEditRestaurant({ ...editRestaurant, address: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Фото (URL)</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {editRestaurant.img && <img src={editRestaurant.img} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />}
                                <input
                                    className="admin-input"
                                    style={{ flex: 1 }}
                                    value={editRestaurant.img || ''}
                                    onChange={e => setEditRestaurant({ ...editRestaurant, img: e.target.value })}
                                    placeholder="Ссылка на изображение"
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="rest-img-upload"
                                    onChange={async (e) => {
                                        if (e.target.files?.[0]) {
                                            try {
                                                const res = await adminApi.upload(e.target.files[0]);
                                                if (res.success) setEditRestaurant(prev => prev ? { ...prev, img: res.url } : null);
                                            } catch { alert('Ошибка загрузки'); }
                                        }
                                    }}
                                />
                                <button type="button" className="admin-btn" onClick={() => document.getElementById('rest-img-upload')?.click()} style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                                    📎 Файл
                                </button>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button className="admin-btn" onClick={() => setShowRestaurantInfo(false)}>Отмена</button>
                        <button className="admin-btn admin-btn-primary" onClick={handleSaveRestaurantInfo} disabled={savingRestaurant}>
                            {savingRestaurant ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Quick Stats ─── */}
            {selectedRestaurant && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <div className="admin-card" style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#21EA7C' }}>{totalItems}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Позиций в меню</div>
                    </div>
                    <div className="admin-card" style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#21EA7C' }}>{categoriesCount}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Категорий</div>
                    </div>
                    <div className="admin-card" style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#21EA7C' }}>{avgPrice} ₾</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Средняя цена</div>
                    </div>
                </div>
            )}

            {/* ─── Category Tabs ─── */}
            {selectedRestaurant && products.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className="admin-btn"
                            onClick={() => setCategoryFilter(cat)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 500,
                                background: categoryFilter === cat ? 'rgba(33,234,124,0.15)' : 'rgba(255,255,255,0.04)',
                                color: categoryFilter === cat ? '#21EA7C' : '#999',
                                border: categoryFilter === cat ? '1px solid rgba(33,234,124,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat === 'all' ? `Все (${products.length})` : `${cat} (${products.filter(p => (p.category || 'main') === cat).length})`}
                        </button>
                    ))}
                </div>
            )}

            {/* ─── Products Table ─── */}
            {selectedRestaurant ? (
                productsLoading ? (
                    <div className="admin-loading">Загрузка меню...</div>
                ) : (
                    <div className="admin-card admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Фото</th>
                                    <th>Название</th>
                                    <th>Цена</th>
                                    <th className="mobile-hide">Категория</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            {p.img ? <img src={p.img} alt="" className="item-img" /> : (
                                                <div className="item-img flex-center" style={{ background: '#222' }}>{p.name[0]}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="product-name-cell">{p.name}</div>
                                            <div className="product-desc-cell">{p.description}</div>
                                        </td>
                                        <td style={{ color: '#21EA7C', whiteSpace: 'nowrap', fontWeight: 700 }}>{p.price} ₾</td>
                                        <td className="mobile-hide">
                                            <span style={{
                                                background: 'rgba(255,255,255,0.06)',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}>{p.category || 'main'}</span>
                                        </td>
                                        <td>
                                            <div className="admin-action-btns">
                                                <button className="admin-btn" onClick={() => openEditProduct(p)} title="Редактировать">
                                                    <EditIcon size={16} />
                                                </button>
                                                <button className="admin-btn" onClick={() => handleDuplicateProduct(p)} title="Дублировать">
                                                    <CopyIcon />
                                                </button>
                                                <button className="admin-btn admin-btn-danger" onClick={() => handleDeleteProduct(p.id)} title="Удалить">
                                                    <TrashIcon size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredProducts.length === 0 && (
                            <div className="admin-empty-msg" style={{ padding: '40px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍽️</div>
                                <div style={{ color: '#888', fontSize: '15px' }}>
                                    {categoryFilter !== 'all' ? 'Нет позиций в этой категории' : 'Меню пока пустое'}
                                </div>
                                <button className="admin-btn admin-btn-primary" style={{ marginTop: '16px' }} onClick={openNewProduct}>
                                    <PlusIcon size={16} style={{ marginRight: 6 }} /> Добавить первое блюдо
                                </button>
                            </div>
                        )}
                    </div>
                )
            ) : (
                <div className="admin-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
                    <h3 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>Выберите ресторан</h3>
                    <p style={{ color: '#888', margin: 0 }}>Используйте выпадающий список выше, чтобы выбрать ресторан и управлять его меню</p>
                </div>
            )}

            {/* ─── Product Modal ─── */}
            {isProductModalOpen && editProduct && (
                <div className="admin-modal-overlay" onClick={() => setIsProductModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">
                            {editProduct.id ? 'Редактировать блюдо' : 'Новое блюдо'}
                            {selectedRestaurant && (
                                <span style={{ fontSize: '13px', fontWeight: 400, color: '#888', display: 'block', marginTop: '4px' }}>
                                    {selectedRestaurant.name}
                                </span>
                            )}
                        </h2>

                        <form onSubmit={handleSaveProduct} className="admin-form">
                            <div className="modal-scroll-area" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Section 1: Base Info */}
                                <div className="admin-edit-section">
                                    <h3 className="section-subtitle">Основная информация</h3>
                                    <div className="form-group">
                                        <label className="form-label">Название блюда</label>
                                        <input
                                            className="admin-input"
                                            placeholder="Введите название..."
                                            value={editProduct.name || ''}
                                            onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group flex-1">
                                            <label className="form-label">Цена (₾)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="admin-input"
                                                value={editProduct.price || ''}
                                                onChange={e => setEditProduct({ ...editProduct, price: Number(e.target.value) })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group flex-1">
                                            <label className="form-label">Категория</label>
                                            <input
                                                className="admin-input"
                                                placeholder="Напр: Закуски"
                                                value={editProduct.category || ''}
                                                onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                                                list="category-suggestions"
                                            />
                                            <datalist id="category-suggestions">
                                                {categories.filter(c => c !== 'all').map(c => (
                                                    <option key={c} value={c} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Description & Nutrition */}
                                <div className="admin-edit-section">
                                    <h3 className="section-subtitle">Описание и КБЖУ</h3>
                                    <div className="form-group">
                                        <label className="form-label">Описание</label>
                                        <textarea
                                            className="admin-input"
                                            style={{ height: 80, resize: 'none' }}
                                            placeholder="Краткое описание для карточки..."
                                            value={editProduct.description || ''}
                                            onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Состав</label>
                                        <textarea
                                            className="admin-input"
                                            style={{ height: 60, resize: 'none' }}
                                            placeholder="Перечислите ингредиенты..."
                                            value={editProduct.ingredients || ''}
                                            onChange={e => setEditProduct({ ...editProduct, ingredients: e.target.value })}
                                        />
                                    </div>

                                    <div className="kbju-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Вес</label>
                                            <input className="admin-input" placeholder="300г" value={editProduct.weight || ''} onChange={e => setEditProduct({ ...editProduct, weight: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Ккал</label>
                                            <input className="admin-input" placeholder="450" value={editProduct.calories || ''} onChange={e => setEditProduct({ ...editProduct, calories: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Белки</label>
                                            <input className="admin-input" placeholder="12" value={editProduct.proteins || ''} onChange={e => setEditProduct({ ...editProduct, proteins: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Жиры</label>
                                            <input className="admin-input" placeholder="8" value={editProduct.fats || ''} onChange={e => setEditProduct({ ...editProduct, fats: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Угли</label>
                                            <input className="admin-input" placeholder="45" value={editProduct.carbs || ''} onChange={e => setEditProduct({ ...editProduct, carbs: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Media */}
                                <div className="admin-edit-section">
                                    <h3 className="section-subtitle">Медиа контент</h3>
                                    <div className="form-group">
                                        <label className="form-label">Изображение</label>
                                        <div className="image-edit-block">
                                            {editProduct.img && (
                                                <img src={editProduct.img} alt="Preview" className="modal-preview-img" />
                                            )}
                                            <div className="image-inputs">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="admin-input"
                                                    onChange={async (e) => {
                                                        if (e.target.files?.[0]) {
                                                            try {
                                                                const res = await adminApi.upload(e.target.files[0]);
                                                                if (res.success) {
                                                                    setEditProduct(prev => prev ? ({ ...prev, img: res.url }) : null);
                                                                }
                                                            } catch (err) {
                                                                alert('Ошибка загрузки');
                                                            }
                                                        }
                                                    }}
                                                />
                                                <input
                                                    className="admin-input"
                                                    placeholder="Или прямая ссылка на фото"
                                                    value={editProduct.img || ''}
                                                    onChange={e => setEditProduct({ ...editProduct, img: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="admin-btn action-cancel" onClick={() => setIsProductModalOpen(false)}>Отмена</button>
                                <button type="submit" className="admin-btn admin-btn-primary action-save">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
