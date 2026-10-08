import type { Language } from "./i18n";

/* Espacios publicitarios de la página de inicio. Se administran desde el panel (Publicidad) y se
   guardan en app_settings → key "ads". Un espacio activo sin imagen muestra «Anuncia aquí». */

export const AD_SLOT_IDS = ["top", "band1", "band2", "band3", "wide"] as const;
export type AdSlotId = (typeof AD_SLOT_IDS)[number];
export type AdKind = "banner" | "box";

export interface AdSlot {
  /** Se muestra en el sitio. Sin imagen aparece el aviso «Anuncia aquí». */
  enabled: boolean;
  /** Nombre del anunciante (texto alternativo de la imagen). */
  advertiser: string;
  imageUrl: string;
  /** Ancho / alto de la imagen, para reservar su espacio antes de que cargue. */
  imageRatio: number | null;
  /** Versión para teléfonos (solo banners). Si falta se usa la principal. */
  mobileImageUrl: string;
  mobileImageRatio: number | null;
  /** Adónde lleva el anuncio (web, Instagram o WhatsApp del anunciante). Vacío = sin enlace. */
  link: string;
}

export type AdsConfig = Record<AdSlotId, AdSlot>;
/** Lo que ve el sitio: solo los espacios activos. */
export type PublicAds = Partial<Record<AdSlotId, AdSlot>>;

export const AD_SLOTS: Record<AdSlotId, { name: string; where: string; kind: AdKind; size: string; mobileSize?: string }> = {
  top: {
    name: "Banner inicial",
    where: "Arriba de todo en la página de inicio, justo debajo del menú.",
    kind: "banner",
    size: "1600 × 250 px (horizontal)",
    mobileSize: "800 × 300 px",
  },
  band1: {
    name: "Recuadro 1",
    where: "Franja vinotinto del inicio (Entrada individual · QR por persona), a la izquierda.",
    kind: "box",
    size: "800 × 600 px (4:3)",
  },
  band2: {
    name: "Recuadro 2",
    where: "Franja vinotinto del inicio, al centro.",
    kind: "box",
    size: "800 × 600 px (4:3)",
  },
  band3: {
    name: "Recuadro 3",
    where: "Franja vinotinto del inicio, a la derecha.",
    kind: "box",
    size: "800 × 600 px (4:3)",
  },
  wide: {
    name: "Banner largo",
    where: "Entre «Conocer nuestra historia» y «Quienes dirigen cada cata».",
    kind: "banner",
    size: "1600 × 400 px (horizontal)",
    mobileSize: "800 × 400 px",
  },
};

const emptySlot = (): AdSlot => ({
  enabled: true,
  advertiser: "",
  imageUrl: "",
  imageRatio: null,
  mobileImageUrl: "",
  mobileImageRatio: null,
  link: "",
});

export function defaultAdsConfig(): AdsConfig {
  return Object.fromEntries(AD_SLOT_IDS.map((id) => [id, emptySlot()])) as AdsConfig;
}

export class AdsConfigError extends Error {}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Imagen subida desde el panel (Supabase Storage) o, sin Supabase, la data URL de prueba. */
function imageUrl(v: unknown, label: string): string {
  const url = text(v, 2_000_000);
  if (!url) return "";
  if (/^https:\/\/[^\s"'<>]+$/i.test(url) && url.length <= 1000) return url;
  if (/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(url)) return url;
  throw new AdsConfigError(`${label}: la imagen no es válida. Súbala de nuevo.`);
}

function ratio(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0.2 && n <= 20 ? Math.round(n * 1000) / 1000 : null;
}

/** Enlace del anuncio: https://…, http://… o wa.me; se acepta «www.…» y se completa. */
function adLink(v: unknown, label: string): string {
  let url = text(v, 500);
  if (!url) return "";
  if (/^www\./i.test(url)) url = `https://${url}`;
  try {
    const u = new URL(url);
    if ((u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".")) return u.toString();
  } catch {
    /* se informa abajo */
  }
  throw new AdsConfigError(`${label}: el enlace debe empezar por https:// (por ejemplo, https://instagram.com/marca).`);
}

export function normalizeAdsConfig(input: unknown): AdsConfig {
  const src = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out = defaultAdsConfig();
  for (const id of AD_SLOT_IDS) {
    const raw = src[id];
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const label = AD_SLOTS[id].name;
    const banner = AD_SLOTS[id].kind === "banner";
    const image = imageUrl(r.imageUrl, label);
    const mobile = banner ? imageUrl(r.mobileImageUrl, `${label} (teléfono)`) : "";
    out[id] = {
      enabled: r.enabled !== false,
      advertiser: text(r.advertiser, 80),
      imageUrl: image,
      imageRatio: image ? ratio(r.imageRatio) : null,
      mobileImageUrl: mobile,
      mobileImageRatio: mobile ? ratio(r.mobileImageRatio) : null,
      link: adLink(r.link, label),
    };
  }
  return out;
}

export function publicAds(cfg: AdsConfig): PublicAds {
  const out: PublicAds = {};
  for (const id of AD_SLOT_IDS) if (cfg[id].enabled) out[id] = cfg[id];
  return out;
}

/* Textos del aviso «Anuncia aquí» (sitio público). */
export const AD_COPY: Record<
  Language,
  { sponsored: string; title: string; text: string; cta: string; topText: string; whatsappMessage: string; adLabel: (name: string) => string }
> = {
  es: {
    sponsored: "Espacio publicitario",
    title: "Anuncia aquí",
    text: "Tu marca frente a quienes disfrutan del buen vino, los destilados y la gastronomía en Caracas.",
    cta: "Quiero anunciar",
    topText: "Tu marca puede estar aquí. Anuncia con El Origen.",
    whatsappMessage: "Hola, me interesa anunciar mi marca en la página de El Origen. ¿Qué espacios tienen disponibles?",
    adLabel: (name) => (name ? `Publicidad: ${name}` : "Publicidad"),
  },
  en: {
    sponsored: "Advertising space",
    title: "Advertise here",
    text: "Put your brand in front of people who love fine wine, spirits and food in Caracas.",
    cta: "I want to advertise",
    topText: "Your brand could be here. Advertise with El Origen.",
    whatsappMessage: "Hi, I'm interested in advertising my brand on the El Origen website. Which spaces are available?",
    adLabel: (name) => (name ? `Advertisement: ${name}` : "Advertisement"),
  },
};
