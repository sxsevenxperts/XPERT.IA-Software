-- ============================================================================
-- XPERT.IA Monitoring Tables (Fase 1 & 2)
-- ============================================================================

-- Tabela 1: Execuções do Workflow (Performance + Tokens)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  agent_type TEXT NOT NULL, -- 'principal', 'objecao', 'extra'
  agent_index INT DEFAULT 0,
  
  -- Performance
  duracao_ms INT,
  timestamp_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  timestamp_fim TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'sucesso', 'erro', 'timeout', 'pendente'
  
  -- Tokens & Custo
  tokens_input INT,
  tokens_output INT,
  tokens_total INT,
  custo_usd DECIMAL(10,6),
  
  -- Contexto
  modelo_usado TEXT, -- 'gpt-4', 'gpt-3.5-turbo', 'claude-3', etc
  prompt_usado TEXT,
  resposta_gerada TEXT,
  numero_whatsapp TEXT,
  erro_mensagem TEXT,
  erro_tipo TEXT,
  
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_status CHECK (status IN ('sucesso', 'erro', 'timeout', 'pendente'))
);

CREATE INDEX IF NOT EXISTS idx_workflow_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_lead_id ON workflow_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_workflow_timestamp ON workflow_executions(timestamp_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_agent ON workflow_executions(user_id, agent_type);
CREATE INDEX IF NOT EXISTS idx_workflow_status ON workflow_executions(status);

-- RLS para workflow_executions
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own executions"
  ON workflow_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert executions"
  ON workflow_executions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own executions"
  ON workflow_executions FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabela 2: Erros do Workflow (Detailed Error Tracking)
CREATE TABLE IF NOT EXISTS workflow_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
  
  tipo_erro TEXT NOT NULL, -- 'api_error', 'timeout', 'validation', 'n8n_error', 'supabase_error'
  codigo_erro TEXT,
  mensagem TEXT NOT NULL,
  stack_trace TEXT,
  numero_whatsapp TEXT,
  agente TEXT,
  
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvido BOOLEAN DEFAULT FALSE,
  resolvido_em TIMESTAMPTZ,
  nota_resolucao TEXT,
  
  CONSTRAINT check_tipo CHECK (tipo_erro IN ('api_error', 'timeout', 'validation', 'n8n_error', 'supabase_error'))
);

CREATE INDEX IF NOT EXISTS idx_errors_user ON workflow_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_errors_type ON workflow_errors(tipo_erro);
CREATE INDEX IF NOT EXISTS idx_errors_resolved ON workflow_errors(resolvido);

-- RLS para workflow_errors
ALTER TABLE workflow_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own errors"
  ON workflow_errors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert errors"
  ON workflow_errors FOR INSERT
  WITH CHECK (true);

-- Tabela 3: Feedback de Leads (Closed-Loop)
CREATE TABLE IF NOT EXISTS lead_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Resultado da Venda
  vendido BOOLEAN,
  motivo_desistencia TEXT, -- Se vendido=false: 'orçamento', 'timing', 'concorrência', 'outro'
  valor_venda DECIMAL(12,2),
  data_venda DATE,
  
  -- Qualidade do SDR
  nota_sdr INT CHECK (nota_sdr BETWEEN 1 AND 5),
  comentario_sdr TEXT,
  
  -- Feedback da IA
  prompt_foi_util BOOLEAN,
  sdr_foi_empatico BOOLEAN,
  sdr_foi_objetivo BOOLEAN,
  sdr_criou_engajamento BOOLEAN,
  sugestoes TEXT,
  
  -- Admin
  revisado_por_admin BOOLEAN DEFAULT FALSE,
  comentario_admin TEXT,
  
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, lead_id) -- Um feedback por lead, por usuário
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON lead_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_lead ON lead_feedback(lead_id);
CREATE INDEX IF NOT EXISTS idx_feedback_vendido ON lead_feedback(vendido);

-- RLS para lead_feedback
ALTER TABLE lead_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON lead_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON lead_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON lead_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Views para Análise e Dashboard
-- ============================================================================

