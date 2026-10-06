import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
      const coupon = await db.validateCoupon(code);
      if (!coupon) {
        return NextResponse.json({ success: false, message: "Cupón inválido o expirado." });
      }
      return NextResponse.json({ success: true, coupon });
    }

    const denied = requireAdmin();
    if (denied) return denied;
    const coupons = await db.getCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const newCoupon = await db.createCoupon(body);
    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
