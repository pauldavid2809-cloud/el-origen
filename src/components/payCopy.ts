import { RATE_NAME, type Language } from "@/lib/i18n";
import type { PaymentMethodId, RateCurrency } from "@/types";

/* Textos de PayAndReport (elegir cómo pagar y reportar el pago con comprobante), ES/EN.
   Aquí están los textos que valen igual para cualquier pedido (reservas de cata y pedidos de vino).
   Los que cambian según el tipo de pedido (`PayContextCopy`) los pone cada página en su propio copy.ts. */

const es = {
  support: "Atención al cliente",

  // Pago
  rejectedTitle: "No pudimos verificar tu pago",
  rejectedReason: "Motivo:",
  rejectedText: "Revisa los datos y vuelve a reportarlo abajo, o escríbenos a atención al cliente.",
  step1: "Paso 1 · Elige cómo pagar",
  step2: "Paso 2 · Reporta tu pago",
  methodsLegend: "Método de pago",
  methods: {
    pago_movil: { title: "Pago Móvil", hint: "En bolívares, a la tasa del día" },
    transferencia: { title: "Transferencia bancaria", hint: "En bolívares, a la tasa del día" },
    binance_usdt: { title: "Binance USDT", hint: "Monto en USDT = total en USD" },
    zelle: { title: "Zelle", hint: "Monto en USD = total" },
    efectivo: { title: "Efectivo", hint: "Entrega previa acordada" },
  } satisfies Record<PaymentMethodId, { title: string; hint: string }>,
  amountToPay: "Monto a pagar",
  rateLine: (usd: string, currency: RateCurrency, rate: string) => `${usd} × ${RATE_NAME.es[currency]} ${rate}`,
  eurNote: "Precio en divisa convertido con la tasa oficial del euro (BCV).",
  binanceNote: "Precio en divisa convertido con la tasa del dólar paralelo (referencia Binance), que se actualiza cada 10 minutos.",
  noRate: "En bolívares a la tasa del día.",
  zelleLine: "Envía exactamente este monto por Zelle a la cuenta indicada abajo.",
  usdtLine: "Paga exactamente este monto en USDT a la cuenta de Binance indicada abajo.",
  usdtLineNoDetails: "Paga exactamente este monto en USDT. Pídenos los datos de Binance por WhatsApp antes de pagar.",
  cashLine: "Coordina con nosotros por WhatsApp el lugar y la hora de entrega.",
  /** Igual a `DEFAULT_PAYMENT_CONFIG.efectivo.instructions` (settings.ts): permite mostrar su traducción en EN. */
  cashInstructionsDefault: "Entrega previa acordada por WhatsApp",

  // Formulario de comprobante
  reference: "Número de referencia *",
  referencePlaceholder: "Últimos dígitos o completo",
  binanceReference: "ID de la orden o transacción de Binance *",
  zelleReference: "Número de confirmación de Zelle *",
  amountBs: "Monto pagado (Bs) *",
  amountUsdt: "Monto pagado (USDT) *",
  amountUsd: "Monto pagado (USD) *",
  payerBank: "Banco desde el que pagaste *",
  select: "Selecciona…",
  payerDocId: "Cédula del titular *",
  payerPhone: "Teléfono desde el que pagaste",
  note: "Nota (opcional)",
  notePlaceholder: "Algo que debamos saber sobre tu pago",
  proof: "Comprobante *",
  proofCta: "Toca para subir la captura o PDF",
  proofHint: "JPG, PNG, WEBP, HEIC o PDF · máximo 8 MB",
  proofMissing: "Adjunta la captura o PDF del comprobante.",
  send: "Enviar comprobante",
  sending: "Enviando…",
  sendError: "No se pudo enviar el comprobante.",

  // Efectivo
  cashTitle: "Pago en efectivo",
  cashStep1: "1. Escríbenos por WhatsApp para acordar la entrega.",
  cashWhatsapp: "Coordinar entrega por WhatsApp",
  cashNote: "Detalles acordados (opcional)",
  cashNotePlaceholder: "Ej: entrega el jueves en la tarde",
  cashDone: "Ya coordiné la entrega",
};

type PaySharedCopy = typeof es;

