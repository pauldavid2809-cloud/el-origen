import "server-only";
import crypto from "crypto";
import { RATE_CURRENCIES, type PaymentMethodId, type RateCurrency } from "@/types";
import { fetchAllRows, generateToken, getAdminClient, type DeliveryStatus, type OrderStatus } from "./orders";
import { WINE_PENDING_TTL_HOURS } from "./wineSale";

/* ─────────────────────────────────────────────────────────────
   Pedidos de vinos con pago verificado (tabla public.wine_orders, supabase/v6.sql).
   Misma máquina de estados que las reservas (orders.ts): pending_payment → in_review → approved | rejected ;
   cancelled. No reserva stock, no genera entradas ni QR. Sin Supabase guarda en memoria
   (solo sirve para probar en local: se pierde al reiniciar).
   NO importa wines.ts (wines.ts consulta `wineHasOrders` desde aquí: evita un ciclo).
   ───────────────────────────────────────────────────────────── */

export type WineOrderStatus = OrderStatus;
export type FulfillmentMethod = "pickup" | "delivery";

/** Copia de una línea del pedido: lo que se vendió, con el precio de ese momento. */
export interface WineOrderItem {
  wineId: string;
  slug: string;
  name: string;
  vintage: string;
  unitPriceUsd: number;
  quantity: number;
}

