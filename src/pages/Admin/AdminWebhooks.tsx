import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminService';
import { EditIcon, TrashIcon, RefreshIcon } from '../../components/icons/StatusIcons';
import FullPageLoader from '../../components/UI/FullPageLoader';
import './AdminStyles.css';

interface WebhookSubscription {
    id: string;
    name: string;
    url: string;
    secret?: string;
    events: string[];
    direction: 'outbound' | 'inbound' | 'bidirectional';
    is_active: boolean;
    created_at?: string;
}

interface WebhookDelivery {
    id?: string;
    status: 'delivered' | 'failed';
    http_status: number;
    last_response: string;
    created_at: string;
}

const AVAILABLE_EVENTS = [
    { id: '*', label: 'Все события (Wildcard)' },
    { id: 'order.created', label: 'order.created (Заказ создан)' },
    { id: 'order.status_changed', label: 'order.status_changed (Изменение статуса заказа)' },
    { id: 'order.accepted', label: 'order.accepted (Заказ принят)' },
    { id: 'order.ready', label: 'order.ready (Заказ готов)' },
    { id: 'order.delivering', label: 'order.delivering (Заказ доставляется)' },
    { id: 'order.delivered', label: 'order.delivered (Заказ доставлен)' },
    { id: 'order.cancelled', label: 'order.cancelled (Заказ отменен)' }
];

