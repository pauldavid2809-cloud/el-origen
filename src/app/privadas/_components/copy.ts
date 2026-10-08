import type { Language } from "@/lib/i18n";

/* Textos comunes de los formularios de solicitud (privadas, alianzas y sommeliers). */

const es = {
  optional: "opcional",
  sending: "Enviando…",
  errorSummary: "Revisa los campos marcados.",
  network: "Error de conexión. Inténtalo de nuevo.",
  rateLimited: "Recibimos varias solicitudes desde tu conexión. Espera unos minutos e inténtalo de nuevo.",
  generic: "No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.",
  honeypot: "Deja este campo vacío",
  privacyBefore: "Al enviar este formulario aceptas nuestra ",
  privacyLink: "Política de Privacidad",
  privacyAfter: ".",
  sendAnother: "Enviar otra solicitud",
  whatsapp: "Escribir por WhatsApp",
};

const en: typeof es = {
  optional: "optional",
  sending: "Sending…",
  errorSummary: "Please check the highlighted fields.",
  network: "Connection error. Please try again.",
  rateLimited: "We've received several requests from your connection. Please wait a few minutes and try again.",
  generic: "We couldn't send your request. Please try again or message us on WhatsApp.",
  honeypot: "Leave this field empty",
  privacyBefore: "By sending this form you accept our ",
  privacyLink: "Privacy Policy",
  privacyAfter: ".",
  sendAnother: "Send another request",
  whatsapp: "Message us on WhatsApp",
};

export const FORM_COPY: Record<Language, typeof es> = { es, en };
