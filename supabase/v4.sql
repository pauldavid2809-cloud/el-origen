-- ==============================================================================
-- EL ORIGEN — v4: preferencias en la lista de espera y métodos de pago por cata (Zelle, tasa Binance).
-- Ejecutar en Supabase → SQL Editor DESPUÉS de supabase/v3.sql y ANTES de publicar
-- esta versión del sitio (sin estas columnas fallan la lista de espera y el guardado de catas).
-- Es idempotente y solo agrega (no toca datos existentes).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. LISTA DE ESPERA & REGISTRO PRIORITARIO (/lista-de-espera)
-- ------------------------------------------------------------------------------
-- Tipos de experiencia que le interesan (varios): catas_pais, maridajes, estilo_vida, comparativas, privados.
alter table public.waitlist add column if not exists experiences text[] not null default '{}';
-- Días y horarios preferidos (uno): jueves_noche, viernes_noche, sabados, domingos.
alter table public.waitlist add column if not exists preferred_schedule text;
-- Nivel en el mundo del vino (uno): principiante, intermedio, avanzado.
alter table public.waitlist add column if not exists wine_level text;
-- Fecha o celebración especial próxima (texto libre).
alter table public.waitlist add column if not exists special_occasion text;

-- ------------------------------------------------------------------------------
-- 2. CATAS: métodos de pago y tasa de cada cata (panel → Catas → Pagos)
-- ------------------------------------------------------------------------------
-- Métodos que acepta la cata: pago_movil, transferencia, binance_usdt, zelle, efectivo.
-- Vacío = todos los activos en Configuración de pagos (así quedan las catas ya creadas).
alter table public.catas add column if not exists payment_methods jsonb not null default '[]'::jsonb;
-- Cuenta Zelle de la cata (id de la cuenta en Configuración de pagos); null = la primera.
alter table public.catas add column if not exists zelle_account_id text;
-- Tasa para el monto en bolívares: USD / EUR (BCV) o BINANCE (dólar paralelo).
alter table public.catas drop constraint if exists catas_rate_currency_check;
alter table public.catas add constraint catas_rate_currency_check check (rate_currency in ('USD', 'EUR', 'BINANCE'));
