import { NextResponse } from "next/server";
import { clientIp, hit, isLimited, tooManyAttempts, type RateLimit } from "@/lib/rateLimit";
import { tastingWithAvailability } from "@/lib/availability";
import { todayInCaracas } from "@/lib/catas";
import { couponDiscountUsd, validateCouponForEmail } from "@/lib/coupons";
import { currentMember } from "@/lib/members";
import { sendProofAlert } from "@/lib/notify";
import {
  createOrderChecked,
  holdExpired,
  listOrdersByEmail,
  MAX_SPOTS_PER_ORDER,
  tastingSnapshot,
  transitionOrder,
  type OrderAddOn,
} from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Máximo de unidades de un mismo adicional por orden. */
const MAX_ADDON_QUANTITY = 10;
/** Órdenes creadas por IP: cada orden aparta cupos durante el tiempo de pago. */
const ORDERS_PER_IP: RateLimit = { max: 5, windowMs: 15 * 60_000 };
/** Órdenes pendientes de pago (sin vencer) que un mismo correo puede tener en una cata. */
const MAX_PENDING_PER_EMAIL = 2;

const round2 = (n: number) => Math.round(n * 100) / 100;
const bad = (message: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ success: false, message, ...extra }, { status });
const soldOut = (availableSpots: number, spots: number) =>
  bad(
    availableSpots > 0 && availableSpots < spots ? `Solo quedan ${availableSpots} cupos disponibles.` : "La cata está agotada.",
    409,
    { availableSpots }
  );

/** Hora actual en Caracas, HH:MM (24 h). */
function nowInCaracas(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "America/Caracas", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
}

/** La cata ya empezó (o su fecha pasó): no se venden más cupos. */
function alreadyStarted(tasting: { date: string; timeStart: string }): boolean {
  const today = todayInCaracas();
  return tasting.date < today || (tasting.date === today && Boolean(tasting.timeStart) && nowInCaracas() >= tasting.timeStart);
}

