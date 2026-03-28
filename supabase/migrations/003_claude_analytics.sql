-- ═══════════════════════════════════════════════════════════════
-- Smart Market - Integração Claude AI para Análises Preditivas
-- Previsão de Vendas, RFM Scoring, Detecção de Anomalias
-- ═══════════════════════════════════════════════════════════════

-- ═══ TABELA: lojas_analises ═══
-- Armazena análises feitas pela Claude AI
create table if not exists public.lojas_analises (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  mes date not null, -- primeiro dia do mês
  tipo_analise text not null, -- 'previsao_vendas_rfm' | 'estoque_otimizacao' | 'anomalia_deteccao'
  resultado jsonb, -- { analysis, timestamp, conclusoes }
  tokens_usados integer,
  custo_tokens numeric(10,4), -- em USD
  status text default 'completa', -- 'completa' | 'erro'
  erro_mensagem text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.lojas_analises enable row level security;
drop policy if exists "analises_own_select" on public.lojas_analises;
create policy "analises_own_select" on public.lojas_analises for select
  using (
    auth.uid() IN (select user_id from public.lojas where id = loja_id)
  );

create index if not exists idx_analises_loja on public.lojas_analises(loja_id);
create index if not exists idx_analises_mes on public.lojas_analises(loja_id, mes);

-- ═══ TABELA: tokens_uso ═══
-- Rastreia uso de tokens por loja (para faturamento)
create table if not exists public.tokens_uso (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  data_uso date not null,
  tipo_uso text, -- 'analise_vendas' | 'rfm_scoring' | 'estoque' | 'anomalia'
  tokens_input integer,
  tokens_output integer,
  tokens_total integer,
  custo_usd numeric(10,4),
  requisicao_id text,
  created_at timestamptz default now()
);

create index if not exists idx_tokens_loja_data on public.tokens_uso(loja_id, data_uso);
create index if not exists idx_tokens_loja on public.tokens_uso(loja_id);

-- ═══ VIEW: resumo_tokens_mes ═══
-- Resumo mensal de tokens por loja
create or replace view public.tokens_mes_resumo as
select
  loja_id,
  date_trunc('month', data_uso)::date as mes,
  sum(tokens_total) as tokens_total,
  sum(custo_usd) as custo_mes_usd,
  count(*) as num_requisicoes
from public.tokens_uso
group by loja_id, date_trunc('month', data_uso);

-- ═══ TABELA: previsoes_vendas ═══
-- Cache de previsões para não refazer análises
create table if not exists public.previsoes_vendas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  mes date not null,
  proximos_7_dias numeric(15,2), -- valor previsto
  proximos_7_dias_confianca numeric(3,2), -- 0.75 = 75%
  proximos_14_dias numeric(15,2),
  proximos_14_dias_confianca numeric(3,2),
  proximos_30_dias numeric(15,2),
  proximos_30_dias_confianca numeric(3,2),
  realizado_valor numeric(15,2), -- atualizado depois que passa o período
  analise_id uuid references public.lojas_analises(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(loja_id, mes)
);

create index if not exists idx_previsoes_loja on public.previsoes_vendas(loja_id);

-- ═══ TABELA: rfm_scores ═══
-- Scores RFM dos clientes
create table if not exists public.rfm_scores (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  cliente_id text, -- ID do cliente externo
  recencia_dias integer, -- dias desde última compra
  frequencia integer, -- número de compras
  monetario numeric(15,2), -- gasto total
  segmento text, -- 'VIP' | 'Regular' | 'Em Risco' | 'Dorminhoco'
  score_r integer, -- 1-5
  score_f integer, -- 1-5
  score_m integer, -- 1-5
  analise_id uuid references public.lojas_analises(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_rfm_loja on public.rfm_scores(loja_id);
create index if not exists idx_rfm_segmento on public.rfm_scores(loja_id, segmento);

-- ═══ TABELA: alertas_sistema ═══
-- Alertas gerados pela análise (estoque baixo, clientes em risco, etc)
create table if not exists public.alertas_sistema (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  tipo_alerta text, -- 'estoque_baixo' | 'cliente_em_risco' | 'anomalia' | 'sazonalidade'
  severidade text default 'media', -- 'baixa' | 'media' | 'alta' | 'critica'
  titulo text,
  descricao text,
  acao_recomendada text,
  dados jsonb, -- { produto, quantidade, cliente_id, etc }
  lido boolean default false,
  resolvido boolean default false,
  analise_id uuid references public.lojas_analises(id),
  created_at timestamptz default now(),
  lido_em timestamptz,
  resolvido_em timestamptz
);

alter table public.alertas_sistema enable row level security;
drop policy if exists "alertas_own_select" on public.alertas_sistema;
create policy "alertas_own_select" on public.alertas_sistema for select
  using (
    auth.uid() IN (select user_id from public.lojas where id = loja_id)
  );

create index if not exists idx_alertas_loja on public.alertas_sistema(loja_id);
create index if not exists idx_alertas_lido on public.alertas_sistema(loja_id, lido);

-- ═══ FUNÇÃO: calcular_custo_tokens ═══
-- Calcula custo baseado em tokens (Claude Sonnet: ~$3 per 1M tokens)
create or replace function public.calcular_custo_tokens(tokens_input integer, tokens_output integer)
returns numeric as $$
declare
  -- Preços Claude 3.5 Sonnet (atualizar conforme Anthropic)
  preco_input constant numeric := 0.000003; -- $3 per 1M tokens
  preco_output constant numeric := 0.000015; -- $15 per 1M tokens
begin
  return (tokens_input * preco_input) + (tokens_output * preco_output);
end;
$$ language plpgsql immutable;

-- ═══ FUNÇÃO: registrar_uso_tokens ═══
-- Registra uso de tokens após cada análise
create or replace function public.registrar_uso_tokens(
  p_loja_id uuid,
  p_tokens_input integer,
  p_tokens_output integer,
  p_tipo_uso text
)
returns void as $$
begin
  insert into public.tokens_uso (
    loja_id, data_uso, tipo_uso, tokens_input, tokens_output, tokens_total, custo_usd
  ) values (
    p_loja_id,
    now()::date,
    p_tipo_uso,
    p_tokens_input,
    p_tokens_output,
    p_tokens_input + p_tokens_output,
    public.calcular_custo_tokens(p_tokens_input, p_tokens_output)
  );
end;
$$ language plpgsql;

-- ═══ POLÍTICA RLS para tokens_uso ═══
alter table public.tokens_uso enable row level security;
drop policy if exists "tokens_own_select" on public.tokens_uso;
create policy "tokens_own_select" on public.tokens_uso for select
  using (
    auth.uid() IN (select user_id from public.lojas where id = loja_id)
  );

-- ═══ COMENTÁRIOS ═══
comment on table lojas_analises is 'Análises completas feitas pela Claude AI (previsões, RFM, anomalias)';
comment on table tokens_uso is 'Rastreamento de tokens gastos para faturamento';
comment on table previsoes_vendas is 'Cache de previsões de vendas (não refazer análise)';
comment on table rfm_scores is 'Scores RFM individuais dos clientes';
comment on table alertas_sistema is 'Alertas automáticos gerados pelas análises';
