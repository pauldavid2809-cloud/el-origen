import { NextResponse } from "next/server";
import { normalizeCouponCode, validateCouponForEmail } from "@/lib/coupons";

export const dynamic = "force-dynamic";

/**
 * Valida un cupón para el checkout: `GET /api/coupons?code=X&email=Y`.
 * Nunca lista cupones (la administración está en `/api/admin/coupons`).
 * `reason` (not_found | inactive | members_only | exhausted) permite traducir el mensaje en la interfaz.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = normalizeCouponCode(searchParams.get("code") ?? "").slice(0, 40);
  const email = (searchParams.get("email") ?? "").trim().slice(0, 200);
  if (!code) {
    return NextResponse.json({ success: false, message: "Ingrese un código de cupón." }, { status: 400 });
  }
  try {
    const result = await validateCouponForEmail(code, email);
    if (!result.ok) {
      return NextResponse.json({ success: false, reason: result.code, message: result.reason });
    }
    return NextResponse.json({
      success: true,
      coupon: { code: result.coupon.code, discountPercent: result.coupon.discountPercent },
    });
  } catch (error) {
    console.error("[coupons] No se pudo validar el cupón:", error);
    return NextResponse.json({ success: false, message: "No se pudo validar el cupón. Intente de nuevo." }, { status: 500 });
  }
}
