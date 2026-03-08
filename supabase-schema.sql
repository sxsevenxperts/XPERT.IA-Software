-- ============================================================
-- XPERT.IA — Schema completo do Supabase
-- Execute no SQL Editor do projeto vyvdrbkcrvklcaombjqu
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  evo_instance  text,
  criado_em     timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles: owner" on public.profiles;
create policy "profiles: owner" on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. AGENTE_CONFIG
-- ============================================================
create table if not exists public.agente_config (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  chave     text not null,
  valor     text,
  unique (user_id, chave)
);

alter table public.agente_config enable row level security;
drop policy if exists "agente_config: owner" on public.agente_config;
create policy "agente_config: owner" on public.agente_config
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 3. USUARIOS_EXTRAS (membros da equipe)
-- DEVE vir antes de leads por causa da FK membro_id
-- ============================================================
create table if not exists public.usuarios_extras (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  nome                text not null,
  cor                 text default '#6366f1',
  ativo               boolean not null default true,
  numero_atribuido    text,
  ultimo_atendimento  timestamptz,
  criado_em           timestamptz not null default now()
);

alter table public.usuarios_extras enable row level security;
drop policy if exists "usuarios_extras: owner" on public.usuarios_extras;
create policy "usuarios_extras: owner" on public.usuarios_extras
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists ue_owner_ativo on public.usuarios_extras(owner_id, ativo);
create index if not exists ue_round_robin on public.usuarios_extras(owner_id, ultimo_atendimento asc nulls first);

-- Adiciona colunas se a tabela já existir sem elas
alter table public.usuarios_extras add column if not exists numero_atribuido   text;
alter table public.usuarios_extras add column if not exists ultimo_atendimento timestamptz;

-- ============================================================
-- 4. LEADS
-- ============================================================
create table if not exists public.leads (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  numero_whatsapp         text not null,
  nome                    text,
  celular                 text,
  tese                    text,
  resumo                  text,
  notas                   text,
  data_aniversario        date,
  qualificado             boolean,
  motivo_desqualificacao  text,
  stage                   text not null default 'novo_contato',
  score                   int  default 0 check (score >= 0 and score <= 100),
  membro_id               uuid references public.usuarios_extras(id) on delete set null,
  fluxo_id                uuid,
  criado_em               timestamptz not null default now(),
  atualizado_em           timestamptz not null default now(),
  unique (user_id, numero_whatsapp)
);

alter table public.leads enable row level security;
drop policy if exists "leads: owner" on public.leads;
create policy "leads: owner" on public.leads
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists leads_user_stage on public.leads(user_id, stage);
create index if not exists leads_user_score on public.leads(user_id, score desc);
create index if not exists leads_numero     on public.leads(user_id, numero_whatsapp);

-- Adiciona colunas se a tabela já existir sem elas
alter table public.leads add column if not exists score     int default 0;
alter table public.leads add column if not exists membro_id uuid references public.usuarios_extras(id) on delete set null;

-- ============================================================
-- 5. LEAD_TAREFAS
-- ============================================================
create table if not exists public.lead_tarefas (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.leads(id) on delete cascade,
  descricao       text not null,
  data_vencimento date,
  concluida       boolean not null default false,
  prioridade      text default 'media',
  criado_por      text default 'usuario',
  criado_em       timestamptz not null default now()
);

alter table public.lead_tarefas enable row level security;
drop policy if exists "lead_tarefas: owner via lead" on public.lead_tarefas;
create policy "lead_tarefas: owner via lead" on public.lead_tarefas
  using (
    exists (
      select 1 from public.leads
      where leads.id = lead_tarefas.lead_id
        and leads.user_id = auth.uid()
    )
  );

create index if not exists lead_tarefas_lead on public.lead_tarefas(lead_id);
create index if not exists lead_tarefas_venc on public.lead_tarefas(data_vencimento) where not concluida;

-- Adiciona colunas se a tabela já existir sem elas
alter table public.lead_tarefas add column if not exists prioridade text default 'media';
alter table public.lead_tarefas add column if not exists criado_por text default 'usuario';

-- ============================================================
-- 6. SESSOES
-- ============================================================
create table if not exists public.sessoes (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  numero_whatsapp  text not null,
  historico        jsonb not null default '[]',
  agente_pausado   boolean not null default false,
  pausado_em       timestamptz,
  atualizado_em    timestamptz not null default now(),
  unique (user_id, numero_whatsapp)
);

