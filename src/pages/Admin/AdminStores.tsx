import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminService';
import { Store } from '../../services/api';
import { EditIcon, TrashIcon, PlusIcon, RefreshIcon } from '../../components/icons/StatusIcons';
import './AdminStyles.css';

export function AdminStores() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editStore, setEditStore] = useState<Partial<Store> | null>(null);

    const loadStores = async () => {
        setLoading(true);
        try {
            // Using adminApi to ensure Auth headers are sent
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
            alert('Failed to save store');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this store?')) return;
        try {
            await adminApi.delete(`/stores/${id}`);
            loadStores();
        } catch (error) {
            alert('Failed to delete store');
        }
    };

    const openEdit = (store: Store) => {
        setEditStore({ ...store });
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditStore({ name: '', delivery: '30-40 min', sort_order: 0, img: '' });
        setIsModalOpen(true);
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1 className="page-title">Stores Management</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="admin-btn" onClick={loadStores}>
                        <RefreshIcon size={18} />
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={openNew}>
                        <PlusIcon size={18} style={{ marginRight: 8 }} /> Add Store
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="admin-card">Loading...</div>
            ) : (
                <div className="admin-card admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Delivery</th>
                                <th>Sort</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map(store => (
                                <tr key={store.id}>
                                    <td>
                                        {store.img ? (
                                            <img src={store.img} alt="" className="item-img" />
                                        ) : (
                                            <div className="item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{store.name[0]}</div>
                                        )}
                                    </td>
                                    <td>{store.name}</td>
                                    <td>{store.delivery}</td>
                                    <td>{store.sort_order}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="admin-btn" onClick={() => openEdit(store)}>
                                                <EditIcon size={16} />
                                            </button>
                                            <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(store.id)}>
                                                <TrashIcon size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {stores.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>No stores found</div>}
                </div>
            )}

            {isModalOpen && editStore && (
                <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0, marginBottom: 20 }}>{editStore.id ? 'Edit Store' : 'New Store'}</h2>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    className="admin-input"
                                    value={editStore.name || ''}
                                    onChange={e => setEditStore({ ...editStore, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Delivery Time</label>
                                <input
                                    className="admin-input"
                                    value={editStore.delivery || ''}
                                    onChange={e => setEditStore({ ...editStore, delivery: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sort Order</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    value={editStore.sort_order || 0}
                                    onChange={e => setEditStore({ ...editStore, sort_order: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Image</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    {editStore.img && (
                                        <img src={editStore.img} alt="Preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', background: '#333' }} />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="admin-input"
                                            style={{ padding: '8px' }}
                                            onChange={async (e) => {
                                                if (e.target.files?.[0]) {
                                                    try {
                                                        // Show loading indicator or toast could be added here
                                                        const res = await adminApi.upload(e.target.files[0]);
                                                        if (res.success) {
                                                            setEditStore(prev => prev ? ({ ...prev, img: res.url }) : null);
                                                        }
                                                    } catch (err) {
                                                        alert('Upload failed');
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
                                    placeholder="Or paste direct image URL"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="admin-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="admin-btn admin-btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
