import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/auth";
import { ensureTickets, getOrderById, listWhatsAppQueue, setSetting, updateOrder, type Order } from "@/lib/orders";
import { getWineOrderById, listWineWhatsAppQueue, updateWineOrder, type WineOrder } from "@/lib/wineOrders";
import {
  buildTicketWhatsAppMessage,
  buildWineWhatsAppMessage,
  normalizeVePhone,
  ticketCheckinUrl,
  ticketLabel,
  ticketWhatsAppPolicies,
  wineStoreForNotices,
} from "@/lib/notify";
import type { PublicWineStore } from "@/lib/wineStoreRules";

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

/** Mensajes por consulta (entradas y pedidos de vinos juntos, del más antiguo al más reciente). */
const QUEUE_LIMIT = 10;

/** Capacidades que declara el bot en `x-bot-caps` (lista separada por comas): hoy solo `text`. */
function botCaps(request: Request): string[] {
  return (request.headers.get("x-bot-caps") ?? "")
    .toLowerCase()
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 10);
}

/** Entrada de la cola: una orden de catas (imágenes con QR) o un pedido de vinos (texto). */
type QueueEntry = { kind: "tickets"; order: Order } | { kind: "text"; order: WineOrder };

const timeOf = (iso: string) => Date.parse(iso) || 0;

/**
 * Mensajes por enviar. Cada elemento lleva `kind`:
 *  - "tickets" (reservas de catas): una imagen por persona (`tickets`); la primera va con `message` + `policies` y
 *    las demás con su `caption` ("Entrada 2 de 3 · EO-XXXXX-2"). `qrData` (primera entrada) se mantiene para bots
 *    antiguos que envían una sola imagen.
 *  - "text" (pedidos de vinos): solo `message`, sin imágenes (`tickets: []`, `qrData: null`). Un bot antiguo
 *    no sabe enviarlos, así que solo se incluyen si el bot declara `x-bot-caps: text`; sin él quedan en cola.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return unauthorized();

  const caps = botCaps(request);
  const bot = {
    phone: request.headers.get("x-bot-phone") || null,
    connected: request.headers.get("x-bot-connected") === "1",
  };
  await setSetting("whatsapp_bot", { ...bot, caps, lastSeen: new Date().toISOString() });

  // Las dos colas se fusionan por antigüedad ANTES de recortar: 10 en total, no 10 + 10. La de vinos nunca lanza.
  const [orders, wineOrders] = await Promise.all([
    listWhatsAppQueue(QUEUE_LIMIT),
    caps.includes("text") ? listWineWhatsAppQueue(QUEUE_LIMIT).catch(() => [] as WineOrder[]) : ([] as WineOrder[]),
  ]);
  const entries: QueueEntry[] = [
    ...orders.map((order): QueueEntry => ({ kind: "tickets", order })),
    ...wineOrders.map((order): QueueEntry => ({ kind: "text", order })),
  ]
    .sort((a, b) => timeOf(a.order.updatedAt) - timeOf(b.order.updatedAt))
    .slice(0, QUEUE_LIMIT);

  // Retiro y entrega de los pedidos de vinos salen de la configuración de la tienda: se lee una sola vez por consulta
  // (y solo si hay pedidos de vinos en esta tanda). Nunca lanza: ante un error usa los valores por defecto.
  const wineStore = entries.some((e) => e.kind === "text") ? await wineStoreForNotices() : undefined;

  // Un elemento que falla (p. ej. al crear sus entradas) se marca como fallido y la cola sigue: no tumba a los demás.
  const queue = (
    await Promise.all(
      entries.map(async (entry) => {
        try {
          return entry.kind === "text" ? wineItem(entry.order, wineStore) : await ticketsItem(entry.order);
        } catch (err) {
          console.error(`[whatsapp-queue] ${entry.order.code} no se pudo preparar:`, err);
          const mark = entry.kind === "text" ? updateWineOrder(entry.order.id, { whatsappStatus: "failed" }) : updateOrder(entry.order.id, { whatsappStatus: "failed" });
          await mark.catch(() => undefined);
          return null;
        }
      })
    )
  ).filter((item) => item !== null);
  return NextResponse.json({ success: true, queue });
}

async function ticketsItem(o: Order) {
  const tickets = (await ensureTickets(o)).map((t, _i, all) => ({
    qrData: ticketCheckinUrl(t),
    code: t.code,
    number: t.number,
    attendeeName: t.attendeeName,
    caption: [ticketLabel(t, all.length), t.attendeeName].filter(Boolean).join("\n"),
  }));
  return {
    kind: "tickets" as const,
    orderId: o.id,
    code: o.code,
    name: o.customerName,
    phone: normalizeVePhone(o.customerPhone),
    message: buildTicketWhatsAppMessage(o),
    policies: ticketWhatsAppPolicies(),
    tickets,
    qrData: tickets[0]?.qrData ?? null,
  };
}

function wineItem(o: WineOrder, store?: PublicWineStore) {
  return {
    kind: "text" as const,
    orderId: o.id,
    code: o.code,
    name: o.customerName,
    phone: normalizeVePhone(o.customerPhone),
    message: buildWineWhatsAppMessage(o, store),
    policies: "",
    tickets: [],
    qrData: null,
  };
}

/** Acuse del bot: { orderId, status: "sent" | "failed", error? }. El id puede ser de una orden de catas o de un pedido de vinos. */
export async function POST(request: Request) {
  if (!authorized(request)) return unauthorized();

  const { orderId, status, error } = await request.json().catch(() => ({}));
  if (!orderId || !["sent", "failed"].includes(status)) {
    return NextResponse.json({ success: false, message: "orderId y status (sent|failed) son obligatorios." }, { status: 400 });
  }
  const id = String(orderId);

  // Los ids son UUID aleatorios: no chocan entre las dos tablas.
  const order = await getOrderById(id);
  if (order) {
    await updateOrder(order.id, { whatsappStatus: status });
    if (status === "failed") console.warn(`[whatsapp-bot] ${order.code} falló: ${String(error ?? "").slice(0, 200)}`);
    return NextResponse.json({ success: true });
  }

  const wineOrder = await getWineOrderById(id).catch(() => null);
  if (!wineOrder) return NextResponse.json({ success: false, message: "Orden no encontrada." }, { status: 404 });

  await updateWineOrder(wineOrder.id, { whatsappStatus: status });
  if (status === "failed") console.warn(`[whatsapp-bot] ${wineOrder.code} falló: ${String(error ?? "").slice(0, 200)}`);
  return NextResponse.json({ success: true });
}
