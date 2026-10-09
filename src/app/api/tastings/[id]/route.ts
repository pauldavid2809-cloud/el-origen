import { NextResponse } from "next/server";
import { tastingWithAvailability } from "@/lib/availability";
import { PUBLIC_CATA_STATUSES } from "@/lib/catas";
import { findTicket, getOrderById } from "@/lib/orders";
import { methodsForTasting } from "@/lib/paymentMethods";
import { getPaymentConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

const TICKET_TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * ¿El token corresponde a una entrada aprobada de esta cata? Permite a quien tiene su entrada
 * (ficha de cata en vivo, certificado) seguir viendo la cata después de archivada.
 * Solo por token secreto, nunca por código visible.
 */
async function ticketGrantsAccess(ticketToken: string | null, tastingId: string): Promise<boolean> {
  const token = ticketToken?.trim() ?? "";
  if (!TICKET_TOKEN_RE.test(token)) return false;
  const ticket = await findTicket(token);
  if (!ticket || ticket.token !== token) return false;
  const order = await getOrderById(ticket.orderId);
  return Boolean(order && order.status === "approved" && order.tastingId === tastingId);
}

/**
 * Una cata publicada (por id o slug) con su disponibilidad real. Borradores y archivadas → 404,
 * salvo que `?ticket=<token>` sea una entrada aprobada de esa misma cata.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const [found, payment] = await Promise.all([tastingWithAvailability(decodeURIComponent(params.id)), getPaymentConfig()]);
    if (!found) {
      return NextResponse.json({ success: false, message: "Cata no encontrada." }, { status: 404 });
    }
    // Métodos que se ofrecen al pagar (los de la cata que estén activos en Configuración).
    const tasting = { ...found, paymentMethods: methodsForTasting(found, payment) };
    if (PUBLIC_CATA_STATUSES.includes(tasting.status)) {
      return NextResponse.json({ success: true, tasting });
    }

    const ticketToken = new URL(request.url).searchParams.get("ticket");
    if (!(await ticketGrantsAccess(ticketToken, tasting.id))) {
      return NextResponse.json({ success: false, message: "Cata no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ success: true, tasting }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[tastings] No se pudo leer la cata:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar la cata." }, { status: 500 });
  }
}
