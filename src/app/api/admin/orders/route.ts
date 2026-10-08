import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isPersistent, listOrders, proofUrl } from "@/lib/orders";
import { getPaymentConfig } from "@/lib/settings";
import { approvedTicketsByOrder, couponReferrers, paymentDestinationLabel } from "./shared";

export const dynamic = "force-dynamic";

/** Órdenes para el panel, con sus entradas, el referente del cupón, la cuenta destino y un enlace temporal al comprobante. */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const orders = await listOrders();
    const [byOrder, referrers, config] = await Promise.all([approvedTicketsByOrder(orders), couponReferrers(), getPaymentConfig()]);

    const rows = await Promise.all(
      orders.map(async (o) => ({
        ...o,
        proofUrl: o.proofPath ? await proofUrl(o.proofPath) : null,
        tickets: byOrder.get(o.id) ?? [],
        couponReferrer: o.couponCode ? referrers.get(o.couponCode.toUpperCase()) ?? null : null,
        paymentDestination: paymentDestinationLabel(config, o.paymentBank),
      }))
    );
    return NextResponse.json({ success: true, persistent: isPersistent(), orders: rows });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
