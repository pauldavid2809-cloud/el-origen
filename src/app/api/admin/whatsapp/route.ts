import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { countWhatsAppQueue, getSetting } from "@/lib/orders";
import { countWineWhatsAppQueue } from "@/lib/wineOrders";
import { mailProvider } from "@/lib/mailer";
import { whatsappQueueEnabled } from "@/lib/notify";

export const dynamic = "force-dynamic";

interface BotHeartbeat {
  phone: string | null;
  connected: boolean;
  lastSeen: string;
  /** Capacidades que declaró el bot en su última consulta (x-bot-caps); los bots anteriores no traen ninguna. */
  caps?: string[];
}

/**
 * Estado de los envíos para el panel: proveedor de WhatsApp, último latido del bot, mensajes en cola y canal de correo.
 * `queued` suma las entradas de las catas y los pedidos de vinos; `wineQueued` es la parte de vinos.
 * `bot.text` indica si el bot sabe enviar pedidos de vinos (los bots anteriores no: esos pedidos esperan en cola).
 */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  const meta = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  const queue = whatsappQueueEnabled();
  const [bot, ticketsQueued, wineQueued] = await Promise.all([
    queue ? getSetting<BotHeartbeat>("whatsapp_bot") : null,
    countWhatsAppQueue(),
    countWineWhatsAppQueue(),
  ]);
  const running = Boolean(bot && Date.now() - new Date(bot.lastSeen).getTime() < 60_000);
  const online = running && Boolean(bot?.connected);

  return NextResponse.json({
    success: true,
    provider: meta ? "meta" : queue ? "bot" : "none",
    bot: bot ? { ...bot, running, online, text: bot.caps?.includes("text") === true } : null,
    queued: ticketsQueued + wineQueued,
    wineQueued,
    mail: mailProvider() ?? "none",
  });
}
