import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminService';
import { Store } from '../../services/api';
import { EditIcon, TrashIcon, RefreshIcon } from '../../components/icons/StatusIcons';
import FullPageLoader from '../../components/UI/FullPageLoader';
import './AdminStyles.css';

export function AdminStores() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editStore, setEditStore] = useState<Partial<Store> | null>(null);

    const loadStores = async () => {
        setLoading(true);
        try {
            const data = await adminApi.get<Store[]>('/stores/');
            setStores(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStores(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editStore || !editStore.name) return;

        try {
            if (editStore.id) {
                await adminApi.put(`/stores/${editStore.id}`, editStore);
            } else {
                const newId = `store-${Date.now()}`;
                const payload = {
                    ...editStore,
                    id: newId,
                    name: editStore.name,
                    img: editStore.img || '',
                    delivery: editStore.delivery || '30-40 min',
                    sort_order: editStore.sort_order || 0
                };
                await adminApi.post('/stores/', payload);
            }
            setIsModalOpen(false);
            setEditStore(null);
            loadStores();
        } catch (error) {
            alert('Не удалось сохранить магазин');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот магазин?')) return;
        try {
            await adminApi.delete(`/stores/${id}`);
            loadStores();
        } catch (error) {
            alert('Ошибка удаления магазина');
        }
    };

    const openEdit = (store: Store) => {
        setEditStore({ ...store });
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditStore({ name: '', delivery: '30-40 мин', sort_order: 0, img: '' });
        setIsModalOpen(true);
    };

    if (loading) return <FullPageLoader variant="list" />;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-1px', textTransform: 'uppercase' }}>Магазины</h1>
                    <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>Управление партнерскими магазинами, параметрами доставки и сортировкой.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="admin-btn" onClick={loadStores} title="Обновить">
                        <RefreshIcon size={18} />
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={openNew}>
                        Добавить
                    </button>
                </div>
            </div>

            <div className="admin-table-premium">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Логотип</th>
                            <th>Название</th>
                            <th>Доставка</th>
                            <th>Сортировка</th>
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.map(store => (
                            <tr key={store.id}>
                                <td>
                                    {store.img ? (
                                        <img src={store.img} alt="" className="item-img" />
                                    ) : (
                                        <div className="item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', fontWeight: 700, color: 'var(--admin-primary)' }}>
                                            {store.name[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </td>
                                <td style={{ fontWeight: 600 }}>{store.name}</td>
                                <td style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>{store.delivery}</td>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{store.sort_order}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="admin-action-btns-gap" style={{ justifyContent: 'flex-end' }}>
                                        <button className="btn-action-glass btn-edit" onClick={() => openEdit(store)} title="Редактировать">
                                            <EditIcon size={16} />
                                        </button>
                                        <button className="btn-action-glass btn-delete" onClick={() => handleDelete(store.id)} title="Удалить">
                                            <TrashIcon size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {stores.length === 0 && <div className="admin-empty-msg">Магазины не найдены</div>}
            </div>

            {isModalOpen && editStore && (
                <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editStore.id ? 'Редактировать магазин' : 'Новый магазин'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-scroll-area">
                                
                                <div className="section-subtitle">Основная информация</div>

                                <div className="form-group">
                                    <label className="form-label">Название</label>
                                    <input
                                        className="admin-input"
                                        value={editStore.name || ''}
                                        onChange={e => setEditStore({ ...editStore, name: e.target.value })}
                                        placeholder="Например: Супермаркет Гудвилл"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Время доставки</label>
                                    <input
                                        className="admin-input"
                                        value={editStore.delivery || ''}
                                        onChange={e => setEditStore({ ...editStore, delivery: e.target.value })}
                                        placeholder="30-40 мин"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Порядок сортировки</label>
                                    <input
                                        type="number"
                                        className="admin-input"
                                        value={editStore.sort_order || 0}
                                        onChange={e => setEditStore({ ...editStore, sort_order: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                <div className="section-subtitle">Изображение магазина</div>

                                <div className="form-group">
                                    <label className="form-label">Изображение</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                                        {editStore.img ? (
                                            <img src={editStore.img} alt="Preview" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', background: '#333' }} />
                                        ) : (
                                            <div style={{ width: 64, height: 64, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>Нет фото</div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="admin-input"
                                                style={{ padding: '10px' }}
                                                onChange={async (e) => {
                                                    if (e.target.files?.[0]) {
                                                        try {
                                                            const res = await adminApi.upload(e.target.files[0]);
                                                            if (res.success) {
                                                                setEditStore(prev => prev ? ({ ...prev, img: res.url }) : null);
                                                            }
                                                        } catch (err) {
                                                            alert('Ошибка загрузки фото');
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <input
                                        className="admin-input"
                                        value={editStore.img || ''}
                                        onChange={e => setEditStore({ ...editStore, img: e.target.value })}
                                        placeholder="Или вставьте прямую ссылку на изображение"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="admin-btn" onClick={() => setIsModalOpen(false)}>Отмена</button>
                                <button type="submit" className="admin-btn admin-btn-primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
