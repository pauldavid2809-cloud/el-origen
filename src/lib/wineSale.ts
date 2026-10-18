/* ─────────────────────────────────────────────────────────────
   Venta de vinos: reglas compartidas por el servidor y el navegador
   (por eso este archivo NO lleva `server-only`: lo usan WineCard, el carrito, el panel y las rutas).
   ───────────────────────────────────────────────────────────── */

/** Tope de botellas por vino y pedido cuando el vino no define su propio `maxPerOrder`. */
export const WINE_DEFAULT_MAX_PER_ORDER = 12;
/** Tope absoluto de `maxPerOrder` (es también el máximo que acepta la base de datos). */
export const WINE_MAX_PER_ORDER_LIMIT = 24;
/** Vinos distintos por pedido. */
export const WINE_ORDER_MAX_LINES = 20;
/** Botellas por pedido (suma de todas las líneas). */
export const WINE_ORDER_MAX_BOTTLES = 36;
/** Un pedido pendiente de pago "vence" (de forma lógica) tras estas horas: deja de reservar existencias y de contar como pendiente. */
export const WINE_PENDING_TTL_HOURS = 72;
/** Pedidos en pending_payment vigentes (no vencidos) que un miembro puede tener a la vez. */
export const WINE_MAX_PENDING_PER_MEMBER = 3;

/** Lo mínimo de un vino para saber si se puede vender (sirve para `Wine`, `PublicWine` y `SaleWine`). */
export type SaleInfo = { status: string; saleActive: boolean; priceUsd: number | null };

/**
 * Regla única de venta: el vino se ve (publicado), el administrador lo activó para la venta y tiene precio.
 * «Publicado/Borrador» (status) y «Activo para la venta» (saleActive) son interruptores distintos.
 */
export function isWineForSale(w: SaleInfo): boolean {
  return w.status === "published" && w.saleActive === true && (w.priceUsd ?? 0) > 0;
}

/**
 * Máximo de botellas de este vino en un pedido: su `maxPerOrder` o, si no lo define, `defaultMax` (el valor que el
 * administrador configura en Tienda de vinos → Límites; por defecto 12). Siempre un entero de 1 a 24.
 */
export function wineMaxQty(w: { maxPerOrder: number | null }, defaultMax: number = WINE_DEFAULT_MAX_PER_ORDER): number {
  const fallback =
    typeof defaultMax === "number" && Number.isFinite(defaultMax) && defaultMax >= 1
      ? Math.min(Math.floor(defaultMax), WINE_MAX_PER_ORDER_LIMIT)
      : Math.min(WINE_DEFAULT_MAX_PER_ORDER, WINE_MAX_PER_ORDER_LIMIT);
  const n = w.maxPerOrder;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), WINE_MAX_PER_ORDER_LIMIT);
}

/**
 * Botellas que quedan de un vino: `stock` (total puesto a la venta; null = sin control de existencias) menos las
 * `held` reservadas por pedidos vigentes. Devuelve null cuando el vino no controla existencias (ilimitado) y nunca
 * un número negativo (un vino sobrevendido tiene 0 disponibles).
 */
export function availableOf(stock: number | null, held: number): number | null {
  if (typeof stock !== "number" || !Number.isFinite(stock)) return null;
  const reserved = typeof held === "number" && Number.isFinite(held) && held > 0 ? held : 0;
  return Math.max(0, Math.floor(stock) - Math.ceil(reserved));
}

/** Redondea a 2 decimales (dinero en USD). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
