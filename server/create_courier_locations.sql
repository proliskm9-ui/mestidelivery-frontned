-- =============================================================
-- ПОЛНЫЙ SQL для курьерской системы Mestigo
-- Выполнить в Supabase → SQL Editor
-- =============================================================

-- 1. Добавить недостающие колонки в admin_users
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS push_token TEXT;

-- 2. Создать таблицу courier_locations
CREATE TABLE IF NOT EXISTS public.courier_locations (
    id SERIAL PRIMARY KEY,
    courier_id INTEGER NOT NULL UNIQUE REFERENCES public.admin_users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION DEFAULT 0,
    speed DOUBLE PRECISION DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.courier_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service" ON public.courier_locations;
CREATE POLICY "Allow all for service" ON public.courier_locations
    FOR ALL USING (true) WITH CHECK (true);

-- Индекс
CREATE INDEX IF NOT EXISTS idx_courier_locations_courier_id ON public.courier_locations(courier_id);

-- 3. Добавить координаты ресторанам (если еще нет)
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 4. Добавить поля доставки в orders (если еще нет)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_id INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_taken_at TIMESTAMPTZ;
