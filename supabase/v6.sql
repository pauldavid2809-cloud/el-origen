-- ==============================================================================
-- EL ORIGEN — v6: tienda de vinos (precio y «Activo para la venta» en los vinos, pedidos de vinos).
-- Ejecutar en Supabase → SQL Editor DESPUÉS de supabase/v5.sql y ANTES de publicar
-- esta versión del sitio (sin estas columnas fallan el guardado de vinos y el checkout).
-- Es idempotente y solo agrega (no toca datos existentes): los vinos que ya existen quedan
-- sin precio y con la venta apagada, así que ninguno pasa a la venta ni cambia su aspecto.
-- Como el resto: RLS activado y sin políticas públicas; solo el servidor (service role)
-- lee y escribe.
-- ==============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. VINOS: precio y venta (panel → Vinos → Venta)
--    «Publicado/Borrador» (status) sigue controlando si el vino SE VE; «Activo para la
--    venta» (sale_active) es aparte. Un vino está a la venta si está publicado, activo
--    para la venta y con precio mayor que cero.
-- ------------------------------------------------------------------------------
alter table public.wines add column if not exists price_usd numeric
    check (price_usd is null or price_usd >= 0);                  -- precio por botella, en USD
alter table public.wines add column if not exists sale_active boolean not null default false;
alter table public.wines add column if not exists max_per_order integer
    check (max_per_order is null or max_per_order between 1 and 24);   -- null = tope por defecto del sitio

-- No se puede activar la venta sin precio (coalesce: con precio null el check no debe pasar en silencio).
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'wines_sale_needs_price_chk'
          and conrelid = 'public.wines'::regclass
    ) then
        alter table public.wines
            add constraint wines_sale_needs_price_chk
            check (not sale_active or coalesce(price_usd, 0) > 0);
    end if;
end
$$;

create index if not exists wines_sale_idx on public.wines (created_at desc)
    where status = 'published' and sale_active;

-- ------------------------------------------------------------------------------
-- 2. PEDIDOS DE VINOS (compra en línea con pago verificado, igual que las entradas)
--    pending_payment → in_review → approved | rejected ; cancelled
--    No usa la tabla orders ni genera entradas/QR. Cada línea de items guarda una
--    copia del vino (nombre, añada, precio) para no depender de cambios posteriores.
-- ------------------------------------------------------------------------------
create table if not exists public.wine_orders (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,                  -- código corto visible, ej. EV-7KQ2M
    token text unique not null,                 -- secreto del enlace público /pedido/<token>
    member_id uuid references public.members (id) on delete set null,

    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    customer_doc_id text not null,

    -- [{ wineId, slug, name, vintage, unitPriceUsd, quantity }]
    items jsonb not null default '[]'::jsonb,
    bottles_count integer not null check (bottles_count > 0),

    fulfillment text not null default 'pickup' check (fulfillment in ('pickup', 'delivery')),
    delivery_address text,
    delivery_note text,

    subtotal_usd numeric not null check (subtotal_usd >= 0),
    total_usd numeric not null check (total_usd >= 0),
    rate_currency text not null default 'USD' check (rate_currency in ('USD', 'EUR', 'BINANCE')),
    bcv_rate numeric,

    -- Pago reportado por el cliente
    payment_method text,                        -- pago_movil | transferencia | binance_usdt | zelle | efectivo
    payment_bank text,                          -- cuenta destino elegida
    payment_reference text,
    payment_amount_bs numeric,                  -- en la moneda del método: Bs, USDT o USD (igual que orders)
    payer_bank text,
    payer_doc_id text,
    payer_phone text,
    payment_note text,
    proof_path text,                            -- ruta en el bucket privado "comprobantes"
    proof_submitted_at timestamptz,

    status text not null default 'pending_payment'
        check (status in ('pending_payment', 'in_review', 'approved', 'rejected', 'cancelled')),
    rejection_reason text,
    reviewed_at timestamptz,
    reviewed_by text,
    delivered_at timestamptz,                   -- entregado / retirado

    email_status text not null default 'not_sent',     -- not_sent | queued | sent | failed | disabled
    whatsapp_status text not null default 'not_sent',
    accepted_terms_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists wine_orders_status_created_idx on public.wine_orders (status, created_at desc);
create index if not exists wine_orders_member_idx on public.wine_orders (member_id) where member_id is not null;
-- Cola del bot: pedidos aprobados con WhatsApp pendiente.
create index if not exists wine_orders_whatsapp_queue_idx on public.wine_orders (whatsapp_status, updated_at)
    where status = 'approved';
-- Una misma referencia de pago no puede estar en dos pedidos de vinos a la vez (entre catas y vinos lo
-- comprueba el servidor, porque son dos tablas).
create unique index if not exists wine_orders_payment_reference_uidx
    on public.wine_orders (payment_reference)
    where payment_reference is not null and status in ('in_review', 'approved');

-- Solo el servidor (service role) accede a la tabla: RLS activado y sin políticas públicas.
alter table public.wine_orders enable row level security;

-- public.touch_updated_at() se creó en supabase/v2.sql.
drop trigger if exists wine_orders_touch_updated_at on public.wine_orders;
create trigger wine_orders_touch_updated_at
before update on public.wine_orders
for each row execute function public.touch_updated_at();

-- Que la API de Supabase (PostgREST) vea de inmediato las columnas y la tabla nuevas.
notify pgrst, 'reload schema';
