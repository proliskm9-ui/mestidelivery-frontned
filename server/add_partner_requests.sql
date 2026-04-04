-- =============================================
-- Таблица заявок от партнеров
-- =============================================

CREATE TABLE IF NOT EXISTS partner_requests (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('restaurant', 'courier')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    company_name TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Индекс для быстрого поиска по статусу
CREATE INDEX IF NOT EXISTS idx_partner_requests_status ON partner_requests(status);
CREATE INDEX IF NOT EXISTS idx_partner_requests_type ON partner_requests(type);
CREATE INDEX IF NOT EXISTS idx_partner_requests_created ON partner_requests(created_at DESC);

-- RLS политики
ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;

-- Публичная вставка (для формы на сайте)
CREATE POLICY "Public insert partner requests" ON partner_requests 
    FOR INSERT WITH CHECK (true);

-- Чтение только для service role (админ панель)
CREATE POLICY "Service role read partner requests" ON partner_requests 
    FOR SELECT USING (auth.role() = 'service_role');

-- Обновление только для service role
CREATE POLICY "Service role update partner requests" ON partner_requests 
    FOR UPDATE USING (auth.role() = 'service_role');

-- Удаление только для service role
CREATE POLICY "Service role delete partner requests" ON partner_requests 
    FOR DELETE USING (auth.role() = 'service_role');

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_partner_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_requests_updated_at
    BEFORE UPDATE ON partner_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_requests_updated_at();

SELECT 'Partner requests table created successfully!' as result;
