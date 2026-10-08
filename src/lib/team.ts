/* Sommeliers y directores de cata de El Origen (textos del cliente, sin fotos aún → monograma). */

export interface TeamMember {
  id: string;
  name: string;
  role: { es: string; en: string };
  bio: { es: string; en: string };
  /** Usuario de Instagram con "@". */
  instagram?: string;
  /** PENDIENTE CLIENTE: fotos de los sommeliers. Mientras falten, mostrar monograma con `teamInitials`. */
  photoUrl?: string;
}

// PENDIENTE CLIENTE: cargo exacto de cada sommelier (el rol se resume a partir de su presentación).
export const TEAM: TeamMember[] = [
  {
    id: "belkis-croquer",
    name: "Belkis Croquer",
    role: { es: "Sommelier · Embajadora de marca", en: "Sommelier · Brand ambassador" },
    bio: {
      es: "Miembro de Venezuela Gastronómica y embajadora de marca de prestigio internacional. Su formación en vinos italianos y técnicas de catas descriptivas garantiza que cada sorbo de nuestra selección sea una lección de historia y placer.",
      en: "Member of Venezuela Gastronómica and ambassador for an internationally renowned brand. Her training in Italian wines and descriptive tasting techniques ensures that every sip of our selection is a lesson in history and pleasure.",
    },
    instagram: "@belkiscroquer",
  },
  {
    id: "fabian-lugo",
    name: "Fabián Lugo",
    role: { es: "Catador · Productor de eventos", en: "Taster · Event producer" },
    bio: {
      es: "Catador en concursos nacionales e internacionales de vinos, destilados y coctelería. Productor de eventos como Caracas Best Wine, El Vino Toma Caracas y Caracas Ron Festival. También se formó como cigar sommelier.",
      en: "Judge at national and international wine, spirits and cocktail competitions. Producer of events such as Caracas Best Wine, El Vino Toma Caracas and Caracas Ron Festival. He also trained as a cigar sommelier.",
    },
  },
  {
    id: "juan-carlos-arias",
    name: "Juan Carlos Arias",
    role: { es: "Formador en whisky · Brand Ambassador", en: "Whisky educator · Brand ambassador" },
    bio: {
      es: "Fundador y director dedicado a la creación y dictado de cursos presenciales y online en Venezuela y Latinoamérica sobre el mundo y la cultura del whisky. Brand Ambassador de Buchanan's y embajador de marcas.",
      en: "Founder and director devoted to creating and teaching in-person and online courses across Venezuela and Latin America on the world and culture of whisky. Brand Ambassador for Buchanan's and ambassador for other brands.",
    },
  },
  {
    id: "raiza-navarro",
    name: "Raiza Navarro",
    role: { es: "Sommelier", en: "Sommelier" },
    bio: {
      es: "Sommelier desde 2009, iniciando con certificaciones de viñas y bodegas en el Nuevo y Viejo Mundo (Chile, Argentina, España y Francia), de la 8va promoción de la Academia de Sommeliers de Venezuela. Ha ejercido con distribuidores, importadores y bodegones en eventos, catas, inducciones, asesorías y servicio (Casa Oliveira, Intermarca, Askar, Distribuidora Mundo Licor, Otazu, Marfran, Albacete, Di Massi y BePlus).",
      en: "Sommelier since 2009, starting with vineyard and winery certifications in the New and Old World (Chile, Argentina, Spain and France), and part of the 8th graduating class of the Academia de Sommeliers de Venezuela. She has worked with distributors, importers and wine shops on events, tastings, staff trainings, consulting and service (Casa Oliveira, Intermarca, Askar, Distribuidora Mundo Licor, Otazu, Marfran, Albacete, Di Massi and BePlus).",
    },
  },
];

export function getTeamMember(id: string): TeamMember | undefined {
  return TEAM.find((m) => m.id === id);
}

/** "Juan Carlos Arias" → "JA" (para el monograma mientras no haya foto). */
export function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** URL pública de Instagram a partir de "@usuario". */
export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}`;
}
