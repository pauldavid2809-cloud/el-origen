import "server-only";
import QRCode from "qrcode";
import type { Order, DeliveryStatus, Ticket } from "./orders";
import { CONTACT } from "./contact";
import { sendMail, type MailAttachment } from "./mailer";
import { policiesEmailHtml, policiesPlainText } from "./policies";

/* Notificaciones al cliente: correo (Gmail SMTP o Resend, vía mailer.ts) y WhatsApp
   (API de Meta o cola del bot propio). Cada persona recibe su propia entrada con QR. */

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://el-origen-two.vercel.app").replace(/\/+$/, "");
}

export const orderUrl = (o: Pick<Order, "token">) => `${appUrl()}/orden/${o.token}`;
/** Lo que codifica el QR de cada entrada: la página de validación con el token del ticket. */
export const ticketCheckinUrl = (t: Pick<Ticket, "token">) => `${appUrl()}/verificar/${t.token}`;

export function qrPng(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    width: 480,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#2A1519", light: "#FFFFFF" },
  });
}

/* ─── Etiquetas ─── */

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pago_movil: "Pago Móvil",
  transferencia: "Transferencia",
  binance_usdt: "Binance USDT",
  efectivo: "Efectivo",
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "Entrada 2 de 3 · EO-7KQ2M-2" */
export const ticketLabel = (t: Pick<Ticket, "number" | "code">, total: number) => `Entrada ${t.number} de ${total} · ${t.code}`;

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ─── Plantilla de correo ─── */

function shell(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F6F0E7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2A1519">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F0E7;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFCF7;border:1px solid #DACDBC;border-radius:12px;overflow:hidden">
<tr><td style="background:#7D2A46;padding:28px 28px 24px;text-align:center">
<p style="margin:0;font-family:Georgia,serif;font-size:26px;letter-spacing:4px;color:#F6F0E7;font-weight:bold">EL ORIGEN</p>
<p style="margin:6px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#D9A35A">Catas guiadas · ${esc(CONTACT.city)}</p>
</td></tr>
<tr><td style="padding:28px">${body}</td></tr>
<tr><td style="border-top:1px solid #DACDBC;padding:18px 28px;text-align:center;font-size:12px;color:#6A5650">
Atención al cliente: <a href="https://wa.me/${CONTACT.whatsappNumber}" style="color:#7D2A46">${esc(CONTACT.phoneDisplay)}</a> · ${esc(CONTACT.instagramHandle)}<br>${esc(CONTACT.email)}
</td></tr></table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<div style="text-align:center"><a href="${esc(href)}" style="display:inline-block;background:#7D2A46;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:6px">${esc(label)}</a></div>`;

function detailsTable(o: Order): string {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#6A5650;width:120px;vertical-align:top">${k}</td><td style="padding:6px 0;font-size:14px;color:#2A1519;font-weight:600">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F2EADF;border-radius:8px;padding:14px 16px;margin:18px 0">
${row("Cata", esc(o.tastingTitle))}${row("Fecha", esc(o.tastingDate))}${row("Hora", esc(o.tastingTime))}${row("Lugar", esc(o.tastingLocation))}
${row("Cupos", esc(plural(o.spotsCount, "persona", "personas")))}${row("Código", esc(o.code))}</table>`;
}

