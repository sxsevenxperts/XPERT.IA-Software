-- ============================================================================
-- TABELAS DE PAGAMENTO - Integração com múltiplos gateways
-- ============================================================================

-- Tabela 1: Registros de pagamento
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Gateway e status
  gateway TEXT NOT NULL, -- 'stripe', 'mercado_pago', 'asaas', 'infinitepay'
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'aprovado', 'recusado', 'cancelado', 'reembolsado'
  
  -- Valores
  valor_cents INT NOT NULL, -- Valor em centavos (ex: 5000 = R$ 50,00)
  moeda TEXT DEFAULT 'brl',
  taxa_gateway DECIMAL(6,2), -- Taxa cobrada pelo gateway
  valor_recebido DECIMAL(12,2), -- Valor após descontar taxa
  
  -- Referências externas
  session_id TEXT, -- ID da sessão no gateway (stripe session, MP preference, etc)
  transaction_id TEXT, -- ID da transação após aprovação
  
  -- Dados do pagamento
  descricao TEXT,
  metodo_pagamento TEXT, -- 'cartao', 'pix', 'boleto', 'transferencia', etc
  
  -- Timestamps
  criado_em TIMESTAMPTZ DEFAULT now(),
  confirmado_em TIMESTAMPTZ,
  reembolsado_em TIMESTAMPTZ,
  
  -- Metadata
  webhook_raw JSONB, -- Raw data from webhook
  notas TEXT,
  
  CONSTRAINT check_gateway CHECK (gateway IN ('stripe', 'mercado_pago', 'asaas', 'infinitepay')),
  CONSTRAINT check_status CHECK (status IN ('pendente', 'aprovado', 'recusado', 'cancelado', 'reembolsado'))
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_user ON pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_lead ON pagamentos(lead_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_gateway ON pagamentos(gateway);
CREATE INDEX IF NOT EXISTS idx_pagamentos_session ON pagamentos(session_id);

-- RLS para pagamentos
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON pagamentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert payments"
  ON pagamentos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own payments"
  ON pagamentos FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabela 2: Logs de webhook dos gateways
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  evento_tipo TEXT NOT NULL, -- 'charge.confirmed', 'payment.approved', etc
  payload JSONB NOT NULL,
  processado BOOLEAN DEFAULT FALSE,
  erro TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  processado_em TIMESTAMPTZ,
  
  CONSTRAINT check_gateway CHECK (gateway IN ('stripe', 'mercado_pago', 'asaas', 'infinitepay'))
);

CREATE INDEX IF NOT EXISTS idx_webhooks_gateway ON payment_webhooks(gateway);
CREATE INDEX IF NOT EXISTS idx_webhooks_processado ON payment_webhooks(processado);
CREATE INDEX IF NOT EXISTS idx_webhooks_timestamp ON payment_webhooks(criado_em DESC);

-- Tabela 3: Recibos de pagamento
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  
  -- Dados do recibo
  numero_recibo TEXT UNIQUE,
  url_recibo TEXT, -- Link para download do recibo no gateway
  
  -- Dados da transação
  numero_autorizacao TEXT,
  bandeira_cartao TEXT, -- Visa, Mastercard, etc
  ultimos_digitos TEXT, -- Últimos 4 dígitos do cartão
  
  criado_em TIMESTAMPTZ DEFAULT now(),
  enviado_por_email TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_receipts_pagamento ON payment_receipts(pagamento_id);

-- Views para análise de pagamentos

-- View 1: Resumo de pagamentos por usuário
CREATE OR REPLACE VIEW vw_pagamentos_por_usuario AS
SELECT
  p.user_id,
  COUNT(*) as total_pagamentos,
  SUM(CASE WHEN p.status = 'aprovado' THEN 1 ELSE 0 END) as aprovados,
  SUM(CASE WHEN p.status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
  SUM(CASE WHEN p.status = 'recusado' THEN 1 ELSE 0 END) as recusados,
  SUM(CASE WHEN p.status = 'aprovado' THEN p.valor_cents ELSE 0 END)::DECIMAL / 100 as receita_total,
  SUM(CASE WHEN p.status = 'aprovado' THEN COALESCE(p.taxa_gateway, 0) ELSE 0 END) as taxa_total,
  SUM(CASE WHEN p.status = 'aprovado' THEN COALESCE(p.valor_recebido, 0) ELSE 0 END) as valor_liquido
FROM pagamentos p
GROUP BY p.user_id;

-- View 2: Pagamentos por gateway
CREATE OR REPLACE VIEW vw_pagamentos_por_gateway AS
SELECT
  gateway,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'aprovado' THEN 1 ELSE 0 END) as aprovados,
  ROUND(100.0 * SUM(CASE WHEN status = 'aprovado' THEN 1 ELSE 0 END) / COUNT(*), 2) as taxa_aprovacao_percent,
  SUM(CASE WHEN status = 'aprovado' THEN valor_cents ELSE 0 END)::DECIMAL / 100 as receita_total
FROM pagamentos
GROUP BY gateway;

-- View 3: Performance de leads (com pagamentos)
CREATE OR REPLACE VIEW vw_leads_performance_com_pagamentos AS
SELECT
  l.user_id,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.stage = 'qualified' THEN l.id END) as leads_qualificados,
  COUNT(DISTINCT p.id) as leads_com_pagamento,
  COUNT(DISTINCT CASE WHEN p.status = 'aprovado' THEN p.pagamento_id END) as leads_pagos,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN l.stage = 'qualified' THEN l.id END) / NULLIF(COUNT(DISTINCT l.id), 0), 2) as taxa_qualificacao_percent,
  SUM(CASE WHEN p.status = 'aprovado' THEN p.valor_cents ELSE 0 END)::DECIMAL / 100 as receita_gerada
FROM leads l
LEFT JOIN pagamentos p ON l.id = p.lead_id
GROUP BY l.user_id;
