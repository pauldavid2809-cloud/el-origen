import type { Language } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders";
import type { PaymentMethodId } from "@/components/PaymentDetails";

/* Textos de la página de la orden (ES/EN). */

const es = {
  loading: "Cargando su orden…",
  notFoundTitle: "No encontramos esta orden",
  notFoundText: "Revise el enlace que recibió o escríbanos por WhatsApp.",
  support: "Atención al cliente",
  orderLabel: (code: string) => `Orden ${code}`,
  titleApproved: (n: number): string => (n === 1 ? "Su entrada" : "Sus entradas"),
  titlePending: "Su reserva",
  status: {
    pending_payment: "Pendiente de pago",
    in_review: "Pago en revisión",
    approved: "Confirmada",
    rejected: "Pago no verificado",
    cancelled: "Anulada",
  } satisfies Record<OrderStatus, string>,

  // Resumen
  summaryEyebrow: "Cata",
  date: "Fecha",
  time: "Hora",
  place: "Lugar",
  spots: "Cupos",
  persons: (n: number) => `${n} persona${n === 1 ? "" : "s"}`,
  holder: "A nombre de",
  addOns: "Adicionales",
  discount: (code: string) => `Descuento ${code}`,
  total: "Total",

  // Pago
  cancelledTitle: "Esta reserva fue anulada",
  cancelledText: (code: string) => `Si cree que es un error, escríbanos a atención al cliente indicando el código ${code}.`,
  rejectedTitle: "No pudimos verificar su pago",
  rejectedReason: "Motivo:",
  rejectedText: "Revise los datos y vuelva a reportarlo abajo, o escríbanos a atención al cliente.",
  holdExpired: "El tiempo de apartado de sus cupos terminó. Aún puede pagar y reportar: confirmaremos según disponibilidad.",
  heldUntil: "Cupos apartados hasta las",
  step1: "Paso 1 · Elija cómo pagar",
  step2: "Paso 2 · Reporte su pago",
  step2Text: "Le enviaremos una entrada con código QR por persona, por correo y WhatsApp, apenas verifiquemos el pago.",
  methodsLegend: "Método de pago",
  methods: {
    pago_movil: { title: "Pago Móvil", hint: "En bolívares, tasa BCV del día" },
    transferencia: { title: "Transferencia bancaria", hint: "En bolívares, tasa BCV del día" },
    binance_usdt: { title: "Binance USDT", hint: "Monto en USDT = total en USD" },
    efectivo: { title: "Efectivo", hint: "Entrega previa acordada" },
  } satisfies Record<PaymentMethodId, { title: string; hint: string }>,
  amountToPay: "Monto a pagar",
  rateLine: (usd: string, currency: string, rate: string) => `${usd} × tasa BCV ${currency} ${rate}`,
  eurNote: "Precio en divisa convertido con la tasa oficial del euro (BCV).",
  noRate: "En bolívares a la tasa BCV del día.",
  usdtLine: "Pague exactamente este monto en USDT (red y datos de Binance arriba).",
  cashLine: "Coordine con nosotros por WhatsApp el lugar y la hora de entrega.",

  // Formulario de comprobante
  reference: "Número de referencia *",
  referencePlaceholder: "Últimos dígitos o completo",
  binanceReference: "ID de la orden o transacción de Binance *",
  amountBs: "Monto pagado (Bs) *",
  amountUsdt: "Monto pagado (USDT) *",
  payerBank: "Banco desde el que pagó *",
  select: "Seleccione…",
  payerDocId: "Cédula del titular *",
  payerPhone: "Teléfono desde el que pagó",
  note: "Nota (opcional)",
  notePlaceholder: "Algo que debamos saber sobre su pago",
  proof: "Comprobante *",
  proofCta: "Toque para subir la captura o PDF",
  proofHint: "JPG, PNG, WEBP, HEIC o PDF · máximo 8 MB",
  proofMissing: "Adjunte la captura o PDF del comprobante.",
  send: "Enviar comprobante",
  sending: "Enviando…",
  sendError: "No se pudo enviar el comprobante.",
  noMethods: "Los métodos de pago no están disponibles en este momento. Escríbanos por WhatsApp para completar su reserva.",

  // Efectivo
  cashTitle: "Pago en efectivo",
  cashStep1: "1. Escríbanos por WhatsApp para acordar la entrega.",
  cashStep2: "2. Cuando la hayamos coordinado, avísenos aquí. Confirmaremos su reserva al recibir el pago.",
  cashWhatsapp: "Coordinar entrega por WhatsApp",
  cashMessage: (code: string, name: string, total: string) =>
    `Hola, soy ${name}. Quiero pagar en efectivo mi reserva ${code} de El Origen (${total}). ¿Cómo coordinamos la entrega?`,
  cashNote: "Detalles acordados (opcional)",
  cashNotePlaceholder: "Ej: entrega el jueves en la tarde",
  cashDone: "Ya coordiné la entrega",

  // En revisión
  reviewTitle: "Recibimos su reporte de pago",
  reviewText: (email: string) =>
    `Estamos verificando el pago. Cuando lo confirmemos le enviaremos sus entradas con código QR a ${email} y por WhatsApp. Esta página se actualiza sola.`,
  reviewCashText: (email: string) =>
    `Confirmaremos su reserva al recibir el efectivo. Luego le enviaremos sus entradas con código QR a ${email} y por WhatsApp. Esta página se actualiza sola.`,
  method: "Método",
  reportedReference: "Referencia",
  reportedAmount: "Monto reportado",
  questions: "¿Dudas? Atención al cliente",
  reportedMessage: (code: string) => `Hola, reporté el pago de mi reserva ${code} en El Origen.`,

  // Aprobada
  approvedTitle: "Pago verificado",
  approvedText: (n: number) =>
    n === 1
      ? "Esta es su entrada. Preséntela en la puerta al llegar."
      : `Estas son sus ${n} entradas: una por persona. Puede descargarlas o compartirlas con cada invitado y, si lo desea, poner el nombre de quien usará cada una.`,
  ticketsPending: "Estamos generando sus entradas. Actualice la página en unos segundos.",
  reload: "Actualizar",
  otherTastings: "Ver otras catas",
  keepLink: (email: string) => `Guarde este enlace: aquí están sus entradas. También se las enviamos a ${email}.`,
};

