-- ═══════════════════════════════════════════════════════════════
-- XPERT.IA — Tabelas de Monitoramento e Feedback (v2.1)
-- Supabase Project: vyvdrbkcrvklcaombjqu
-- Data: 2026-03-19
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. TABELA: workflow_executions
-- Rastreia cada execução do workflow (busca, processamento, resposta)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Identifica qual agente executou
  agent_type TEXT NOT NULL, -- 'principal', 'objecao', 'extra'
  agent_index INT DEFAULT 0, -- 0 para principal/objecao, 0+ para extras
  
  -- Performance
  duracao_ms INT NOT NULL, -- Tempo total de execução em ms
  timestamp_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  timestamp_fim TIMESTAMPTZ, -- Será preenchido ao finalizar
  status TEXT NOT NULL DEFAULT 'pendente', -- 'sucesso', 'erro', 'timeout', 'pendente'
  
  -- Tokens e Custo
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  tokens_total INT DEFAULT 0,
  custo_usd NUMERIC(10, 6) DEFAULT 0.000000,
  
  -- Contexto da Execução
  modelo_usado TEXT, -- 'gpt-4', 'gpt-3.5-turbo', 'claude-3', 'gemini-pro'
  prompt_usado TEXT, -- Salva o prompt que foi enviado ao LLM
  resposta_gerada TEXT, -- Resposta do LLM (truncada em 5000 chars se muito longa)
  numero_whatsapp TEXT,
  
  -- Erros
  erro_mensagem TEXT,
  erro_tipo TEXT, -- 'api_error', 'timeout', 'validation', 'n8n_error'
  
  -- Metadata
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_status CHECK (status IN ('sucesso', 'erro', 'timeout', 'pendente')),
  CONSTRAINT check_agent_type CHECK (agent_type IN ('principal', 'objecao', 'extra')),
  CONSTRAINT check_agent_index CHECK (agent_index >= 0),
  CONSTRAINT check_duracao CHECK (duracao_ms >= 0),
  CONSTRAINT check_tokens CHECK (tokens_total >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id 
  ON public.workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_lead_id 
  ON public.workflow_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_timestamp 
  ON public.workflow_executions(timestamp_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_agent 
  ON public.workflow_executions(user_id, agent_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status 
  ON public.workflow_executions(status);

-- RLS: Cada usuário vê apenas suas próprias execuções
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_executions_user_select" ON public.workflow_executions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workflow_executions_user_insert" ON public.workflow_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

---

-- ═══════════════════════════════════════════════════════════════
-- 2. TABELA: workflow_errors
-- Detalhes específicos de erros ocorridos em execuções
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.workflow_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  
  -- Classificação do Erro
  tipo_erro TEXT NOT NULL, -- 'api_error', 'timeout', 'validation', 'n8n_error', 'supabase_error'
  codigo_erro TEXT, -- Ex: 'OPENAI_429', 'TIMEOUT_30s', 'INVALID_JSON'
  mensagem TEXT NOT NULL, -- Mensagem de erro
  stack_trace TEXT, -- Stack trace completo se disponível
  
  -- Contexto
  numero_whatsapp TEXT,
  agente TEXT,
  
  -- Status
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvido BOOLEAN DEFAULT FALSE, -- Admin marca como resolvido após fix
  resolvido_em TIMESTAMPTZ,
  nota_resolucao TEXT,
  
  -- Constraints
  CONSTRAINT check_tipo_erro CHECK (tipo_erro IN ('api_error', 'timeout', 'validation', 'n8n_error', 'supabase_error'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflow_errors_user_id 
  ON public.workflow_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_errors_tipo 
  ON public.workflow_errors(tipo_erro);
CREATE INDEX IF NOT EXISTS idx_workflow_errors_resolvido 
  ON public.workflow_errors(resolvido);
CREATE INDEX IF NOT EXISTS idx_workflow_errors_timestamp 
  ON public.workflow_errors(criado_em DESC);

-- RLS
ALTER TABLE public.workflow_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_errors_user_select" ON public.workflow_errors
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workflow_errors_admin_all" ON public.workflow_errors
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

---

-- ═══════════════════════════════════════════════════════════════
-- 3. TABELA: lead_feedback
-- Feedback do usuário sobre leads (closed-loop para validação de IA)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lead_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Resultado Commercial
  vendido BOOLEAN, -- Lead virou cliente?
  motivo_desistencia TEXT, -- 'orcamento', 'timing', 'concorrencia', 'nao_qualificado', 'outro'
  valor_venda NUMERIC(12, 2), -- Quanto vendeu (se vendido=true)
  data_venda DATE, -- Quando fechou
  
  -- Feedback sobre o SDR
  nota_sdr INT CHECK (nota_sdr BETWEEN 1 AND 5), -- 1-5 stars
  comentario_sdr TEXT, -- Feedback livre sobre a performance do SDR
  
  -- Feedback sobre a IA
  prompt_foi_util BOOLEAN, -- O prompt customizado funcionou?
  sdr_foi_empatico BOOLEAN,
  sdr_foi_objetivo BOOLEAN,
  sdr_criou_engajamento BOOLEAN,
  
  -- Melhorias Sugeridas
  sugestoes TEXT, -- Recomendações do user para a IA
  
  -- Admin Review
  revisado_por_admin BOOLEAN DEFAULT FALSE,
  comentario_admin TEXT,
  
  -- Timestamps
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_nota_sdr CHECK (nota_sdr BETWEEN 1 AND 5),
  CONSTRAINT check_motivo_desistencia CHECK (
    motivo_desistencia IS NULL OR 
    motivo_desistencia IN ('orcamento', 'timing', 'concorrencia', 'nao_qualificado', 'outro')
  ),
  CONSTRAINT check_vendido_valor CHECK (
    (vendido = true AND valor_venda > 0) OR 
    (vendido = false AND valor_venda IS NULL) OR
    (vendido IS NULL)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lead_feedback_user_id 
  ON public.lead_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_feedback_lead_id 
  ON public.lead_feedback(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_feedback_vendido 
  ON public.lead_feedback(vendido);
CREATE INDEX IF NOT EXISTS idx_lead_feedback_timestamp 
  ON public.lead_feedback(criado_em DESC);

-- RLS
ALTER TABLE public.lead_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_feedback_user_crud" ON public.lead_feedback
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

---

-- ═══════════════════════════════════════════════════════════════
-- 4. VIEW: vw_workflow_stats_por_usuario
-- Resumo de performance do workflow por usuário
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vw_workflow_stats_por_usuario AS
SELECT 
  user_id,
  COUNT(*) as total_execucoes,
  SUM(CASE WHEN status = 'sucesso' THEN 1 ELSE 0 END) as execucoes_sucesso,
  SUM(CASE WHEN status = 'erro' THEN 1 ELSE 0 END) as execucoes_erro,
  SUM(CASE WHEN status = 'timeout' THEN 1 ELSE 0 END) as execucoes_timeout,
  ROUND(AVG(duracao_ms)::NUMERIC, 2) as duracao_media_ms,
  MAX(duracao_ms) as duracao_maxima_ms,
  SUM(tokens_total) as tokens_totais_consumidos,
  ROUND(SUM(custo_usd)::NUMERIC, 6) as custo_total_usd,
  COUNT(DISTINCT lead_id) as leads_processados,
  ROUND(
    (SUM(CASE WHEN status = 'sucesso' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100),
    2
  ) as taxa_sucesso_percent,
  CURRENT_TIMESTAMP as atualizado_em
FROM public.workflow_executions
GROUP BY user_id;

---

-- ═══════════════════════════════════════════════════════════════
-- 5. VIEW: vw_lead_feedback_stats
-- Resumo de feedback e win rate por usuário
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vw_lead_feedback_stats AS
SELECT 
  user_id,
  COUNT(*) as feedback_coletado,
  SUM(CASE WHEN vendido = true THEN 1 ELSE 0 END) as leads_vendidos,
  SUM(CASE WHEN vendido = false THEN 1 ELSE 0 END) as leads_desistencia,
  ROUND(
    (SUM(CASE WHEN vendido = true THEN 1 ELSE 0 END)::NUMERIC / 
     NULLIF(COUNT(*), 0) * 100),
    2
  ) as win_rate_percent,
  ROUND(AVG(nota_sdr)::NUMERIC, 1) as nota_media_sdr,
  SUM(CASE WHEN prompt_foi_util = true THEN 1 ELSE 0 END) as prompts_uteis,
  COALESCE(SUM(valor_venda), 0) as revenue_total,
  MAX(criado_em) as ultimo_feedback
FROM public.lead_feedback
GROUP BY user_id;

---

-- ═══════════════════════════════════════════════════════════════
-- 6. GRANTS e PERMISSIONS
-- ═══════════════════════════════════════════════════════════════

-- Dar permissões ao anon (usuários logados)
GRANT SELECT, INSERT, UPDATE ON public.workflow_executions TO anon;
GRANT SELECT, INSERT ON public.workflow_errors TO anon;
GRANT SELECT, INSERT, UPDATE ON public.lead_feedback TO anon;
GRANT SELECT ON public.vw_workflow_stats_por_usuario TO anon;
GRANT SELECT ON public.vw_lead_feedback_stats TO anon;

-- Dar permissões ao authenticated
GRANT SELECT, INSERT, UPDATE ON public.workflow_executions TO authenticated;
GRANT SELECT, INSERT ON public.workflow_errors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lead_feedback TO authenticated;
GRANT SELECT ON public.vw_workflow_stats_por_usuario TO authenticated;
GRANT SELECT ON public.vw_lead_feedback_stats TO authenticated;

---

-- ═══════════════════════════════════════════════════════════════
-- COMENTÁRIOS (Documentação)
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE public.workflow_executions IS 
  'Rastreia cada execução do workflow N8N com performance, tokens e resultado';
  
COMMENT ON TABLE public.workflow_errors IS 
  'Detalhes específicos de erros ocorridos durante execuções do workflow';
  
COMMENT ON TABLE public.lead_feedback IS 
  'Feedback dos usuários sobre leads para validação e melhoria da IA (closed-loop)';

COMMENT ON VIEW public.vw_workflow_stats_por_usuario IS 
  'Resumo agregado de performance do workflow por usuário (útil para dashboard)';
  
COMMENT ON VIEW public.vw_lead_feedback_stats IS 
  'Estatísticas de feedback e win rate por usuário';
