import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isPersistent, proofUrl } from "@/lib/orders";
import { listWineOrders } from "@/lib/wineOrders";
import { getPaymentConfig } from "@/lib/settings";
import { paymentDestinationLabel } from "../orders/shared";

export const dynamic = "force-dynamic";

/**
 * Pedidos de vinos para el panel, con un enlace temporal al comprobante y la cuenta destino legible
 * (resuelta con la configuración de pagos). Se filtran por pestaña en el navegador, como las reservas.
 */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const [orders, config] = await Promise.all([listWineOrders(), getPaymentConfig()]);
    const rows = await Promise.all(
      orders.map(async (o) => ({
        ...o,
        proofUrl: o.proofPath ? await proofUrl(o.proofPath) : null,
        paymentDestination: paymentDestinationLabel(config, o.paymentBank),
      }))
    );
    return NextResponse.json({ success: true, persistent: isPersistent(), orders: rows });
  } catch (error) {
    console.error("[admin/wine-orders] No se pudieron leer los pedidos:", error);
    return NextResponse.json(
      { success: false, message: `No se pudieron cargar los pedidos de vinos: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