type OrderCopy = typeof es;

const en: OrderCopy = {
  loading: "Loading your order…",
  notFoundTitle: "We couldn't find this order",
  notFoundText: "Check the link you received or message us on WhatsApp.",
  support: "Customer service",
  orderLabel: (code) => `Order ${code}`,
  titleApproved: (n) => (n === 1 ? "Your ticket" : "Your tickets"),
  titlePending: "Your reservation",
  status: {
    pending_payment: "Awaiting payment",
    in_review: "Payment under review",
    approved: "Confirmed",
    rejected: "Payment not verified",
    cancelled: "Cancelled",
  },

  summaryEyebrow: "Tasting",
  date: "Date",
  time: "Time",
  place: "Venue",
  spots: "Spots",
  persons: (n) => `${n} ${n === 1 ? "person" : "people"}`,
  holder: "Booked by",
  addOns: "Add-ons",
  discount: (code) => `Discount ${code}`,
  total: "Total",

  cancelledTitle: "This reservation was cancelled",
  cancelledText: (code) => `If you think this is a mistake, contact customer service and mention code ${code}.`,
  rejectedTitle: "We couldn't verify your payment",
  rejectedReason: "Reason:",
  rejectedText: "Check the details and report it again below, or contact customer service.",
  holdExpired: "The hold on your spots has expired. You can still pay and report it: we'll confirm subject to availability.",
  heldUntil: "Spots held until",
  step1: "Step 1 · Choose how to pay",
  step2: "Step 2 · Report your payment",
  step2Text: "As soon as we verify the payment we'll send one QR ticket per person by email and WhatsApp.",
  methodsLegend: "Payment method",
  methods: {
    pago_movil: { title: "Pago Móvil", hint: "In bolívares, BCV rate of the day" },
    transferencia: { title: "Bank transfer", hint: "In bolívares, BCV rate of the day" },
    binance_usdt: { title: "Binance USDT", hint: "USDT amount = total in USD" },
    efectivo: { title: "Cash", hint: "Delivery arranged in advance" },
  },
  amountToPay: "Amount to pay",
  rateLine: (usd, currency, rate) => `${usd} × BCV ${currency} rate ${rate}`,
  eurNote: "Price converted with the official euro rate (BCV).",
  noRate: "In bolívares at the BCV rate of the day.",
  usdtLine: "Pay exactly this amount in USDT (Binance details above).",
  cashLine: "Arrange the delivery place and time with us on WhatsApp.",

  reference: "Reference number *",
  referencePlaceholder: "Last digits or full number",
  binanceReference: "Binance order or transaction ID *",
  amountBs: "Amount paid (Bs) *",
  amountUsdt: "Amount paid (USDT) *",
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
  noMethods: "Payment methods are not available right now. Message us on WhatsApp to complete your reservation.",

  cashTitle: "Cash payment",
  cashStep1: "1. Message us on WhatsApp to arrange the delivery.",
  cashStep2: "2. Once arranged, let us know here. We'll confirm your reservation when we receive the payment.",
  cashWhatsapp: "Arrange delivery on WhatsApp",
  cashMessage: (code, name, total) =>
    `Hi, I'm ${name}. I'd like to pay my El Origen reservation ${code} (${total}) in cash. How can we arrange the delivery?`,
  cashNote: "Agreed details (optional)",
  cashNotePlaceholder: "E.g. delivery Thursday afternoon",
  cashDone: "I've arranged the delivery",

  reviewTitle: "We received your payment report",
  reviewText: (email) =>
    `We're verifying the payment. Once confirmed we'll send your QR tickets to ${email} and by WhatsApp. This page updates automatically.`,
  reviewCashText: (email) =>
    `We'll confirm your reservation once we receive the cash. Then we'll send your QR tickets to ${email} and by WhatsApp. This page updates automatically.`,
  method: "Method",
  reportedReference: "Reference",
  reportedAmount: "Amount reported",
  questions: "Questions? Customer service",
  reportedMessage: (code) => `Hi, I reported the payment for my El Origen reservation ${code}.`,

  approvedTitle: "Payment verified",
  approvedText: (n) =>
    n === 1
      ? "This is your ticket. Show it at the door when you arrive."
      : `Here are your ${n} tickets, one per person. Download or share them with each guest and, if you like, add the name of who will use each one.`,
  ticketsPending: "We're generating your tickets. Refresh the page in a few seconds.",
  reload: "Refresh",
  otherTastings: "See other tastings",
  keepLink: (email) => `Keep this link: your tickets are here. We also sent them to ${email}.`,
};

export const ORDER_COPY: Record<Language, OrderCopy> = { es, en };

/** Bancos venezolanos para "¿desde qué banco pagó?" (nombres propios: iguales en ambos idiomas, salvo "Otro"). */
export const VE_BANKS = [
  "Banco de Venezuela", "Banesco", "Mercantil", "BBVA Provincial", "BNC", "Bancamiga", "Banco del Tesoro",
  "Bicentenario", "Bancaribe", "Banco Exterior", "Banco Plaza", "Banplus", "BFC Fondo Común", "Banco Activo",
  "Venezolano de Crédito", "Sofitasa", "100% Banco", "Banco Caroní", "Bancrecer", "Mi Banco", "R4", "Del Sur",
];
export const OTHER_BANK: Record<Language, string> = { es: "Otro", en: "Other" };
