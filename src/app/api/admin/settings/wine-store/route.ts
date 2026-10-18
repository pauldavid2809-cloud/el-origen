import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generatedWinePolicies, getWineStoreConfig, saveWineStoreConfig } from "@/lib/wineStore";
import { DEFAULT_WINE_STORE, WineStoreConfigError } from "@/lib/wineStoreRules";
import { revalidateWines } from "@/lib/wines";

export const dynamic = "force-dynamic";

/**
 * Configuración vigente de la tienda de vinos, los valores por defecto (para restaurarlos) y las condiciones de compra
 * que se generan solas con lo configurado (`generatedTerms`, para el botón «Ver las condiciones actuales»).
 */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const config = await getWineStoreConfig();
    return NextResponse.json({ success: true, config, defaults: DEFAULT_WINE_STORE, generatedTerms: generatedWinePolicies(config) });
  } catch (error) {
    console.error("[admin/settings] No se pudo leer la configuración de la tienda:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar la configuración de la tienda." }, { status: 500 });
  }
}

/** Valida y guarda la configuración completa (el cuerpo es la configuración). Devuelve la versión normalizada. */
export async function PUT(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const config = await saveWineStoreConfig(body);
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