alter table public.sessoes enable row level security;
drop policy if exists "sessoes: owner" on public.sessoes;
create policy "sessoes: owner" on public.sessoes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists sessoes_numero on public.sessoes(user_id, numero_whatsapp);

-- ============================================================
-- 7. FLUXOS
-- ============================================================
create table if not exists public.fluxos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  nome          text not null,
  descricao     text,
  dados         jsonb,
  atualizado_em timestamptz not null default now(),
  criado_em     timestamptz not null default now()
);

alter table public.fluxos enable row level security;
drop policy if exists "fluxos: owner" on public.fluxos;
create policy "fluxos: owner" on public.fluxos
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 8. DOCUMENTOS_CONHECIMENTO (RAG)
-- ============================================================
create table if not exists public.documentos_conhecimento (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  content   text,
  metadata  jsonb,
  embedding vector(1536)
);

alter table public.documentos_conhecimento enable row level security;
drop policy if exists "documentos: owner" on public.documentos_conhecimento;
create policy "documentos: owner" on public.documentos_conhecimento
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists doc_user on public.documentos_conhecimento(user_id);
create index if not exists doc_embedding_hnsw
  on public.documentos_conhecimento
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ============================================================
-- 9. TOKENS_CREDITOS
-- ============================================================
create table if not exists public.tokens_creditos (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade unique,
  saldo_tokens  int  not null default 0,
  atualizado_em timestamptz not null default now()
);

alter table public.tokens_creditos enable row level security;
drop policy if exists "tokens: owner" on public.tokens_creditos;
create policy "tokens: owner" on public.tokens_creditos
  using (auth.uid() = user_id);

-- ============================================================
-- 10. PEDIDOS_CREDITOS
-- ============================================================
create table if not exists public.pedidos_creditos (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  pacote    text not null,
  status    text not null default 'pendente',
  obs_admin text,
  criado_em timestamptz not null default now()
);

alter table public.pedidos_creditos enable row level security;
drop policy if exists "pedidos: owner" on public.pedidos_creditos;
create policy "pedidos: owner" on public.pedidos_creditos
  using (auth.uid() = user_id);

-- ============================================================
-- 11. ASSINATURAS
-- ============================================================
create table if not exists public.assinaturas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade unique,
  plano       text,
  status      text default 'ativo',
  validade_em timestamptz,
  criado_em   timestamptz not null default now()
);

alter table public.assinaturas enable row level security;
drop policy if exists "assinaturas: owner" on public.assinaturas;
create policy "assinaturas: owner" on public.assinaturas
  using (auth.uid() = user_id);

-- ============================================================
-- 12. HISTORICO_COBRANCAS
-- ============================================================
create table if not exists public.historico_cobrancas (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  descricao text,
  valor     numeric(10,2),
  status    text default 'pago',
  criado_em timestamptz not null default now()
);

alter table public.historico_cobrancas enable row level security;
drop policy if exists "cobrancas: owner" on public.historico_cobrancas;
create policy "cobrancas: owner" on public.historico_cobrancas
  using (auth.uid() = user_id);

-- ============================================================
-- RPCs para o n8n (security definer = bypassa RLS)
-- ============================================================

create or replace function public.get_profile_by_instance(p_instance text)
returns setof public.profiles
language sql security definer as $$
  select * from public.profiles where evo_instance = p_instance limit 1;
$$;

create or replace function public.get_agente_config(p_user_id uuid)
returns table(chave text, valor text)
language sql security definer as $$
  select chave, valor from public.agente_config where user_id = p_user_id;
$$;

create or replace function public.get_token_balance(p_user_id uuid)
returns int
language sql security definer as $$
  select coalesce(saldo_tokens, 0) from public.tokens_creditos where user_id = p_user_id;
$$;

create or replace function public.update_token_balance(p_user_id uuid, p_delta int)
returns void
language sql security definer as $$
  insert into public.tokens_creditos(user_id, saldo_tokens, atualizado_em)
  values (p_user_id, greatest(0, p_delta), now())
  on conflict (user_id) do update
    set saldo_tokens  = greatest(0, tokens_creditos.saldo_tokens + p_delta),
        atualizado_em = now();
$$;

