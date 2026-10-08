import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { tastingWithAvailability } from "@/lib/availability";
import { ensureTickets, getOrderById, holdExpired, transitionOrder, updateOrder, type Order } from "@/lib/orders";
import { sendRejectionEmail, sendTicketEmail, sendTicketWhatsApp } from "@/lib/notify";

export const dynamic = "force-dynamic";

const fail = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });
/** Otra acción (u otra pestaña del panel) cambió la orden mientras tanto: no se envía nada. */
const changed = () => fail("La orden cambió mientras tanto (otra persona la revisó). Recargue la lista e intente de nuevo.", 409);

/** Crea las entradas que falten (una por persona) y las envía por correo y WhatsApp. */
async function deliverTickets(order: Order) {
  const tickets = await ensureTickets(order);
  const [emailStatus, whatsappStatus] = await Promise.all([sendTicketEmail(order, tickets), sendTicketWhatsApp(order)]);
  const updated = await updateOrder(order.id, { emailStatus, whatsappStatus });
  return { order: updated, tickets };
}

/**
 * Acciones del admin sobre una orden:
 *  approve → emite una entrada por persona y las envía por correo + WhatsApp
 *  reject  → pide al cliente volver a reportar el pago (con motivo, por correo)
 *  resend  → reenvía las entradas de una orden aprobada
 *  cancel  → anula la orden y libera los cupos
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { action, reason } = await request.json().catch(() => ({}));
  const order = await getOrderById(params.id);
  if (!order) return fail("Orden no encontrada.", 404);

  try {
    if (action === "approve") {
      if (order.status === "approved") return fail("La orden ya estaba aprobada.", 409);
      if (order.status === "cancelled") return fail("La orden está anulada.", 409);
      // Una orden rechazada o con el apartado vencido ya no retiene cupos: pudieron venderse a otra persona.
      if (order.status === "rejected" || holdExpired(order)) {
        const tasting = await tastingWithAvailability(order.tastingId);
        const available = tasting?.availableSpots ?? 0;
        if (available < order.spotsCount) {
          return fail(
            `La cata ya no tiene cupos suficientes para esta orden (${order.spotsCount} solicitados, ${available} libres). ` +
              "Aumente los cupos de la cata si desea aprobarla.",
            409
          );
        }
      }
      const approved = await transitionOrder(order.id, [order.status], {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin",
        rejectionReason: null,
      });
      if (!approved) return changed();
      return NextResponse.json({ success: true, ...(await deliverTickets(approved)) });
    }

    if (action === "reject") {
      const why = String(reason ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
      if (!why) return fail("Indique el motivo del rechazo.", 400);
      if (order.status === "cancelled") return fail("La orden está anulada.", 409);
      if (order.checkedInAt) return fail("La entrada ya fue usada.", 409);
      const updated = await transitionOrder(order.id, [order.status], {
        status: "rejected",
        rejectionReason: why,
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin",
      });
      if (!updated) return changed();
      const emailStatus = await sendRejectionEmail(updated, why);
      return NextResponse.json({ success: true, order: updated, emailStatus });
    }

    if (action === "resend") {
      if (order.status !== "approved") return fail("Solo se reenvían órdenes aprobadas.", 409);
      return NextResponse.json({ success: true, ...(await deliverTickets(order)) });
    }

    if (action === "cancel") {
      if (order.status === "cancelled") return fail("La orden ya estaba anulada.", 409);
      if (order.checkedInAt) return fail("La entrada ya fue usada.", 409);
      const updated = await transitionOrder(order.id, [order.status], {
        status: "cancelled",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin",
      });
      if (!updated) return changed();
      return NextResponse.json({ success: true, order: updated });
    }

    return fail("Acción no válida.", 400);
  } catch (error) {
    console.error("[admin/orders]", error);
    return fail("No se pudo completar la acción. Intente de nuevo.", 500);
  }
}
