import type { Language } from "./i18n";

/* Políticas de compra (texto literal del cliente). Se muestran SIEMPRE en el proceso de compra
   y al entregar la entrada: página de la orden, correo y WhatsApp. */

export interface PolicyItem {
  title: string;
  body: string;
}

export const PURCHASE_POLICIES: Record<Language, PolicyItem[]> = {
  es: [
    {
      title: "Garantía de Cupo",
      body: "La reserva solo se considera confirmada una vez recibido el comprobante de pago. Los cupos son limitados y se asignarán en estricto orden de confirmación.",
    },
    {
      title: "Métodos de Pago",
      body: "Según la cata, aceptamos Pago Móvil (a la tasa indicada en cada cata), Binance USDT, Zelle y Efectivo (entrega previa acordada).",
    },
    {
      title: "Política de Cancelación",
      body: "Debido a que el menú y las etiquetas se preparan con antelación, no se realizan reembolsos por inasistencia ni reasignación de fechas. Si no puedes asistir, puedes ceder tu cupo a otra persona, notificándonos con al menos 24 horas de anticipación para ajustar los detalles.",
    },
    {
      title: "Puntualidad",
      body: "La experiencia inicia puntualmente. Recomendamos llegar 15 a 20 minutos antes.",
    },
  ],
  en: [
    {
      title: "Spot Guarantee",
      body: "A reservation is only considered confirmed once the proof of payment has been received. Spots are limited and will be assigned strictly in order of confirmation.",
    },
    {
      title: "Payment Methods",
      body: "Depending on the tasting, we accept Pago Móvil (at the rate shown for each tasting), Binance USDT, Zelle and Cash (delivery arranged in advance).",
    },
    {
      title: "Cancellation Policy",
      body: "Because the menu and labels are prepared in advance, there are no refunds for no-shows and dates cannot be rescheduled. If you cannot attend, you may transfer your spot to someone else by letting us know at least 24 hours in advance so we can adjust the details.",
    },
    {
      title: "Punctuality",
      body: "The experience starts on time. We recommend arriving 15 to 20 minutes early.",
    },
  ],
};

const POLICIES_HEADING: Record<Language, string> = {
  es: "Políticas de la experiencia",
  en: "Experience policies",
};

/**
 * Políticas en texto plano, numeradas.
 * Con `whatsapp: true` los títulos van en *negrita* (formato de WhatsApp).
 */
export function policiesPlainText(lang: Language = "es", options: { whatsapp?: boolean } = {}): string {
  const bold = (s: string) => (options.whatsapp ? `*${s}*` : s);
  const items = PURCHASE_POLICIES[lang].map((p, i) => `${i + 1}. ${bold(`${p.title}:`)} ${p.body}`);
  return [bold(POLICIES_HEADING[lang]), ...items].join("\n");
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Bloque HTML (estilos en línea) con las políticas, para el pie de los correos. */
export function policiesEmailHtml(lang: Language = "es"): string {
  const items = PURCHASE_POLICIES[lang]
    .map(
      (p, i) =>
        `<li style="margin:0 0 8px;font-size:12px;line-height:1.55;color:#4A3A36"><strong style="color:#2A1519">${i + 1}. ${escapeHtml(p.title)}:</strong> ${escapeHtml(p.body)}</li>`
    )
    .join("");
  return `<div style="margin:22px 0 0;padding:14px 16px;border:1px solid #DACDBC;border-radius:8px;background:#FFFCF7">
<p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7D2A46;font-weight:bold">${escapeHtml(POLICIES_HEADING[lang])}</p>
<ul style="margin:0;padding:0;list-style:none">${items}</ul></div>`;
}

/** Copia de la oferta de adicionales de cada cata (texto literal del cliente). */
export const ADDON_OFFER_COPY: Record<Language, { title: string; text: string; note: string }> = {
  es: {
    title: "Oferta Exclusiva de Reserva",
    text: "Añade tu botella o producto a precio preferencial. Completa tu experiencia El Origen llevando a casa una selección exclusiva a precio especial.",
    note: "Nota: Esta tarifa y disponibilidad son válidas únicamente al momento de completar la reserva de tu ticket. No estará disponible para compra posterior ni el día del evento.",
  },
  en: {
    title: "Exclusive Reservation Offer",
    text: "Add your bottle or product at a preferential price. Complete your El Origen experience by taking home an exclusive selection at a special price.",
    note: "Note: This rate and availability are valid only when completing your ticket reservation. It will not be available for later purchase or on the day of the event.",
  },
};

/** Casilla obligatoria del checkout (también se valida en el servidor). */
export const TERMS_CHECKBOX: Record<Language, string> = {
  es: "He leído y acepto los Términos y Condiciones y la Política de Privacidad de El Origen.",
  en: "I have read and accept El Origen's Terms and Conditions and Privacy Policy.",
};

/** Casilla obligatoria del registro de miembros. */
export const REGISTER_TERMS_CHECKBOX: Record<Language, string> = {
  es: "Soy mayor de 18 años y acepto los Términos y Condiciones.",
  en: "I am over 18 years old and accept the Terms and Conditions.",
};
