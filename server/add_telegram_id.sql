-- =============================================
-- Добавление поля telegram_id в admin_users
-- =============================================

-- Добавить поле telegram_id если его нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_users' AND column_name = 'telegram_id'
    ) THEN
        ALTER TABLE admin_users ADD COLUMN telegram_id TEXT NULL;
        CREATE INDEX IF NOT EXISTS idx_admin_users_telegram_id ON admin_users(telegram_id);
    END IF;
END $$;

SELECT 'telegram_id field added successfully!' as result;
