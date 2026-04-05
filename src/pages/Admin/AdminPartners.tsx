import React, { useState, useEffect } from 'react';
import './AdminStyles.css';

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

const AdminPartners: React.FC = () => {
    const [requests, setRequests] = useState<PartnerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            let url = '/api/partners/requests';
            
            if (filter !== 'all') {
                url += `?status_filter=${filter}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching partner requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (requestId: number, status: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`/api/partners/requests/${requestId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchRequests();
            }
        } catch (error) {
            console.error('Error deleting request:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { text: 'Новая', color: '#FFD60A' },
            contacted: { text: 'Связались', color: '#007AFF' },
            approved: { text: 'Одобрена', color: '#21EA7C' },
            rejected: { text: 'Отклонена', color: '#FF3B30' }
        };
        const badge = badges[status as keyof typeof badges] || badges.pending;
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                background: `${badge.color}20`,
                color: badge.color
            }}>
                {badge.text}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        return (
            <span style={{
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                background: type === 'restaurant' ? 'rgba(33, 234, 124, 0.1)' : 'rgba(255, 214, 10, 0.1)',
                color: type === 'restaurant' ? '#21EA7C' : '#FFD60A'
            }}>
                {type === 'restaurant' ? '🏪 Ресторан' : '🚗 Курьер'}
            </span>
        );
    };

    if (loading) {
        return <div className="admin-loading">Загрузка...</div>;
    }

    return (
        <div className="admin-content">
            <div className="admin-header">
                <h1>Партнерские заявки</h1>
                <div className="filter-buttons">
                    <button 
                        className={filter === 'all' ? 'active' : ''} 
                        onClick={() => setFilter('all')}
                    >
                        Все
                    </button>
                    <button 
                        className={filter === 'pending' ? 'active' : ''} 
                        onClick={() => setFilter('pending')}
                    >
                        Новые
                    </button>
                    <button 
                        className={filter === 'contacted' ? 'active' : ''} 
                        onClick={() => setFilter('contacted')}
                    >
                        В работе
                    </button>
                    <button 
                        className={filter === 'approved' ? 'active' : ''} 
                        onClick={() => setFilter('approved')}
                    >
                        Одобренные
                    </button>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="empty-state">
                    <p>Нет заявок</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Тип</th>
                                <th>Имя</th>
                                <th>Телефон</th>
                                <th>Email</th>
                                <th>Компания</th>
                                <th>Статус</th>
                                <th>Дата</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.id}>
                                    <td>{request.id}</td>
                                    <td>{getTypeBadge(request.type)}</td>
                                    <td>{request.name}</td>
                                    <td>
                                        <a href={`tel:${request.phone}`} style={{ color: '#21EA7C' }}>
                                            {request.phone}
                                        </a>
                                    </td>
                                    <td>
                                        {request.email ? (
                                            <a href={`mailto:${request.email}`} style={{ color: '#21EA7C' }}>
                                                {request.email}
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td>{request.company_name || '-'}</td>
                                    <td>{getStatusBadge(request.status)}</td>
                                    <td>{new Date(request.created_at).toLocaleDateString('ru-RU')}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn-view"
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setNotes(request.notes || '');
                                                }}
                                            >
                                                👁️
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => deleteRequest(request.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedRequest && (
                <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Заявка #{selectedRequest.id}</h2>
                            <button className="close-btn" onClick={() => setSelectedRequest(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Тип:</label>
                                    <div>{getTypeBadge(selectedRequest.type)}</div>
                                </div>
                                <div className="info-item">
                                    <label>Статус:</label>
                                    <div>{getStatusBadge(selectedRequest.status)}</div>
                                </div>
                                <div className="info-item">
                                    <label>Имя:</label>
                                    <div>{selectedRequest.name}</div>
                                </div>
                                <div className="info-item">
                                    <label>Телефон:</label>
                                    <div>
                                        <a href={`tel:${selectedRequest.phone}`} style={{ color: '#21EA7C' }}>
                                            {selectedRequest.phone}
                                        </a>
                                    </div>
                                </div>
                                {selectedRequest.email && (
                                    <div className="info-item">
                                        <label>Email:</label>
                                        <div>
                                            <a href={`mailto:${selectedRequest.email}`} style={{ color: '#21EA7C' }}>
                                                {selectedRequest.email}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {selectedRequest.company_name && (
                                    <div className="info-item">
                                        <label>Компания:</label>
                                        <div>{selectedRequest.company_name}</div>
                                    </div>
                                )}
                                <div className="info-item full-width">
                                    <label>Дата создания:</label>
                                    <div>{new Date(selectedRequest.created_at).toLocaleString('ru-RU')}</div>
                                </div>
                            </div>

                            {selectedRequest.message && (
                                <div className="message-box">
                                    <label>Сообщение:</label>
                                    <p>{selectedRequest.message}</p>
                                </div>
                            )}

                            <div className="notes-section">
                                <label>Заметки:</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Добавьте заметки о заявке..."
                                    rows={4}
                                />
                            </div>

                            <div className="action-buttons">
                                <button
                                    className="btn-success"
                                    onClick={() => updateStatus(selectedRequest.id, 'contacted')}
                                >
                                    📞 Связались
                                </button>
                                <button
                                    className="btn-success"
                                    onClick={() => updateStatus(selectedRequest.id, 'approved')}
                                >
                                    ✅ Одобрить
                                </button>
                                <button
                                    className="btn-danger"
                                    onClick={() => updateStatus(selectedRequest.id, 'rejected')}
                                >
                                    ❌ Отклонить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPartners;
