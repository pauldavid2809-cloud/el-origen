import { NextResponse } from "next/server";
import { getPaymentConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Datos de pago vigentes (públicos: se muestran en el proceso de compra). */
export async function GET() {
  try {
    return NextResponse.json({ success: true, config: await getPaymentConfig() });
  } catch (error) {
    console.error("[payment-config]", error);
    return NextResponse.json({ success: false, message: "No se pudieron cargar los datos de pago." }, { status: 500 });
  }
}
