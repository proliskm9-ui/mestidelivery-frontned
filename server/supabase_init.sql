-- =============================================
-- SUPABASE ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ (ОБНОВЛЕННАЯ)
-- Выполните этот скрипт в SQL Editor в Supabase Dashboard
-- =============================================

-- Таблица категорий (для группировки ресторанов)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Таблица ресторанов
CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rating TEXT NOT NULL,
    delivery TEXT NOT NULL,
    img TEXT NOT NULL,
    screen TEXT DEFAULT 'restaurant-default',
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    has_promo BOOLEAN DEFAULT FALSE,
    min_order INTEGER DEFAULT 0
);

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price DOUBLE PRECISION NOT NULL,
    img TEXT DEFAULT '',
    category TEXT DEFAULT '',
    weight TEXT DEFAULT '',
    calories TEXT DEFAULT '',
    proteins TEXT DEFAULT '',
    fats TEXT DEFAULT '',
    carbs TEXT DEFAULT '',
    ingredients TEXT DEFAULT ''
);

-- Индекс для продуктов
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);

-- Таблица администраторов
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'restaurant_admin',
    restaurant_id TEXT REFERENCES restaurants(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_online BOOLEAN DEFAULT FALSE,
    push_token TEXT NULL
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    restaurant_id TEXT NOT NULL,
    items TEXT NOT NULL,  -- JSON string
    total DOUBLE PRECISION NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customer_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    delivery_lat DOUBLE PRECISION,
    delivery_lng DOUBLE PRECISION,
    place_type TEXT DEFAULT '',
    scheduled_time TIMESTAMP WITH TIME ZONE NULL,
    promo_code TEXT DEFAULT '',
    discount DOUBLE PRECISION DEFAULT 0,
    tips DOUBLE PRECISION DEFAULT 0,
    delivery_fee DOUBLE PRECISION DEFAULT 5,
    service_fee DOUBLE PRECISION DEFAULT 0,
    courier_id INTEGER REFERENCES admin_users(id),
    courier_taken_at TIMESTAMP WITH TIME ZONE NULL,
    restaurant_confirmed BOOLEAN DEFAULT FALSE,
    courier_confirmed BOOLEAN DEFAULT FALSE,
    restaurant_confirmed_at TIMESTAMP WITH TIME ZONE NULL,
    courier_confirmed_at TIMESTAMP WITH TIME ZONE NULL
);

-- Таблица промокодов
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER DEFAULT 0,
    discount_amount DOUBLE PRECISION DEFAULT 0,
    min_order DOUBLE PRECISION DEFAULT 0,
    max_uses INTEGER DEFAULT 0,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE NULL,
    valid_until TIMESTAMP WITH TIME ZONE NULL,
    restaurant_id TEXT REFERENCES restaurants(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица магазинов (супермаркеты и т.д.)
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    img TEXT NOT NULL,
    delivery TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- Создаём супер-админа если его нет
INSERT INTO admin_users (username, password_hash, role) 
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/p/O', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- Пример категории
INSERT INTO categories (id, name, icon, sort_order)
VALUES ('main', 'Рестораны', 'utensils', 1)
ON CONFLICT (id) DO NOTHING;

-- Пример ресторана
INSERT INTO restaurants (id, name, rating, delivery, img, screen, category_id)
VALUES ('demo', 'Демо Ресторан', '4.9', '30-45 мин', 'https://via.placeholder.com/400x300', 'restaurant-default', 'main')
ON CONFLICT (id) DO NOTHING;

-- Таблица клиентов (пользователей приложения)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NULL,
    phone TEXT NULL,
    avatar TEXT NULL,
    address JSONB DEFAULT '{}'::jsonb,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Пример продукта
INSERT INTO products (id, restaurant_id, name, description, price, category, weight, calories)
VALUES ('demo-1', 'demo', 'Хачапури', 'Вкусный хачапури', 15.5, 'Выпечка', '350г', '450')
ON CONFLICT (id) DO NOTHING;
