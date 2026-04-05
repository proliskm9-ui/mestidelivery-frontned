import React, { useState, useEffect } from 'react';
import { api, Product, Restaurant } from '../services/api';
import './Restaurant.css';

const RestaurantPage: React.FC<{
    restaurantId: string | null;
    onBack: () => void;
    onAddToCart: (item: Product) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
}> = ({ restaurantId, onBack, onAddToCart, isFavorite = false, onToggleFavorite }) => {

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
    const [loading, setLoading] = useState(true);

    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

    // Fetch Data
    useEffect(() => {
        if (!restaurantId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch restaurant, products, and categories in parallel
                const [restData, prodData] = await Promise.all([
                    api.getRestaurant(restaurantId),
                    api.getProducts(restaurantId)
                ]);

                // Get unique categories from products
                const cats = Array.from(new Set(prodData.map(p => p.category))).filter(Boolean);

                setRestaurant(restData);
                setProducts(prodData);
                setCategories(['All', ...cats]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [restaurantId]);

    const updateQuantity = (id: string, delta: number) => {
        setQuantities(prev => {
            const current = prev[id] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [id]: next };
        });
    };

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Filter & Sort
    const filteredProducts = products.filter(p => activeCategory === 'All' || p.category === activeCategory);

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        return 0; // default order
    });

    if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Loading Menu...</div>;
    // Fallback if no restaurant found or ID not set
    if (!restaurant) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Select a restaurant from the menu to see details.</div>;

    return (
        <div className="restaurant-page-container">
            {/* Hero / Header */}
            <div className="restaurant-hero" style={{ backgroundImage: `url(${restaurant.screen || restaurant.img || '/Assets/laila.png'})` }}>
                <div className="hero-overlay" />
                <button className="back-btn" onClick={onBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18L9 12L15 6" />
                    </svg>
                </button>

                <button
                    className="fav-hero-btn"
                    onClick={() => onToggleFavorite && restaurantId && onToggleFavorite(restaurantId)}
                    style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <img
                        src={isFavorite ? "/Assets/heart-green.png" : "/Assets/heart-gray.png"}
                        alt="Favorite"
                        style={{
                            width: '48px',
                            height: '48px'
                        }}
                    />
                </button>
                <div className="hero-content">
                    <h1>{restaurant.name}</h1>
                    <div className="hero-meta">
                        <span style={{ color: '#21EA7C', fontWeight: 700 }}>★ {restaurant.rating}</span>
                        <span>• {restaurant.delivery || '30 min'} • Free Delivery</span>
                    </div>
                </div>
            </div>

            {/* Sticky Categories Strip */}
            <div className="categories-strip">
                {categories.map((cat) => (
                    <div
                        key={cat}
                        className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        <span className="category-name">{cat}</span>
                    </div>
                ))}
            </div>

            {/* PC Sorting Bar */}
            <div className="pc-sort-bar">
                <span>Сортировка:</span>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="sort-select"
                >
                    <option value="default">По умолчанию</option>
                    <option value="price_asc">Сначала дешевые</option>
                    <option value="price_desc">Сначала дорогие</option>
                </select>
            </div>

            {/* Products Grid */}
            <div className="products-grid">
                {sortedProducts.map(product => {
                    const count = quantities[product.id] || 0;
                    return (
                        <div key={product.id} className="dish-card" onClick={() => setSelectedProduct(product)}>
                            <div className="dish-photo">
                                <img src={product.img || '/Assets/default-food.png'} alt={product.name} />

                                {/* Controls Overlay */}
                                <div className="dish-controls">
                                    <div className={`quantity-counter ${count === 0 ? 'collapsed' : ''}`}>
                                        <button
                                            className="qty-btn qty-minus"
                                            onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }}
                                        />
                                        <span className="qty-value">{count > 0 ? count : ''}</span>
                                        <button
                                            className="qty-btn qty-plus"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateQuantity(product.id, 1);
                                                if (count === 0) onAddToCart(product);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="dish-text">
                                <div className="dish-price">{product.price.toFixed(2)} GEL</div>
                                <div className="dish-title">{product.name}</div>
                                <div className="dish-meta">
                                    <span>{product.weight || '300g'}</span>
                                    <span className="dish-dot"></span>
                                    <span>{product.calories || '400 cal'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dish Detail Modal */}
            {selectedProduct && (
                <div className="dish-modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="dish-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="modal-top">
                            <img src={selectedProduct.img || '/Assets/default-food.png'} alt={selectedProduct.name} className="modal-hero-img" />
                        </div>

                        <div className="modal-body">
                            <div className="modal-header-row">
                                <h2 className="modal-dish-name">{selectedProduct.name}</h2>
                                <span className="modal-dish-price">{selectedProduct.price.toFixed(2)} GEL</span>
                            </div>

                            <p className="modal-description">{selectedProduct.description || 'Вкусное блюдо, приготовленное из свежих ингредиентов.'}</p>

                            {selectedProduct.ingredients && (
                                <div className="composition-block">
                                    <h3>Состав</h3>
                                    <p className="composition-text">{selectedProduct.ingredients}</p>
                                </div>
                            )}

                            <div className="kbju-section">
                                <h3>Пищевая ценность (на 100г)</h3>
                                <div className="kbju-grid-modal">
                                    <div className="kbju-item">
                                        <span className="kbju-val">{selectedProduct.calories || '—'}</span>
                                        <span className="kbju-lab">Ккал</span>
                                    </div>
                                    <div className="kbju-item">
                                        <span className="kbju-val">{selectedProduct.proteins || '—'}</span>
                                        <span className="kbju-lab">Белки</span>
                                    </div>
                                    <div className="kbju-item">
                                        <span className="kbju-val">{selectedProduct.fats || '—'}</span>
                                        <span className="kbju-lab">Жиры</span>
                                    </div>
                                    <div className="kbju-item">
                                        <span className="kbju-val">{selectedProduct.carbs || '—'}</span>
                                        <span className="kbju-lab">Углев</span>
                                    </div>
                                </div>
                            </div>

                            <button className="modal-add-btn" onClick={() => {
                                onAddToCart(selectedProduct);
                                updateQuantity(selectedProduct.id, 1);
                                setSelectedProduct(null);
                            }}>
                                Добавить за {selectedProduct.price.toFixed(2)} GEL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantPage;
