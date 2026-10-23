import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { DeliveryStatus } from "@/lib/orders";
import { deleteWineOrder, getWineOrderById, transitionWineOrder, updateWineOrder, type WineOrder } from "@/lib/wineOrders";
import { getStockWarnings } from "@/lib/wines";
import { sendWineOrderEmail, sendWineRejectionEmail, sendWineWhatsApp } from "@/lib/notify";

export const dynamic = "force-dynamic";

const fail = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });
/** Otra acción (u otra pestaña del panel) cambió el pedido mientras tanto: no se envía nada. */
const changed = () => fail("El pedido cambió mientras tanto (otra persona lo revisó). Recargue la lista e intente de nuevo.", 409);

/** Envía la confirmación por correo y WhatsApp y guarda cómo salió cada una. Los envíos nunca lanzan: el pedido queda registrado. */
async function deliverWineOrder(order: WineOrder): Promise<WineOrder> {
  const failed = (): DeliveryStatus => "failed";
  const [emailStatus, whatsappStatus] = await Promise.all([
    sendWineOrderEmail(order).catch(failed),
    sendWineWhatsApp(order).catch(failed),
  ]);
  return (await updateWineOrder(order.id, { emailStatus, whatsappStatus })) ?? { ...order, emailStatus, whatsappStatus };
}

/**
 * Acciones del admin sobre un pedido de vinos:
 *  approve → aprueba el pago y envía la confirmación por correo + WhatsApp. Nunca se bloquea por existencias (el cliente
 *            ya pagó): la respuesta trae `stockWarning` con los vinos que quedaron sobrevendidos (puede ser [])
 *  reject  → pide al cliente volver a reportar el pago (con motivo, por correo)
 *  cancel  → anula el pedido (no se avisa al cliente, igual que en las reservas)
 *  fulfill → marca el pedido aprobado como entregado o retirado
 *  resend  → reenvía la confirmación de un pedido aprobado
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { action, reason } = await request.json().catch(() => ({}));
  let order: WineOrder | null;
  try {
    order = await getWineOrderById(params.id);
  } catch (error) {
    console.error("[admin/wine-orders] No se pudo leer el pedido:", error);
    return fail("No se pudo leer el pedido. Intente de nuevo.", 500);
  }
  if (!order) return fail("Pedido no encontrado.", 404);

  try {
    if (action === "approve") {
      if (order.status === "approved") return fail("El pedido ya estaba aprobado.", 409);
      if (order.status === "cancelled") return fail("El pedido está anulado.", 409);
      const approved = await transitionWineOrder(order.id, [order.status], {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin",
        rejectionReason: null,
      });
      if (!approved) return changed();
      const [delivered, stockWarning] = await Promise.all([deliverWineOrder(approved), getStockWarnings(approved.items.map((i) => i.wineId))]);
      return NextResponse.json({ success: true, order: delivered, stockWarning });
    }

    if (action === "reject") {
      const why = String(reason ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
      if (!why) return fail("Indique el motivo del rechazo.", 400);
      if (order.status === "cancelled") return fail("El pedido está anulado.", 409);
      if (order.status === "rejected") return fail("El pedido ya estaba rechazado.", 409);
      if (order.deliveredAt) return fail("El pedido ya fue entregado.", 409);
      const updated = await transitionWineOrder(order.id, [order.status], {
        status: "rejected",
        rejectionReason: why,
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin",
      });
      if (!updated) return changed();
      const emailStatus = await sendWineRejectionEmail(updated, why).catch((): DeliveryStatus => "failed");
      return NextResponse.json({ success: true, order: updated, emailStatus });
    }

    if (action === "cancel") {
      if (order.status === "cancelled") return fail("El pedido ya estaba anulado.", 409);
      if (order.deliveredAt) return fail("El pedido ya fue entregado.", 409);
      const updated = await transitionWineOrder(order.id, [order.status], {
        status: "cancelled",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin",
      });
      if (!updated) return changed();
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === "fulfill") {
      if (order.status !== "approved") return fail("Solo se marcan como entregados los pedidos aprobados.", 409);
      if (order.deliveredAt) return fail("El pedido ya estaba marcado como entregado.", 409);
      const updated = await transitionWineOrder(order.id, ["approved"], { deliveredAt: new Date().toISOString() });
      if (!updated) return changed();
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === "resend") {
      if (order.status !== "approved") return fail("Solo se reenvían pedidos aprobados.", 409);
      return NextResponse.json({ success: true, order: await deliverWineOrder(order) });
    }

    return fail("Acción no válida.", 400);
  } catch (error) {
    console.error("[admin/wine-orders]", error);
    // Aprobar un pedido cuya referencia ya la usa otro pago en revisión o aprobado (índice único de la base).
    if (/referencia de pago/i.test((error as Error).message)) {
      return fail("Esa referencia de pago ya está registrada en otra reserva o pedido en revisión o aprobado. Revise cuál es el pago real antes de aprobar.", 409);
    }
    return fail("No se pudo completar la acción. Intente de nuevo.", 500);
  }
}

/** Elimina el pedido definitivamente (con su comprobante). No se puede deshacer. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    if (!(await deleteWineOrder(params.id))) return fail("Pedido no encontrado.", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/wine-orders]", error);
    return fail("No se pudo eliminar el pedido. Intente de nuevo.", 500);
  }
}
