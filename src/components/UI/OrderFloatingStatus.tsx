import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../translations/LanguageContext';


interface ActiveOrder {
    id: number;
    status: string;
    status_label: string;
    status_step: number;
    total_steps: number;
    total: number;
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#fbbf24',
    pending_payment: '#fbbf24',
    confirmed: '#3b82f6',
    accepted: '#3b82f6',
    preparing: '#8b5cf6',
    ready: '#10b981',
    delivering: '#21ea7c',
};

const normalizeStatusKey = (status: string): string => {
    if (status === 'accepted') return 'confirmed';
    if (status === 'pending_payment') return 'pending';
    return status;
};

interface Props {
    onNavigate: (orderId: number) => void;
}

const OrderFloatingStatus: React.FC<Props> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const [order, setOrder] = useState<ActiveOrder | null>(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            return;
        }

        const checkStatus = async () => {
            try {
                const data = await api.getActiveOrder();
                setOrder(data);
            } catch (error) {
                console.error("Status check failed", error);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [token]);

    if (!order) return null;

    const progress = (order.status_step / order.total_steps) * 100;
    const color = STATUS_COLORS[order.status] || '#888';
    const statusKey = normalizeStatusKey(order.status);
    const translated = t(`status.${statusKey}`);
    const statusLabel = translated !== `status.${statusKey}` ? translated : order.status;

    return (
        <div
            onClick={() => onNavigate(order.id)}
            style={{
                position: 'fixed',
                bottom: 90, // Above bottom nav
                left: 16,
                right: 16,
                background: 'rgba(20, 20, 25, 0.95)',
                backdropFilter: 'blur(16px)',
                borderRadius: 16,
                padding: '12px 16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 900,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                animation: 'slideUp 0.5s ease-out'
            }}
        >
            {/* Status Icon / Spinner */}
            <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${color}44`,
                flexShrink: 0
            }}>
                {['preparing', 'delivering'].includes(order.status) ? (
                    <div style={{
                        width: 20, height: 20,
                        border: `2px solid ${color}`,
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                ) : (
                    <div style={{ width: 12, height: 12, background: color, borderRadius: '50%' }} />
                )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {t('common.order')} #{order.id}
                    </span>
                    <span style={{ fontSize: 12, color: color, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50%' }}>
                        {statusLabel}
                    </span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <div style={{
                        width: `${progress}%`, height: '100%',
                        background: color, borderRadius: 2,
                        transition: 'width 0.5s ease',
                        boxShadow: `0 0 10px ${color}88`
                    }} />
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default OrderFloatingStatus;
