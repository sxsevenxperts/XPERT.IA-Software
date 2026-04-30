-- ================================================================
-- PrevOS — Migração 001
-- Tabela profiles + colunas de API keys por usuário
-- Execute no SQL Editor do Supabase Dashboard
-- ================================================================

-- 1. Cria tabela profiles (se não existir)
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text,
  oab           text,           -- ex: OAB/SP 123.456
  escritorio    text,
  areas_atuacao text[],         -- ['Previdenciário', 'Trabalhista', ...]
  avatar_url    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 2. Colunas de chaves de API (cada advogado tem as suas)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS claude_api_key   text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_token   text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS asaas_key        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_token      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jusbrasil_key    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tribunal_token   text;

-- 3. Row Level Security — cada usuário só acessa o próprio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_self_select" ON profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;

CREATE POLICY "profiles_self_select"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_self_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_self_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- Tabela clientes
-- ================================================================
CREATE TABLE IF NOT EXISTS clientes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  cpf         text,
  email       text,
  telefone    text,
  area        text,             -- área principal do direito
  status      text DEFAULT 'ativo',
  observacoes text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_owner" ON clientes;
CREATE POLICY "clientes_owner" ON clientes
  FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- Tabela casos
-- ================================================================
CREATE TABLE IF NOT EXISTS casos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id      uuid REFERENCES clientes(id) ON DELETE SET NULL,
  numero_processo text,
  titulo          text NOT NULL,
  area            text,
  tribunal        text,
  vara            text,
  status          text DEFAULT 'em_andamento',
  prioridade      text DEFAULT 'media',
  valor_causa     numeric,
  valor_honorario numeric,
  tipo_honorario  text DEFAULT 'exito',   -- fixo, exito, misto
  descricao       text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE casos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "casos_owner" ON casos;
CREATE POLICY "casos_owner" ON casos
  FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- Tabela honorarios
-- ================================================================
CREATE TABLE IF NOT EXISTS honorarios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  caso_id    uuid REFERENCES casos(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  descricao  text,
  valor      numeric NOT NULL,
  tipo       text DEFAULT 'exito',
  status     text DEFAULT 'pendente',  -- pendente, pago, vencido
  vencimento date,
  pago_em    date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE honorarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "honorarios_owner" ON honorarios;
CREATE POLICY "honorarios_owner" ON honorarios
  FOR ALL USING (auth.uid() = user_id);
