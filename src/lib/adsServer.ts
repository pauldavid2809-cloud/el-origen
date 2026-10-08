import "server-only";
import { unstable_noStore as noStore } from "next/cache";
import { getAdminClient, getSetting, setSetting } from "./orders";
import { defaultAdsConfig, normalizeAdsConfig, publicAds, type AdsConfig, type PublicAds } from "./ads";

/* Publicidad (app_settings → key "ads"). La página de inicio la lee con caché y el panel la
   invalida al guardar (revalidateTag(ADS_TAG)), así el inicio sigue siendo estático y rápido. */

const SETTING_KEY = "ads";
export const ADS_TAG = "ads";

/** Configuración vigente, sin caché (panel). */
export async function getAdsConfig(): Promise<AdsConfig> {
  try {
    const stored = await getSetting<unknown>(SETTING_KEY);
    if (stored) return normalizeAdsConfig(stored);
  } catch (err) {
    console.error("[ads] Configuración de publicidad inválida; se usan los valores por defecto:", err);
  }
  return defaultAdsConfig();
}

/** Valida y guarda. Devuelve la versión normalizada. */
export async function saveAdsConfig(input: unknown): Promise<AdsConfig> {
  const clean = normalizeAdsConfig(input);
  const sb = getAdminClient();
  if (!sb) {
    await setSetting(SETTING_KEY, clean);
    return clean;
  }
  const { error } = await sb.from("app_settings").upsert({ key: SETTING_KEY, value: clean, updated_at: new Date().toISOString() });
  if (error) throw new Error(`No se pudo guardar la publicidad: ${error.message}`);
  return clean;
}

/** Espacios activos para el sitio público (con caché de datos de Next, etiqueta ADS_TAG). */
export async function getPublicAds(): Promise<PublicAds> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder")) {
    // Sin Supabase (pruebas locales) los datos viven en memoria: se leen en cada visita.
    noStore();
    return publicAds(await getAdsConfig());
  }
  try {
    const res = await fetch(`${url}/rest/v1/app_settings?key=eq.${SETTING_KEY}&select=value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { tags: [ADS_TAG], revalidate: 600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as { value?: unknown }[];
    return publicAds(rows[0]?.value ? normalizeAdsConfig(rows[0].value) : defaultAdsConfig());
  } catch (err) {
    console.error("[ads] No se pudo leer la publicidad:", err);
    return publicAds(defaultAdsConfig());
  }
}