/** Un bloque por entrada: rótulo, nombre del asistente (si lo hay) y su QR en línea. */
function ticketBlocks(tickets: Ticket[]): string {
  const total = tickets.length;
  return tickets
    .map(
      (t) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #DACDBC;border-radius:10px;margin:0 0 14px"><tr><td style="padding:16px;text-align:center">
<p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7D2A46;font-weight:bold">Entrada ${t.number} de ${total}</p>
<p style="margin:4px 0 12px;font-size:15px;font-weight:600;color:#2A1519">${esc(t.code)}${t.attendeeName ? ` · ${esc(t.attendeeName)}` : ""}</p>
<img src="cid:qr-${t.number}" width="200" height="200" alt="Código QR de la entrada ${esc(t.code)}" style="display:inline-block;border:1px solid #DACDBC;border-radius:8px">
</td></tr></table>`
    )
    .join("");
}

/* ─── Correo con las entradas aprobadas ─── */

/** Envía el correo con un QR por persona. Recibe las entradas ya creadas (`ensureTickets`). */
export async function sendTicketEmail(o: Order, tickets: Ticket[]): Promise<DeliveryStatus> {
  if (!tickets.length) return "failed";
  const link = orderUrl(o);
  const many = tickets.length > 1;
  const html = shell(
    "Tu reserva en El Origen está confirmada",
    `<p style="margin:0 0 12px;font-size:16px">Hola <strong>${esc(o.customerName)}</strong>,</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#4A3A36">Verificamos tu pago y tu reserva está <strong style="color:#2E7D4F">confirmada</strong>. ${
      many
        ? `Aquí tienes ${tickets.length} entradas: <strong>cada persona presenta su propio código QR</strong> al llegar. Puedes reenviar a cada invitado la suya desde el enlace de tu orden.`
        : "Presenta este código QR al llegar."
    }</p>
${detailsTable(o)}
${ticketBlocks(tickets)}
${button(link, many ? "Ver y compartir mis entradas" : "Ver mi entrada")}
<p style="margin:18px 0 0;font-size:12px;color:#6A5650;text-align:center">Si el botón no abre, copia este enlace: <a href="${esc(link)}" style="color:#7D2A46;word-break:break-all">${esc(link)}</a></p>
${policiesEmailHtml("es")}`
  );

  const attachments: MailAttachment[] = await Promise.all(
    tickets.map(async (t) => ({
      filename: `entrada-${t.code}.png`,
      content: await qrPng(ticketCheckinUrl(t)),
      cid: `qr-${t.number}`,
      contentType: "image/png",
    }))
  );

  return sendMail({
    to: o.customerEmail,
    replyTo: CONTACT.email,
    subject: `${many ? "Tus entradas" : "Tu entrada"} para ${o.tastingTitle} · ${o.code}`,
    html,
    attachments,
  });
}

export async function sendRejectionEmail(o: Order, reason: string): Promise<DeliveryStatus> {
  const html = shell(
    "No pudimos verificar tu pago",
    `<p style="margin:0 0 12px;font-size:16px">Hola <strong>${esc(o.customerName)}</strong>,</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4A3A36">No pudimos verificar el pago de tu reserva <strong>${esc(o.code)}</strong> para <strong>${esc(o.tastingTitle)}</strong>.</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;background:#F9DEDC;color:#8C1D18;padding:12px 14px;border-radius:6px">Motivo: ${esc(reason)}</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4A3A36">Puedes volver a reportar el pago desde tu orden o escribirnos por WhatsApp al <a href="https://wa.me/${CONTACT.whatsappNumber}" style="color:#7D2A46">${esc(CONTACT.phoneDisplay)}</a>.</p>
${button(orderUrl(o), "Ir a mi orden")}
${policiesEmailHtml("es")}`
  );
  return sendMail({
    to: o.customerEmail,
    replyTo: CONTACT.email,
    subject: `Revisa el pago de tu reserva ${o.code}`,
    html,
  });
}

/** Resumen del pago reportado, según el método (para el aviso interno). */
function paymentSummary(o: Order): string {
  if (o.totalUsd <= 0) return "Sin monto que pagar (descuento del 100 %) · Total: $0 USD";
  const method = PAYMENT_METHOD_LABEL[o.paymentMethod ?? ""] ?? "Pago";
  if (o.paymentMethod === "efectivo") return `${method}: el cliente indica que coordinó la entrega · Total: $${o.totalUsd} USD`;
  const amount =
    o.paymentAmountBs === null ? "—" : o.paymentMethod === "binance_usdt" ? `${o.paymentAmountBs} USDT` : `Bs ${o.paymentAmountBs}`;
  return `${method} · Referencia: <strong>${esc(o.paymentReference)}</strong> · Monto: ${esc(amount)} · Total: $${o.totalUsd} USD`;
}

/* Tope de avisos internos: una ráfaga de reportes (o un script) no debe agotar el cupo diario del SMTP,
   que también envía las entradas a los clientes. Pasado el tope, los avisos se cuentan y se resumen en el
   primero de la ventana siguiente; los pagos siempre quedan en el panel. En memoria del proceso. */
const ALERT_WINDOW_MS = 60 * 60_000;
const ALERTS_PER_WINDOW = 20;
const alertBudget = ((globalThis as unknown as { __eoProofAlerts?: { windowStart: number; sent: number; skipped: number } })
  .__eoProofAlerts ??= { windowStart: 0, sent: 0, skipped: 0 });

/** Aviso interno: llegó un pago para revisar. */
export async function sendProofAlert(o: Order): Promise<void> {
  const to = process.env.ADMIN_NOTIFY_EMAIL || CONTACT.email;
  if (!to) return;

  const now = Date.now();
  if (now - alertBudget.windowStart >= ALERT_WINDOW_MS) {
    alertBudget.windowStart = now;
    alertBudget.sent = 0;
  }
  if (alertBudget.sent >= ALERTS_PER_WINDOW) {
    alertBudget.skipped += 1;
    return;
  }
  alertBudget.sent += 1;
  const skipped = alertBudget.skipped;
  alertBudget.skipped = 0;
  const lastInWindow = alertBudget.sent === ALERTS_PER_WINDOW;

  await sendMail({
    to,
    subject: `Pago por revisar · ${o.code} · ${o.customerName}`,
    html: shell(
      "Pago por revisar",
      `${
        skipped
          ? `<p style="margin:0 0 14px;font-size:14px;background:#F2EADF;padding:10px 12px;border-radius:6px">Además, llegaron <strong>${skipped}</strong> ${skipped === 1 ? "pago" : "pagos"} sin aviso individual. Revíselos en el panel.</p>`
          : ""
      }${
        lastInWindow
          ? `<p style="margin:0 0 14px;font-size:14px;background:#F9DEDC;color:#8C1D18;padding:10px 12px;border-radius:6px">Llegaron muchos reportes seguidos: se pausan los avisos por correo durante una hora. Los pagos siguen apareciendo en el panel.</p>`
          : ""
      }<p style="margin:0 0 8px;font-size:15px"><strong>${esc(o.customerName)}</strong> reportó un pago.</p>
<p style="margin:0;font-size:14px;color:#4A3A36">${paymentSummary(o)}</p>
${o.paymentNote ? `<p style="margin:8px 0 0;font-size:14px;color:#4A3A36">Nota del cliente: ${esc(o.paymentNote)}</p>` : ""}
${o.couponCode ? `<p style="margin:8px 0 0;font-size:14px;color:#4A3A36">Cupón: <strong>${esc(o.couponCode)}</strong></p>` : ""}
${detailsTable(o)}
${button(`${appUrl()}/admin/reservas`, "Revisar en el panel")}`
    ),
  });
}

/* ─── WhatsApp ─── */

/** 0414-123.45.67 → 584141234567 */
export function normalizeVePhone(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "58" + d.slice(1);
  if (d.length === 10 && d.startsWith("4")) d = "58" + d;
  return d;
}

/* Variaciones del mensaje: textos idénticos y masivos son una señal de spam para WhatsApp,
   así que se alterna saludo y cierre según la orden (como en el bot del congreso). */
const GREETINGS = [
  (n: string) => `¡Hola ${n}! 🍷`,
  (n: string) => `¡Hola, ${n}! Qué gusto saludarte 🍇`,
  (n: string) => `${n}, ¡buenas noticias! ✨`,
  (n: string) => `¡Saludos ${n}! 🥂`,
];
const CLOSINGS = [
  "¡Te esperamos para brindar!",
  "Nos vemos pronto, copa en mano.",
  "Gracias por elegirnos. ¡Salud!",
  "Será un placer recibirte.",
];

/** Mensaje principal de la entrada (sin políticas): va como texto de la primera imagen. */
export function buildTicketWhatsAppMessage(o: Order): string {
  const seed = Array.from(o.code).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const first = o.customerName.trim().split(/\s+/)[0] || o.customerName;
  const many = o.spotsCount > 1;
  return [
    GREETINGS[seed % GREETINGS.length](first),
    "",
    "Verificamos tu pago y tu reserva en *El Origen* está confirmada.",
    "",
    `*${o.tastingTitle}*`,
    `📅 ${o.tastingDate}`,
    `🕖 ${o.tastingTime}`,
    `📍 ${o.tastingLocation}`,
    `👥 ${plural(o.spotsCount, "persona", "personas")} · Código *${o.code}*`,
    "",
    many
      ? `Te enviamos ${o.spotsCount} entradas, una por persona: cada invitado presenta su propio QR al llegar. Puedes reenviarle a cada uno la suya. También las ves aquí:`
      : "Presenta el código QR de esta imagen al llegar. También puedes verlo aquí:",
    orderUrl(o),
    "",
    "Si tienes alguna duda, responde a este mensaje.",
    CLOSINGS[seed % CLOSINGS.length],
  ].join("\n");
}

/** Políticas de la experiencia con formato de WhatsApp (texto literal del cliente). */
export const ticketWhatsAppPolicies = () => policiesPlainText("es", { whatsapp: true });

/** Hay bot propio (Baileys) consultando la cola. */
export function whatsappQueueEnabled(): boolean {
  return Boolean(process.env.WHATSAPP_QUEUE_SECRET);
}

function metaConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Envío del WhatsApp de las entradas:
 *  1. API oficial de Meta, si está configurada (texto con el enlace a las entradas).
 *  2. Si no, se deja en cola para el bot propio (carpeta whatsapp-bot/), que envía una imagen por entrada.
 */
export async function sendTicketWhatsApp(o: Order): Promise<DeliveryStatus> {
  if (metaConfigured()) {
    const status = await sendViaMeta(o);
    if (status === "sent" || !whatsappQueueEnabled()) return status;
  }
  return whatsappQueueEnabled() ? "queued" : "disabled";
}

async function sendViaMeta(o: Order): Promise<DeliveryStatus> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN as string;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID as string;
  const to = normalizeVePhone(o.customerPhone);
  const link = orderUrl(o);
  const template = process.env.WHATSAPP_TEMPLATE_NAME;

  // Fuera de la ventana de 24 h Meta solo permite plantillas aprobadas: se recomienda definir WHATSAPP_TEMPLATE_NAME.
  const payload = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "es" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: o.customerName },
                { type: "text", text: o.tastingTitle },
                { type: "text", text: `${o.tastingDate}, ${o.tastingTime}` },
                { type: "text", text: link },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: true, body: `${buildTicketWhatsAppMessage(o)}\n\n${ticketWhatsAppPolicies()}` },
      };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(JSON.stringify(await res.json().catch(() => ({}))));
    return "sent";
  } catch (err) {
    console.error("[notify] Error enviando WhatsApp:", err);
    return "failed";
  }
}
