import { Suspense, useState, useEffect, lazy } from 'react';
import './App.css';
import { api, restaurantCache } from './services/api';
import LiquidNavBar from './components/UI/LiquidNavBar';
import LoadingScreen from './components/UI/LoadingScreen';

// --- Lazy-loaded pages (loaded only when navigated to) ---
const HomePage = lazy(() => import('./pages/Home'));
const MenuPage = lazy(() => import('./pages/Menu'));
const LoginPage = lazy(() => import('./pages/Login'));
// @ts-ignore
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
const PartnerApp = lazy(() => import('./pages/PartnerApp/PartnerMain'));
const RestaurantPage = lazy(() => import('./pages/Restaurant'));
const CartPage = lazy(() => import('./pages/Cart'));
const CheckoutPage = lazy(() => import('./pages/Checkout'));
const PaymentPage = lazy(() => import('./pages/Payment'));
const MobilePaymentPage = lazy(() => import('./Оплата/PaymentPage'));
const MobileCheckoutPage = lazy(() => import('./Оплата/CheckoutPage'));
const FavoritesPage = lazy(() => import('./pages/Favorites'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const OrderStatus = lazy(() => import('./pages/OrderStatus'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const MobileCart = lazy(() => import('./pages/MobileCart'));
const GlassBottomPanel = lazy(() => import('./components/UI/GlassBottomPanel'));

import type { CheckoutOrderData } from './Оплата/CheckoutPage';

const DEFAULT_AVATARS = [
    '/Assets/photo_2026-02-11_23-14-10.jpg',
    '/Assets/photo_2026-02-11_23-14-27.jpg',
    '/Assets/photo_2026-02-11_23-14-50.jpg',
    '/Assets/photo_2026-02-11_23-19-47.jpg'
];

import { LanguageProvider, useLanguage } from './translations/LanguageContext';

function useIsMobile(breakpoint = 1024) {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const onChange = () => setIsMobile(mql.matches);
        onChange();
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [breakpoint]);
    return isMobile;
}

function AppContent() {
    const { t } = useLanguage();
    const isMobile = useIsMobile();
    // Auth State
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    // Loading State for Authorized Users (Splash Screen)
    const [isLoading, setIsLoading] = useState(!!token);

    // Basic navigation state - If auth, go to menu, else home
    // Check for admin route
    const [currentPage, setCurrentPage] = useState(() => {
        if (window.location.pathname.startsWith('/partners')) return 'partner';
        if (window.location.pathname === '/admin') return 'admin';
        return token ? 'menu' : 'home';
    });

    // Removal of redundant timer, LoadingScreen handles its own timing

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);


    // Redirect auth users from home
    useEffect(() => {
        if (token && (currentPage === 'home' || currentPage === 'login')) {
            setCurrentPage('menu');
        }
    }, [token, currentPage]);

    const handleNavigate = (page: string) => {
        const protectedRoutes = ['profile', 'favorites', 'cart', 'checkout', 'payment', 'order_status', 'order_details'];
        if (!token && protectedRoutes.includes(page)) {
            setCurrentPage('login');
        } else {
            setCurrentPage(page);
        }
    };

    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    const [cart, setCart] = useState<{ product: any, quantity: number }[]>([]);
    const [pendingProductToAdd, setPendingProductToAdd] = useState<any>(null);
    const [pendingOrderData, setPendingOrderData] = useState<any>(null);

    const cartSubtotal = cart.reduce((a: number, b: { quantity: number; product: any }) => a + (Number(b.product.price) * b.quantity), 0);
    const cartServiceFee = cartSubtotal > 0 ? Math.max(0.99, Math.min(2.00, cartSubtotal * 0.06)) : 0;
    const cartTotalAmount = cartSubtotal + 5.00 + cartServiceFee;

    // Global Address State (Fetched from Profile)
    const [userAddress, setUserAddress] = useState<any>(() => {
        try {
            const saved = localStorage.getItem('user_address');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [checkoutExtras, setCheckoutExtras] = useState<{ comment: string, cutlery: number }>({ comment: '', cutlery: 1 });

    const handleUpdateAddress = async (newAddress: any) => {
        setUserAddress(newAddress);
        localStorage.setItem('user_address', JSON.stringify(newAddress));
        if (newAddress.phone) localStorage.setItem('user_phone', newAddress.phone);

        if (token) {
            try {
                await api.updateProfile({ address: newAddress });
            } catch (error) {
                console.error("Failed to save address to server", error);
            }
        }
    };

    // Global Profile State
    const [userProfile, setUserProfile] = useState<any>(() => {
        return {
            name: localStorage.getItem('user_name') || '...',
            phone: localStorage.getItem('user_phone') || '',
            points: 0,
            avatar: localStorage.getItem('user_avatar') || '👤'
        };
    });

    const handleUpdateProfile = async (updates: any) => {
        const newProfile = { ...userProfile, ...updates };
        setUserProfile(newProfile);
        if (updates.avatar) localStorage.setItem('user_avatar', updates.avatar);
        if (updates.name) localStorage.setItem('user_name', updates.name);
        if (updates.phone) localStorage.setItem('user_phone', updates.phone);

        if (token) {
            try {
                const up = { ...updates };
                if (up.name) up.full_name = up.name;
                await api.updateProfile(up);
            } catch (error) {
                console.error("Failed to update profile on server", error);
            }
        }
    };

    // Global Order History
    const [orderHistory, setOrderHistory] = useState<any[]>([]);

    const handleAddOrderToHistory = (order: any) => {
        // Optimistic update
        setOrderHistory(prev => [order, ...prev]);
    };

    // Fetch initial data from server
    useEffect(() => {
        if (token) {
            const fetchProfile = async () => {
                try {
                    const data = await api.getProfile();
                    console.log("Profile Data from server:", data);
                    if (data.id) localStorage.setItem('user_id', String(data.id));
                    if (data.full_name) localStorage.setItem('user_name', data.full_name);

                    let avatar = data.avatar;

                    // Assign random default avatar if none or placeholder
                    if (!avatar || avatar === '👤') {
                        const localAvatar = localStorage.getItem('user_avatar');
                        if (localAvatar && localAvatar !== '👤') {
                            avatar = localAvatar;
                        } else {
                            const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
                            avatar = randomAvatar;
                            localStorage.setItem('user_avatar', avatar);
                        }
                        // Save this choice to the server immediately
                        api.updateProfile({ avatar }).catch(err => console.error("Failed to sync auto-assigned avatar", err));
                    } else {
                        localStorage.setItem('user_avatar', avatar);
                    }

                    if (data.phone) localStorage.setItem('user_phone', data.phone);

                    setUserProfile({
                        name: data.full_name || 'User',
                        phone: data.phone || localStorage.getItem('user_phone') || '',
                        points: data.points || 0,
                        avatar: avatar
                    });

                    if (data.address) {
                        setUserAddress(data.address);
                        localStorage.setItem('user_address', JSON.stringify(data.address));
                    }
                } catch (error: any) {
                    if (error.message === 'Unauthorized') {
                        setToken(null);
                    } else {
                        console.error("Failed to fetch profile", error);
                    }
                }

                // Fetch order history independently (so profile errors don't block it)
                try {
                    // Pre-fetch restaurants to populate cache for name lookup
                    await api.getRestaurants().catch(() => { });

                    const orders = await api.getOrderHistory();
                    console.log("Order history raw:", orders);

                    // Guard: ensure it's actually an array
                    if (!Array.isArray(orders)) {
                        console.warn("getOrderHistory returned non-array:", orders);
                        return;
                    }

                    // Enrich orders with restaurant names from cache
                    const enriched = orders.map((o: any) => {
                        if (!o.restaurant_name && o.restaurant_id) {
                            const cached = restaurantCache[`rest_${o.restaurant_id}`];
                            if (cached) o.restaurant_name = cached.name;
                        }
                        return o;
                    });
                    setOrderHistory(enriched);
                } catch (error: any) {
                    if (error.message === 'Unauthorized') {
                        setToken(null);
                    } else {
                        console.error("Failed to fetch order history", error);
                    }
                }
            };
            fetchProfile();
        }
    }, [token]);

    // Scroll to top on page change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPage]);

    const handleNavigateToRestaurant = (id: string) => {
        setSelectedRestaurantId(id);
        setCurrentPage('restaurant');
    };

    const handleAddToCart = (product: any) => {
        if (!token) {
            setCurrentPage('login');
            return;
        }
        
        // Cross-restaurant check
        if (cart.length > 0 && cart[0].product.restaurant_id !== product.restaurant_id) {
            setPendingProductToAdd(product);
            return;
        }

        setCart(prev => {
            const existingItem = prev.find(item => item.product.id === product.id);
            if (existingItem) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    // Favorites State
    const [favorites, setFavorites] = useState<string[]>([]);

    const handleToggleFavorite = (restaurantId: string) => {
        if (!token) {
            setCurrentPage('login');
            return;
        }
        setFavorites(prev =>
            prev.includes(restaurantId)
                ? prev.filter(id => id !== restaurantId)
                : [...prev, restaurantId]
        );
    };

    const handleLogin = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        // Show loading screen on login for effect
        setIsLoading(true);
        // Page transition happens after loading
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_avatar');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        setToken(null);
        setUserProfile({
            name: '...',
            phone: '',
            points: 0,
            avatar: '👤'
        });
        setUserAddress(null);
        setOrderHistory([]);
        setCart([]);
        setCurrentPage('home');
    };


    // Render Admin Panel exclusively if active
    if (currentPage === 'admin') {
        return (
            <Suspense fallback={<div style={{ color: 'white' }}>Loading Admin...</div>}>
                <AdminPanel />
            </Suspense>
        );
    }

    if (currentPage === 'partner') {
        return (
            <Suspense fallback={<div style={{ color: 'white' }}>Loading Partner App...</div>}>
                <PartnerApp />
            </Suspense>
        );
    }


    return (
        <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Loading...</div>}>
            <div className="app-container">
                {isLoading && (
                    <LoadingScreen onComplete={() => {
                        setIsLoading(false);
                        if (token) setCurrentPage('menu');
                    }} />
                )}
                {/* Navbar - Hidden on Home, Login, Menu, Restaurant AND Cart AND Checkout AND Profile AND Admin pages */}
                {/* Actually Top Navbar was hidden on Home/Menu etc? No.
                    Original: !['home', 'menu', 'restaurant', 'cart', 'checkout', 'profile', 'favorites', 'payment'].includes(currentPage)
                    So mostly hidden?
                    Let's update exclusion list to include 'login'.
                */}
                {!['home', 'login', 'menu', 'restaurant', 'cart', 'checkout', 'profile', 'favorites', 'payment', 'admin'].includes(currentPage) && (
                    <nav style={{ padding: '0 2rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
                        <div className="logo" onClick={() => setCurrentPage(token ? 'menu' : 'home')} style={{ cursor: 'pointer' }}>
                            <img src="/Assets/general-green.png" alt="MESTIGO" style={{ height: '40px' }} />
                        </div>
                        <div className="menu desktop-only" style={{ display: 'flex', gap: '2rem' }}>
                            <span className="menu-item" onClick={() => setCurrentPage('menu')} style={{ cursor: 'pointer', color: currentPage === 'menu' ? '#21EA7C' : 'inherit' }}>{t('nav.menu')}</span>
                            <span className="menu-item" onClick={() => setCurrentPage('about')} style={{ cursor: 'pointer' }}>{t('nav.about')}</span>
                            <span className="menu-item" onClick={() => setCurrentPage('contact')} style={{ cursor: 'pointer' }}>{t('nav.contact')}</span>
                        </div>
                    </nav>
                )}

                {/* Page Content */}
                <main style={{ minHeight: 'calc(100vh - 80px)' }}>
                    {currentPage === 'home' && (
                        <HomePage
                            onNavigate={handleNavigate}
                        />
                    )}

                    {currentPage === 'login' && (
                        <LoginPage onLogin={handleLogin} />
                    )}

                    {currentPage === 'menu' && (
                        <MenuPage
                            onRestaurantClick={handleNavigateToRestaurant}
                            favorites={favorites}
                            onToggleFavorite={handleToggleFavorite}
                            userAddress={userAddress}
                            onUpdateAddress={handleUpdateAddress}
                            userProfile={userProfile}
                            onProfileClick={() => handleNavigate('profile')}
                            onOrderClick={(id) => { setSelectedOrderId(id); handleNavigate('order_status'); }}
                            onLogout={handleLogout}
                            onNavigate={handleNavigate}
                        />
                    )}

                    {currentPage === 'favorites' && (
                        <FavoritesPage
                            favorites={favorites}
                            onRestaurantClick={handleNavigateToRestaurant}
                            onToggleFavorite={handleToggleFavorite}
                            onNavigate={setCurrentPage}
                        />
                    )}

                    {currentPage === 'profile' && (
                        <ProfilePage
                            userAddress={userAddress}
                            onUpdateAddress={handleUpdateAddress}
                            userProfile={userProfile}
                            onUpdateProfile={handleUpdateProfile}
                            orderHistory={orderHistory}
                            onLogout={handleLogout}
                            onBack={() => setCurrentPage('menu')}
                            onOrderClick={(id: number) => { setSelectedOrderId(id); setCurrentPage('order_details'); }}
                        />
                    )}
                    {/* Restaurant Page - Kept visible under Cart for overlay effect */}
                    {currentPage === 'restaurant' && (
                        <RestaurantPage
                            restaurantId={selectedRestaurantId}
                            onBack={() => setCurrentPage('menu')}
                            onAddToCart={handleAddToCart}
                            isFavorite={selectedRestaurantId ? favorites.includes(selectedRestaurantId) : false}
                            onToggleFavorite={handleToggleFavorite}
                            cart={cart}
                            onUpdateQuantity={(pid, delta) => {
                                setCart(prev => prev.map(item => {
                                    if (item.product.id === pid) {
                                        return { ...item, quantity: item.quantity + delta };
                                    }
                                    return item;
                                }).filter(i => i.quantity > 0));
                            }}
                            onClearCart={() => setCart([])}
                            onNavigateToCart={() => setCurrentPage('cart')}
                        />
                    )}


                    {currentPage === 'cart' && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000, overflowY: 'auto' }}>
                            <div
                                style={{
                                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                                    background: 'var(--bg)', zIndex: 0
                                }}
                                onClick={() => setCurrentPage('menu')} // Click outside to close
                            />
                            <div style={{ position: 'relative', zIndex: 1, minHeight: '100%' }}>
                                {isMobile ? (
                                    <MobileCart
                                        onBack={() => {
                                            if (cart.length > 0) {
                                                setSelectedRestaurantId(cart[0].product.restaurant_id);
                                                setCurrentPage('restaurant');
                                            } else {
                                                setCurrentPage('menu');
                                            }
                                        }}
                                        initialCartItems={cart}
                                        onClearCart={() => setCart([])}
                                        onUpdateQuantity={(pid: string, delta: number) => setCart(prev => prev.map(item => item.product.id === pid ? { ...item, quantity: item.quantity + delta } : item).filter(i => i.quantity > 0))}
                                        onAddToCart={handleAddToCart}
                                        onCheckout={(data: { comment: string; cutlery: number }) => {
                                            setCheckoutExtras(data);
                                            setCurrentPage('checkout');
                                        }}
                                    />
                                ) : (
                                    <CartPage
                                        onBack={() => {
                                            if (cart.length > 0) {
                                                setSelectedRestaurantId(cart[0].product.restaurant_id);
                                                setCurrentPage('restaurant');
                                            } else {
                                                setCurrentPage('menu');
                                            }
                                        }}
                                        initialCartItems={cart}
                                        onClearCart={() => setCart([])}
                                        onUpdateQuantity={(pid: string, delta: number) => setCart(prev => prev.map(item => item.product.id === pid ? { ...item, quantity: item.quantity + delta } : item).filter(i => i.quantity > 0))}
                                        onAddToCart={handleAddToCart}
                                        onCheckout={(data: { comment: string, cutlery: number }) => {
                                            setCheckoutExtras(data);
                                            setCurrentPage('checkout');
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {currentPage === 'checkout' && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3000, overflowY: 'hidden', background: 'var(--bg)' }}>
                            <div className="no-scrollbar" style={{ height: '100%', overflowY: 'auto' }}>
                                {isMobile ? (
                                    <MobileCheckoutPage
                                        totalAmount={cartTotalAmount}
                                        cartItems={cart}
                                        comment={checkoutExtras.comment}
                                        cutleryCount={checkoutExtras.cutlery}
                                        initialAddress={userAddress}
                                        onBack={() => setCurrentPage('cart')}
                                        onProceedToPayment={(orderData: CheckoutOrderData) => {
                                            handleUpdateAddress(orderData.address);
                                            setPendingOrderData({
                                                ...orderData,
                                                restaurant_id: selectedRestaurantId,
                                            });
                                            setCurrentPage('payment');
                                        }}
                                    />
                                ) : (
                                    <CheckoutPage
                                        onBack={() => setCurrentPage('cart')}
                                        totalAmount={cartTotalAmount}
                                        comment={checkoutExtras.comment}
                                        cutleryCount={checkoutExtras.cutlery}
                                        onOrderPlaced={(data) => {
                                            handleUpdateAddress(data.address);
                                            setPendingOrderData(data);
                                            setCurrentPage('payment');
                                        }}
                                        initialAddress={userAddress}
                                        restaurantId={selectedRestaurantId}
                                        cartItems={cart}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {currentPage === 'payment' && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 4000, overflowY: 'auto', background: 'var(--bg)' }}>
                            {isMobile ? (
                                <MobilePaymentPage
                                    onBack={() => setCurrentPage('checkout')}
                                    totalAmount={pendingOrderData?.total || 0}
                                    orderData={pendingOrderData}
                                    cartItems={cart}
                                    onPaymentComplete={(method: string, orderId: number) => {
                                        console.log('Order created with id:', orderId, 'method:', method);
                                        const restId = pendingOrderData?.restaurant_id || cart?.[0]?.product?.restaurant_id || '';
                                        const restName = restaurantCache[`rest_${restId}`]?.name || '';
                                        const addr = pendingOrderData?.address || {};
                                        const fullAddress = [addr.street, addr.house, addr.apartment, addr.floor].filter(Boolean).join(', ');
                                        handleAddOrderToHistory({
                                            ...pendingOrderData,
                                            method,
                                            id: orderId,
                                            created_at: new Date().toISOString(),
                                            restaurant_name: restName,
                                            address: fullAddress,
                                            status: 'pending'
                                        });

                                        setCart([]);
                                        setPendingOrderData(null);
                                        setSelectedOrderId(orderId);
                                        setCurrentPage('order_status');
                                    }}
                                />
                            ) : (
                                <PaymentPage
                                    onBack={() => setCurrentPage('checkout')}
                                    totalAmount={pendingOrderData?.total || 0}
                                    orderData={pendingOrderData}
                                    cartItems={cart}
                                    onPaymentComplete={(method: string, orderId: number) => {
                                        console.log('Order created with id:', orderId, 'method:', method);
                                        const restId = pendingOrderData?.restaurant_id || cart?.[0]?.product?.restaurant_id || '';
                                        const restName = restaurantCache[`rest_${restId}`]?.name || '';
                                        const addr = pendingOrderData?.address || {};
                                        const fullAddress = [addr.street, addr.house, addr.apartment, addr.floor].filter(Boolean).join(', ');
                                        handleAddOrderToHistory({
                                            ...pendingOrderData,
                                            method,
                                            id: orderId,
                                            created_at: new Date().toISOString(),
                                            restaurant_name: restName,
                                            address: fullAddress,
                                            status: 'pending'
                                        });

                                        setCart([]);
                                        setPendingOrderData(null);
                                        setSelectedOrderId(orderId);
                                        setCurrentPage('order_status');
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {currentPage === 'order_status' && selectedOrderId && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5000, overflowY: 'auto', background: 'var(--bg)' }}>
                            <OrderStatus 
                                orderId={selectedOrderId} 
                                onBack={() => setCurrentPage('menu')} 
                                onViewDetails={(id) => {
                                    setSelectedOrderId(id);
                                    setCurrentPage('order_details');
                                }}
                            />
                        </div>
                    )}

                    {currentPage === 'order_details' && selectedOrderId && (
                        <OrderDetails orderId={selectedOrderId} onBack={() => setCurrentPage('profile')} />
                    )}


                    {currentPage === 'restaurant' && cart.length > 0 && (
                        <GlassBottomPanel
                            totalItems={cart.reduce((a, b) => a + b.quantity, 0)}
                            totalPrice={cart.reduce((a, b) => a + (b.product.price * b.quantity), 0)}
                            deliveryTime="Доставка 5₾"
                            onNext={() => setCurrentPage('cart')}
                            buttonText="Далее"
                            showPriceInButton={false}
                            priceLabel={`${cart.reduce((a, b) => a + (b.product.price * b.quantity), 0).toFixed(0)} GEL`}
                        />
                    )}
                </main>

                {/* Bottom Navigation - Hidden on Cart, Checkout, Restaurant, Home, Login, Admin, Favorites, Profile, Order Details */}
                {!['cart', 'checkout', 'restaurant', 'home', 'login', 'admin', 'favorites', 'profile', 'order_details'].includes(currentPage) && (
                    <LiquidNavBar activePage={currentPage} onNavigate={handleNavigate} />
                )}
            </div>

            {/* Cross-restaurant warning modal */}
            {pendingProductToAdd && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPendingProductToAdd(null)}>
                    <div style={{ background: 'radial-gradient(120% 120% at 50% 0%, rgb(40, 40, 40) 0%, rgb(15, 15, 15) 100%)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)', padding: '36px 24px 14px 24px', borderRadius: '28px', width: '90%', maxWidth: '400px', position: 'relative', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#fff', letterSpacing: '-0.5px', marginTop: 0 }}>КОРЗИНА ИЗ ДРУГОГО РЕСТОРАНА</h2>
                        <p style={{ fontSize: '15px', color: '#8e8e93', marginBottom: '40px', lineHeight: 1.4 }}>
                            У вас уже есть блюда в корзине из другого ресторана. Чтобы заказать блюда из нового места, сначала очистите текущую корзину.
                        </p>
                        <button 
                            onClick={() => {
                                setCart([{ product: pendingProductToAdd, quantity: 1 }]);
                                setPendingProductToAdd(null);
                            }}
                            className="panel-btn-next"
                            style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF453A', border: '1px solid rgba(255, 59, 48, 0.2)', borderRadius: '16px', fontWeight: 700, height: '56px', fontSize: '16px', width: '100%' }}
                        >
                            Очистить корзину
                        </button>
                    </div>
                </div>
            )}
        </Suspense>
    );
};

function App() {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
}

export default App;
