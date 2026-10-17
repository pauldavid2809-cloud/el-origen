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
/** Un pedido pendiente de pago "vence" (de forma lógica, sin reservar stock) tras estas horas. */
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

/** Máximo de botellas de este vino en un pedido: su `maxPerOrder` o el valor por defecto, con tope de 24. */
export function wineMaxQty(w: { maxPerOrder: number | null }): number {
  const n = w.maxPerOrder;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 1) return Math.min(WINE_DEFAULT_MAX_PER_ORDER, WINE_MAX_PER_ORDER_LIMIT);
  return Math.min(Math.floor(n), WINE_MAX_PER_ORDER_LIMIT);
}

/** Redondea a 2 decimales (dinero en USD). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ─── Condiciones de compra ─── */

/**
 * Textos de la casilla de términos del checkout y del pie del pedido (es/en, trato de «tú»).
 * PENDIENTE CLIENTE: costo y zonas de envío, punto de retiro, política de devoluciones y existencias
 * no están definidos; estos textos solo dicen lo que el sistema hace hoy y deben revisarse con el cliente.
 */
export const WINE_POLICIES: Record<"es" | "en", { title: string; items: string[]; accept: string }> = {
  es: {
    title: "Condiciones de compra",
    items: [
      "Tu pedido se confirma cuando verificamos tu pago. Hasta entonces no se reserva ninguna botella.",
      `Si no reportas tu pago, el pedido vence a las ${WINE_PENDING_TTL_HOURS} horas. Si ya venció, escríbenos por WhatsApp o haz un pedido nuevo.`,
      "Los precios están en dólares (USD). Si pagas en bolívares, el monto se calcula con la tasa oficial del BCV del día.",
      // PENDIENTE CLIENTE: existencias. Hoy no se controlan: el administrador apaga «Activo» cuando un vino se agota.
      "Los vinos están sujetos a disponibilidad: si alguno se agotó antes de confirmar tu pago, te avisaremos por WhatsApp para acordar una solución.",
      // PENDIENTE CLIENTE: costo y zonas de envío, y punto de retiro.
      "El retiro o la entrega se coordinan por WhatsApp una vez confirmado el pago. El costo de envío no está incluido en el total.",
      // PENDIENTE CLIENTE: política de devoluciones.
      "Si recibes un producto dañado o distinto al que pediste, escríbenos por WhatsApp para resolverlo.",
      "La venta de bebidas alcohólicas es solo para mayores de 18 años.",
    ],
    accept: "Declaro ser mayor de 18 años y acepto las condiciones de compra.",
  },
  en: {
    title: "Purchase terms",
    items: [
      "Your order is confirmed once we verify your payment. No bottle is reserved until then.",
      `If you do not report your payment, the order expires after ${WINE_PENDING_TTL_HOURS} hours. If it has expired, message us on WhatsApp or place a new order.`,
      "Prices are in US dollars (USD). If you pay in bolívares, the amount is calculated with the official BCV rate of the day.",
      // PENDIENTE CLIENTE: existencias.
      "Wines are subject to availability: if one sells out before your payment is confirmed, we will let you know on WhatsApp to agree on a solution.",
      // PENDIENTE CLIENTE: costo y zonas de envío, y punto de retiro.
      "Pickup or delivery is arranged on WhatsApp once your payment is confirmed. The delivery cost is not included in the total.",
      // PENDIENTE CLIENTE: política de devoluciones.
      "If you receive a damaged product or one different from what you ordered, message us on WhatsApp so we can sort it out.",
      "Alcoholic beverages are sold only to people over 18.",
    ],
    accept: "I confirm that I am over 18 and I accept the purchase terms.",
  },
};
