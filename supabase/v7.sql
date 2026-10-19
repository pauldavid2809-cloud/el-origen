-- ==============================================================================
-- EL ORIGEN — v7: tienda de vinos configurable (existencias por vino y envío en el total del pedido).
-- Ejecutar en Supabase → SQL Editor DESPUÉS de supabase/v6.sql. Conviene ejecutarla ANTES de publicar
-- esta versión del sitio: mientras falten las columnas el sitio sigue leyendo vinos y pedidos con
-- normalidad, pero no se pueden guardar existencias ni cobrar un envío con costo (ni un envío gratis
-- de costo fijo o por zonas, que necesita recordar la regla con la que se cobró).
-- Es idempotente y solo agrega (no toca datos existentes): los vinos que ya existen quedan sin control
-- de existencias (stock null) y los pedidos que ya existen quedan con envío 0, sin zona y sin modo de
-- envío (shipping_mode null: los pedidos de entrega anteriores a esta versión eran todos «a coordinar»).
-- La configuración de la tienda (retiro, entrega, zonas, límites y condiciones) NO necesita
-- migración: se guarda en app_settings con la clave 'wine_store' desde Admin → Tienda de vinos.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. VINOS: existencias (opcional)
--    stock = botellas TOTALES puestas a la venta de ese vino; null = sin control.
--    Las disponibles se calculan restando las reservadas por pedidos en revisión, aprobados
--    y pendientes de pago vigentes (no se descuenta nada a mano: nada que se desincronice).
-- ------------------------------------------------------------------------------
alter table public.wines add column if not exists stock integer
    check (stock is null or stock >= 0);

-- ------------------------------------------------------------------------------
-- 2. PEDIDOS DE VINOS: costo de envío y zona de entrega
--    shipping_usd: costo de envío cobrado (0 = retiro, envío gratis o costo acordado por WhatsApp).
--    delivery_zone: nombre de la zona elegida, copiado al pedido (si luego se renombra o se
--    borra la zona, el pedido conserva lo que vio el cliente).
--    total_usd = subtotal_usd + shipping_usd.
-- ------------------------------------------------------------------------------
alter table public.wine_orders add column if not exists shipping_usd numeric not null default 0
    check (shipping_usd >= 0);
alter table public.wine_orders add column if not exists delivery_zone text;

-- ------------------------------------------------------------------------------
-- 3. PEDIDOS DE VINOS: con qué regla se cobró el envío (instantánea al crear el pedido)
--    shipping_mode: 'coordinate' (el costo se acuerda por WhatsApp y no va en el total), 'flat' (costo fijo)
--    o 'zones' (costo por zona). null = retiro, o pedido anterior a esta versión. Así la página del pedido,
--    el panel y los avisos saben si un envío de 0 fue «gratis» (flat/zones) o «a coordinar» (coordinate/null)
--    sin deducirlo de la configuración de ahora, que el administrador puede cambiar después.
-- ------------------------------------------------------------------------------
alter table public.wine_orders add column if not exists shipping_mode text
    check (shipping_mode is null or shipping_mode in ('coordinate', 'flat', 'zones'));

-- Que la API de Supabase (PostgREST) vea de inmediato las columnas nuevas.
notify pgrst, 'reload schema';
