-- 004_real_time_analytics.sql
-- Tabelas para análise em tempo real, estoques, validades, perdas e comportamento de clientes

-- ===== ESTOQUE EM TEMPO REAL =====
CREATE TABLE estoque_real_time (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  produto_id VARCHAR(50) NOT NULL,
  nome_produto VARCHAR(255),
  categoria VARCHAR(100),
  quantidade_atual INT NOT NULL DEFAULT 0,
  quantidade_minima INT DEFAULT 0,
  valor_unitario DECIMAL(10,2),
  giro_diario DECIMAL(10,2), -- quantidade média vendida por dia
  dias_estoque INT, -- estimativa de dias até acabar
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(loja_id, produto_id),
  CONSTRAINT estoque_positivo CHECK (quantidade_atual >= 0)
);

CREATE INDEX idx_estoque_loja ON estoque_real_time(loja_id);
CREATE INDEX idx_estoque_atualizado ON estoque_real_time(atualizado_em DESC);

-- ===== VALIDADES E ALERTAS =====
CREATE TABLE validades_produtos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  produto_id VARCHAR(50) NOT NULL,
  nome_produto VARCHAR(255),
  lote VARCHAR(50),
  data_vencimento DATE NOT NULL,
  quantidade INT NOT NULL,
  dias_para_vencer INT GENERATED ALWAYS AS (data_vencimento - CURRENT_DATE) STORED,
  status VARCHAR(20), -- em_dia, alerta_7_dias, alerta_3_dias, vencido
  notificado BOOLEAN DEFAULT FALSE,
  data_notificacao TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT validade_futura CHECK (data_vencimento >= CURRENT_DATE)
);

CREATE INDEX idx_validade_loja ON validades_produtos(loja_id);
CREATE INDEX idx_validade_vencimento ON validades_produtos(data_vencimento);
CREATE INDEX idx_validade_status ON validades_produtos(status);

-- ===== PERDAS E DESPERDÍCIOS =====
CREATE TABLE perdas_desperdicio (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  produto_id VARCHAR(50),
  nome_produto VARCHAR(255),
  categoria VARCHAR(100),
  quantidade INT NOT NULL,
  valor_perdido DECIMAL(10,2), -- quantidade * valor unitário
  motivo VARCHAR(100), -- vencimento, dano, roubo, quebra, devolução
  severidade VARCHAR(20), -- baixa, media, alta, critica
  registrado_por VARCHAR(100),
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  analisado BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_perda_loja ON perdas_desperdicio(loja_id);
CREATE INDEX idx_perda_data ON perdas_desperdicio(data_registro DESC);
CREATE INDEX idx_perda_categoria ON perdas_desperdicio(categoria);

-- ===== RECEITAS HISTÓRICAS =====
CREATE TABLE receitas_historico (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  receita_total DECIMAL(12,2),
  quantidade_vendas INT,
  ticket_medio DECIMAL(10,2),
  categoria_principal VARCHAR(100),
  vendedor VARCHAR(100),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(loja_id, data)
);

CREATE INDEX idx_receita_loja ON receitas_historico(loja_id);
CREATE INDEX idx_receita_data ON receitas_historico(data DESC);

-- ===== CLIENTES =====
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  nome VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  cpf_cnpj VARCHAR(20),
  endereco TEXT,
  data_primeiro_acesso TIMESTAMP WITH TIME ZONE,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20), -- ativo, inativo, churn
  nivel VARCHAR(20), -- bronze, prata, ouro, platina (baseado em LTV)
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(loja_id, cpf_cnpj),
  UNIQUE(loja_id, email)
);

CREATE INDEX idx_cliente_loja ON clientes(loja_id);
CREATE INDEX idx_cliente_status ON clientes(status);
CREATE INDEX idx_cliente_nivel ON clientes(nivel);

