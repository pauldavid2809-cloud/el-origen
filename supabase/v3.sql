-- ==============================================================================
-- EL ORIGEN — v3: lista de espera de las catas y fotos de la publicidad.
-- Ejecutar en Supabase → SQL Editor DESPUÉS de supabase/v2.sql. Es idempotente
-- y solo agrega (no toca datos existentes).
-- Como el resto: RLS activado y sin políticas públicas; solo el servidor (service
-- role) lee y escribe.
-- ==============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. LISTA DE ESPERA (formulario público /lista-de-espera → panel: Solicitudes)
-- ------------------------------------------------------------------------------
create table if not exists public.waitlist (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    phone text not null,
    email text,
    -- Cata de interés; null = «La próxima cata que haya».
    tasting_id text,
    -- Nombre de la cata al anotarse (se conserva aunque la cata cambie o se borre).
    tasting_title text,
    spots integer not null default 1 check (spots between 1 and 10),
    message text,
    status text not null default 'new',
    created_at timestamptz not null default now()
);

create index if not exists waitlist_status_idx on public.waitlist (status, created_at desc);
create index if not exists waitlist_tasting_idx on public.waitlist (tasting_id, created_at);
alter table public.waitlist enable row level security;

-- ------------------------------------------------------------------------------
-- 2. BUCKET DE PUBLICIDAD (imágenes de los espacios «Anuncia aquí», públicas)
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anuncios', 'anuncios', true, 6291456, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = true,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
