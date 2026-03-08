-- RPC pública: verifica se um e-mail tem assinatura ativa
-- Usada na tela de recuperação de senha para permitir reset
-- apenas a clientes com acesso ativo.
CREATE OR REPLACE FUNCTION public.verificar_assinatura_ativa(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assinaturas a
    JOIN auth.users u ON u.id = a.user_id
    WHERE lower(u.email) = lower(p_email)
      AND a.active = true
  );
$$;

-- Permite chamada anônima (sem autenticação)
GRANT EXECUTE ON FUNCTION public.verificar_assinatura_ativa(text) TO anon, authenticated;
