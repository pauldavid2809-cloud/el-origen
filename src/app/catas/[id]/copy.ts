import { RATE_NAME, capitalize, type Language } from "@/lib/i18n";
import type { PaymentMethodId, TastingCategory, RateCurrency } from "@/types";

/** "a, b o c" / "a, b or c" */
const joinList = (items: string[], or: string) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${or} ${items[items.length - 1]}`;

/** Métodos de pago de la cata en una frase (los de bolívares, con la tasa de la cata). */
function methodsSentence(lang: Language, methods: PaymentMethodId[], currency: RateCurrency): string {
  const es = lang === "es";
  const bs = methods.filter((m) => m === "pago_movil" || m === "transferencia").map((m) => (m === "pago_movil" ? "Pago Móvil" : es ? "transferencia" : "bank transfer"));
  const parts = [
    bs.length ? `${joinList(bs, es ? "o" : "or")} (${RATE_NAME[lang][currency]}${es ? " del día" : " of the day"})` : "",
    methods.includes("binance_usdt") ? "Binance USDT" : "",
    methods.includes("zelle") ? "Zelle" : "",
    methods.includes("efectivo") ? (es ? "efectivo con entrega previa acordada" : "cash with delivery arranged in advance") : "",
  ].filter(Boolean);
  return capitalize(joinList(parts, es ? "o" : "or"));
}

/* Textos del detalle de cata y su compra (ES/EN). */

const es = {
  loading: "Cargando experiencia…",
  notFoundTitle: "Esta cata no está disponible",
  notFoundText: "Puede que ya haya pasado o que el enlace no sea correcto. Mira nuestras próximas catas.",
  notFoundCta: "Ver próximas catas",
  breadcrumb: { home: "Inicio", tastings: "Catas" },
  category: {
    degustacion: "Degustación guiada",
    reserva: "Reserva de cava",
    atardecer: "Atardecer",
    blancos: "Blancos",
    privada: "Privada",
    icono: "Ícono",
  } satisfies Record<TastingCategory, string>,

  // Datos de la cata
  date: "Fecha",
  time: "Horario",
  place: "Lugar",
  directions: "Cómo llegar",
  products: "Productos a degustar",
  vintage: "Añada",
  pairings: "Armonías y menú",
  sommeliers: (n: number): string => (n === 1 ? "Tu sommelier" : "Tus sommeliers"),
  readMore: "Leer más",
  readLess: "Ver menos",
  instagram: "En Instagram",
  instagramAria: (handle: string) => `Abrir ${handle} en Instagram`,
  venue: "El lugar",

  // Compra
  checkoutEyebrow: "Reserva tu cupo",
  checkoutTitle: "Comprar cupos",
  perPerson: "por persona",
  bsApprox: (bs: string) => `≈ Bs ${bs}`,
  rateNote: (currency: RateCurrency) => `${capitalize(RATE_NAME.es[currency])} del día`,
  noRate: "En bolívares a la tasa del día",
  steps: ["Cupos", "Datos", "Confirmar"],
  stepAria: (n: number, label: string) => `Paso ${n}: ${label}`,
  spotsLabel: "Cantidad de cupos",
  persons: (n: number) => `${n} ${n === 1 ? "persona" : "personas"}`,
  fewer: "Quitar un cupo",
  more: "Agregar un cupo",
  available: (n: number) => `Quedan ${n} ${n === 1 ? "cupo" : "cupos"} para esta fecha.`,
  maxPerOrder: (n: number) => `Máximo ${n} cupos por reserva.`,
  soldOutTitle: "Cupos agotados",
  soldOutText: "Anótate en la lista de espera y te escribimos por WhatsApp apenas se libere un cupo o abramos una nueva fecha.",
  soldOutCta: "Anotarme en la lista de espera",
  soldOutWhatsapp: "Escribir por WhatsApp",
  soldOutMessage: (title: string) => `Hola, quisiera quedar en lista de espera para la cata «${title}» de El Origen.`,
  addOnQty: (title: string) => `Cantidad de ${title}`,
  addOnLess: (title: string) => `Quitar ${title}`,
  addOnMore: (title: string) => `Agregar ${title}`,
  next: "Continuar con tus datos",
  review: "Revisar y confirmar",
  back: "Volver",

  // Datos del comprador
  name: "Nombre completo *",
  namePlaceholder: "Ej: Laura Rossi",
  docId: "Cédula de identidad *",
  docIdPlaceholder: "Ej: V-12345678",
  email: "Correo electrónico *",
  emailHint: "Aquí recibirás tus entradas con código QR.",
  emailAccountHint: "Es el correo de tu Cuenta Origen: ahí recibirás tus entradas con código QR.",
  checkingAccount: "Verificando tu cuenta…",
  loginTitle: "Compra con tu Cuenta Origen",
  loginText:
    "Para reservar cupos necesitas iniciar sesión. Así tus reservas y entradas quedan guardadas en tu cuenta. Crearla es gratis y toma menos de un minuto.",
  loginCta: "Iniciar sesión",
  registerCta: "Crear mi Cuenta Origen",
  phone: "WhatsApp *",
  phoneHint: "También te enviamos las entradas por WhatsApp.",
  phonePlaceholder: "Ej: 0414-123-4567",
  dietary: "Restricciones alimentarias o alergias",
  dietaryPlaceholder: "Ej: vegetariano, sin gluten, alergia a frutos secos…",
  memberPrefilled: "Completamos tus datos con tu Cuenta Origen.",
  errRequired: "Este dato es obligatorio.",
  errEmail: "Escribe un correo válido.",
  errPhone: "Escribe un número de WhatsApp válido.",
  errDocId: "Escribe una cédula válida.",
  errFix: "Revisa los datos marcados.",

  // Cupón
  coupon: "Cupón de descuento",
  couponPlaceholder: "Código",
  apply: "Aplicar",
  applying: "Validando…",
  removeCoupon: "Quitar cupón",
  couponApplied: (code: string, pct: number) => `Cupón ${code} aplicado: −${pct} %.`,
  couponErrors: {
    not_found: "Este cupón no existe.",
    inactive: "Este cupón no está activo.",
    members_only: "Este cupón es solo para miembros registrados. Crea tu Cuenta Origen con este correo para usarlo.",
    exhausted: "Este cupón ya alcanzó su límite de usos.",
  } as Record<string, string>,
  couponMembersCta: "Crear mi Cuenta Origen",
  couponError: "No se pudo validar el cupón.",

  // Resumen y pago
  howToPayTitle: "Cómo pagas",
  howToPay: (methods: PaymentMethodId[], currency: RateCurrency) =>
    `${methodsSentence("es", methods, currency)}. Al continuar verás los datos de pago; tus cupos quedan apartados por 60 minutos mientras reportas el pago.`,
  lineSpots: (n: number, price: string) => `Cupos (${n} × ${price})`,
  lineAddOns: "Adicionales",
  lineDiscount: (code: string) => `Descuento ${code}`,
  total: "Total",
  termsLinks: { terms: "Términos y Condiciones", privacy: "Política de Privacidad" },
  termsRequired: "Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar.",
  submit: "Continuar al pago",
  submitting: "Reservando…",
  submitError: "No se pudo crear la reserva. Intenta de nuevo.",
  connectionError: "Error de conexión. Revisa tu internet e intenta de nuevo.",
};

type TastingCopy = typeof es;

const en: TastingCopy = {
  loading: "Loading experience…",
  notFoundTitle: "This tasting is not available",
  notFoundText: "It may have already taken place or the link may be wrong. Take a look at our upcoming tastings.",
  notFoundCta: "See upcoming tastings",
  breadcrumb: { home: "Home", tastings: "Tastings" },
  category: {
    degustacion: "Guided tasting",
    reserva: "Cellar reserve",
    atardecer: "Sunset",
    blancos: "White wines",
    privada: "Private",
    icono: "Icon",
  },

  date: "Date",
  time: "Time",
  place: "Venue",
  directions: "Get directions",
  products: "What you'll taste",
  vintage: "Vintage",
  pairings: "Pairings & menu",
  sommeliers: (n) => (n === 1 ? "Your sommelier" : "Your sommeliers"),
  readMore: "Read more",
  readLess: "Show less",
  instagram: "On Instagram",
  instagramAria: (handle) => `Open ${handle} on Instagram`,
  venue: "The venue",

  checkoutEyebrow: "Book your spot",
  checkoutTitle: "Buy spots",
  perPerson: "per person",
  bsApprox: (bs) => `≈ Bs ${bs}`,
  rateNote: (currency) => `${RATE_NAME.en[currency]} of the day`,
  noRate: "In bolívares at the rate of the day",
  steps: ["Spots", "Details", "Confirm"],
  stepAria: (n, label) => `Step ${n}: ${label}`,
  spotsLabel: "Number of spots",
  persons: (n) => `${n} ${n === 1 ? "person" : "people"}`,
  fewer: "Remove a spot",
  more: "Add a spot",
  available: (n) => `${n} ${n === 1 ? "spot" : "spots"} left for this date.`,
  maxPerOrder: (n) => `Up to ${n} spots per reservation.`,
  soldOutTitle: "Sold out",
  soldOutText: "Join the waiting list and we'll message you on WhatsApp as soon as a spot opens up or we announce a new date.",
  soldOutCta: "Join the waiting list",
  soldOutWhatsapp: "Message us on WhatsApp",
  soldOutMessage: (title) => `Hi, I'd like to join the waiting list for the El Origen tasting “${title}”.`,
  addOnQty: (title) => `Quantity of ${title}`,
  addOnLess: (title) => `Remove ${title}`,
  addOnMore: (title) => `Add ${title}`,
  next: "Continue to your details",
  review: "Review and confirm",
  back: "Back",

  name: "Full name *",
  namePlaceholder: "E.g. Laura Rossi",
  docId: "ID number (cédula) *",
  docIdPlaceholder: "E.g. V-12345678",
  email: "Email *",
  emailHint: "Your QR tickets will be sent here.",
  emailAccountHint: "This is your Origen account email: your QR tickets will be sent here.",
  checkingAccount: "Checking your account…",
  loginTitle: "Buy with your Origen account",
  loginText:
    "You need to sign in to book spots, so your bookings and tickets are saved in your account. Creating one is free and takes less than a minute.",
  loginCta: "Sign in",
  registerCta: "Create my Origen account",
  phone: "WhatsApp *",
  phoneHint: "We also send your tickets by WhatsApp.",
  phonePlaceholder: "E.g. +58 414-123-4567",
  dietary: "Dietary restrictions or allergies",
  dietaryPlaceholder: "E.g. vegetarian, gluten-free, nut allergy…",
  memberPrefilled: "We filled in your details from your Origen account.",
  errRequired: "This field is required.",
  errEmail: "Enter a valid email.",
  errPhone: "Enter a valid WhatsApp number.",
  errDocId: "Enter a valid ID number.",
  errFix: "Please check the highlighted fields.",

  coupon: "Discount code",
  couponPlaceholder: "Code",
  apply: "Apply",
  applying: "Checking…",
  removeCoupon: "Remove code",
  couponApplied: (code, pct) => `Code ${code} applied: −${pct}%.`,
  couponErrors: {
    not_found: "This code does not exist.",
    inactive: "This code is not active.",
    members_only: "This code is for registered members only. Create your Origen account with this email to use it.",
    exhausted: "This code has reached its usage limit.",
  },
  couponMembersCta: "Create my Origen account",
  couponError: "The code could not be validated.",

  howToPayTitle: "How you pay",
  howToPay: (methods, currency) =>
    `${methodsSentence("en", methods, currency)}. Next you'll see the payment details; your spots are held for 60 minutes while you report the payment.`,
  lineSpots: (n, price) => `Spots (${n} × ${price})`,
  lineAddOns: "Add-ons",
  lineDiscount: (code) => `Discount ${code}`,
  total: "Total",
  termsLinks: { terms: "Terms and Conditions", privacy: "Privacy Policy" },
  termsRequired: "You must accept the Terms and Conditions and the Privacy Policy to continue.",
  submit: "Continue to payment",
  submitting: "Booking…",
  submitError: "The reservation could not be created. Please try again.",
  connectionError: "Connection error. Check your internet and try again.",
};

export const TASTING_COPY: Record<Language, TastingCopy> = { es, en };
