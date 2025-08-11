import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
// You can get these from https://supabase.com/dashboard/project/[your-project]/settings/api
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table schemas (you'll need to create these in Supabase)
/*
-- Users table (updated with payment tracking)
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
  usage_limit INTEGER DEFAULT 3,
  payment_id UUID,
  razorpay_customer_id TEXT,
  razorpay_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW()
);

-- Add phone verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_expires_at TIMESTAMP;

-- User sessions table
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage logs table (expanded for multiple resource types)
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'invoice', 'client', 'product', 'export', etc.
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table for UPI/Razorpay transactions
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
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

-- Subscription plans table (with detailed feature limitations)
CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  billing_interval TEXT NOT NULL, -- 'month', '3months', '6months', 'year'
  features JSONB NOT NULL,
  limitations JSONB NOT NULL, -- Detailed limitations object
  usage_limit INTEGER NOT NULL,
  razorpay_plan_id TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Resource usage tracking (for detailed plan limitations)
CREATE TABLE resource_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'invoices', 'clients', 'products'
  current_count INTEGER DEFAULT 0,
  limit_count INTEGER NOT NULL,
  last_reset TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, resource_type)
);

-- Payment webhooks log
CREATE TABLE payment_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id TEXT,
  event_type TEXT NOT NULL,
  payment_id UUID REFERENCES payments(id),
  razorpay_payment_id TEXT,
  status TEXT,
  data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_action ON usage_logs(action);
CREATE INDEX idx_resource_usage_user_id ON resource_usage(user_id);
CREATE INDEX idx_resource_usage_type ON resource_usage(resource_type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_usage_updated_at BEFORE UPDATE ON resource_usage
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_id, name, price, currency, billing_interval, features, limitations, usage_limit, razorpay_plan_id) VALUES
('free', 'Free', 0, 'INR', 'month', 
  '["3 invoices save & export", "1 client", "5 products", "PDF export only", "Manual sync only", "Default template only", "No custom templates", "No priority support", "No Drive export", "No email sharing"]'::jsonb,
  '{"exportFormats": ["pdf"], "autoSyncFrequency": "manual", "templateAccess": ["default"], "customTemplates": false, "supportLevel": "none", "invoicesSaveExport": 3, "clients": 1, "products": 5, "exportToDrive": false, "emailShare": false}'::jsonb,
  3, null),
('pro', 'Pro', 499, 'INR', 'month',
  '["50 invoices save & export", "50 clients", "50 products", "PDF + Drive export", "Auto-sync every 30 minutes", "Default + Modern templates", "No custom templates", "Email support", "Drive export enabled", "Email sharing enabled"]'::jsonb,
  '{"exportFormats": ["pdf", "drive"], "autoSyncFrequency": "30min", "templateAccess": ["default", "modern"], "customTemplates": false, "supportLevel": "email", "invoicesSaveExport": 50, "clients": 50, "products": 50, "exportToDrive": true, "emailShare": true}'::jsonb,
  50, 'plan_pro_monthly_inr'),
('business', 'Business', 1999, 'INR', 'month',
  '["Unlimited invoices save & export", "Unlimited clients", "Unlimited products", "All export formats", "Auto-sync every 5 minutes", "All templates available", "Custom templates enabled", "Priority support", "Drive export enabled", "Email sharing enabled"]'::jsonb,
  '{"exportFormats": ["pdf", "drive", "csv", "xlsx", "json"], "autoSyncFrequency": "5min", "templateAccess": ["default", "modern", "formal", "custom"], "customTemplates": true, "supportLevel": "priority", "invoicesSaveExport": -1, "clients": -1, "products": -1, "exportToDrive": true, "emailShare": true}'::jsonb,
  -1, 'plan_business_monthly_inr');

-- Create Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions FOR ALL USING (auth.uid()::text = user_id::text);

-- Users can only see their own usage logs
CREATE POLICY "Users can view own usage logs" ON usage_logs FOR ALL USING (auth.uid()::text = user_id::text);

-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments FOR ALL USING (auth.uid()::text = user_id::text);

-- Users can only see their own resource usage
CREATE POLICY "Users can view own resource usage" ON resource_usage FOR ALL USING (auth.uid()::text = user_id::text);

-- Subscription plans are readable by all authenticated users
CREATE POLICY "Subscription plans are viewable by all users" ON subscription_plans FOR SELECT TO authenticated USING (true);
*/ 