import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminService';
import { Restaurant } from '../../services/api';
import RestaurantEditModal from './RestaurantEditModal';
import { EditIcon, TrashIcon, RefreshIcon } from '../../components/icons/StatusIcons';
import FullPageLoader from '../../components/UI/FullPageLoader';
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

    const handleSave = async (data: Partial<Restaurant>) => {
        if (!data.name) return;

        try {
            if (data.id) {
                console.log('[DEBUG] PUT payload:', JSON.stringify({
                    id: data.id,
                    poster_token: data.poster_token,
                    poster_spot_id: data.poster_spot_id
                }));
                const result = await adminApi.put<Restaurant>(`/restaurants/${data.id}`, data);
                console.log('[DEBUG] PUT response:', JSON.stringify({
                    poster_token: (result as any)?.poster_token,
                    poster_spot_id: (result as any)?.poster_spot_id
                }));
            } else {
                const newId = `rest-${Date.now()}`;
                const payload = {
                    ...data,
                    id: newId,
                    name: data.name!,
                    img: data.img || '',
                    rating: data.rating || '5.0',
                    delivery: data.delivery || '30-45 min',
                    screen: (data as any).screen || 'restaurant-default'
                };
                await adminApi.post('/restaurants/', payload);
            }
            setIsModalOpen(false);
            setEditRestaurant(null);
            load();
        } catch (error: any) {
            console.error('[DEBUG] Save error:', error?.message, error);
            alert('Не удалось сохранить ресторан: ' + (error?.message || 'Неизвестная ошибка'));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить этот ресторан?')) return;
        try {
            await adminApi.delete(`/restaurants/${id}`);
            load();
        } catch (e: any) {
            const msg = e.message || '';
            if (msg.includes("Restaurant has products")) {
                if (confirm('У ресторана есть привязанные товары. Удалить ресторан И все его товары?')) {
                    try {
                        await adminApi.delete(`/restaurants/${id}?delete_products=true`);
                        load();
                        return;
                    } catch (retryErr: any) {
                        alert('Ошибка удаления: ' + retryErr.message);
                    }
                }
            } else {
                alert('Ошибка удаления: ' + msg);
            }
        }
    };

    const openEdit = (r: Restaurant) => {
        setEditRestaurant({ ...r });
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditRestaurant({ name: '', rating: '5.0', delivery: '30-40 мин', img: '' });
        setIsModalOpen(true);
    };

    if (loading) return <FullPageLoader variant="list" />;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-1px', textTransform: 'uppercase' }}>Рестораны</h1>
                    <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>Управление заведениями, адресами и параметрами доставки.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="admin-btn" onClick={load} title="Обновить">
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
                            <th>Рейтинг</th>
                            <th>Доставка</th>
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {restaurants.map(r => (
                            <tr key={r.id}>
                                <td>
                                    {r.img ? <img src={r.img} alt="" className="item-img" /> : (
                                        <div className="item-img" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.05)', fontWeight: 700, color: 'var(--admin-primary)' }}>
                                            {r.name[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </td>
                                 <td style={{ fontWeight: 600 }}>
                                     <div>{r.name}</div>
                                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                     {r.is_must_try ? (
                                         <span style={{ fontSize: '0.7rem', color: '#21EA7C', background: 'rgba(33,234,124,0.08)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(33,234,124,0.18)', fontWeight: 600 }}>Must Try</span>
                                     ) : null}
                                     {r.is_worth_trying ? (
                                         <span style={{ fontSize: '0.7rem', color: '#7dd3fc', background: 'rgba(125,211,252,0.08)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(125,211,252,0.18)', fontWeight: 600 }}>Worth Trying</span>
                                     ) : null}
                                     {r.has_promo ? (
                                         <span style={{ fontSize: '0.7rem', color: '#fbbf24', background: 'rgba(251,191,36,0.08)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.18)', fontWeight: 600 }}>Promo</span>
                                     ) : null}
                                     {r.poster_token && r.poster_spot_id ? (
                                         <div style={{ 
                                             display: 'inline-flex', 
                                             alignItems: 'center', 
                                             gap: '4px', 
                                             fontSize: '0.72rem', 
                                             color: '#21EA7C', 
                                             background: 'rgba(33, 234, 124, 0.06)',
                                             padding: '2px 8px',
                                             borderRadius: '6px',
                                             fontWeight: 600,
                                             border: '1px solid rgba(33, 234, 124, 0.15)'
                                         }}>
                                             <span style={{ fontSize: '0.78rem' }}>🔌</span> Poster активен
                                         </div>
                                     ) : null}
                                     </div>
                                 </td>
                                 <td><span style={{ color: '#FFD700' }}>★</span> {r.rating}</td>
                                <td style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>{r.delivery}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="admin-action-btns-gap" style={{ justifyContent: 'flex-end' }}>
                                        <button className="btn-action-glass btn-edit" onClick={() => openEdit(r)} title="Редактировать">
                                            <EditIcon size={16} />
                                        </button>
                                        <button className="btn-action-glass btn-delete" onClick={() => handleDelete(r.id)} title="Удалить">
                                            <TrashIcon size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {restaurants.length === 0 && <div className="admin-empty-msg">Рестораны не найдены</div>}
            </div>

            <RestaurantEditModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditRestaurant(null);
                }}
                restaurant={editRestaurant}
                onSave={handleSave}
            />
        </div>
    );
}
