-- Create payment_logs table for tracking invoices and payments
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,  -- 'asaas' | 'stripe' | 'mercadopago' | 'infinitepay'
  invoice_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'paid' | 'overdue' | 'cancelled'
  amount DECIMAL(10, 2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date DATE NOT NULL,
  metadata JSONB,

  CONSTRAINT unique_provider_invoice UNIQUE(user_id, provider, invoice_id)
);

-- Create indexes
CREATE INDEX idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX idx_payment_logs_provider ON payment_logs(provider);
CREATE INDEX idx_payment_logs_status ON payment_logs(status);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at);
CREATE INDEX idx_payment_logs_due_date ON payment_logs(due_date);

-- Enable RLS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own payment logs
CREATE POLICY "Users can view their own payment logs"
  ON payment_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment logs"
  ON payment_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment logs"
  ON payment_logs FOR UPDATE
  USING (auth.uid() = user_id);
