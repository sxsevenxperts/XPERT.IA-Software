-- EasyDrive — Setup minimalista do Supabase
-- Cole tudo no SQL Editor e clique "Run"

-- 1. Criar tabela de assinaturas
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text default 'trial',
  status text default 'active',
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- 2. Ativar RLS
alter table public.subscriptions enable row level security;

-- 3. Limpar policies antigas (se existem)
drop policy if exists "view_own" on public.subscriptions;
drop policy if exists "admin_all" on public.subscriptions;

-- 4. Criar policies
create policy "view_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "admin_all" on public.subscriptions for all using (auth.role() = 'service_role');

-- 5. Criar função para trial automático
create or replace function public.new_user_trial()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status, expires_at)
  values (new.id, 'trial', 'active', now() + interval '7 days');
  return new;
end;
$$ language plpgsql security definer;

-- 6. Criar trigger
drop trigger if exists new_user_trial on auth.users;
create trigger new_user_trial after insert on auth.users
for each row execute function public.new_user_trial();

-- 7. Criar índice
create index if not exists idx_sub_user on public.subscriptions(user_id);

-- ✅ PRONTO! Agora o EasyDrive funciona com login + assinatura
