-- Fix lojas table schema for Hotmart webhook integration
-- - Make user_id nullable (webhook can create lojas without auth.users)
-- - Update RLS policies to allow NULL user_id
-- - Allow multiple users with same email/CPF

ALTER TABLE public.lojas 
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies
DROP POLICY IF EXISTS "lojas_own_select" ON public.lojas;
DROP POLICY IF EXISTS "lojas_own_insert" ON public.lojas;
DROP POLICY IF EXISTS "lojas_own_update" ON public.lojas;
DROP POLICY IF EXISTS "lojas_own_delete" ON public.lojas;

-- Re-create with NULL support
CREATE POLICY "lojas_own_select" ON public.lojas 
  FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "lojas_own_insert" ON public.lojas 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "lojas_own_update" ON public.lojas 
  FOR UPDATE USING (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "lojas_own_delete" ON public.lojas 
  FOR DELETE USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Enable RLS on pagamentos if not already enabled
ALTER TABLE IF EXISTS public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Policies for pagamentos
DROP POLICY IF EXISTS "pagamentos_own_select" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_own_insert" ON public.pagamentos;

CREATE POLICY "pagamentos_own_select" ON public.pagamentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lojas 
      WHERE lojas.id = pagamentos.loja_id
      AND (lojas.user_id = auth.uid() OR lojas.user_id IS NULL)
    )
  );

CREATE POLICY "pagamentos_own_insert" ON public.pagamentos
  FOR INSERT WITH CHECK (TRUE);
