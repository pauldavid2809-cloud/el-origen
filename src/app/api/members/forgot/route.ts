import { NextResponse } from "next/server";
import { CONTACT } from "@/lib/contact";
import { isMailEnabled, sendMail } from "@/lib/mailer";
import { createResetToken, getMemberByEmail, normalizeEmail, type Member } from "@/lib/members";
import { LIMITS, clientIp, consume, readJson, str } from "../shared";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

/**
 * Pide un enlace para restablecer la contraseña. Body: { email, lang? }.
 * Responde siempre lo mismo (exista o no la cuenta). `mailEnabled: false` indica que el sitio no tiene
 * correo configurado, para que la página ofrezca WhatsApp en su lugar (no revela nada de la cuenta).
 */
export async function POST(request: Request) {
  const mailEnabled = isMailEnabled();
  const ok = NextResponse.json({ success: true, mailEnabled });

  const body = await readJson(request);
  const email = normalizeEmail(str(body.email)).slice(0, 200);
  const lang: Lang = body.lang === "en" ? "en" : "es";
  if (!email || !mailEnabled) return ok;

  // Por encima del límite se responde igual, pero sin enviar más correos.
  if (consume(`forgot:${clientIp(request)}`, LIMITS.forgotPerIp)) return ok;
  if (consume(`forgot:${email}`, LIMITS.forgotPerEmail)) return ok;

  try {
    const member = await getMemberByEmail(email);
    if (member) {
      const token = await createResetToken(member);
      const result = await sendMail({
        to: member.email,
        subject: lang === "en" ? "Reset your El Origen password" : "Restablece tu contraseña de El Origen",
        html: resetEmailHtml(member, `${appUrl()}/restablecer?token=${encodeURIComponent(token)}`, lang),
      });
      if (result !== "sent") console.error(`[members/forgot] El correo de recuperación no se envió (${result}).`);
    }
  } catch (err) {
    console.error("[members/forgot]", err);
  }
  return ok;
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://el-origen-two.vercel.app").replace(/\/+$/, "");
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const EMAIL_COPY = {
  es: {
    greeting: (name: string) => `Hola, ${name}:`,
    intro: "Recibimos una solicitud para restablecer la contraseña de tu Cuenta Origen. Pulsa el botón para crear una nueva:",
    button: "Crear nueva contraseña",
    expiry: "El enlace vence en 1 hora y deja de funcionar en cuanto cambies la contraseña.",
    ignore: "Si no lo pediste, ignora este correo: tu contraseña actual sigue siendo válida.",
    fallback: "Si el botón no funciona, copia este enlace en tu navegador:",
    support: "Atención al cliente",
  },
  en: {
    greeting: (name: string) => `Hello ${name},`,
    intro: "We received a request to reset the password of your Origen Account. Tap the button to create a new one:",
    button: "Create a new password",
    expiry: "The link expires in 1 hour and stops working as soon as you change your password.",
    ignore: "If you didn't ask for this, ignore this email: your current password is still valid.",
    fallback: "If the button doesn't work, copy this link into your browser:",
    support: "Customer service",
  },
} satisfies Record<Lang, unknown>;

function resetEmailHtml(member: Member, link: string, lang: Lang): string {
  const t = EMAIL_COPY[lang];
  const firstName = member.fullName.split(" ")[0] || member.fullName;
  const p = (text: string, style = "") => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;${style}">${text}</p>`;
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.button)}</title></head>
<body style="margin:0;padding:0;background:#F6F0E7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2A1519">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F0E7;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFCF7;border:1px solid #DACDBC;border-radius:12px;overflow:hidden">
<tr><td style="background:#7D2A46;padding:28px 28px 24px;text-align:center">
<p style="margin:0;font-family:Georgia,serif;font-size:26px;letter-spacing:4px;color:#F6F0E7;font-weight:bold">EL ORIGEN</p>
<p style="margin:6px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#D9A35A">Cuenta Origen</p>
</td></tr>
<tr><td style="padding:28px">
${p(esc(t.greeting(firstName)))}
${p(esc(t.intro))}
<div style="text-align:center;margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#7D2A46;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:6px">${esc(t.button)}</a></div>
${p(esc(t.expiry), "color:#6A5650;font-size:14px")}
${p(esc(t.ignore), "color:#6A5650;font-size:14px")}
${p(`${esc(t.fallback)}<br><a href="${esc(link)}" style="color:#7D2A46;word-break:break-all">${esc(link)}</a>`, "color:#6A5650;font-size:13px;margin:0")}
</td></tr>
<tr><td style="border-top:1px solid #DACDBC;padding:18px 28px;text-align:center;font-size:12px;color:#6A5650">
${esc(t.support)}: ${esc(CONTACT.ownerName)} · <a href="https://wa.me/${CONTACT.whatsappNumber}" style="color:#7D2A46">${esc(CONTACT.phoneDisplay)}</a> · ${esc(CONTACT.instagramHandle)}
</td></tr></table></td></tr></table></body></html>`;
}
