import { NextResponse } from "next/server";
import { getOrderByToken, referenceInUse, toPublicOrder, updateOrder, uploadProof } from "@/lib/orders";
import { getBcvUsdRate } from "@/lib/rates";
import { sendProofAlert } from "@/lib/notify";
import { PAYMENT_ACCOUNTS } from "@/lib/contact";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};
const MAX_BYTES = 8 * 1024 * 1024;

/** El cliente reporta su pago: referencia, datos del pagador y captura del comprobante. */
export async function POST(request: Request, { params }: { params: { token: string } }) {
  try {
    const order = await getOrderByToken(params.token);
    if (!order) return NextResponse.json({ success: false, message: "Orden no encontrada." }, { status: 404 });
    if (order.status !== "pending_payment" && order.status !== "rejected") {
      return NextResponse.json(
        { success: false, message: "Esta orden ya tiene un pago reportado." },
        { status: 409 }
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    const method = String(form.get("paymentMethod") ?? "");
    const destination = String(form.get("paymentBank") ?? "");
    const reference = String(form.get("paymentReference") ?? "").replace(/\D/g, "");
    const amountBs = Number(String(form.get("paymentAmountBs") ?? "").replace(/\./g, "").replace(",", "."));
    const payerBank = String(form.get("payerBank") ?? "").trim().slice(0, 80);
    const payerDocId = String(form.get("payerDocId") ?? "").replace(/[^0-9VEJvej-]/g, "").toUpperCase().slice(0, 20);
    const payerPhone = String(form.get("payerPhone") ?? "").trim().slice(0, 30);

    if (!["pago_movil", "transferencia"].includes(method)) {
      return NextResponse.json({ success: false, message: "Seleccione la forma de pago." }, { status: 400 });
    }
    if (!PAYMENT_ACCOUNTS.some((a) => a.bank === destination)) {
      return NextResponse.json({ success: false, message: "Seleccione la cuenta a la que pagó." }, { status: 400 });
    }
    if (reference.length < 4) {
      return NextResponse.json({ success: false, message: "Indique el número de referencia del pago." }, { status: 400 });
    }
    if (!(amountBs > 0)) {
      return NextResponse.json({ success: false, message: "Indique el monto pagado en bolívares." }, { status: 400 });
    }
    if (!payerBank || !payerDocId) {
      return NextResponse.json({ success: false, message: "Indique el banco y la cédula del titular que pagó." }, { status: 400 });
    }
    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, message: "Adjunte la captura o PDF del comprobante." }, { status: 400 });
    }
    const ext = TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ success: false, message: "Formato no permitido: use JPG, PNG, WEBP, HEIC o PDF." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, message: "El comprobante supera 8 MB." }, { status: 400 });
    }
    if (await referenceInUse(reference, order.id)) {
      return NextResponse.json(
        { success: false, message: "Esa referencia ya fue reportada en otra reserva. Si es un error, escríbanos por WhatsApp." },
        { status: 409 }
      );
    }

    const proofPath = await uploadProof(order.id, Buffer.from(await file.arrayBuffer()), file.type, ext);
    const rate = await getBcvUsdRate();

    const updated = await updateOrder(order.id, {
      status: "in_review",
      paymentMethod: method,
      paymentBank: destination,
      paymentReference: reference,
      paymentAmountBs: Math.round(amountBs * 100) / 100,
      payerBank,
      payerDocId,
      payerPhone: payerPhone || null,
      bcvRate: rate?.rate ?? null,
      proofPath,
      proofSubmittedAt: new Date().toISOString(),
      rejectionReason: null,
    });

    await sendProofAlert(updated);
    return NextResponse.json({ success: true, order: toPublicOrder(updated) });
  } catch (error) {
    console.error("[proof]", error);
    return NextResponse.json({ success: false, message: (error as Error).message || "Error al enviar el comprobante." }, { status: 500 });
  }
}
