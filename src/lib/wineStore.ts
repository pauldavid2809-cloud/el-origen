import "server-only";
import { getAdminClient, getSetting, setSetting } from "./orders";
import {
  buildWinePolicies,
  DEFAULT_WINE_STORE,
  normalizeWineStoreConfig,
  toPublicWineStore,
  type PolicyText,
  type PublicWineStore,
  type WineStoreConfig,
} from "./wineStoreRules";

/* Configuración de la tienda de vinos editable desde el panel (app_settings → key "wine_store").
   Mismo patrón que la configuración de pagos (settings.ts): sin Supabase vive en memoria (solo pruebas locales).
   Las reglas puras (normalizar, costo de envío, condiciones) están en wineStoreRules.ts. */

export const WINE_STORE_SETTING_KEY = "wine_store";

/**
 * Configuración vigente. Nunca lanza: ante un error de lectura o un JSON guardado que ya no es válido devuelve los
 * valores por defecto (la tienda sigue funcionando como en la versión 1) y lo deja en el registro.
 */
export async function getWineStoreConfig(): Promise<WineStoreConfig> {
  try {
    const sb = getAdminClient();
    let stored: unknown = null;
    if (!sb) stored = await getSetting<unknown>(WINE_STORE_SETTING_KEY);
    else {
      // Consulta propia (getSetting ignora los errores): así un fallo de lectura queda en el registro.
      const { data, error } = await sb.from("app_settings").select("value").eq("key", WINE_STORE_SETTING_KEY).maybeSingle();
      if (error) throw new Error(error.message);
      stored = data?.value ?? null;
    }
    if (stored) return normalizeWineStoreConfig(stored);
  } catch (err) {
    console.error("[wineStore] Configuración de la tienda ilegible o inválida; se usan los valores por defecto:", err);
  }
  return normalizeWineStoreConfig(DEFAULT_WINE_STORE);
}

/**
 * Valida y guarda la configuración. Devuelve la versión normalizada.
 * Lanza `WineStoreConfigError` si no es válida (mensaje apto para el panel → 400) o un Error si no se pudo guardar.
 * Quien guarda debe invalidar las cachés (`revalidateWines()` de wines.ts): la portada es estática.
 */
export async function saveWineStoreConfig(input: unknown): Promise<WineStoreConfig> {
  const clean = normalizeWineStoreConfig(input);
  const sb = getAdminClient();
  if (!sb) {
    await setSetting(WINE_STORE_SETTING_KEY, clean);
    return clean;
  }
  const { error } = await sb.from("app_settings").upsert({ key: WINE_STORE_SETTING_KEY, value: clean, updated_at: new Date().toISOString() });
  if (error) throw new Error(`No se pudo guardar la configuración de la tienda: ${error.message}`);
  return clean;
}

/** Lo único que ve el público de la configuración (con las condiciones de compra ya resueltas). Nunca lanza. */
export async function getPublicWineStore(): Promise<PublicWineStore> {
  return toPublicWineStore(await getWineStoreConfig());
}

/** Condiciones de compra GENERADAS a partir de la configuración actual (sin las personalizadas), para el botón «Ver las condiciones actuales» del panel. */
export function generatedWinePolicies(config: WineStoreConfig): { es: PolicyText; en: PolicyText } {
  const auto = { ...config, terms: { es: [], en: [] } };
  return { es: buildWinePolicies(auto, "es"), en: buildWinePolicies(auto, "en") };
}
