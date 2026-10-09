import type { Language } from "./i18n";

/* Fotos reales de catas de El Origen (enviadas por el cliente; public/images/experiencias, sin metadatos EXIF).
   Las de banderitas italianas son de la cata «Contrastes de Italia» (así dice el mantel individual). */
// PENDIENTE CLIENTE: confirmar el lugar de la cata «Contrastes de Italia» para ponerlo en el pie de foto.

export interface EventPhoto {
  src: string;
  width: number;
  height: number;
  alt: Record<Language, string>;
  /** Pie corto: el lugar o la cata. */
  caption: Record<Language, string>;
}

const MARATEA = { es: "Maratea · Las Mercedes", en: "Maratea · Las Mercedes" };
const ITALIA = { es: "Cata «Contrastes de Italia»", en: "“Contrasts of Italy” tasting" };
const GUESTS = { es: "Nuestros invitados", en: "Our guests" };

const photo = (
  file: string,
  caption: Record<Language, string>,
  alt: Record<Language, string>,
  width = 960,
  height = 1280
): EventPhoto => ({ src: `/images/experiencias/${file}.jpg`, width, height, alt, caption });

export const PHOTOS = {
  mesaSommelier: photo("mesa-sommelier-maratea", MARATEA, {
    es: "Sommelier presentando un vino ante una mesa larga de invitadas en Maratea",
    en: "Sommelier presenting a wine to a long table of guests at Maratea",
  }),
  sommelierTerraza: photo("sommelier-terraza-maratea", MARATEA, {
    es: "Sommelier guiando la cata entre las mesas de la terraza de Maratea",
    en: "Sommelier leading the tasting among the tables on Maratea's terrace",
  }),
  sommelierExplica: photo("sommelier-explica-maratea", MARATEA, {
    es: "Sommelier explicando un vino a los invitados de la terraza",
    en: "Sommelier explaining a wine to guests on the terrace",
  }),
  presentacion: photo("presentacion-terraza-maratea", MARATEA, {
    es: "Presentación con micrófono durante una cata en la terraza de Maratea",
    en: "Presentation with a microphone during a tasting on Maratea's terrace",
  }),
  terrazaLlena: photo("terraza-llena-maratea", MARATEA, {
    es: "Terraza de Maratea llena de invitados bajo lámparas de mimbre",
    en: "Maratea's terrace full of guests under wicker lamps",
  }),
  mesaTerraza: photo("mesa-terraza-maratea", MARATEA, {
    es: "Grupo de invitados en una mesa de la terraza de Maratea",
    en: "Group of guests at a table on Maratea's terrace",
  }),
  brindis: photo("brindis-maratea", MARATEA, {
    es: "Invitadas degustando vino blanco bajo el letrero de Maratea",
    en: "Guests tasting white wine under the Maratea sign",
  }),
  plato: photo("plato-maratea", MARATEA, {
    es: "Plato de calamares maridado con una copa de vino blanco",
    en: "Squid dish paired with a glass of white wine",
  }),
  platoAcquaPanna: photo("plato-acqua-panna-maratea", MARATEA, {
    es: "Plato de la cata con copa de vino blanco y agua Acqua Panna",
    en: "Tasting dish with a glass of white wine and Acqua Panna water",
  }),
  acquaPanna: photo("acqua-panna", MARATEA, {
    es: "Botella de Acqua Panna servida en la mesa de la cata",
    en: "Bottle of Acqua Panna served at the tasting table",
  }),
  invitadosTintos: photo(
    "invitados-tintos",
    MARATEA,
    { es: "Tres invitados brindando con vino tinto", en: "Three guests raising glasses of red wine" },
    1280,
    960
  ),
  invitadosSelfie: photo(
    "invitados-selfie",
    GUESTS,
    { es: "Selfie de tres invitados sonrientes en una cata", en: "Selfie of three smiling guests at a tasting" },
    720,
    1280
  ),
  salaItalia: photo("sala-contrastes-italia", ITALIA, {
    es: "Invitados atentos en la cata «Contrastes de Italia», con la pizarra de vinos al fondo",
    en: "Guests listening at the “Contrasts of Italy” tasting, with the wine board behind them",
  }),
  sommelierMesaItalia: photo("sommelier-mesa-italia", ITALIA, {
    es: "Sommelier conversando con una mesa de invitados en la cata «Contrastes de Italia»",
    en: "Sommelier talking with a table of guests at the “Contrasts of Italy” tasting",
  }),
  sommelierCopaItalia: photo("sommelier-copa-italia", ITALIA, {
    es: "Sommelier con una copa en la mano guiando la cata «Contrastes de Italia»",
    en: "Sommelier holding a glass while leading the “Contrasts of Italy” tasting",
  }),
  sommelierGuiaItalia: photo("sommelier-guia-italia", ITALIA, {
    es: "Sommelier presentando la cata «Contrastes de Italia» a los invitados",
    en: "Sommelier introducing the “Contrasts of Italy” tasting to the guests",
  }),
  invitadoMapas: photo("invitado-mapas-italia", ITALIA, {
    es: "Invitado escuchando con atención frente a los mapas de regiones vinícolas",
    en: "Guest listening closely in front of maps of wine regions",
  }),
  botellasItalia: photo("botellas-italia", ITALIA, {
    es: "Botellas de Chianti Frescobaldi y Planeta La Segreta de la cata «Contrastes de Italia»",
    en: "Bottles of Frescobaldi Chianti and Planeta La Segreta from the “Contrasts of Italy” tasting",
  }),
} satisfies Record<string, EventPhoto>;

/** Galería «Así se viven nuestras catas» de la portada (las columnas se llenan de arriba abajo). */
export const HOME_GALLERY: EventPhoto[] = [
  PHOTOS.mesaTerraza,
  PHOTOS.invitadosTintos,
  PHOTOS.sommelierMesaItalia,
  PHOTOS.brindis,
  PHOTOS.presentacion,
  PHOTOS.plato,
  PHOTOS.salaItalia,
  PHOTOS.invitadosSelfie,
  PHOTOS.terrazaLlena,
];
