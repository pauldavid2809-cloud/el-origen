import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/auth";
import { ensureTickets, getOrderById, listWhatsAppQueue, setSetting, updateOrder } from "@/lib/orders";
import {
  buildTicketWhatsAppMessage,
  normalizeVePhone,
  ticketCheckinUrl,
  ticketLabel,
  ticketWhatsAppPolicies,
} from "@/lib/notify";

export const dynamic = "force-dynamic";

/* Cola para el bot de WhatsApp (carpeta whatsapp-bot/).
   El bot consulta (GET) cada pocos segundos y confirma cada envío (POST).
   Se autentica con el encabezado x-queue-token = WHATSAPP_QUEUE_SECRET. */

function authorized(request: Request): boolean {
  const secret = process.env.WHATSAPP_QUEUE_SECRET;
  const token = request.headers.get("x-queue-token");
  return Boolean(secret && token) && safeEqual(token as string, secret as string);
}

const unauthorized = () => NextResponse.json({ success: false, message: "Token de cola inválido." }, { status: 401 });

/**
 * Entradas por enviar. Cada elemento trae una imagen por persona (`tickets`):
 * la primera va con `message` + `policies`; las demás con su `caption` ("Entrada 2 de 3 · EO-XXXXX-2").
 * `qrData` (primera entrada) se mantiene para bots antiguos que envían una sola imagen.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return unauthorized();

  const bot = {
    phone: request.headers.get("x-bot-phone") || null,
    connected: request.headers.get("x-bot-connected") === "1",
  };
  await setSetting("whatsapp_bot", { ...bot, lastSeen: new Date().toISOString() });

  const orders = await listWhatsAppQueue(10);
  const queue = await Promise.all(
    orders.map(async (o) => {
      const tickets = (await ensureTickets(o)).map((t, _i, all) => ({
        qrData: ticketCheckinUrl(t),
        code: t.code,
        number: t.number,
        attendeeName: t.attendeeName,
        caption: [ticketLabel(t, all.length), t.attendeeName].filter(Boolean).join("\n"),
      }));
      return {
        orderId: o.id,
        code: o.code,
        name: o.customerName,
        phone: normalizeVePhone(o.customerPhone),
        message: buildTicketWhatsAppMessage(o),
        policies: ticketWhatsAppPolicies(),
        tickets,
        qrData: tickets[0]?.qrData ?? null,
      };
    })
  );
  return NextResponse.json({ success: true, queue });
}

/** Acuse del bot: { orderId, status: "sent" | "failed", error? } */
export async function POST(request: Request) {
  if (!authorized(request)) return unauthorized();

  const { orderId, status, error } = await request.json().catch(() => ({}));
  if (!orderId || !["sent", "failed"].includes(status)) {
    return NextResponse.json({ success: false, message: "orderId y status (sent|failed) son obligatorios." }, { status: 400 });
  }
  const order = await getOrderById(String(orderId));
  if (!order) return NextResponse.json({ success: false, message: "Orden no encontrada." }, { status: 404 });

  await updateOrder(order.id, { whatsappStatus: status });
  if (status === "failed") console.warn(`[whatsapp-bot] ${order.code} falló: ${String(error ?? "").slice(0, 200)}`);
  return NextResponse.json({ success: true });
}
