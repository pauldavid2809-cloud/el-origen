import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { countWhatsAppQueue, getSetting } from "@/lib/orders";
import { mailProvider } from "@/lib/mailer";
import { whatsappQueueEnabled } from "@/lib/notify";

export const dynamic = "force-dynamic";

interface BotHeartbeat {
  phone: string | null;
  connected: boolean;
  lastSeen: string;
}

/** Estado de los envíos para el panel: proveedor de WhatsApp, último latido del bot, mensajes en cola y canal de correo. */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  const meta = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  const queue = whatsappQueueEnabled();
  const [bot, queued] = await Promise.all([queue ? getSetting<BotHeartbeat>("whatsapp_bot") : null, countWhatsAppQueue()]);
  const running = Boolean(bot && Date.now() - new Date(bot.lastSeen).getTime() < 60_000);
  const online = running && Boolean(bot?.connected);

  return NextResponse.json({
    success: true,
    provider: meta ? "meta" : queue ? "bot" : "none",
    bot: bot ? { ...bot, running, online } : null,
    queued,
    mail: mailProvider() ?? "none",
  });
}
