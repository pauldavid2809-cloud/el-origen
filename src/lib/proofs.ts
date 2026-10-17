import "server-only";
import { referenceInUse } from "./orders";
import type { RateLimit } from "./rateLimit";
import { wineReferenceInUse } from "./wineOrders";

/* ─────────────────────────────────────────────────────────────
   Reglas compartidas por los reportes de pago (comprobante) de las reservas de catas
   (/api/orders/[token]/proof) y de los pedidos de vinos (/api/wine-orders/[token]/proof).
   ───────────────────────────────────────────────────────────── */

/** Tipos de comprobante aceptados y su extensión. */
export const PROOF_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};
export const PROOF_MAX_BYTES = 8 * 1024 * 1024;
/** Margen para los demás campos y los separadores del multipart. */
export const PROOF_MAX_BODY_BYTES = PROOF_MAX_BYTES + 256 * 1024;
/** Máximo de caracteres de la nota del cliente al reportar el pago. */
export const PROOF_NOTE_MAX = 500;
/** Reportes de pago por IP (cada uno avisa al admin por correo). */
export const PROOF_REPORTS_PER_IP: RateLimit = { max: 10, windowMs: 15 * 60_000 };

/** HEIC y HEIF comparten contenedor (y marcas como "mif1"): se tratan como un mismo formato. */
export const proofTypeFamily = (type: string) => (type === "image/heif" ? "image/heic" : type);

/** Tipo real del comprobante según sus primeros bytes (no se confía en el tipo que declara el navegador). */
export function sniffProofType(data: Buffer): string | null {
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
export function parseAmount(raw: string): number {
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
 * ¿Otra reserva de catas O pedido de vinos, en revisión o aprobado, ya usa esta referencia bancaria?
 * Cada tabla tiene su propio índice único; esta comprobación cierra la reutilización de una misma
 * referencia entre catas y vinos. `exceptId` es el id de la reserva/pedido que está reportando el pago.
 */
export async function referenceInUseAnywhere(reference: string, exceptId: string): Promise<boolean> {
  const [inTastings, inWines] = await Promise.all([referenceInUse(reference, exceptId), wineReferenceInUse(reference, exceptId)]);
  return inTastings || inWines;
}
