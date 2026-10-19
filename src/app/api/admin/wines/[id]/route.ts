import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteWine, revalidateWines, updateWine, WineInputError } from "@/lib/wines";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const notFound = () => NextResponse.json({ success: false, message: "El vino no existe." }, { status: 404 });

/**
 * Actualiza los campos enviados (mismo formato que al crear). Para el interruptor de un clic de la venta basta
 * `{ saleActive }`: usa el precio ya guardado y, si falta, responde 400 «Defina el precio para activar la venta.»
 * Para cambiar solo el precio (edición rápida de la lista) basta `{ priceUsd }`, y para reponer existencias `{ stock }`
 * (número entero, o null/"" para dejar de controlarlas): los demás campos no se tocan.
 */
export async function PATCH(request: Request, { params }: Params) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const wine = await updateWine(params.id, await request.json().catch(() => ({})));
    if (wine) revalidateWines();
    return wine ? NextResponse.json({ success: true, wine }) : notFound();
  } catch (error) {
    if (error instanceof WineInputError) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    console.error("[admin/wines] No se pudo actualizar el vino:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    if (!(await deleteWine(params.id))) return notFound();
    revalidateWines();
    return NextResponse.json({ success: true });
  } catch (error) {
    // Un vino con pedidos no se borra: se desactiva la venta (el mensaje lo explica).
    if (error instanceof WineInputError) return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    console.error("[admin/wines] No se pudo eliminar el vino:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
