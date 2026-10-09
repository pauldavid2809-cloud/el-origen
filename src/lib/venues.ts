import type { Language } from "./i18n";

/* Restaurantes y espacios aliados donde se hacen las catas. La reseña se muestra en la página
   de compra de la cata (como la tarjeta del sommelier). Datos tomados de sus perfiles de Instagram. */
// PENDIENTE CLIENTE: aprobar las reseñas; dirección y enlace de Google Maps de Maratea y Casa Oliveira.

export interface Venue {
  id: string;
  name: string;
  /** Rubro, como aparece en su perfil. */
  kind: Record<Language, string>;
  review: Record<Language, string>;
  /** Dirección corta (vacía si no se conoce). */
  address: string;
  mapsUrl: string;
  instagram: string;
  /** Logo redondo (public/images/venues). */
  logoUrl: string;
  /** Palabras que identifican al lugar en el campo «Lugar» de una cata. */
  match: string[];
}

export const VENUES: Venue[] = [
  {
    id: "karnivoros_grill",
    name: "Karnivoros Grill",
    kind: { es: "Restaurante de carnes nacionales e importadas", en: "Steakhouse · local and imported cuts" },
    review: {
      es: "En la Zona Gourmet del CCCT, Karnivoros propone «la experiencia steak que eleva tu paladar»: carnes nacionales e importadas trabajadas con cocina de autor. Un escenario hecho para maridar cortes a la parrilla con buenos tintos y destilados.",
      en: "In the CCCT Gourmet Zone, Karnivoros offers “the steak experience that elevates your palate”: local and imported cuts with a chef-driven kitchen. A natural stage for pairing grilled cuts with fine reds and spirits.",
    },
    address: "CCCT, Nivel PB, Zona Gourmet",
    mapsUrl: "",
    instagram: "@karnivoros.grill",
    logoUrl: "/images/venues/karnivoros-grill.jpg",
    match: ["karnivoros", "carnivoros"],
  },
  {
    id: "maratea",
    name: "Maratea",
    kind: { es: "Trattoria italo-venezolana", en: "Italian-Venezuelan trattoria" },
    review: {
      es: "Trattoria italo-venezolana en Las Mercedes: «dos culturas unidas con criterio». La cocina italiana se cruza con el sabor venezolano en una mesa cálida, con una atención que se siente en cada detalle.",
      en: "An Italian-Venezuelan trattoria in Las Mercedes: “two cultures united with good judgment”. Italian cooking meets Venezuelan flavor at a warm table, with service you feel in every detail.",
    },
    address: "Las Mercedes",
    mapsUrl: "",
    instagram: "@maratea.ccs",
    logoUrl: "/images/venues/maratea.jpg",
    match: ["maratea"],
  },
  {
    id: "casa_oliveira",
    name: "Casa Oliveira",
    kind: { es: "Vinos, destilados y alimentos", en: "Wines, spirits & fine food" },
    review: {
      es: "Casa de vinos, destilados y alimentos de alta calidad «para la vida que mereces». Un lugar para descubrir etiquetas y productos gourmet, rodeado de botellas: el ambiente perfecto para una cata.",
      en: "A house of high-quality wines, spirits and food “for the life you deserve”. A place to discover labels and gourmet products surrounded by bottles: the perfect setting for a tasting.",
    },
    address: "",
    mapsUrl: "",
    instagram: "@casaoliveira.ve",
    logoUrl: "/images/venues/casa-oliveira.jpg",
    match: ["oliveira"],
  },
];

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function getVenue(id: string): Venue | undefined {
  return VENUES.find((v) => v.id === id);
}

/** Lugar aliado que corresponde al campo «Lugar» de una cata (por nombre), si lo hay. */
export function venueForLocation(location: string | null | undefined): Venue | undefined {
  const text = fold(location ?? "");
  if (!text) return undefined;
  return VENUES.find((v) => v.match.some((m) => text.includes(m)));
}
