import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';


interface ActiveOrder {
    id: number;
    status: string;
    status_label: string;
    status_step: number;
    total_steps: number;
    total: number;
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#fbbf24', // yellow
    confirmed: '#3b82f6', // blue
    preparing: '#8b5cf6', // purple
    ready: '#10b981', // green
    delivering: '#21ea7c', // bright green
};

interface Props {
    onNavigate: (orderId: number) => void;
}

const OrderFloatingStatus: React.FC<Props> = ({ onNavigate }) => {
    const [order, setOrder] = useState<ActiveOrder | null>(null);
    const userId = localStorage.getItem('user_id'); // We need to ensure we save user_id on login

    useEffect(() => {
        // If no user_id in local storage, try to parse token or fetch profile
        // For now let's assume token logic handles auth state
        if (!userId) {
            // Try to get from token payload if possible, or skip
            // Ideally we should rely on App.tsx passing user info, but let's keep it self-contained
            return;
        }

        const checkStatus = async () => {
            try {
                const data = await api.getActiveOrder(userId);
                setOrder(data);
            } catch (error) {
                console.error("Status check failed", error);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, [userId]);

    if (!order) return null;

    const progress = (order.status_step / order.total_steps) * 100;
    const color = STATUS_COLORS[order.status] || '#888';

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
                        Заказ #{order.id}
                    </span>
                    <span style={{ fontSize: 12, color: color, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50%' }}>
                        {order.status_label}
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
