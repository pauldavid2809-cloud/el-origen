import type { Language } from "@/lib/i18n";
import type { PrivateEventType, PrivateGuestRange, PrivateRestaurant } from "@/lib/leads";

/* Experiencias Privadas & Eventos Corporativos. Los textos en español son literales del cliente. */

const es = {
  eyebrow: "Catas privadas",
  titleMain: "Experiencias Privadas &",
  titleHighlight: "Eventos Corporativos",
  subtitle: "Diseñamos veladas de cata a medida para marcas, empresas y celebraciones exclusivas.",
  cta: "Solicitar Propuesta Privada",
  whatsappCta: "WhatsApp directo B2B",
  whatsappMessage: "Hola El Origen, quisiera solicitar una propuesta privada para un evento.",

  narrativeEyebrow: "A tu medida",
  narrativeTitle: "Lleva la excelencia de El Origen a tu espacio o evento exclusivo.",
  narrativeText:
    "Entendemos que los grandes negocios y los momentos más memorables se consolidan alrededor de una buena mesa. En El Origen trasladamos nuestro sello de cata guiada, maridaje de autor y cristalería de alta gama a eventos corporativos, juntas directivas, lanzamientos de marca o celebraciones privadas.",
  capacityLabel: "Aforo",
  capacityValue: "10 a 60 invitados",
  profileLabel: "Perfil",
  profileValue:
    "Ideal para actividades corporativas, celebraciones, eventos de lanzamientos, ofrecer una experiencia diferenciadora a sus ejecutivos o aliados comerciales.",

  formEyebrow: "Formulario de cotización",
  formTitle: "Solicita tu propuesta",
  formSubtitle: "Cuéntanos sobre tu evento y te enviaremos una propuesta a la medida.",
  fullName: "Nombre completo",
  company: "Empresa / Marca",
  phone: "Teléfono de contacto (WhatsApp)",
  phoneHint: "Con código de área, p. ej. 0414-000-0000.",
  email: "Correo electrónico",
  eventType: "Tipo de evento",
  eventTypePlaceholder: "Selecciona una opción",
  eventTypes: {
    corporativo: "Corporativo",
    celebracion_privada: "Celebración Privada",
    alianza_comercial: "Alianza Comercial",
    cena_navidena: "Cena navideña",
  } satisfies Record<PrivateEventType, string>,
  interest: "Licor o Categoría de Interés",
  interestPlaceholder: "Ej.: vinos tintos, whisky, cocuy…",
  guests: "Número estimado de invitados",
  guestRanges: {
    "10-15": "10–15 pax",
    "15-25": "15–25 pax",
    "25+": "25+ pax",
  } satisfies Record<PrivateGuestRange, string>,
  restaurant: "Restaurante",
  restaurants: {
    karnivoros_grill: "Karnivoros Grill · CCCT",
    maratea: "Maratea · Las Mercedes",
  } satisfies Record<PrivateRestaurant, string>,
  message: "Detalles adicionales",
  messagePlaceholder: "Fecha tentativa, presupuesto o cualquier requerimiento especial.",
  submit: "Solicitar Propuesta Privada",
  errors: {
    fullName: "Indica tu nombre completo.",
    phone: "Indica un número de WhatsApp válido.",
    email: "Escribe un correo válido.",
    eventType: "Selecciona el tipo de evento.",
    guests: "Selecciona el número estimado de invitados.",
  },
  successTitle: "¡Solicitud recibida!",
  successText: (name: string) =>
    `Gracias, ${name}. Nuestro equipo te contactará por WhatsApp para conversar los detalles y enviarte una propuesta a la medida.`,
};

const en: typeof es = {
  eyebrow: "Private tastings",
  titleMain: "Private Experiences &",
  titleHighlight: "Corporate Events",
  subtitle: "We design bespoke tasting evenings for brands, companies and exclusive celebrations.",
  cta: "Request a Private Proposal",
  whatsappCta: "Direct B2B WhatsApp",
  whatsappMessage: "Hello El Origen, I'd like to request a private proposal for an event.",

  narrativeEyebrow: "Made to measure",
  narrativeTitle: "Bring the excellence of El Origen to your venue or exclusive event.",
  narrativeText:
    "We know that great deals and the most memorable moments come together around a good table. At El Origen we bring our signature guided tastings, chef-driven pairings and fine glassware to corporate events, board meetings, brand launches and private celebrations.",
  capacityLabel: "Capacity",
  capacityValue: "10 to 60 guests",
  profileLabel: "Ideal for",
  profileValue:
    "Corporate activities, celebrations and launch events, or offering a distinctive experience to your executives and business partners.",

  formEyebrow: "Quote request",
  formTitle: "Request your proposal",
  formSubtitle: "Tell us about your event and we'll send you a tailor-made proposal.",
  fullName: "Full name",
  company: "Company / Brand",
  phone: "Contact phone (WhatsApp)",
  phoneHint: "Include the area code, e.g. 0414-000-0000.",
  email: "Email",
  eventType: "Event type",
  eventTypePlaceholder: "Select an option",
  eventTypes: {
    corporativo: "Corporate",
    celebracion_privada: "Private celebration",
    alianza_comercial: "Business partnership",
    cena_navidena: "Christmas dinner",
  },
  interest: "Spirit or category of interest",
  interestPlaceholder: "E.g. red wines, whisky, cocuy…",
  guests: "Estimated number of guests",
  guestRanges: {
    "10-15": "10–15 guests",
    "15-25": "15–25 guests",
    "25+": "25+ guests",
  },
  restaurant: "Restaurant",
  restaurants: {
    karnivoros_grill: "Karnivoros Grill · CCCT",
    maratea: "Maratea · Las Mercedes",
  },
  message: "Additional details",
  messagePlaceholder: "Tentative date, budget or any special requirement.",
  submit: "Request a Private Proposal",
  errors: {
    fullName: "Enter your full name.",
    phone: "Enter a valid WhatsApp number.",
    email: "Enter a valid email address.",
    eventType: "Select the event type.",
    guests: "Select the estimated number of guests.",
  },
  successTitle: "Request received!",
  successText: (name: string) =>
    `Thank you, ${name}. Our team will contact you on WhatsApp to go over the details and send you a tailor-made proposal.`,
};

export const PRIVADAS_COPY: Record<Language, typeof es> = { es, en };
