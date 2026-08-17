-- PrevOS canonical backend
-- This migration closes the gaps left by the legacy demo schema and adds the
-- real operational entities used by the application. It is intentionally
-- additive so existing installations can migrate without losing data.

create schema if not exists private;

-- Legacy migration compatibility: add_login_to_usuarios_extras.sql runs after
-- this migration and expects the table to exist.
create table if not exists public.usuarios_extras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  login_usuario varchar(255),
  senha_usuario varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.usuarios_extras enable row level security;
drop policy if exists usuarios_extras_owner on public.usuarios_extras;
create policy usuarios_extras_owner on public.usuarios_extras
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- -------------------------------------------------------------------------
-- Profiles and shared primitives
-- -------------------------------------------------------------------------

alter table public.profiles add column if not exists role text default 'advogado';
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists telefone text;
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists ativo boolean not null default true;

alter table public.clientes add column if not exists data_nascimento date;
alter table public.clientes add column if not exists endereco text;
alter table public.clientes add column if not exists cidade text;
alter table public.clientes add column if not exists estado text;
alter table public.clientes add column if not exists benefit text;
alter table public.clientes add column if not exists advogado text;

alter table public.casos add column if not exists advogado text;
alter table public.casos add column if not exists data_prazo date;
alter table public.casos add column if not exists data_abertura date default current_date;
alter table public.casos add column if not exists encerrado_em timestamptz;

