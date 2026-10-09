import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { AdsConfigError } from "@/lib/ads";
import { ADS_TAG, getAdsConfig, saveAdsConfig } from "@/lib/adsServer";

export const dynamic = "force-dynamic";

/** Espacios publicitarios de la página de inicio. */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json({ success: true, ads: await getAdsConfig() });
  } catch (error) {
    console.error("[admin/ads] No se pudo leer la publicidad:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar la publicidad." }, { status: 500 });
  }
}

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
    const ads = await saveAdsConfig(body);
    // La página de inicio guarda la publicidad en caché: se renueva ya.
    revalidateTag(ADS_TAG);
    return NextResponse.json({ success: true, ads });
  } catch (error) {
    if (error instanceof AdsConfigError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("[admin/ads] No se pudo guardar la publicidad:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar la publicidad. Intente de nuevo." }, { status: 500 });
  }
}
