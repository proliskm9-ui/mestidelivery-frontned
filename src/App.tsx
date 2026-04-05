import { Suspense, useState, useEffect } from 'react';
import './App.css';
import { api, restaurantCache } from './services/api';
import HomePage from './pages/Home';
import MenuPage from './pages/Menu';
import LiquidNavBar from './components/UI/LiquidNavBar';
import LoginPage from './pages/Login'; // Import Login
// @ts-ignore
import { AdminPanel } from './pages/Admin/AdminPanel'; // Import Admin Panel

import RestaurantPage from './pages/Restaurant';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import PaymentPage from './pages/Payment';
import MobilePaymentPage from './Оплата/PaymentPage';
import MobileCheckoutPage from './Оплата/CheckoutPage';
import type { CheckoutOrderData } from './Оплата/CheckoutPage';
import FavoritesPage from './pages/Favorites';
import ProfilePage from './pages/Profile';
import OrderStatus from './pages/OrderStatus';
import OrderDetails from './pages/OrderDetails';
import MobileCart from './pages/MobileCart';
import GlassBottomPanel from './components/UI/GlassBottomPanel';
import LoadingScreen from './components/UI/LoadingScreen';

const DEFAULT_AVATARS = [
    '/Assets/photo_2026-02-11_23-14-10.jpg',
    '/Assets/photo_2026-02-11_23-14-27.jpg',
    '/Assets/photo_2026-02-11_23-14-50.jpg',
    '/Assets/photo_2026-02-11_23-19-47.jpg'
];

import { LanguageProvider, useLanguage } from './translations/LanguageContext';

function AppContent() {
    const { t } = useLanguage();
    // Auth State
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    // Loading State for Authorized Users (Splash Screen)
    const [isLoading, setIsLoading] = useState(!!token);

    // Basic navigation state - If auth, go to menu, else home
    // Check for admin route
    const [currentPage, setCurrentPage] = useState(() => {
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

    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    // Cart State: Array of { product, quantity }
    const [cart, setCart] = useState<{ product: any, quantity: number }[]>([]);
    const [pendingOrderData, setPendingOrderData] = useState<any>(null);

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
                } catch (error) {
                    console.error("Failed to fetch profile", error);
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
                } catch (error) {
                    console.error("Failed to fetch order history", error);
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
                            onNavigate={(page) => {
                                // Intercept 'menu' navigation from Home (Order Now) to force Login
                                if (page === 'menu' && !token) {
                                    setCurrentPage('login');
                                } else {
                                    setCurrentPage(page);
                                }
                            }}
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
                            onProfileClick={() => setCurrentPage('profile')}
                            onOrderClick={(id) => { setSelectedOrderId(id); setCurrentPage('order_status'); }}
                            onLogout={handleLogout}
                            onNavigate={setCurrentPage}
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
                                {window.innerWidth <= 1024 ? (
                                    <MobileCart
                                        onBack={() => setCurrentPage('menu')}
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
                                        onBack={() => setCurrentPage('menu')}
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
                                {window.innerWidth <= 1024 ? (
                                    <MobileCheckoutPage
                                        totalAmount={cart.reduce((a: number, b: { quantity: number; product: any }) => a + (b.product.price * b.quantity), 0) + 5.00}
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
                                        totalAmount={cart.reduce((a: number, b: { quantity: number; product: any }) => a + (b.product.price * b.quantity), 0) + 5.00}
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
                            {window.innerWidth <= 1024 ? (
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
                            <OrderStatus orderId={selectedOrderId} onBack={() => setCurrentPage('menu')} />
                        </div>
                    )}

                    {currentPage === 'order_details' && selectedOrderId && (
                        <OrderDetails orderId={selectedOrderId} onBack={() => setCurrentPage('profile')} />
                    )}


                    {currentPage === 'restaurant' && cart.length > 0 && (
                        <GlassBottomPanel
                            totalItems={cart.reduce((a, b) => a + b.quantity, 0)}
                            totalPrice={cart.reduce((a, b) => a + (b.product.price * b.quantity), 0)}
                            deliveryTime={selectedRestaurantId ? restaurantCache[`rest_${selectedRestaurantId}`]?.delivery : undefined}
                            onNext={() => setCurrentPage('cart')}
                            buttonText="Далее"
                            showPriceInButton={false}
                            priceLabel="Доставка 5.00₾"
                        />
                    )}
                </main>

                {/* Bottom Navigation - Liquid Glass Type - Hidden on Cart, Checkout, Restaurant AND User Request Home AND Login AND Admin */}
                {!['cart', 'checkout', 'restaurant', 'home', 'login', 'admin', 'profile', 'favorites'].includes(currentPage) && (
                    <LiquidNavBar activePage={currentPage} onNavigate={setCurrentPage} />
                )}
            </div>
        </Suspense>
    );
}

function App() {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
}

export default App;
