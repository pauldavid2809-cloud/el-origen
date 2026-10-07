import { NextResponse } from "next/server";
import { tastingWithAvailability } from "@/lib/availability";
import { todayInCaracas } from "@/lib/catas";
import { couponDiscountUsd, validateCouponForEmail } from "@/lib/coupons";
import { currentMember } from "@/lib/members";
import { createOrder, MAX_SPOTS_PER_ORDER, type OrderAddOn } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Máximo de unidades de un mismo adicional por orden. */
const MAX_ADDON_QUANTITY = 10;

const round2 = (n: number) => Math.round(n * 100) / 100;
const bad = (message: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ success: false, message, ...extra }, { status });

/** Crea la orden (pendiente de pago) y devuelve el enlace privado para pagar y ver las entradas. */
export async function POST(request: Request) {
  try {
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
    if (!tasting || tasting.status === "draft" || tasting.status === "archived" || tasting.date < todayInCaracas()) {
      return bad("La cata no está disponible.", 404);
    }
    if (tasting.availableSpots < spots) {
      return bad(
        tasting.availableSpots > 0 ? `Solo quedan ${tasting.availableSpots} cupos disponibles.` : "La cata está agotada.",
        409,
        { availableSpots: tasting.availableSpots }
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
    const rawCoupon = typeof body.couponCode === "string" ? body.couponCode.trim() : "";
    if (rawCoupon) {
      const result = await validateCouponForEmail(rawCoupon, email);
      if (!result.ok) return bad(result.reason, 400, { field: "couponCode", couponRejection: result.code });
      couponCode = result.coupon.code;
      discount = Math.min(subtotal, couponDiscountUsd(result.coupon, subtotal));
    }

    const member = await currentMember();
    const order = await createOrder({
      tastingId: tasting.id,
      tastingTitle: tasting.title,
      tastingDate: tasting.dateFull || tasting.dateDisplay,
      tastingTime: tasting.timeEnd ? `${tasting.timeStart} – ${tasting.timeEnd}` : tasting.timeStart,
      tastingLocation: tasting.location,
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
    });

    return NextResponse.json({ success: true, code: order.code, redirectUrl: `/orden/${order.token}` });
  } catch (error) {
    console.error("[checkout]", error);
    return bad("No se pudo crear la reserva. Intente de nuevo.", 500);
  }
}
