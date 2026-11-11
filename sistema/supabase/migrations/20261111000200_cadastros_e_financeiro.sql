-- =====================================================================
-- FORTE DUTO — Gestão
-- Migração 2/4: configurações, cadastros auxiliares, financeiro e fundos
-- =====================================================================

-- ---------------------------------------------------------------------
-- Configurações da empresa (linha única)
-- ---------------------------------------------------------------------
create table public.company_settings (
  id                    boolean primary key default true check (id),
  company_name          text not null default 'Forte Duto' check (char_length(company_name) between 1 and 120),
  legal_name            text check (char_length(legal_name) <= 160),
  document              text check (char_length(document) <= 20),          -- CNPJ/CPF
  phone                 text check (char_length(phone) <= 30),
  whatsapp              text check (char_length(whatsapp) <= 30),
  email                 text check (char_length(email) <= 160),
  address               text check (char_length(address) <= 300),
  monthly_revenue_goal  numeric(14,2) check (monthly_revenue_goal is null or monthly_revenue_goal >= 0),
  monthly_profit_goal   numeric(14,2),
  updated_at            timestamptz not null default now()
);

comment on table public.company_settings is 'Dados da empresa e metas mensais. Sempre uma única linha (id = true).';

insert into public.company_settings (id) values (true);

create trigger company_settings_set_updated_at
  before update on public.company_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Cadastros auxiliares
-- ---------------------------------------------------------------------
create type public.expense_class as enum ('custo_direto', 'despesa_operacional', 'investimento', 'imposto');

create table public.expense_categories (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 1 and 80),
  classification  public.expense_class not null default 'despesa_operacional',
  active          boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index expense_categories_name_uq on public.expense_categories (lower(name));

comment on column public.expense_categories.classification is
  'custo_direto = ligado ao serviço (materiais, mão de obra); despesa_operacional = custo fixo/administrativo; investimento = compra de bem durável; imposto = impostos e taxas. Define como a despesa entra no resultado.';

create table public.revenue_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index revenue_categories_name_uq on public.revenue_categories (lower(name));

create table public.payment_methods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index payment_methods_name_uq on public.payment_methods (lower(name));

create table public.service_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index service_types_name_uq on public.service_types (lower(name));

create table public.customer_sources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  is_paid_ads boolean not null default false,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index customer_sources_name_uq on public.customer_sources (lower(name));

-- ---------------------------------------------------------------------
-- Contas financeiras (banco, caixa, carteira digital)
-- ---------------------------------------------------------------------
create type public.account_type as enum ('banco', 'caixa', 'carteira_digital', 'outro');

