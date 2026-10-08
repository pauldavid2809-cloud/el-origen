import { NextResponse } from "next/server";
import { requireDoorOrAdmin, scannerRole } from "@/lib/auth";
import {
  ensureTickets,
  findOrderForCheckin,
  findTicket,
  getOrderById,
  listTickets,
  markTicketCheckedIn,
  type Order,
  type Ticket,
} from "@/lib/orders";

export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas" });

const NOT_APPROVED: Record<string, string> = {
  pending_payment: "El pago de esta reserva no ha sido reportado.",
  in_review: "El pago está en revisión: aún no ha sido aprobado.",
  rejected: "El pago de esta reserva fue rechazado.",
  cancelled: "Esta reserva fue anulada.",
};

/** Lo que ve la puerta de una entrada. `number` = 0 cuando el QR es de la orden completa (QR antiguos). */
function summary(o: Order, ticket: Ticket | null, all: Ticket[]) {
  return {
    code: ticket?.code ?? o.code,
    number: ticket?.number ?? 0,
    attendeeName: ticket?.attendeeName ?? null,
    customerName: o.customerName,
    customerDocId: o.customerDocId,
    tastingTitle: o.tastingTitle,
    tastingDate: o.tastingDate,
    tastingTime: o.tastingTime,
    dietaryRestrictions: o.dietaryRestrictions,
    checkedInAt: ticket ? ticket.checkedInAt : o.checkedInAt,
    orderSpots: o.spotsCount,
    orderCheckedIn: all.filter((t) => t.checkedInAt).length,
    status: o.status,
  };
}

const reply = (success: boolean, message: string, ticket?: ReturnType<typeof summary>) =>
  NextResponse.json({ success, message, ...(ticket ? { ticket } : {}) });

/**
 * Validación en puerta (admin o sesión de puerta). Body: { token, action: "verify" | "checkin" }.
 * Acepta el token de una entrada, su código (EO-XXXXX-n) o la URL /verificar/<token>.
 * Los QR antiguos (uno por orden) siguen sirviendo: registran el ingreso de todas las entradas pendientes.
 */
export async function POST(request: Request) {
  const denied = requireDoorOrAdmin();
  if (denied) return denied;

  const { token, action = "verify" } = await request.json().catch(() => ({}));
  const input = typeof token === "string" ? token.trim() : "";
  if (!input) return NextResponse.json({ success: false, message: "Ingrese o escanee un código." }, { status: 400 });

  try {
    const by = scannerRole() === "admin" ? "Admin" : "Puerta";
    const ticket = await findTicket(input);
    const order = ticket ? await getOrderById(ticket.orderId) : await findOrderForCheckin(input);
    if (!order) return reply(false, "Código no encontrado.");

    if (order.status !== "approved") {
      const all = await listTickets(order.id);
      return reply(false, NOT_APPROVED[order.status] ?? "Reserva no válida.", summary(order, ticket, all));
    }

    if (ticket) return checkTicket(order, ticket, action === "checkin", by);
    return checkWholeOrder(order, action === "checkin", by);
  } catch (error) {
    console.error("[verify]", error);
    return NextResponse.json({ success: false, message: "No se pudo validar la entrada. Intente de nuevo." }, { status: 500 });
  }
}

/** Una entrada (QR por persona). */
async function checkTicket(order: Order, ticket: Ticket, checkin: boolean, by: string) {
  const all = await listTickets(order.id);
  const label = `Entrada ${ticket.number} de ${order.spotsCount}`;

  if (ticket.checkedInAt) {
    return reply(false, `${label} YA UTILIZADA el ${when(ticket.checkedInAt)}`, summary(order, ticket, all));
  }
  if (!checkin) return reply(true, `${label} válida. Lista para check-in.`, summary(order, ticket, all));

  const done = await markTicketCheckedIn(ticket.id, by);
  const fresh = await listTickets(order.id);
  if (!done) {
    const current = fresh.find((t) => t.id === ticket.id) ?? ticket;
    return reply(false, "Esta entrada acaba de ser validada en otra puerta.", summary(order, current, fresh));
  }
  const who = done.attendeeName || order.customerName;
  return reply(true, `¡Bienvenido(a), ${who}! ${label}.`, summary(order, done, fresh));
}

/** QR antiguo de la orden completa: valida todas las entradas que falten por ingresar. */
async function checkWholeOrder(order: Order, checkin: boolean, by: string) {
  const all = await ensureTickets(order);
  const pending = all.filter((t) => !t.checkedInAt);

  if (!pending.length) {
    const last = all.reduce<string | null>((acc, t) => (t.checkedInAt && (!acc || t.checkedInAt > acc) ? t.checkedInAt : acc), null);
    return reply(false, last ? `Entrada YA UTILIZADA el ${when(last)}` : "Entrada YA UTILIZADA.", summary(order, null, all));
  }
  const people = `${pending.length} persona${pending.length === 1 ? "" : "s"}`;
  if (!checkin) return reply(true, `Reserva válida para ${people}. Lista para check-in.`, summary(order, null, all));

  const done = (await Promise.all(pending.map((t) => markTicketCheckedIn(t.id, by)))).filter(Boolean).length;
  const fresh = await listTickets(order.id);
  if (!done) return reply(false, "Esta reserva acaba de ser validada en otra puerta.", summary(order, null, fresh));
  return reply(true, `¡Bienvenido(s)! ${order.customerName} · ${done} persona${done === 1 ? "" : "s"}.`, summary(order, null, fresh));
}