export function AdminWebhooks() {
    const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Partial<WebhookSubscription> | null>(null);
    const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);
    
    // Delivery logs state
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [selectedSubForLogs, setSelectedSubForLogs] = useState<WebhookSubscription | null>(null);
    const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [expandedLogIdx, setExpandedLogIdx] = useState<number | null>(null);

    const loadSubscriptions = async () => {
        setLoading(true);
        try {
            const data = await adminApi.get<{ subscriptions: WebhookSubscription[] }>('/webhooks/subscriptions', true);
            setSubscriptions(data.subscriptions || []);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const handleOpenEdit = (sub: WebhookSubscription) => {
        setEditingSub({ ...sub });
        setIsEditModalOpen(true);
    };

    const handleOpenCreate = () => {
        setEditingSub({
            name: '',
            url: '',
            secret: '',
            events: ['order.created'],
            direction: 'outbound',
            is_active: true
        });
        setIsEditModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSub || !editingSub.name || !editingSub.url) return;

        try {
            if (editingSub.id) {
                // Edit
                await adminApi.put(`/webhooks/subscriptions/${editingSub.id}`, editingSub);
                setIsEditModalOpen(false);
                setEditingSub(null);
                loadSubscriptions();
            } else {
                // Create
                const res = await adminApi.post<WebhookSubscription>('/webhooks/subscriptions', editingSub);
                setIsEditModalOpen(false);
                setEditingSub(null);
                
                // Show one-time secret alert if returned by backend
                if (res && res.secret) {
                    setOneTimeSecret(res.secret);
                }
                loadSubscriptions();
            }
        } catch (err: any) {
            alert('Не удалось сохранить подписку: ' + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту подписку на Webhooks?')) return;
        try {
            await adminApi.delete(`/webhooks/subscriptions/${id}`);
            loadSubscriptions();
        } catch (err: any) {
            alert('Ошибка удаления подписки: ' + err.message);
        }
    };

    const loadLogs = async (sub: WebhookSubscription) => {
        setLoadingLogs(true);
        setDeliveries([]);
        setExpandedLogIdx(null);
        setSelectedSubForLogs(sub);
        setIsLogsModalOpen(true);
        try {
            const res = await adminApi.get<{ deliveries: WebhookDelivery[] }>(`/webhooks/subscriptions/${sub.id}/deliveries?limit=50`, true);
            setDeliveries(res.deliveries || []);
        } catch (error: any) {
            console.error('Error fetching webhook deliveries:', error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const toggleEvent = (eventId: string) => {
        if (!editingSub) return;
        let nextEvents = [...(editingSub.events || [])];
        
        if (eventId === '*') {
            // Wildcard toggles everything else
            if (nextEvents.includes('*')) {
                nextEvents = [];
            } else {
                nextEvents = ['*'];
            }
        } else {
            // Remove wildcard if setting specific events
            nextEvents = nextEvents.filter(e => e !== '*');
            if (nextEvents.includes(eventId)) {
                nextEvents = nextEvents.filter(e => e !== eventId);
            } else {
                nextEvents.push(eventId);
            }
        }
        setEditingSub({ ...editingSub, events: nextEvents });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Секретный ключ скопирован!');
    };

    if (loading) return <FullPageLoader text="Загрузка вебхуков..." />;

    return (
        <div className="admin-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-1px', textTransform: 'uppercase' }}>Вебхуки</h1>
                    <p style={{ color: 'var(--admin-text-muted)', margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>Управление подписками на события и интеграция с внешними системами.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="admin-btn" onClick={loadSubscriptions} title="Обновить">
                        <RefreshIcon size={18} />
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={handleOpenCreate}>
                        Создать подписку
                    </button>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="admin-table-premium">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Направление</th>
                            <th>Назначение (URL)</th>
                            <th>События</th>
                            <th>Статус</th>
                            <th style={{ textAlign: 'right' }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subscriptions.map(sub => (
                            <tr key={sub.id}>
                                <td style={{ fontWeight: 600 }}>{sub.name}</td>
                                <td>
                                    <span style={{ 
                                        display: 'inline-flex', 
                                        padding: '2px 8px', 
                                        borderRadius: '6px', 
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--admin-text-muted)',
                                        textTransform: 'uppercase'
                                    }}>
                                        {sub.direction}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--admin-text-muted)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{sub.url}</td>
                                <td>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {sub.events.map(ev => (
                                            <span key={ev} style={{
                                                fontSize: '0.75rem',
                                                background: ev === '*' ? 'rgba(33, 234, 124, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                                                color: ev === '*' ? 'var(--admin-primary)' : 'var(--admin-text)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                border: ev === '*' ? '1px solid rgba(33, 234, 124, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                                            }}>
                                                {ev}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ 
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: sub.is_active ? '#21EA7C' : 'var(--admin-text-muted)'
                                    }}>
                                        <span style={{ 
                                            width: '6px', 
                                            height: '6px', 
                                            borderRadius: '50%', 
                                            backgroundColor: sub.is_active ? '#21EA7C' : 'var(--admin-text-muted)'
                                        }}></span>
                                        {sub.is_active ? 'Активна' : 'Неактивна'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div className="admin-action-btns-gap" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <button className="admin-btn" style={{ padding: '6px 12px', fontSize: '0.8rem', height: 'auto', minHeight: 'unset' }} onClick={() => loadLogs(sub)}>
                                            Диагностика
                                        </button>
                                        <button className="btn-action-glass btn-edit" onClick={() => handleOpenEdit(sub)} title="Редактировать">
                                            <EditIcon size={16} />
                                        </button>
                                        <button className="btn-action-glass btn-delete" onClick={() => handleDelete(sub.id)} title="Удалить">
                                            <TrashIcon size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {subscriptions.length === 0 && <div className="admin-empty-msg">Подписки на вебхуки не созданы. Нажмите "Создать подписку" для интеграции.</div>}
            </div>

            {/* Create/Edit Modal */}
            {isEditModalOpen && editingSub && (
                <div className="admin-centered-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="admin-centered-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingSub.id ? 'Редактировать вебхук' : 'Новая подписка на вебхук'}</h2>
                            <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            <div className="modal-scroll-area" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Название подписки</label>
                                    <input 
                                        type="text" 
                                        className="admin-input" 
                                        required 
                                        value={editingSub.name || ''} 
                                        onChange={e => setEditingSub({ ...editingSub, name: e.target.value })}
                                        placeholder="Напр: crm-sync"
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">URL назначения (Webhook Endpoint)</label>
                                    <input 
                                        type="url" 
                                        className="admin-input" 
                                        required 
                                        value={editingSub.url || ''} 
                                        onChange={e => setEditingSub({ ...editingSub, url: e.target.value })}
                                        placeholder="https://yourdomain.com/hooks/mestigo"
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Секретный ключ (Secret)</label>
                                    <input 
                                        type="password" 
                                        className="admin-input" 
                                        value={editingSub.secret || ''} 
                                        onChange={e => setEditingSub({ ...editingSub, secret: e.target.value })}
                                        placeholder={editingSub.id ? "•••••••••••••••• (оставьте пустым, чтобы не изменять)" : "Оставьте пустым для автогенерации"}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Направление</label>
                                    <select 
                                        className="admin-input" 
                                        value={editingSub.direction || 'outbound'}
                                        onChange={e => setEditingSub({ ...editingSub, direction: e.target.value as any })}
                                    >
                                        <option value="outbound">Outbound (Исходящие события от Mestigo)</option>
                                        <option value="inbound">Inbound (Входящие от сторонних систем)</option>
                                        <option value="bidirectional">Bidirectional (Двусторонние)</option>
                                    </select>
                                </div>

                                {/* Events Checkbox Selector */}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ marginBottom: '8px' }}>События для подписки</label>
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '10px', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {AVAILABLE_EVENTS.map(ev => {
                                            const isChecked = editingSub.events?.includes(ev.id);
                                            const isDisabled = ev.id !== '*' && editingSub.events?.includes('*');

                                            return (
                                                <label 
                                                    key={ev.id} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: '10px', 
                                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.88rem',
                                                        color: isDisabled ? 'var(--admin-text-muted)' : 'var(--admin-text)'
                                                    }}
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked || false} 
                                                        disabled={isDisabled}
                                                        onChange={() => toggleEvent(ev.id)}
                                                        style={{ 
                                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                            accentColor: 'var(--admin-primary)'
                                                        }}
                                                    />
                                                    <span>{ev.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={editingSub.is_active || false} 
                                            onChange={e => setEditingSub({ ...editingSub, is_active: e.target.checked })}
                                            style={{ cursor: 'pointer', accentColor: 'var(--admin-primary)' }}
                                        />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Активная подписка</span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="admin-btn" onClick={() => setIsEditModalOpen(false)}>Отмена</button>
                                <button type="submit" className="admin-btn admin-btn-primary">Сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* One-Time Secret Alert Modal */}
            {oneTimeSecret && (
                <div className="admin-centered-modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="admin-centered-modal" style={{ maxWidth: '500px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div className="modal-header">
                            <h2 className="modal-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ⚠️ Секрет создан!
                            </h2>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0, color: 'var(--admin-text-muted)' }}>
                                Скопируйте этот секретный ключ прямо сейчас. <strong>В целях безопасности он больше не будет показан повторно!</strong> Используйте его для валидации подписей HMAC на вашем сервере.
                            </p>
                            
                            <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                background: 'rgba(0,0,0,0.3)', 
                                padding: '12px', 
                                borderRadius: '10px', 
                                alignItems: 'center',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <span style={{ 
                                    fontFamily: 'monospace', 
                                    fontSize: '0.9rem', 
                                    color: 'var(--admin-text)', 
                                    wordBreak: 'break-all',
                                    flex: 1
                                }}>{oneTimeSecret}</span>
                                <button 
                                    type="button" 
                                    className="admin-btn" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', height: 'auto', minHeight: 'unset' }}
                                    onClick={() => copyToClipboard(oneTimeSecret)}
                                >
                                    Копировать
                                </button>
                            </div>

                            <button 
                                type="button" 
                                className="admin-btn admin-btn-primary" 
                                style={{ alignSelf: 'flex-end', marginTop: '10px' }}
                                onClick={() => setOneTimeSecret(null)}
                            >
                                Я скопировал секрет
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Diagnostic Logs Modal */}
            {isLogsModalOpen && selectedSubForLogs && (
                <div className="admin-centered-modal-overlay" onClick={() => setIsLogsModalOpen(false)}>
                    <div className="admin-centered-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', height: '80%', display: 'flex', flexDirection: 'column' }}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title" style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
                                    Диагностика доставок: {selectedSubForLogs.name}
                                </h2>
                                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', fontFamily: 'monospace' }}>
                                    {selectedSubForLogs.url}
                                </span>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsLogsModalOpen(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="modal-scroll-area" style={{ flex: 1, padding: '20px 24px' }}>
                            {loadingLogs ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--admin-primary)' }}>
                                    Загрузка истории доставок вебхуков...
                                </div>
                            ) : (
                                <div className="admin-table-premium" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Статус</th>
                                                <th>HTTP статус</th>
                                                <th>Время отправки</th>
                                                <th>Ответ сервера (кликните для раскрытия)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deliveries.map((delivery, idx) => {
                                                const isSuccess = delivery.status === 'delivered';
                                                const isExpanded = expandedLogIdx === idx;

                                                return (
                                                    <tr key={idx} style={{ verticalAlign: 'top' }}>
                                                        <td>
                                                            <span style={{ 
                                                                display: 'inline-flex', 
                                                                padding: '2px 8px', 
                                                                borderRadius: '6px', 
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                color: isSuccess ? '#21EA7C' : '#ef4444',
                                                                background: isSuccess ? 'rgba(33, 234, 124, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                                                                border: isSuccess ? '1px solid rgba(33, 234, 124, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)'
                                                            }}>
                                                                {delivery.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 600 }}>
                                                            <span style={{ color: (delivery.http_status >= 200 && delivery.http_status < 300) ? '#21EA7C' : '#ef4444' }}>
                                                                {delivery.http_status || '—'}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                                                            {new Date(delivery.created_at).toLocaleString()}
                                                        </td>
                                                        <td>
                                                            <pre style={{ 
                                                                margin: 0, 
                                                                background: 'rgba(0, 0, 0, 0.25)', 
                                                                padding: '10px', 
                                                                borderRadius: '8px', 
                                                                fontSize: '0.75rem', 
                                                                fontFamily: 'monospace',
                                                                maxWidth: '350px',
                                                                overflowX: isExpanded ? 'auto' : 'hidden', 
                                                                textOverflow: isExpanded ? 'clip' : 'ellipsis', 
                                                                whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
                                                                wordBreak: 'break-all',
                                                                cursor: 'pointer',
                                                                border: '1px solid rgba(255, 255, 255, 0.03)'
                                                            }} onClick={() => setExpandedLogIdx(isExpanded ? null : idx)}>
                                                                {delivery.last_response || 'Нет ответа (Empty)'}
                                                            </pre>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {deliveries.length === 0 && (
                                        <div className="admin-empty-msg" style={{ padding: '40px 0' }}>
                                            Логи доставок для этого вебхука пусты.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--admin-card-border)' }}>
                            <button type="button" className="admin-btn" onClick={() => loadLogs(selectedSubForLogs)}>
                                Обновить логи
                            </button>
                            <button type="button" className="admin-btn admin-btn-primary" onClick={() => setIsLogsModalOpen(false)}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
