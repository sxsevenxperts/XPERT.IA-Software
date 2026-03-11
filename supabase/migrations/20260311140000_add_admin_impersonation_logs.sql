-- ============================================================
-- MIGRATION: Log de impersonação de admin
-- ============================================================

-- Criar tabela para auditoria de impersonação
CREATE TABLE IF NOT EXISTS admin_impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  login_at TIMESTAMP DEFAULT NOW(),
  logout_at TIMESTAMP,
  ip_address TEXT,
  actions_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_impersonation_admin_id ON admin_impersonation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_client_id ON admin_impersonation_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_login_at ON admin_impersonation_logs(login_at);

-- Comentários
COMMENT ON TABLE admin_impersonation_logs IS 'Auditoria de quando admins acessam contas de clientes';
COMMENT ON COLUMN admin_impersonation_logs.admin_id IS 'ID do admin que fez a impersonação';
COMMENT ON COLUMN admin_impersonation_logs.client_id IS 'ID do cliente que foi acessado';
COMMENT ON COLUMN admin_impersonation_logs.login_at IS 'Data e hora do login na conta do cliente';
COMMENT ON COLUMN admin_impersonation_logs.logout_at IS 'Data e hora da saída da conta do cliente';
COMMENT ON COLUMN admin_impersonation_logs.ip_address IS 'IP address (para futura auditoria)';
COMMENT ON COLUMN admin_impersonation_logs.actions_count IS 'Número de ações realizadas durante impersonação';
