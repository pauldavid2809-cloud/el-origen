import { NextResponse } from "next/server";
import { clientIp, consume, hit, isLimited, tooManyAttempts, type RateLimit } from "@/lib/rateLimit";
import { currentMember } from "@/lib/members";
import { getWine } from "@/lib/wines";
import {
  countPendingWineOrders,
  createWineOrder,
  findStockConflict,
  getWineHolds,
  isMissingV8Error,
  transitionWineOrder,
  type FulfillmentMethod,
  type WineOrderItem,
} from "@/lib/wineOrders";
import { getWineStoreConfigStrict } from "@/lib/wineStore";
import {
  caracasToday,
  deliveryDates,
  quoteShipping,
  schedulingCheck,
  type SchedulingCheck,
  type ShippingQuote,
  type WineStoreConfig,
} from "@/lib/wineStoreRules";
import {
  availableOf,
  isWineForSale,
  round2,
  wineMaxQty,
  WINE_MAX_PENDING_PER_MEMBER,
  WINE_MAX_PER_ORDER_LIMIT,
  WINE_ORDER_MAX_BOTTLES,
  WINE_ORDER_MAX_LINES,
  WINE_PENDING_TTL_HOURS,
} from "@/lib/wineSale";
import { readJsonBody, UUID_RE } from "../wine-orders/shared";

export const dynamic = "force-dynamic";

/** Pedidos creados por IP (igual que las reservas de catas). */
const ORDERS_PER_IP: RateLimit = { max: 5, windowMs: 15 * 60_000 };
/** Envíos (buenos o malos) por IP: tope holgado contra quien lanza peticiones sin parar; el estricto es ORDERS_PER_IP. */
const ATTEMPTS_PER_IP: RateLimit = { max: 40, windowMs: 15 * 60_000 };
/** Pedidos creados por miembro: tope extra por si la IP se falsea o cambia. */
const ORDERS_PER_MEMBER: RateLimit = { max: 6, windowMs: 60 * 60_000 };
/** Un pedido real (20 líneas) pesa unos 2 KB: 16 KB sobra y acota lo que se lee de quien aún no ha iniciado sesión. */
const MAX_BODY_BYTES = 16 * 1024;

const bad = (message: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ success: false, message, ...extra }, { status });

/** Texto del cuerpo: solo cadenas (o números) y con los espacios normalizados; cualquier otra cosa cuenta como vacía. */
const text = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : "").replace(/\s+/g, " ").trim();

/** Miembros con un pedido en proceso en esta instancia: dos envíos simultáneos no esquivan el tope de pendientes. */
const busyMembers = ((globalThis as unknown as { __eoWineCheckoutBusy?: Set<string> }).__eoWineCheckoutBusy ??= new Set<string>());

/** Cantidad de una línea: entero de 1 a 24 (número o texto numérico); null si no lo es. */
function parseQuantity(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= WINE_MAX_PER_ORDER_LIMIT ? n : null;
}

/** «Solo quedan 3 botellas de «X»», «Solo queda 1 botella de «X»» o «X se agotó». */
function stockMessage(name: string, available: number): string {
  if (available <= 0) return `«${name}» se agotó.`;
  return available === 1 ? `Solo queda 1 botella de «${name}».` : `Solo quedan ${available} botellas de «${name}».`;
}

/** Respuesta cuando el envío elegido no es válido con la configuración de ahora (zona obligatoria, zona quitada, modo apagado). */
function shippingError(quote: Extract<ShippingQuote, { ok: false }>) {
  const field = quote.code === "pickup_disabled" || quote.code === "delivery_disabled" ? "fulfillment" : "deliveryZoneId";
  // Falta elegir la zona = datos incompletos (400); lo demás significa que la configuración cambió desde que se abrió la página (409).
  return bad(quote.message, quote.code === "zone_required" ? 400 : 409, { code: quote.code, field });
}

/**
 * Respuesta cuando el día o la franja de entrega no sirven: falta elegir (400 `schedule_required`) o lo elegido ya no es válido con la
 * configuración de ahora (409 `schedule_invalid`: otro día, otra franja, un día sin atender, una fecha pasada…). Trae las opciones
 * vigentes (`today`, `dates`, `slots`) para que el carrito se actualice sin otra consulta.
 */
function scheduleError(check: Extract<SchedulingCheck, { ok: false }>, store: WineStoreConfig, today: string) {
  const s = store.delivery.scheduling;
  return bad(check.message, check.code === "schedule_required" ? 400 : 409, {
    code: check.code,
    field: check.field,
    today,
    dates: deliveryDates(s, today),
    slots: s.slots,
  });
}

