import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { CataInputError, createCata, listCatas, type CataInput } from "@/lib/catas";
import { heldSpotsByTasting } from "@/lib/orders";
import { orderStatsByTasting, statsFor } from "./shared";

export const dynamic = "force-dynamic";

/** Todas las catas (borradores y archivadas incluidas) con cupos ocupados y ventas. */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const [tastings, held, stats] = await Promise.all([listCatas({ includeDrafts: true }), heldSpotsByTasting(), orderStatsByTasting()]);
    const rows = tastings.map((t) => {
      const heldSpots = held[t.id] ?? 0;
      return {
        ...t,
        availableSpots: Math.max(0, t.totalSpots - heldSpots),
        heldSpots,
        stats: statsFor(stats, t.id),
      };
    });
    return NextResponse.json({ success: true, tastings: rows });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const tasting = await createCata(body as CataInput);
    return NextResponse.json({ success: true, tasting }, { status: 201 });
  } catch (error) {
    if (error instanceof CataInputError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("[admin/catas] No se pudo crear la cata:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
