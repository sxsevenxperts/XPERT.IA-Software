-- ═══════════════════════════════════════════════════════════════
-- XPERT.IA — Schema Completo
-- Painel CRM com integração Hotmart para Addons
-- ═══════════════════════════════════════════════════════════════

-- ═══ TABELA: assinaturas ═══
-- Assinaturas de clientes com campos de addons
CREATE TABLE IF NOT EXISTS public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT DEFAULT 'professional', -- 'starter' | 'professional' | 'enterprise'
  status TEXT DEFAULT 'ativo', -- 'ativo' | 'cancelado' | 'expirado'
  
  -- Addon fields
  addon_objecao BOOLEAN DEFAULT false,
  agentes_extras INT DEFAULT 0,
  numeros_extras INT DEFAULT 0,
  usuarios_extras_limite INT DEFAULT 0,
  
  -- Token quota
  tokens_balance INT DEFAULT 0,
  
  -- Hotmart integration
  hotmart_transaction TEXT,
  hotmart_customer_id TEXT,
  
  -- Dates
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_vencimento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assinaturas_own" ON public.assinaturas;
DROP POLICY IF EXISTS "assinaturas_admin" ON public.assinaturas;
CREATE POLICY "assinaturas_own" ON public.assinaturas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assinaturas_admin" ON public.assinaturas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE INDEX IF NOT EXISTS idx_assinaturas_user ON public.assinaturas(user_id);

-- ═══ TABELA: fluxos ═══
-- Funnels/fluxos de automação para CRM
CREATE TABLE IF NOT EXISTS public.fluxos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'ativo', -- 'ativo' | 'pausado' | 'arquivado'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fluxos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fluxos_own" ON public.fluxos;
CREATE POLICY "fluxos_own" ON public.fluxos FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_fluxos_user ON public.fluxos(user_id);

-- ═══ TABELA: leads ═══
-- Leads/contatos para o CRM
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fluxo_id UUID REFERENCES public.fluxos(id) ON DELETE SET NULL,
  
  -- Contact info
  nome TEXT NOT NULL,
  celular TEXT,
  email TEXT,
  
  -- Lead data
  tese TEXT, -- Produto/serviço de interesse
  assunto TEXT, -- Pendência/motivo
  data_aniversario DATE,
  
  -- CRM stage
  stage TEXT DEFAULT 'novo_contato', -- 'novo_contato' | 'em_atendimento' | 'qualificado' | 'nao_qualificado' | 'convertido' | 'perdido'
  
  -- Lead scoring
  score_num INT DEFAULT 0,
  score_label TEXT DEFAULT 'cold', -- 'cold' | 'warm' | 'hot'
  
  -- Notes
  notas TEXT,
  resumo TEXT, -- Resumo de triagem do agente
  
  -- Metadata
  numero_whatsapp TEXT, -- Número WhatsApp conectado
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_own" ON public.leads;
CREATE POLICY "leads_own" ON public.leads FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_fluxo ON public.leads(fluxo_id);

-- ═══ TABELA: lead_tarefas ═══
-- Tasks/tarefas associadas aos leads
CREATE TABLE IF NOT EXISTS public.lead_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Task info
  descricao TEXT NOT NULL,
  concluida BOOLEAN DEFAULT false,
  
  -- Due date
  data_vencimento DATE,
  
  -- Assignment
  atribuido_para TEXT, -- Identificador do usuário/agente (email ou ID)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lead_tarefas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_tarefas_own" ON public.lead_tarefas;
CREATE POLICY "lead_tarefas_own" ON public.lead_tarefas FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_lead_tarefas_lead ON public.lead_tarefas(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tarefas_user ON public.lead_tarefas(user_id);

-- ═══ TABELA: addon_purchases ═══
-- Histórico de compras de addons via Hotmart
CREATE TABLE IF NOT EXISTS public.addon_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Addon info
  offer_code TEXT NOT NULL, -- Ex: 'tokens_mini', 'addon_objecao', 'addon_agente'
  addon_type TEXT NOT NULL, -- 'tokens' | 'objecao' | 'agente' | 'numero' | 'usuario'
  quantidade INT DEFAULT 1,
  
  -- Value
  valor NUMERIC(10,2),
  
  -- Hotmart integration
  hotmart_transaction TEXT,
  hotmart_product_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'ativo', -- 'ativo' | 'cancelado' | 'reembolsado'
  
  -- Metadata
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addon_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "addon_purchases_own" ON public.addon_purchases;
DROP POLICY IF EXISTS "addon_purchases_admin" ON public.addon_purchases;
CREATE POLICY "addon_purchases_own" ON public.addon_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "addon_purchases_admin" ON public.addon_purchases FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE INDEX IF NOT EXISTS idx_addon_purchases_user ON public.addon_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_addon_purchases_hotmart ON public.addon_purchases(hotmart_transaction);

-- ═══ TABELA: agente_config ═══
-- Configurações globais do agente (key-value store)
CREATE TABLE IF NOT EXISTS public.agente_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  valor TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chave)
);

ALTER TABLE public.agente_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agente_config_own" ON public.agente_config;
CREATE POLICY "agente_config_own" ON public.agente_config FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_agente_config_user ON public.agente_config(user_id);
CREATE INDEX IF NOT EXISTS idx_agente_config_key ON public.agente_config(user_id, chave);

-- ═══ TABELA: profiles ═══
-- Usuários e permissões (se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user' | 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_public" ON public.profiles FOR SELECT USING (true);

-- ═══ RPC: incrementar_tokens ═══
CREATE OR REPLACE FUNCTION incrementar_tokens(uid UUID, qtd INT)
RETURNS void AS $$
BEGIN
  UPDATE public.assinaturas
  SET tokens_balance = tokens_balance + qtd,
      updated_at = NOW()
  WHERE user_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ RPC: incrementar_addon ═══
CREATE OR REPLACE FUNCTION incrementar_addon(uid UUID, coluna TEXT, qtd INT)
RETURNS void AS $$
BEGIN
  CASE coluna
    WHEN 'agentes_extras' THEN
      UPDATE public.assinaturas SET agentes_extras = agentes_extras + qtd, updated_at = NOW() WHERE user_id = uid;
    WHEN 'numeros_extras' THEN
      UPDATE public.assinaturas SET numeros_extras = numeros_extras + qtd, updated_at = NOW() WHERE user_id = uid;
    WHEN 'usuarios_extras_limite' THEN
      UPDATE public.assinaturas SET usuarios_extras_limite = usuarios_extras_limite + qtd, updated_at = NOW() WHERE user_id = uid;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
