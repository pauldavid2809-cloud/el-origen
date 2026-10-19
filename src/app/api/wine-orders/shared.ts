import "server-only";
import type { WineOrder } from "@/lib/wineOrders";

/* Utilidades compartidas por las rutas públicas de los pedidos de vino
   (/api/wine-checkout, /api/wine-orders/[token]/**, /api/wines/cart y /api/members/me). */

/** Un id de vino/pedido tiene forma de UUID (Postgres los guarda en minúsculas). */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Forma del token del enlace del pedido (generateToken: 18 bytes en base64url = 24 caracteres). */
const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

/** Un token con otra forma no puede existir: se responde 404 sin consultar la base de datos. */
export const isOrderTokenShape = (token: unknown): token is string => typeof token === "string" && TOKEN_RE.test(token);

/**
 * Lee el cuerpo de la petición con un tope de bytes, sin fiarse de `content-length` (puede faltar o mentir con
 * transferencia por trozos). Devuelve null si el cuerpo supera `maxBytes`: no llega a guardarse entero en memoria.
 */
export async function readBodyLimited(request: Request, maxBytes: number): Promise<Buffer | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks, total);
}

export type JsonBody = { ok: true; body: Record<string, unknown> } | { ok: false; tooLarge: boolean };

/** Cuerpo JSON (objeto) de hasta `maxBytes`. `tooLarge` distingue «demasiado grande» (413) de «inválido» (400). */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBody> {
  const raw = await readBodyLimited(request, maxBytes).catch(() => undefined);
  if (raw === null) return { ok: false, tooLarge: true };
  if (raw === undefined) return { ok: false, tooLarge: false };
  try {
    const body: unknown = JSON.parse(raw.toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, tooLarge: false };
    return { ok: true, body: body as Record<string, unknown> };
  } catch {
    return { ok: false, tooLarge: false };
  }
}

/** Formulario multipart de hasta `maxBytes`; null si es demasiado grande y `undefined` si no es un multipart válido. */
export async function readFormLimited(request: Request, maxBytes: number): Promise<FormData | null | undefined> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType)) return undefined;
  const raw = await readBodyLimited(request, maxBytes).catch(() => undefined);
  if (raw === null) return null;
  if (raw === undefined) return undefined;
  try {
    return await new Response(new Uint8Array(raw), { headers: { "content-type": contentType } }).formData();
  } catch {
    return undefined;
  }
}

/**
 * Resumen de un pedido para «Mi cuenta» (GET /api/members/me): lista de inclusión. Incluye lo necesario para mostrar la fila
 * de envío sin consultar la configuración de ahora: `shippingUsd` (ya incluido en `totalUsd`), la zona y con qué regla se
 * cobró (`shippingMode`, null = retiro o pedido anterior a v7; ver `isShippingCoordinated` en wineSale.ts), más
 * `fulfillment` (retiro o entrega) para saber si hay envío.
 */
export interface PublicWineOrderSummary {
  code: string;
  token: string;
  status: WineOrder["status"];
  totalUsd: number;
  bottlesCount: number;
  fulfillment: WineOrder["fulfillment"];
  shippingUsd: number;
  deliveryZone: string | null;
  shippingMode: WineOrder["shippingMode"];
  createdAt: string;
}

export function toWineOrderSummary(o: WineOrder): PublicWineOrderSummary {
  return {
    code: o.code,
    token: o.token,
    status: o.status,
    totalUsd: o.totalUsd,
    bottlesCount: o.bottlesCount,
    fulfillment: o.fulfillment,
    shippingUsd: o.shippingUsd,
    deliveryZone: o.deliveryZone,
    shippingMode: o.shippingMode,
    createdAt: o.createdAt,
  };
}
