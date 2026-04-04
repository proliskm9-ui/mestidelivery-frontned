-- Add address to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
