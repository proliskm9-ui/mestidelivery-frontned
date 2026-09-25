import { useState, useEffect } from 'react';
import { adminApi, adminAuth, type Product, type Restaurant } from '../../services/adminService';
import { EditIcon, TrashIcon, RefreshIcon } from '../../components/icons/StatusIcons';
import FullPageLoader from '../../components/UI/FullPageLoader';
import { pickI18nText, parseI18nContent } from '../../utils/i18nContent';

/** Menu texts may be i18n JSON ({"ru","en","ka"}): show Russian, edit only the Russian part. */
const ruText = (raw?: string | null) => pickI18nText(raw || '', 'ru');
const withRu = (raw: string | null | undefined, ru: string): string => {
    const parsed = parseI18nContent(raw || '');
    if (typeof parsed === 'string') return ru;
    return JSON.stringify({ ...parsed, ru });
};

type Lang3 = 'ru' | 'en' | 'ka';
const readLangs = (raw?: string | null): Record<Lang3, string> => {
    const parsed = parseI18nContent(raw || '');
    if (typeof parsed === 'string') return { ru: parsed, en: '', ka: '' };
    return { ru: String(parsed.ru || ''), en: String(parsed.en || ''), ka: String(parsed.ka || '') };
};
const writeLangs = (v: Record<Lang3, string>): string => (!v.en && !v.ka ? v.ru : JSON.stringify(v));

/** RU / EN / KA inputs for one menu text, stored as i18n JSON (plain text when only RU is set). */
function I18nFields({ value, onChange, multiline, placeholder }: { value?: string | null; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
    const v = readLangs(value);
    const set = (l: Lang3, text: string) => onChange(writeLangs({ ...v, [l]: text }));
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['ru', 'en', 'ka'] as Lang3[]).map((l) => (
                <div key={l} style={{ display: 'flex', gap: 8, alignItems: multiline ? 'flex-start' : 'center' }}>
                    <span style={{ width: 28, flexShrink: 0, paddingTop: multiline ? 12 : 0, fontSize: 12, fontWeight: 700, color: 'var(--admin-text-muted)' }}>{l.toUpperCase()}</span>
                    {multiline ? (
                        <textarea className="admin-input" style={{ height: 64, resize: 'none' }} value={v[l]} placeholder={l === 'ru' ? placeholder : ''} onChange={(e) => set(l, e.target.value)} />
                    ) : (
                        <input className="admin-input" value={v[l]} placeholder={l === 'ru' ? placeholder : ''} onChange={(e) => set(l, e.target.value)} required={l === 'ru'} />
                    )}
                </div>
            ))}
        </div>
    );
}
import './AdminStyles.css';
import './AdminPromotions.css';

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
const MenuListIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);
const GridIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);
const LariIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

