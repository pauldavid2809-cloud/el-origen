import "server-only";
import { getAdminClient, getSetting, setSetting } from "./orders";
import {
  buildWinePolicies,
  DEFAULT_WINE_STORE,
  DELIVERY_MODES,
  normalizeWineStoreConfig,
  toPublicWineStore,
  type DeliveryMode,
  type PolicyText,
  type PublicWineStore,
  type WineStoreConfig,
} from "./wineStoreRules";

/* Configuración de la tienda de vinos editable desde el panel (app_settings → key "wine_store").
   Mismo patrón que la configuración de pagos (settings.ts): sin Supabase vive en memoria (solo pruebas locales).
   Las reglas puras (normalizar, costo de envío, condiciones) están en wineStoreRules.ts. */

export const WINE_STORE_SETTING_KEY = "wine_store";

/**
 * Lo guardado en app_settings: null = no hay configuración guardada. Lanza si la lectura falla (getSetting ignora los
 * errores y devolvería null, lo que se confundiría con «no hay nada guardado»: por eso la consulta propia).
 */
async function readStoredConfig(): Promise<unknown> {
  const sb = getAdminClient();
  if (!sb) return (await getSetting<unknown>(WINE_STORE_SETTING_KEY)) ?? null;
  const { data, error } = await sb.from("app_settings").select("value").eq("key", WINE_STORE_SETTING_KEY).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

/**
 * Configuración vigente. Nunca lanza: ante un error de lectura o un JSON guardado que ya no es válido devuelve los
 * valores por defecto (la tienda sigue funcionando como en la versión 1) y lo deja en el registro.
 * Es la que usan las páginas y los avisos. Lo que cobra dinero (el checkout) usa `getWineStoreConfigStrict`.
 */
export async function getWineStoreConfig(): Promise<WineStoreConfig> {
  try {
    const stored = await readStoredConfig();
    if (stored) return normalizeWineStoreConfig(stored);
  } catch (err) {
    console.error("[wineStore] Configuración de la tienda ilegible o inválida; se usan los valores por defecto:", err);
  }
  return normalizeWineStoreConfig(DEFAULT_WINE_STORE);
}

/**
 * La configuración guardada no se pudo usar. `reason`: "read" = falló la lectura de la base de datos; "invalid" = lo
 * guardado ya no es una configuración válida (editado a mano, o reglas que cambiaron).
 */
export class WineStoreUnavailableError extends Error {
  constructor(message: string, readonly reason: "read" | "invalid") {
    super(message);
    this.name = "WineStoreUnavailableError";
  }
}

/** Lo guardado tiene la forma de una configuración: un objeto, con el modo de envío y los interruptores bien escritos (si están). */
function assertStoredShape(stored: unknown): void {
  const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) throw new Error("el valor guardado no es un objeto");
  const c = asRecord(stored);
  const d = asRecord(c.delivery);
  const p = asRecord(c.pickup);
  // `normalizeWineStoreConfig` es tolerante: un modo de envío raro pasaría a «coordinar» y un interruptor raro a «activo».
  // Para cobrar eso no vale: si está escrito, debe estar bien escrito.
  if (d.mode !== undefined && !DELIVERY_MODES.includes(d.mode as DeliveryMode)) throw new Error("el modo de envío guardado no es válido");
  for (const [label, v] of [["enabled", c.enabled], ["pickup.enabled", p.enabled], ["delivery.enabled", d.enabled]] as const) {
    if (v !== undefined && typeof v !== "boolean") throw new Error(`«${label}» guardado no es verdadero o falso`);
  }
}

/**
 * Configuración vigente para decidir dinero (el checkout): como `getWineStoreConfig`, pero NO falla abierto.
 * Distingue «no hay configuración guardada» (devuelve los valores por defecto, la tienda de la v1) de «no se pudo leer»
 * o «lo guardado ya no es válido» (lanza `WineStoreUnavailableError`): con una lectura rota no se debe cobrar un envío
 * ni abrir una tienda cerrada a ciegas. El que llama responde 503 `store_unavailable`.
 */
export async function getWineStoreConfigStrict(): Promise<WineStoreConfig> {
  let stored: unknown;
  try {
    stored = await readStoredConfig();
  } catch (err) {
    throw new WineStoreUnavailableError(`No se pudo leer la configuración de la tienda: ${(err as Error).message}`, "read");
  }
  if (stored === null || stored === undefined) return normalizeWineStoreConfig(DEFAULT_WINE_STORE);
  try {
    assertStoredShape(stored);
    return normalizeWineStoreConfig(stored);
  } catch (err) {
    throw new WineStoreUnavailableError(`La configuración guardada de la tienda no es válida: ${(err as Error).message}`, "invalid");
  }
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