/**
 * Abre el pedido de vinos (pendiente de pago) y devuelve el enlace privado para pagar y seguirlo.
 * Solo para miembros con sesión (Cuenta Origen): el pedido queda en su cuenta y usa el correo de la cuenta.
 * El cliente solo dice QUÉ vinos, CUÁNTAS botellas, cómo recibe el pedido y, si aplica, la zona (`deliveryZoneId`):
 * nombre, añada, precio, envío, existencias y totales los fija el servidor con la configuración de ahora.
 * Con la entrega programada activa, el cliente también envía `deliveryDate` ('YYYY-MM-DD') y `deliverySlot` (la franja): se validan
 * SIEMPRE aquí contra la configuración y el «hoy» de Caracas (`caracasToday()`); en un retiro, o con la programación apagada,
 * lo que envíe se ignora y el pedido guarda null.
 * Orden de las validaciones: configuración de la tienda ilegible (503) → tienda cerrada (403) → datos → entrega y zona →
 * día y franja de entrega (400/409) → vinos, precios y tope → existencias (409) → límite de pendientes → crear (subtotal + envío)
 * → rechequeo de existencias por carreras (409). El pedido recuerda con qué regla se cobró el envío (`shippingMode`).
 */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const ipKey = `wine-checkout:ip:${ip}`;
    if (isLimited(ipKey, ORDERS_PER_IP) || consume(`wine-checkout-try:ip:${ip}`, ATTEMPTS_PER_IP)) return tooManyAttempts();

    const read = await readJsonBody(request, MAX_BODY_BYTES);
    if (!read.ok) return read.tooLarge ? bad("La solicitud es demasiado grande.", 413) : bad("Solicitud inválida.");
    const body = read.body;

    // La configuración se lee una vez y se usa en toda la petición (así no cambia a mitad de camino). Aquí se cobra dinero:
    // si no se puede leer (o lo guardado ya no es válido) NO se asume la configuración por defecto, se responde 503.
    let store: WineStoreConfig;
    try {
      store = await getWineStoreConfigStrict();
    } catch (err) {
      console.error("[wine-checkout] Configuración de la tienda no disponible:", err);
      return bad("La tienda no está disponible por ahora. Inténtalo de nuevo en unos minutos.", 503, { code: "store_unavailable" });
    }
    if (!store.enabled) {
      return bad("La tienda está cerrada por ahora. Tus pedidos ya hechos se pueden seguir pagando desde su enlace.", 403, { code: "store_closed" });
    }

    const member = await currentMember();
    if (!member) return bad("Inicia sesión con tu Cuenta Origen para comprar.", 401, { code: "login_required" });

    const memberKey = `wine-checkout:member:${member.id}`;
    if (isLimited(memberKey, ORDERS_PER_MEMBER)) return tooManyAttempts();
    // Si ya hay un pedido de este miembro en marcha, no se procesa otro a la vez.
    if (busyMembers.has(member.id)) return tooManyAttempts("Ya estamos procesando tu pedido. Espera unos segundos e inténtalo de nuevo.");
    busyMembers.add(member.id);
    try {
      // El correo es siempre el de la cuenta: ahí llegan la confirmación y los avisos.
      const email = member.email.trim().toLowerCase();
      const name = text(body.customerName).slice(0, 120);
      const phone = text(body.customerPhone).slice(0, 40);
      const docId = text(body.customerDocId).replace(/[^0-9VEJvej-]/g, "").toUpperCase().slice(0, 20);
      const fulfillment: FulfillmentMethod | null = body.fulfillment === "pickup" || body.fulfillment === "delivery" ? body.fulfillment : null;
      const deliveryAddress = text(body.deliveryAddress).slice(0, 300);
      const deliveryNote = text(body.deliveryNote).slice(0, 300);
      const deliveryZoneId = text(body.deliveryZoneId).slice(0, 60);

      if (!name || !phone || !docId) return bad("Faltan datos obligatorios del pedido.");
      if (name.length < 3) return bad("Indica tu nombre completo.", 400, { field: "customerName" });
      const phoneDigits = phone.replace(/\D/g, "").length;
      if (phoneDigits < 10) return bad("El teléfono debe incluir el código de área.", 400, { field: "customerPhone" });
      if (phoneDigits > 15) return bad("El teléfono no es válido.", 400, { field: "customerPhone" });
      if (docId.replace(/\D/g, "").length < 5) return bad("La cédula no es válida.", 400, { field: "customerDocId" });
      if (!fulfillment) return bad("Elige si retiras o recibes tu pedido.", 400, { field: "fulfillment" });
      if (fulfillment === "delivery" && deliveryAddress.length < 8) {
        return bad("Indica la dirección de entrega.", 400, { field: "deliveryAddress" });
      }
      if (body.acceptedTerms !== true) {
        return bad("Debes aceptar las condiciones de compra para hacer el pedido.", 400, { field: "acceptedTerms" });
      }
      // ¿Se permite este modo de entrega y la zona existe? El costo definitivo se calcula abajo, con el subtotal.
      const early = quoteShipping(store, { fulfillment, subtotalUsd: 0, zoneId: deliveryZoneId });
      if (!early.ok) return shippingError(early);

      // Día y franja de entrega (preferencia que se confirma por WhatsApp): solo en la entrega a domicilio y con la programación
      // activa. Si no, lo que haya enviado el cliente se ignora. Se valida contra la configuración de ahora y el «hoy» de Caracas.
      let deliveryDate: string | null = null;
      let deliverySlot: string | null = null;
      if (fulfillment === "delivery") {
        const today = caracasToday();
        const schedule = schedulingCheck(store, { date: text(body.deliveryDate).slice(0, 40), slot: text(body.deliverySlot).slice(0, 120) }, today);
        if (!schedule.ok) return scheduleError(schedule, store, today);
        deliveryDate = schedule.date;
        deliverySlot = schedule.slot;
      }

      // Líneas: solo cuentan wineId y quantity. Los vinos repetidos se fusionan y todos los topes se aplican sobre el total.
      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (!rawItems.length) return bad("Tu carrito está vacío.", 400, { field: "items" });
      if (rawItems.length > WINE_ORDER_MAX_LINES) {
        return bad(`Puedes pedir hasta ${WINE_ORDER_MAX_LINES} vinos distintos por pedido.`, 400, { field: "items" });
      }
      const quantities = new Map<string, number>();
      for (const raw of rawItems) {
        const item = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
        const wineId = typeof item.wineId === "string" ? item.wineId.trim().toLowerCase() : "";
        const quantity = parseQuantity(item.quantity);
        if (!UUID_RE.test(wineId)) return bad("Uno de los vinos del pedido no es válido.", 400, { field: "items" });
        if (quantity === null) return bad(`La cantidad de cada vino debe ser un número entero de 1 a ${WINE_MAX_PER_ORDER_LIMIT}.`, 400, { field: "items" });
        quantities.set(wineId, (quantities.get(wineId) ?? 0) + quantity);
      }
      const ids = Array.from(quantities.keys());
      const bottles = Array.from(quantities.values()).reduce((sum, q) => sum + q, 0);
      if (bottles > WINE_ORDER_MAX_BOTTLES) {
        return bad(`Puedes pedir hasta ${WINE_ORDER_MAX_BOTTLES} botellas por pedido.`, 400, { field: "items" });
      }

      // Cada vino se relee de la base de datos: precio, estado y tope por pedido son los de ahora, nunca los del cliente.
      const wines = await Promise.all(ids.map((id) => getWine(id)));
      const items: WineOrderItem[] = [];
      let subtotal = 0;
      for (let i = 0; i < ids.length; i++) {
        const wine = wines[i];
        const quantity = quantities.get(ids[i]) ?? 0;
        const unitPriceUsd = round2(wine?.priceUsd ?? 0);
        if (!wine || wine.id !== ids[i] || !isWineForSale(wine) || !(unitPriceUsd > 0)) {
          // El nombre solo se menciona si el vino es público (publicado): el de un borrador no debe filtrarse.
          const known = wine && wine.id === ids[i] && wine.status === "published";
          return bad(
            known ? `«${wine.name}» ya no está disponible para la venta.` : "Uno de los vinos de tu carrito ya no está disponible.",
            409,
            { code: "wine_unavailable", wineId: ids[i] }
          );
        }
        const max = wineMaxQty(wine, store.defaultMaxPerOrder);
        if (quantity > max) {
          return bad(`Solo puedes pedir hasta ${max} botellas de «${wine.name}» por pedido.`, 400, { field: "items", wineId: wine.id });
        }
        items.push({
          wineId: wine.id,
          slug: wine.slug,
          name: String(wine.name ?? "").slice(0, 160),
          vintage: String(wine.vintage ?? "").slice(0, 20),
          unitPriceUsd,
          quantity,
        });
        subtotal = round2(subtotal + round2(unitPriceUsd * quantity));
      }
      if (!Number.isFinite(subtotal) || subtotal <= 0) return bad("No se pudo calcular el total del pedido.", 409, { code: "wine_unavailable" });

      // Existencias: solo los vinos que las controlan. Disponibles = totales − reservadas por pedidos vigentes.
      const stocks = new Map<string, number>();
      for (const wine of wines) if (wine && wine.stock !== null) stocks.set(wine.id, wine.stock);
      if (stocks.size) {
        const holds = await getWineHolds(Array.from(stocks.keys()));
        for (let i = 0; i < ids.length; i++) {
          const wine = wines[i];
          if (!wine) continue;
          const available = availableOf(wine.stock, holds.get(wine.id) ?? 0);
          if (available !== null && (quantities.get(ids[i]) ?? 0) > available) {
            return bad(stockMessage(wine.name, available), 409, { code: "insufficient_stock", wineId: wine.id, available });
          }
        }
      }

      if ((await countPendingWineOrders(member.id)) >= WINE_MAX_PENDING_PER_MEMBER) {
        return bad(
          `Ya tienes pedidos pendientes de pago. Reporta el pago desde el enlace de tu pedido, o espera a que venza (${WINE_PENDING_TTL_HOURS} horas) para hacer otro.`,
          409,
          { code: "too_many_pending" }
        );
      }

      // Sin cupones. El envío sale de la configuración (nunca de un monto del cliente) y se suma al total; en modo
      // «coordinar» vale 0 (el costo se acuerda por WhatsApp y no va en el total).
      const quote = quoteShipping(store, { fulfillment, subtotalUsd: subtotal, zoneId: deliveryZoneId });
      if (!quote.ok) return shippingError(quote);
      const order = await createWineOrder({
        memberId: member.id,
        customerName: name,
        customerEmail: email.slice(0, 160),
        customerPhone: phone,
        customerDocId: docId,
        items,
        bottlesCount: bottles,
        fulfillment,
        deliveryAddress: fulfillment === "delivery" ? deliveryAddress : null,
        deliveryNote: deliveryNote || null,
        deliveryDate,
        deliverySlot,
        subtotalUsd: subtotal,
        shippingUsd: quote.shippingUsd,
        deliveryZone: quote.zone?.name ?? null,
        // Con qué regla se cobró el envío (para que el pedido, el panel y los avisos no lo deduzcan de la configuración de ahora).
        shippingMode: fulfillment === "delivery" ? store.delivery.mode : null,
        totalUsd: round2(subtotal + quote.shippingUsd),
        acceptedTermsAt: new Date().toISOString(),
      });
      hit(ipKey, ORDERS_PER_IP);
      hit(memberKey, ORDERS_PER_MEMBER);

      // Rechequeo por carreras: dos compras de la última botella pueden haber pasado la comprobación de arriba a la vez.
      // Se atienden por orden de llegada (createdAt, id); la que no cabe se anula y no queda pagable en exceso.
      if (stocks.size) {
        let conflict: Awaited<ReturnType<typeof findStockConflict>>;
        try {
          conflict = await findStockConflict(order.id, stocks);
        } catch (err) {
          // Sin poder comprobar no se deja un pedido que podría exceder las existencias: se anula y se pide reintentar.
          console.error("[wine-checkout] No se pudo rechequear las existencias; se anula el pedido:", err);
          await transitionWineOrder(order.id, ["pending_payment"], { status: "cancelled" }).catch((e) =>
            console.error("[wine-checkout] No se pudo anular el pedido tras el fallo del rechequeo:", e)
          );
          return bad("No se pudo confirmar la disponibilidad. Intenta de nuevo.", 503);
        }
        if (conflict) {
          const lost = items.find((i) => i.wineId === conflict?.wineId);
          await transitionWineOrder(order.id, ["pending_payment"], { status: "cancelled" }).catch((e) =>
            console.error("[wine-checkout] No se pudo anular el pedido que no cabía en las existencias:", e)
          );
          return bad(stockMessage(lost?.name ?? "el vino", conflict.available), 409, {
            code: "insufficient_stock",
            wineId: conflict.wineId,
            available: conflict.available,
          });
        }
      }

      return NextResponse.json({ success: true, code: order.code, redirectUrl: `/pedido/${order.token}` });
    } finally {
      busyMembers.delete(member.id);
    }
  } catch (error) {
    console.error("[wine-checkout]", error);
    // Falta ejecutar supabase/v8.sql y el pedido lleva día y franja: no se puede guardar sin perderlos (el detalle queda en el registro).
    if (isMissingV8Error(error)) {
      return bad("La entrega con día y franja no está disponible por ahora. Inténtalo más tarde o elige el retiro.", 503, { code: "schedule_unavailable" });
    }
    return bad("No se pudo crear el pedido. Intenta de nuevo.", 500);
  }
}
