-- Add Hotmart/Smart Market loja authentication and subscription fields
-- This migration adds support for standalone loja authentication (not tied to auth.users)

-- Add new columns to lojas table for standalone authentication
ALTER TABLE public.lojas
ADD COLUMN IF NOT EXISTS login_usuario VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS senha_usuario VARCHAR(255),
ADD COLUMN IF NOT EXISTS plano VARCHAR(50) DEFAULT 'premium', -- 'premium'
ADD COLUMN IF NOT EXISTS data_expiracao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hotmart_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS nome_usuario VARCHAR(255);

-- Create index for login lookups
CREATE INDEX IF NOT EXISTS idx_lojas_login ON public.lojas(login_usuario);
CREATE INDEX IF NOT EXISTS idx_lojas_ativo ON public.lojas(ativo);
CREATE INDEX IF NOT EXISTS idx_lojas_expiracao ON public.lojas(data_expiracao);

-- Create pagamentos table for payment history
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  valor TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'failed', 'cancelled', 'refunded'
  metodo VARCHAR(50), -- 'hotmart', 'credit_card', 'pix', etc
  referencia_hotmart VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_pagamentos_loja ON public.pagamentos(loja_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_referencia ON public.pagamentos(referencia_hotmart);
