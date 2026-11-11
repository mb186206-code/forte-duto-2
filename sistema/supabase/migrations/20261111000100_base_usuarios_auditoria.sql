-- =====================================================================
-- FORTE DUTO — Gestão
-- Migração 1/4: base, perfis de usuário, funções de permissão e auditoria
-- =====================================================================
-- Convenções:
--   * Valores monetários: numeric(14,2). Nunca float/real.
--   * Datas de negócio: date. Momentos de sistema: timestamptz.
--   * Toda tabela de negócio tem created_at, updated_at, created_by.
--   * Exclusões físicas só por administrador; registros financeiros
--     normalmente são "cancelados", não apagados.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.app_role as enum ('admin', 'financeiro', 'operacional');

-- ---------------------------------------------------------------------
-- Função utilitária: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Perfis (1:1 com auth.users). A tabela "users" é a auth.users do
-- Supabase; não criamos uma cópia para não duplicar dados.
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  email       text not null default '',
  phone       text check (phone is null or char_length(phone) <= 30),
  role        public.app_role not null default 'operacional',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Perfil e função (papel) de cada usuário do sistema.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Funções de permissão (usadas pelas políticas RLS)
-- security definer para ler profiles sem recursão de RLS.
-- ---------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.active
$$;

create or replace function public.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = any (roles)
       from public.profiles p
      where p.id = auth.uid() and p.active),
    false)
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.active
  )
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.has_role(public.app_role[]) from public, anon;
revoke all on function public.is_active_user() from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.has_role(public.app_role[]) to authenticated;
grant execute on function public.is_active_user() to authenticated;

-- ---------------------------------------------------------------------
-- Criação automática do perfil quando um usuário é criado no Auth.
-- O PRIMEIRO usuário do sistema vira administrador; os demais entram
-- como "operacional" até um administrador alterar a função.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  -- trava para evitar dois "primeiros administradores" simultâneos
  perform pg_advisory_xact_lock(hashtext('forte_duto_first_admin'));

  if exists (select 1 from public.profiles where role = 'admin') then
    v_role := coalesce(
      nullif(new.raw_app_meta_data ->> 'role', '')::public.app_role,
      'operacional');
  else
    v_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    v_role
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém o e-mail do perfil igual ao do Auth
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Só administrador muda função/ativação; ninguém rebaixa o último admin.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Chamadas internas (service_role / SQL do painel) não têm auth.uid()
  if auth.uid() is null then
    return new;
  end if;

  if (new.role is distinct from old.role or new.active is distinct from old.active
      or new.email is distinct from old.email)
     and not public.has_role('admin') then
    raise exception 'Apenas administradores podem alterar função, situação ou e-mail de usuários.'
      using errcode = '42501';
  end if;

  if old.role = 'admin' and old.active
     and (new.role <> 'admin' or not new.active)
     and (select count(*) from public.profiles where role = 'admin' and active) <= 1 then
    raise exception 'O sistema precisa de pelo menos um administrador ativo.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------
-- Auditoria (histórico de alterações)
-- ---------------------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  table_name  text not null,
  record_id   text,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  changed_by  uuid references auth.users (id) on delete set null,
  changed_at  timestamptz not null default now()
);

comment on table public.audit_logs is 'Histórico de alterações gerado automaticamente por trigger. Somente leitura.';

create index audit_logs_table_record_idx on public.audit_logs (table_name, record_id);
create index audit_logs_changed_at_idx on public.audit_logs (changed_at desc);
create index audit_logs_changed_by_idx on public.audit_logs (changed_by);

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_id  text;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new); end if;

  -- não registra UPDATE que não mudou nada além de updated_at
  if tg_op = 'UPDATE' and (v_old - 'updated_at') = (v_new - 'updated_at') then
    return new;
  end if;

  v_id := coalesce(v_new ->> 'id', v_old ->> 'id');

  insert into public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
  values (tg_table_name, v_id, tg_op, v_old, v_new, auth.uid());

  return coalesce(new, old);
end;
$$;

create trigger profiles_audit
  after insert or update or delete on public.profiles
  for each row execute function public.audit_trigger();

-- ---------------------------------------------------------------------
-- RLS: perfis e auditoria
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- Todo usuário ativo vê a equipe (nome/função), para atribuir responsáveis.
create policy "profiles: equipe ativa pode ler"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_active_user());

create policy "profiles: usuário edita o próprio perfil"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin edita qualquer perfil"
  on public.profiles for update to authenticated
  using (public.has_role('admin'))
  with check (public.has_role('admin'));

-- Inserção só via trigger (auth.users); exclusão só removendo o usuário do Auth.

create policy "audit_logs: somente admin lê"
  on public.audit_logs for select to authenticated
  using (public.has_role('admin'));
