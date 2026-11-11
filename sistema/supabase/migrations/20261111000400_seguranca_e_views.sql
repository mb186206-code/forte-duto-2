-- =====================================================================
-- FORTE DUTO — Gestão
-- Migração 4/4: segurança, views de saldo e Storage
-- =====================================================================
-- Sem login individual: SÓ o servidor do sistema acessa o banco, com a
-- chave secreta (papel service_role, que ignora o RLS). Os papéis públicos
-- "anon" e "authenticated" ficam sem nenhum acesso: RLS ligado em todas as
-- tabelas, nenhuma política para eles e privilégios revogados. Assim, mesmo
-- quem descobrir a URL do banco não lê nem grava nada.
-- =====================================================================

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

grant execute on function public.current_actor() to service_role;
grant execute on function public.set_updated_at() to service_role;
grant execute on function public.audit_trigger() to service_role;
grant execute on function public.convert_budget_to_service(uuid) to service_role;

-- ---------------------------------------------------------------------
-- Views de cálculo (security_invoker: obedecem ao RLS de quem consulta)
-- ---------------------------------------------------------------------

-- Saldo real de cada conta.
-- Saldo = saldo inicial
--       + receitas efetivadas (entrada na conta)
--       − despesas efetivadas (saída da conta)
--       + transferências recebidas − transferências enviadas
-- Só contam movimentos com settled_date >= opening_date (o saldo inicial
-- já representa tudo o que aconteceu antes dessa data).
create view public.account_balances
with (security_invoker = true) as
select
  a.id,
  a.name,
  a.type,
  a.active,
  a.opening_balance,
  a.opening_date,
  (a.opening_balance + coalesce(m.net, 0))::numeric(14,2) as balance
from public.accounts a
left join lateral (
  select sum(
           case
             when t.kind = 'receita' and t.account_id = a.id then t.amount
             when t.kind = 'despesa' and t.account_id = a.id then -t.amount
             when t.kind = 'transferencia' and t.to_account_id = a.id then t.amount
             when t.kind = 'transferencia' and t.account_id = a.id then -t.amount
             else 0
           end) as net
  from public.transactions t
  where t.status = 'efetivado'
    and t.settled_date >= a.opening_date
    and (t.account_id = a.id or t.to_account_id = a.id)
) m on true;

comment on view public.account_balances is 'Saldo atual de cada conta (dinheiro real).';

-- Saldo de cada fundo e percentual da meta
create view public.fund_balances
with (security_invoker = true) as
select
  f.id,
  f.name,
  f.description,
  f.active,
  f.target_amount,
  f.target_date,
  f.account_id,
  coalesce(sum(case m.kind when 'deposito' then m.amount end), 0)::numeric(14,2) as total_deposits,
  coalesce(sum(case m.kind when 'retirada' then m.amount end), 0)::numeric(14,2) as total_withdrawals,
  coalesce(sum(case m.kind when 'deposito' then m.amount else -m.amount end), 0)::numeric(14,2) as balance,
  case
    when f.target_amount is null or f.target_amount = 0 then null
    else round(coalesce(sum(case m.kind when 'deposito' then m.amount else -m.amount end), 0) * 100 / f.target_amount, 1)
  end as target_percent
from public.funds f
left join public.fund_movements m on m.fund_id = f.id
group by f.id;

comment on view public.fund_balances is 'Saldo reservado em cada fundo. Fundos são reservas dentro do saldo real, não contas.';

-- Posição financeira consolidada (uma linha)
create view public.financial_position
with (security_invoker = true) as
select
  coalesce((select sum(balance) from public.account_balances), 0)::numeric(14,2) as available_balance,
  coalesce((select sum(balance) from public.fund_balances), 0)::numeric(14,2)    as reserved_balance,
  (coalesce((select sum(balance) from public.account_balances), 0)
   - coalesce((select sum(balance) from public.fund_balances), 0))::numeric(14,2) as free_balance,
  coalesce((select sum(amount) from public.transactions where kind = 'receita' and status = 'pendente'), 0)::numeric(14,2) as receivable,
  coalesce((select sum(amount) from public.transactions where kind = 'despesa' and status = 'pendente'), 0)::numeric(14,2) as payable;

comment on view public.financial_position is 'Saldo disponível (contas), reservado (fundos), dinheiro livre, a receber e a pagar.';

-- Totais de orçamento
create view public.budget_totals
with (security_invoker = true) as
select
  b.id as budget_id,
  coalesce(sum(i.total) filter (where i.kind = 'material'), 0)::numeric(14,2)     as materials_total,
  coalesce(sum(i.total) filter (where i.kind = 'mao_de_obra'), 0)::numeric(14,2)  as labor_total,
  coalesce(sum(i.total) filter (where i.kind = 'outro'), 0)::numeric(14,2)        as other_total,
  coalesce(sum(i.total), 0)::numeric(14,2)                                        as subtotal,
  b.discount,
  greatest(coalesce(sum(i.total), 0) - b.discount, 0)::numeric(14,2)              as total
from public.budgets b
left join public.budget_items i on i.budget_id = b.id
group by b.id;

-- Custos de cada serviço
create view public.service_costs
with (security_invoker = true) as
select
  s.id as service_id,
  coalesce(sum(i.total) filter (where i.kind = 'material'), 0)::numeric(14,2)    as material_cost,
  coalesce(sum(i.total) filter (where i.kind = 'mao_de_obra'), 0)::numeric(14,2) as labor_cost,
  coalesce(sum(i.total) filter (where i.kind = 'outro'), 0)::numeric(14,2)       as other_cost,
  coalesce(sum(i.total), 0)::numeric(14,2)                                       as total_cost
from public.services s
left join public.service_items i on i.service_id = s.id
group by s.id;

revoke all on public.account_balances, public.fund_balances, public.financial_position,
              public.budget_totals, public.service_costs from anon, authenticated;
grant select on public.account_balances, public.fund_balances, public.financial_position,
                public.budget_totals, public.service_costs to service_role;

-- ---------------------------------------------------------------------
-- Storage: bucket privado para anexos (comprovantes, fotos antes/depois).
-- Sem políticas para anon/authenticated: envio e leitura passam pelo
-- servidor do sistema, que gera links temporários.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('anexos', 'anexos', false, 20971520,
            array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
    on conflict (id) do nothing;
  end if;
end $$;
