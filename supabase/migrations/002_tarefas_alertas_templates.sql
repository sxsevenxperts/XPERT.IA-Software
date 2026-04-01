-- MIGRATION: Tarefas, Alertas e Templates para Fase 1
-- Descrição: Adiciona tabelas para gestão de tarefas, alertas de prazos e templates de documentos

-- 1. TABELA: TAREFAS (Task Management)
CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('alta', 'normal', 'baixa')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  data_vencimento DATE,
  data_conclusao DATE,
  criada_por_ia BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY tarefas_user_isolation ON tarefas
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_tarefas_user_id ON tarefas(user_id);
CREATE INDEX idx_tarefas_caso_id ON tarefas(caso_id);
CREATE INDEX idx_tarefas_status ON tarefas(status);

-- 2. TABELA: ALERTAS (Deadline Alerts)
CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT DEFAULT 'prazo' CHECK (tipo IN ('prazo', 'consultoria', 'vencimento', 'customizado')),
  data_alerta DATE NOT NULL,
  enviado BOOLEAN DEFAULT FALSE,
  notificacao_lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY alertas_user_isolation ON alertas
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_alertas_user_id ON alertas(user_id);
CREATE INDEX idx_alertas_notificacao_lida ON alertas(notificacao_lida);
CREATE INDEX idx_alertas_data_alerta ON alertas(data_alerta);

-- 3. TABELA: TEMPLATES (Document Templates)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('peticao', 'contrato', 'parecer', 'customizado')),
  conteudo TEXT NOT NULL,
  categoria TEXT,
  criado_por_ia BOOLEAN DEFAULT FALSE,
  marcadores TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY templates_user_isolation ON templates
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_tipo ON templates(tipo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tarefas_update_updated_at BEFORE UPDATE ON tarefas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER alertas_update_updated_at BEFORE UPDATE ON alertas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER templates_update_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
