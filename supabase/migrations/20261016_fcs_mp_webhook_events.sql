-- Auditoria isolada dos webhooks Mercado Pago.
-- Esta migração NÃO ativa assinaturas. A conciliação requer vínculo inequívoco com uma loja.
create table if not exists public.fcs_mp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null,
  resource_id text not null,
  resource_status text,
  collector_id text,
  external_reference text,
  mp_subscription_id text,
  mp_plan_id text,
  amount numeric(12,2),
  currency text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  verified_at timestamptz not null default now(),
  reconciliation_status text not null default 'pending'
    check (reconciliation_status in ('pending', 'linked', 'ignored', 'review')),
  store_id uuid,
  constraint fcs_mp_store_fk foreign key (store_id) references public.fcs_stores(id)
);
create index if not exists fcs_mp_events_lookup_idx
  on public.fcs_mp_webhook_events (event_type, resource_id);
create index if not exists fcs_mp_events_pending_idx
  on public.fcs_mp_webhook_events (reconciliation_status, received_at);
alter table public.fcs_mp_webhook_events enable row level security;
-- Sem políticas públicas: somente service_role no backend acessa esta tabela.
comment on table public.fcs_mp_webhook_events is
  'Eventos confirmados via HMAC e API Mercado Pago. Registro não equivale a assinatura ativa.';
