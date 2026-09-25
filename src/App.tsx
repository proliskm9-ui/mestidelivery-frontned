import { Suspense, useState, useEffect, useCallback, lazy } from 'react';
import { useDeliveryEta } from './hooks/useDeliveryEta';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import { api, restaurantCache } from './services/api';
import LiquidNavBar from './components/UI/LiquidNavBar';
import LoadingScreen from './components/UI/LoadingScreen';
import { PageSkeleton } from './components/UI/Skeleton';
import Toaster from './components/UI/Toaster';
import Dialog, { DialogClose } from './components/UI/Dialog';
import { useAuth } from './auth/AuthContext';
import { addressText, detectZoneFromText, deviceHasOrdered, accountHasOrders } from './utils/deliveryPromo';
import CompleteProfileModal from './components/auth/CompleteProfileModal';

// --- Lazy-loaded pages (loaded only when navigated to) ---
const HomePage = lazy(() => import('./pages/Home'));
const MenuPage = lazy(() => import('./pages/Menu'));
const LoginPage = lazy(() => import('./pages/Login'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const AuthGoogleDonePage = lazy(() => import('./pages/AuthGoogleDone'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
// @ts-ignore
const AdminPanel = lazy(() => import('./pages/Admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
// Partners is a Telegram Mini App entry — load eagerly so iOS WebView does not
// stick on Suspense/Telegram placeholder when the lazy chunk is slow.
import PartnerApp from './pages/PartnerApp/PartnerMain';
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
const LegalInfoPage = lazy(() => import('./pages/LegalInfoPage'));
import CookieConsentBanner from './components/UI/CookieConsentBanner';
import { DeliveryLocationProvider, useDeliveryLocation } from './delivery/DeliveryLocationContext';
import { getDeliveryFeeForAddress } from './utils/deliveryCalculator';
import { isBackendApiToken } from './utils/security';
import { getMinimumOrderQuantity } from './utils/minimumOrderQuantity';
import {
    pagePath,
    parseCustomerPath,
    restaurantIdFromSlug,
    resolveRestaurantId,
    isServicePath,
} from './routing/paths';
import SeoHead from './routing/SeoHead';

import type { CheckoutOrderData } from './Оплата/CheckoutPage';

const DEFAULT_AVATARS = [
    '/Assets/photo_2026-02-11_23-14-10.jpg',
    '/Assets/photo_2026-02-11_23-14-27.jpg',
    '/Assets/photo_2026-02-11_23-14-50.jpg',
    '/Assets/photo_2026-02-11_23-19-47.jpg'
];

import { LanguageProvider, useLanguage } from './translations/LanguageContext';

function isLegalPath(pathname: string) {
    return /^\/(?:(?:ru|en|ka)\/)?(legal|terms|privacy|returns|refunds|contact|support)\/?$/.test(pathname || '');
}

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
    const { t, language } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { logout: authLogout, needsProfileCompletion } = useAuth();
    const deliveryLoc = useDeliveryLocation();
    // Auth State — reject leftover Firebase ID tokens (they break profile/orders)
    const [token, setToken] = useState<string | null>(() => {
        const stored = localStorage.getItem('token');
        if (stored && !isBackendApiToken(stored)) {
            localStorage.removeItem('token');
            return null;
        }
        return stored;
    });

    // Loading State for Authorized Users (Splash Screen)
    const [isLoading, setIsLoading] = useState(!!token);

    // Basic navigation state - If auth, go to menu, else home
    // Check for admin route
    const initialRoute = parseCustomerPath(window.location.pathname);
    const [currentPage, setCurrentPageState] = useState(() => {
        if (window.location.pathname.startsWith('/partners')) return 'partner';
        if (window.location.pathname.startsWith('/admin')) return 'admin';
        return initialRoute.page || (token ? 'menu' : 'home');
    });

    // Removal of redundant timer, LoadingScreen handles its own timing

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
        () => initialRoute.orderId || null,
    );

    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(
        () => initialRoute.restaurantSlug ? restaurantIdFromSlug(initialRoute.restaurantSlug) : null,
    );
    const setCurrentPage = useCallback((
        page: string,
        extras?: { restaurant?: string; orderId?: number },
    ) => {
        const restaurant = extras?.restaurant ?? selectedRestaurantId;
        const orderId = extras?.orderId ?? selectedOrderId;
        if (extras?.restaurant) setSelectedRestaurantId(extras.restaurant);
        if (extras?.orderId) setSelectedOrderId(extras.orderId);
        setCurrentPageState(page);
        if (isServicePath(location.pathname) || isLegalPath(location.pathname)) return;
        if (page === 'contact') {
            navigate(`/${language}/contact`);
            return;
        }
        if (page === 'restaurant' && !restaurant) return;
        if ((page === 'order_status' || page === 'order_details') && !orderId) return;
        navigate(pagePath(language, page as any, {
            restaurant: restaurant || undefined,
            orderId: orderId || undefined,
        }));
    }, [language, location.pathname, navigate, selectedOrderId, selectedRestaurantId]);

    // Redirect auth users from home
    useEffect(() => {
        if (token && (currentPage === 'home' || currentPage === 'login')) {
            // Replace, not push: otherwise Back lands on the landing/login URL,
            // which redirects forward again and traps the user.
            setCurrentPageState('menu');
            if (isServicePath(location.pathname) || isLegalPath(location.pathname)) return;
            navigate(pagePath(language, 'menu'), { replace: true });
        }
    }, [token, currentPage, language, location.pathname, navigate]);

    const handleNavigate = (page: string, extras?: { restaurant?: string; orderId?: number }) => {
        const protectedRoutes = ['profile', 'favorites', 'cart', 'checkout', 'payment', 'order_status', 'order_details'];
        if (!token && protectedRoutes.includes(page)) {
            setCurrentPage('login');
        } else {
            setCurrentPage(page, extras);
        }
    };

    // URL → UI state. This keeps refresh, pasted restaurant links and browser
    // Back/Forward working while the checkout/cart data itself stays in memory.
    useEffect(() => {
        if (isServicePath(location.pathname) || isLegalPath(location.pathname)) return;
        const parsed = parseCustomerPath(location.pathname);
        if (!parsed.language) return; // LanguageProvider will add the prefix.

        const protectedRoutes = ['profile', 'favorites', 'cart', 'checkout', 'payment', 'order_status', 'order_details'];
        if (parsed.page && !token && protectedRoutes.includes(parsed.page)) {
            setCurrentPageState('login');
            navigate(pagePath(parsed.language, 'login'), { replace: true });
            return;
        }

        if (!parsed.page) {
            setCurrentPageState('home');
            navigate(pagePath(parsed.language, 'home'), { replace: true });
            return;
        }

        if (parsed.orderId) setSelectedOrderId(parsed.orderId);

        if (parsed.page === 'restaurant' && parsed.restaurantSlug) {
            const knownId = restaurantIdFromSlug(parsed.restaurantSlug);
            if (knownId) {
                setSelectedRestaurantId(knownId);
                setCurrentPageState('restaurant');
                return;
            }

            let cancelled = false;
            api.getRestaurants()
                .then((restaurants) => {
                    if (cancelled) return;
                    const restaurantId = resolveRestaurantId(parsed.restaurantSlug!, restaurants);
                    if (!restaurantId) {
                        setCurrentPageState('menu');
                        navigate(pagePath(parsed.language!, 'menu'), { replace: true });
                        return;
                    }
                    setSelectedRestaurantId(restaurantId);
                    setCurrentPageState('restaurant');
                })
                .catch(() => {
                    if (!cancelled) setCurrentPageState('menu');
                });
            return () => { cancelled = true; };
        }

        setCurrentPageState(parsed.page);
    }, [location.pathname, navigate, token]);

    // Canonicalize detail URLs after selecting entities from state-driven
    // screens. Known restaurant IDs map to stable, readable slugs.
    useEffect(() => {
        if (currentPage !== 'restaurant' || !selectedRestaurantId || isLegalPath(location.pathname)) return;
        // Only rewrite a restaurant URL (id -> slug). If the URL points elsewhere, the user
        // navigated away (e.g. system Back) and the URL -> state effect above takes over;
        // re-pushing here used to trap Back on the restaurant page.
        if (parseCustomerPath(location.pathname).page !== 'restaurant') return;
        const expected = pagePath(language, 'restaurant', { restaurant: selectedRestaurantId });
        if (location.pathname !== expected) navigate(expected, { replace: true });
    }, [currentPage, language, location.pathname, navigate, selectedRestaurantId]);

    useEffect(() => {
        if (!selectedOrderId || (currentPage !== 'order_status' && currentPage !== 'order_details')) return;
        // Same guard as above: never fight a Back navigation away from the order screens.
        const urlPage = parseCustomerPath(location.pathname).page;
        if (urlPage !== 'order_status' && urlPage !== 'order_details') return;
        const expected = pagePath(language, currentPage, { orderId: selectedOrderId });
        if (location.pathname !== expected) navigate(expected, { replace: true });
    }, [currentPage, language, location.pathname, navigate, selectedOrderId]);
    const [cart, setCart] = useState<{ product: any, quantity: number }[]>([]);
    // Panel ETA: the cart's restaurant, or the restaurant being viewed
    const cartEta = useDeliveryEta(cart[0]?.product?.restaurant_id || selectedRestaurantId, selectedRestaurantId, null, true);
    // Tell the server-side helpers (Sunset packaging) whose cart this is
    useEffect(() => {
        const rid = cart[0]?.product?.restaurant_id;
        (window as any).__mestiCartRestaurant = rid ? { id: rid, name: restaurantCache[`rest_${rid}`]?.name || '' } : null;
    }, [cart]);
    const [pendingProductToAdd, setPendingProductToAdd] = useState<any>(null);
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

        if (newAddress?.geo) {
            const match = String(newAddress.geo).match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
            if (match) {
                const a = parseFloat(match[1]);
                const b = parseFloat(match[2]);
                if (!Number.isNaN(a) && !Number.isNaN(b)) {
                    const lat = Math.abs(a - 43) <= Math.abs(b - 43) ? a : b;
                    const lng = lat === a ? b : a;
                    deliveryLoc.setManualLocation(lat, lng);
                }
            }
        }

        if (token) {
            try {
                await api.updateProfile({ address: newAddress });
            } catch (error) {
                console.error("Failed to save address to server", error);
            }
        }
    };

    // Keep React address state in sync when GPS / map resolves a zone
    useEffect(() => {
        if (deliveryLoc.status !== 'ready' || deliveryLoc.lat == null || deliveryLoc.lng == null) return;
        const geo = `${deliveryLoc.lat.toFixed(6)}, ${deliveryLoc.lng.toFixed(6)}`;
        setUserAddress((prev: any) => {
            // Zone named in the address text wins; a GPS 'outside' falls back to center (prod)
            const forcedZone = detectZoneFromText(addressText(prev, false));
            const effectiveZone = forcedZone || (deliveryLoc.zoneId === 'outside' ? 'center' : deliveryLoc.zoneId);
            if (prev?.geo === geo && prev?.deliveryZone === effectiveZone) return prev;
            const next = { ...(prev || {}), geo, deliveryZone: effectiveZone };
            localStorage.setItem('user_address', JSON.stringify(next));
            return next;
        });
    }, [deliveryLoc.status, deliveryLoc.lat, deliveryLoc.lng, deliveryLoc.zoneId]);

    const cartSubtotal = cart.reduce((a: number, b: { quantity: number; product: any }) => a + (Number(b.product.price) * b.quantity), 0);
    const cartServiceFee = cartSubtotal > 0 ? Math.max(0.99, Math.min(2.00, cartSubtotal * 0.06)) : 0;
    
    // First-order promo (prod): new device & account, cart >= 100 ₾
    const baseCartDeliveryFee = deliveryLoc.fee ?? getDeliveryFeeForAddress(userAddress) ?? 8;
    const cartPromoEligible = !deviceHasOrdered() && !accountHasOrders();
    const cartDeliveryDiscount = cartPromoEligible && cartSubtotal >= 100
        ? (baseCartDeliveryFee <= 12 ? baseCartDeliveryFee : 10)
        : 0;
    const deliveryFee = Math.max(0, baseCartDeliveryFee - cartDeliveryDiscount);
    const cartTotalAmount = cartSubtotal + deliveryFee + cartServiceFee;

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

    useEffect(() => {
        if (!token || window.location.pathname.startsWith('/partners')) return;
        const tg = (window as any).Telegram?.WebApp;
        const initData = tg?.initData;
        if (!initData) return;

        api.linkTelegramAccount(initData, language).catch((error) => {
            console.warn('Telegram link skipped:', error);
        });
    }, [token, language]);

    // Scroll to top on page change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPage]);

    const handleNavigateToRestaurant = (id: string) => {
        setCurrentPage('restaurant', { restaurant: id });
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
            return [...prev, { product, quantity: getMinimumOrderQuantity(product) }];
        });
    };

    const handleUpdateCartQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.flatMap(item => {
            if (item.product.id !== productId) return [item];

            const minimum = getMinimumOrderQuantity(item.product);
            if (delta < 0 && item.quantity <= minimum) return [];

            return [{ ...item, quantity: Math.max(minimum, item.quantity + delta) }];
        }));
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

    const handleLogin = useCallback((newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setCurrentPage('menu');
        setIsLoading(true);
    }, []);

    // Google redirect can finish before Login is mounted
    useEffect(() => {
        const onToken = (e: Event) => {
            const token = (e as CustomEvent<string>).detail;
            if (token) {
                sessionStorage.removeItem('pending_google_token');
                handleLogin(token);
            }
        };
        window.addEventListener('mestigo-google-token', onToken);
        const pending = sessionStorage.getItem('pending_google_token');
        if (pending) {
            sessionStorage.removeItem('pending_google_token');
            handleLogin(pending);
        }
        return () => window.removeEventListener('mestigo-google-token', onToken);
    }, [handleLogin]);

    // After Google redirect, show login shell + profile modal (not empty home)
    useEffect(() => {
        if (needsProfileCompletion) {
            setCurrentPage('login');
        }
    }, [needsProfileCompletion]);

    const handleLogout = async () => {
        authLogout();
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
            <Suspense fallback={<PageSkeleton variant="generic" />}>
                <AdminPanel />
            </Suspense>
        );
    }

    if (currentPage === 'partner') {
        return <PartnerApp />;
    }


    return (
        <Suspense
            fallback={
                currentPage === 'home'
                    ? <div className="home-boot" aria-hidden="true" />
                    : <PageSkeleton variant="menu" />
            }
        >
            <div className="app-container">
                <SeoHead />
                {needsProfileCompletion && <CompleteProfileModal onSuccess={handleLogin} />}
                {isLoading && (
                    <LoadingScreen onComplete={() => {
                        setIsLoading(false);
                        // Keep deep links (order status from the bot, a shared restaurant,
                        // refresh on profile); only the landing/login URL goes to the menu.
                        // Read the URL, not currentPage: this callback is captured at mount.
                        const urlPage = parseCustomerPath(window.location.pathname).page;
                        if (!urlPage || urlPage === 'home' || urlPage === 'login') setCurrentPage('menu');
                    }} />
                )}
                {/* Navbar - Hidden on Home, Login, Menu, Restaurant AND Cart AND Checkout AND Profile AND Admin pages */}
                {/* Actually Top Navbar was hidden on Home/Menu etc? No.
                    Original: !['home', 'menu', 'restaurant', 'cart', 'checkout', 'profile', 'favorites', 'payment'].includes(currentPage)
                    So mostly hidden?
                    Let's update exclusion list to include 'login'.
                */}
                {!['home', 'login', 'forgot_password', 'menu', 'restaurant', 'cart', 'checkout', 'profile', 'favorites', 'payment', 'admin'].includes(currentPage) && !isLegalPath(window.location.pathname) && (
                    <nav style={{ padding: '0 2rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
                        <div className="logo" onClick={() => setCurrentPage(token ? 'menu' : 'home')} style={{ cursor: 'pointer' }}>
                            <img src="/Assets/general-green.png" alt="MestiDelivery" style={{ height: '40px' }} />
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
                    <Routes>
                        <Route path="/verify" element={<VerifyEmailPage />} />
                        <Route path="/auth/google/done" element={<AuthGoogleDonePage />} />
                        <Route path="/:lang/auth/google/done" element={<AuthGoogleDonePage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/legal" element={<LegalInfoPage />} />
                        <Route path="/terms" element={<LegalInfoPage />} />
                        <Route path="/privacy" element={<LegalInfoPage />} />
                        <Route path="/returns" element={<LegalInfoPage />} />
                        <Route path="/refunds" element={<LegalInfoPage />} />
                        <Route path="/contact" element={<LegalInfoPage />} />
                        <Route path="/support" element={<LegalInfoPage />} />
                        <Route path="/:lang/legal" element={<LegalInfoPage />} />
                        <Route path="/:lang/terms" element={<LegalInfoPage />} />
                        <Route path="/:lang/privacy" element={<LegalInfoPage />} />
                        <Route path="/:lang/returns" element={<LegalInfoPage />} />
                        <Route path="/:lang/refunds" element={<LegalInfoPage />} />
                        <Route path="/:lang/contact" element={<LegalInfoPage />} />
                        <Route path="/:lang/support" element={<LegalInfoPage />} />
                        <Route path="*" element={
                            <>
                                {currentPage === 'home' && (
                                    <HomePage
                                        onNavigate={handleNavigate}
                                    />
                                )}

                                {currentPage === 'login' && (
                                    <LoginPage
                                        onLogin={handleLogin}
                                        onForgotPassword={() => setCurrentPage('forgot_password')}
                                    />
                                )}

                                {currentPage === 'forgot_password' && (
                                    <ForgotPasswordPage onBack={() => setCurrentPage('login')} />
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
                                        onOrderClick={(id) => handleNavigate('order_status', { orderId: id })}
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
                                        onOrderClick={(id: number) => setCurrentPage('order_details', { orderId: id })}
                                        onNavigate={(page: string) => setCurrentPage(page as any)}
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
                                        onUpdateQuantity={handleUpdateCartQuantity}
                                        onClearCart={() => setCart([])}
                                        onNavigateToCart={() => setCurrentPage('cart')}
                                        cartDeliveryFee={deliveryFee}
                                        orderTotal={cartTotalAmount}
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
                                                            setCurrentPage('restaurant', { restaurant: cart[0].product.restaurant_id });
                                                        } else {
                                                            setCurrentPage('menu');
                                                        }
                                                    }}
                                                    initialCartItems={cart}
                                                    onClearCart={() => setCart([])}
                                                    onUpdateQuantity={handleUpdateCartQuantity}
                                                    onAddToCart={handleAddToCart}
                                                    onCheckout={(data: { comment: string; cutlery: number }) => {
                                                        setCheckoutExtras(data);
                                                        setCurrentPage('checkout');
                                                    }}
                                                    deliveryFee={deliveryFee}
                                                />
                                            ) : (
                                                <CartPage
                                                    onBack={() => {
                                                        if (cart.length > 0) {
                                                            setCurrentPage('restaurant', { restaurant: cart[0].product.restaurant_id });
                                                        } else {
                                                            setCurrentPage('menu');
                                                        }
                                                    }}
                                                    initialCartItems={cart}
                                                    onClearCart={() => setCart([])}
                                                    onUpdateQuantity={handleUpdateCartQuantity}
                                                    onAddToCart={handleAddToCart}
                                                    onCheckout={(data: { comment: string, cutlery: number }) => {
                                                        setCheckoutExtras(data);
                                                        setCurrentPage('checkout');
                                                    }}
                                                    deliveryFee={deliveryFee}
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
                                                            deliveryFee: orderData.deliveryFee ?? deliveryFee,
                                                            serviceFee: orderData.serviceFee ?? cartServiceFee,
                                                            deliveryLat: orderData.deliveryLat ?? deliveryLoc.lat ?? null,
                                                            deliveryLng: orderData.deliveryLng ?? deliveryLoc.lng ?? null,
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
                                                        setPendingOrderData({
                                                            ...data,
                                                            deliveryFee: data.deliveryFee ?? deliveryFee,
                                                            serviceFee: data.serviceFee ?? cartServiceFee,
                                                            deliveryLat: data.deliveryLat ?? deliveryLoc.lat ?? null,
                                                            deliveryLng: data.deliveryLng ?? deliveryLoc.lng ?? null,
                                                        });
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
                                                    setCurrentPage('order_status', { orderId });
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
                                                    setCurrentPage('order_status', { orderId });
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
                                            onViewDetails={(id) => setCurrentPage('order_details', { orderId: id })}
                                        />
                                    </div>
                                )}

                                {currentPage === 'order_details' && selectedOrderId && (
                                    // Own full-screen layer like the status page (desktop: the flow frame, no site header behind)
                                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 5000, overflowY: 'auto', background: 'var(--bg)' }}>
                                        <OrderDetails orderId={selectedOrderId} onBack={() => setCurrentPage('profile')} />
                                    </div>
                                )}


                                {currentPage === 'restaurant' && (
                                    <GlassBottomPanel
                                        totalItems={cart.reduce((a, b) => a + b.quantity, 0)}
                                        totalPrice={cart.reduce((a, b) => a + (b.product.price * b.quantity), 0)}
                                        deliveryTime={cartEta}
                                        deliveryFee={deliveryFee}
                                        onNext={() => setCurrentPage('cart')}
                                        buttonText={t('common.next')}
                                        showPriceInButton={false}
                                    />
                                )}
                            </>
                        } />
                    </Routes>
                </main>

                {/* Bottom Navigation - Hidden on Cart, Checkout, Restaurant, Home, Login, Admin, Favorites, Profile, Order Details */}
                {!['cart', 'checkout', 'restaurant', 'home', 'login', 'forgot_password', 'admin', 'favorites', 'profile', 'order_details'].includes(currentPage) && !isLegalPath(window.location.pathname) && (
                    <LiquidNavBar activePage={currentPage} onNavigate={handleNavigate} />
                )}
            </div>

            {/* Cross-restaurant warning modal */}
            <Dialog
                open={Boolean(pendingProductToAdd)}
                onOpenChange={(open) => { if (!open) setPendingProductToAdd(null); }}
                title={t('cart.other_restaurant_title')}
                description={t('cart.other_restaurant_desc')}
                actions={
                    <>
                        <button
                            type="button"
                            className="ds-btn ds-btn--danger"
                            onClick={() => {
                                if (!pendingProductToAdd) return;
                                setCart([{
                                    product: pendingProductToAdd,
                                    quantity: getMinimumOrderQuantity(pendingProductToAdd),
                                }]);
                                setPendingProductToAdd(null);
                            }}
                        >
                            {t('cart.other_restaurant_clear')}
                        </button>
                        <DialogClose className="md-dialog-cancel">{t('common.cancel')}</DialogClose>
                    </>
                }
            />

            <CookieConsentBanner />
            <Toaster />
        </Suspense>
    );
};

function App() {
    return (
        <LanguageProvider>
            <DeliveryLocationProvider>
                <AppContent />
            </DeliveryLocationProvider>
        </LanguageProvider>
    );
}

export default App;
