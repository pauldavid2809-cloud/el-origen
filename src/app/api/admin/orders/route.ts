import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isPersistent, listOrders, proofUrl } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const orders = await listOrders();
    // Enlaces firmados solo para las órdenes con comprobante
    const withProof = await Promise.all(
      orders.map(async (o) => ({ ...o, proofUrl: o.proofPath ? await proofUrl(o.proofPath) : null }))
    );
    return NextResponse.json({ success: true, persistent: isPersistent(), orders: withProof });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