export function AdminProducts() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);

    // Inline editing state
    const [editingCell, setEditingCell] = useState<{ id: string, field: keyof Product } | null>(null);

    // Restaurant selector
    const [selectorOpen, setSelectorOpen] = useState(false);

    // ... (rest of imports/state)

    const handleInlineUpdate = async (product: Product, field: keyof Product, newValue: any) => {
        if (product[field] === newValue) {
            setEditingCell(null);
            return;
        }
        
        try {
            const updatedProduct = { ...product, [field]: newValue };
            
            // Fix types for strict backend
            if (updatedProduct.calories !== undefined) updatedProduct.calories = String(updatedProduct.calories);
            if (updatedProduct.weight !== undefined) updatedProduct.weight = String(updatedProduct.weight);

            await adminApi.put(`/products/${product.id}`, updatedProduct);
            setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
        } catch (err: any) {
            alert('Ошибка при сохранении: ' + (err.message || ''));
        }
        setEditingCell(null);
    };
    const [searchTerm, setSearchTerm] = useState('');

    // Product modal
    const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isDrink, setIsDrink] = useState(false);

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
                const userRest = user?.restaurant_id ? data.find(r => String(r.id) === String(user.restaurant_id)) : null;
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
            // Bypass cache to ensure we get all items
            const allProducts = await adminApi.get<Product[]>(`/products/?restaurant_id=${restaurantId}&limit=1000&_t=${Date.now()}`, true);
            const filtered = allProducts;
            
            // Sort chronologically (oldest first)
            filtered.sort((a, b) => {
                const tsA = parseInt(a.id.replace('prod-', '')) || 0;
                const tsB = parseInt(b.id.replace('prod-', '')) || 0;
                if (tsA && tsB) return tsA - tsB;
                return a.id.localeCompare(b.id);
            });

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
            price: Number(editProduct.price) || 0,
            restaurant_id: selectedRestaurant.id,
            img: editProduct.img || '',
            category: editProduct.category || 'main',
            description: editProduct.description || '',
            weight: String(editProduct.weight || (isDrink ? '0.2 L' : '0г')),
            calories: String(editProduct.calories || '0'),
            proteins: String(editProduct.proteins || '0'),
            fats: String(editProduct.fats || '0'),
            carbs: String(editProduct.carbs || '0'),
            ingredients: editProduct.ingredients || '',
            is_available: editProduct.is_available ?? true,
            external_id: editProduct.external_id || ''
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
            name: withRu(p.name, `${ruText(p.name)} (копия)`)
        });
        setIsProductModalOpen(true);
        const w = p.weight?.toLowerCase() || '';
        setIsDrink(w.includes('l') || w.includes('л') || w.includes('мл') || w.includes('ml'));
    };

    const openEditProduct = (p: Product) => {
        setEditProduct({ ...p });
        setIsProductModalOpen(true);
        const w = p.weight?.toLowerCase() || '';
        setIsDrink(w.includes('l') || w.includes('л') || w.includes('мл') || w.includes('ml'));
    };

    const openNewProduct = () => {
        if (!selectedRestaurant) return;
        setEditProduct({
            restaurant_id: selectedRestaurant.id,
            price: 0,
            category: 'main'
        });
        setIsProductModalOpen(true);
        setIsDrink(false);
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

    if (loading) return <FullPageLoader variant="list" />;

    return (
        <div className="admin-page">
            {/* ─── Restaurant Selector Bar ─── */}
            <div className="page-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px', flex: 1, minWidth: '250px' }}>
                    {/* Restaurant Dropdown */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
                        <button
                            className="restaurant-selector-btn"
                            onClick={() => setSelectorOpen(!selectorOpen)}
                            style={{ flex: 1 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {selectedRestaurant?.img ? (
                                    <img src={selectedRestaurant.img} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
                                ) : (
                                    <div className="item-img-premium-fallback" style={{ width: 28, height: 28, borderRadius: 8, fontSize: 14, boxShadow: 'none' }}>
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
                                <div className="restaurant-dropdown-panel">
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
                                    {filteredRestaurants.map(r => {
                                        const isActive = selectedRestaurant?.id === r.id;
                                        return (
                                            <div
                                                key={r.id}
                                                onClick={() => selectRestaurant(r)}
                                                className={`restaurant-dropdown-item ${isActive ? 'active' : ''}`}
                                            >
                                                {r.img ? (
                                                    <img src={r.img} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                                                ) : (
                                                    <div className="item-img-premium-fallback" style={{ width: 36, height: 36, borderRadius: 10, fontSize: 16, boxShadow: 'none' }}>
                                                        {r.name[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#888' }}>★ {r.rating} · {r.delivery}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                            className="restaurant-selector-btn"
                            onClick={() => { setEditRestaurant({ ...selectedRestaurant }); setShowRestaurantInfo(!showRestaurantInfo); }}
                            title="Информация о ресторане"
                            style={{ width: 'auto', padding: '0 18px', justifyContent: 'center' }}
                        >
                            <InfoIcon />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="admin-btn" onClick={() => selectedRestaurant && loadProducts(selectedRestaurant.id)} title="Обновить">
                        <RefreshIcon size={18} />
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={openNewProduct} disabled={!selectedRestaurant}>
                        Добавить блюдо
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                    <div className="product-stat-card">
                        <div className="product-stat-info">
                            <div className="product-stat-value">{totalItems}</div>
                            <div className="product-stat-label">Позиций в меню</div>
                        </div>
                        <div className="product-stat-icon-wrapper">
                            <MenuListIcon />
                        </div>
                    </div>
                    <div className="product-stat-card">
                        <div className="product-stat-info">
                            <div className="product-stat-value">{categoriesCount}</div>
                            <div className="product-stat-label">Категорий</div>
                        </div>
                        <div className="product-stat-icon-wrapper">
                            <GridIcon />
                        </div>
                    </div>
                    <div className="product-stat-card">
                        <div className="product-stat-info">
                            <div className="product-stat-value">{avgPrice} ₾</div>
                            <div className="product-stat-label">Средняя цена</div>
                        </div>
                        <div className="product-stat-icon-wrapper">
                            <LariIcon />
                        </div>
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
                    <FullPageLoader variant="list" />
                ) : (
                    <div className="admin-table-premium">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Фото</th>
                                    <th>Название</th>
                                    <th>Цена</th>
                                    <th className="mobile-hide">Категория</th>
                                    <th title="Выключите, если блюдо закончилось: оно пропадёт из меню">В меню</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            {p.img ? (
                                                <img src={p.img} alt="" className="item-img" />
                                            ) : (
                                                <div className="item-img-premium-fallback">
                                                    {ruText(p.name)[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="product-name-cell">
                                                {editingCell?.id === p.id && editingCell?.field === 'name' ? (
                                                    <input
                                                        autoFocus
                                                        className="inline-edit-input-premium"
                                                        defaultValue={ruText(p.name)}
                                                        onBlur={(e) => handleInlineUpdate(p, 'name', withRu(p.name, e.target.value))}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleInlineUpdate(p, 'name', withRu(p.name, e.currentTarget.value))}
                                                    />
                                                ) : (
                                                    <div className="editable-text-wrapper" onClick={() => setEditingCell({ id: p.id, field: 'name' })}>
                                                        <span className="editable-text">
                                                            {ruText(p.name)}
                                                        </span>
                                                        <span className="edit-pencil-icon">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="product-desc-cell" style={{ fontSize: '0.85em', color: '#888', marginTop: '4px' }}>{ruText(p.description)}</div>
                                        </td>
                                        <td className="inline-edit-cell" style={{ color: '#21EA7C', whiteSpace: 'nowrap', fontWeight: 700 }}>
                                            {editingCell?.id === p.id && editingCell?.field === 'price' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <input
                                                        autoFocus
                                                        type="number"
                                                        step="0.01"
                                                        className="inline-edit-input-premium"
                                                        style={{ width: '80px', borderColor: '#21EA7C' }}
                                                        defaultValue={p.price}
                                                        onBlur={(e) => handleInlineUpdate(p, 'price', Number(e.target.value))}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleInlineUpdate(p, 'price', Number(e.currentTarget.value))}
                                                    /> ₾
                                                </div>
                                            ) : (
                                                <div className="editable-text-wrapper" onClick={() => setEditingCell({ id: p.id, field: 'price' })}>
                                                    <span className="editable-text" style={{ borderBottomColor: 'rgba(33,234,124,0.3)' }}>
                                                        {p.price} ₾
                                                    </span>
                                                    <span className="edit-pencil-icon">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="mobile-hide">
                                            <span style={{
                                                background: 'rgba(255,255,255,0.06)',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}>{p.category || 'main'}</span>
                                        </td>
                                        <td>
                                            {/* Stop list: one click to hide a dish that ran out */}
                                            <label className="ap-switch" title={p.is_available === false ? 'Скрыто из меню' : 'В меню'}>
                                                <input type="checkbox" checked={p.is_available !== false} onChange={(e) => handleInlineUpdate(p, 'is_available' as any, e.target.checked as any)} />
                                                <span />
                                            </label>
                                        </td>
                                        <td>
                                            <div className="admin-action-btns-gap">
                                                <button className="btn-action-glass btn-edit" onClick={() => openEditProduct(p)} title="Редактировать">
                                                    <EditIcon size={16} />
                                                </button>
                                                <button className="btn-action-glass btn-duplicate" onClick={() => handleDuplicateProduct(p)} title="Дублировать">
                                                    <CopyIcon />
                                                </button>
                                                <button className="btn-action-glass btn-delete" onClick={() => handleDeleteProduct(p.id)} title="Удалить">
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
                                <div style={{ color: '#888', fontSize: '15px' }}>
                                    {categoryFilter !== 'all' ? 'Нет позиций в этой категории' : 'Меню пока пустое'}
                                </div>
                                <button className="admin-btn admin-btn-primary" style={{ marginTop: '16px' }} onClick={openNewProduct}>
                                    Добавить первое блюдо
                                </button>
                            </div>
                        )}
                    </div>
                )
            ) : (
                <div className="admin-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontWeight: 700 }}>Выберите ресторан</h3>
                    <p style={{ color: '#888', margin: 0 }}>Используйте выпадающий список выше, чтобы выбрать ресторан и управлять его меню</p>
                </div>
            )}

            {/* ─── Product Modal ─── */}
            {isProductModalOpen && editProduct && (
                <div className="admin-modal-overlay" onClick={() => setIsProductModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editProduct.id ? 'Редактировать блюдо' : 'Новое блюдо'}
                                {selectedRestaurant && (
                                    <span style={{ fontSize: '13px', fontWeight: 400, color: '#888', display: 'block', marginTop: '4px' }}>
                                        {selectedRestaurant.name}
                                    </span>
                                )}
                            </h2>
                            <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="admin-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-scroll-area">

                                {/* Section 1: Base Info */}
                                <div className="admin-edit-section">
                                    <h3 className="section-subtitle">Основная информация</h3>
                                    <div className="form-group">
                                        <label className="form-label">Название блюда</label>
                                        <I18nFields
                                            placeholder="Введите название..."
                                            value={editProduct.name}
                                            onChange={(v) => setEditProduct({ ...editProduct, name: v })}
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
                                    <div className="form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
                                        <label className="form-label">Poster ID товара (external_id)</label>
                                        <input
                                            className="admin-input"
                                            placeholder="Например: 123"
                                            value={editProduct.external_id || ''}
                                            onChange={e => setEditProduct({ ...editProduct, external_id: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Description & Nutrition */}
                                <div className="admin-edit-section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 className="section-subtitle" style={{ margin: 0 }}>Описание и КБЖУ</h3>
                                        <div className="premium-drawer-tabs">
                                            <button 
                                                type="button"
                                                onClick={() => setIsDrink(false)}
                                                className={`premium-drawer-tab-btn ${!isDrink ? 'active' : ''}`}
                                            >
                                                Блюдо
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setIsDrink(true)}
                                                className={`premium-drawer-tab-btn ${isDrink ? 'active' : ''}`}
                                            >
                                                Напиток
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Описание</label>
                                        <I18nFields
                                            multiline
                                            placeholder="Краткое описание для карточки..."
                                            value={editProduct.description}
                                            onChange={(v) => setEditProduct({ ...editProduct, description: v })}
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
                                            <label className="form-label">{isDrink ? 'Объем' : 'Вес'}</label>
                                            <input className="admin-input" placeholder={isDrink ? '0.2 L' : '300г'} value={editProduct.weight || ''} onChange={e => setEditProduct({ ...editProduct, weight: e.target.value })} />
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
