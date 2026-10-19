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

/* ─── Envío: la regla con que se cobró un pedido ─── */

/** Modo de envío con el que se cobró un pedido (el mismo vocabulario que `DeliveryMode` de la configuración de la tienda). */
export type WineShippingMode = "coordinate" | "flat" | "zones";
export const WINE_SHIPPING_MODES: readonly WineShippingMode[] = ["coordinate", "flat", "zones"];

/**
 * ¿El envío de este pedido «se coordina por WhatsApp y se paga aparte»? Es la regla ÚNICA que usan la página del pedido,
 * «Mi cuenta», el panel y los avisos; se decide con lo que el pedido recordó al crearse (`shippingMode`), nunca con la
 * configuración de ahora: entrega, sin costo cobrado y modo «coordinar». Un pedido de entrega anterior a v7 (modo null) era
 * siempre «a coordinar». Con modo «costo fijo» o «por zonas» y costo 0, el envío salió GRATIS (no se acuerda nada aparte).
 */
export function isShippingCoordinated(o: {
  fulfillment: "pickup" | "delivery";
  shippingMode: WineShippingMode | null;
  shippingUsd: number;
  /** Con zona elegida el envío no pudo ser «a coordinar» (ese modo nunca guarda zona). */
  deliveryZone?: string | null;
}): boolean {
  return (
    o.fulfillment === "delivery" && o.shippingUsd === 0 && !o.deliveryZone && (o.shippingMode === "coordinate" || o.shippingMode === null)
  );
}

/**
 * Monto escrito por una persona: acepta "1.234,56", "1234,56", "1,234.56" o "25.5".
 * Con un solo punto seguido de exactamente 3 dígitos ("1.234") se interpreta como separador de miles (uso local).
 * Vive aquí (sin `server-only`) para que lo compartan los comprobantes de pago, el precio del vino y los montos que el
 * administrador escribe en Tienda de vinos: todos se interpretan con las mismas reglas.
 */
export function parseAmount(raw: string): number {
  const s = raw.replace(/[^\d.,]/g, "");
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let decimal = -1;
  if (lastComma >= 0 && lastDot >= 0) decimal = Math.max(lastComma, lastDot);
  else if (lastComma >= 0) decimal = lastComma;
  else if (lastDot >= 0 && s.indexOf(".") === lastDot && s.length - lastDot - 1 !== 3) decimal = lastDot;
  if (decimal < 0) return Number(s.replace(/[.,]/g, ""));
  return Number(`${s.slice(0, decimal).replace(/[.,]/g, "") || "0"}.${s.slice(decimal + 1).replace(/[.,]/g, "")}`);
}

/**
 * Monto en USD escrito por una persona (precio de un vino, costo de envío…). Estricto con la forma, para que un descuido no
 * cambie el valor en silencio: con `parseAmount` (tolerante a propósito, para los comprobantes) "5.5.5" sería 555 y "," sería 0.
 * Acepta "12", "12.5", "12,50", "$12", "12 USD", "1.000" (mil), "1.234,56" y "1,234.56". "1,000" es ambiguo (en Venezuela la
 * coma es el decimal) y, como todo lo demás que no tenga esa forma, da NaN.
 */
export function parseMoneyText(raw: string): number {
  const s = raw.replace(/usd|\$|\s/gi, "");
  if (/^\d+$/.test(s)) return Number(s);
  if (/^\d+[.,]\d{1,2}$/.test(s)) return Number(s.replace(",", "."));
  if (/^[1-9]\d{0,2}(?:\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ""));
  if (/^[1-9]\d{0,2}(?:\.\d{3})+,\d{1,2}$/.test(s)) return Number(s.replace(/\./g, "").replace(",", "."));
  if (/^[1-9]\d{0,2}(?:,\d{3})+\.\d{1,2}$/.test(s)) return Number(s.replace(/,/g, ""));
  return NaN;
}
