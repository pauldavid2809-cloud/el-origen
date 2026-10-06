import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { findOrderForCheckin, markCheckedIn, type Order } from "@/lib/orders";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas" });

function summary(o: Order) {
  return {
    code: o.code,
    customerName: o.customerName,
    customerDocId: o.customerDocId,
    spotsCount: o.spotsCount,
    tastingTitle: o.tastingTitle,
    tastingDate: o.tastingDate,
    tastingTime: o.tastingTime,
    dietaryRestrictions: o.dietaryRestrictions,
    status: o.status,
    checkedInAt: o.checkedInAt,
  };
}

/** Validación en puerta (solo personal con sesión de admin). action: "verify" | "checkin". */
export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { token, action = "verify" } = await request.json().catch(() => ({}));
  if (!token) return NextResponse.json({ success: false, message: "Ingrese o escanee un código." }, { status: 400 });

  const order = await findOrderForCheckin(String(token));
  if (!order) return NextResponse.json({ success: false, message: "Código no encontrado." });

  if (order.status !== "approved") {
    const why: Record<string, string> = {
      pending_payment: "El pago de esta reserva no ha sido reportado.",
      in_review: "El pago está en revisión: aún no ha sido aprobado.",
      rejected: "El pago de esta reserva fue rechazado.",
      cancelled: "Esta reserva fue anulada.",
    };
    return NextResponse.json({ success: false, order: summary(order), message: why[order.status] ?? "Reserva no válida." });
  }

  if (order.checkedInAt) {
    return NextResponse.json({
      success: false,
      order: summary(order),
      message: `Entrada YA UTILIZADA el ${when(order.checkedInAt)}.`,
    });
  }

  if (action !== "checkin") {
    return NextResponse.json({ success: true, order: summary(order), message: "Entrada válida. Lista para check-in." });
  }

  const done = await markCheckedIn(order.id, "Puerta");
  if (!done) {
    return NextResponse.json({ success: false, order: summary(order), message: "Esta entrada acaba de ser validada en otra puerta." });
  }
  return NextResponse.json({
    success: true,
    order: summary(done),
    message: `¡Bienvenido(s)! ${done.customerName} · ${done.spotsCount} persona${done.spotsCount === 1 ? "" : "s"}.`,
  });
}
