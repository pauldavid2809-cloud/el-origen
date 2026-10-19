-- ==============================================================================
-- EL ORIGEN — v8: entrega a domicilio de la tienda de vinos (día y franja que elige el cliente,
-- y el aviso de «en camino» cuando el pedido sale).
-- Ejecutar en Supabase → SQL Editor DESPUÉS de supabase/v7.sql. Conviene ejecutarla ANTES de publicar
-- esta versión del sitio: mientras falten las columnas el sitio sigue leyendo y creando pedidos sin
-- programación con normalidad, pero no se puede guardar el día y la franja de un pedido (el checkout
-- con programación responde con un mensaje claro) ni marcar un pedido «en camino».
-- Es idempotente y solo agrega (no toca datos existentes): los pedidos que ya existen quedan sin
-- fecha ni franja de entrega, sin marca de salida y con el aviso de salida en 'not_sent'.
-- La configuración de la programación (franjas, días atendidos, antelación y horizonte) NO necesita
-- migración: se guarda dentro de la clave 'wine_store' de app_settings desde Admin → Tienda de vinos.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PEDIDOS DE VINOS: día y franja de entrega elegidos por el cliente
--    delivery_date: día elegido (fecha de Caracas). Es una PREFERENCIA: el equipo la confirma por
--    WhatsApp. Solo se guarda en pedidos a domicilio cuando la programación estaba activa.
--    delivery_slot: copia del texto de la franja elegida (si luego se renombra o se quita la franja
--    en la configuración, el pedido conserva lo que vio el cliente). null = sin franjas, o sin programación.
-- ------------------------------------------------------------------------------
alter table public.wine_orders add column if not exists delivery_date date;
alter table public.wine_orders add column if not exists delivery_slot text;

-- ------------------------------------------------------------------------------
-- 2. PEDIDOS DE VINOS: aviso de «en camino»
--    dispatched_at: cuándo el administrador marcó el pedido como «en camino» (null = aún no salió).
--    dispatch_whatsapp_status: cómo salió el WhatsApp de ese aviso (not_sent | queued | sent | failed | disabled),
--    aparte de whatsapp_status, que es el de la confirmación del pedido.
-- ------------------------------------------------------------------------------
alter table public.wine_orders add column if not exists dispatched_at timestamptz;
alter table public.wine_orders add column if not exists dispatch_whatsapp_status text not null default 'not_sent';

-- Que la API de Supabase (PostgREST) vea de inmediato las columnas nuevas.
notify pgrst, 'reload schema';
