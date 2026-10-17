import type { Language } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders";
import { PAY_COPY } from "@/components/payCopy";

/* Textos de la página de la orden (ES/EN). Los del pago y el reporte de comprobante, iguales para reservas y pedidos
   de vino, viven en `@/components/payCopy` (PAY_COPY) y se incluyen aquí; abajo van los propios de las catas. */

const es = {
  ...PAY_COPY.es,

  loading: "Cargando tu orden…",
  notFoundTitle: "No encontramos esta orden",
  notFoundText: "Revisa el enlace que recibiste o escríbenos por WhatsApp.",
  orderLabel: (code: string) => `Orden ${code}`,
  titleApproved: (n: number): string => (n === 1 ? "Tu entrada" : "Tus entradas"),
  titlePending: "Tu reserva",
  /** Título de la pestaña del navegador (el layout trae el de ES para buscadores). */
  docTitle: "Tu reserva",
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
  cancelledText: (code: string) => `Si crees que es un error, escríbenos a atención al cliente indicando el código ${code}.`,
  holdExpired: "El tiempo de apartado de tus cupos terminó. Aún puedes pagar y reportar: confirmaremos según disponibilidad.",
  heldUntil: "Cupos apartados hasta las",
  step2Text: "Te enviaremos una entrada con código QR por persona, por correo y WhatsApp, apenas verifiquemos el pago.",
  noMethods: "Los métodos de pago no están disponibles en este momento. Escríbenos por WhatsApp para completar tu reserva.",

  // Efectivo
  cashStep2: "2. Cuando la hayamos coordinado, avísanos aquí. Confirmaremos tu reserva al recibir el pago.",
  cashMessage: (code: string, name: string, total: string) =>
    `Hola, soy ${name}. Quiero pagar en efectivo mi reserva ${code} de El Origen (${total}). ¿Cómo coordinamos la entrega?`,

  // En revisión
  reviewTitle: "Recibimos tu reporte de pago",
  reviewText: (email: string) =>
    `Estamos verificando el pago. Cuando lo confirmemos te enviaremos tus entradas con código QR a ${email} y por WhatsApp. Esta página se actualiza sola.`,
  reviewCashText: (email: string) =>
    `Confirmaremos tu reserva al recibir el efectivo. Luego te enviaremos tus entradas con código QR a ${email} y por WhatsApp. Esta página se actualiza sola.`,
  method: "Método",
  reportedReference: "Referencia",
  reportedAmount: "Monto reportado",
  questions: "¿Dudas? Atención al cliente",
  reportedMessage: (code: string) => `Hola, reporté el pago de mi reserva ${code} en El Origen.`,

  // Sin costo (cupón del 100 %)
  freeTitle: "Tu reserva no tiene costo",
  freeText: "Tu cupón cubre el total: no hay nada que pagar ni comprobante que enviar. Envía la reserva a confirmación y te mandaremos tus entradas con código QR.",
  freeSubmit: "Enviar a confirmación",
  freeReviewTitle: "Estamos confirmando tu reserva",
  freeReviewText: (email: string) =>
    `Tu cupón cubre el total de la reserva. Cuando la confirmemos te enviaremos tus entradas con código QR a ${email} y por WhatsApp. Esta página se actualiza sola.`,

  // Aprobada
  approvedTitle: "Pago verificado",
  approvedText: (n: number) =>
    n === 1
      ? "Esta es tu entrada. Preséntala en la puerta al llegar."
      : `Estas son tus ${n} entradas: una por persona. Puedes descargarlas o compartirlas con cada invitado y, si lo deseas, poner el nombre de quien usará cada una.`,
  ticketsPending: "Estamos generando tus entradas. Actualiza la página en unos segundos.",
  reload: "Actualizar",
  otherTastings: "Ver otras catas",
  keepLink: (email: string) => `Guarda este enlace: aquí están tus entradas. También te las enviamos a ${email}.`,
};

type OrderCopy = typeof es;

const en: OrderCopy = {
  ...PAY_COPY.en,

  loading: "Loading your order…",
  notFoundTitle: "We couldn't find this order",
  notFoundText: "Check the link you received or message us on WhatsApp.",
  orderLabel: (code) => `Order ${code}`,
  titleApproved: (n) => (n === 1 ? "Your ticket" : "Your tickets"),
  titlePending: "Your reservation",
  docTitle: "Your reservation",
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
  holdExpired: "The hold on your spots has expired. You can still pay and report it: we'll confirm subject to availability.",
  heldUntil: "Spots held until",
  step2Text: "As soon as we verify the payment we'll send one QR ticket per person by email and WhatsApp.",
  noMethods: "Payment methods are not available right now. Message us on WhatsApp to complete your reservation.",

  cashStep2: "2. Once arranged, let us know here. We'll confirm your reservation when we receive the payment.",
  cashMessage: (code, name, total) =>
    `Hi, I'm ${name}. I'd like to pay my El Origen reservation ${code} (${total}) in cash. How can we arrange the delivery?`,

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

  freeTitle: "Your reservation is free of charge",
  freeText: "Your coupon covers the full amount: there's nothing to pay and no receipt to send. Submit the reservation for confirmation and we'll send your QR tickets.",
  freeSubmit: "Submit for confirmation",
  freeReviewTitle: "We're confirming your reservation",
  freeReviewText: (email) =>
    `Your coupon covers the full reservation. Once we confirm it, we'll send your QR tickets to ${email} and by WhatsApp. This page updates automatically.`,

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
