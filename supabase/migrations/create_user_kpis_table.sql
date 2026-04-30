-- Create user_kpis table for KPIs and OKRs
CREATE TABLE IF NOT EXISTS user_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- KPI/OKR identification
  tipo TEXT NOT NULL CHECK (tipo IN ('kpi', 'okr')), -- 'kpi' or 'okr'
  nome TEXT NOT NULL,
  
  -- KPI values
  meta_definida DECIMAL(12,2) DEFAULT 0,
  valor_atual DECIMAL(12,2) DEFAULT 0,
  percentual DECIMAL(5,2) DEFAULT 0, -- Progress percentage
  
  -- OKR values
  status TEXT CHECK (status IN ('em_progresso', 'alcancado', 'nao_alcancado')), -- OKR status
  
  -- Timestamps
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_tipo CHECK (tipo IN ('kpi', 'okr')),
  CONSTRAINT check_status CHECK (status IN ('em_progresso', 'alcancado', 'nao_alcancado'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_kpis_user_id ON user_kpis(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kpis_tipo ON user_kpis(user_id, tipo);

-- Create default KPIs and OKRs function
CREATE OR REPLACE FUNCTION create_default_kpis_and_okrs(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert 12 default KPIs
  INSERT INTO user_kpis (user_id, tipo, nome, meta_definida, valor_atual) VALUES
  (user_id, 'kpi', 'Receita Mensal', 50000, 0),
  (user_id, 'kpi', 'Leads Qualificados', 100, 0),
  (user_id, 'kpi', 'Taxa de Conversão (%)', 20, 0),
  (user_id, 'kpi', 'Ticket Médio', 5000, 0),
  (user_id, 'kpi', 'Custo de Aquisição', 500, 0),
  (user_id, 'kpi', 'Satisfação do Cliente', 90, 0),
  (user_id, 'kpi', 'Retenção de Clientes (%)', 95, 0),
  (user_id, 'kpi', 'Tempo Resposta Médio (h)', 2, 0),
  (user_id, 'kpi', 'Eficiência do Funil (%)', 80, 0),
  (user_id, 'kpi', 'NPS (Net Promoter Score)', 50, 0),
  (user_id, 'kpi', 'ROI de Marketing (%)', 300, 0),
  (user_id, 'kpi', 'Crescimento YoY (%)', 50, 0);

  -- Insert 12 default OKRs
  INSERT INTO user_kpis (user_id, tipo, nome, status) VALUES
  (user_id, 'okr', 'Aumentar base de clientes em 30%', 'em_progresso'),
  (user_id, 'okr', 'Melhorar satisfação do cliente para 95%', 'em_progresso'),
  (user_id, 'okr', 'Reduzir tempo de resposta em 50%', 'em_progresso'),
  (user_id, 'okr', 'Expandir para novo mercado', 'em_progresso'),
  (user_id, 'okr', 'Implementar novo sistema CRM', 'em_progresso'),
  (user_id, 'okr', 'Treinar equipe em vendas consultivas', 'em_progresso'),
  (user_id, 'okr', 'Aumentar lifetime value do cliente', 'em_progresso'),
  (user_id, 'okr', 'Reduzir taxa de churn para 5%', 'em_progresso'),
  (user_id, 'okr', 'Lançar 3 novos produtos/serviços', 'em_progresso'),
  (user_id, 'okr', 'Alcançar break-even em 6 meses', 'em_progresso'),
  (user_id, 'okr', 'Construir parcerias estratégicas', 'em_progresso'),
  (user_id, 'okr', 'Automação de 80% dos processos', 'em_progresso');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate KPIs for new users
CREATE OR REPLACE FUNCTION trigger_create_default_kpis()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_kpis_and_okrs(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_default_kpis ON profiles;
CREATE TRIGGER trg_create_default_kpis
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_create_default_kpis();
