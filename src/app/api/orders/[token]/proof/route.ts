import { NextResponse } from "next/server";
import { clientIp, hit, isLimited, tooManyAttempts } from "@/lib/rateLimit";
import { tastingWithAvailability } from "@/lib/availability";
import { getCata } from "@/lib/catas";
import { isBsMethod, methodsForTasting, zelleForTasting } from "@/lib/paymentMethods";
import { sendProofAlert } from "@/lib/notify";
import {
  getOrderByToken,
  holdExpired,
  PAYMENT_METHODS,
  toPublicOrder,
  transitionOrder,
  uploadProof,
  type Order,
  type PaymentMethod,
} from "@/lib/orders";
import {
  parseAmount,
  PROOF_MAX_BODY_BYTES as MAX_BODY_BYTES,
  PROOF_MAX_BYTES as MAX_BYTES,
  PROOF_NOTE_MAX as NOTE_MAX,
  PROOF_REPORTS_PER_IP as REPORTS_PER_IP,
  PROOF_TYPES as TYPES,
  proofTypeFamily as family,
  referenceInUseAnywhere,
  sniffProofType,
} from "@/lib/proofs";
import { getBcvRate } from "@/lib/rates";
import { findPaymentAccount, getPaymentConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

const DUPLICATE_REFERENCE = "Esa referencia ya fue reportada en otra reserva. Si es un error, escríbanos por WhatsApp.";

const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });
const field = (form: FormData, key: string, max = 80) => String(form.get(key) ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * El cliente reporta su pago.
 *  - pago_movil / transferencia: cuenta destino de la configuración, referencia, monto en Bs, datos del pagador y comprobante.
 *  - binance_usdt: referencia (Order ID / TxID), monto en USDT y comprobante.
 *  - zelle: cuenta Zelle de la cata, número de confirmación, monto en USD y comprobante.
 *  - efectivo: sin comprobante ni referencia (la entrega se coordina por WhatsApp); nota opcional.
 *  - total $0 (cupón del 100 %): no hay nada que pagar; se pasa a revisión sin monto, referencia ni comprobante.
 * Solo se aceptan los métodos de la cata (Catas → Pagos) que estén activos en Configuración.
 * El monto se guarda en `paymentAmountBs`; su moneda depende del método (USDT en Binance, USD en Zelle).
 */
export async function POST(request: Request, { params }: { params: { token: string } }) {
  // Se rechaza antes de leer el cuerpo: formData() lo carga entero en memoria.
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return bad("El comprobante supera 8 MB.", 413);
  const ipKey = `proof:ip:${clientIp(request)}`;
  if (isLimited(ipKey, REPORTS_PER_IP)) return tooManyAttempts();

  try {
    const order = await getOrderByToken(params.token);
    if (!order) return bad("Orden no encontrada.", 404);
    if (order.status !== "pending_payment" && order.status !== "rejected") {
      return bad("Esta orden ya tiene un pago reportado.", 409);
    }

    // Si el apartado venció (o el pago fue rechazado) los cupos se liberaron: se comprueba que sigan disponibles
    // y que la venta siga abierta (el admin puede marcar la cata como agotada a mano).
    if (order.status === "rejected" || holdExpired(order)) {
      const tasting = await tastingWithAvailability(order.tastingId);
      if (!tasting || tasting.status === "sold_out" || tasting.availableSpots < order.spotsCount) {
        return bad("El tiempo de apartado venció y ya no quedan cupos suficientes en esta cata. Escríbanos por WhatsApp.", 409);
      }
    }

    const form = await request.formData();
    const free = order.totalUsd <= 0;
    const method = String(form.get("paymentMethod") ?? "") as PaymentMethod;
    if (!free && !PAYMENT_METHODS.includes(method)) return bad("Seleccione la forma de pago.");

    const [config, cata] = await Promise.all([getPaymentConfig(), getCata(order.tastingId).catch(() => null)]);
    if (!free && !methodsForTasting(cata, config).includes(method)) return bad("Esa forma de pago no está disponible para esta cata.");
    const note = field(form, "note", NOTE_MAX) || null;
    const payerBank = field(form, "payerBank") || null;
    const payerDocId = String(form.get("payerDocId") ?? "").replace(/[^0-9VEJvej-]/g, "").toUpperCase().slice(0, 20) || null;
    const payerPhone = field(form, "payerPhone", 30) || null;
    const amount = parseAmount(String(form.get("paymentAmount") ?? form.get("paymentAmountBs") ?? ""));

    let patch: Partial<Order>;
    let reference: string | null = null;

    if (free) {
      patch = { paymentBank: null, paymentReference: null, paymentAmountBs: null, bcvRate: null, proofPath: null };
    } else if (method === "efectivo") {
      if (!config.efectivo.enabled) return bad("El pago en efectivo no está disponible.");
      patch = {
        paymentBank: "efectivo",
        paymentReference: null,
        paymentAmountBs: null,
        bcvRate: null,
        proofPath: null,
      };
    } else {
      let destination: string;

      if (method === "binance_usdt") {
        if (!config.binance.enabled) return bad("El pago por Binance no está disponible.");
        destination = "binance";
        reference = String(form.get("paymentReference") ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 100);
        if (reference.length < 4) return bad("Indique el Order ID o TxID del pago en Binance.");
        if (!(amount > 0)) return bad("Indique el monto pagado en USDT.");
      } else if (method === "zelle") {
        const account = zelleForTasting(cata, config);
        if (!account) return bad("El pago por Zelle no está disponible.");
        destination = account.id;
        reference = String(form.get("paymentReference") ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 60);
        if (reference.length < 4) return bad("Indique el número de confirmación del pago por Zelle.");
        if (!(amount > 0)) return bad("Indique el monto pagado en dólares.");
      } else {
        destination = String(form.get("paymentBank") ?? "");
        const account = findPaymentAccount(config, destination);
        if (!account || account.kind !== method) return bad("Seleccione la cuenta a la que pagó.");
        reference = String(form.get("paymentReference") ?? "").replace(/\D/g, "").slice(0, 30);
        if (reference.length < 4) return bad("Indique el número de referencia del pago.");
        if (!(amount > 0)) return bad("Indique el monto pagado en bolívares.");
        if (!payerBank || !payerDocId) return bad("Indique el banco y la cédula del titular que pagó.");
      }

      const file = form.get("file");
      if (!file || typeof file === "string") return bad("Adjunte la captura o PDF del comprobante.");
      if (file.size > MAX_BYTES) return bad("El comprobante supera 8 MB.");
      const data = Buffer.from(await file.arrayBuffer());
      const actual = sniffProofType(data);
      // Algunos navegadores no declaran el tipo de las fotos HEIC: basta con que el contenido sea válido.
      const declared = file.type.toLowerCase().replace("image/jpg", "image/jpeg");
      if (!actual || (declared && declared !== "application/octet-stream" && family(declared) !== family(actual))) {
        return bad("Formato no permitido: use JPG, PNG, WEBP, HEIC o PDF.");
      }
      if (await referenceInUseAnywhere(reference, order.id)) return bad(DUPLICATE_REFERENCE, 409);

      const isBs = isBsMethod(method);
      const [proofPath, rate] = await Promise.all([
        uploadProof(order.id, data, actual, TYPES[actual]),
        isBs ? getBcvRate(order.rateCurrency ?? "USD") : null,
      ]);
      patch = {
        paymentBank: destination,
        paymentReference: reference,
        paymentAmountBs: Math.round(amount * 100) / 100,
        bcvRate: rate?.rate ?? null,
        proofPath,
      };
    }

    let updated: Order | null;
    try {
      // Solo si la orden sigue en el estado leído: un doble envío no reporta dos veces ni avisa dos veces.
      updated = await transitionOrder(order.id, [order.status], {
        ...patch,
        status: "in_review",
        paymentMethod: PAYMENT_METHODS.includes(method) ? method : null,
        payerBank,
        payerDocId,
        payerPhone,
        paymentNote: note,
        proofSubmittedAt: new Date().toISOString(),
        rejectionReason: null,
      });
    } catch (error) {
      // El índice único de referencias puede saltar si otra orden reportó la misma referencia a la vez.
      if (reference && (await referenceInUseAnywhere(reference, order.id))) return bad(DUPLICATE_REFERENCE, 409);
      throw error;
    }
    if (!updated) return bad("Esta orden ya tiene un pago reportado.", 409);

    hit(ipKey, REPORTS_PER_IP);
    await sendProofAlert(updated);
    return NextResponse.json({ success: true, order: toPublicOrder(updated) });
  } catch (error) {
    console.error("[proof]", error);
    return bad("No se pudo enviar el reporte de pago. Intente de nuevo o escríbanos por WhatsApp.", 500);
  }
}
