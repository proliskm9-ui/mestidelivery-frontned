-- Run this in your Supabase SQL Editor to add missing columns to the customers table
-- These columns are required by the Profile page update functionality

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Optional: Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
