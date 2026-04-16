-- Create table for Hotmart transactions logging
CREATE TABLE IF NOT EXISTS hotmart_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Hotmart-related columns to subscriptions if they don't exist
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS hotmart_transaction_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hotmart_transactions_user_id ON hotmart_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_hotmart_transactions_transaction_id ON hotmart_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_hotmart_id ON subscriptions(hotmart_transaction_id);

-- Enable RLS
ALTER TABLE hotmart_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own hotmart transactions" ON hotmart_transactions;
CREATE POLICY "Users can view their own hotmart transactions"
  ON hotmart_transactions
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can insert hotmart transactions" ON hotmart_transactions;
CREATE POLICY "Service role can insert hotmart transactions"
  ON hotmart_transactions
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR TRUE);
