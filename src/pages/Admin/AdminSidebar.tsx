import React, { useState } from 'react';
import {
    HomeIcon, OrdersIcon, ProductIcon, RestaurantIcon,
    StoreIcon, UsersIcon, LogoutIcon
} from '../../components/icons/StatusIcons';
import { adminAuth } from '../../services/adminService';
import './AdminStyles.css';

export type AdminPage = 'dashboard' | 'orders' | 'products' | 'store_products' | 'restaurants' | 'stores' | 'categories' | 'users' | 'courier' | 'partners' | 'webhooks' | 'promotions' | 'customers' | 'referrals';

export function PromoIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
            <circle cx="7" cy="7" r="1.5" />
        </svg>
    );
}

export function ReferralIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            <path d="M19 8v6M16 11h6" />
        </svg>
    );
}

export function TeamIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
    );
}

export function WebhookIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
        </svg>
    );
}

const PRESET_AVATARS = [
    { id: 'av1', img: '/Assets/photo_2026-02-11_23-14-10.jpg', label: 'Art 1' },
    { id: 'av2', img: '/Assets/photo_2026-02-11_23-14-27.jpg', label: 'Art 2' },
    { id: 'av3', img: '/Assets/photo_2026-02-11_23-14-50.jpg', label: 'Art 3' },
    { id: 'av4', img: '/Assets/photo_2026-02-11_23-19-47.jpg', label: 'Art 4' }
];

type Props = {
    activePage: AdminPage | string;
    onNavigate: (page: AdminPage | string) => void;
    isOpen?: boolean;
};

