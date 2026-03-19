-- Tabela de templates de workflows (designs de fluxo)
CREATE TABLE IF NOT EXISTS workflow_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, nome)
);

-- Tabela para associar workflows a números (instâncias)
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_design_id UUID REFERENCES workflow_designs(id) ON DELETE SET NULL,
  numero_whatsapp TEXT NOT NULL,  -- número principal ou extra (ex: principal, numero-1, numero-2)
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, numero_whatsapp)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_workflow_designs_user_id ON workflow_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_user_id ON workflow_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_workflow_id ON workflow_instances(workflow_design_id);

-- RLS Policies
ALTER TABLE workflow_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas seus próprios workflows
CREATE POLICY "workflow_designs_own" ON workflow_designs FOR ALL 
  USING (user_id = auth.uid());
CREATE POLICY "workflow_designs_admin" ON workflow_designs FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "workflow_instances_own" ON workflow_instances FOR ALL 
  USING (user_id = auth.uid());
CREATE POLICY "workflow_instances_admin" ON workflow_instances FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
