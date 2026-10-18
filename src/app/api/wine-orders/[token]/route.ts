import { NextResponse } from "next/server";
import { methodsForTasting, zelleForTasting } from "@/lib/paymentMethods";
import { getBcvRate, usdToBs } from "@/lib/rates";
import { getPaymentConfig } from "@/lib/settings";
import { getPublicWineStore } from "@/lib/wineStore";
import { getWineOrderByToken, isWineOrderPendingExpired, toPublicWineOrder } from "@/lib/wineOrders";
import { isOrderTokenShape } from "../shared";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const notFound = () => NextResponse.json({ success: false, message: "Pedido no encontrado." }, { status: 404, headers: noStore });

/**
 * Pedido de vinos visto por el comprador: estado, monto en Bs, datos de pago y si venció.
 * Sin sesión: el token del enlace es el secreto (por eso se devuelve una lista de campos, sin id, correo ni comprobante).
 */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    if (!isOrderTokenShape(params.token)) return notFound();
    const order = await getWineOrderByToken(params.token);
    if (!order) return notFound();

    const awaitingPayment = order.status === "pending_payment" || order.status === "rejected";
    const [rate, payment, store] = await Promise.all([awaitingPayment ? getBcvRate("USD") : null, getPaymentConfig(), getPublicWineStore()]);
    // Solo la primera cuenta Zelle (las demás no se muestran al cliente), como en el pedido de catas.
    const zelle = zelleForTasting(null, payment);

    return NextResponse.json(
      {
        success: true,
        order: toPublicWineOrder(order),
        /** Configuración pública de la tienda de ahora (entrega, retiro, condiciones): el pedido muestra «el envío se coordina por WhatsApp» según `store.delivery.mode`. */
        store,
        rate: rate ? { currency: "USD", rate: rate.rate, updatedAt: rate.updatedAt, amountBs: usdToBs(order.totalUsd, rate.rate) } : null,
        payment: { ...payment, zelle: zelle ? [zelle] : [] },
        /** Métodos activos en Configuración: los pedidos de vino no restringen la forma de pago. */
        methods: methodsForTasting(null, payment),
        /** Pendiente de pago con más de 72 h: el cliente aún puede reportar el pago y decide el administrador. */
        expired: isWineOrderPendingExpired(order),
      },
      { headers: noStore }
    );
  } catch (error) {
    console.error("[wine-orders]", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar el pedido." }, { status: 500, headers: noStore });
  }
}