const en: PaySharedCopy = {
  support: "Customer service",

  rejectedTitle: "We couldn't verify your payment",
  rejectedReason: "Reason:",
  rejectedText: "Check the details and report it again below, or contact customer service.",
  step1: "Step 1 · Choose how to pay",
  step2: "Step 2 · Report your payment",
  methodsLegend: "Payment method",
  methods: {
    pago_movil: { title: "Pago Móvil", hint: "In bolívares, at the rate of the day" },
    transferencia: { title: "Bank transfer", hint: "In bolívares, at the rate of the day" },
    binance_usdt: { title: "Binance USDT", hint: "USDT amount = total in USD" },
    zelle: { title: "Zelle", hint: "USD amount = total" },
    efectivo: { title: "Cash", hint: "Delivery arranged in advance" },
  },
  amountToPay: "Amount to pay",
  rateLine: (usd, currency, rate) => `${usd} × ${RATE_NAME.en[currency]} ${rate}`,
  eurNote: "Price converted with the official euro rate (BCV).",
  binanceNote: "Price converted with the parallel dollar rate (Binance reference), updated every 10 minutes.",
  noRate: "In bolívares at the rate of the day.",
  zelleLine: "Send exactly this amount via Zelle to the account shown below.",
  usdtLine: "Pay exactly this amount in USDT to the Binance account shown below.",
  usdtLineNoDetails: "Pay exactly this amount in USDT. Ask us for the Binance details on WhatsApp before paying.",
  cashInstructionsDefault: "Delivery arranged in advance on WhatsApp",
  cashLine: "Arrange the delivery place and time with us on WhatsApp.",

  reference: "Reference number *",
  referencePlaceholder: "Last digits or full number",
  binanceReference: "Binance order or transaction ID *",
  zelleReference: "Zelle confirmation number *",
  amountBs: "Amount paid (Bs) *",
  amountUsdt: "Amount paid (USDT) *",
  amountUsd: "Amount paid (USD) *",
  payerBank: "Bank you paid from *",
  select: "Select…",
  payerDocId: "Account holder ID *",
  payerPhone: "Phone you paid from",
  note: "Note (optional)",
  notePlaceholder: "Anything we should know about your payment",
  proof: "Proof of payment *",
  proofCta: "Tap to upload the screenshot or PDF",
  proofHint: "JPG, PNG, WEBP, HEIC or PDF · up to 8 MB",
  proofMissing: "Attach the screenshot or PDF of your payment.",
  send: "Send proof of payment",
  sending: "Sending…",
  sendError: "The proof of payment could not be sent.",

  cashTitle: "Cash payment",
  cashStep1: "1. Message us on WhatsApp to arrange the delivery.",
  cashWhatsapp: "Arrange delivery on WhatsApp",
  cashNote: "Agreed details (optional)",
  cashNotePlaceholder: "E.g. delivery Thursday afternoon",
  cashDone: "I've arranged the delivery",
};

/** Textos neutrales de PayAndReport (iguales para reservas y pedidos de vino). */
export const PAY_COPY: Record<Language, PaySharedCopy> = { es, en };

/** Textos que cambian según el tipo de pedido: cada página los define en su copy.ts. */
export interface PayContextCopy {
  /** Aviso cuando el pedido ya venció (apartado de cupos o plazo del pedido). */
  holdExpired: string;
  /** "Cupos apartados hasta las" (solo se muestra si el servidor envía `holdExpiresAt`). */
  heldUntil: string;
  /** Qué recibirá el cliente al verificar el pago (paso 2 con comprobante). */
  step2Text: string;
  /** Sin métodos de pago disponibles. */
  noMethods: string;
  /** Segundo paso del pago en efectivo. */
  cashStep2: string;
  /** Mensaje de WhatsApp para coordinar el efectivo. */
  cashMessage: (code: string, name: string, total: string) => string;
  /** Mensaje de WhatsApp para consultar un pago ya reportado. */
  reportedMessage: (code: string) => string;
  /** Pedido sin costo (cupón del 100 %): título, texto y botón. */
  freeTitle: string;
  freeText: string;
  freeSubmit: string;
}

/** Todos los textos que usa PayAndReport. */
export type PayCopy = PaySharedCopy & PayContextCopy;

/** Bancos venezolanos para "¿desde qué banco pagaste?" (nombres propios: iguales en ambos idiomas, salvo "Otro"). */
export const VE_BANKS = [
  "Banco de Venezuela", "Banesco", "Mercantil", "BBVA Provincial", "BNC", "Bancamiga", "Banco del Tesoro",
  "Bicentenario", "Bancaribe", "Banco Exterior", "Banco Plaza", "Banplus", "BFC Fondo Común", "Banco Activo",
  "Venezolano de Crédito", "Sofitasa", "100% Banco", "Banco Caroní", "Bancrecer", "Mi Banco", "R4", "Del Sur",
];
export const OTHER_BANK: Record<Language, string> = { es: "Otro", en: "Other" };
