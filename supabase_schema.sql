-- Dakshinamurthy Daily Finance Supabase Schema Setup Script
-- Copy and paste this script into your Supabase SQL Editor (https://supabase.com/dashboard/project/mfnbnpbuktgfqfcymtaz/sql/new) and click RUN.

-- 1. Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist (clean setup)
DROP TABLE IF EXISTS installments;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS users;

-- 3. Create Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    mobile_number TEXT UNIQUE NOT NULL,
    email TEXT,
    occupation TEXT,
    shop_name TEXT,
    address TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin' or 'customer'
    status TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'deactivated'
    aadhaar_url TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Loans Table
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_amount REAL NOT NULL,
    platform_charges REAL NOT NULL,
    amount_disbursed REAL NOT NULL,
    daily_installment REAL NOT NULL,
    duration_days INTEGER NOT NULL,
    total_repayment REAL NOT NULL,
    remaining_balance REAL NOT NULL,
    status TEXT NOT NULL, -- 'Pending', 'Active', 'Completed', 'Rejected'
    approval_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Installments Table
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    due_date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL, -- 'Unpaid', 'Paid', 'Pending'
    payment_date TIMESTAMPTZ,
    transaction_id TEXT,   -- UTR/UPI reference from customer
    proof_url TEXT,        -- URL of payment screenshot proof
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Settings Table (for admin configurations like UPI QR code)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- 6. Create Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read INTEGER DEFAULT 0, -- 0 for Unread, 1 for Read
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Disable Row Level Security (RLS) so the anonymous client can read/write data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE installments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- 8. Seed default UPI QR setting
INSERT INTO settings (key, value)
VALUES ('upi_qr_url', 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=dakshinamurthy@ybl%26pn=Dakshinamurthy%20Daily%20Finance')
ON CONFLICT (key) DO NOTHING;

-- 8. Seed Admin Users
-- Owner Account: Email=Dakshinamurthydialyfinance@gmail.com, Password=Yeshu2414
-- System Admin: Mobile=9999999999, Password=admin123

-- Owner Admin (login with email Dakshinamurthydialyfinance@gmail.com and password Yeshu2414)
INSERT INTO users (id, full_name, mobile_number, email, role, status, password_hash)
VALUES (
    '334e7a4b-de7f-430e-bbc9-91b1f3617de1', 
    'Dakshinamurthy Finance Admin', 
    '8888888888', 
    'Dakshinamurthydialyfinance@gmail.com', 
    'admin', 
    'approved', 
    '$2a$10$c.Vwbttq5Qcv4.MG7QTEKOMnd2l7FlcxoqFdgfQvtMyfm05NHg6SW' -- hashed 'Yeshu2414'
);

-- System Admin (login with mobile 9999999999 and password admin123)
INSERT INTO users (id, full_name, mobile_number, email, role, status, password_hash)
VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 
    'System Administrator', 
    '9999999999', 
    'admin@dailyfinance.com', 
    'admin', 
    'approved', 
    '$2a$10$w09/z6t98xG9Q87Jd6bW1OQkC7z3XhXo3uW44X04Wc2WwLw/t7JzO' -- hashed 'admin123'
);
