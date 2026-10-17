import { NextResponse } from "next/server";
import { clientIp, consume, hit, isLimited, tooManyAttempts, type RateLimit } from "@/lib/rateLimit";
import { sendWineProofAlert } from "@/lib/notify";
import { uploadProof } from "@/lib/orders";
import { isBsMethod, methodsForTasting, zelleForTasting } from "@/lib/paymentMethods";
import {
  parseAmount,
  PROOF_MAX_BODY_BYTES,
  PROOF_MAX_BYTES,
  PROOF_NOTE_MAX,
  PROOF_REPORTS_PER_IP,
  PROOF_TYPES,
  proofTypeFamily,
  referenceInUseAnywhere,
  sniffProofType,
} from "@/lib/proofs";
import { getBcvRate } from "@/lib/rates";
import { findPaymentAccount, getPaymentConfig } from "@/lib/settings";
import { getWineOrderByToken, toPublicWineOrder, transitionWineOrder, type WineOrder } from "@/lib/wineOrders";
import { PAYMENT_METHOD_IDS, type PaymentMethodId } from "@/types";
import { isOrderTokenShape, readFormLimited } from "../../shared";

export const dynamic = "force-dynamic";

/** Envíos (buenos o malos) por IP: tope holgado contra quien manda cuerpos de 8 MB sin parar; el estricto es PROOF_REPORTS_PER_IP. */
const ATTEMPTS_PER_IP: RateLimit = { max: 60, windowMs: 15 * 60_000 };
/** Ningún pago real se acerca a esta cifra; evita montos absurdos (o infinitos) en la base de datos. */
const MAX_AMOUNT = 1_000_000_000;

const DUPLICATE_REFERENCE = "Esa referencia ya fue reportada en otra reserva o pedido. Si es un error, escríbenos por WhatsApp.";

