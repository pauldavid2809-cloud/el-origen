import type { Language } from "@/lib/i18n";

/* Textos de /recuerdos/[id] (ES/EN). */

const es = {
  eyebrow: "Galería de recuerdos",
  fallbackTitle: "Recuerdos de la cata",
  subtitle: "Las fotos de la experiencia, para revivirla y compartirla.",
  count: (n: number) => `${n} ${n === 1 ? "foto" : "fotos"}`,
  emptyTitle: "Las fotos vienen en camino",
  emptyText: "Publicaremos aquí las fotos de esta cata en los próximos días.",
  photoAlt: (i: number) => `Foto ${i} de la cata`,
  by: (name: string) => `Foto: ${name}`,
  open: (i: number) => `Ver foto ${i} en grande`,
  close: "Cerrar",
  previous: "Foto anterior",
  next: "Foto siguiente",
  download: "Descargar",
  position: (i: number, total: number) => `${i} de ${total}`,
  viewerLabel: "Visor de fotos",
  catas: "Ver próximas catas",
};

type MemoriesCopy = typeof es;

const en: MemoriesCopy = {
  eyebrow: "Memories gallery",
  fallbackTitle: "Tasting memories",
  subtitle: "Photos of the experience, to relive and share it.",
  count: (n) => `${n} ${n === 1 ? "photo" : "photos"}`,
  emptyTitle: "The photos are on their way",
  emptyText: "We will post the photos of this tasting here in the coming days.",
  photoAlt: (i) => `Tasting photo ${i}`,
  by: (name) => `Photo: ${name}`,
  open: (i) => `View photo ${i} larger`,
  close: "Close",
  previous: "Previous photo",
  next: "Next photo",
  download: "Download",
  position: (i, total) => `${i} of ${total}`,
  viewerLabel: "Photo viewer",
  catas: "See upcoming tastings",
};

export const MEMORIES_COPY: Record<Language, MemoriesCopy> = { es, en };
