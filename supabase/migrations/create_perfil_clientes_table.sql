-- Create client profile table (Perfil de Cliente)
CREATE TABLE IF NOT EXISTS perfil_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Client identification
  nome VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  cnpj_cpf VARCHAR(20),
  
  -- Contact information
  telefone VARCHAR(20),
  email VARCHAR(255),
  
  -- Address
  endereco VARCHAR(500),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  
  -- Additional data
  ramo_atividade VARCHAR(255),
  porte_empresa VARCHAR(50), -- Micro, Pequena, Média, Grande
  numero_funcionarios INT,
  site VARCHAR(500),
  
  -- Notes
  observacoes TEXT,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  
  -- Timestamps
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_porte CHECK (porte_empresa IN ('Micro', 'Pequena', 'Média', 'Grande'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_perfil_clientes_user_id ON perfil_clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_perfil_clientes_nome ON perfil_clientes(nome);
CREATE INDEX IF NOT EXISTS idx_perfil_clientes_email ON perfil_clientes(email);
CREATE INDEX IF NOT EXISTS idx_perfil_clientes_cnpj ON perfil_clientes(cnpj_cpf);

-- Create view for querying by user
CREATE OR REPLACE VIEW user_perfil_clientes AS
SELECT pc.* FROM perfil_clientes pc
WHERE pc.user_id = (SELECT auth.uid());
