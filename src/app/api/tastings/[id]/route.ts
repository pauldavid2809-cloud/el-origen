import { NextResponse } from "next/server";
import { tastingWithAvailability } from "@/lib/availability";
import { PUBLIC_CATA_STATUSES } from "@/lib/catas";

export const dynamic = "force-dynamic";

/** Una cata publicada (por id o slug) con su disponibilidad real. Borradores y archivadas → 404. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const tasting = await tastingWithAvailability(decodeURIComponent(params.id));
    if (!tasting || !PUBLIC_CATA_STATUSES.includes(tasting.status)) {
      return NextResponse.json({ success: false, message: "Cata no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ success: true, tasting });
  } catch (error) {
    console.error("[tastings] No se pudo leer la cata:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar la cata." }, { status: 500 });
  }
}
