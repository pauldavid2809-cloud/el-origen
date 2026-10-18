import type { Language } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders";
import { PAY_COPY } from "@/components/payCopy";
import { WINE_PENDING_TTL_HOURS } from "@/lib/wineSale";

/* Textos de la página del pedido de vinos (ES/EN). Los del pago y el reporte de comprobante vienen de
   `@/components/payCopy` (los mismos de la orden de catas); aquí van los propios de los vinos.
   PENDIENTE CLIENTE: costo y zonas de envío, punto de retiro y devoluciones (ver WINE_POLICIES en @/lib/wineSale). */

const es = {
  ...PAY_COPY.es,

  loading: "Cargando tu pedido…",
  notFoundTitle: "No encontramos este pedido",
  notFoundText: "Revisa el enlace que recibiste o escríbenos por WhatsApp.",
  orderLabel: (code: string) => `Pedido ${code}`,
  titlePending: "Tu pedido de vinos",
  titleApproved: "Tu pedido está confirmado",
  /** Título de la pestaña del navegador (el layout trae el de ES para buscadores). */
  docTitle: "Tu pedido de vinos",
  status: {
    pending_payment: "Pendiente de pago",
    in_review: "Pago en revisión",
    approved: "Confirmado",
    rejected: "Pago no verificado",
    cancelled: "Anulado",
  } satisfies Record<OrderStatus, string>,

  // Resumen
  summaryEyebrow: "Tu pedido",
  bottles: (n: number) => `${n} ${n === 1 ? "botella" : "botellas"}`,
  holder: "A nombre de",
  fulfillment: "Recepción",
  pickup: "Retiro",
  delivery: "Entrega a domicilio",
  address: "Dirección",
  deliveryNote: "Nota",
  subtotal: "Subtotal",
  total: "Total",
  // PENDIENTE CLIENTE: costo y zonas de envío.
  shippingNote: "El costo de envío, si aplica, no está incluido en el total: lo coordinamos contigo por WhatsApp.",

  // Pago (textos propios de los vinos para PayAndReport)
  holdExpired: `Este pedido venció: pasaron más de ${WINE_PENDING_TTL_HOURS} horas sin reportar el pago. Aún puedes reportar tu pago y lo confirmaremos si el pedido sigue disponible, o hacer un pedido nuevo.`,
  heldUntil: "Pedido reservado hasta las",
  step2Text: "Cuando verifiquemos el pago confirmaremos tu pedido y te escribiremos por correo y WhatsApp para coordinar el retiro o la entrega.",
  noMethods: "Los métodos de pago no están disponibles en este momento. Escríbenos por WhatsApp para completar tu pedido.",
  cashStep2: "2. Cuando la hayamos coordinado, avísanos aquí. Confirmaremos tu pedido al recibir el pago.",
  cashMessage: (code: string, name: string, total: string) =>
    `Hola, soy ${name}. Quiero pagar en efectivo mi pedido de vinos ${code} de El Origen (${total}). ¿Cómo coordinamos la entrega?`,
  reportedMessage: (code: string) => `Hola, reporté el pago de mi pedido de vinos ${code} en El Origen.`,
  freeTitle: "Tu pedido no tiene costo",
  freeText: "No hay nada que pagar ni comprobante que enviar. Envía el pedido a confirmación.",
  freeSubmit: "Enviar a confirmación",

  // En revisión
  reviewTitle: "Recibimos tu reporte de pago",
  reviewText: "Estamos verificando el pago. Cuando lo confirmemos te escribiremos por correo y WhatsApp para coordinar el retiro o la entrega. Esta página se actualiza sola.",
  reviewCashText: "Confirmaremos tu pedido al recibir el efectivo. Luego te escribiremos por correo y WhatsApp para coordinar el retiro o la entrega. Esta página se actualiza sola.",
  method: "Método",
  reportedReference: "Referencia",
  reportedAmount: "Monto reportado",
  questions: "¿Dudas? Atención al cliente",
  questionMessage: (code: string) => `Hola, tengo una consulta sobre mi pedido de vinos ${code} en El Origen.`,

  // Confirmado
  approvedBadge: "Pago verificado",
  approvedText: "Recibimos tu pago y tu pedido está confirmado. Te escribiremos por WhatsApp para coordinar la recepción de tus vinos.",
  deliveryStatus: "Estado del pedido",
  toDeliver: "Por entregar",
  delivered: "Entregado",
  deliveredOn: (date: string) => `Entregado el ${date}`,
  toDeliverPickup: "Coordinaremos contigo el punto y la hora de retiro por WhatsApp.",
  toDeliverDelivery: "Coordinaremos contigo la hora de entrega por WhatsApp.",
  moreWines: "Ver más vinos",
  keepLink: "Guarda este enlace: aquí puedes consultar el estado de tu pedido.",

  // Anulado
  cancelledTitle: "Este pedido fue anulado",
  cancelledText: (code: string) => `Si crees que es un error, escríbenos a atención al cliente indicando el código ${code}.`,
};

