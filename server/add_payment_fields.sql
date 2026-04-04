-- Migration: Add payment_method and idempotency_key columns to orders table
-- Run this on your Supabase SQL Editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Create unique index on idempotency_key for dedup protection
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key 
ON orders (idempotency_key) 
WHERE idempotency_key IS NOT NULL;
