import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { CataInputError, deleteCata, getCata, updateCata, type CataInput } from "@/lib/catas";
import { heldSpotsByTasting, syncOrdersWithTasting, tastingSnapshot } from "@/lib/orders";
import { countTastingOrders } from "../shared";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const notFound = () => NextResponse.json({ success: false, message: "La cata no existe." }, { status: 404 });

export async function GET(_request: Request, { params }: Params) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const tasting = await getCata(params.id);
    return tasting ? NextResponse.json({ success: true, tasting }) : notFound();
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = requireAdmin();
  if (denied) return denied;
  let patch: Partial<CataInput>;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    patch = body as Partial<CataInput>;
  } catch {
    return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const current = await getCata(params.id);
    if (!current) return notFound();

    // No se pueden dejar menos cupos que los ya ocupados (aprobados, en revisión o apartados).
    if (patch.totalSpots !== undefined) {
      const total = Number(patch.totalSpots);
      const held = (await heldSpotsByTasting([current.id]))[current.id] ?? 0;
      if (Number.isFinite(total) && total < held) {
        return NextResponse.json(
          { success: false, message: `Esta cata ya tiene ${held} cupos ocupados: los cupos totales no pueden ser menos.` },
          { status: 400 }
        );
      }
    }

    const tasting = await updateCata(current.id, patch);
    if (!tasting) return notFound();
    // Las órdenes guardan una copia de nombre, fecha, hora y lugar: si cambiaron, se actualizan para que
    // la entrada, el reenvío, la puerta y el export no muestren datos viejos.
    const ordersUpdated = await syncOrdersWithTasting(tasting.id, tastingSnapshot(tasting));
    return NextResponse.json({ success: true, tasting, ordersUpdated });
  } catch (error) {
    if (error instanceof CataInputError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("[admin/catas] No se pudo actualizar la cata:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

/** Solo se eliminan catas sin órdenes; las demás se archivan para conservar el historial. */
export async function DELETE(_request: Request, { params }: Params) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const current = await getCata(params.id);
    if (!current) return notFound();
    const orders = await countTastingOrders(current.id);
    if (orders > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Esta cata tiene ${orders} ${orders === 1 ? "orden" : "órdenes"} y no se puede eliminar. Archívela para ocultarla del sitio.`,
        },
        { status: 409 }
      );
    }
    const deleted = await deleteCata(current.id);
    return deleted ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    console.error("[admin/catas] No se pudo eliminar la cata:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
