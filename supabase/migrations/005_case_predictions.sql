-- MIGRATION: Análise Preditiva de Casos (Fase 3 - Feature 7)
-- Descrição: Previsões de viabilidade usando IA

-- 1. TABELA: CASE_PREDICTIONS (Análise preditiva)
CREATE TABLE case_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viabilidade_percentual INT CHECK (viabilidade_percentual >= 0 AND viabilidade_percentual <= 100),
  confianca_percentual INT CHECK (confianca_percentual >= 0 AND confianca_percentual <= 100),
  risco_nivel TEXT CHECK (risco_nivel IN ('baixo', 'medio', 'alto', 'critico')),
  fatores_positivos TEXT[],
  fatores_negativos TEXT[],
  recomendacoes TEXT[],
  analise_completa TEXT,
  gerado_por_ia BOOLEAN DEFAULT true,
  modelo_ia TEXT DEFAULT 'claude-3-opus',
  tokens_usados INT,
  tempo_analise_ms INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE case_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY case_predictions_user_isolation ON case_predictions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_case_predictions_user_id ON case_predictions(user_id);
CREATE INDEX idx_case_predictions_caso_id ON case_predictions(caso_id);
CREATE INDEX idx_case_predictions_risco ON case_predictions(risco_nivel);
CREATE INDEX idx_case_predictions_viabilidade ON case_predictions(viabilidade_percentual);

-- 2. TABELA: PREDICTION_HISTORY (Histórico de previsões)
CREATE TABLE prediction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES case_predictions(id) ON DELETE CASCADE,
  versao INT DEFAULT 1,
  viabilidade_anterior INT,
  motivo_mudanca TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prediction_history_prediction_id ON prediction_history(prediction_id);
CREATE INDEX idx_prediction_history_created ON prediction_history(created_at);

-- Triggers
CREATE TRIGGER case_predictions_update_updated_at BEFORE UPDATE ON case_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
