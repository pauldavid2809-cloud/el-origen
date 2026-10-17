import { NextResponse } from "next/server";
import { clearMemberSession, currentMember, currentMemberId } from "@/lib/members";
import { getCata } from "@/lib/catas";
import { holdExpired, listOrdersByMember } from "@/lib/orders";
import { listWineOrdersByMember } from "@/lib/wineOrders";
import { toWineOrderSummary } from "../../wine-orders/shared";
import { activeWelcomeCoupon } from "../shared";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Miembro con sesión, sus reservas y sus pedidos de vinos (`wineOrders`: código, token, estado, total, botellas y fecha).
 * Sin sesión responde 200 con `member: null` (lo consultan el menú de cuenta y el checkout en cada visita).
 * `?orders=0` omite las reservas y los pedidos de vinos (consulta liviana para el menú).
 *
 * Solo se listan las reservas y pedidos hechos con la sesión iniciada: como el correo no se verifica al registrarse,
 * buscar por correo expondría los enlaces de órdenes ajenas.
 */
export async function GET(request: Request) {
  const member = await currentMember();
  if (!member) {
    // Cookie firmada de una cuenta que ya no existe: se limpia.
    if (currentMemberId()) clearMemberSession();
    return NextResponse.json({ success: true, member: null, orders: [], wineOrders: [], welcomeCoupon: null }, { headers: noStore });
  }

  const publicMember = {
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    marketingOptIn: member.marketingOptIn,
    createdAt: member.createdAt,
  };

  if (new URL(request.url).searchParams.get("orders") === "0") {
    return NextResponse.json({ success: true, member: publicMember }, { headers: noStore });
  }

  const [orders, welcomeCoupon, wineOrders] = await Promise.all([
    listOrdersByMember(member.id),
    activeWelcomeCoupon(),
    // Los pedidos de vino nunca deben tumbar la cuenta (p. ej. si aún falta ejecutar v6.sql): ante un error, lista vacía.
    listWineOrdersByMember(member.id).catch((error) => {
      console.error("[members/me] No se pudieron leer los pedidos de vinos:", error);
      return [];
    }),
  ]);
  // Fecha ISO de cada cata para mostrarla en el idioma del visitante (`tastingDate` se guarda en español).
  const tastingIds = Array.from(new Set(orders.map((o) => o.tastingId)));
  const isoDates = new Map(
    await Promise.all(tastingIds.map(async (id) => [id, (await getCata(id).catch(() => null))?.date ?? null] as const))
  );
  return NextResponse.json(
    {
      success: true,
      member: publicMember,
      orders: orders.map((o) => ({
        code: o.code,
        token: o.token,
        status: o.status,
        tastingTitle: o.tastingTitle,
        tastingDate: o.tastingDate,
        tastingDateIso: isoDates.get(o.tastingId) ?? null,
        tastingTime: o.tastingTime,
        spotsCount: o.spotsCount,
        totalUsd: o.totalUsd,
        createdAt: o.createdAt,
        holdExpired: holdExpired(o),
      })),
      wineOrders: wineOrders.map(toWineOrderSummary),
      welcomeCoupon,
    },
    { headers: noStore }
  );
}
