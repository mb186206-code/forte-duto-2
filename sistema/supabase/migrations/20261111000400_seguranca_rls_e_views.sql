-- =====================================================================
-- FORTE DUTO — Gestão
-- Migração 4/4: Row Level Security, views de saldo e Storage
-- =====================================================================
-- Matriz de permissões (resumo — detalhes em DATABASE.md):
--   admin        → tudo, inclusive excluir e ver o histórico de alterações
--   financeiro   → contas, movimentações, fundos, categorias, formas de
--                  pagamento, campanhas; lê clientes/serviços/orçamentos
--   operacional  → clientes, serviços, orçamentos e atribuições;
--                  NÃO vê contas, movimentações nem fundos
--   usuário inativo ou anônimo → nada
-- =====================================================================

-- Anônimos não têm acesso a nenhuma tabela da aplicação.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- Usuários autenticados nunca escrevem no log de auditoria diretamente.
revoke insert, update, delete, truncate on public.audit_logs from authenticated;

-- Habilita RLS em todas as tabelas de negócio
do $$
declare t text;
begin
  foreach t in array array[
    'company_settings', 'expense_categories', 'revenue_categories', 'payment_methods', 'service_types',
    'customer_sources', 'accounts', 'transactions', 'funds', 'fund_movements',
    'campaigns', 'advertisements', 'campaign_metrics', 'customers', 'customer_attributions',
    'budgets', 'budget_items', 'services', 'service_items', 'attachments'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Gerador de políticas: (tabela, quem lê, quem cria/edita, quem exclui)
-- ---------------------------------------------------------------------
create or replace function pg_temp.apply_policies(
  p_table text,
  p_read  public.app_role[],
  p_write public.app_role[],
  p_delete public.app_role[]
) returns void
language plpgsql
as $$
begin
  execute format(
    'create policy %I on public.%I for select to authenticated using (public.has_role(variadic %L::public.app_role[]))',
    p_table || ': leitura', p_table, p_read);
  execute format(
    'create policy %I on public.%I for insert to authenticated with check (public.has_role(variadic %L::public.app_role[]))',
    p_table || ': inclusão', p_table, p_write);
  execute format(
    'create policy %I on public.%I for update to authenticated using (public.has_role(variadic %L::public.app_role[])) with check (public.has_role(variadic %L::public.app_role[]))',
    p_table || ': edição', p_table, p_write, p_write);
  execute format(
    'create policy %I on public.%I for delete to authenticated using (public.has_role(variadic %L::public.app_role[]))',
    p_table || ': exclusão', p_table, p_delete);
end;
$$;

-- todos = usuários ativos de qualquer função
select pg_temp.apply_policies('expense_categories', '{admin,financeiro,operacional}', '{admin,financeiro}', '{admin}');
select pg_temp.apply_policies('revenue_categories', '{admin,financeiro,operacional}', '{admin,financeiro}', '{admin}');
select pg_temp.apply_policies('payment_methods',    '{admin,financeiro,operacional}', '{admin,financeiro}', '{admin}');
select pg_temp.apply_policies('service_types',      '{admin,financeiro,operacional}', '{admin}',            '{admin}');
select pg_temp.apply_policies('customer_sources',   '{admin,financeiro,operacional}', '{admin}',            '{admin}');

select pg_temp.apply_policies('accounts',        '{admin,financeiro}', '{admin,financeiro}', '{admin}');
select pg_temp.apply_policies('transactions',    '{admin,financeiro}', '{admin,financeiro}', '{admin}');
select pg_temp.apply_policies('funds',           '{admin,financeiro}', '{admin,financeiro}', '{admin}');
select pg_temp.apply_policies('fund_movements',  '{admin,financeiro}', '{admin,financeiro}', '{admin}');

select pg_temp.apply_policies('campaigns',        '{admin,financeiro,operacional}', '{admin,financeiro}', '{admin}');
select pg_temp.apply_policies('advertisements',   '{admin,financeiro,operacional}', '{admin,financeiro}', '{admin}');
select pg_temp.apply_policies('campaign_metrics', '{admin,financeiro}',             '{admin,financeiro}', '{admin}');

select pg_temp.apply_policies('customers',             '{admin,financeiro,operacional}', '{admin,financeiro,operacional}', '{admin}');
select pg_temp.apply_policies('customer_attributions', '{admin,financeiro,operacional}', '{admin,financeiro,operacional}', '{admin}');
select pg_temp.apply_policies('budgets',               '{admin,financeiro,operacional}', '{admin,operacional}',            '{admin}');
select pg_temp.apply_policies('budget_items',          '{admin,financeiro,operacional}', '{admin,operacional}',            '{admin,operacional}');
select pg_temp.apply_policies('services',              '{admin,financeiro,operacional}', '{admin,operacional}',            '{admin}');
select pg_temp.apply_policies('service_items',         '{admin,financeiro,operacional}', '{admin,operacional}',            '{admin,operacional}');

-- Configurações da empresa: todos leem, só admin altera; nunca inclui/exclui
create policy "company_settings: leitura" on public.company_settings
  for select to authenticated using (public.is_active_user());
create policy "company_settings: edição" on public.company_settings
  for update to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Anexos: comprovantes financeiros só para admin/financeiro
create or replace function public.can_access_attachment_entity(p_entity_type text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_entity_type
    when 'transaction' then public.has_role('admin', 'financeiro')
    when 'campaign'    then public.has_role('admin', 'financeiro')
    else public.is_active_user()
  end
$$;
revoke all on function public.can_access_attachment_entity(text) from public, anon;
grant execute on function public.can_access_attachment_entity(text) to authenticated;

create policy "attachments: leitura" on public.attachments
  for select to authenticated using (public.can_access_attachment_entity(entity_type));
create policy "attachments: inclusão" on public.attachments
  for insert to authenticated with check (
    public.can_access_attachment_entity(entity_type) and created_by = auth.uid()
  );
create policy "attachments: exclusão" on public.attachments
  for delete to authenticated using (
    public.has_role('admin') or (created_by = auth.uid() and public.can_access_attachment_entity(entity_type))
  );

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
              public.budget_totals, public.service_costs from anon;
grant select on public.account_balances, public.fund_balances, public.financial_position,
                public.budget_totals, public.service_costs to authenticated;

-- ---------------------------------------------------------------------
-- Storage: bucket privado para anexos
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('anexos', 'anexos', false, 20971520,
            array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
    on conflict (id) do nothing;

    execute $p$
      create policy "anexos: leitura" on storage.objects for select to authenticated
      using (bucket_id = 'anexos' and public.can_access_attachment_entity((storage.foldername(name))[1]))
    $p$;
    execute $p$
      create policy "anexos: envio" on storage.objects for insert to authenticated
      with check (bucket_id = 'anexos' and public.can_access_attachment_entity((storage.foldername(name))[1]))
    $p$;
    execute $p$
      create policy "anexos: exclusão" on storage.objects for delete to authenticated
      using (bucket_id = 'anexos' and (public.has_role('admin') or owner_id = auth.uid()::text))
    $p$;
  end if;
end $$;
