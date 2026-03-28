-- ═══════════════════════════════════════════════════════════════
-- Suporte a Múltiplas Lojas (Lojas/Franquias)
-- ═══════════════════════════════════════════════════════════════

-- ═══ TABELA: lojas ═══
-- Cada conta pode ter múltiplas lojas
create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  cnpj text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  telefone text,
  email text,
  responsavel text,
  status text default 'ativa', -- 'ativa' | 'inativa' | 'suspensa'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.lojas enable row level security;
drop policy if exists "lojas_own_select" on public.lojas;
drop policy if exists "lojas_own_insert" on public.lojas;
drop policy if exists "lojas_own_update" on public.lojas;
drop policy if exists "lojas_own_delete" on public.lojas;
create policy "lojas_own_select" on public.lojas for select using (auth.uid() = user_id);
create policy "lojas_own_insert" on public.lojas for insert with check (auth.uid() = user_id);
create policy "lojas_own_update" on public.lojas for update using (auth.uid() = user_id);
create policy "lojas_own_delete" on public.lojas for delete using (auth.uid() = user_id);
create index if not exists idx_lojas_user on public.lojas(user_id);

-- ═══ TABELA: planos_lojas ═══
-- Definição dos planos com limite de lojas
create table if not exists public.planos_lojas (
  id text primary key, -- 'loja_1' | 'loja_2' | 'loja_3' | 'loja_rede'
  nome text not null,
  descricao text,
  max_lojas integer not null,
  preco_mensal numeric(10,2),
  features jsonb,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Populando planos padrão
insert into public.planos_lojas (id, nome, descricao, max_lojas, preco_mensal, features) values
  ('loja_1', '1 Loja', 'Plano básico para um único estabelecimento', 1, 99.90, '{"relatorios": true, "usuarios": 1, "integracao_nfe": false}'::jsonb),
  ('loja_2', '2 Lojas', 'Para expandir com uma segunda unidade', 2, 149.90, '{"relatorios": true, "usuarios": 2, "integracao_nfe": true}'::jsonb),
  ('loja_3', '3 Lojas', 'Ideal para pequenas redes', 3, 199.90, '{"relatorios": true, "usuarios": 3, "integracao_nfe": true}'::jsonb),
  ('loja_rede', 'Rede Completa', 'Para franquias e redes de qualquer tamanho', 999, 399.90, '{"relatorios": true, "usuarios": 10, "integracao_nfe": true, "api_acesso": true}'::jsonb)
on conflict do nothing;

-- ═══ ATUALIZAR SUBSCRIPTIONS ═══
-- Adicionar coluna de plano de lojas
alter table public.subscriptions add column if not exists plano_lojas text references public.planos_lojas(id) default 'loja_1';

-- ═══ ATUALIZAR TRIPS ═══
-- Adicionar referência à loja
alter table public.trips add column if not exists loja_id uuid references public.lojas(id) on delete set null;
create index if not exists idx_trips_loja on public.trips(loja_id);

-- ═══ ATUALIZAR EXPENSES ═══
-- Adicionar referência à loja
alter table public.expenses add column if not exists loja_id uuid references public.lojas(id) on delete set null;
create index if not exists idx_expenses_loja on public.expenses(loja_id);

-- ═══ ATUALIZAR FUEL_LOGS ═══
-- Adicionar referência à loja
alter table public.fuel_logs add column if not exists loja_id uuid references public.lojas(id) on delete set null;
create index if not exists idx_fuel_loja on public.fuel_logs(loja_id);

-- ═══ ATUALIZAR VEHICLE_MAINTENANCE ═══
-- Adicionar referência à loja
alter table public.vehicle_maintenance add column if not exists loja_id uuid references public.lojas(id) on delete set null;
create index if not exists idx_maint_loja on public.vehicle_maintenance(loja_id);

-- ═══ ATUALIZAR DRIVER_TASKS ═══
-- Adicionar referência à loja
alter table public.driver_tasks add column if not exists loja_id uuid references public.lojas(id) on delete set null;
create index if not exists idx_tasks_loja on public.driver_tasks(loja_id);

-- ═══ TABELA: usuarios_lojas ═══
-- Mapear usuários para lojas (para gerenciadores)
create table if not exists public.usuarios_lojas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  loja_id uuid not null references public.lojas(id) on delete cascade,
  role text default 'gerente', -- 'proprietario' | 'gerente' | 'funcionario'
  created_at timestamptz default now(),
  unique(user_id, loja_id)
);

alter table public.usuarios_lojas enable row level security;
drop policy if exists "usuarios_lojas_own" on public.usuarios_lojas;
create policy "usuarios_lojas_own" on public.usuarios_lojas for select using (auth.uid() = user_id);
create index if not exists idx_usuarios_lojas_user on public.usuarios_lojas(user_id);
create index if not exists idx_usuarios_lojas_loja on public.usuarios_lojas(loja_id);
