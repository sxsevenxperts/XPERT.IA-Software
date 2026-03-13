-- Migration: Rastreamento de objeções e planos de ação
-- Para o addon "Agente de Objeção IA"

CREATE TABLE IF NOT EXISTS lead_objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  numero_whatsapp TEXT NOT NULL,
  tipo_objecao TEXT NOT NULL,  -- 'preco', 'tempo', 'confianca', 'necessidade', 'outro'
  descricao TEXT NOT NULL,     -- A objeção identificada
  plano_acao TEXT NOT NULL,    -- Estratégia para contornar
  enviado_ao_agente BOOLEAN DEFAULT false,
  numero_agente TEXT,          -- Número do agente/supervisor que recebeu
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  resolvido_em TIMESTAMPTZ
);

ALTER TABLE lead_objections ENABLE ROW LEVEL SECURITY;

-- RLS: usuários só veem suas próprias objeções
CREATE POLICY "lead_objections_own" ON lead_objections
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_lead_objections_lead ON lead_objections(lead_id);
CREATE INDEX idx_lead_objections_tipo ON lead_objections(tipo_objecao);
CREATE INDEX idx_lead_objections_criado ON lead_objections(criado_em DESC);
