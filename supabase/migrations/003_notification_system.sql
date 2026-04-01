-- MIGRATION: Sistema de Notificações (Fase 2 - Feature 4)
-- Descrição: Notificações por email, SMS e in-app com configurações por usuário

-- 1. TABELA: NOTIFICATION_SETTINGS (Preferências do usuário)
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'sms', 'push', 'in_app')),
  ativo BOOLEAN DEFAULT true,
  frequencia TEXT DEFAULT 'immediate' CHECK (frequencia IN ('immediate', 'daily', 'weekly', '6hours')),
  tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN ('prazo', 'tarefa', 'audiencia', 'documento', 'todos')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, canal, tipo_alerta)
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_settings_user_isolation ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX idx_notification_settings_ativo ON notification_settings(ativo);

-- 2. TABELA: NOTIFICATION_LOG (Histórico de notificações enviadas)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'sms', 'push', 'in_app')),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link_ref TEXT,
  enviado_em TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'enviado' CHECK (status IN ('enviado', 'entregue', 'falha', 'pendente')),
  erro_msg TEXT,
  lido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_log_user_isolation ON notification_log
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_canal ON notification_log(canal);
CREATE INDEX idx_notification_log_status ON notification_log(status);
CREATE INDEX idx_notification_log_lido ON notification_log(lido_em);
CREATE INDEX idx_notification_log_criado ON notification_log(created_at);

-- 3. TABELA: NOTIFICATION_QUEUE (Fila de notificações a enviar)
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  canal TEXT NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link_ref TEXT,
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'critica')),
  agendado_para TIMESTAMPTZ DEFAULT now(),
  tentativas INT DEFAULT 0,
  max_tentativas INT DEFAULT 3,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'enviado', 'falha')),
  erro_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_agendado ON notification_queue(agendado_para);
CREATE INDEX idx_notification_queue_prioridade ON notification_queue(prioridade);

-- 4. TABELA: CONTACT_INFO (Email e telefone do usuário para notificações)
CREATE TABLE contact_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  telefone TEXT,
  email_verificado BOOLEAN DEFAULT false,
  telefone_verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_info_user_isolation ON contact_info
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_contact_info_user_id ON contact_info(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER notification_settings_update_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_log_update_updated_at BEFORE UPDATE ON notification_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER notification_queue_update_updated_at BEFORE UPDATE ON notification_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER contact_info_update_updated_at BEFORE UPDATE ON contact_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
