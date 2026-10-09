import { NextResponse } from "next/server";
import { getCata } from "@/lib/catas";
import { ensureTickets, getOrderByToken, HOLD_MINUTES, toPublicOrder } from "@/lib/orders";
import { methodsForTasting, zelleForTasting } from "@/lib/paymentMethods";
import { getBcvRate, usdToBs } from "@/lib/rates";
import { getPaymentConfig } from "@/lib/settings";
import { toPublicTicket } from "../shared";

export const dynamic = "force-dynamic";

/** Orden vista por el comprador: estado del pago, monto en Bs, datos de pago y, si está aprobada, sus entradas. */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const order = await getOrderByToken(params.token);
    if (!order) {
      return NextResponse.json({ success: false, message: "Orden no encontrada." }, { status: 404 });
    }

    const awaitingPayment = order.status === "pending_payment" || order.status === "rejected";
    const currency = order.rateCurrency ?? "USD";
    const [rate, payment, tickets, tasting] = await Promise.all([
      awaitingPayment ? getBcvRate(currency) : null,
      getPaymentConfig(),
      // ensureTickets es idempotente: cubre también órdenes aprobadas antes de existir las entradas por persona.
      order.status === "approved" ? ensureTickets(order) : [],
      // Fecha ISO de la cata para mostrarla en el idioma del visitante (`tastingDate` se guarda en español).
      getCata(order.tastingId).catch(() => null),
    ]);
    const expiresAt = new Date(Date.parse(order.createdAt) + HOLD_MINUTES * 60_000).toISOString();
    // Solo la cuenta Zelle de esta cata (las demás no se muestran al cliente).
    const zelle = zelleForTasting(tasting, payment);

    return NextResponse.json({
      success: true,
      order: { ...toPublicOrder(order), tastingDateIso: tasting?.date ?? null, tickets: tickets.map(toPublicTicket) },
      holdExpiresAt: order.status === "pending_payment" ? expiresAt : null,
      rate: rate ? { currency, rate: rate.rate, updatedAt: rate.updatedAt, amountBs: usdToBs(order.totalUsd, rate.rate) } : null,
      payment: { ...payment, zelle: zelle ? [zelle] : [] },
      /** Métodos que acepta la cata de esta orden (y que están activos en Configuración). */
      methods: methodsForTasting(tasting, payment),
    });
  } catch (error) {
    console.error("[orders]", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar la orden." }, { status: 500 });
  }
}
