import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tastingWithAvailability } from "@/lib/availability";
import { createOrder, type OrderAddOn } from "@/lib/orders";

export const dynamic = "force-dynamic";

const MAX_SPOTS_PER_ORDER = 10;

/** Crea la orden (pendiente de pago) y devuelve el enlace privado para pagar y ver la entrada. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.customerName ?? "").trim();
    const email = String(body.customerEmail ?? "").trim().toLowerCase();
    const phone = String(body.customerPhone ?? "").trim();
    const docId = String(body.customerDocId ?? "").replace(/[^0-9VEJvej-]/g, "").toUpperCase();
    const spots = Math.floor(Number(body.spotsCount));

    if (!body.tastingId || !name || !email || !phone || !docId || !spots) {
      return NextResponse.json({ success: false, message: "Faltan datos obligatorios de la reserva." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "El correo no es válido." }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ success: false, message: "El teléfono debe incluir el código de área." }, { status: 400 });
    }
    if (spots < 1 || spots > MAX_SPOTS_PER_ORDER) {
      return NextResponse.json(
        { success: false, message: `Puede reservar entre 1 y ${MAX_SPOTS_PER_ORDER} cupos por orden.` },
        { status: 400 }
      );
    }

    const tasting = await tastingWithAvailability(String(body.tastingId));
    if (!tasting || tasting.status === "draft" || tasting.status === "archived") {
      return NextResponse.json({ success: false, message: "La cata no está disponible." }, { status: 404 });
    }
    if (tasting.availableSpots < spots) {
      return NextResponse.json(
        { success: false, message: `Solo quedan ${tasting.availableSpots} cupos disponibles.` },
        { status: 409 }
      );
    }

    // Precios calculados en el servidor
    const catalog = await db.getAddOns();
    const addOns: OrderAddOn[] = [];
    for (const item of Array.isArray(body.selectedAddOns) ? body.selectedAddOns : []) {
      const found = catalog.find((a) => a.id === item?.id);
      const qty = Math.min(10, Math.max(0, Math.floor(Number(item?.quantity) || 0)));
      if (found && qty > 0) addOns.push({ id: found.id, title: found.title, price: found.price, quantity: qty });
    }

    const subtotal = tasting.price * spots + addOns.reduce((s, a) => s + a.price * a.quantity, 0);
    let discount = 0;
    let couponCode: string | null = null;
    if (body.couponCode) {
      const coupon = await db.validateCoupon(String(body.couponCode));
      if (coupon) {
        couponCode = coupon.code;
        discount = coupon.discountPercent
          ? Math.round((subtotal * coupon.discountPercent) / 100)
          : Math.min(subtotal, coupon.discountAmount ?? 0);
      }
    }

    const order = await createOrder({
      tastingId: tasting.id,
      tastingTitle: tasting.title,
      tastingDate: tasting.dateFull || tasting.dateDisplay,
      tastingTime: `${tasting.timeStart} – ${tasting.timeEnd}`,
      tastingLocation: tasting.location,
      customerName: name.slice(0, 120),
      customerEmail: email.slice(0, 160),
      customerPhone: phone.slice(0, 40),
      customerDocId: docId.slice(0, 20),
      spotsCount: spots,
      dietaryRestrictions: body.dietaryRestrictions ? String(body.dietaryRestrictions).slice(0, 500) : null,
      addOns,
      subtotalUsd: subtotal,
      discountUsd: discount,
      couponCode,
      totalUsd: Math.max(0, Math.round((subtotal - discount) * 100) / 100),
    });

    return NextResponse.json({ success: true, code: order.code, redirectUrl: `/orden/${order.token}` });
  } catch (error) {
    console.error("[checkout]", error);
    return NextResponse.json({ success: false, message: "No se pudo crear la reserva. Intente de nuevo." }, { status: 500 });
  }
}
