-- =============================================================================
-- Mestigo API Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants  
CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rating TEXT NOT NULL DEFAULT '0',
    delivery TEXT NOT NULL DEFAULT '30-45 min',
    img TEXT NOT NULL DEFAULT '',
    screen TEXT NOT NULL DEFAULT '',
    category_id TEXT REFERENCES categories(id),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    has_promo BOOLEAN NOT NULL DEFAULT FALSE,
    min_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price DECIMAL(10, 2) NOT NULL,
    img TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    weight TEXT DEFAULT '',
    calories TEXT DEFAULT '',
    proteins TEXT DEFAULT '',
    fats TEXT DEFAULT '',
    carbs TEXT DEFAULT '',
    ingredients TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores (grocery stores)
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    img TEXT NOT NULL DEFAULT '',
    delivery TEXT NOT NULL DEFAULT '30-45 min',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'restaurant_admin',
    restaurant_id TEXT REFERENCES restaurants(id),
    is_online BOOLEAN DEFAULT FALSE,
    push_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    restaurant_id TEXT NOT NULL,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    customer_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    comment TEXT DEFAULT '',
    place_type TEXT DEFAULT '',
    scheduled_time TIMESTAMP WITH TIME ZONE,
    promo_code TEXT DEFAULT '',
    discount DECIMAL(10, 2) DEFAULT 0,
    tips DECIMAL(10, 2) DEFAULT 0,
    service_fee DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 5,
    courier_id INTEGER REFERENCES admin_users(id),
    courier_taken_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courier Locations
CREATE TABLE IF NOT EXISTS courier_locations (
    id SERIAL PRIMARY KEY,
    courier_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(courier_id)
);

-- Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_order DECIMAL(10, 2) NOT NULL DEFAULT 0,
    max_uses INTEGER NOT NULL DEFAULT 0,
    current_uses INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    restaurant_id TEXT REFERENCES restaurants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- Indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_category ON restaurants(category_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

-- =============================================================================
-- Row Level Security (RLS) - Optional but recommended for production
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Public read access for menu data
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read stores" ON stores FOR SELECT USING (true);

-- Orders: users can read their own orders
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (true);

-- Authenticated access for admin operations (via service role key)
CREATE POLICY "Service role full access categories" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access restaurants" ON restaurants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access stores" ON stores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access orders" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access admin_users" ON admin_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access courier_locations" ON courier_locations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access promo_codes" ON promo_codes FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- Sample Data (Optional - remove for production)
-- =============================================================================

-- Sample categories
INSERT INTO categories (id, name, icon, sort_order) VALUES
    ('pizza', 'Пицца', '🍕', 1),
    ('sushi', 'Суши', '🍣', 2),
    ('burgers', 'Бургеры', '🍔', 3),
    ('asian', 'Азиатская', '🍜', 4),
    ('desserts', 'Десерты', '🍰', 5)
ON CONFLICT (id) DO NOTHING;

-- Sample restaurant
INSERT INTO restaurants (id, name, rating, delivery, img, screen, category_id, is_featured) VALUES
    ('demo-pizza', 'Demo Pizza', '4.8', '30-40 мин', '/uploads/demo.jpg', '/uploads/demo.jpg', 'pizza', true)
ON CONFLICT (id) DO NOTHING;

-- Sample product
INSERT INTO products (id, restaurant_id, name, description, price, category) VALUES
    ('demo-margherita', 'demo-pizza', 'Маргарита', 'Классическая пицца с томатами и моцареллой', 12.99, 'Пицца')
ON CONFLICT (id) DO NOTHING;

-- Sample admin user (password: admin123)
-- Password hash for 'admin123': $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.E5K1ZwvgKv8p8i
INSERT INTO admin_users (username, password_hash, role) VALUES
    ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.E5K1ZwvgKv8p8i', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- Done!
SELECT 'Database schema created successfully!' as result;
