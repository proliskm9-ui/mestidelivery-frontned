import { useState, useEffect } from 'react';
import { adminAuth, adminApi, type Order, type Product, type Restaurant } from '../../services/adminService';
import { OrdersIcon, ProductIcon, RestaurantIcon, ClockIcon, DollarIcon } from '../../components/icons/StatusIcons';
import './AdminStyles.css';

export function AdminDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    const user = adminAuth.getUser();
    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const ordersData = await adminApi.get<Order[]>('/orders').catch(() => []);
                setOrders(ordersData);

                const productsData = await adminApi.get<Product[]>('/products/admin').catch(() => []);
                setProducts(productsData);

                if (isSuperAdmin) {
                    const restaurantsData = await adminApi.get<Restaurant[]>('/restaurants/').catch(() => []);
                    setRestaurants(restaurantsData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isSuperAdmin]);

    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const revenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

    if (loading) return <div className="admin-loading">Loading Stats...</div>;

    return (
        <div className="admin-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Overview</h1>
                    <p style={{ color: 'var(--admin-text-muted)', marginTop: '4px' }}>Welcome back, {user?.username}</p>
                </div>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--admin-primary)' }}>{todayOrders.length}</div>
                        <div style={{ color: 'var(--admin-text-muted)' }}>Orders Today</div>
                    </div>
                    <div style={{ color: 'var(--admin-text-muted)', opacity: 0.5 }}><OrdersIcon size={40} /></div>
                </div>
                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffaa00' }}>{pendingOrders.length}</div>
                        <div style={{ color: 'var(--admin-text-muted)' }}>Pending Action</div>
                    </div>
                    <div style={{ color: 'var(--admin-text-muted)', opacity: 0.5 }}><ClockIcon size={40} /></div>
                </div>
                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#21EA7C' }}>{revenue.toFixed(0)} ₾</div>
                        <div style={{ color: 'var(--admin-text-muted)' }}>Daily Revenue</div>
                    </div>
                    <div style={{ color: 'var(--admin-text-muted)', opacity: 0.5 }}><DollarIcon size={40} /></div>
                </div>
                <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{products.length}</div>
                        <div style={{ color: 'var(--admin-text-muted)' }}>Total Products</div>
                    </div>
                    <div style={{ color: 'var(--admin-text-muted)', opacity: 0.5 }}><ProductIcon size={40} /></div>
                </div>
                {isSuperAdmin && (
                    <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{restaurants.length}</div>
                            <div style={{ color: 'var(--admin-text-muted)' }}>Restaurants</div>
                        </div>
                        <div style={{ color: 'var(--admin-text-muted)', opacity: 0.5 }}><RestaurantIcon size={40} /></div>
                    </div>
                )}
            </div>

            <div className="admin-card admin-table-container">
                <div className="page-header">
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Recent Orders</h2>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.slice(0, 5).map(o => (
                            <tr key={o.id}>
                                <td style={{ fontFamily: 'monospace', color: 'var(--admin-text-muted)' }}>#{o.id}</td>
                                <td>{o.customer_name || 'Guest'}</td>
                                <td style={{ fontWeight: 'bold' }}>{o.total} ₾</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold',
                                        background: o.status === 'pending' ? 'rgba(255, 170, 0, 0.2)' : 'rgba(33, 234, 124, 0.2)',
                                        color: o.status === 'pending' ? '#ffaa00' : '#21EA7C'
                                    }}>
                                        {o.status}
                                    </span>
                                </td>
                                <td style={{ color: 'var(--admin-text-muted)' }}>{new Date(o.created_at).toLocaleTimeString()}</td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>No orders yet</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
