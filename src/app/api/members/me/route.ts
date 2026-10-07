import { NextResponse } from "next/server";
import { clearMemberSession, currentMember, currentMemberId } from "@/lib/members";
import { holdExpired, listOrdersByMember } from "@/lib/orders";
import { activeWelcomeCoupon } from "../shared";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Miembro con sesión y sus reservas.
 * Sin sesión responde 200 con `member: null` (lo consultan el menú de cuenta y el checkout en cada visita).
 * `?orders=0` omite las reservas (consulta liviana para el menú).
 *
 * Solo se listan las reservas hechas con la sesión iniciada: como el correo no se verifica al registrarse,
 * buscar por correo expondría los enlaces de órdenes ajenas.
 */
export async function GET(request: Request) {
  const member = await currentMember();
  if (!member) {
    // Cookie firmada de una cuenta que ya no existe: se limpia.
    if (currentMemberId()) clearMemberSession();
    return NextResponse.json({ success: true, member: null, orders: [], welcomeCoupon: null }, { headers: noStore });
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

  const [orders, welcomeCoupon] = await Promise.all([listOrdersByMember(member.id), activeWelcomeCoupon()]);
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
        tastingTime: o.tastingTime,
        spotsCount: o.spotsCount,
        totalUsd: o.totalUsd,
        createdAt: o.createdAt,
        holdExpired: holdExpired(o),
      })),
      welcomeCoupon,
    },
    { headers: noStore }
  );
}
