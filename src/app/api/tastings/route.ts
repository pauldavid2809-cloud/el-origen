import { NextResponse } from "next/server";
import { tastingsWithAvailability } from "@/lib/availability";

export const dynamic = "force-dynamic";

/**
 * Catas publicadas (activas y agotadas) con su disponibilidad real, próximas primero.
 * Por defecto solo de hoy en adelante; `?past=1` incluye también las ya realizadas.
 * (Las catas se crean y editan desde el panel: `/api/admin/catas`.)
 */
export async function GET(request: Request) {
  const includePast = new URL(request.url).searchParams.get("past") === "1";
  try {
    const tastings = await tastingsWithAvailability({ upcomingOnly: !includePast });
    return NextResponse.json({ success: true, tastings });
  } catch (error) {
    console.error("[tastings] No se pudieron leer las catas:", error);
    return NextResponse.json({ success: false, message: "No se pudieron cargar las catas." }, { status: 500 });
  }
}