/** Crea la orden (pendiente de pago) y devuelve el enlace privado para pagar y ver las entradas. */
export async function POST(request: Request) {
  try {
    const ipKey = `checkout:ip:${clientIp(request)}`;
    if (isLimited(ipKey, ORDERS_PER_IP)) return tooManyAttempts();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return bad("Solicitud inválida.");

    const name = String(body.customerName ?? "").replace(/\s+/g, " ").trim();
    const email = String(body.customerEmail ?? "").trim().toLowerCase();
    const phone = String(body.customerPhone ?? "").trim();
    const docId = String(body.customerDocId ?? "").replace(/[^0-9VEJvej-]/g, "").toUpperCase();
    const spots = Math.floor(Number(body.spotsCount));

    if (!body.tastingId || !name || !email || !phone || !docId || !spots) {
      return bad("Faltan datos obligatorios de la reserva.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("El correo no es válido.");
    if (phone.replace(/\D/g, "").length < 10) return bad("El teléfono debe incluir el código de área.");
    if (spots < 1 || spots > MAX_SPOTS_PER_ORDER) {
      return bad(`Puede reservar entre 1 y ${MAX_SPOTS_PER_ORDER} cupos por orden.`);
    }
    if (body.acceptedTerms !== true) {
      return bad("Debe aceptar los Términos y Condiciones y la Política de Privacidad para reservar.", 400, { field: "acceptedTerms" });
    }

    const tasting = await tastingWithAvailability(String(body.tastingId));
    if (!tasting || tasting.status === "draft" || tasting.status === "archived" || alreadyStarted(tasting)) {
      return bad("La cata no está disponible.", 404);
    }
    // "sold_out" también lo marca el admin a mano para cerrar la venta, aunque queden cupos libres.
    if (tasting.status === "sold_out") return soldOut(0, spots);
    if (tasting.availableSpots < spots) return soldOut(tasting.availableSpots, spots);

    const pending = (await listOrdersByEmail(email)).filter(
      (o) => o.tastingId === tasting.id && o.status === "pending_payment" && !holdExpired(o)
    );
    if (pending.length >= MAX_PENDING_PER_EMAIL) {
      return bad(
        "Ya tiene reservas pendientes de pago para esta cata. Reporte el pago desde el enlace de su orden o espere a que venza el apartado.",
        409,
        { code: "too_many_pending" }
      );
    }

    // Precios calculados en el servidor: solo adicionales definidos para ESTA cata.
    const quantities = new Map<string, number>();
    for (const item of Array.isArray(body.selectedAddOns) ? body.selectedAddOns : []) {
      const id = typeof item?.id === "string" ? item.id : "";
      const qty = Math.floor(Number(item?.quantity) || 0);
      if (id && qty > 0) quantities.set(id, Math.min(MAX_ADDON_QUANTITY, (quantities.get(id) ?? 0) + qty));
    }
    const addOns: OrderAddOn[] = [];
    for (const [id, quantity] of Array.from(quantities)) {
      const found = tasting.addOns.find((a) => a.id === id);
      if (!found) return bad("Uno de los adicionales ya no está disponible para esta cata.", 409);
      addOns.push({ id: found.id, title: found.title, price: found.priceUsd, quantity });
    }

    const subtotal = round2(tasting.priceUsd * spots + addOns.reduce((s, a) => s + a.price * a.quantity, 0));

    let discount = 0;
    let couponCode: string | null = null;
    let couponMaxUses: number | null = null;
    const rawCoupon = typeof body.couponCode === "string" ? body.couponCode.trim() : "";
    if (rawCoupon) {
      const result = await validateCouponForEmail(rawCoupon, email);
      if (!result.ok) return bad(result.reason, 400, { field: "couponCode", couponRejection: result.code });
      couponCode = result.coupon.code;
      couponMaxUses = result.coupon.maxUses;
      discount = Math.min(subtotal, couponDiscountUsd(result.coupon, subtotal));
    }

    const member = await currentMember();
    // Cupos y usos del cupón se comprueban de nuevo en la misma operación que crea la orden:
    // dos compras simultáneas no pueden llevarse los mismos últimos cupos ni superar el límite del cupón.
    const created = await createOrderChecked(
      {
        tastingId: tasting.id,
        ...tastingSnapshot(tasting),
        customerName: name.slice(0, 120),
        customerEmail: email.slice(0, 160),
        customerPhone: phone.slice(0, 40),
        customerDocId: docId.slice(0, 20),
        spotsCount: spots,
        dietaryRestrictions: body.dietaryRestrictions ? String(body.dietaryRestrictions).trim().slice(0, 500) || null : null,
        addOns,
        subtotalUsd: subtotal,
        discountUsd: discount,
        couponCode,
        totalUsd: Math.max(0, round2(subtotal - discount)),
        memberId: member?.id ?? null,
        acceptedTermsAt: new Date().toISOString(),
        rateCurrency: tasting.rateCurrency,
      },
      tasting.totalSpots,
      couponMaxUses
    );
    if (!created.ok) {
      if (created.reason === "coupon_exhausted") {
        return bad("El cupón ya alcanzó su límite de usos.", 400, { field: "couponCode", couponRejection: "exhausted" });
      }
      return bad("Otra persona acaba de reservar los últimos cupos. Revise la disponibilidad e intente de nuevo.", 409, {
        availableSpots: created.availableSpots,
      });
    }
    let order = created.order;
    hit(ipKey, ORDERS_PER_IP);

    // Sin monto que pagar (cupón del 100 %): no hay comprobante que reportar, pasa directo a revisión del admin.
    if (order.totalUsd <= 0) {
      const inReview = await transitionOrder(order.id, ["pending_payment"], {
        status: "in_review",
        proofSubmittedAt: new Date().toISOString(),
      });
      if (inReview) {
        order = inReview;
        await sendProofAlert(order);
      }
    }

    return NextResponse.json({ success: true, code: order.code, redirectUrl: `/orden/${order.token}` });
  } catch (error) {
    console.error("[checkout]", error);
    return bad("No se pudo crear la reserva. Intente de nuevo.", 500);
  }
}
