import React, { useState, useEffect } from 'react';
import { adminApi, type AdminUser, type UserRole, type Restaurant } from '../../services/adminService';
import { TrashIcon, EditIcon } from '../../components/icons/StatusIcons';
import FullPageLoader from '../../components/UI/FullPageLoader';
import './AdminStyles.css';

export function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [editUser, setEditUser] = useState<Partial<AdminUser> & { password?: string }>({});

    const loadData = async () => {
        setLoading(true);
        try {
            const usersData = await adminApi.get<AdminUser[]>('/admin/users');
            setUsers(usersData);
        } catch (err: any) {
            console.error('Users load error:', err.message);
        }

        // Load restaurants separately — fallback to main endpoint if /admin doesn't exist
        try {
            const restsData = await adminApi.get<Restaurant[]>('/restaurants/admin');
            setRestaurants(restsData);
        } catch {
            try {
                const restsData = await adminApi.get<Restaurant[]>('/restaurants/');
                setRestaurants(restsData);
            } catch {
                console.warn('Could not load restaurants list');
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = (user?: AdminUser) => {
        setError('');
        if (user) {
            setEditUser({ ...user, password: '' });
        } else {
            setEditUser({ username: '', password: '', role: 'super_admin', restaurant_id: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!editUser.username || editUser.username.length < 3) {
            setError('Username должен быть минимум 3 символа');
            return;
        }

        if (!editUser.id && (!editUser.password || editUser.password.length < 6)) {
            setError('Пароль должен быть минимум 6 символов');
            return;
        }



        setSaving(true);

        // Build clean payload — only send fields the backend expects
        const payload: Record<string, unknown> = {
            username: editUser.username,
            role: editUser.role,
            restaurant_id: editUser.restaurant_id || null,
        };

        // Only include password if it's provided (non-empty)
        if (editUser.password && editUser.password.length > 0) {
            payload.password = editUser.password;
        }

        try {
            if (editUser.id) {
                await adminApi.put(`/admin/users/${editUser.id}`, payload);
            } else {
                await adminApi.post('/admin/users', payload);
            }
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            setError(err.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Вы уверены?')) return;
        try {
            await adminApi.delete(`/admin/users/${id}`);
            loadData();
        } catch (err: any) {
            alert(err.message || 'Ошибка удаления');
        }
    };

    const getRoleBadge = (role: string) => {
        const labels: Record<string, string> = {
            super_admin: '👑 Super Admin',
            restaurant_admin: '🍽️ Ресторан',
            courier: '🚴 Курьер',
        };
        return labels[role] || role;
    };

    if (loading) return <FullPageLoader variant="list" />;

    return (
        <div className="admin-users-page">
            <div className="page-header">
                <h1 className="page-title">Управление пользователями</h1>
                <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal()}>
                    Добавить
                </button>
            </div>

            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="admin-table-premium">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Имя пользователя</th>
                                <th>Роль</th>
                                <th>Ресторан</th>
                                <th style={{ textAlign: 'right' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="product-name-cell">{user.username}</td>
                                    <td>
                                        <span className={`status-badge role-${user.role}`}>
                                            {getRoleBadge(user.role)}
                                        </span>
                                    </td>
                                    <td>
                                        {user.restaurant_id
                                            ? restaurants.find(r => String(r.id) === String(user.restaurant_id))?.name || user.restaurant_id
                                            : '——'
                                        }
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="admin-action-btns-gap" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn-action-glass btn-edit" title="Редактировать" onClick={() => handleOpenModal(user)}>
                                                <EditIcon size={16} />
                                            </button>
                                            <button className="btn-action-glass btn-delete" title="Удалить" onClick={() => handleDelete(user.id)}>
                                                <TrashIcon size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--admin-text-muted)' }}>
                                        Нет пользователей
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editUser.id ? 'Редактировать' : 'Новый пользователь'}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave} className="admin-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-scroll-area">
                                {error && (
                                    <div style={{
                                        padding: '10px 14px',
                                        background: 'rgba(248, 113, 113, 0.15)',
                                        border: '1px solid rgba(248, 113, 113, 0.3)',
                                        borderRadius: '8px',
                                        color: '#f87171',
                                        fontSize: '0.85rem',
                                        marginBottom: '16px'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Username</label>
                                    <input
                                        className="admin-input"
                                        placeholder="Например: admin_rest1"
                                        value={editUser.username || ''}
                                        onChange={e => setEditUser({ ...editUser, username: e.target.value })}
                                        required
                                        minLength={3}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Пароль {editUser.id && <span style={{ color: 'var(--admin-text-muted)', fontWeight: 400 }}>(оставьте пустым чтобы не менять)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        className="admin-input"
                                        placeholder={editUser.id ? '••••••' : 'Минимум 6 символов'}
                                        value={editUser.password || ''}
                                        onChange={e => setEditUser({ ...editUser, password: e.target.value })}
                                        required={!editUser.id}
                                        minLength={editUser.id ? 0 : 6}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Роль</label>
                                    <select
                                        className="admin-input"
                                        value={editUser.role || 'restaurant_admin'}
                                        onChange={e => {
                                            const newRole = e.target.value as UserRole;
                                            setEditUser({
                                                ...editUser,
                                                role: newRole,
                                                // Clear restaurant_id if switching to super_admin or courier
                                                restaurant_id: newRole === 'restaurant_admin' ? editUser.restaurant_id : ''
                                            });
                                        }}
                                    >
                                        <option value="super_admin">👑 Super Admin</option>
                                        <option value="editor">📝 Редактор</option>
                                        <option value="dispatcher">🎧 Диспетчер</option>
                                        <option value="business_owner">💼 Владелец бизнеса</option>
                                    </select>
                                </div>


                            </div>

                            <div className="modal-actions">
                                <button type="button" className="admin-btn" onClick={() => setIsModalOpen(false)} disabled={saving}>
                                    Отмена
                                </button>
                                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                                    {saving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .role-super_admin { color: #facc15; background: rgba(250, 204, 21, 0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; }
                .role-restaurant_admin { color: #21EA7C; background: rgba(33, 234, 124, 0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; }
                .role-courier { color: #60a5fa; background: rgba(96, 165, 250, 0.1); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; }
            `}</style>
        </div>
    );
}
