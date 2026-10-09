import type { Language } from "@/lib/i18n";

/* Textos de /eventos (ES/EN). */

const es = {
  eyebrow: "Eventos",
  titleMain: "Lo que hemos",
  titleHighlight: "vivido",
  subtitle: "Las catas y encuentros que ya realizamos, con sus fotos. Toca un evento para ver su galería completa.",
  photos: (n: number) => `${n} ${n === 1 ? "foto" : "fotos"}`,
  open: (title: string) => `Ver las fotos de ${title}`,
  emptyTitle: "Las galerías vienen en camino",
  emptyText: "Muy pronto publicaremos aquí las fotos de cada evento.",
  nextTitle: "¿Te sumas a la próxima?",
  nextCta: "Ver próximas catas",
};

type EventsCopy = typeof es;

const en: EventsCopy = {
  eyebrow: "Events",
  titleMain: "What we have",
  titleHighlight: "lived",
  subtitle: "Tastings and gatherings we have already held, with their photos. Tap an event to see its full gallery.",
  photos: (n) => `${n} ${n === 1 ? "photo" : "photos"}`,
  open: (title) => `See the photos of ${title}`,
  emptyTitle: "The galleries are on their way",
  emptyText: "We will soon post the photos of each event here.",
  nextTitle: "Join the next one?",
  nextCta: "See upcoming tastings",
};

export const EVENTS_COPY: Record<Language, EventsCopy> = { es, en };
