-- ===== ANALYTICS & PREDICTIVE MODELS =====
-- Feature 14: Analytics & Previsões (Phase 5)
-- Machine learning predictions for revenue forecasting and workload planning

-- Table: revenue_actuals
-- Historical revenue data for training and comparison
CREATE TABLE revenue_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_ano DATE NOT NULL, -- First day of month for grouping
  receita_realizada DECIMAL(12, 2) NOT NULL,
  cases_fechados INT DEFAULT 0,
  cases_em_andamento INT DEFAULT 0,
  area_pratica TEXT, -- Filter by practice area
  detalhes JSONB, -- Additional metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes_ano)
);

-- RLS Policy for revenue_actuals
ALTER TABLE revenue_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_actuals_user_isolation ON revenue_actuals
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_revenue_actuals_user_id ON revenue_actuals(user_id);
CREATE INDEX idx_revenue_actuals_mes_ano ON revenue_actuals(mes_ano DESC);

-- Table: revenue_predictions
-- ML-generated revenue forecasts
CREATE TABLE revenue_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Forecast data
  mes_ano_previsto DATE NOT NULL, -- Month being forecast
  receita_prevista DECIMAL(12, 2) NOT NULL,
  intervalo_confianca_inferior DECIMAL(12, 2),
  intervalo_confianca_superior DECIMAL(12, 2),
  confianca_percentual INT, -- 0-100
  
  -- Metadata
  modelo_versao TEXT, -- Model version for tracking updates
  fatores_principais TEXT[], -- Key drivers (e.g., 'seasonal', 'growth', 'decline')
  accuracy_metricas JSONB, -- MAE, RMSE, R² from last training
  
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes_ano_previsto)
);

-- RLS Policy for revenue_predictions
ALTER TABLE revenue_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY revenue_predictions_user_isolation ON revenue_predictions
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_revenue_predictions_user_id ON revenue_predictions(user_id);
CREATE INDEX idx_revenue_predictions_mes_ano_previsto ON revenue_predictions(mes_ano_previsto);

-- Table: workload_actuals
-- Historical workload data (cases, hours, volume)
CREATE TABLE workload_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_ano DATE NOT NULL,
  
  -- Workload metrics
  casos_abertos INT DEFAULT 0,
  casos_fechados INT DEFAULT 0,
  casos_total INT DEFAULT 0,
  horas_trabalhadas INT DEFAULT 0, -- Total billable hours
  media_horas_por_caso DECIMAL(8, 2),
  
  -- Load indicators
  carga_alta_prioridade INT DEFAULT 0,
  carga_media_prioridade INT DEFAULT 0,
  carga_baixa_prioridade INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes_ano)
);

-- RLS Policy for workload_actuals
ALTER TABLE workload_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY workload_actuals_user_isolation ON workload_actuals
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_workload_actuals_user_id ON workload_actuals(user_id);
CREATE INDEX idx_workload_actuals_mes_ano ON workload_actuals(mes_ano DESC);

-- Table: workload_predictions
-- ML-generated workload forecasts
CREATE TABLE workload_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_ano_previsto DATE NOT NULL,
  
  -- Forecast data
  casos_esperados INT,
  horas_estimadas INT,
  carga_estimada TEXT, -- 'baixa', 'media', 'alta', 'critica'
  probabilidade_overload DECIMAL(3, 2), -- 0.00-1.00
  recomendacoes TEXT[], -- Staffing recommendations
  
  -- Confidence
  confianca_percentual INT,
  modelo_versao TEXT,
  
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mes_ano_previsto)
);

-- RLS Policy for workload_predictions
ALTER TABLE workload_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY workload_predictions_user_isolation ON workload_predictions
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_workload_predictions_user_id ON workload_predictions(user_id);
CREATE INDEX idx_workload_predictions_mes_ano_previsto ON workload_predictions(mes_ano_previsto);

-- Table: analytics_dashboard
-- Aggregated metrics and KPIs for dashboard
CREATE TABLE analytics_dashboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Revenue KPIs
  receita_mes_atual DECIMAL(12, 2) DEFAULT 0,
  receita_mes_anterior DECIMAL(12, 2) DEFAULT 0,
  receita_yoy_percentual DECIMAL(5, 2), -- Year-over-year growth %
  meta_anual DECIMAL(12, 2),
  progresso_meta_percentual DECIMAL(5, 2),
  
  -- Case KPIs
  taxa_sucesso DECIMAL(5, 2), -- % of won cases
  tempo_medio_resolucao INT, -- days
  casos_ganhos_mes INT,
  casos_perdidos_mes INT,
  
  -- Trends
  tendencia_receita TEXT, -- 'crescendo', 'estavel', 'decrescendo'
  tendencia_caseload TEXT,
  
  -- ML Insights
  insights_IA TEXT[], -- Array of AI-generated insights
  alertas JSONB, -- Warning flags from predictions
  
  actualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS Policy for analytics_dashboard
ALTER TABLE analytics_dashboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY analytics_dashboard_user_isolation ON analytics_dashboard
  FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_analytics_dashboard_user_id ON analytics_dashboard(user_id);

-- Trigger: Update updated_at for revenue_actuals
CREATE OR REPLACE FUNCTION update_revenue_actuals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER revenue_actuals_updated_at_trigger
BEFORE UPDATE ON revenue_actuals
FOR EACH ROW
EXECUTE FUNCTION update_revenue_actuals_updated_at();

-- Trigger: Update atualizado_em for revenue_predictions
CREATE OR REPLACE FUNCTION update_revenue_predictions_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER revenue_predictions_atualizado_em_trigger
BEFORE UPDATE ON revenue_predictions
FOR EACH ROW
EXECUTE FUNCTION update_revenue_predictions_atualizado_em();

-- Trigger: Update updated_at for workload_actuals
CREATE OR REPLACE FUNCTION update_workload_actuals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workload_actuals_updated_at_trigger
BEFORE UPDATE ON workload_actuals
FOR EACH ROW
EXECUTE FUNCTION update_workload_actuals_updated_at();

-- Trigger: Update atualizado_em for workload_predictions
CREATE OR REPLACE FUNCTION update_workload_predictions_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workload_predictions_atualizado_em_trigger
BEFORE UPDATE ON workload_predictions
FOR EACH ROW
EXECUTE FUNCTION update_workload_predictions_atualizado_em();
