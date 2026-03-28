-- Final fix for Hotmart integration - ensure all columns exist
-- This handles cases where migrations may not have applied correctly

-- Step 1: Add user_id if it doesn't exist (make it nullable)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lojas' AND column_name='user_id') THEN
    ALTER TABLE public.lojas ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  ELSE
    -- Make it nullable if it exists
    BEGIN
      ALTER TABLE public.lojas ALTER COLUMN user_id DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignore if already nullable
    END;
  END IF;
END $$;

-- Step 2: Add all Hotmart columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lojas' AND column_name='login_usuario') THEN
    ALTER TABLE public.lojas ADD COLUMN login_usuario VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lojas' AND column_name='senha_usuario') THEN
    ALTER TABLE public.lojas ADD COLUMN senha_usuario VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lojas' AND column_name='plano') THEN
    ALTER TABLE public.lojas ADD COLUMN plano VARCHAR(50) DEFAULT 'premium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lojas' AND column_name='data_expiracao') THEN
    ALTER TABLE public.lojas ADD COLUMN data_expiracao TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lojas' AND column_name='ativo') THEN
    ALTER TABLE public.lojas ADD COLUMN ativo BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lojas' AND column_name='hotmart_product_id') THEN
    ALTER TABLE public.lojas ADD COLUMN hotmart_product_id VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lojas' AND column_name='nome_usuario') THEN
    ALTER TABLE public.lojas ADD COLUMN nome_usuario VARCHAR(255);
  END IF;
END $$;

-- Step 3: Create pagamentos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  valor TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  metodo VARCHAR(50),
  referencia_hotmart VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_lojas_ativo ON public.lojas(ativo);
CREATE INDEX IF NOT EXISTS idx_lojas_login ON public.lojas(login_usuario);
CREATE INDEX IF NOT EXISTS idx_lojas_expiracao ON public.lojas(data_expiracao);
CREATE INDEX IF NOT EXISTS idx_pagamentos_loja ON public.pagamentos(loja_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_referencia ON public.pagamentos(referencia_hotmart);

-- Step 5: Update RLS policies
DROP POLICY IF EXISTS "lojas_own_select" ON public.lojas;
DROP POLICY IF EXISTS "lojas_own_insert" ON public.lojas;
DROP POLICY IF EXISTS "lojas_own_update" ON public.lojas;
DROP POLICY IF EXISTS "lojas_own_delete" ON public.lojas;

CREATE POLICY "lojas_own_select" ON public.lojas FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "lojas_own_insert" ON public.lojas FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "lojas_own_update" ON public.lojas FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "lojas_own_delete" ON public.lojas FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pagamentos_own_select" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_own_insert" ON public.pagamentos;

CREATE POLICY "pagamentos_own_select" ON public.pagamentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lojas 
      WHERE lojas.id = pagamentos.loja_id
      AND (lojas.user_id = auth.uid() OR lojas.user_id IS NULL)
    )
  );

CREATE POLICY "pagamentos_own_insert" ON public.pagamentos FOR INSERT
  WITH CHECK (TRUE);