-- ===== TRANSAÇÕES DE CLIENTES =====
CREATE TABLE transacoes_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  valor DECIMAL(10,2) NOT NULL,
  quantidade_itens INT,
  categorias_compradas TEXT[], -- array de categorias
  metodo_pagamento VARCHAR(50),
  produtos JSON -- {produto_id, nome, categoria, valor, quantidade}
);

CREATE INDEX idx_transacao_cliente ON transacoes_clientes(cliente_id);
CREATE INDEX idx_transacao_loja ON transacoes_clientes(loja_id);
CREATE INDEX idx_transacao_data ON transacoes_clientes(data DESC);

-- ===== LTV E VALOR DO CLIENTE =====
CREATE TABLE ltv_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL UNIQUE REFERENCES clientes(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  valor_total_gasto DECIMAL(12,2) DEFAULT 0,
  quantidade_compras INT DEFAULT 0,
  data_primeiro_compra TIMESTAMP WITH TIME ZONE,
  data_ultima_compra TIMESTAMP WITH TIME ZONE,
  frequencia_dias_medio INT, -- dias médio entre compras
  ticket_medio DECIMAL(10,2),
  categoria_favorita VARCHAR(100),
  metodo_pagamento_preferido VARCHAR(50),
  propensao_churn DECIMAL(3,2), -- 0.0 a 1.0 (confiança de risco de sair)
  score_cliente DECIMAL(5,2), -- 0 a 100
  calculado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT propensao_range CHECK (propensao_churn >= 0 AND propensao_churn <= 1)
);

CREATE INDEX idx_ltv_loja ON ltv_cliente(loja_id);
CREATE INDEX idx_ltv_propensao ON ltv_cliente(propensao_churn DESC);
CREATE INDEX idx_ltv_score ON ltv_cliente(score_cliente DESC);

