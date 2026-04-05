import { useState, useEffect } from 'react';
import { adminAuth } from '../../services/adminService';
import { type AdminPage } from './AdminSidebar';
import { AdminLogin } from './AdminLogin';
import { AdminSidebar, MobileNav } from './AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { AdminOrders } from './AdminOrders';
import { AdminProducts } from './AdminProducts';
import { AdminStores } from './AdminStores';
import { AdminUsers } from './AdminUsers';
import { AdminCourier } from './AdminCourier';
import { AdminRestaurants } from './AdminRestaurants';
import AdminPartners from './AdminPartners';
import './AdminStyles.css';

export function AdminPanel() {
    const [activePage, setActivePage] = useState<AdminPage>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuth, setIsAuth] = useState(adminAuth.isAuthenticated());

    const user = adminAuth.getUser();

    // Effect to re-check auth on mount
    useEffect(() => {
        setIsAuth(adminAuth.isAuthenticated());
    }, []);

    // Redirect couriers on load
    useEffect(() => {
        if (user?.role === 'courier') {
            setActivePage('courier');
        }
    }, [user]);

    // Close sidebar on page change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [activePage]);

    if (!isAuth) {
        return <AdminLogin onLogin={() => setIsAuth(true)} />;
    }

    return (
        <div className="admin-layout">
            <div className="admin-bg-blobs">
                <div className="admin-blob blob-1"></div>
                <div className="admin-blob blob-2"></div>
                <div className="admin-blob blob-3"></div>
            </div>
            <div className="admin-bg-noise"></div>

            {isSidebarOpen && (
                <div className="sidebar-overlay visible" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            <AdminSidebar
                activePage={activePage}
                onNavigate={setActivePage}
                isOpen={isSidebarOpen}
            />

            <MobileNav activePage={activePage} onNavigate={setActivePage} />

            <main className="admin-main">
                {activePage === 'dashboard' && <AdminDashboard />}
                {activePage === 'orders' && <AdminOrders />}
                {activePage === 'products' && <AdminProducts />}
                {activePage === 'stores' && <AdminStores />}
                {activePage === 'restaurants' && <AdminRestaurants />}
                {activePage === 'users' && <AdminUsers />}
                {activePage === 'courier' && <AdminCourier />}
                {activePage === 'partners' && <AdminPartners />}
            </main>
        </div>
    );
}
