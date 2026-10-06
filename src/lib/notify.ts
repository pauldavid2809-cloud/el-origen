import "server-only";
import QRCode from "qrcode";
import { Resend } from "resend";
import type { Order, DeliveryStatus } from "./orders";
import { CONTACT } from "./contact";

/* Notificaciones al cliente: correo (Resend) y WhatsApp (Meta Cloud API). */

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://el-origen-two.vercel.app").replace(/\/+$/, "");
}

export const orderUrl = (o: Pick<Order, "token">) => `${appUrl()}/orden/${o.token}`;
export const checkinUrl = (o: Pick<Order, "token">) => `${appUrl()}/verificar/${o.token}`;

export function qrPng(o: Pick<Order, "token">): Promise<Buffer> {
  return QRCode.toBuffer(checkinUrl(o), {
    width: 480,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#2A1519", light: "#FFFFFF" },
  });
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FROM = () => process.env.RESEND_FROM_EMAIL || "El Origen <onboarding@resend.dev>";

function resend(): Resend | null {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

function shell(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#F6F0E7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2A1519">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F0E7;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFCF7;border:1px solid #DACDBC;border-radius:12px;overflow:hidden">
<tr><td style="background:#7D2A46;padding:28px 28px 24px;text-align:center">
<p style="margin:0;font-family:Georgia,serif;font-size:26px;letter-spacing:4px;color:#F6F0E7;font-weight:bold">EL ORIGEN</p>
<p style="margin:6px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#D9A35A">Catas de vino · Caracas</p>
</td></tr>
<tr><td style="padding:28px">${body}</td></tr>
<tr><td style="border-top:1px solid #DACDBC;padding:18px 28px;text-align:center;font-size:12px;color:#6A5650">
Atención al cliente: <a href="https://wa.me/${CONTACT.whatsappNumber}" style="color:#7D2A46">${CONTACT.phoneDisplay}</a> · ${esc(CONTACT.instagramHandle)}<br>${esc(CONTACT.email)}
</td></tr></table></td></tr></table></body></html>`;
}

function detailsTable(o: Order): string {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#6A5650;width:120px;vertical-align:top">${k}</td><td style="padding:6px 0;font-size:14px;color:#2A1519;font-weight:600">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F2EADF;border-radius:8px;padding:14px 16px;margin:18px 0">
${row("Cata", esc(o.tastingTitle))}${row("Fecha", esc(o.tastingDate))}${row("Hora", esc(o.tastingTime))}${row("Lugar", esc(o.tastingLocation))}
${row("Cupos", `${o.spotsCount} persona${o.spotsCount === 1 ? "" : "s"}`)}${row("Código", esc(o.code))}</table>`;
}

/* ─── Correo con la entrada aprobada ─── */

export async function sendTicketEmail(o: Order): Promise<DeliveryStatus> {
  const client = resend();
  if (!client) return "disabled";
  const link = orderUrl(o);
  const html = shell(
    `Tu reserva en El Origen está confirmada`,
    `<p style="margin:0 0 12px;font-size:16px">Hola <strong>${esc(o.customerName)}</strong>,</p>
<p style="margin:0;font-size:15px;line-height:1.6;color:#4A3A36">Verificamos tu pago y tu reserva está <strong style="color:#2E7D4F">confirmada</strong>. Presenta este código QR al llegar; es válido para ${o.spotsCount} persona${o.spotsCount === 1 ? "" : "s"}.</p>
${detailsTable(o)}
<div style="text-align:center;margin:8px 0 20px"><img src="cid:qr-entrada" width="220" height="220" alt="Código QR de tu entrada ${esc(o.code)}" style="display:inline-block;border:1px solid #DACDBC;border-radius:8px"></div>
<div style="text-align:center"><a href="${link}" style="display:inline-block;background:#7D2A46;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:6px">Ver mi entrada</a></div>
<p style="margin:18px 0 0;font-size:12px;color:#6A5650;text-align:center">Si el botón no abre, copia este enlace: <a href="${link}" style="color:#7D2A46;word-break:break-all">${link}</a></p>`
  );
  try {
    const { error } = await client.emails.send({
      from: FROM(),
      to: [o.customerEmail],
      replyTo: CONTACT.email,
      subject: `Tu entrada para ${o.tastingTitle} · ${o.code}`,
      html,
      attachments: [{ filename: `entrada-${o.code}.png`, content: await qrPng(o), contentId: "qr-entrada" }],
    });
    if (error) throw new Error(error.message);
    return "sent";
  } catch (err) {
    console.error("[notify] Error enviando correo:", err);
    return "failed";
  }
}

export async function sendRejectionEmail(o: Order, reason: string): Promise<DeliveryStatus> {
  const client = resend();
  if (!client) return "disabled";
  const html = shell(
    "No pudimos verificar tu pago",
    `<p style="margin:0 0 12px;font-size:16px">Hola <strong>${esc(o.customerName)}</strong>,</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4A3A36">No pudimos verificar el pago de tu reserva <strong>${esc(o.code)}</strong>.</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;background:#F9DEDC;color:#8C1D18;padding:12px 14px;border-radius:6px">Motivo: ${esc(reason)}</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4A3A36">Puedes volver a reportar el pago desde tu orden o escribirnos por WhatsApp.</p>
<div style="text-align:center"><a href="${orderUrl(o)}" style="display:inline-block;background:#7D2A46;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:6px">Ir a mi orden</a></div>`
  );
  try {
    const { error } = await client.emails.send({
      from: FROM(),
      to: [o.customerEmail],
      replyTo: CONTACT.email,
      subject: `Revisa el pago de tu reserva ${o.code}`,
      html,
    });
    if (error) throw new Error(error.message);
    return "sent";
  } catch (err) {
    console.error("[notify] Error enviando correo de rechazo:", err);
    return "failed";
  }
}

/** Aviso interno: llegó un comprobante para revisar. */
export async function sendProofAlert(o: Order): Promise<void> {
  const client = resend();
  const to = process.env.ADMIN_NOTIFY_EMAIL || CONTACT.email;
  if (!client || !to) return;
  try {
    await client.emails.send({
      from: FROM(),
      to: [to],
      subject: `Comprobante por revisar · ${o.code} · ${o.customerName}`,
      html: shell(
        "Comprobante por revisar",
        `<p style="margin:0 0 8px;font-size:15px"><strong>${esc(o.customerName)}</strong> reportó un pago.</p>
<p style="margin:0;font-size:14px;color:#4A3A36">Referencia: <strong>${esc(o.paymentReference)}</strong> · Monto: Bs ${esc(o.paymentAmountBs)} · Total: $${o.totalUsd} USD</p>
${detailsTable(o)}
<div style="text-align:center"><a href="${appUrl()}/admin/reservas" style="display:inline-block;background:#7D2A46;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:6px">Revisar en el panel</a></div>`
      ),
    });
  } catch (err) {
    console.error("[notify] Error enviando aviso interno:", err);
  }
}

/* ─── WhatsApp (Meta Cloud API) ─── */

/** 0414-123.45.67 → 584141234567 */
export function normalizeVePhone(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "58" + d.slice(1);
  if (d.length === 10 && d.startsWith("4")) d = "58" + d;
  return d;
}

export async function sendTicketWhatsApp(o: Order): Promise<DeliveryStatus> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return "disabled";

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
        text: {
          preview_url: true,
          body:
            `¡Hola ${o.customerName}! 🍷\n\nTu reserva en *El Origen* está confirmada.\n\n` +
            `*${o.tastingTitle}*\n📅 ${o.tastingDate}\n🕖 ${o.tastingTime}\n📍 ${o.tastingLocation}\n` +
            `👥 ${o.spotsCount} cupo${o.spotsCount === 1 ? "" : "s"} · Código ${o.code}\n\n` +
            `Tu entrada con código QR está aquí:\n${link}\n\nPreséntala al llegar. ¡Te esperamos!`,
        },
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