-- ===== COMPORTAMENTO DO CONSUMIDOR (RFM + Extra) =====
CREATE TABLE comportamento_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL UNIQUE REFERENCES clientes(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  
  -- RFM Score
  recencia INT, -- dias desde última compra
  frequencia INT, -- quantidade de compras nos últimos 90 dias
  monetary DECIMAL(10,2), -- valor gasto nos últimos 90 dias
  rfm_score VARCHAR(10), -- combinação RFM (111, 222, etc)
  
  -- Preferências
  categorias_preferidas VARCHAR(100)[],
  dias_semana_preferidos VARCHAR(20)[], -- seg, ter, qua, etc
  horario_preferido_inicio INT, -- 0-23
  horario_preferido_fim INT, -- 0-23
  
  -- Comportamento
  taxa_retorno_30_dias DECIMAL(5,2), -- % de retorno em 30 dias
  taxa_retorno_90_dias DECIMAL(5,2),
  propensao_upsell DECIMAL(3,2), -- 0 a 1
  propensao_cross_sell DECIMAL(3,2), -- 0 a 1
  produto_mais_comprado VARCHAR(50),
  categoria_mais_comprada VARCHAR(100),
  
  -- Risco
  propensao_churn DECIMAL(3,2),
  status_engajamento VARCHAR(20), -- alto, medio, baixo, critico
  
  calculado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  proxima_analise TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_comportamento_loja ON comportamento_cliente(loja_id);
CREATE INDEX idx_comportamento_engajamento ON comportamento_cliente(status_engajamento);
CREATE INDEX idx_comportamento_churn ON comportamento_cliente(propensao_churn DESC);

-- ===== ALERTAS E NOTIFICAÇÕES =====
CREATE TABLE alertas_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  tipo VARCHAR(50), -- estoque_critico, perda_alta, churn_risco, oportunidade_venda, etc
  severidade VARCHAR(20), -- baixa, media, alta, critica
  titulo VARCHAR(255),
  mensagem TEXT,
  insights JSON, -- dados que geraram o alerta
  responsavel_setor VARCHAR(100), -- gerente, estoquista, vendedor, etc
  destinatarios VARCHAR(255)[], -- emails ou user_ids
  
  lido BOOLEAN DEFAULT FALSE,
  acionado BOOLEAN DEFAULT FALSE,
  plano_acao TEXT,
  resultado TEXT,
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  lido_em TIMESTAMP WITH TIME ZONE,
  acionado_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_alerta_loja ON alertas_notificacoes(loja_id);
CREATE INDEX idx_alerta_severidade ON alertas_notificacoes(severidade);
CREATE INDEX idx_alerta_tipo ON alertas_notificacoes(tipo);
CREATE INDEX idx_alerta_lido ON alertas_notificacoes(lido);

-- ===== INSIGHTS DE IA =====
CREATE TABLE insights_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Tipo de análise
  tipo_analise VARCHAR(100), -- analise_estoque, comportamento_cliente, oportunidade_upsell, etc
  periodo VARCHAR(20), -- diario, semanal, mensal
  
  -- Resultado da análise
  titulo VARCHAR(255),
  insight_principal TEXT,
  por_que_aconteceu TEXT, -- explicação IA
  numeros_chave JSON, -- {metrica: valor} ex: {perda_total: 500, % do faturamento: 2.5}
  
  -- Recomendações
  recomendacoes TEXT[],
  impacto_estimado DECIMAL(10,2), -- em R$
  confianca DECIMAL(3,2), -- 0 a 1
  
  -- Ações sugeridas
  acoes_sugeridas JSON, -- [{acao, responsavel, prazo}]
  
  -- Tracking
  metrica_afetada VARCHAR(100),
  status VARCHAR(20), -- novo, analizado, implementado, descartado
  resultado_posterior DECIMAL(10,2), -- métrica após implementação
  
  tokens_usados INT,
  custo_usd DECIMAL(10,4),
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insight_loja ON insights_ia(loja_id);
CREATE INDEX idx_insight_tipo ON insights_ia(tipo_analise);
CREATE INDEX idx_insight_status ON insights_ia(status);
CREATE INDEX idx_insight_confianca ON insights_ia(confianca DESC);

-- ===== PLANOS DE RECUPERAÇÃO DE CLIENTES =====
CREATE TABLE planos_recuperacao_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  
  motivo_churn VARCHAR(100), -- detectado pela IA
  propensao_churn DECIMAL(3,2),
  
  -- Ações sugeridas
  tipo_acao VARCHAR(50), -- desconto, brinde, email, sms, notificacao_app
  descricao TEXT,
  oferta JSON, -- {tipo: 'desconto', valor: 10, validade: '2026-04-15'}
  
  -- Execução
  data_envio TIMESTAMP WITH TIME ZONE,
  respondido BOOLEAN DEFAULT FALSE,
  data_resposta TIMESTAMP WITH TIME ZONE,
  resultado VARCHAR(20), -- clique, conversao, ignorado
  
  -- Acompanhamento
  retornou BOOLEAN,
  data_retorno TIMESTAMP WITH TIME ZONE,
  valor_novo_gasto DECIMAL(10,2),
  ticket_novo DECIMAL(10,2),
  
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recuperacao_loja ON planos_recuperacao_cliente(loja_id);
CREATE INDEX idx_recuperacao_respondido ON planos_recuperacao_cliente(respondido);
CREATE INDEX idx_recuperacao_resultado ON planos_recuperacao_cliente(resultado);

-- ===== PREVISÕES DE DEMANDA =====
CREATE TABLE previsoes_demanda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  produto_id VARCHAR(50),
  categoria VARCHAR(100),
  
  data_previsao DATE,
  demanda_prevista INT,
  confianca DECIMAL(3,2), -- 0 a 1
  
  -- Comparativo com realidade
  demanda_real INT,
  erro_percentual DECIMAL(5,2),
  acertividade DECIMAL(3,2), -- histórico do modelo
  
  variavel_principal VARCHAR(100), -- sazonalidade, clima, promoção, etc
  
  gerado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_previsao_loja ON previsoes_demanda(loja_id);
CREATE INDEX idx_previsao_data ON previsoes_demanda(data_previsao);
CREATE INDEX idx_previsao_confianca ON previsoes_demanda(confianca DESC);

-- ===== RLS POLICIES =====
ALTER TABLE estoque_real_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE validades_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perdas_desperdicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ltv_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE comportamento_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_recuperacao_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE previsoes_demanda ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Usuários veem dados apenas de suas lojas
CREATE POLICY "Usuários veem estoque de suas lojas" ON estoque_real_time
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = estoque_real_time.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem validades de suas lojas" ON validades_produtos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = validades_produtos.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem perdas de suas lojas" ON perdas_desperdicio
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = perdas_desperdicio.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem receitas de suas lojas" ON receitas_historico
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = receitas_historico.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem clientes de suas lojas" ON clientes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = clientes.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem transações de suas lojas" ON transacoes_clientes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = transacoes_clientes.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem LTV de suas lojas" ON ltv_cliente
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = ltv_cliente.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem comportamento de suas lojas" ON comportamento_cliente
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = comportamento_cliente.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem alertas de suas lojas" ON alertas_notificacoes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = alertas_notificacoes.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem insights de suas lojas" ON insights_ia
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = insights_ia.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem planos de recuperação de suas lojas" ON planos_recuperacao_cliente
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = planos_recuperacao_cliente.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuários veem previsões de suas lojas" ON previsoes_demanda
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = previsoes_demanda.loja_id 
    AND ul.usuario_id = auth.uid()
  ));

