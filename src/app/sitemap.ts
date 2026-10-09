import { MetadataRoute } from "next";
import { listCatas } from "@/lib/catas";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://el-origen-two.vercel.app").replace(/\/+$/, "");

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/* El idioma se elige en el navegador (misma URL para ES y EN). */
const entry = (path: string, changeFrequency: ChangeFrequency, priority: number, lastModified = new Date()) => {
  const url = `${SITE_URL}${path}`;
  return { url, lastModified, changeFrequency, priority, alternates: { languages: { es: url, en: url } } };
};

/** Páginas públicas indexables (sin cuentas, órdenes, entradas, puerta ni panel). */
const STATIC_PAGES: [path: string, changeFrequency: ChangeFrequency, priority: number][] = [
  ["", "daily", 1],
  ["/catas", "daily", 0.95],
  ["/privadas", "monthly", 0.85],
  ["/alianzas", "monthly", 0.8],
  ["/nosotros", "monthly", 0.8],
  ["/sommeliers", "monthly", 0.7],
  ["/lista-de-espera", "monthly", 0.6],
  ["/registro", "yearly", 0.5],
  ["/privacidad", "yearly", 0.3],
  ["/terminos", "yearly", 0.3],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = STATIC_PAGES.map(([path, freq, priority]) => entry(path, freq, priority));

  let catas: MetadataRoute.Sitemap = [];
  try {
    // Solo catas publicadas (activas o agotadas) de hoy en adelante.
    const tastings = await listCatas({ upcomingOnly: true });
    catas = tastings.map((t) =>
      entry(`/catas/${t.slug || t.id}`, "weekly", 0.9, new Date(t.updatedAt || t.createdAt || Date.now()))
    );
  } catch (error) {
    console.error("[sitemap] No se pudieron leer las catas:", error);
  }

  return [...pages, ...catas];
}
