-- Migration: Agent flags + RLS policies para agent access control
-- Adiciona suporte para role 'membro' com agent_id linkage

-- 1. Adiciona agent_id e is_agent à profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES usuarios_extras(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_agent BOOLEAN DEFAULT FALSE;

-- 2. RLS para sessoes — agents podem acessar conversas do seu owner
DROP POLICY IF EXISTS "sessoes_agent_access" ON sessoes;
CREATE POLICY "sessoes_agent_access" ON sessoes
  FOR ALL USING (
    user_id = auth.uid()  -- owner direto
    OR (
      -- agent acessa conversas do seu owner
      auth.jwt() ->> 'user_metadata' ->> 'role' = 'membro'
      AND user_id = (
        SELECT owner_id FROM usuarios_extras
        WHERE id = (SELECT agent_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- 3. RLS para leads — agents acessam leads do seu owner
DROP POLICY IF EXISTS "leads_agent_access" ON leads;
CREATE POLICY "leads_agent_access" ON leads
  FOR ALL USING (
    user_id = auth.uid()  -- owner direto
    OR (
      -- agent acessa leads do seu owner
      auth.jwt() ->> 'user_metadata' ->> 'role' = 'membro'
      AND user_id = (
        SELECT owner_id FROM usuarios_extras
        WHERE id = (SELECT agent_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- 4. RLS para lead_tarefas — agents veem tarefas do seu owner
DROP POLICY IF EXISTS "lead_tarefas_agent_access" ON lead_tarefas;
CREATE POLICY "lead_tarefas_agent_access" ON lead_tarefas
  FOR ALL USING (
    user_id = auth.uid()  -- created by this user
    OR (
      -- agent acessa tarefas do seu owner (via lead_id → leads)
      auth.jwt() ->> 'user_metadata' ->> 'role' = 'membro'
      AND (SELECT user_id FROM leads WHERE id = lead_id) = (
        SELECT owner_id FROM usuarios_extras
        WHERE id = (SELECT agent_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- 5. RLS para agente_config — agents veem config do seu owner
DROP POLICY IF EXISTS "agente_config_agent_access" ON agente_config;
CREATE POLICY "agente_config_agent_access" ON agente_config
  FOR SELECT USING (
    user_id = auth.uid()  -- seu próprio config
    OR (
      -- agent pode LER config do seu owner (não modificar)
      auth.jwt() ->> 'user_metadata' ->> 'role' = 'membro'
      AND user_id = (
        SELECT owner_id FROM usuarios_extras
        WHERE id = (SELECT agent_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- 6. BLOQUEIA agents de acessar billing/tokens (assinaturas, tokens_creditos, addon_purchases)
DROP POLICY IF EXISTS "assinaturas_no_agent" ON assinaturas;
CREATE POLICY "assinaturas_no_agent" ON assinaturas
  FOR ALL USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'membro'
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "tokens_creditos_no_agent" ON tokens_creditos;
CREATE POLICY "tokens_creditos_no_agent" ON tokens_creditos
  FOR ALL USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'membro'
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "addon_purchases_no_agent" ON addon_purchases;
CREATE POLICY "addon_purchases_no_agent" ON addon_purchases
  FOR ALL USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'membro'
    AND user_id = auth.uid()
  );

-- 7. BLOQUEIA agents de acessar agente_config edit (apenas read no policy acima)
DROP POLICY IF EXISTS "agente_config_no_agent_write" ON agente_config;
CREATE POLICY "agente_config_no_agent_write" ON agente_config
  FOR INSERT, UPDATE, DELETE USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'membro'
    AND user_id = auth.uid()
  );
