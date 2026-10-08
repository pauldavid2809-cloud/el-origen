import { NextResponse } from "next/server";
import { ATTENDEE_NAME_MAX, ensureTickets, getOrderByToken, setTicketAttendee } from "@/lib/orders";
import { toPublicTicket } from "../../../shared";

export const dynamic = "force-dynamic";

const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

/** El comprador pone (o quita) el nombre del asistente de una de sus entradas. Body: { attendeeName }. */
export async function PATCH(request: Request, { params }: { params: { token: string; number: string } }) {
  try {
    const body = await request.json().catch(() => null);
    const raw = body?.attendeeName;
    if (raw !== null && raw !== undefined && typeof raw !== "string") return bad("Nombre no válido.");
    const name = (raw ?? "").replace(/\s+/g, " ").trim();
    if (name.length > ATTENDEE_NAME_MAX) return bad(`El nombre admite hasta ${ATTENDEE_NAME_MAX} caracteres.`);

    const number = Number(params.number);
    if (!Number.isInteger(number) || number < 1) return bad("Entrada no encontrada.", 404);

    const order = await getOrderByToken(params.token);
    if (!order) return bad("Orden no encontrada.", 404);
    if (order.status !== "approved") return bad("Las entradas se habilitan cuando el pago es aprobado.", 409);

    const ticket = (await ensureTickets(order)).find((t) => t.number === number);
    if (!ticket) return bad("Entrada no encontrada.", 404);
    if (ticket.checkedInAt) return bad("Esta entrada ya fue usada en la puerta.", 409);

    const updated = await setTicketAttendee(ticket.id, name || null);
    return NextResponse.json({ success: true, ticket: toPublicTicket(updated) });
  } catch (error) {
    console.error("[tickets]", error);
    return bad("No se pudo guardar el nombre.", 500);
  }
}
