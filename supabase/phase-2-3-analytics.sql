-- ============================================================================
-- XPERT.IA Phase 2 & 3 Analytics Views (Feedback + AI Insights)
-- ============================================================================

-- View 1: Feedback por Agente (Performance, Conversão, Receita)
CREATE OR REPLACE VIEW vw_feedback_por_agente AS
SELECT
  lf.user_id,
  COALESCE(we.agent_type, 'principal') as agent_type,
  COUNT(DISTINCT lf.lead_id) as total_leads,
  SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END) as leads_vendidos,
  SUM(CASE WHEN lf.vendido = FALSE THEN 1 ELSE 0 END) as leads_desistencia,
  ROUND((SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as taxa_conversao_percent,
  COALESCE(SUM(lf.valor_venda), 0) as receita_total,
  ROUND(AVG(CASE WHEN lf.nota_sdr IS NOT NULL THEN lf.nota_sdr END)::NUMERIC, 2) as nota_media_sdr,
  SUM(CASE WHEN lf.sdr_foi_empatico = TRUE THEN 1 ELSE 0 END) as sdr_empatico_count,
  SUM(CASE WHEN lf.sdr_criou_engajamento = TRUE THEN 1 ELSE 0 END) as engajamento_count,
  SUM(CASE WHEN lf.prompt_foi_util = TRUE THEN 1 ELSE 0 END) as prompts_uteis_count
FROM lead_feedback lf
LEFT JOIN workflow_executions we ON lf.lead_id = we.lead_id AND lf.user_id = we.user_id
GROUP BY lf.user_id, we.agent_type;

-- View 2: Receita e Taxa de Conversão por Período (Timeline)
CREATE OR REPLACE VIEW vw_receita_timeline AS
SELECT
  lf.user_id,
  DATE_TRUNC('day', lf.criado_em) as data,
  COUNT(DISTINCT lf.lead_id) as total_leads,
  SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END) as leads_vendidos,
  ROUND((SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as taxa_venda_dia,
  COALESCE(SUM(lf.valor_venda), 0) as receita_dia
FROM lead_feedback lf
GROUP BY lf.user_id, DATE_TRUNC('day', lf.criado_em)
ORDER BY data DESC;

-- View 3: Análise de Motivos de Desistência
CREATE OR REPLACE VIEW vw_motivos_desistencia AS
SELECT
  lf.user_id,
  lf.motivo_desistencia,
  COUNT(*) as total,
  ROUND((COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM lead_feedback WHERE vendido = FALSE AND user_id = lf.user_id), 0)) * 100, 2) as percentual
FROM lead_feedback lf
WHERE lf.vendido = FALSE AND lf.motivo_desistencia IS NOT NULL
GROUP BY lf.user_id, lf.motivo_desistencia
ORDER BY total DESC;

-- View 4: Efetividade da IA (Prompt útil, Empatia, Engajamento)
CREATE OR REPLACE VIEW vw_efetividade_ia AS
SELECT
  lf.user_id,
  COUNT(*) as total_feedbacks,
  SUM(CASE WHEN lf.prompt_foi_util = TRUE THEN 1 ELSE 0 END) as prompts_uteis,
  SUM(CASE WHEN lf.sdr_foi_empatico = TRUE THEN 1 ELSE 0 END) as empatia_count,
  SUM(CASE WHEN lf.sdr_foi_objetivo = TRUE THEN 1 ELSE 0 END) as objetivo_count,
  SUM(CASE WHEN lf.sdr_criou_engajamento = TRUE THEN 1 ELSE 0 END) as engajamento_count,
  ROUND((SUM(CASE WHEN lf.prompt_foi_util = TRUE THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as prompts_uteis_percent,
  ROUND((SUM(CASE WHEN lf.sdr_foi_empatico = TRUE THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as empatia_percent,
  ROUND(AVG(CASE WHEN lf.nota_sdr IS NOT NULL THEN lf.nota_sdr END)::NUMERIC, 2) as nota_media_sdr
FROM lead_feedback lf
GROUP BY lf.user_id;

-- View 5: Satisfação SDR - Distribuição de Notas
CREATE OR REPLACE VIEW vw_distribuicao_notas_sdr AS
SELECT
  lf.user_id,
  lf.nota_sdr,
  COUNT(*) as total_feedbacks,
  ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM lead_feedback WHERE user_id = lf.user_id AND nota_sdr IS NOT NULL)) * 100, 2) as percentual
FROM lead_feedback lf
WHERE lf.nota_sdr IS NOT NULL
GROUP BY lf.user_id, lf.nota_sdr
ORDER BY lf.nota_sdr DESC;

-- View 6: Performance por Agent Type + Feedback (Combined)
CREATE OR REPLACE VIEW vw_agent_performance_combined AS
SELECT
  we.user_id,
  we.agent_type,
  COUNT(DISTINCT we.id) as total_execucoes,
  COUNT(DISTINCT CASE WHEN we.status = 'sucesso' THEN we.id END) as sucesso_count,
  ROUND((COUNT(DISTINCT CASE WHEN we.status = 'sucesso' THEN we.id END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as taxa_sucesso_exec,
  COUNT(DISTINCT CASE WHEN we.status = 'erro' THEN we.id END) as erro_count,
  ROUND(AVG(we.duracao_ms)::NUMERIC, 2) as duracao_media_ms,
  SUM(we.tokens_total) as tokens_totais,
  ROUND(SUM(we.custo_usd)::NUMERIC, 6) as custo_total_usd,
  COUNT(DISTINCT lf.lead_id) as feedback_leads,
  SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END) as leads_vendidos_feedback,
  ROUND((SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(DISTINCT lf.lead_id), 0)) * 100, 2) as taxa_conversao_feedback,
  COALESCE(SUM(lf.valor_venda), 0) as receita_total,
  ROUND(AVG(lf.nota_sdr)::NUMERIC, 2) as nota_media_sdr
FROM workflow_executions we
LEFT JOIN lead_feedback lf ON we.lead_id = lf.lead_id AND we.user_id = lf.user_id
GROUP BY we.user_id, we.agent_type
ORDER BY we.user_id, we.agent_type;

-- View 7: Histórico de 7 Dias (para Alertas de Queda de Performance)
CREATE OR REPLACE VIEW vw_performance_7dias AS
SELECT
  we.user_id,
  COUNT(DISTINCT we.id) as total_execucoes_7d,
  COUNT(DISTINCT CASE WHEN we.status = 'sucesso' THEN we.id END) as sucesso_7d,
  ROUND((COUNT(DISTINCT CASE WHEN we.status = 'sucesso' THEN we.id END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as taxa_sucesso_7d,
  SUM(CASE WHEN we.status = 'erro' THEN 1 ELSE 0 END) as erro_count_7d,
  SUM(CASE WHEN we.status = 'timeout' THEN 1 ELSE 0 END) as timeout_count_7d,
  COUNT(DISTINCT lf.lead_id) as feedback_leads_7d,
  SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END) as leads_vendidos_7d,
  ROUND((SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(DISTINCT lf.lead_id), 0)) * 100, 2) as taxa_conversao_7d,
  COALESCE(SUM(lf.valor_venda), 0) as receita_7d
FROM workflow_executions we
LEFT JOIN lead_feedback lf ON we.lead_id = lf.lead_id AND we.user_id = lf.user_id
WHERE we.timestamp_inicio >= NOW() - INTERVAL '7 days'
GROUP BY we.user_id;

-- View 8: Comparação Período Anterior (para Detectar Queda)
CREATE OR REPLACE VIEW vw_performance_periodo_anterior AS
SELECT
  we.user_id,
  COUNT(DISTINCT we.id) as total_execucoes_anterior,
  ROUND((COUNT(DISTINCT CASE WHEN we.status = 'sucesso' THEN we.id END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as taxa_sucesso_anterior,
  ROUND(SUM(we.custo_usd)::NUMERIC, 6) as custo_anterior,
  ROUND((SUM(CASE WHEN lf.vendido = TRUE THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(DISTINCT lf.lead_id), 0)) * 100, 2) as taxa_conversao_anterior
FROM workflow_executions we
LEFT JOIN lead_feedback lf ON we.lead_id = lf.lead_id AND we.user_id = lf.user_id
WHERE we.timestamp_inicio >= NOW() - INTERVAL '14 days'
  AND we.timestamp_inicio < NOW() - INTERVAL '7 days'
GROUP BY we.user_id;

-- ============================================================================
-- Indexes para Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_feedback_vendido ON lead_feedback(vendido);
CREATE INDEX IF NOT EXISTS idx_feedback_criado ON lead_feedback(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_nota ON lead_feedback(nota_sdr);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_timestamp_user ON workflow_executions(user_id, timestamp_inicio DESC);

-- ============================================================================
-- Função para Cálculo de Score de Conversão (Phase 3)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_conversion_score(
  p_lead_id UUID,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_score NUMERIC := 0;
  v_feedback RECORD;
  v_agent_stats RECORD;
  v_execution_stats RECORD;
  v_result JSONB;
BEGIN
  -- Buscar feedback do lead
  SELECT * INTO v_feedback FROM lead_feedback
  WHERE lead_id = p_lead_id AND user_id = p_user_id LIMIT 1;

  -- Buscar estatísticas do agente
  SELECT * INTO v_agent_stats FROM vw_feedback_por_agente
  WHERE user_id = p_user_id LIMIT 1;

  -- Buscar estatísticas de execução
  SELECT we.* INTO v_execution_stats FROM workflow_executions we
  WHERE we.lead_id = p_lead_id AND we.user_id = p_user_id
  ORDER BY we.timestamp_inicio DESC LIMIT 1;

  -- Scoring Algorithm
  v_score := 50; -- baseline

  -- Fatores Positivos
  IF v_feedback.prompt_foi_util = TRUE THEN v_score := v_score + 20; END IF;
  IF v_feedback.sdr_foi_empatico = TRUE THEN v_score := v_score + 15; END IF;
  IF v_feedback.sdr_criou_engajamento = TRUE THEN v_score := v_score + 25; END IF;

  -- Histórico do Agente
  IF v_agent_stats.taxa_conversao_percent > 60 THEN v_score := v_score + 20; END IF;
  IF v_agent_stats.nota_media_sdr >= 4.0 THEN v_score := v_score + 15; END IF;

  -- Execução
  IF v_execution_stats.status = 'sucesso' THEN v_score := v_score + 10; END IF;
  IF v_execution_stats.duracao_ms < 2000 THEN v_score := v_score + 5; END IF;

  -- Normalizar para 0-100
  v_score := LEAST(GREATEST(v_score, 0), 100);

  -- Converter para probability (0-1)
  RETURN jsonb_build_object(
    'score', v_score,
    'probability', v_score / 100.0,
    'confidence', LEAST((v_agent_stats.total_leads / 10.0), 1.0),
    'factors_positive', jsonb_build_array(
      CASE WHEN v_feedback.prompt_foi_util = TRUE THEN 'prompt_util' ELSE NULL END,
      CASE WHEN v_feedback.sdr_foi_empatico = TRUE THEN 'empatia' ELSE NULL END,
      CASE WHEN v_feedback.sdr_criou_engajamento = TRUE THEN 'engajamento' ELSE NULL END
    ),
    'agent_type', v_execution_stats.agent_type
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Versão: 1.0
-- Data: 2026-03-19
-- Status: ✅ Pronto para Deployment
-- ============================================================================
