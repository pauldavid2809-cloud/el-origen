import type { Language } from "@/lib/i18n";

/* Textos de /horarios (ES/EN). */

const es = {
  eyebrow: "Horarios",
  titleMain: "Horario de",
  titleHighlight: "atención",
  subtitle: "Escríbenos en estos horarios y te respondemos enseguida. Cada cata tiene su propia fecha y hora, que verás en su ficha.",
  hoursTitle: "Atención al cliente",
  contactTitle: "Escríbenos",
  whatsapp: "Escribir por WhatsApp",
  whatsappMessage: "Hola El Origen, quisiera más información.",
  phone: "Teléfono",
  instagram: "Instagram",
  email: "Correo",
  tastingsNote: "¿Buscas el horario de una cata?",
  tastingsCta: "Ver próximas catas",
};

type HoursCopy = typeof es;

const en: HoursCopy = {
  eyebrow: "Hours",
  titleMain: "Customer service",
  titleHighlight: "hours",
  subtitle: "Message us during these hours and we'll reply right away. Each tasting has its own date and time, shown on its page.",
  hoursTitle: "Customer service",
  contactTitle: "Contact us",
  whatsapp: "Message us on WhatsApp",
  whatsappMessage: "Hi El Origen, I'd like more information.",
  phone: "Phone",
  instagram: "Instagram",
  email: "Email",
  tastingsNote: "Looking for the time of a tasting?",
  tastingsCta: "See upcoming tastings",
};

export const HOURS_COPY: Record<Language, HoursCopy> = { es, en };
