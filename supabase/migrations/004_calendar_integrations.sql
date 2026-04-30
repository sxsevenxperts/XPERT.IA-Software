-- MIGRATION: Integrações de Calendário (Fase 2 - Feature 5)
-- Descrição: Sincronização com Google Calendar e Outlook

-- 1. TABELA: CALENDAR_INTEGRATIONS (Configurações de integração)
CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'ical')),
  token_criptografado TEXT,
  refresh_token_criptografado TEXT,
  calendar_id TEXT,
  calendar_nome TEXT,
  email TEXT,
  sincronizado_em TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  ultim_sync TIMESTAMPTZ,
  sync_direcao TEXT DEFAULT 'bidirecional' CHECK (sync_direcao IN ('prevos_para_externo', 'externo_para_prevos', 'bidirecional')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY calendar_integrations_user_isolation ON calendar_integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON calendar_integrations(provider);
CREATE INDEX idx_calendar_integrations_ativo ON calendar_integrations(ativo);

-- 2. TABELA: CALENDAR_EVENTS (Eventos sincronizados)
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id) ON DELETE SET NULL,
  tarefa_id UUID REFERENCES tarefas(id) ON DELETE SET NULL,
  alerta_id UUID REFERENCES alertas(id) ON DELETE SET NULL,
  external_event_id TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'ical')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  localizacao TEXT,
  attendees TEXT[],
  sincronizado_em TIMESTAMPTZ,
  ultima_atualizacao TIMESTAMPTZ,
  em_prevos BOOLEAN DEFAULT true,
  em_externo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY calendar_events_user_isolation ON calendar_events
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_integration_id ON calendar_events(integration_id);
CREATE INDEX idx_calendar_events_caso_id ON calendar_events(caso_id);
CREATE INDEX idx_calendar_events_data_inicio ON calendar_events(data_inicio);
CREATE INDEX idx_calendar_events_provider ON calendar_events(provider);

-- 3. TABELA: CALENDAR_SYNC_LOG (Histórico de sincronizações)
CREATE TABLE calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  tipo_sync TEXT NOT NULL CHECK (tipo_sync IN ('full', 'incremental', 'manual')),
  status TEXT DEFAULT 'iniciado' CHECK (status IN ('iniciado', 'processando', 'sucesso', 'falha')),
  eventos_sincronizados INT DEFAULT 0,
  eventos_criados INT DEFAULT 0,
  eventos_atualizados INT DEFAULT 0,
  eventos_deletados INT DEFAULT 0,
  erro_msg TEXT,
  duracao_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_calendar_sync_log_integration_id ON calendar_sync_log(integration_id);
CREATE INDEX idx_calendar_sync_log_status ON calendar_sync_log(status);
CREATE INDEX idx_calendar_sync_log_criado ON calendar_sync_log(created_at);

-- Triggers
CREATE TRIGGER calendar_integrations_update_updated_at BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER calendar_events_update_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
