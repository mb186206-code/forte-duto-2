-- =====================================================================
-- FORTE DUTO — Gestão
-- Migração 1/4: base e histórico de alterações
-- =====================================================================
-- Modelo de acesso (decisão do Daniel, 11/11/2026): o sistema NÃO tem
-- login individual. Só o servidor do sistema (Next.js) fala com o banco,
-- usando a chave secreta. O navegador nunca recebe chave do banco, e os
-- papéis "anon" e "authenticated" não têm acesso a nenhuma tabela.
--
-- Convenções:
--   * Valores monetários: numeric(14,2). Nunca float/real.
--   * Datas de negócio: date. Momentos de sistema: timestamptz.
--   * Toda tabela de negócio tem created_at e updated_at.
--   * Quem fez cada alteração vem do cabeçalho HTTP "x-app-user"
--     (nome digitado no celular), gravado no histórico.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

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
-- Quem está usando (nome enviado pelo sistema no cabeçalho x-app-user).
-- Fora de uma requisição da API (ex.: SQL do painel) devolve 'sistema'.
-- ---------------------------------------------------------------------
create or replace function public.current_actor()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(left(trim(current_setting('request.headers', true)::json ->> 'x-app-user'), 60), ''),
    'sistema')
$$;

-- ---------------------------------------------------------------------
-- Histórico de alterações
-- ---------------------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  table_name  text not null,
  record_id   text,
  action      text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  changed_by  text not null default 'sistema',
  changed_at  timestamptz not null default now()
);

comment on table public.audit_logs is 'Histórico de alterações gerado automaticamente por trigger.';

create index audit_logs_table_record_idx on public.audit_logs (table_name, record_id);
create index audit_logs_changed_at_idx on public.audit_logs (changed_at desc);

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
  values (tg_table_name, v_id, tg_op, v_old, v_new, public.current_actor());

  return coalesce(new, old);
end;
$$;

-- O histórico não pode ser alterado nem apagado
create or replace function public.audit_logs_readonly()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'O histórico de alterações não pode ser modificado.' using errcode = '42501';
end;
$$;

create trigger audit_logs_no_update
  before update or delete on public.audit_logs
  for each row execute function public.audit_logs_readonly();

alter table public.audit_logs enable row level security;
