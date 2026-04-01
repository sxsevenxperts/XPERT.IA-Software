-- ===== PORTAIS JUDICIAIS INTEGRATION =====
-- Feature 12: Integração com Portais Judiciais (TRF, INSS, CNJ)
-- Allows lawyers to track case status from official legal portals automatically

-- Table: portal_integrations
-- Stores credentials and configuration for external portal connections
CREATE TABLE portal_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  portal_tipo TEXT NOT NULL, -- 'trf', 'inss', 'cnj', 'outro'
  numero_processo TEXT NOT NULL, -- Official process number (e.g., "0000000-00.0000.0.00.0000")
  credenciais_criptografadas TEXT, -- Encrypted login credentials (CPF/CNPJ format)
  ultimo_sync TIMESTAMPTZ,
  proxima_sync_agendada TIMESTAMPTZ,
  frequencia_sync TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, numero_processo, portal_tipo)
);

-- RLS Policy for portal_integrations
ALTER TABLE portal_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY portal_integrations_user_isolation ON portal_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_portal_integrations_user_id ON portal_integrations(user_id);
CREATE INDEX idx_portal_integrations_caso_id ON portal_integrations(caso_id);
CREATE INDEX idx_portal_integrations_numero_processo ON portal_integrations(numero_processo);

-- Table: processo_status
-- Tracks current status and historical updates of legal processes from portals
CREATE TABLE processo_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES portal_integrations(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id),
  portal_tipo TEXT NOT NULL, -- 'trf', 'inss', 'cnj', 'outro'
  numero_processo TEXT NOT NULL,
  
  -- Status information
  status_atual TEXT NOT NULL, -- 'em andamento', 'suspenso', 'concluso', 'arquivado'
  ultima_movimentacao TEXT, -- Last event description
  data_ultima_movimentacao TIMESTAMPTZ,
  fase_processual TEXT, -- Current phase (e.g., "1ª Instância", "Recurso")
  juizo_atual TEXT, -- Current court/judge
  
  -- Detailed information
  partes TEXT[], -- Array of parties involved
  advogados TEXT[], -- Array of associated lawyers
  eventos_ultimos_30_dias INT DEFAULT 0,
  
  -- Metadata
  sincronizado_em TIMESTAMPTZ DEFAULT now(),
  proxima_verificacao TIMESTAMPTZ,
  notificacao_enviada BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy for processo_status
ALTER TABLE processo_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY processo_status_user_isolation ON processo_status
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_processo_status_user_id ON processo_status(user_id);
CREATE INDEX idx_processo_status_integration_id ON processo_status(integration_id);
CREATE INDEX idx_processo_status_numero_processo ON processo_status(numero_processo);
CREATE INDEX idx_processo_status_caso_id ON processo_status(caso_id);
CREATE INDEX idx_processo_status_status_atual ON processo_status(status_atual);

-- Table: portal_sync_log
-- Tracks sync operations for auditing and debugging
CREATE TABLE portal_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES portal_integrations(id) ON DELETE CASCADE,
  portal_tipo TEXT NOT NULL,
  numero_processo TEXT,
  
  -- Sync details
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'sucesso', 'falha', 'parcial'
  mensagem_erro TEXT,
  movimentacoes_encontradas INT DEFAULT 0,
  notificacoes_geradas INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy for portal_sync_log
ALTER TABLE portal_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY portal_sync_log_user_isolation ON portal_sync_log
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_portal_sync_log_user_id ON portal_sync_log(user_id);
CREATE INDEX idx_portal_sync_log_integration_id ON portal_sync_log(integration_id);
CREATE INDEX idx_portal_sync_log_status ON portal_sync_log(status);
CREATE INDEX idx_portal_sync_log_data_inicio ON portal_sync_log(data_inicio DESC);

-- Trigger: Update updated_at for portal_integrations
CREATE OR REPLACE FUNCTION update_portal_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portal_integrations_updated_at_trigger
BEFORE UPDATE ON portal_integrations
FOR EACH ROW
EXECUTE FUNCTION update_portal_integrations_updated_at();

-- Trigger: Update updated_at for processo_status
CREATE OR REPLACE FUNCTION update_processo_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER processo_status_updated_at_trigger
BEFORE UPDATE ON processo_status
FOR EACH ROW
EXECUTE FUNCTION update_processo_status_updated_at();
