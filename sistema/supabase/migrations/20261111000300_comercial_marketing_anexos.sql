-- =====================================================================
-- FORTE DUTO — Gestão
-- Migração 3/4: clientes, serviços, orçamentos, marketing e anexos
-- =====================================================================

-- ---------------------------------------------------------------------
-- Campanhas (criadas antes de clientes por causa das atribuições)
-- ---------------------------------------------------------------------
create type public.ad_platform as enum ('instagram_ads', 'facebook_ads', 'google_ads', 'outras');
create type public.campaign_status as enum ('planejada', 'ativa', 'pausada', 'encerrada');

create table public.campaigns (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 1 and 120),
  platform          public.ad_platform not null,
  status            public.campaign_status not null default 'planejada',
  service_type_id   uuid references public.service_types (id) on delete set null,  -- serviço divulgado
  start_date        date,
  end_date          date,
  planned_budget    numeric(14,2) check (planned_budget is null or planned_budget >= 0),
  external_id       text check (char_length(external_id) <= 120),   -- ID da campanha na plataforma
  utm_campaign      text check (utm_campaign ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
  notes             text check (char_length(notes) <= 2000),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint campaigns_dates check (end_date is null or start_date is null or end_date >= start_date)
);
create unique index campaigns_utm_uq on public.campaigns (utm_campaign) where utm_campaign is not null;
create unique index campaigns_external_uq on public.campaigns (platform, external_id) where external_id is not null;
create index campaigns_service_type_idx on public.campaigns (service_type_id);

comment on column public.campaigns.utm_campaign is 'Valor usado no parâmetro utm_campaign dos links. Liga contatos rastreados à campanha.';

