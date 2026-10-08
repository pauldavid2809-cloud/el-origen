import { NextResponse } from "next/server";
import { clientIp, hit, isLimited, tooManyAttempts, type RateLimit } from "@/lib/rateLimit";
import { tastingWithAvailability } from "@/lib/availability";
import { sendProofAlert } from "@/lib/notify";
import {
  getOrderByToken,
  holdExpired,
  PAYMENT_METHODS,
  referenceInUse,
  toPublicOrder,
  transitionOrder,
  uploadProof,
  type Order,
  type PaymentMethod,
} from "@/lib/orders";
import { getBcvRate } from "@/lib/rates";
import { findPaymentAccount, getPaymentConfig } from "@/lib/settings";

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
/** Margen para los demás campos y los separadores del multipart. */
const MAX_BODY_BYTES = MAX_BYTES + 256 * 1024;
const NOTE_MAX = 500;
/** Reportes de pago por IP (cada uno avisa al admin por correo). */
const REPORTS_PER_IP: RateLimit = { max: 10, windowMs: 15 * 60_000 };
const DUPLICATE_REFERENCE = "Esa referencia ya fue reportada en otra reserva. Si es un error, escríbanos por WhatsApp.";

const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });
const field = (form: FormData, key: string, max = 80) => String(form.get(key) ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** HEIC y HEIF comparten contenedor (y marcas como "mif1"): se tratan como un mismo formato. */
const family = (type: string) => (type === "image/heif" ? "image/heic" : type);

/** Tipo real del comprobante según sus primeros bytes (no se confía en el tipo que declara el navegador). */
function sniffProofType(data: Buffer): string | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (data.length >= 5 && data.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";
  if (data.length >= 12 && data.toString("ascii", 4, 8) === "ftyp") {
    const brand = data.toString("ascii", 8, 12);
    if (["heic", "heix", "heim", "heis", "hevc", "hevx", "hevm", "hevs"].includes(brand)) return "image/heic";
    if (brand === "mif1" || brand === "msf1") return "image/heif";
  }
  return null;
}

/**
 * Monto escrito por el cliente: acepta "1.234,56", "1234,56", "1,234.56" o "25.5".
 * Con un solo punto seguido de exactamente 3 dígitos ("1.234") se interpreta como separador de miles (uso local).
 */
function parseAmount(raw: string): number {
  const s = raw.replace(/[^\d.,]/g, "");
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let decimal = -1;
  if (lastComma >= 0 && lastDot >= 0) decimal = Math.max(lastComma, lastDot);
  else if (lastComma >= 0) decimal = lastComma;
  else if (lastDot >= 0 && s.indexOf(".") === lastDot && s.length - lastDot - 1 !== 3) decimal = lastDot;
  if (decimal < 0) return Number(s.replace(/[.,]/g, ""));
  return Number(`${s.slice(0, decimal).replace(/[.,]/g, "") || "0"}.${s.slice(decimal + 1).replace(/[.,]/g, "")}`);
}

/**
 * El cliente reporta su pago.
 *  - pago_movil / transferencia: cuenta destino de la configuración, referencia, monto en Bs, datos del pagador y comprobante.
 *  - binance_usdt: referencia (Order ID / TxID), monto en USDT y comprobante.
 *  - efectivo: sin comprobante ni referencia (la entrega se coordina por WhatsApp); nota opcional.
 *  - total $0 (cupón del 100 %): no hay nada que pagar; se pasa a revisión sin monto, referencia ni comprobante.
 * El monto se guarda en `paymentAmountBs`; su moneda depende del método (USDT en Binance).
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

    const config = await getPaymentConfig();
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
      if (await referenceInUse(reference, order.id)) return bad(DUPLICATE_REFERENCE, 409);

      const isBs = method !== "binance_usdt";
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
      if (reference && (await referenceInUse(reference, order.id))) return bad(DUPLICATE_REFERENCE, 409);
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
