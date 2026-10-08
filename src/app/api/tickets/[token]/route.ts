import { NextResponse } from "next/server";
import { getCata } from "@/lib/catas";
import { findTicket, getOrderById } from "@/lib/orders";

export const dynamic = "force-dynamic";

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

const notFound = () =>
  NextResponse.json(
    { success: false, message: "Entrada no encontrada." },
    { status: 404, headers: { "Cache-Control": "no-store" } }
  );

/**
 * Datos mínimos de una entrada para quien tiene su enlace (ficha de cata en vivo, certificado).
 * Solo por token secreto (no por código visible) y solo si la orden está aprobada.
 * No incluye datos de contacto, cédula ni estado de ingreso.
 */
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const token = decodeURIComponent(params.token ?? "").trim();
  if (!TOKEN_RE.test(token)) return notFound();

  try {
    const ticket = await findTicket(token);
    if (!ticket || ticket.token !== token) return notFound();
    const order = await getOrderById(ticket.orderId);
    if (!order || order.status !== "approved") return notFound();
    // Fecha ISO de la cata para mostrarla en el idioma del visitante (`tastingDate` se guarda en español).
    const tasting = await getCata(order.tastingId).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        ticket: {
          code: ticket.code,
          number: ticket.number,
          attendeeName: ticket.attendeeName,
          tastingId: order.tastingId,
          tastingTitle: order.tastingTitle,
          tastingDate: order.tastingDate,
          tastingDateIso: tasting?.date ?? null,
          customerName: order.customerName,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[tickets] No se pudo leer la entrada:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar la entrada." }, { status: 500 });
  }
}