create table public.advertisements (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.campaigns (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  format        text check (char_length(format) <= 40),         -- imagem, vídeo, carrossel...
  external_id   text check (char_length(external_id) <= 120),
  utm_content   text check (utm_content ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
  destination_url text check (char_length(destination_url) <= 1000),
  notes         text check (char_length(notes) <= 1000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index advertisements_campaign_idx on public.advertisements (campaign_id);
create unique index advertisements_utm_uq on public.advertisements (campaign_id, utm_content) where utm_content is not null;

-- Números informados pela plataforma de anúncios (lançamento manual por enquanto;
-- preparado para importação automática via Meta Ads / Google Ads no futuro).
create table public.campaign_metrics (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references public.campaigns (id) on delete cascade,
  advertisement_id    uuid references public.advertisements (id) on delete cascade,
  period_start        date not null,
  period_end          date not null,
  reach               integer not null default 0 check (reach >= 0),
  impressions         integer not null default 0 check (impressions >= 0),
  clicks              integer not null default 0 check (clicks >= 0),
  conversations       integer not null default 0 check (conversations >= 0),
  spend               numeric(14,2) not null default 0 check (spend >= 0),   -- investimento real no período
  source              text not null default 'manual' check (source in ('manual', 'meta_ads', 'google_ads')),
  notes               text check (char_length(notes) <= 1000),
  created_by          uuid references auth.users (id) on delete set null default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint campaign_metrics_period check (period_end >= period_start)
);
create unique index campaign_metrics_period_uq
  on public.campaign_metrics (campaign_id, coalesce(advertisement_id, '00000000-0000-0000-0000-000000000000'::uuid), period_start, period_end);

comment on table public.campaign_metrics is 'Alcance, impressões, cliques, conversas e investimento informados pela plataforma. Contatos, orçamentos, serviços e receita atribuída são CALCULADOS a partir de customer_attributions.';

-- ---------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------
create type public.customer_status as enum ('novo_contato', 'em_atendimento', 'cliente', 'inativo');

create table public.customers (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (char_length(name) between 1 and 120),
  phone              text check (char_length(phone) <= 30),
  whatsapp           text check (char_length(whatsapp) <= 30),
  phone_digits       text generated always as (
                       nullif(regexp_replace(coalesce(nullif(whatsapp, ''), phone, ''), '\D', '', 'g'), '')
                     ) stored,
  address            text check (char_length(address) <= 300),
  requested_service  text check (char_length(requested_service) <= 200),
  estimated_value    numeric(14,2) check (estimated_value is null or estimated_value >= 0),
  source_id          uuid references public.customer_sources (id) on delete set null,  -- origem DECLARADA
  status             public.customer_status not null default 'novo_contato',
  notes              text check (char_length(notes) <= 2000),
  created_by         uuid references auth.users (id) on delete set null default auth.uid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Evita cliente duplicado pelo mesmo telefone/WhatsApp
create unique index customers_phone_digits_uq on public.customers (phone_digits)
  where phone_digits is not null and char_length(phone_digits) >= 8;
create index customers_name_idx on public.customers using btree (lower(name) text_pattern_ops);
create index customers_source_idx on public.customers (source_id);
create index customers_created_idx on public.customers (created_at desc);

comment on column public.customers.source_id is 'Origem DECLARADA (o que o cliente disse ou o que a equipe registrou). A origem RASTREADA fica em customer_attributions.';

-- Atribuição: liga cliente a campanha com o tipo de evidência
create type public.attribution_type as enum ('declarada', 'rastreada', 'desconhecida');

create table public.customer_attributions (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.customers (id) on delete cascade,
  campaign_id       uuid references public.campaigns (id) on delete set null,
  advertisement_id  uuid references public.advertisements (id) on delete set null,
  attribution_type  public.attribution_type not null,
  utm_source        text check (char_length(utm_source) <= 100),
  utm_medium        text check (char_length(utm_medium) <= 100),
  utm_campaign      text check (char_length(utm_campaign) <= 100),
  utm_content       text check (char_length(utm_content) <= 100),
  utm_term          text check (char_length(utm_term) <= 100),
  click_id          text check (char_length(click_id) <= 300),   -- gclid / fbclid
  landing_url       text check (char_length(landing_url) <= 2000),
  occurred_at       timestamptz not null default now(),
  is_primary        boolean not null default true,
  notes             text check (char_length(notes) <= 1000),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- "rastreada" exige evidência técnica (UTM ou click id)
  constraint attributions_tracked_needs_evidence check (
    attribution_type <> 'rastreada' or utm_campaign is not null or utm_source is not null or click_id is not null
  ),
  constraint attributions_unknown_no_campaign check (
    attribution_type <> 'desconhecida' or campaign_id is null
  )
);
create index customer_attributions_customer_idx on public.customer_attributions (customer_id);
create index customer_attributions_campaign_idx on public.customer_attributions (campaign_id);
create index customer_attributions_ad_idx on public.customer_attributions (advertisement_id);
-- no máximo uma atribuição principal por cliente
create unique index customer_attributions_primary_uq on public.customer_attributions (customer_id) where is_primary;

-- ---------------------------------------------------------------------
-- Orçamentos
-- ---------------------------------------------------------------------
create type public.budget_status as enum ('aguardando', 'aprovado', 'recusado', 'expirado');
create type public.line_item_kind as enum ('material', 'mao_de_obra', 'outro');

create table public.budgets (
  id               uuid primary key default gen_random_uuid(),
  number           integer generated always as identity (start with 1) unique,
  customer_id      uuid not null references public.customers (id) on delete restrict,
  service_type_id  uuid references public.service_types (id) on delete set null,
  description      text check (char_length(description) <= 2000),
  address          text check (char_length(address) <= 300),
  issue_date       date not null default current_date,
  valid_until      date,
  discount         numeric(14,2) not null default 0 check (discount >= 0),
  status           public.budget_status not null default 'aguardando',
  service_id       uuid unique,   -- serviço gerado a partir deste orçamento (FK abaixo)
  notes            text check (char_length(notes) <= 2000),
  created_by       uuid references auth.users (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint budgets_validity check (valid_until is null or valid_until >= issue_date)
);
create index budgets_customer_idx on public.budgets (customer_id);
create index budgets_status_idx on public.budgets (status);
create index budgets_service_type_idx on public.budgets (service_type_id);

create table public.budget_items (
  id           uuid primary key default gen_random_uuid(),
  budget_id    uuid not null references public.budgets (id) on delete cascade,
  kind         public.line_item_kind not null default 'material',
  description  text not null check (char_length(description) between 1 and 200),
  quantity     numeric(12,3) not null default 1 check (quantity > 0),
  unit_price   numeric(14,2) not null check (unit_price >= 0),
  total        numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index budget_items_budget_idx on public.budget_items (budget_id);

-- ---------------------------------------------------------------------
-- Serviços
-- ---------------------------------------------------------------------
create type public.service_status as enum (
  'solicitado', 'agendado', 'em_andamento', 'aguardando_material', 'concluido', 'cancelado'
);

create table public.services (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.customers (id) on delete restrict,
  service_type_id   uuid references public.service_types (id) on delete set null,
  description       text check (char_length(description) <= 2000),
  address           text check (char_length(address) <= 300),
  responsible_name  text check (char_length(responsible_name) <= 120),
  responsible_id    uuid references public.profiles (id) on delete set null,
  requested_date    date not null default current_date,
  scheduled_at      timestamptz,
  completed_at      timestamptz,
  contract_value    numeric(14,2) check (contract_value is null or contract_value >= 0),
  status            public.service_status not null default 'solicitado',
  notes             text check (char_length(notes) <= 2000),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index services_customer_idx on public.services (customer_id);
create index services_status_idx on public.services (status);
create index services_scheduled_idx on public.services (scheduled_at);
create index services_service_type_idx on public.services (service_type_id);
create index services_responsible_idx on public.services (responsible_id);

comment on column public.services.contract_value is 'Valor combinado com o cliente. NÃO é dinheiro recebido: o recebimento é uma transação de receita ligada ao serviço.';

-- Custos do serviço (materiais e mão de obra). Os totais do serviço são calculados.
create table public.service_items (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid not null references public.services (id) on delete cascade,
  kind         public.line_item_kind not null default 'material',
  description  text not null check (char_length(description) between 1 and 200),
  quantity     numeric(12,3) not null default 1 check (quantity > 0),
  unit_cost    numeric(14,2) not null check (unit_cost >= 0),
  total        numeric(14,2) generated always as (round(quantity * unit_cost, 2)) stored,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index service_items_service_idx on public.service_items (service_id);

alter table public.budgets
  add constraint budgets_service_fk foreign key (service_id) references public.services (id) on delete set null;

-- FKs adiadas do financeiro
alter table public.transactions
  add constraint transactions_customer_fk foreign key (customer_id) references public.customers (id) on delete restrict,
  add constraint transactions_service_fk  foreign key (service_id)  references public.services (id)  on delete restrict,
  add constraint transactions_campaign_fk foreign key (campaign_id) references public.campaigns (id) on delete restrict;

-- ---------------------------------------------------------------------
-- Converter orçamento aprovado em serviço (uma transação, um clique)
-- security invoker: respeita as permissões de quem chama.
-- ---------------------------------------------------------------------
create or replace function public.convert_budget_to_service(p_budget_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  b public.budgets%rowtype;
  v_service_id uuid;
  v_total numeric(14,2);
begin
  select * into b from public.budgets where id = p_budget_id for update;
  if not found then
    raise exception 'Orçamento não encontrado.' using errcode = 'P0002';
  end if;
  if b.status <> 'aprovado' then
    raise exception 'Só orçamentos aprovados podem virar serviço.' using errcode = 'P0001';
  end if;
  if b.service_id is not null then
    raise exception 'Este orçamento já foi transformado em serviço.' using errcode = 'P0001';
  end if;

  select coalesce(sum(total), 0) - b.discount into v_total
    from public.budget_items where budget_id = b.id;

  insert into public.services (customer_id, service_type_id, description, address, contract_value, status, notes)
  select b.customer_id, b.service_type_id, b.description,
         coalesce(b.address, c.address), greatest(v_total, 0), 'solicitado',
         'Gerado a partir do orçamento nº ' || b.number
    from public.customers c where c.id = b.customer_id
  returning id into v_service_id;

  -- Os itens do orçamento são PREÇO DE VENDA e continuam ligados ao serviço
  -- por budgets.service_id. Não são copiados para service_items, que guarda
  -- o CUSTO REAL (materiais comprados, mão de obra paga) lançado na execução.

  update public.budgets set service_id = v_service_id where id = b.id;

  return v_service_id;
end;
$$;

revoke all on function public.convert_budget_to_service(uuid) from public, anon;
grant execute on function public.convert_budget_to_service(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Anexos (comprovantes, fotos antes/depois). Arquivos no Storage,
-- bucket privado "anexos"; caminho = <entity_type>/<entity_id>/<arquivo>
-- ---------------------------------------------------------------------
create table public.attachments (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null check (entity_type in ('transaction', 'service', 'budget', 'customer', 'campaign')),
  entity_id     uuid not null,
  category      text not null default 'outro' check (category in ('comprovante', 'foto_antes', 'foto_depois', 'documento', 'outro')),
  storage_path  text not null unique check (char_length(storage_path) <= 500),
  file_name     text not null check (char_length(file_name) <= 255),
  mime_type     text check (char_length(mime_type) <= 120),
  size_bytes    bigint check (size_bytes is null or (size_bytes >= 0 and size_bytes <= 20971520)),
  created_by    uuid references auth.users (id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now()
);
create index attachments_entity_idx on public.attachments (entity_type, entity_id);

-- ---------------------------------------------------------------------
-- updated_at + auditoria
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'campaigns', 'advertisements', 'campaign_metrics', 'customers', 'customer_attributions',
    'budgets', 'budget_items', 'services', 'service_items'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_set_updated_at', t);
  end loop;

  foreach t in array array[
    'campaigns', 'advertisements', 'campaign_metrics', 'customers', 'customer_attributions',
    'budgets', 'budget_items', 'services', 'service_items', 'attachments'
  ] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_trigger()', t || '_audit', t);
  end loop;
end $$;
