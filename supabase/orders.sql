-- ==============================================================================
-- EL ORIGEN — Reservas con pago verificado y QR (flujo tipo congreso)
-- Ejecutar en Supabase → SQL Editor. Es idempotente.
-- ==============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,                  -- código corto visible, ej. EO-7KQ2M
    token text unique not null,                 -- secreto del enlace público y del QR
    tasting_id text not null,
    tasting_title text not null,
    tasting_date text not null,
    tasting_time text not null,
    tasting_location text not null,

    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    customer_doc_id text not null,
    spots_count integer not null check (spots_count > 0),
    dietary_restrictions text,
    add_ons jsonb not null default '[]'::jsonb,

    subtotal_usd numeric not null,
    discount_usd numeric not null default 0,
    coupon_code text,
    total_usd numeric not null,

    -- Pago reportado por el cliente
    payment_method text,                        -- pago_movil | transferencia
    payment_bank text,                          -- cuenta destino elegida
    payment_reference text,
    payment_amount_bs numeric,
    payer_bank text,
    payer_doc_id text,
    payer_phone text,
    bcv_rate numeric,
    proof_path text,                            -- ruta en el bucket privado "comprobantes"
    proof_submitted_at timestamptz,

    -- pending_payment → in_review → approved | rejected ; cancelled
    status text not null default 'pending_payment',
    rejection_reason text,
    reviewed_at timestamptz,
    reviewed_by text,

    checked_in_at timestamptz,
    checked_in_by text,

    email_status text not null default 'not_sent',     -- not_sent | sent | failed | disabled
    whatsapp_status text not null default 'not_sent',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists orders_tasting_status_idx on public.orders (tasting_id, status);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create unique index if not exists orders_payment_reference_uidx
    on public.orders (payment_reference)
    where payment_reference is not null and status in ('in_review', 'approved');

-- Solo el servidor (service role) accede a la tabla: RLS activado y sin políticas públicas.
alter table public.orders enable row level security;

create or replace function public.touch_orders_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_orders_updated_at();

-- Bucket PRIVADO para comprobantes (el admin los ve con enlaces firmados temporales).
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do update set public = false;

-- Ajustes del sistema (por ahora: último latido del bot de WhatsApp).
create table if not exists public.app_settings (
    key text primary key,
    value jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

-- Cola del bot: órdenes aprobadas con WhatsApp pendiente.
create index if not exists orders_whatsapp_queue_idx on public.orders (whatsapp_status, updated_at)
    where status = 'approved';
