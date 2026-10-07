import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { CouponInputError, deleteCoupon, getCoupon, upsertCoupon, type CouponInput } from "@/lib/coupons";
import { listCouponOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

type Params = { params: { code: string } };

const notFound = () => NextResponse.json({ success: false, message: "El cupón no existe." }, { status: 404 });

/** Edita un cupón (descuento, descripción, referente, solo miembros, máximo de usos, activo). El código no cambia. */
export async function PATCH(request: Request, { params }: Params) {
  const denied = requireAdmin();
  if (denied) return denied;
  let patch: Partial<CouponInput>;
  try {
    patch = await request.json();
    if (!patch || typeof patch !== "object") throw new Error();
  } catch {
    return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const current = await getCoupon(decodeURIComponent(params.code));
    if (!current) return notFound();
    const pick = <K extends keyof CouponInput>(k: K): CouponInput[K] => (k in patch ? (patch[k] as CouponInput[K]) : current[k]);
    const coupon = await upsertCoupon({
      code: current.code,
      discountPercent: pick("discountPercent"),
      description: pick("description"),
      referrer: pick("referrer"),
      membersOnly: pick("membersOnly"),
      maxUses: pick("maxUses"),
      active: pick("active"),
    });
    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    if (error instanceof CouponInputError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("[admin/coupons] No se pudo actualizar el cupón:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

/** Elimina un cupón sin órdenes. Si ya se usó, se desactiva en su lugar para no perder el reporte por referente. */
export async function DELETE(_request: Request, { params }: Params) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const current = await getCoupon(decodeURIComponent(params.code));
    if (!current) return notFound();
    const used = (await listCouponOrders(current.code)).length;
    if (used > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `El cupón ${current.code} ya se usó en ${used} ${used === 1 ? "orden" : "órdenes"}: desactívelo en lugar de eliminarlo para conservar el reporte.`,
        },
        { status: 409 }
      );
    }
    return (await deleteCoupon(current.code)) ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    console.error("[admin/coupons] No se pudo eliminar el cupón:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
