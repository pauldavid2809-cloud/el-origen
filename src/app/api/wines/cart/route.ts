import { NextResponse } from "next/server";
import { getSaleWinesByIds } from "@/lib/wines";
import { getPublicWineStore } from "@/lib/wineStore";
import { UUID_RE } from "../../wine-orders/shared";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
/** Mismo tope que las líneas de un pedido (WINE_ORDER_MAX_LINES). */
const MAX_IDS = 20;

/**
 * Datos actuales de los vinos del carrito: `?ids=a,b,c` (hasta 20). Público y sin sesión: solo devuelve vinos
 * publicados (los mismos que ya se ven en el catálogo), con su precio de ahora, si se pueden comprar y cuántas
 * botellas quedan (`available`: null = ilimitado; `soldOut`; es lo que se muestra, calculado con la caché corta de reservas
 * de ~10 s: el checkout vuelve a comprobar con datos frescos). Además la configuración pública de la tienda (`store`):
 * si está abierta, retiro y entrega con sus costos, tope por defecto y condiciones de compra.
 * Los ids que no existen, no están publicados o no tienen forma de UUID simplemente no aparecen.
 */
export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("ids") ?? "";
    // Se acota el texto antes de partirlo: 20 UUID con comas caben en 760 caracteres.
    const ids = Array.from(
      new Set(
        raw
          .slice(0, 1000)
          .split(",")
          .map((id) => id.trim().toLowerCase())
          .filter((id) => UUID_RE.test(id))
      )
    ).slice(0, MAX_IDS);
    const [wines, store] = await Promise.all([ids.length ? getSaleWinesByIds(ids) : [], getPublicWineStore()]);
    return NextResponse.json({ success: true, wines, store }, { headers: noStore });
  } catch (error) {
    console.error("[wines/cart]", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar el carrito." }, { status: 500, headers: noStore });
  }
}
