import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getOrderById, updateOrder } from "@/lib/orders";
import { sendRejectionEmail, sendTicketEmail, sendTicketWhatsApp } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * Acciones del admin sobre una orden:
 *  approve → emite la entrada y envía correo + WhatsApp
 *  reject  → pide al cliente volver a reportar el pago (con motivo)
 *  resend  → reenvía las notificaciones de una orden aprobada
 *  cancel  → anula la orden y libera los cupos
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { action, reason } = await request.json().catch(() => ({}));
  const order = await getOrderById(params.id);
  if (!order) return NextResponse.json({ success: false, message: "Orden no encontrada." }, { status: 404 });

  try {
    if (action === "approve") {
      if (order.status === "approved") {
        return NextResponse.json({ success: false, message: "La orden ya estaba aprobada." }, { status: 409 });
      }
      if (order.status === "cancelled") {
        return NextResponse.json({ success: false, message: "La orden está anulada." }, { status: 409 });
      }
      let updated = await updateOrder(order.id, {
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin",
        rejectionReason: null,
      });
      const [emailStatus, whatsappStatus] = await Promise.all([sendTicketEmail(updated), sendTicketWhatsApp(updated)]);
      updated = await updateOrder(order.id, { emailStatus, whatsappStatus });
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === "reject") {
      const why = String(reason ?? "").trim();
      if (!why) return NextResponse.json({ success: false, message: "Indique el motivo del rechazo." }, { status: 400 });
      if (order.status === "approved" && order.checkedInAt) {
        return NextResponse.json({ success: false, message: "La entrada ya fue usada." }, { status: 409 });
      }
      const updated = await updateOrder(order.id, {
        status: "rejected",
        rejectionReason: why.slice(0, 300),
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin",
      });
      await sendRejectionEmail(updated, why);
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === "resend") {
      if (order.status !== "approved") {
        return NextResponse.json({ success: false, message: "Solo se reenvían órdenes aprobadas." }, { status: 409 });
      }
      const [emailStatus, whatsappStatus] = await Promise.all([sendTicketEmail(order), sendTicketWhatsApp(order)]);
      const updated = await updateOrder(order.id, { emailStatus, whatsappStatus });
      return NextResponse.json({ success: true, order: updated });
    }

    if (action === "cancel") {
      if (order.checkedInAt) {
        return NextResponse.json({ success: false, message: "La entrada ya fue usada." }, { status: 409 });
      }
      const updated = await updateOrder(order.id, {
        status: "cancelled",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Admin",
      });
      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ success: false, message: "Acción no válida." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
