import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
