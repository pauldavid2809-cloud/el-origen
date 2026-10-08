import type { Language } from "@/lib/i18n";

/* Textos de /cata-en-vivo/[token] (ES/EN). */

const es = {
  loading: "Preparando tu ficha de cata…",
  badge: "Ficha de cata en vivo",
  taster: "Catador",
  ticket: "Entrada",
  notFoundTitle: "No encontramos esta entrada",
  notFoundText:
    "La ficha se abre con el enlace de tu entrada una vez aprobado el pago. Revisa el enlace o escríbenos por WhatsApp.",
  errorTitle: "No se pudo cargar la ficha",
  errorText: "Revisa tu conexión e intenta de nuevo.",
  retry: "Reintentar",
  home: "Ir al inicio",
  demoBanner: "Ficha de demostración: tus notas no se guardan. Con tu entrada podrás usarla durante la cata.",
  demoTitle: "Cata de demostración",
  demoGuest: "Invitado",
  demoProducts: [
    { name: "Vino blanco", type: "Copa de práctica", description: "Observa el color a contraluz, gira la copa y busca aromas frutales y florales." },
    { name: "Vino tinto", type: "Copa de práctica", description: "Fíjate en el ribete del color, las lágrimas y la sensación de los taninos en boca." },
    { name: "Destilado", type: "Copa de práctica", description: "Acerca la nariz con calma: busca notas de madera, caramelo o ahumado." },
  ],
  glassesLabel: "Copas de la cata",
  glass: (n: number) => `Copa ${n}`,
  rated: "Calificada",
  sommelierNotes: "Notas del sommelier",
  saved: "¡Ficha guardada!",
  saveError: "No se pudo guardar la ficha. Revisa tu conexión e intenta de nuevo.",
  progress: (done: number, total: number) => `${done} de ${total} copas calificadas`,
  seeCertificate: "Ver mi certificado",
  certificateNote: "El certificado no tiene validez profesional ni académica: es un recuerdo y una fase más de la experiencia.",
  certificateTitle: "Tu certificado de degustador",
  certificateText: "Un recuerdo de esta experiencia para guardar o compartir en tus historias.",
  certificateName: "Nombre en el certificado",
  certificateNameHint: "Escribe tu nombre tal como quieres que aparezca.",
  certificateNamePlaceholder: "Tu nombre",
  backToSheet: "Volver a mis fichas",
  myTicket: "Ver mi entrada",
  photos: "Fotos del evento",
};

type LiveCopy = typeof es;

const en: LiveCopy = {
  loading: "Getting your tasting sheet ready…",
  badge: "Live tasting sheet",
  taster: "Taster",
  ticket: "Ticket",
  notFoundTitle: "We could not find this ticket",
  notFoundText:
    "The tasting sheet opens with your ticket link once the payment is approved. Check the link or message us on WhatsApp.",
  errorTitle: "The tasting sheet could not be loaded",
  errorText: "Check your connection and try again.",
  retry: "Try again",
  home: "Go to the home page",
  demoBanner: "Demo tasting sheet: your notes are not saved. With your ticket you can use it during the tasting.",
  demoTitle: "Demo tasting",
  demoGuest: "Guest",
  demoProducts: [
    { name: "White wine", type: "Practice glass", description: "Look at the colour against the light, swirl the glass and look for fruity and floral aromas." },
    { name: "Red wine", type: "Practice glass", description: "Notice the rim colour, the legs and how the tannins feel on the palate." },
    { name: "Spirit", type: "Practice glass", description: "Approach it slowly: look for notes of wood, caramel or smoke." },
  ],
  glassesLabel: "Glasses in this tasting",
  glass: (n) => `Glass ${n}`,
  rated: "Rated",
  sommelierNotes: "Sommelier's notes",
  saved: "Tasting sheet saved!",
  saveError: "The tasting sheet could not be saved. Check your connection and try again.",
  progress: (done, total) => `${done} of ${total} glasses rated`,
  seeCertificate: "See my certificate",
  certificateNote: "The certificate has no professional or academic validity: it is a keepsake and one more stage of the experience.",
  certificateTitle: "Your taster certificate",
  certificateText: "A keepsake of this experience to save or share in your stories.",
  certificateName: "Name on the certificate",
  certificateNameHint: "Write your name as you want it to appear.",
  certificateNamePlaceholder: "Your name",
  backToSheet: "Back to my tasting sheets",
  myTicket: "See my ticket",
  photos: "Event photos",
};

export const LIVE_COPY: Record<Language, LiveCopy> = { es, en };
