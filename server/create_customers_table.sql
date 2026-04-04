-- Run this in your Supabase SQL Editor to create the customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
