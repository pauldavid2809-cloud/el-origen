import type { Language } from "@/lib/i18n";

/* Nosotros. La historia y el lema en español son literales del cliente; las presentaciones de
   los sommeliers viven en src/lib/team.ts. */

const es = {
  eyebrow: "Nosotros",
  titleMain: "Nuestra",
  titleHighlight: "historia",
  subtitle: "Una firma de experiencias exclusivas de cata nacida en Caracas.",

  historyEyebrow: "Cómo nació",
  historyTitle: "Caracas, 2026",
  history: [
    "El Origen nació en Caracas a inicios de 2026, impulsado por una visión clara: transformar la manera en que se vive la gastronomía y los licores de alta gama en Venezuela. Lo que comenzó como un concepto íntimo de catas guiadas evolucionó rápidamente en una firma de experiencias exclusivas, diseñadas para quienes buscan conectar a través del paladar, el aprendizaje y el networking de alto nivel.",
    "Desde nuestras primeras ediciones dedicadas al fascinante universo del vino y las grandes etiquetas, El Origen se ha consolidado como un punto de encuentro para apasionados, coleccionistas y marcas de prestigio.",
  ],

  mottoLabel: "Nuestro lema",
  motto: "El Origen, allí el inicio de todo",

  teamEyebrow: "Quién dirige las catas",
  teamTitle: "Sommeliers & directores de cata",
  teamSubtitle: "Especialistas que guían cada experiencia de El Origen.",
  instagramLabel: (name: string) => `Instagram de ${name}`,

  joinEyebrow: "Red de sommeliers",
  joinTitle: "Únete a nuestra red de sommeliers & directores de cata",
  joinText: "¿Tienes formación certificada y pasión por la docencia sensorial? Queremos conocerte.",
  joinCta: "Postularme como Sommelier",
  tastingsCta: "Ver próximas catas",
};

const en: typeof es = {
  eyebrow: "About us",
  titleMain: "Our",
  titleHighlight: "story",
  subtitle: "A firm of exclusive tasting experiences born in Caracas.",

  historyEyebrow: "How it began",
  historyTitle: "Caracas, 2026",
  history: [
    "El Origen was born in Caracas in early 2026, driven by a clear vision: to transform the way fine food and premium spirits are experienced in Venezuela. What began as an intimate concept of guided tastings quickly grew into a firm of exclusive experiences, designed for those who seek to connect through the palate, learning and high-level networking.",
    "Since our first editions, devoted to the fascinating world of wine and great labels, El Origen has become a meeting point for enthusiasts, collectors and prestigious brands.",
  ],

  mottoLabel: "Our motto",
  motto: "El Origen, where it all begins",

  teamEyebrow: "Who leads the tastings",
  teamTitle: "Sommeliers & tasting directors",
  teamSubtitle: "The specialists who guide every El Origen experience.",
  instagramLabel: (name: string) => `${name} on Instagram`,

  joinEyebrow: "Sommelier network",
  joinTitle: "Join our network of sommeliers & tasting directors",
  joinText: "Do you hold certified training and a passion for sensory teaching? We'd love to meet you.",
  joinCta: "Apply as a Sommelier",
  tastingsCta: "See upcoming tastings",
};

export const NOSOTROS_COPY: Record<Language, typeof es> = { es, en };