create or replace function public.get_sessao(p_user_id uuid, p_numero text)
returns jsonb
language sql security definer as $$
  select historico from public.sessoes
  where user_id = p_user_id and numero_whatsapp = p_numero;
$$;

create or replace function public.upsert_sessao(p_user_id uuid, p_numero text, p_historico jsonb)
returns void
language sql security definer as $$
  insert into public.sessoes(user_id, numero_whatsapp, historico, atualizado_em)
  values (p_user_id, p_numero, p_historico, now())
  on conflict (user_id, numero_whatsapp) do update
    set historico = p_historico, atualizado_em = now();
$$;

create or replace function public.upsert_lead(
  p_user_id               uuid,
  p_numero_whatsapp       text,
  p_nome                  text    default null,
  p_celular               text    default null,
  p_tese                  text    default null,
  p_resumo                text    default null,
  p_qualificado           boolean default null,
  p_motivo_desqualificacao text   default null,
  p_stage                 text    default null,
  p_score                 int     default null,
  p_membro_id             uuid    default null
)
returns uuid
language plpgsql security definer as $$
declare v_id uuid;
begin
  insert into public.leads(
    user_id, numero_whatsapp, nome, celular, tese, resumo,
    qualificado, motivo_desqualificacao, stage, score, membro_id, atualizado_em
  ) values (
    p_user_id, p_numero_whatsapp,
    nullif(p_nome,''), nullif(p_celular,''), nullif(p_tese,''), nullif(p_resumo,''),
    p_qualificado, nullif(p_motivo_desqualificacao,''),
    coalesce(p_stage,'novo_contato'), coalesce(p_score,0), p_membro_id, now()
  )
  on conflict (user_id, numero_whatsapp) do update set
    nome                   = coalesce(nullif(excluded.nome,''),                  leads.nome),
    celular                = coalesce(nullif(excluded.celular,''),               leads.celular),
    tese                   = coalesce(nullif(excluded.tese,''),                  leads.tese),
    resumo                 = coalesce(nullif(excluded.resumo,''),                leads.resumo),
    qualificado            = coalesce(excluded.qualificado,                      leads.qualificado),
    motivo_desqualificacao = coalesce(nullif(excluded.motivo_desqualificacao,''), leads.motivo_desqualificacao),
    stage                  = coalesce(excluded.stage,                            leads.stage),
    score                  = greatest(leads.score, coalesce(excluded.score,0)),
    membro_id              = coalesce(excluded.membro_id,                        leads.membro_id),
    atualizado_em          = now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.create_lead_tarefa(
  p_user_id         uuid,
  p_numero_whatsapp text,
  p_descricao       text,
  p_prazo           date default null,
  p_prioridade      text default 'media'
)
returns uuid
language plpgsql security definer as $$
declare
  v_lead_id   uuid;
  v_tarefa_id uuid;
begin
  select id into v_lead_id
  from public.leads
  where user_id = p_user_id and numero_whatsapp = p_numero_whatsapp
  limit 1;

  if v_lead_id is null then return null; end if;

  insert into public.lead_tarefas(lead_id, descricao, data_vencimento, prioridade, criado_por)
  values (v_lead_id, p_descricao, p_prazo, p_prioridade, 'agente_ia')
  returning id into v_tarefa_id;

  return v_tarefa_id;
end;
$$;

create or replace function public.registra_novo_contato(p_user_id uuid, p_numero_whatsapp text)
returns void
language sql security definer as $$
  insert into public.leads(user_id, numero_whatsapp, stage, atualizado_em)
  values (p_user_id, p_numero_whatsapp, 'novo_contato', now())
  on conflict (user_id, numero_whatsapp) do nothing;
$$;

-- ============================================================
-- GRANTS (anon = chave pública usada pelo n8n)
-- ============================================================
grant usage on schema public to anon, authenticated;
grant execute on function public.get_profile_by_instance  to anon;
grant execute on function public.get_agente_config        to anon;
grant execute on function public.get_token_balance        to anon;
grant execute on function public.update_token_balance     to anon;
grant execute on function public.get_sessao               to anon;
grant execute on function public.upsert_sessao            to anon;
grant execute on function public.upsert_lead              to anon;
grant execute on function public.create_lead_tarefa       to anon;
grant execute on function public.registra_novo_contato    to anon;
