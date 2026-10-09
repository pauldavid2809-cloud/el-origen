-- ==============================================================================
-- EL ORIGEN — v5: catálogo de vinos (panel → Vinos, sitio → /vinos).
-- Ejecutar en Supabase → SQL Editor DESPUÉS de supabase/v4.sql y ANTES de publicar
-- esta versión del sitio. Es idempotente y solo agrega (no toca datos existentes).
-- Como el resto: RLS activado y sin políticas públicas; solo el servidor (service
-- role) lee y escribe.
-- ==============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. VINOS
-- ------------------------------------------------------------------------------
create table if not exists public.wines (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    name text not null,
    winery text not null default '',          -- bodega o productor
    region text not null default '',          -- país, región o denominación de origen
    wine_type text not null default 'tinto'
        check (wine_type in ('tinto', 'blanco', 'rosado', 'espumoso', 'dulce', 'destilado', 'otro')),
    grapes text not null default '',          -- uva o variedad
    vintage text not null default '',         -- añada
    description text not null default '',
    image_url text not null default '',       -- foto de la botella
    specs jsonb not null default '[]'::jsonb, -- ficha técnica: [{ label, value }]
    tasting_ids jsonb not null default '[]'::jsonb, -- catas en las que se degustó
    status text not null default 'draft' check (status in ('draft', 'published')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists wines_status_idx on public.wines (status, created_at desc);
alter table public.wines enable row level security;

drop trigger if exists wines_touch_updated_at on public.wines;
create trigger wines_touch_updated_at
before update on public.wines
for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 2. BUCKET DE FOTOS DE LOS VINOS (público)
-- ------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vinos', 'vinos', true, 6291456, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = true,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
