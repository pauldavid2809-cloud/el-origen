import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createWine, listWines, revalidateWines, WineInputError } from "@/lib/wines";
import { getWineHolds } from "@/lib/wineOrders";

export const dynamic = "force-dynamic";

/* Catálogo de vinos (panel → Vinos). La foto se sube antes con /api/admin/upload (folder = vinos). */

/**
 * Devuelve `wines` y `holds` (wineId → botellas reservadas por pedidos en revisión, aprobados y pendientes de pago
 * vigentes; solo de los vinos que controlan existencias). Disponibles = stock − holds[id]. Si no se pudieron leer las
 * reservas, `holds` va vacío y `holdsError` es true (la lista de vinos no falla por eso).
 */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const wines = await listWines();
    const controlled = wines.filter((w) => w.stock !== null).map((w) => w.id);
    let holds: Record<string, number> = {};
    let holdsError = false;
    if (controlled.length) {
      try {
        holds = Object.fromEntries(await getWineHolds(controlled));
      } catch (error) {
        console.error("[admin/wines] No se pudieron leer las botellas reservadas:", error);
        holdsError = true;
      }
    }
    return NextResponse.json({ success: true, wines, holds, ...(holdsError ? { holdsError } : {}) });
  } catch (error) {
    console.error("[admin/wines]", error);
    return NextResponse.json({ success: false, message: "No se pudieron cargar los vinos." }, { status: 500 });
  }
}

/**
 * Body: { name, winery?, region?, type?, grapes?, vintage?, description?, imageUrl?, specs?, tastingIds?, status?,
 *         priceUsd?, saleActive?, maxPerOrder?, stock? }  (priceUsd acepta "12,5"; saleActive exige precio mayor que cero;
 *         stock = botellas totales a la venta, vacío o null = sin control de existencias)
 */
export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const wine = await createWine(await request.json().catch(() => ({})));
    revalidateWines();
    return NextResponse.json({ success: true, wine }, { status: 201 });
  } catch (error) {
    if (error instanceof WineInputError) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    console.error("[admin/wines] No se pudo crear el vino:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
