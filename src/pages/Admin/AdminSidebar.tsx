import {
    HomeIcon, OrdersIcon, ProductIcon, RestaurantIcon,
    CategoriesIcon, StoreIcon, UsersIcon, LogoutIcon
} from '../../components/icons/StatusIcons';
import { adminAuth } from '../../services/adminService';
import './AdminStyles.css';

export type AdminPage = 'dashboard' | 'orders' | 'products' | 'restaurants' | 'stores' | 'categories' | 'users' | 'courier' | 'partners';

type Props = {
    activePage: AdminPage;
    onNavigate: (page: AdminPage) => void;
    isOpen?: boolean;
};

export function AdminSidebar({ activePage, onNavigate, isOpen }: Props) {
    const user = adminAuth.getUser();
    const isSuperAdmin = user?.role === 'super_admin';

    const navItems = [
        { id: 'dashboard' as AdminPage, Icon: HomeIcon, label: 'Dashboard' },
        { id: 'orders' as AdminPage, Icon: OrdersIcon, label: 'Orders' },
        { id: 'products' as AdminPage, Icon: ProductIcon, label: 'Products' },
    ];

    if (user?.role === 'courier') {
        // Courier only sees their specific tasks
        return (
            <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <img src="/Assets/general-green.png" alt="Logo" />
                    <span>COURIER</span>
                </div>
                <div className="sidebar-nav">
                    <button
                        className={`nav-item ${activePage === 'courier' ? 'active' : ''}`}
                        onClick={() => onNavigate('courier')}
                    >
                        <OrdersIcon size={20} className="nav-icon" />
                        <span>Delivery</span>
                    </button>
                </div>
                <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                    <button className="nav-item" onClick={adminAuth.logout} style={{ color: '#ff4444' }}>
                        <LogoutIcon size={20} className="nav-icon" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        );
    }

    if (isSuperAdmin) {
        navItems.push(
            { id: 'restaurants' as AdminPage, Icon: RestaurantIcon, label: 'Restaurants' },
            { id: 'stores' as AdminPage, Icon: StoreIcon, label: 'Stores' },
            { id: 'categories' as AdminPage, Icon: CategoriesIcon, label: 'Categories' },
            { id: 'users' as AdminPage, Icon: UsersIcon, label: 'Users' },
            { id: 'partners' as AdminPage, Icon: UsersIcon, label: 'Partners' }
        );
    }

    return (
        <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
                <img src="/Assets/general-green.png" alt="Logo" />
                <span>ADMIN PANEL</span>
            </div>

            <div className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <item.Icon size={20} className="nav-icon" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <button
                    className="nav-item"
                    onClick={adminAuth.logout}
                    style={{ color: '#ff4444' }}
                >
                    <LogoutIcon size={20} className="nav-icon" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}

export function MobileNav({ activePage, onNavigate }: Omit<Props, 'isOpen'>) {
    const user = adminAuth.getUser();
    const isSuperAdmin = user?.role === 'super_admin';
    const isCourier = user?.role === 'courier';

    if (isCourier) {
        return (
            <div className="admin-mobile-nav">
                <button
                    className={`mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
                    onClick={() => onNavigate('dashboard')}
                >
                    <HomeIcon size={24} />
                    <span>Home</span>
                </button>
                <button
                    className={`mobile-nav-item ${activePage === 'courier' ? 'active' : ''}`}
                    onClick={() => onNavigate('courier')}
                >
                    <OrdersIcon size={24} />
                    <span>Tasks</span>
                </button>
                <button
                    className="mobile-nav-item"
                    onClick={adminAuth.logout}
                    style={{ color: '#ff4444' }}
                >
                    <LogoutIcon size={24} />
                    <span>Out</span>
                </button>
            </div>
        );
    }

    const mainItems = [
        { id: 'dashboard' as AdminPage, Icon: HomeIcon, label: 'Home' },
        { id: 'orders' as AdminPage, Icon: OrdersIcon, label: 'Orders' },
        { id: 'products' as AdminPage, Icon: ProductIcon, label: 'Items' }
    ];

    return (
        <div className="admin-mobile-nav">
            {mainItems.map(item => (
                <button
                    key={item.id}
                    className={`mobile-nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                >
                    <item.Icon size={24} />
                    <span>{item.label}</span>
                </button>
            ))}
            {isSuperAdmin && (
                <button
                    className={`mobile-nav-item ${activePage === 'users' ? 'active' : ''}`}
                    onClick={() => onNavigate('users')}
                >
                    <UsersIcon size={24} />
                    <span>Users</span>
                </button>
            )}
        </div>
    );
}