alter table public.honorarios add column if not exists pago_em date;
alter table public.honorarios add column if not exists cliente_nome text;
alter table public.honorarios add column if not exists tipo text default 'exito';
alter table public.honorarios add column if not exists vencimento date;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'usuarios_extras', 'clientes', 'casos', 'tarefas', 'alertas',
    'templates', 'notification_settings', 'notification_log',
    'notification_queue', 'contact_info', 'calendar_integrations',
    'calendar_events', 'case_predictions', 'portal_integrations',
    'processo_status', 'agenda_eventos', 'intimacoes', 'conversas',
    'mensagens', 'reunioes', 'documentos_assinatura', 'planejamentos',
    'relatorios_gerados', 'laudos', 'peticoes'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists trg_set_updated_at on public.%I', table_name);
      execute format('create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
    end if;
  end loop;
end $$;

-- Small read-only table used by the external keep-alive job.
create table if not exists public.app_health (
  id integer primary key check (id = 1),
  updated_at timestamptz not null default now()
);

insert into public.app_health (id) values (1) on conflict (id) do nothing;
alter table public.app_health enable row level security;
drop policy if exists app_health_public_read on public.app_health;
create policy app_health_public_read on public.app_health
  for select to anon, authenticated using (id = 1);
grant select on public.app_health to anon, authenticated;

-- New users always get an application profile. The function is private and is
-- only callable by the Auth trigger, never through the Data API.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.profiles (id, email, name, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', new.email), coalesce(new.raw_user_meta_data ->> 'name', new.email))
  on conflict (id) do update set email = excluded.email;

  insert into public.contact_info (user_id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -------------------------------------------------------------------------
-- Operational modules
-- -------------------------------------------------------------------------

create table if not exists public.agenda_eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caso_id uuid references public.casos(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  tipo text not null default 'reuniao' check (tipo in ('audiencia', 'prazo', 'reuniao', 'pericia', 'protocolo', 'outro')),
  titulo text not null,
  descricao text,
  data_inicio timestamptz not null,
  data_fim timestamptz,
  local text,
  status text not null default 'agendado' check (status in ('agendado', 'concluido', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intimacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caso_id uuid references public.casos(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  numero_processo text,
  tribunal text,
  vara text,
  tipo text not null,
  data_publicacao date,
  prazo date,
  descricao text,
  lida boolean not null default false,
  status text not null default 'pendente' check (status in ('pendente', 'urgente', 'em_prazo', 'concluida')),
  urgencia text not null default 'media' check (urgencia in ('critica', 'alta', 'media', 'baixa')),
  origem text default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reunioes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  caso_id uuid references public.casos(id) on delete set null,
  cliente_id uuid references public.clientes(id) on delete set null,
  titulo text not null,
  data_inicio timestamptz not null,
  duracao_minutos integer not null default 30 check (duracao_minutos > 0),
  participantes jsonb not null default '[]'::jsonb,
  status text not null default 'proxima' check (status in ('proxima', 'realizada', 'cancelada')),
  link text,
  provider text check (provider in ('google_meet', 'zoom', 'teams', 'outro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  caso_id uuid references public.casos(id) on delete set null,
  status text not null default 'aberta' check (status in ('aberta', 'arquivada')),
  ultima_mensagem_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  remetente text not null check (remetente in ('advogado', 'cliente', 'sistema')),
  conteudo text not null,
  enviada_em timestamptz not null default now(),
  lida_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.documentos_assinatura (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  caso_id uuid references public.casos(id) on delete set null,
  nome text not null,
  tipo text not null default 'outro',
  status text not null default 'rascunho' check (status in ('rascunho', 'pendente', 'assinado', 'expirado', 'cancelado')),
  storage_path text,
  participantes jsonb not null default '[]'::jsonb,
  criado_em timestamptz not null default now(),
  assinado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.planejamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  caso_id uuid references public.casos(id) on delete set null,
  nome text not null,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.relatorios_gerados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  parametros jsonb not null default '{}'::jsonb,
  resultado jsonb not null default '{}'::jsonb,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.laudos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  caso_id uuid references public.casos(id) on delete set null,
  nome_arquivo text not null,
  mime_type text,
  storage_path text,
  analise text,
  status text not null default 'pendente' check (status in ('pendente', 'processando', 'concluido', 'erro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.peticoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  caso_id uuid references public.casos(id) on delete set null,
  tipo text not null,
  dados jsonb not null default '{}'::jsonb,
  conteudo text,
  status text not null default 'rascunho' check (status in ('rascunho', 'gerada', 'revisada', 'finalizada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public legal reference data is read-only. It starts empty and is populated
-- only by an authorized ingestion process, never with fake demo records.
create table if not exists public.base_juridica (
  id uuid primary key default gen_random_uuid(),
  tribunal text,
  identificador text not null,
  tipo text not null,
  area text,
  titulo text not null,
  ementa text,
  fonte_url text,
  publicado boolean not null default false,
  data_publicacao date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (identificador, tipo)
);

-- -------------------------------------------------------------------------
-- RLS for new user-scoped tables
-- -------------------------------------------------------------------------

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'agenda_eventos', 'intimacoes', 'reunioes', 'conversas',
    'documentos_assinatura', 'planejamentos', 'relatorios_gerados',
    'laudos', 'peticoes'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_owner', table_name);
    execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_owner', table_name);
  end loop;
end $$;

alter table public.mensagens enable row level security;
drop policy if exists mensagens_conversa_owner on public.mensagens;
create policy mensagens_conversa_owner on public.mensagens
  for all to authenticated
  using (exists (select 1 from public.conversas c where c.id = conversa_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.conversas c where c.id = conversa_id and c.user_id = (select auth.uid())));

alter table public.base_juridica enable row level security;
drop policy if exists base_juridica_public_read on public.base_juridica;
create policy base_juridica_public_read on public.base_juridica
  for select to anon, authenticated using (publicado = true);

-- -------------------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------------------

create index if not exists idx_agenda_eventos_user_date on public.agenda_eventos(user_id, data_inicio);
create index if not exists idx_intimacoes_user_prazo on public.intimacoes(user_id, prazo);
create index if not exists idx_intimacoes_unread on public.intimacoes(user_id, lida);
create index if not exists idx_reunioes_user_date on public.reunioes(user_id, data_inicio);
create index if not exists idx_conversas_user on public.conversas(user_id, ultima_mensagem_em desc);
create index if not exists idx_mensagens_conversa on public.mensagens(conversa_id, enviada_em);
create index if not exists idx_documentos_assinatura_user on public.documentos_assinatura(user_id, created_at desc);
create index if not exists idx_planejamentos_user on public.planejamentos(user_id, updated_at desc);
create index if not exists idx_relatorios_user on public.relatorios_gerados(user_id, created_at desc);
create index if not exists idx_laudos_user on public.laudos(user_id, created_at desc);
create index if not exists idx_peticoes_user on public.peticoes(user_id, created_at desc);
create index if not exists idx_base_juridica_search on public.base_juridica(area, tribunal, tipo);

-- The tables above are created in this migration, so install their update
-- triggers after creation as well as for legacy tables handled earlier.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'agenda_eventos', 'intimacoes', 'reunioes', 'conversas',
    'documentos_assinatura', 'planejamentos', 'laudos', 'peticoes',
    'base_juridica'
  ] loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I', table_name);
    execute format('create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end $$;

-- -------------------------------------------------------------------------
-- Protected integration credentials. They are not exposed through PostgREST.
-- Edge Functions are the only application path allowed to use this table.
-- -------------------------------------------------------------------------

create table if not exists public.user_integrations (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  secret_ciphertext text not null,
  secret_iv text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

revoke all on schema private from public, anon, authenticated;
alter table public.user_integrations enable row level security;
revoke all on public.user_integrations from public, anon, authenticated;
grant all on public.user_integrations to service_role;

-- Legacy profile columns are kept for migration compatibility but are no
-- longer readable by browser roles. New credentials live above.
revoke select (claude_api_key, whatsapp_token, asaas_key, email_token, jusbrasil_key, tribunal_token)
  on public.profiles from anon, authenticated;

-- Storage buckets used by the real document flows.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('documentos', 'documentos', false, 52428800),
  ('laudos', 'laudos', false, 52428800),
  ('avatars', 'avatars', false, 5242880)
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit;

drop policy if exists documentos_owner on storage.objects;
create policy documentos_owner on storage.objects
  for all to authenticated
  using (bucket_id in ('documentos', 'laudos', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('documentos', 'laudos', 'avatars') and (storage.foldername(name))[1] = (select auth.uid())::text);