-- INSERT/UPDATE/DELETE policies (gerente ou administrador)
CREATE POLICY "Gerentes podem inserir estoque" ON estoque_real_time
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = estoque_real_time.loja_id 
    AND ul.usuario_id = auth.uid()
    AND ul.role IN ('gerente', 'administrador')
  ));

CREATE POLICY "Gerentes podem atualizar estoque" ON estoque_real_time
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM usuarios_lojas ul 
    WHERE ul.loja_id = estoque_real_time.loja_id 
    AND ul.usuario_id = auth.uid()
    AND ul.role IN ('gerente', 'administrador')
  ));

-- Funções auxiliares para cálculos
CREATE OR REPLACE FUNCTION calcular_rfm_score(p_recencia INT, p_frequencia INT, p_monetary DECIMAL)
RETURNS VARCHAR AS $$
DECLARE
  r_score INT;
  f_score INT;
  m_score INT;
BEGIN
  -- RFM scores de 1-5
  r_score := CASE 
    WHEN p_recencia <= 7 THEN 5
    WHEN p_recencia <= 14 THEN 4
    WHEN p_recencia <= 30 THEN 3
    WHEN p_recencia <= 60 THEN 2
    ELSE 1
  END;
  
  f_score := CASE 
    WHEN p_frequencia >= 20 THEN 5
    WHEN p_frequencia >= 10 THEN 4
    WHEN p_frequencia >= 5 THEN 3
    WHEN p_frequencia >= 2 THEN 2
    ELSE 1
  END;
  
  m_score := CASE 
    WHEN p_monetary >= 5000 THEN 5
    WHEN p_monetary >= 2000 THEN 4
    WHEN p_monetary >= 500 THEN 3
    WHEN p_monetary >= 100 THEN 2
    ELSE 1
  END;
  
  RETURN r_score::VARCHAR || f_score::VARCHAR || m_score::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- Função para detectar anomalias em perdas
CREATE OR REPLACE FUNCTION detectar_perda_critica(p_loja_id UUID, p_valor_perdido DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
  v_perda_media DECIMAL;
  v_desvio_padrao DECIMAL;
BEGIN
  SELECT AVG(valor_perdido), STDDEV(valor_perdido) INTO v_perda_media, v_desvio_padrao
  FROM perdas_desperdicio
  WHERE loja_id = p_loja_id
  AND data_registro > CURRENT_DATE - INTERVAL '30 days';
  
  -- Crítico se > 2 desvios padrão acima da média
  RETURN p_valor_perdido > (v_perda_media + 2 * COALESCE(v_desvio_padrao, 0));
END;
$$ LANGUAGE plpgsql;
