-- Migration: tabela agentes (agentes extras configuráveis por usuário)
-- Cada agente extra tem função específica, número WhatsApp e prompt próprio.
-- Funções disponíveis: vendas, suporte, qualificacao, objecao, followup

CREATE TABLE IF NOT EXISTS public.agentes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            TEXT        NOT NULL DEFAULT '',
  funcao          TEXT        NOT NULL DEFAULT 'vendas'
                              CHECK (funcao IN ('vendas','suporte','qualificacao','objecao','followup')),
  evo_instance    TEXT        NOT NULL DEFAULT '',
  prompt_sistema  TEXT        NOT NULL DEFAULT '',
  ativo           BOOLEAN     NOT NULL DEFAULT true,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;

-- Usuário acessa apenas seus próprios agentes
CREATE POLICY "agentes_own" ON public.agentes
  FOR ALL USING (user_id = auth.uid());

-- Admin acessa todos
CREATE POLICY "agentes_admin" ON public.agentes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Índice para lookup por usuário
CREATE INDEX IF NOT EXISTS agentes_user_id_idx ON public.agentes (user_id);