create table public.accounts (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 80),
  type             public.account_type not null default 'banco',
  opening_balance  numeric(14,2) not null default 0,
  opening_date     date not null default current_date,
  active           boolean not null default true,
  notes            text check (char_length(notes) <= 1000),
  created_by       text not null default public.current_actor(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index accounts_name_uq on public.accounts (lower(name));

comment on column public.accounts.opening_balance is 'Saldo real da conta na data de abertura (opening_date). O saldo atual é calculado pela view account_balances.';

-- ---------------------------------------------------------------------
-- Clientes e campanhas são referenciados pelo financeiro; as tabelas
-- completas ficam na migração 3. Aqui só o necessário para as FKs.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Movimentações financeiras
--   kind = receita       → dinheiro que entra (account_id = conta de destino)
--   kind = despesa       → dinheiro que sai   (account_id = conta utilizada)
--   kind = transferencia → movimentação interna entre contas
--                          (account_id = origem, to_account_id = destino)
--   status = pendente    → previsto (receita) / a pagar (despesa)
--   status = efetivado   → recebido (receita) / pago (despesa) / realizada (transferência)
--   status = cancelado   → ignorado em todos os cálculos
-- ---------------------------------------------------------------------
create type public.transaction_kind as enum ('receita', 'despesa', 'transferencia');
create type public.transaction_status as enum ('pendente', 'efetivado', 'cancelado');

create table public.transactions (
  id                   uuid primary key default gen_random_uuid(),
  kind                 public.transaction_kind not null,
  status               public.transaction_status not null default 'pendente',
  description          text not null check (char_length(description) between 1 and 200),
  amount               numeric(14,2) not null check (amount > 0),
  competence_date      date not null default current_date,  -- data do fato (faturamento/resultado)
  due_date             date,                                -- vencimento
  settled_date         date,                                -- data em que foi recebido/pago
  account_id           uuid references public.accounts (id) on delete restrict,
  to_account_id        uuid references public.accounts (id) on delete restrict,
  revenue_category_id  uuid references public.revenue_categories (id) on delete restrict,
  expense_category_id  uuid references public.expense_categories (id) on delete restrict,
  payment_method_id    uuid references public.payment_methods (id) on delete restrict,
  customer_id          uuid,   -- FK adicionada na migração 3
  service_id           uuid,   -- FK adicionada na migração 3
  campaign_id          uuid,   -- FK adicionada na migração 3
  supplier             text check (char_length(supplier) <= 120),
  notes                text check (char_length(notes) <= 2000),
  created_by           text not null default public.current_actor(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- efetivado exige data e conta
  constraint transactions_settled_requires_date
    check (status <> 'efetivado' or (settled_date is not null and account_id is not null)),

  -- regras por tipo
  constraint transactions_kind_rules check (
    case kind
      when 'receita' then
        expense_category_id is null and to_account_id is null
      when 'despesa' then
        revenue_category_id is null and to_account_id is null and customer_id is null
      when 'transferencia' then
        account_id is not null and to_account_id is not null and account_id <> to_account_id
        and revenue_category_id is null and expense_category_id is null
        and customer_id is null and service_id is null and campaign_id is null
        and status <> 'pendente'
    end
  )
);

comment on table public.transactions is 'Entradas, despesas e transferências internas. Transferência NÃO é receita nem despesa.';
comment on column public.transactions.competence_date is 'Data a que o valor pertence (usada no faturamento e no resultado operacional).';
comment on column public.transactions.settled_date is 'Data em que o dinheiro efetivamente entrou ou saiu (usada no fluxo de caixa e no saldo).';

create index transactions_kind_status_idx on public.transactions (kind, status);
create index transactions_competence_idx on public.transactions (competence_date);
create index transactions_settled_idx on public.transactions (settled_date);
create index transactions_due_idx on public.transactions (due_date) where status = 'pendente';
create index transactions_account_idx on public.transactions (account_id);
create index transactions_to_account_idx on public.transactions (to_account_id);
create index transactions_revenue_cat_idx on public.transactions (revenue_category_id);
create index transactions_expense_cat_idx on public.transactions (expense_category_id);
create index transactions_payment_method_idx on public.transactions (payment_method_id);
create index transactions_customer_idx on public.transactions (customer_id);
create index transactions_service_idx on public.transactions (service_id);
create index transactions_campaign_idx on public.transactions (campaign_id);

-- ---------------------------------------------------------------------
-- Fundos da empresa (reservas)
-- Um fundo NÃO é uma conta: é dinheiro separado DENTRO do saldo real.
-- Depositar num fundo não é despesa e não altera o saldo das contas;
-- só reduz o "dinheiro livre" (saldo disponível − reservas).
-- ---------------------------------------------------------------------
create table public.funds (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 80),
  description    text check (char_length(description) <= 500),
  target_amount  numeric(14,2) check (target_amount is null or target_amount > 0),
  target_date    date,
  account_id     uuid references public.accounts (id) on delete set null,  -- onde o dinheiro fica guardado (opcional)
  active         boolean not null default true,
  notes          text check (char_length(notes) <= 1000),
  created_by     text not null default public.current_actor(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index funds_name_uq on public.funds (lower(name));

create type public.fund_movement_kind as enum ('deposito', 'retirada');

create table public.fund_movements (
  id             uuid primary key default gen_random_uuid(),
  fund_id        uuid not null references public.funds (id) on delete restrict,
  kind           public.fund_movement_kind not null,
  amount         numeric(14,2) not null check (amount > 0),
  movement_date  date not null default current_date,
  notes          text check (char_length(notes) <= 1000),
  created_by     text not null default public.current_actor(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index fund_movements_fund_idx on public.fund_movements (fund_id, movement_date);

-- Impede saldo negativo em fundo (retirada maior que o reservado)
create or replace function public.check_fund_balance()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_fund uuid := coalesce(new.fund_id, old.fund_id);
  v_balance numeric(14,2);
begin
  -- serializa movimentos do mesmo fundo
  perform 1 from public.funds where id = v_fund for update;

  select coalesce(sum(case kind when 'deposito' then amount else -amount end), 0)
    into v_balance
    from public.fund_movements
   where fund_id = v_fund;

  if v_balance < 0 then
    raise exception 'Retirada maior que o saldo do fundo. Saldo resultante seria R$ %.', to_char(v_balance, 'FM999G999G990D00')
      using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' and old.fund_id <> new.fund_id then
    select coalesce(sum(case kind when 'deposito' then amount else -amount end), 0)
      into v_balance from public.fund_movements where fund_id = old.fund_id;
    if v_balance < 0 then
      raise exception 'A alteração deixaria o fundo de origem com saldo negativo.' using errcode = 'P0001';
    end if;
  end if;

  return null;
end;
$$;

create constraint trigger fund_movements_balance_check
  after insert or update or delete on public.fund_movements
  deferrable initially immediate
  for each row execute function public.check_fund_balance();

-- ---------------------------------------------------------------------
-- updated_at + auditoria
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'expense_categories', 'revenue_categories', 'payment_methods', 'service_types',
    'customer_sources', 'accounts', 'transactions', 'funds', 'fund_movements'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;

  foreach t in array array[
    'company_settings', 'expense_categories', 'revenue_categories', 'payment_methods', 'service_types',
    'customer_sources', 'accounts', 'transactions', 'funds', 'fund_movements'
  ] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_trigger()', t || '_audit', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Dados de configuração iniciais (não são registros fictícios: são as
-- listas pedidas pela empresa, editáveis em Configurações)
-- ---------------------------------------------------------------------
insert into public.expense_categories (name, classification, sort_order) values
  ('Materiais',             'custo_direto',        1),
  ('Equipamentos',          'investimento',        2),
  ('Ferramentas',           'investimento',        3),
  ('Combustível',           'despesa_operacional', 4),
  ('Transporte',            'despesa_operacional', 5),
  ('Funcionários',          'despesa_operacional', 6),
  ('Mão de obra',           'custo_direto',        7),
  ('Alimentação',           'despesa_operacional', 8),
  ('Marketing e anúncios',  'despesa_operacional', 9),
  ('Manutenção',            'despesa_operacional', 10),
  ('Impostos e taxas',      'imposto',             11),
  ('Outras despesas',       'despesa_operacional', 12);

insert into public.revenue_categories (name, sort_order) values
  ('Prestação de serviço', 1),
  ('Venda de material',    2),
  ('Outras receitas',      3);

insert into public.payment_methods (name, sort_order) values
  ('Pix',               1),
  ('Dinheiro',          2),
  ('Cartão de crédito', 3),
  ('Cartão de débito',  4),
  ('Transferência',     5),
  ('Boleto',            6);

insert into public.customer_sources (name, is_paid_ads, sort_order) values
  ('Instagram orgânico', false, 1),
  ('Instagram Ads',      true,  2),
  ('Facebook Ads',       true,  3),
  ('Google',             false, 4),
  ('Indicação',          false, 5),
  ('WhatsApp direto',    false, 6),
  ('Cliente antigo',     false, 7),
  ('Outros',             false, 8);

insert into public.service_types (name, sort_order) values
  ('Desentupimento',              1),
  ('Hidráulica',                  2),
  ('Limpeza de caixa d''água',    3),
  ('Reparo de registros',         4),
  ('Localização de vazamentos',   5),
  ('Outros serviços',             6);

insert into public.funds (name, description) values
  ('Reserva de emergência',            'Dinheiro guardado para imprevistos.'),
  ('Fundo de equipamentos',            'Para comprar ou trocar equipamentos.'),
  ('Fundo de expansão',                'Para crescer a empresa.'),
  ('Fundo de manutenção',              'Para manutenção de veículos, ferramentas e equipamentos.'),
  ('Fundo de investimento empresarial','Para investimentos de longo prazo.');
