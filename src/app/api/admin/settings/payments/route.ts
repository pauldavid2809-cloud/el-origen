import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_PAYMENT_CONFIG, PaymentConfigError, getPaymentConfig, savePaymentConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Configuración de pagos vigente (y los valores por defecto, para poder restaurarlos). */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json({ success: true, config: await getPaymentConfig(), defaults: DEFAULT_PAYMENT_CONFIG });
  } catch (error) {
    console.error("[admin/settings] No se pudo leer la configuración de pagos:", error);
    return NextResponse.json({ success: false, message: "No se pudo cargar la configuración de pagos." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }
  try {
    const config = await savePaymentConfig(body);
    return NextResponse.json({ success: true, config });
  } catch (error) {
    if (error instanceof PaymentConfigError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("[admin/settings] No se pudo guardar la configuración de pagos:", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar la configuración de pagos. Intente de nuevo." }, { status: 500 });
  }
}