export function AdminSidebar({ activePage, onNavigate, isOpen }: Props) {
    const user = adminAuth.getUser();
    const isSuperAdmin = user?.role === 'super_admin';
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
    const [avatar, setAvatar] = useState<string>(
        () => localStorage.getItem('admin_avatar') || PRESET_AVATARS[0].img
    );
    const [avatarModal, setAvatarModal] = useState(false);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setAvatar(reader.result);
                    localStorage.setItem('admin_avatar', reader.result);
                    setAvatarModal(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleFolder = (folderId: string) => {
        setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };


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
                        <span>Доставки</span>
                    </button>
                </div>
                <div className="sidebar-footer">
                    <div className="admin-profile-section">
                        <div className="admin-avatar-wrapper" onClick={() => setAvatarModal(true)}>
                            <img src={avatar} alt="Admin Avatar" className="admin-avatar" />
                            <div className="admin-avatar-edit-badge">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5">
                                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="admin-profile-info">
                            <span className="admin-username">{user?.username || 'Courier'}</span>
                            <span className="admin-role">{user?.role?.replace('_', ' ').toUpperCase()}</span>
                        </div>
                    </div>
                    <button className="nav-item logout-btn" onClick={adminAuth.logout} style={{ color: '#ff4444' }}>
                        <LogoutIcon size={20} className="nav-icon" />
                        <span>Выйти</span>
                    </button>
                </div>
                {avatarModal && (
                    <div className="admin-avatar-modal-overlay" onClick={() => setAvatarModal(false)}>
                        <div className="admin-avatar-modal" onClick={e => e.stopPropagation()}>
                            <h3>Choose Avatar</h3>
                            <div className="admin-preset-avatars-grid">
                                {PRESET_AVATARS.map(av => (
                                    <div
                                        key={av.id}
                                        className={`admin-preset-avatar-btn ${avatar === av.img ? 'active' : ''}`}
                                        onClick={() => {
                                            setAvatar(av.img);
                                            localStorage.setItem('admin_avatar', av.img);
                                            setAvatarModal(false);
                                        }}
                                    >
                                        <img src={av.img} alt={av.label} />
                                    </div>
                                ))}
                            </div>
                            <label className="admin-upload-btn">
                                Upload Custom Photo
                                <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                            </label>
                            <button className="admin-cancel-btn" onClick={() => setAvatarModal(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const sections = [
        {
            title: '',
            items: [
                { id: 'dashboard' as AdminPage, Icon: HomeIcon, label: 'Обзор' },
                { id: 'orders' as AdminPage, Icon: OrdersIcon, label: 'Заказы' }
            ]
        },
        {
            title: 'Управление',
            items: [
                isSuperAdmin && { 
                    id: 'folder_restaurants', 
                    Icon: RestaurantIcon, 
                    label: 'Рестораны',
                    subItems: [
                        { id: 'restaurants', label: 'Список' },
                        { id: 'products', label: 'Меню' },
                        { id: 'categories', label: 'Категории' }
                    ]
                },
                isSuperAdmin && { 
                    id: 'folder_stores', 
                    Icon: StoreIcon, 
                    label: 'Магазины',
                    subItems: [
                        { id: 'stores', label: 'Список' },
                        { id: 'store_products', label: 'Товары' }
                    ]
                },
                isSuperAdmin && {
                    id: 'promotions' as AdminPage,
                    Icon: PromoIcon,
                    label: 'Акции и промокоды'
                },
                isSuperAdmin && { 
                    id: 'webhooks' as AdminPage, 
                    Icon: WebhookIcon, 
                    label: 'Вебхуки'
                }
            ].filter(Boolean) as any[]
        },
        {
            title: 'Люди',
            items: [
                isSuperAdmin && { id: 'customers' as AdminPage, Icon: UsersIcon, label: 'Клиенты' },
                isSuperAdmin && { id: 'referrals' as AdminPage, Icon: ReferralIcon, label: 'Рефералы' },
                isSuperAdmin && {
                    id: 'folder_users',
                    Icon: TeamIcon,
                    label: 'Команда',
                    subItems: [
                        { id: 'users', label: 'Сотрудники' },
                        { id: 'partners', label: 'Партнёры' }
                    ]
                }
            ].filter(Boolean) as any[]
        }
    ].filter(s => s.items.length > 0);

    return (
        <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
                <img src="/Assets/general-green.png" alt="Logo" />
                <span>MestiDelivery<br />Admin</span>
            </div>

            <div className="sidebar-nav">
                {sections.map((section, idx) => (
                    <div key={idx} className="sidebar-section">
                        {section.title && (
                            <div className="sidebar-section-header">
                                {section.title}
                            </div>
                        )}
                        <div className="sidebar-section-items">
                            {section.items.map((item: any) => (
                                <div key={item.id} className="nav-item-container">
                                    <button
                                        className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                                        onClick={() => {
                                            if (item.subItems) {
                                                toggleFolder(item.id);
                                            } else {
                                                onNavigate(item.id);
                                            }
                                        }}
                                    >
                                        <item.Icon size={20} className="nav-icon" />
                                        <span>{item.label}</span>
                                        {item.subItems && (
                                            <span className={`folder-chevron ${openFolders[item.id] ? 'open' : ''}`}>
                                                ›
                                            </span>
                                        )}
                                    </button>
                                    
                                    {item.subItems && openFolders[item.id] && (
                                        <div className="nav-sub-items">
                                            {item.subItems.map((sub: any) => (
                                                <button
                                                    key={sub.id}
                                                    className={`nav-sub-item ${activePage === sub.id ? 'active' : ''}`}
                                                    onClick={() => onNavigate(sub.id)}
                                                >
                                                    {sub.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="admin-profile-section">
                    <div className="admin-avatar-wrapper" onClick={() => setAvatarModal(true)}>
                        <img src={avatar} alt="Admin Avatar" className="admin-avatar" />
                        <div className="admin-avatar-edit-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#21EA7C" strokeWidth="2.5">
                                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                        </div>
                    </div>
                    <div className="admin-profile-info">
                        <span className="admin-username">{user?.username || 'Admin'}</span>
                        <span className="admin-role">{user?.role?.replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
                <button
                    className="nav-item logout-btn"
                    onClick={adminAuth.logout}
                    style={{ color: '#ff4444' }}
                >
                    <LogoutIcon size={20} className="nav-icon" />
                    <span>Выйти</span>
                </button>
            </div>
            {avatarModal && (
                <div className="admin-avatar-modal-overlay" onClick={() => setAvatarModal(false)}>
                    <div className="admin-avatar-modal" onClick={e => e.stopPropagation()}>
                        <h3>Choose Avatar</h3>
                        <div className="admin-preset-avatars-grid">
                            {PRESET_AVATARS.map(av => (
                                <div
                                    key={av.id}
                                    className={`admin-preset-avatar-btn ${avatar === av.img ? 'active' : ''}`}
                                    onClick={() => {
                                        setAvatar(av.img);
                                        localStorage.setItem('admin_avatar', av.img);
                                        setAvatarModal(false);
                                    }}
                                >
                                    <img src={av.img} alt={av.label} />
                                </div>
                            ))}
                        </div>
                        <label className="admin-upload-btn">
                            Upload Custom Photo
                            <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                        </label>
                        <button className="admin-cancel-btn" onClick={() => setAvatarModal(false)}>Cancel</button>
                    </div>
                </div>
            )}
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
        { id: 'dashboard' as AdminPage, Icon: HomeIcon, label: 'Обзор' },
        { id: 'orders' as AdminPage, Icon: OrdersIcon, label: 'Заказы' },
        { id: 'products' as AdminPage, Icon: ProductIcon, label: 'Меню' }
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