export interface WineOrder {
  id: string;
  /** Código visible, ej. EV-7KQ2M. */
  code: string;
  /** Secreto del enlace público /pedido/<token>. */
  token: string;
  /** Miembro con sesión que hizo el pedido. */
  memberId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocId: string;
  items: WineOrderItem[];
  bottlesCount: number;
  fulfillment: FulfillmentMethod;
  deliveryAddress: string | null;
  deliveryNote: string | null;
  subtotalUsd: number;
  totalUsd: number;
  /** Siempre 'USD' en los pedidos de vino. */
  rateCurrency: RateCurrency;
  bcvRate: number | null;
  paymentMethod: PaymentMethodId | null;
  paymentBank: string | null;
  paymentReference: string | null;
  /** En la moneda del método (Bs, USDT o USD), igual que en las reservas. */
  paymentAmountBs: number | null;
  payerBank: string | null;
  payerDocId: string | null;
  payerPhone: string | null;
  paymentNote: string | null;
  proofPath: string | null;
  proofSubmittedAt: string | null;
  status: WineOrderStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  /** Cuándo se entregó o retiró (solo pedidos aprobados). */
  deliveredAt: string | null;
  emailStatus: DeliveryStatus;
  whatsappStatus: DeliveryStatus;
  acceptedTermsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Lo que fija el checkout al abrir el pedido (todo lo demás lo pone `buildWineOrder`). */
export type NewWineOrder = Pick<
  WineOrder,
  | "customerName" | "customerEmail" | "customerPhone" | "customerDocId"
  | "items" | "bottlesCount" | "fulfillment" | "subtotalUsd" | "totalUsd"
> &
  Partial<Pick<WineOrder, "memberId" | "deliveryAddress" | "deliveryNote" | "acceptedTermsAt">>;

/** Lo que puede ver el cliente con el enlace de su pedido: lista de inclusión (sin id, token, correo, miembro ni comprobante). */
export type PublicWineOrder = Pick<
  WineOrder,
  | "code" | "status" | "customerName" | "customerPhone" | "customerDocId" | "items" | "bottlesCount"
  | "fulfillment" | "deliveryAddress" | "deliveryNote" | "subtotalUsd" | "totalUsd" | "rateCurrency"
  | "paymentMethod" | "paymentReference" | "paymentAmountBs" | "rejectionReason" | "deliveredAt"
  | "createdAt" | "updatedAt"
>;

export function toPublicWineOrder(o: WineOrder): PublicWineOrder {
  return {
    code: o.code,
    status: o.status,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerDocId: o.customerDocId,
    items: o.items.map((i) => ({ ...i })),
    bottlesCount: o.bottlesCount,
    fulfillment: o.fulfillment,
    deliveryAddress: o.deliveryAddress,
    deliveryNote: o.deliveryNote,
    subtotalUsd: o.subtotalUsd,
    totalUsd: o.totalUsd,
    rateCurrency: o.rateCurrency,
    paymentMethod: o.paymentMethod,
    paymentReference: o.paymentReference,
    paymentAmountBs: o.paymentAmountBs,
    rejectionReason: o.rejectionReason,
    deliveredAt: o.deliveredAt,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

/* ─── Mapeo fila ↔ objeto ─── */

type Row = Record<string, unknown>;

const FIELDS: [keyof WineOrder, string][] = [
  ["id", "id"], ["code", "code"], ["token", "token"], ["memberId", "member_id"],
  ["customerName", "customer_name"], ["customerEmail", "customer_email"], ["customerPhone", "customer_phone"],
  ["customerDocId", "customer_doc_id"], ["items", "items"], ["bottlesCount", "bottles_count"],
  ["fulfillment", "fulfillment"], ["deliveryAddress", "delivery_address"], ["deliveryNote", "delivery_note"],
  ["subtotalUsd", "subtotal_usd"], ["totalUsd", "total_usd"], ["rateCurrency", "rate_currency"], ["bcvRate", "bcv_rate"],
  ["paymentMethod", "payment_method"], ["paymentBank", "payment_bank"], ["paymentReference", "payment_reference"],
  ["paymentAmountBs", "payment_amount_bs"], ["payerBank", "payer_bank"], ["payerDocId", "payer_doc_id"],
  ["payerPhone", "payer_phone"], ["paymentNote", "payment_note"], ["proofPath", "proof_path"],
  ["proofSubmittedAt", "proof_submitted_at"], ["status", "status"], ["rejectionReason", "rejection_reason"],
  ["reviewedAt", "reviewed_at"], ["reviewedBy", "reviewed_by"], ["deliveredAt", "delivered_at"],
  ["emailStatus", "email_status"], ["whatsappStatus", "whatsapp_status"], ["acceptedTermsAt", "accepted_terms_at"],
  ["createdAt", "created_at"], ["updatedAt", "updated_at"],
];

const NUMERIC: (keyof WineOrder)[] = ["bottlesCount", "subtotalUsd", "totalUsd", "bcvRate", "paymentAmountBs"];

/** Las líneas llegan como jsonb: se normalizan por si alguna fila trae tipos distintos. */
function itemsFromRow(v: unknown): WineOrderItem[] {
  if (!Array.isArray(v)) return [];
  return v.map((raw) => {
    const i = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      wineId: String(i.wineId ?? ""),
      slug: String(i.slug ?? ""),
      name: String(i.name ?? ""),
      vintage: String(i.vintage ?? ""),
      unitPriceUsd: Number(i.unitPriceUsd) || 0,
      quantity: Number(i.quantity) || 0,
    };
  });
}

function fromRow(row: Row): WineOrder {
  const o = {} as Record<string, unknown>;
  for (const [k, col] of FIELDS) {
    const v = row[col];
    o[k] = NUMERIC.includes(k) && v !== null && v !== undefined ? Number(v) : v ?? null;
  }
  o.items = itemsFromRow(row.items);
  o.fulfillment = row.fulfillment === "delivery" ? "delivery" : "pickup";
  o.rateCurrency = RATE_CURRENCIES.includes(row.rate_currency as RateCurrency) ? row.rate_currency : "USD";
  o.emailStatus = row.email_status ?? "not_sent";
  o.whatsappStatus = row.whatsapp_status ?? "not_sent";
  return o as unknown as WineOrder;
}

function toRow(patch: Partial<WineOrder>): Row {
  const row: Row = {};
  for (const [k, col] of FIELDS) {
    if (k in patch && k !== "createdAt" && k !== "updatedAt") row[col] = patch[k];
  }
  return row;
}

/* ─── Memoria (fallback) ─── */

const mem = globalThis as unknown as { __eoWineOrders?: Map<string, WineOrder> };
const memWineOrders: Map<string, WineOrder> = (mem.__eoWineOrders ??= new Map());

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const byNewest = (a: WineOrder, b: WineOrder) => b.createdAt.localeCompare(a.createdAt);
const DUPLICATE_REFERENCE = "Esa referencia de pago ya fue registrada en otra orden.";

/* ─── Utilidades ─── */

// Mismo alfabeto que los códigos de reserva (EO-): sin 0, 1, I, L ni O para que no se confundan.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Código corto visible del pedido, ej. EV-7KQ2M. Prefijo propio para no confundirlo con las reservas/entradas (EO-). */
export function generateWineOrderCode(): string {
  const bytes = crypto.randomBytes(5);
  return "EV-" + Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/**
 * El pedido pendiente de pago ya venció (lógico: no hay reserva de stock que liberar). Solo aplica a
 * pending_payment con más de WINE_PENDING_TTL_HOURS desde que se creó; en revisión, aprobado, etc. nunca vencen.
 * El reporte de pago sigue permitido aunque haya vencido (decide el administrador al revisarlo).
 */
export function isWineOrderPendingExpired(
  o: Pick<WineOrder, "status" | "createdAt" | "paymentMethod" | "proofSubmittedAt">,
  now = Date.now()
): boolean {
  if (o.status !== "pending_payment") return false;
  return Date.parse(o.createdAt) + WINE_PENDING_TTL_HOURS * 3_600_000 < now;
}

/* ─── Operaciones ─── */

/** Pedido nuevo (pendiente de pago) con sus valores iniciales, aún sin guardar. */
export function buildWineOrder(input: NewWineOrder): WineOrder {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    code: generateWineOrderCode(),
    token: generateToken(),
    memberId: input.memberId ?? null,
    customerName: input.customerName,
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerPhone: input.customerPhone,
    customerDocId: input.customerDocId,
    items: input.items.map((i) => ({ ...i })),
    bottlesCount: input.bottlesCount,
    fulfillment: input.fulfillment,
    deliveryAddress: input.deliveryAddress ?? null,
    deliveryNote: input.deliveryNote ?? null,
    subtotalUsd: input.subtotalUsd,
    totalUsd: input.totalUsd,
    rateCurrency: "USD",
    bcvRate: null,
    paymentMethod: null, paymentBank: null, paymentReference: null, paymentAmountBs: null,
    payerBank: null, payerDocId: null, payerPhone: null, paymentNote: null, proofPath: null, proofSubmittedAt: null,
    status: "pending_payment", rejectionReason: null, reviewedAt: null, reviewedBy: null, deliveredAt: null,
    emailStatus: "not_sent", whatsappStatus: "not_sent",
    acceptedTermsAt: input.acceptedTermsAt ?? null,
    createdAt: now, updatedAt: now,
  };
}

/** Crea el pedido. Los precios y el total los calcula el servidor antes de llamar aquí (nunca el cliente). */
export async function createWineOrder(input: NewWineOrder): Promise<WineOrder> {
  let base = buildWineOrder(input);
  const sb = getAdminClient();
  if (!sb) {
    // Sin `await` entre la comprobación y el guardado: no se repite un código en memoria.
    while (Array.from(memWineOrders.values()).some((o) => o.code === base.code)) base = { ...base, code: generateWineOrderCode() };
    memWineOrders.set(base.id, base);
    return base;
  }
  for (let attempt = 0; ; attempt++) {
    const { data, error } = await sb.from("wine_orders").insert({ ...toRow(base), id: base.id }).select().single();
    if (!error) return fromRow(data);
    // Código repetido (31^5 combinaciones: casi imposible): se genera otro y se reintenta.
    if (error.code === "23505" && error.message.includes("wine_orders_code_key") && attempt < 3) {
      base = { ...base, code: generateWineOrderCode() };
      continue;
    }
    throw new Error(`No se pudo crear el pedido: ${error.message}`);
  }
}

export async function getWineOrderByToken(token: string): Promise<WineOrder | null> {
  if (!token) return null;
  const sb = getAdminClient();
  if (!sb) return Array.from(memWineOrders.values()).find((o) => o.token === token) ?? null;
  const { data, error } = await sb.from("wine_orders").select("*").eq("token", token).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function getWineOrderById(id: string): Promise<WineOrder | null> {
  const sb = getAdminClient();
  if (!sb) return memWineOrders.get(id) ?? null;
  // Un id que no es UUID no puede existir (y Postgres lo rechazaría con error).
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await sb.from("wine_orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

/** Todos los pedidos, los más recientes primero (para el panel). */
export async function listWineOrders(): Promise<WineOrder[]> {
  const sb = getAdminClient();
  if (!sb) return Array.from(memWineOrders.values()).sort(byNewest);
  const rows = await fetchAllRows<Row>((from, to) =>
    sb.from("wine_orders").select("*").order("created_at", { ascending: false }).order("id", { ascending: true }).range(from, to)
  );
  return rows.map(fromRow);
}

/** Pedidos hechos con la sesión de un miembro (por member_id, no por correo), los más recientes primero. */
export async function listWineOrdersByMember(memberId: string): Promise<WineOrder[]> {
  if (!memberId) return [];
  const sb = getAdminClient();
  if (!sb) return Array.from(memWineOrders.values()).filter((o) => o.memberId === memberId).sort(byNewest);
  const { data, error } = await sb
    .from("wine_orders")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Pedidos en pending_payment que siguen vigentes (no vencidos) de un miembro: tope WINE_MAX_PENDING_PER_MEMBER. */
export async function countPendingWineOrders(memberId: string): Promise<number> {
  if (!memberId) return 0;
  const now = Date.now();
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memWineOrders.values()).filter(
      (o) => o.memberId === memberId && o.status === "pending_payment" && !isWineOrderPendingExpired(o, now)
    ).length;
  }
  const cutoff = new Date(now - WINE_PENDING_TTL_HOURS * 3_600_000).toISOString();
  const { count, error } = await sb
    .from("wine_orders")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("status", "pending_payment")
    .gte("created_at", cutoff);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Actualiza los campos indicados. Devuelve null si el pedido no existe. */
export async function updateWineOrder(id: string, patch: Partial<WineOrder>): Promise<WineOrder | null> {
  const sb = getAdminClient();
  if (!sb) {
    const current = memWineOrders.get(id);
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    memWineOrders.set(id, next);
    return next;
  }
  if (!UUID_RE.test(id)) return null;
  const row = toRow(patch);
  if (!Object.keys(row).length) return getWineOrderById(id);
  const { data, error } = await sb.from("wine_orders").update(row).eq("id", id).select().maybeSingle();
  if (error) {
    if (error.code === "23505") throw new Error(DUPLICATE_REFERENCE);
    throw new Error(error.message);
  }
  return data ? fromRow(data) : null;
}

/**
 * Cambio de estado condicionado: aplica `patch` solo si el pedido sigue en uno de los estados `from`
 * (compare-and-set). Devuelve null si otra petición lo cambió antes (o si no existe), para responder 409
 * sin efectos secundarios (aprobación y anulación simultáneas, doble envío del comprobante, etc.).
 */
export async function transitionWineOrder(
  id: string,
  from: WineOrderStatus[],
  patch: Partial<WineOrder>
): Promise<WineOrder | null> {
  if (!from.length) return null;
  const sb = getAdminClient();
  if (!sb) {
    const current = memWineOrders.get(id);
    if (!current || !from.includes(current.status)) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    memWineOrders.set(id, next);
    return next;
  }
  if (!UUID_RE.test(id)) return null;
  const { data, error } = await sb.from("wine_orders").update(toRow(patch)).eq("id", id).in("status", from).select().maybeSingle();
  if (error) {
    if (error.code === "23505") throw new Error(DUPLICATE_REFERENCE);
    throw new Error(error.message);
  }
  return data ? fromRow(data) : null;
}

/** ¿Otro pedido de vinos en revisión o aprobado usa esta referencia de pago? (ver `referenceInUseAnywhere` en proofs.ts). */
export async function wineReferenceInUse(reference: string, exceptId: string): Promise<boolean> {
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memWineOrders.values()).some(
      (o) => o.id !== exceptId && o.paymentReference === reference && (o.status === "in_review" || o.status === "approved")
    );
  }
  const { data, error } = await sb
    .from("wine_orders")
    .select("id")
    .eq("payment_reference", reference)
    .in("status", ["in_review", "approved"])
    .neq("id", exceptId)
    .limit(1);
  // Igual que `referenceInUse` de las reservas: ante un error (p. ej. v6.sql sin ejecutar) no bloquea el reporte;
  // el índice único parcial de la tabla es la última defensa.
  if (error) console.error("[wineOrders] No se pudo comprobar la referencia de pago:", error.message);
  return Boolean(data && data.length);
}

/** ¿Algún pedido (en cualquier estado) contiene este vino? Impide borrarlo: se desactiva la venta en su lugar. */
export async function wineHasOrders(wineId: string): Promise<boolean> {
  if (!wineId) return false;
  const sb = getAdminClient();
  if (!sb) {
    for (const o of Array.from(memWineOrders.values())) if (o.items.some((i) => i.wineId === wineId)) return true;
    return false;
  }
  // Se pasa el JSON como texto: con un arreglo, supabase-js lo armaría como arreglo de Postgres ({a,b}) y no como jsonb.
  const { data, error } = await sb
    .from("wine_orders")
    .select("id")
    .contains("items", JSON.stringify([{ wineId }]))
    .limit(1);
  if (error) throw new Error(`No se pudieron consultar los pedidos del vino: ${error.message}`);
  return Boolean(data && data.length);
}

/* ─── Cola del bot de WhatsApp ─── */

/** Pedidos aprobados con el WhatsApp en cola, los más antiguos primero. */
export async function listWineWhatsAppQueue(limit = 10): Promise<WineOrder[]> {
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memWineOrders.values())
      .filter((o) => o.status === "approved" && o.whatsappStatus === "queued")
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .slice(0, limit);
  }
  const { data, error } = await sb
    .from("wine_orders")
    .select("*")
    .eq("status", "approved")
    .eq("whatsapp_status", "queued")
    .order("updated_at", { ascending: true })
    .limit(limit);
  // La cola de vinos no debe tumbar la de las entradas (p. ej. si aún falta ejecutar v6.sql): ante un error queda vacía.
  if (error) {
    console.error("[wineOrders] No se pudo leer la cola de WhatsApp:", error.message);
    return [];
  }
  return (data ?? []).map(fromRow);
}

export async function countWineWhatsAppQueue(): Promise<number> {
  const sb = getAdminClient();
  if (!sb) return Array.from(memWineOrders.values()).filter((o) => o.status === "approved" && o.whatsappStatus === "queued").length;
  const { count, error } = await sb
    .from("wine_orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("whatsapp_status", "queued");
  if (error) {
    console.error("[wineOrders] No se pudo contar la cola de WhatsApp:", error.message);
    return 0;
  }
  return count ?? 0;
}
