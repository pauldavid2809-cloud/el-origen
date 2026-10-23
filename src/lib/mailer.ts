import "server-only";
import { Resend } from "resend";

/* Envío de correo con Resend. */

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

function resendClient(): Resend | null {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

/** Qué canal de correo está activo (para mostrar en el panel). */
export function mailProvider(): "resend" | null {
  return process.env.RESEND_API_KEY ? "resend" : null;
}

export function isMailEnabled(): boolean {
  return mailProvider() !== null;
}

/**
 * Envía un correo con Resend (RESEND_API_KEY); sin la clave devuelve "disabled". Nunca lanza.
 */
export async function sendMail(msg: MailMessage): Promise<MailResult> {
  const to = (Array.isArray(msg.to) ? msg.to : [msg.to]).map((v) => v.trim()).filter(Boolean);
  if (!to.length) return "failed";

  const resend = resendClient();
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "El Origen <entradas@elorigenvzla.com>",
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