-- View 1: Estatísticas de Workflow por Usuário
CREATE OR REPLACE VIEW vw_workflow_stats_por_usuario AS
SELECT
  we.user_id,
  COUNT(*) as total_execucoes,
  SUM(CASE WHEN we.status = 'sucesso' THEN 1 ELSE 0 END) as execucoes_sucesso,
  SUM(CASE WHEN we.status = 'erro' THEN 1 ELSE 0 END) as execucoes_erro,
  SUM(CASE WHEN we.status = 'timeout' THEN 1 ELSE 0 END) as execucoes_timeout,
  ROUND(AVG(we.duracao_ms)::NUMERIC, 2) as duracao_media_ms,
  MAX(we.duracao_ms) as duracao_maxima_ms,
  SUM(we.tokens_total) as tokens_totais,
  ROUND(SUM(we.custo_usd)::NUMERIC, 6) as custo_total_usd,
  COUNT(DISTINCT we.lead_id) as leads_processados,
  ROUND((SUM(CASE WHEN we.status = 'sucesso' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as taxa_sucesso_percent,
  DATE_TRUNC('month', NOW()) as periodo
FROM workflow_executions we
GROUP BY we.user_id;

-- View 2: Estatísticas por Tipo de Agente
CREATE OR REPLACE VIEW vw_workflow_stats_por_agente AS
SELECT
  we.user_id,
  we.agent_type,
  COUNT(*) as total_execucoes,
  SUM(CASE WHEN we.status = 'sucesso' THEN 1 ELSE 0 END) as execucoes_sucesso,
  SUM(CASE WHEN we.status = 'erro' THEN 1 ELSE 0 END) as execucoes_erro,
  ROUND(AVG(we.duracao_ms)::NUMERIC, 2) as duracao_media_ms,
  SUM(we.tokens_total) as tokens_totais,
  ROUND(SUM(we.custo_usd)::NUMERIC, 6) as custo_total_usd,
  ROUND((SUM(CASE WHEN we.status = 'sucesso' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as taxa_sucesso_percent
FROM workflow_executions we
GROUP BY we.user_id, we.agent_type
ORDER BY we.user_id, we.agent_type;

-- View 3: Feedback de Leads - Estatísticas
CREATE OR REPLACE VIEW vw_lead_feedback_stats AS
SELECT
  lf.user_id,
  COUNT(*) as total_feedbacks,
  SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END) as leads_vendidos,
  SUM(CASE WHEN lf.vendido = FALSE THEN 1 ELSE 0 END) as leads_desistencia,
  ROUND((SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as taxa_venda_percent,
  ROUND(AVG(lf.nota_sdr)::NUMERIC, 2) as nota_media_sdr,
  SUM(CASE WHEN lf.prompt_foi_util = TRUE THEN 1 ELSE 0 END) as prompts_uteis,
  COALESCE(SUM(lf.valor_venda), 0) as receita_total
FROM lead_feedback lf
GROUP BY lf.user_id;

-- View 4: Execuções por Hora (para Gráfico de Performance)
CREATE OR REPLACE VIEW vw_workflow_por_hora AS
SELECT
  user_id,
  DATE_TRUNC('hour', timestamp_inicio) as hora,
  COUNT(*) as total_execucoes,
  SUM(CASE WHEN status = 'sucesso' THEN 1 ELSE 0 END) as sucesso,
  SUM(CASE WHEN status = 'erro' THEN 1 ELSE 0 END) as erro,
  ROUND(AVG(duracao_ms)::NUMERIC, 2) as duracao_media_ms,
  SUM(tokens_total) as tokens_hora
FROM workflow_executions
GROUP BY user_id, DATE_TRUNC('hour', timestamp_inicio)
ORDER BY hora DESC;

-- View 5: Taxa de Erro por Agente (para Gráfico)
CREATE OR REPLACE VIEW vw_taxa_erro_por_agente AS
SELECT
  we.user_id,
  we.agent_type,
  COUNT(*) as total_execucoes,
  SUM(CASE WHEN we.status = 'erro' THEN 1 ELSE 0 END) as total_erros,
  ROUND((SUM(CASE WHEN we.status = 'erro' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 2) as taxa_erro_percent
FROM workflow_executions we
GROUP BY we.user_id, we.agent_type
ORDER BY we.user_id, taxa_erro_percent DESC;