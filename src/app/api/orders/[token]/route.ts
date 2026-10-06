import { NextResponse } from "next/server";
import { getOrderByToken, HOLD_MINUTES, toPublicOrder } from "@/lib/orders";
import { getBcvUsdRate, usdToBs } from "@/lib/rates";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const order = await getOrderByToken(params.token);
  if (!order) {
    return NextResponse.json({ success: false, message: "Orden no encontrada." }, { status: 404 });
  }
  const rate = order.status === "pending_payment" || order.status === "rejected" ? await getBcvUsdRate() : null;
  const expiresAt = new Date(new Date(order.createdAt).getTime() + HOLD_MINUTES * 60_000).toISOString();
  return NextResponse.json({
    success: true,
    order: toPublicOrder(order),
    holdExpiresAt: order.status === "pending_payment" ? expiresAt : null,
    rate: rate ? { ...rate, amountBs: usdToBs(order.totalUsd, rate.rate) } : null,
  });
}
