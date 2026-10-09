import type { Language } from "@/lib/i18n";
import type { WineType } from "@/types";

/* Textos del catálogo de vinos (/vinos, /vinos/[slug] y la franja de la portada), ES/EN. */

export const WINE_TYPE_LABEL: Record<Language, Record<WineType, string>> = {
  es: { tinto: "Tinto", blanco: "Blanco", rosado: "Rosado", espumoso: "Espumoso", dulce: "Dulce", destilado: "Destilado", otro: "Otro" },
  en: { tinto: "Red", blanco: "White", rosado: "Rosé", espumoso: "Sparkling", dulce: "Sweet", destilado: "Spirit", otro: "Other" },
};

const es = {
  eyebrow: "Nuestros vinos",
  titleMain: "Lo que hemos",
  titleHighlight: "descorchado",
  subtitle: "Vinos, destilados y etiquetas que hemos degustado en nuestras catas, con su ficha técnica.",
  showcaseTitle: "Nuestros vinos",
  showcaseSubtitle: "Las etiquetas que han pasado por nuestras copas, con su ficha técnica.",
  viewAll: "Ver todos",
  emptyTitle: "Muy pronto",
  emptyText: "Estamos preparando las fichas de los vinos que hemos degustado en nuestras catas.",
  seeTastings: "Ver próximas catas",
  open: (name: string) => `Ver la ficha de ${name}`,
  back: "Todos los vinos",
  techSheet: "Ficha técnica",
  type: "Tipo",
  grapes: "Uva",
  vintage: "Añada",
  region: "Origen",
  winery: "Bodega",
  tastedIn: "Lo degustamos en",
  related: "Otros vinos",
  ask: "Pregúntanos por este vino",
  askMessage: (name: string) => `Hola El Origen, quisiera saber más sobre el vino ${name}.`,
  imageAlt: (name: string) => `Botella de ${name}`,
};

type WinesCopy = typeof es;

const en: WinesCopy = {
  eyebrow: "Our wines",
  titleMain: "What we have",
  titleHighlight: "uncorked",
  subtitle: "Wines, spirits and labels we have tasted at our tastings, with their technical sheet.",
  showcaseTitle: "Our wines",
  showcaseSubtitle: "The labels that have been in our glasses, with their technical sheet.",
  viewAll: "View all",
  emptyTitle: "Coming soon",
  emptyText: "We are preparing the sheets of the wines we have tasted at our tastings.",
  seeTastings: "See upcoming tastings",
  open: (name) => `View the sheet of ${name}`,
  back: "All wines",
  techSheet: "Technical sheet",
  type: "Type",
  grapes: "Grape",
  vintage: "Vintage",
  region: "Origin",
  winery: "Winery",
  tastedIn: "We tasted it at",
  related: "More wines",
  ask: "Ask us about this wine",
  askMessage: (name) => `Hi El Origen, I'd like to know more about the wine ${name}.`,
  imageAlt: (name) => `Bottle of ${name}`,
};

export const WINES_COPY: Record<Language, WinesCopy> = { es, en };
