import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";

/* Envío de correo: Gmail SMTP (cuenta de ventas, con contraseña de aplicación) y Resend como alternativa. */

export interface MailAttachment {
  filename: string;
  content: Buffer;
  /** Para imágenes en línea: en el HTML se referencia como `<img src="cid:ID">`. */
  cid?: string;
  contentType?: string;
}

export interface MailMessage {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}

export type MailResult = "sent" | "failed" | "disabled";

function gmailCredentials(): { user: string; pass: string } | null {
  const user = process.env.GMAIL_USER?.trim();
  // Google muestra la contraseña de aplicación en bloques con espacios: se aceptan tal cual.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  return user && pass ? { user, pass } : null;
}

const store = globalThis as unknown as { __eoGmail?: { key: string; transporter: Transporter } };

function gmailTransport(): { from: string; transporter: Transporter } | null {
  const creds = gmailCredentials();
  if (!creds) return null;
  const key = `${creds.user}:${creds.pass}`;
  if (store.__eoGmail?.key !== key) {
    store.__eoGmail = {
      key,
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: { user: creds.user, pass: creds.pass },
      }),
    };
  }
  return { from: `"El Origen" <${creds.user}>`, transporter: store.__eoGmail.transporter };
}

function resendClient(): Resend | null {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

/** Qué canal de correo está activo (para mostrar en el panel). */
export function mailProvider(): "gmail" | "resend" | null {
  if (gmailCredentials()) return "gmail";
  if (process.env.RESEND_API_KEY) return "resend";
  return null;
}

export function isMailEnabled(): boolean {
  return mailProvider() !== null;
}

/**
 * Envía un correo. Usa Gmail SMTP si GMAIL_USER y GMAIL_APP_PASSWORD están configurados;
 * si no, Resend (RESEND_API_KEY); si no hay ninguno devuelve "disabled". Nunca lanza.
 */
export async function sendMail(msg: MailMessage): Promise<MailResult> {
  const to = (Array.isArray(msg.to) ? msg.to : [msg.to]).map((v) => v.trim()).filter(Boolean);
  if (!to.length) return "failed";

  const gmail = gmailTransport();
  if (gmail) {
    try {
      await gmail.transporter.sendMail({
        from: gmail.from,
        to,
        subject: msg.subject,
        html: msg.html,
        replyTo: msg.replyTo,
        attachments: msg.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          cid: a.cid,
          contentType: a.contentType,
        })),
      });
      return "sent";
    } catch (err) {
      console.error("[mailer] Error enviando con Gmail:", err);
      return "failed";
    }
  }

  const resend = resendClient();
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "El Origen <onboarding@resend.dev>",
        to,
        subject: msg.subject,
        html: msg.html,
        replyTo: msg.replyTo,
        attachments: msg.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentId: a.cid,
          contentType: a.contentType,
        })),
      });
      if (error) throw new Error(error.message);
      return "sent";
    } catch (err) {
      console.error("[mailer] Error enviando con Resend:", err);
      return "failed";
    }
  }

  return "disabled";
}
