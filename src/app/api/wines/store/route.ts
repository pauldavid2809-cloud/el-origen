import { NextResponse } from "next/server";
import { getPublicWineStore } from "@/lib/wineStore";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Configuración pública de la tienda de vinos: si está abierta y su aviso de cierre, retiro, entrega (modo, costos y
 * zonas), tope de botellas por defecto y condiciones de compra ya resueltas (ES/EN). Nunca la configuración cruda.
 * `getPublicWineStore` no lanza: ante un error de lectura devuelve los valores por defecto.
 */
export async function GET() {
  return NextResponse.json({ success: true, store: await getPublicWineStore() }, { headers: noStore });
}
