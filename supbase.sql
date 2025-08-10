-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  subscription_end_date TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW()
);

-- User sessions table
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'invoice', 'client', 'product', 'export', etc.
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table (Razorpay/UPI)
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'upi',
  razorpay_plan_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  transaction_id TEXT,
  upi_transaction_id TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Resource usage tracking (for detailed plan limitations)
CREATE TABLE resource_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'clients', 'products', 'invoices', 'invoice_exports', 'email_shares'
  current_count INTEGER DEFAULT 0,
  limit_count INTEGER NOT NULL,
  last_reset TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, resource_type)
);

-- Add indices for better performance
CREATE INDEX idx_resource_usage_user_id ON resource_usage(user_id);
CREATE INDEX idx_resource_usage_type ON resource_usage(user_id, resource_type);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_type ON usage_logs(user_id, resource_type);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