const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });
const field = (form: FormData, key: string, max = 80) => String(form.get(key) ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const validAmount = (n: number) => Number.isFinite(n) && n > 0 && n <= MAX_AMOUNT;

/**
 * El cliente reporta el pago de su pedido de vinos (mismos campos y reglas que el de las reservas de catas).
 *  - pago_movil / transferencia: cuenta destino de la configuración, referencia, monto en Bs, datos del pagador y comprobante.
 *  - binance_usdt: referencia (Order ID / TxID), monto en USDT y comprobante.
 *  - zelle: cuenta Zelle, número de confirmación, monto en USD y comprobante.
 *  - efectivo: sin comprobante ni referencia (la entrega se coordina por WhatsApp); nota opcional.
 * El monto se guarda en `paymentAmountBs`; su moneda depende del método (USDT en Binance, USD en Zelle).
 * Si el pedido venció (72 h) o fue rechazado, el reporte sigue permitido: el administrador decide al revisarlo.
 */
export async function POST(request: Request, { params }: { params: { token: string } }) {
  // Se rechaza antes de leer el cuerpo: el multipart se carga entero en memoria.
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > PROOF_MAX_BODY_BYTES) return bad("El comprobante supera 8 MB.", 413);
  const ip = clientIp(request);
  const ipKey = `wine-proof:ip:${ip}`;
  if (isLimited(ipKey, PROOF_REPORTS_PER_IP) || consume(`wine-proof-try:ip:${ip}`, ATTEMPTS_PER_IP)) return tooManyAttempts();

  try {
    if (!isOrderTokenShape(params.token)) return bad("Pedido no encontrado.", 404);
    const order = await getWineOrderByToken(params.token);
    if (!order) return bad("Pedido no encontrado.", 404);
    if (order.status === "cancelled") return bad("Este pedido fue anulado. Escríbenos por WhatsApp o haz un pedido nuevo.", 409);
    if (order.status !== "pending_payment" && order.status !== "rejected") {
      return bad("Este pedido ya tiene un pago reportado.", 409);
    }
    // Un pedido de vinos siempre tiene monto (el checkout lo garantiza): sin él no hay nada que reportar.
    if (!(order.totalUsd > 0)) return bad("Este pedido no tiene un monto por pagar. Escríbenos por WhatsApp.", 409);

    // El cuerpo se lee con tope de bytes aunque `content-length` falte o mienta.
    const form = await readFormLimited(request, PROOF_MAX_BODY_BYTES);
    if (form === null) return bad("El comprobante supera 8 MB.", 413);
    if (!form) return bad("Solicitud inválida.");

    const method = String(form.get("paymentMethod") ?? "") as PaymentMethodId;
    if (!PAYMENT_METHOD_IDS.includes(method)) return bad("Selecciona la forma de pago.");

    const config = await getPaymentConfig();
    // Los pedidos de vino no restringen el método: valen todos los activos en Configuración.
    if (!methodsForTasting(null, config).includes(method)) return bad("Esa forma de pago no está disponible.");
    const note = field(form, "note", PROOF_NOTE_MAX) || null;
    const payerBank = field(form, "payerBank") || null;
    const payerDocId = String(form.get("payerDocId") ?? "").replace(/[^0-9VEJvej-]/g, "").toUpperCase().slice(0, 20) || null;
    const payerPhone = field(form, "payerPhone", 30) || null;
    const amount = parseAmount(field(form, "paymentAmount", 40) || field(form, "paymentAmountBs", 40));

    let patch: Partial<WineOrder>;
    let reference: string | null = null;

    if (method === "efectivo") {
      if (!config.efectivo.enabled) return bad("El pago en efectivo no está disponible.");
      patch = { paymentBank: "efectivo", paymentReference: null, paymentAmountBs: null, bcvRate: null, proofPath: null };
    } else {
      let destination: string;

      if (method === "binance_usdt") {
        if (!config.binance.enabled) return bad("El pago por Binance no está disponible.");
        destination = "binance";
        reference = String(form.get("paymentReference") ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 100);
        if (reference.length < 4) return bad("Indica el Order ID o TxID del pago en Binance.");
        if (!validAmount(amount)) return bad("Indica el monto pagado en USDT.");
      } else if (method === "zelle") {
        const account = zelleForTasting(null, config);
        if (!account) return bad("El pago por Zelle no está disponible.");
        destination = account.id;
        reference = String(form.get("paymentReference") ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 60);
        if (reference.length < 4) return bad("Indica el número de confirmación del pago por Zelle.");
        if (!validAmount(amount)) return bad("Indica el monto pagado en dólares.");
      } else {
        destination = field(form, "paymentBank");
        const account = findPaymentAccount(config, destination);
        if (!account || account.kind !== method) return bad("Selecciona la cuenta a la que pagaste.");
        reference = String(form.get("paymentReference") ?? "").replace(/\D/g, "").slice(0, 30);
        if (reference.length < 4) return bad("Indica el número de referencia del pago.");
        if (!validAmount(amount)) return bad("Indica el monto pagado en bolívares.");
        if (!payerBank || !payerDocId) return bad("Indica el banco y la cédula del titular que pagó.");
      }

      const file = form.get("file");
      if (!file || typeof file === "string") return bad("Adjunta la captura o PDF del comprobante.");
      if (file.size > PROOF_MAX_BYTES) return bad("El comprobante supera 8 MB.");
      const data = Buffer.from(await file.arrayBuffer());
      const actual = sniffProofType(data);
      // Algunos navegadores no declaran el tipo de las fotos HEIC: basta con que el contenido sea válido.
      // El tipo real sale de los primeros bytes: un archivo disfrazado (p. ej. un .html con extensión .jpg) no pasa.
      const declared = file.type.toLowerCase().replace("image/jpg", "image/jpeg");
      if (!actual || (declared && declared !== "application/octet-stream" && proofTypeFamily(declared) !== proofTypeFamily(actual))) {
        return bad("Formato no permitido: usa JPG, PNG, WEBP, HEIC o PDF.");
      }
      // La misma referencia bancaria no puede respaldar dos pagos, ni entre reservas de catas y pedidos de vinos.
      if (await referenceInUseAnywhere(reference, order.id)) return bad(DUPLICATE_REFERENCE, 409);

      const [proofPath, rate] = await Promise.all([
        uploadProof(order.id, data, actual, PROOF_TYPES[actual]),
        isBsMethod(method) ? getBcvRate("USD") : null,
      ]);
      patch = {
        paymentBank: destination,
        paymentReference: reference,
        paymentAmountBs: Math.round(amount * 100) / 100,
        bcvRate: rate?.rate ?? null,
        proofPath,
      };
    }

    let updated: WineOrder | null;
    try {
      // Solo si el pedido sigue en el estado leído: un doble envío no reporta dos veces ni avisa dos veces.
      updated = await transitionWineOrder(order.id, [order.status], {
        ...patch,
        status: "in_review",
        paymentMethod: method,
        payerBank,
        payerDocId,
        payerPhone,
        paymentNote: note,
        proofSubmittedAt: new Date().toISOString(),
        rejectionReason: null,
      });
    } catch (error) {
      // El índice único de referencias puede saltar si otro pedido reportó la misma referencia a la vez.
      if (reference && (await referenceInUseAnywhere(reference, order.id))) return bad(DUPLICATE_REFERENCE, 409);
      throw error;
    }
    if (!updated) return bad("Este pedido ya tiene un pago reportado.", 409);

    hit(ipKey, PROOF_REPORTS_PER_IP);
    // El aviso al administrador no debe convertir un reporte guardado en un error para el cliente.
    try {
      await sendWineProofAlert(updated);
    } catch (error) {
      console.error("[wine-proof] No se pudo avisar al administrador:", error);
    }
    return NextResponse.json({ success: true, order: toPublicWineOrder(updated) });
  } catch (error) {
    console.error("[wine-proof]", error);
    return bad("No se pudo enviar el reporte de pago. Intenta de nuevo o escríbenos por WhatsApp.", 500);
  }
}