type OrderCopy = typeof es;

const en: OrderCopy = {
  ...PAY_COPY.en,

  loading: "Loading your order…",
  notFoundTitle: "We couldn't find this order",
  notFoundText: "Check the link you received or message us on WhatsApp.",
  orderLabel: (code) => `Order ${code}`,
  titlePending: "Your wine order",
  titleApproved: "Your order is confirmed",
  docTitle: "Your wine order",
  status: {
    pending_payment: "Awaiting payment",
    in_review: "Payment under review",
    approved: "Confirmed",
    rejected: "Payment not verified",
    cancelled: "Cancelled",
  },

  summaryEyebrow: "Your order",
  bottles: (n) => `${n} ${n === 1 ? "bottle" : "bottles"}`,
  holder: "Ordered by",
  fulfillment: "Receiving",
  pickup: "Pickup",
  delivery: "Home delivery",
  address: "Address",
  deliveryNote: "Note",
  subtotal: "Subtotal",
  total: "Total",
  shippingNote: "Delivery cost, if any, is not included in the total: we'll arrange it with you on WhatsApp.",

  holdExpired: `This order has expired: more than ${WINE_PENDING_TTL_HOURS} hours passed without a payment report. You can still report your payment and we'll confirm it if the order is still available, or place a new order.`,
  heldUntil: "Order held until",
  step2Text: "Once we verify the payment we'll confirm your order and write to you by email and WhatsApp to arrange pickup or delivery.",
  noMethods: "Payment methods are not available right now. Message us on WhatsApp to complete your order.",
  cashStep2: "2. Once arranged, let us know here. We'll confirm your order when we receive the payment.",
  cashMessage: (code, name, total) =>
    `Hi, I'm ${name}. I'd like to pay my El Origen wine order ${code} (${total}) in cash. How can we arrange the delivery?`,
  reportedMessage: (code) => `Hi, I reported the payment for my El Origen wine order ${code}.`,
  freeTitle: "Your order is free of charge",
  freeText: "There's nothing to pay and no receipt to send. Submit the order for confirmation.",
  freeSubmit: "Submit for confirmation",

  reviewTitle: "We received your payment report",
  reviewText: "We're verifying the payment. Once confirmed we'll write to you by email and WhatsApp to arrange pickup or delivery. This page updates automatically.",
  reviewCashText: "We'll confirm your order once we receive the cash. Then we'll write to you by email and WhatsApp to arrange pickup or delivery. This page updates automatically.",
  method: "Method",
  reportedReference: "Reference",
  reportedAmount: "Amount reported",
  questions: "Questions? Customer service",
  questionMessage: (code) => `Hi, I have a question about my El Origen wine order ${code}.`,

  approvedBadge: "Payment verified",
  approvedText: "We received your payment and your order is confirmed. We'll message you on WhatsApp to arrange how you receive your wines.",
  deliveryStatus: "Order status",
  toDeliver: "To be delivered",
  delivered: "Delivered",
  deliveredOn: (date) => `Delivered on ${date}`,
  toDeliverPickup: "We'll arrange the pickup place and time with you on WhatsApp.",
  toDeliverDelivery: "We'll arrange the delivery time with you on WhatsApp.",
  moreWines: "See more wines",
  keepLink: "Keep this link: you can check the status of your order here.",

  cancelledTitle: "This order was cancelled",
  cancelledText: (code) => `If you think this is a mistake, contact customer service and mention code ${code}.`,
};

export const PEDIDO_COPY: Record<Language, OrderCopy> = { es, en };
