import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  CouponInputError,
  couponUsage,
  getCoupon,
  listCoupons,
  normalizeCouponCode,
  referrerUsage,
  upsertCoupon,
  type CouponInput,
} from "@/lib/coupons";

export const dynamic = "force-dynamic";

const NO_USE = { orders: 0, spots: 0, revenueUsd: 0 };

/** Cupones con su uso (órdenes aprobadas: órdenes, cupos y ventas USD) y el total por referente. */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const [coupons, usage, referrers] = await Promise.all([listCoupons(), couponUsage(), referrerUsage()]);
    return NextResponse.json({
      success: true,
      coupons: coupons.map((c) => ({ ...c, usage: usage[c.code] ?? NO_USE })),
      referrers,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

/** Crea un cupón nuevo (409 si el código ya existe: para cambiarlo use PATCH). */
export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  let body: CouponInput;
  try {
    body = await request.json();
    if (!body || typeof body !== "object") throw new Error();
  } catch {
    return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }
  try {
    if (await getCoupon(normalizeCouponCode(String(body.code ?? "")))) {
      return NextResponse.json({ success: false, message: "Ya existe un cupón con ese código." }, { status: 409 });
    }
    const coupon = await upsertCoupon(body);
    return NextResponse.json({ success: true, coupon: { ...coupon, usage: NO_USE } }, { status: 201 });
  } catch (error) {
    if (error instanceof CouponInputError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("[admin/coupons] No se pudo crear el cupón:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
