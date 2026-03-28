-- ═══════════════════════════════════════════════════════════════
-- Smart Market - Modelo de Licença por Loja
-- 1 LOJA = 1 LICENÇA = 1 ASSINATURA
-- ═══════════════════════════════════════════════════════════════

-- ═══ REMOVER coluna de plano_lojas da subscriptions ═══
-- A subscrição agora está vinculada diretamente à loja
alter table public.subscriptions drop column if exists plano_lojas;

-- ═══ ATUALIZAR SUBSCRIPTIONS ═══
-- Vincular subscrição a uma loja específica em vez de apenas ao usuário
alter table public.subscriptions add column if not exists loja_id uuid references public.lojas(id) on delete cascade;
alter table public.subscriptions drop constraint if exists unique_subscription_user;
-- Nova constraint: um usuário pode ter múltiplas assinaturas (uma por loja)
create unique index if not exists idx_sub_loja_user on public.subscriptions(loja_id, user_id) where status = 'active';
create index if not exists idx_sub_loja on public.subscriptions(loja_id);

-- ═══ TABELA: planos_lojas (simplificada) ═══
-- Apenas tipos de plano, não limites
drop table if exists public.planos_lojas cascade;
create table if not exists public.planos_lojas (
  id text primary key,
  nome text not null,
  descricao text,
  preco_mensal numeric(10,2),
  preco_anual numeric(10,2),
  features jsonb,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Recriar planos padrão (simplificados)
insert into public.planos_lojas (id, nome, descricao, preco_mensal, preco_anual, features) values
  ('starter', 'Starter', 'Para começar seu negócio', 99.90, 999.00, '{"previsao_vendas": true, "estoque_basico": true, "usuarios": 1}'::jsonb),
  ('professional', 'Professional', 'Para crescimento', 199.90, 1999.00, '{"previsao_vendas": true, "estoque_avancado": true, "rfm_scoring": true, "usuarios": 3}'::jsonb),
  ('enterprise', 'Enterprise', 'Para grandes operações', 499.90, 4999.00, '{"previsao_vendas": true, "estoque_avancado": true, "rfm_scoring": true, "anomalia_deteccao": true, "api_acesso": true, "usuarios": 10}'::jsonb)
on conflict do nothing;

-- ═══ ATUALIZAR SUBSCRIPTIONS com plano (novo) ═══
alter table public.subscriptions add column if not exists plano text references public.planos_lojas(id);
alter table public.subscriptions add column if not exists preco_mensal numeric(10,2);
alter table public.subscriptions add column if not exists cobranca_anual boolean default false;
alter table public.subscriptions add column if not exists proxima_cobranca date;

-- ═══ TABELA: usuarios_lojas (permissões por loja) ═══
-- Quem pode acessar qual loja
drop table if exists public.usuarios_lojas cascade;
create table if not exists public.usuarios_lojas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loja_id uuid not null references public.lojas(id) on delete cascade,
  role text default 'gerente', -- 'proprietario' | 'gerente' | 'consultor'
  acesso_desde timestamptz default now(),
  acesso_ate timestamptz,
  created_at timestamptz default now(),
  unique(user_id, loja_id)
);

alter table public.usuarios_lojas enable row level security;
drop policy if exists "usuarios_lojas_own" on public.usuarios_lojas;
create policy "usuarios_lojas_own" on public.usuarios_lojas for select using (auth.uid() = user_id);
create index if not exists idx_usuarios_lojas_user on public.usuarios_lojas(user_id);
create index if not exists idx_usuarios_lojas_loja on public.usuarios_lojas(loja_id);

-- ═══ TABELA: lojas_dados ═══
-- Dados analíticos por loja (cache de métricas)
create table if not exists public.lojas_dados (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  mes date not null, -- primeiro dia do mês (2025-01-01, 2025-02-01, etc)
  vendas_total numeric(15,2),
  vendas_prevista numeric(15,2),
  estoque_total numeric(15,2),
  estoque_valor numeric(15,2),
  ticket_medio numeric(10,2),
  clientes_total integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(loja_id, mes)
);

create index if not exists idx_lojas_dados_mes on public.lojas_dados(loja_id, mes);

-- ═══ TABELA: auditoria_lojas ═══
-- Log de acessos e mudanças
create table if not exists public.auditoria_lojas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  acao text, -- 'login' | 'editar_loja' | 'criar_previncao' | etc
  detalhes jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_auditoria_loja on public.auditoria_lojas(loja_id);
create index if not exists idx_auditoria_user on public.auditoria_lojas(user_id);
create index if not exists idx_auditoria_data on public.auditoria_lojas(created_at);

-- ═══ POLÍTICAS RLS ATUALIZADAS ═══
-- lojas: qualquer usuário pode ver apenas suas próprias lojas
alter table public.lojas enable row level security;
drop policy if exists "lojas_own_select" on public.lojas;
drop policy if exists "lojas_own_insert" on public.lojas;
drop policy if exists "lojas_own_update" on public.lojas;
drop policy if exists "lojas_own_delete" on public.lojas;

create policy "lojas_select" on public.lojas for select
  using (
    auth.uid() = user_id OR
    auth.uid() IN (select user_id from public.usuarios_lojas where loja_id = lojas.id)
  );

create policy "lojas_insert" on public.lojas for insert
  with check (auth.uid() = user_id);

create policy "lojas_update" on public.lojas for update
  using (
    auth.uid() = user_id OR
    auth.uid() IN (select user_id from public.usuarios_lojas where loja_id = lojas.id and role = 'proprietario')
  );

create policy "lojas_delete" on public.lojas for delete
  using (auth.uid() = user_id);

-- subscriptions: acesso à própria subscrição
alter table public.subscriptions enable row level security;
drop policy if exists "sub_own" on public.subscriptions;
drop policy if exists "sub_loja_access" on public.subscriptions;

create policy "sub_own" on public.subscriptions for select
  using (
    auth.uid() = user_id OR
    auth.uid() IN (select user_id from public.usuarios_lojas where loja_id = subscriptions.loja_id)
  );
