import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createWine, listWines, WineInputError, WINES_TAG } from "@/lib/wines";

export const dynamic = "force-dynamic";

/* Catálogo de vinos (panel → Vinos). La foto se sube antes con /api/admin/upload (folder = vinos). */

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json({ success: true, wines: await listWines() });
  } catch (error) {
    console.error("[admin/wines]", error);
    return NextResponse.json({ success: false, message: "No se pudieron cargar los vinos." }, { status: 500 });
  }
}

/** Body: { name, winery?, region?, type?, grapes?, vintage?, description?, imageUrl?, specs?, tastingIds?, status? } */
export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const wine = await createWine(await request.json().catch(() => ({})));
    revalidateTag(WINES_TAG);
    return NextResponse.json({ success: true, wine }, { status: 201 });
  } catch (error) {
    if (error instanceof WineInputError) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    console.error("[admin/wines] No se pudo crear el vino:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
