import { useState, useEffect } from 'react';
import { adminApi, Restaurant } from '../../services/adminService';
import AddressSelector from '../../components/Map/AddressSelector';
import { EditIcon, TrashIcon, PlusIcon, RefreshIcon } from '../../components/icons/StatusIcons';
import './AdminStyles.css';

declare global {
    interface Window {
        ymaps: any;
    }
}

export function AdminRestaurants() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editRestaurant, setEditRestaurant] = useState<Partial<Restaurant> | null>(null);
    const [showMapSelector, setShowMapSelector] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminApi.get<Restaurant[]>('/restaurants/');
            setRestaurants(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editRestaurant || !editRestaurant.name) return;

        try {
            if (editRestaurant.id) {
                await adminApi.put(`/restaurants/${editRestaurant.id}`, editRestaurant);
            } else {
                const newId = `rest-${Date.now()}`;
                const payload = {
                    ...editRestaurant,
                    id: newId,
                    name: editRestaurant.name!,
                    img: editRestaurant.img || '',
                    rating: editRestaurant.rating || '4.5',
                    delivery: editRestaurant.delivery || '30-45 min',
                    screen: (editRestaurant as any).screen || 'restaurant-default'
                };
                await adminApi.post('/restaurants/', payload);
            }
            setIsModalOpen(false);
            setEditRestaurant(null);
            load();
        } catch (error) {
            alert('Failed to save restaurant');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this restaurant?')) return;
        try {
            await adminApi.delete(`/restaurants/${id}`);
            load();
        } catch (e: any) {
            const msg = e.message || '';
            // Check if error is due to existing products
            if (msg.includes("Restaurant has products")) {
                if (confirm('Restaurant has products attached. Delete restaurant AND all its products?')) {
                    try {
                        // Pass param in URL manually
                        await adminApi.delete(`/restaurants/${id}?delete_products=true`);
                        load();
                        return;
                    } catch (retryErr: any) {
                        alert('Failed to delete: ' + retryErr.message);
                    }
                }
            } else {
                alert('Failed to delete: ' + msg);
            }
        }
    };

    const openEdit = (r: Restaurant) => {
        setEditRestaurant({ ...r });
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditRestaurant({ name: '', rating: '5.0', delivery: '30 min', img: '' }); // screen field might be missing in type
        setIsModalOpen(true);
    };

    if (loading) return <div className="admin-loading">Loading...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1 className="page-title">Restaurants Management</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="admin-btn" onClick={load}>
                        <RefreshIcon size={18} />
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={openNew}>
                        <PlusIcon size={18} style={{ marginRight: 8 }} /> New Restaurant
                    </button>
                </div>
            </div>

            <div className="admin-card admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Preview</th>
                            <th>Name</th>
                            <th>Rating</th>
                            <th>Delivery</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {restaurants.map(r => (
                            <tr key={r.id}>
                                <td>
                                    {r.img ? <img src={r.img} alt="" className="item-img" /> : (
                                        <div className="item-img" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#222' }}>{r.name[0]}</div>
                                    )}
                                </td>
                                <td>{r.name}</td>
                                <td><span style={{ color: '#FFD700' }}>★</span> {r.rating}</td>
                                <td>{r.delivery}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="admin-btn" onClick={() => openEdit(r)}>
                                            <EditIcon size={16} />
                                        </button>
                                        <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(r.id)}>
                                            <TrashIcon size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {restaurants.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>No restaurants found</div>}
            </div>

            {isModalOpen && editRestaurant && (
                <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0, marginBottom: 20 }}>{editRestaurant.id ? 'Edit Restaurant' : 'New Restaurant'}</h2>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    className="admin-input"
                                    value={editRestaurant.name || ''}
                                    onChange={e => setEditRestaurant({ ...editRestaurant, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Rating (e.g. 4.8)</label>
                                <input
                                    className="admin-input"
                                    value={editRestaurant.rating || ''}
                                    onChange={e => setEditRestaurant({ ...editRestaurant, rating: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Delivery (e.g. 20-30 min)</label>
                                <input
                                    className="admin-input"
                                    value={editRestaurant.delivery || ''}
                                    onChange={e => setEditRestaurant({ ...editRestaurant, delivery: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label">Address</label>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input
                                            className="admin-input"
                                            placeholder="Enter address or select on map"
                                            value={editRestaurant.address || ''}
                                            onChange={e => setEditRestaurant({ ...editRestaurant, address: e.target.value })}
                                            onBlur={() => { }}
                                        />
                                        <button
                                            type="button"
                                            className="admin-btn"
                                            style={{ padding: '0 10px' }}
                                            onClick={() => setShowMapSelector(true)}
                                        >
                                            🗺️
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label">Latitude</label>
                                    <input
                                        className="admin-input"
                                        type="number"
                                        step="any"
                                        readOnly
                                        style={{ background: '#333', color: '#888' }}
                                        value={editRestaurant.latitude || ''}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="form-label">Longitude</label>
                                    <input
                                        className="admin-input"
                                        type="number"
                                        step="any"
                                        readOnly
                                        style={{ background: '#333', color: '#888' }}
                                        value={editRestaurant.longitude || ''}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Image</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    {editRestaurant.img && (
                                        <img src={editRestaurant.img} alt="Preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', background: '#333' }} />
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
                                                        const res = await adminApi.upload(e.target.files[0]);
                                                        if (res.success) {
                                                            setEditRestaurant(prev => prev ? ({ ...prev, img: res.url }) : null);
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
                                    value={editRestaurant.img || ''}
                                    onChange={e => setEditRestaurant({ ...editRestaurant, img: e.target.value })}
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

            {showMapSelector && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
                    <AddressSelector
                        onClose={() => setShowMapSelector(false)}
                        onSelect={(data) => {
                            setEditRestaurant(prev => prev ? ({
                                ...prev,
                                address: data.address, // Full formatted address
                                latitude: data.coords[0],
                                longitude: data.coords[1]
                            }) : null);
                            setShowMapSelector(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
