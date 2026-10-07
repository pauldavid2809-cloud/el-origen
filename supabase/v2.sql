-- ==============================================================================
-- EL ORIGEN — v2: catas administrables, entradas por persona, cupones, miembros,
-- solicitudes, recuerdos y fichas de cata.
-- Ejecutar en Supabase → SQL Editor DESPUÉS de supabase/orders.sql. Es idempotente.
-- Todas las tablas tienen RLS activado y sin políticas públicas: solo el servidor
-- (service role) las lee y escribe.
-- ==============================================================================

create extension if not exists "pgcrypto";

-- Función genérica para mantener updated_at.
create or replace function public.touch_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------------------------
-- 1. CATAS (las carga el cliente desde el panel)
-- ------------------------------------------------------------------------------
create table if not exists public.catas (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    title text not null,
    subtitle text not null default '',
    description text not null default '',
    date date not null,
    time_start text not null,
    time_end text not null default '',
    location_name text not null,
    location_address text,
    maps_url text,
    price_usd numeric not null check (price_usd >= 0),
    rate_currency text not null default 'USD' check (rate_currency in ('USD', 'EUR')),
    total_spots integer not null check (total_spots > 0),
    image_url text not null default '',
    image_alt text not null default '',
    category text not null default 'degustacion',
    products jsonb not null default '[]'::jsonb,      -- productos a degustar
    pairings jsonb not null default '[]'::jsonb,      -- armonías / menú
    sommelier_ids jsonb not null default '[]'::jsonb,
    instagram jsonb not null default '[]'::jsonb,     -- [{ handle, label? }]
    add_ons jsonb not null default '[]'::jsonb,       -- [{ id, title, description?, priceUsd }]
    status text not null default 'draft' check (status in ('draft', 'active', 'sold_out', 'archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists catas_status_date_idx on public.catas (status, date);
alter table public.catas enable row level security;

drop trigger if exists catas_touch_updated_at on public.catas;
create trigger catas_touch_updated_at
before update on public.catas
for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 2. ÓRDENES: columnas nuevas
--    payment_method admite 'pago_movil' | 'transferencia' | 'binance_usdt' | 'efectivo'.
--    El índice único de referencia es parcial (payment_reference is not null), así que
--    el efectivo (sin referencia) no lo afecta.
-- ------------------------------------------------------------------------------
alter table public.orders add column if not exists member_id uuid;
alter table public.orders add column if not exists accepted_terms_at timestamptz;
alter table public.orders add column if not exists rate_currency text;
alter table public.orders add column if not exists payment_note text;

create index if not exists orders_member_idx on public.orders (member_id) where member_id is not null;
create index if not exists orders_coupon_idx on public.orders (coupon_code) where coupon_code is not null;

-- ------------------------------------------------------------------------------
-- 3. ENTRADAS: un QR por persona
-- ------------------------------------------------------------------------------
create table if not exists public.tickets (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders (id) on delete cascade,
    number integer not null check (number > 0),
    token text unique not null,          -- secreto del QR de la entrada
    code text unique not null,           -- visible, ej. EO-7KQ2M-2
    attendee_name text,
    checked_in_at timestamptz,
    checked_in_by text,
    created_at timestamptz not null default now(),
    unique (order_id, number)
);

alter table public.tickets enable row level security;

-- ------------------------------------------------------------------------------
-- 4. CUPONES (la tabla pudo existir del esquema anterior: se completan columnas)
-- ------------------------------------------------------------------------------
create table if not exists public.coupons (
    code text primary key,
    discount_percent numeric not null default 0,
    description text not null default '',
    referrer text,
    members_only boolean not null default false,
    max_uses integer,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.coupons add column if not exists discount_percent numeric not null default 0;
alter table public.coupons add column if not exists description text not null default '';
alter table public.coupons add column if not exists referrer text;
alter table public.coupons add column if not exists members_only boolean not null default false;
alter table public.coupons add column if not exists max_uses integer;
alter table public.coupons add column if not exists active boolean not null default true;
alter table public.coupons add column if not exists created_at timestamptz not null default now();
alter table public.coupons alter column description set default '';

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'coupons_code_upper_chk') then
        alter table public.coupons add constraint coupons_code_upper_chk check (code = upper(code)) not valid;
    end if;
end $$;

alter table public.coupons enable row level security;

-- Semilla: cupón de bienvenida para los primeros registros (INACTIVO; % provisional, lo define el cliente).
insert into public.coupons (code, discount_percent, description, referrer, members_only, max_uses, active)
values ('2ORIGEN', 10, 'Bienvenida para nuevos registros — % por definir', null, true, null, false)
on conflict (code) do nothing;

-- ------------------------------------------------------------------------------
-- 5. MIEMBROS ("Cuenta Origen")
-- ------------------------------------------------------------------------------
create table if not exists public.members (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text unique not null check (email = lower(email)),
    phone text not null,
    password_hash text not null,         -- scrypt$sal$hash
    is_adult boolean not null default false,
    accepted_terms_at timestamptz,
    marketing_opt_in boolean not null default false,
    created_at timestamptz not null default now(),
    last_login_at timestamptz
);

alter table public.members enable row level security;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'orders_member_id_fkey') then
        alter table public.orders
            add constraint orders_member_id_fkey foreign key (member_id) references public.members (id) on delete set null;
    end if;
end $$;

-- ------------------------------------------------------------------------------
-- 6. SOLICITUDES DE LOS FORMULARIOS
-- ------------------------------------------------------------------------------
create table if not exists public.private_inquiries (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    company text not null default '',
    phone text not null,
    email text,
    event_type text not null,            -- corporativo | celebracion_privada | alianza_comercial | cena_navidena
    interest text not null default '',   -- licor o categoría de interés
    guests text not null,                -- 10-15 | 15-25 | 25+
    restaurant text,                     -- karnivoros_grill | maratea
    message text,
    status text not null default 'new',
    created_at timestamptz not null default now()
);

create table if not exists public.brand_leads (
    id uuid primary key default gen_random_uuid(),
    company text not null,
    brand text not null,
    contact_name text not null,
    contact_role text,
    phone text not null,
    email text not null,
    objective text not null,             -- patrocinar_edicion | lanzamiento_producto | cata_privada_b2b | presencia_marca
    message text,
    wants_samples boolean not null default false,
    status text not null default 'new',
    created_at timestamptz not null default now()
);

create table if not exists public.sommelier_applications (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    phone text not null,
    email text not null,
    instagram text,
    certification text not null,
    specialties jsonb not null default '[]'::jsonb,
    years_experience integer not null default 0,
    cv_url text,
    memorable_experience text not null,
    status text not null default 'new',
    created_at timestamptz not null default now()
);

create index if not exists private_inquiries_status_idx on public.private_inquiries (status, created_at desc);
create index if not exists brand_leads_status_idx on public.brand_leads (status, created_at desc);
create index if not exists sommelier_applications_status_idx on public.sommelier_applications (status, created_at desc);

alter table public.private_inquiries enable row level security;
alter table public.brand_leads enable row level security;
alter table public.sommelier_applications enable row level security;

-- ------------------------------------------------------------------------------
-- 7. RECUERDOS Y FICHAS DE CATA
-- ------------------------------------------------------------------------------
create table if not exists public.memories (
    id uuid primary key default gen_random_uuid(),
    tasting_id text not null,
    title text not null default '',
    url text not null,
    photographer text not null default '',
    created_at timestamptz not null default now()
);

create index if not exists memories_tasting_idx on public.memories (tasting_id, created_at desc);
alter table public.memories enable row level security;

create table if not exists public.tasting_notes (
    id uuid primary key default gen_random_uuid(),
    ticket_token text not null,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists tasting_notes_ticket_idx on public.tasting_notes (ticket_token, created_at);
alter table public.tasting_notes enable row level security;

-- ------------------------------------------------------------------------------
-- 8. BUCKETS DE STORAGE
--    catas y recuerdos: públicos (fotos del sitio). comprobantes: privado (ya existe).
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('catas', 'catas', true, 6291456, array['image/jpeg', 'image/png', 'image/webp']),
    ('recuerdos', 'recuerdos', true, 6291456, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = true,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do update set public = false;
