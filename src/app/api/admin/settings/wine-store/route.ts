import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generatedWinePolicies, getWineStoreConfigStrict, saveWineStoreConfig, WineStoreUnavailableError } from "@/lib/wineStore";
import { DEFAULT_WINE_STORE, normalizeWineStoreConfig, WineStoreConfigError, type WineStoreConfig } from "@/lib/wineStoreRules";
import { revalidateWines } from "@/lib/wines";
import { readJsonBody } from "../../../wine-orders/shared";

export const dynamic = "force-dynamic";

/** La configuración completa (12 condiciones de 300 caracteres en dos idiomas, 20 zonas…) pesa unos pocos KB: 64 KB sobra y acota lo que se lee. */
const MAX_BODY_BYTES = 64 * 1024;

/**
 * Configuración vigente de la tienda de vinos, los valores por defecto (para restaurarlos) y las condiciones de compra
 * que se generan solas con lo configurado (`generatedTerms`, para el botón «Ver las condiciones actuales»).
 * Si no se puede LEER la configuración guardada responde 500 (no se muestran los valores por defecto: el administrador los
 * guardaría encima de la configuración real). Si lo guardado ya no es válido se muestran los valores por defecto con
 * `invalidStored: true`, para poder corregirlo y guardar.
 */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    let config: WineStoreConfig;
    let invalidStored = false;
    try {
      config = await getWineStoreConfigStrict();
    } catch (error) {
      if (!(error instanceof WineStoreUnavailableError) || error.reason !== "invalid") throw error;
      console.error("[admin/settings] La configuración guardada de la tienda no es válida; se muestran los valores por defecto:", error);
      config = normalizeWineStoreConfig(DEFAULT_WINE_STORE);
      invalidStored = true;
    }
    return NextResponse.json({
      success: true,
      config,
      defaults: DEFAULT_WINE_STORE,
      generatedTerms: generatedWinePolicies(config),
      ...(invalidStored ? { invalidStored } : {}),
    });
  } catch (error) {
    console.error("[admin/settings] No se pudo leer la configuración de la tienda:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar la configuración de la tienda." }, { status: 500 });
  }
}

/** Valida y guarda la configuración completa (el cuerpo es la configuración, de hasta 64 KB). Devuelve la versión normalizada. */
export async function PUT(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  // Se lee con tope de bytes aunque falte `content-length` (o mienta): un cuerpo enorme no llega a guardarse entero en memoria.
  const read = await readJsonBody(request, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.tooLarge
      ? NextResponse.json(
          { success: false, message: `La configuración es demasiado grande (máximo ${MAX_BODY_BYTES / 1024} KB). Acorte los textos e intente de nuevo.` },
          { status: 413 }
        )
      : NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const config = await saveWineStoreConfig(read.body);
    // La portada es estática (cachea los vinos): hay que invalidarla para que muestre u oculte «Comprar» al abrir o cerrar la tienda.
    revalidateWines();
    return NextResponse.json({ success: true, config, generatedTerms: generatedWinePolicies(config) });
  } catch (error) {
    if (error instanceof WineStoreConfigError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("[admin/settings] No se pudo guardar la configuración de la tienda:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar la configuración de la tienda. Intente de nuevo." }, { status: 500 });
  }
}
