import { useState, useEffect, useCallback } from 'react';
import { adminApi, type Product, type Restaurant, adminAuth } from '../../../services/adminService';
import { EditIcon, TrashIcon, RefreshIcon } from '../../../components/icons/StatusIcons';

export function RestaurantMenu() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const user = adminAuth.getUser();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const restaurants = await adminApi.get<Restaurant[]>('/restaurants/');
      const partnerRoleId = localStorage.getItem('partner_role_id');
      const targetId = user?.restaurant_id || partnerRoleId;
      
      const myRestaurant = targetId
        ? restaurants.find(r => String(r.id) === String(targetId)) || restaurants[0]
        : restaurants[0];

      if (myRestaurant) {
        setRestaurant(myRestaurant);
        const prods = await adminApi.get<Product[]>(
          `/products/?restaurant_id=${myRestaurant.id}&limit=500&_t=${Date.now()}`,
          true
        );
        setProducts(prods);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.restaurant_id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !restaurant) return;
    setSaving(true);
    try {
      const isNew = !editProduct.id;
      const payload = {
        ...editProduct,
        id: editProduct.id || `prod-${Date.now()}`,
        restaurant_id: restaurant.id,
        price: Number(editProduct.price) || 0,
        weight: String(editProduct.weight || '0'),
        calories: String(editProduct.calories || '0'),
        proteins: String(editProduct.proteins || '0'),
        fats: String(editProduct.fats || '0'),
        carbs: String(editProduct.carbs || '0'),
        is_available: editProduct.is_available ?? true,
        img: editProduct.img || '',
        category: editProduct.category || 'main',
        description: editProduct.description || '',
        ingredients: editProduct.ingredients || '',
        name: editProduct.name || '',
      };
      if (isNew) {
        await adminApi.post('/products/', payload);
      } else {
        await adminApi.put(`/products/${payload.id}`, payload);
      }
      setModalOpen(false);
      setEditProduct(null);
      await loadData();
    } catch (e: any) {
      alert('Ошибка: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить позицию?')) return;
    try {
      await adminApi.delete(`/products/${id}`);
      await loadData();
    } catch {
      alert('Ошибка удаления');
    }
  };

  const toggleAvailability = async (p: Product) => {
    try {
      const updated = { ...p, is_available: !p.is_available };
      await adminApi.put(`/products/${p.id}`, updated);
      setProducts(prev => prev.map(prod => prod.id === p.id ? updated : prod));
    } catch (e) {
      alert('Ошибка при изменении статуса');
    }
  };

  const openNew = () => {
    setEditProduct({ category: 'main', price: 0, is_available: true });
    setModalOpen(true);
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category || 'main')))];
  const filtered = categoryFilter === 'all' ? products : products.filter(p => (p.category || 'main') === categoryFilter);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Меню</h1>
          {restaurant && (
            <p className="admin-subtitle">
              {restaurant.name} · {products.length} позиций
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-btn" onClick={loadData} title="Обновить">
            <RefreshIcon size={18} />
          </button>
          <button className="admin-btn admin-btn-primary" onClick={openNew}>
            Добавить блюдо
          </button>
        </div>
      </div>

      {/* Stats */}
      {restaurant && (
        <>
          <div className="stats-grid" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <span className="stat-label">Позиций</span>
            <span className="stat-value">{products.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Категорий</span>
            <span className="stat-value">{categories.length - 1}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Средняя цена</span>
            <span className="stat-value">
              {products.length > 0
                ? (products.reduce((s, p) => s + p.price, 0) / products.length).toFixed(2)
                : 0} ₾
            </span>
          </div>
        </div>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)', marginBottom: '32px', width: '100%' }} />
        </>
      )}

      {/* Category filters */}
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', width: '100%' }}>
          {categories.map(cat => (
            <FilterBtn
              key={cat}
              active={categoryFilter === cat}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all' ? `Все (${products.length})` : `${cat} (${products.filter(p => (p.category || 'main') === cat).length})`}
            </FilterBtn>
          ))}
        </div>
      )}

      {/* Products table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--admin-text-muted)' }}>Загрузка...</div>
      ) : (
        <div className="admin-table-premium">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Фото</th>
                <th>Название</th>
                <th>Цена</th>
                <th className="mobile-hide">Категория</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.img ? (
                        <img src={p.img} alt="" className="item-img" />
                    ) : (
                        <div className="item-img-premium-fallback">
                            {p.name?.[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                  </td>
                  <td>
                    <div className="product-name-cell">
                        <span className="editable-text">{p.name}</span>
                    </div>
                    {p.description && (
                      <div className="product-desc-cell" style={{ fontSize: '0.85em', color: '#888', marginTop: '4px' }}>{p.description}</div>
                    )}
                  </td>
                  <td className="inline-edit-cell" style={{ color: '#21EA7C', whiteSpace: 'nowrap', fontWeight: 700 }}>
                    {p.price} ₾
                  </td>
                  <td className="mobile-hide">
                    <span className="category-badge-premium">{p.category || 'main'}</span>
                  </td>
                  <td>
                    <div 
                      onClick={() => toggleAvailability(p)}
                      title={p.is_available ? 'Скрыть блюдо' : 'Сделать доступным'}
                      style={{
                        width: '48px', height: '26px', 
                        borderRadius: '30px', 
                        background: p.is_available ? 'linear-gradient(135deg, #21ea7c, #10b981)' : 'linear-gradient(135deg, #2a2d3a, #1f212a)',
                        position: 'relative', cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid',
                        borderColor: p.is_available ? 'rgba(33, 234, 124, 0.5)' : 'rgba(255, 255, 255, 0.06)',
                        boxShadow: p.is_available ? '0 0 12px rgba(33, 234, 124, 0.25)' : 'inset 0 2px 6px rgba(0,0,0,0.4)',
                      }}
                    >
                      <div style={{
                        width: '20px', height: '20px',
                        borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: '2px',
                        left: p.is_available ? '24px' : '2px',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {p.is_available ? (
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        ) : (
                          <div style={{ width: '6px', height: '2px', borderRadius: '1px', background: '#9ca3af' }} />
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-action-btns-gap">
                      <button className="btn-action-glass btn-edit" onClick={() => { setEditProduct({ ...p }); setModalOpen(true); }} title="Редактировать">
                        <EditIcon size={16} />
                      </button>
                      <button className="btn-action-glass btn-delete" onClick={() => handleDelete(p.id)} title="Удалить">
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="admin-empty-msg">
              {categoryFilter !== 'all' ? 'Нет позиций в этой категории' : 'Меню пустое'}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && editProduct && (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editProduct.id ? 'Редактировать блюдо' : 'Новое блюдо'}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-scroll-area">
                <div className="form-group">
                  <label className="form-label">Название *</label>
                  <input
                    className="admin-input"
                    value={editProduct.name || ''}
                    onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                    required
                    placeholder="Название блюда"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Цена (₾) *</label>
                    <input
                      type="number" step="0.01" className="admin-input"
                      value={editProduct.price || ''}
                      onChange={e => setEditProduct({ ...editProduct, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Категория</label>
                    <input
                      className="admin-input"
                      value={editProduct.category || ''}
                      onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                      placeholder="main"
                      list="cats"
                    />
                    <datalist id="cats">
                      {categories.filter(c => c !== 'all').map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Описание</label>
                  <textarea
                    className="admin-input"
                    style={{ height: 80, resize: 'none' }}
                    value={editProduct.description || ''}
                    onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                    placeholder="Краткое описание..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Фото (URL)</label>
                  <input
                    className="admin-input"
                    value={editProduct.img || ''}
                    onChange={e => setEditProduct({ ...editProduct, img: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editProduct.is_available ?? true}
                      onChange={e => setEditProduct({ ...editProduct, is_available: e.target.checked })}
                    />
                    Доступно для заказа
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="admin-btn" onClick={() => setModalOpen(false)}>Отмена</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px',
        background: active ? '#21ea7c' : '#222532',
        color: active ? '#0f1117' : '#a0a5b1',
        border: 'none',
        borderRadius: '100px',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = '#2a2e3d';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = '#222532';
      }}
    >
      {children}
    </button>
  );
}
