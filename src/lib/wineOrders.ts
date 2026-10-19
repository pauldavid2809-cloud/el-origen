import "server-only";
import crypto from "crypto";
import { RATE_CURRENCIES, type PaymentMethodId, type RateCurrency } from "@/types";
import { fetchAllRows, generateToken, getAdminClient, type DeliveryStatus, type OrderStatus } from "./orders";
import { round2, WINE_PENDING_TTL_HOURS, WINE_SHIPPING_MODES, type WineShippingMode } from "./wineSale";

/* ─────────────────────────────────────────────────────────────
   Pedidos de vinos con pago verificado (tabla public.wine_orders, supabase/v6.sql; envío, zona y modo de envío en supabase/v7.sql).
   Misma máquina de estados que las reservas (orders.ts): pending_payment → in_review → approved | rejected ;
   cancelled. No genera entradas ni QR. Reservan existencias de los vinos que las controlan (ver `getWineHolds`)
   mientras estén en revisión, aprobados o pendientes de pago vigentes. Sin Supabase guarda en memoria
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
  /** Suma de las botellas (sin envío). */
  subtotalUsd: number;
  /** Costo de envío cobrado; 0 en retiro, con envío gratis, con el costo acordado por WhatsApp y en pedidos anteriores a v7. */
  shippingUsd: number;
  /** Nombre de la zona de entrega elegida (copia: no cambia si luego se renombra la zona); null si no aplica. */
  deliveryZone: string | null;
  /**
   * Con qué regla se cobró el envío al crear el pedido (instantánea de la configuración de entonces): así la página del
   * pedido, el panel y los avisos no lo deducen de la configuración de AHORA. null = retiro o pedido anterior a v7.
   * Ver `isShippingCoordinated` (wineSale.ts) para saber si el envío «se coordina por WhatsApp».
   */
  shippingMode: WineShippingMode | null;
  /** subtotalUsd + shippingUsd. */
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
  Partial<Pick<WineOrder, "memberId" | "deliveryAddress" | "deliveryNote" | "acceptedTermsAt" | "shippingUsd" | "deliveryZone" | "shippingMode">>;

/** Lo que puede ver el cliente con el enlace de su pedido: lista de inclusión (sin id, token, correo, miembro ni comprobante). */
export type PublicWineOrder = Pick<
  WineOrder,
  | "code" | "status" | "customerName" | "customerPhone" | "customerDocId" | "items" | "bottlesCount"
  | "fulfillment" | "deliveryAddress" | "deliveryNote" | "subtotalUsd" | "shippingUsd" | "deliveryZone" | "shippingMode" | "totalUsd" | "rateCurrency"
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
    shippingUsd: o.shippingUsd,
    deliveryZone: o.deliveryZone,
    shippingMode: o.shippingMode,
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
  ["subtotalUsd", "subtotal_usd"], ["shippingUsd", "shipping_usd"], ["deliveryZone", "delivery_zone"],
  ["shippingMode", "shipping_mode"], ["totalUsd", "total_usd"], ["rateCurrency", "rate_currency"], ["bcvRate", "bcv_rate"],
  ["paymentMethod", "payment_method"], ["paymentBank", "payment_bank"], ["paymentReference", "payment_reference"],
  ["paymentAmountBs", "payment_amount_bs"], ["payerBank", "payer_bank"], ["payerDocId", "payer_doc_id"],
  ["payerPhone", "payer_phone"], ["paymentNote", "payment_note"], ["proofPath", "proof_path"],
  ["proofSubmittedAt", "proof_submitted_at"], ["status", "status"], ["rejectionReason", "rejection_reason"],
  ["reviewedAt", "reviewed_at"], ["reviewedBy", "reviewed_by"], ["deliveredAt", "delivered_at"],
  ["emailStatus", "email_status"], ["whatsappStatus", "whatsapp_status"], ["acceptedTermsAt", "accepted_terms_at"],
  ["createdAt", "created_at"], ["updatedAt", "updated_at"],
];

const NUMERIC: (keyof WineOrder)[] = ["bottlesCount", "subtotalUsd", "shippingUsd", "totalUsd", "bcvRate", "paymentAmountBs"];

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

const isShippingMode = (v: unknown): v is WineShippingMode => WINE_SHIPPING_MODES.includes(v as WineShippingMode);

function fromRow(row: Row): WineOrder {
  const o = {} as Record<string, unknown>;
  for (const [k, col] of FIELDS) {
    const v = row[col];
    o[k] = NUMERIC.includes(k) && v !== null && v !== undefined ? Number(v) : v ?? null;
  }
  o.items = itemsFromRow(row.items);
  // Pedidos anteriores a v7.sql (o base sin migrar): sin columnas de envío → sin costo, sin zona y sin modo de envío.
  // (select("*") no falla por una columna que no existe: simplemente no viene en la fila.)
  o.shippingUsd = Number(row.shipping_usd) || 0;
  o.deliveryZone = typeof row.delivery_zone === "string" && row.delivery_zone ? row.delivery_zone : null;
  o.shippingMode = isShippingMode(row.shipping_mode) ? row.shipping_mode : null;
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

/** Fecha (ISO) anterior a la cual un pedido pendiente de pago ya venció. */
function pendingCutoffIso(now = Date.now()): string {
  return new Date(now - WINE_PENDING_TTL_HOURS * 3_600_000).toISOString();
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
    shippingUsd: input.shippingUsd && Number.isFinite(input.shippingUsd) && input.shippingUsd > 0 ? round2(input.shippingUsd) : 0,
    deliveryZone: input.deliveryZone ?? null,
    // Solo una entrega recuerda con qué regla se cobró el envío; el retiro no tiene envío.
    shippingMode: input.fulfillment === "delivery" && isShippingMode(input.shippingMode) ? input.shippingMode : null,
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

/** La base no tiene las columnas de pedidos de supabase/v7.sql: PostgREST (PGRST204) o Postgres (42703). */
function isMissingV7Column(error: { code?: string; message: string }): boolean {
  return (error.code === "PGRST204" || error.code === "42703") && /shipping_usd|delivery_zone|shipping_mode/.test(error.message);
}

/** Crea el pedido. Los precios y el total los calcula el servidor antes de llamar aquí (nunca el cliente). */
export async function createWineOrder(input: NewWineOrder): Promise<WineOrder> {
  let base = buildWineOrder(input);
  const sb = getAdminClient();
  if (!sb) {
    // Sin `await` entre la comprobación y el guardado: no se repite un código en memoria.
    while (Array.from(memWineOrders.values()).some((o) => o.code === base.code)) base = { ...base, code: generateWineOrderCode() };
    memWineOrders.set(base.id, base);
    invalidateHoldsCache();
    return base;
  }
  // Si falta ejecutar v7.sql, un pedido cuyo envío no se pierde al omitir las columnas se guarda igual (tienen valor por
  // defecto): sin costo, sin zona y con modo «coordinar» o ninguno (una entrega con envío 0 y modo null ya se lee como
  // «a coordinar»). Uno con costo, con zona o con envío gratis de costo fijo / por zonas no puede guardarse sin perder
  // esa información (sin el modo se leería como «a coordinar»), y falla con un mensaje claro.
  const needsV7 = base.shippingUsd > 0 || base.deliveryZone !== null || base.shippingMode === "flat" || base.shippingMode === "zones";
  let withShippingColumns = true;
  for (let attempt = 0; ; attempt++) {
    const row = toRow(base);
    if (!withShippingColumns) {
      delete row.shipping_usd;
      delete row.delivery_zone;
      delete row.shipping_mode;
    }
    const { data, error } = await sb.from("wine_orders").insert({ ...row, id: base.id }).select().single();
    if (!error) {
      invalidateHoldsCache();
      return fromRow(data);
    }
    if (withShippingColumns && isMissingV7Column(error)) {
      if (needsV7) {
        throw new Error("Falta ejecutar supabase/v7.sql en Supabase: la tabla wine_orders no tiene las columnas de envío.");
      }
      withShippingColumns = false;
      continue;
    }
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
  const cutoff = pendingCutoffIso(now);
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
    if (changesReservations(patch)) invalidateHoldsCache();
    return next;
  }
  if (!UUID_RE.test(id)) return null;
  const row = toRow(patch);
  if (!Object.keys(row).length) return getWineOrderById(id);
  try {
    const { data, error } = await sb.from("wine_orders").update(row).eq("id", id).select().maybeSingle();
    if (error) {
      if (error.code === "23505") throw new Error(DUPLICATE_REFERENCE);
      throw new Error(error.message);
    }
    return data ? fromRow(data) : null;
  } finally {
    if (changesReservations(patch)) invalidateHoldsCache();
  }
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
    invalidateHoldsCache();
    return next;
  }
  if (!UUID_RE.test(id)) return null;
  try {
    const { data, error } = await sb.from("wine_orders").update(toRow(patch)).eq("id", id).in("status", from).select().maybeSingle();
    if (error) {
      if (error.code === "23505") throw new Error(DUPLICATE_REFERENCE);
      throw new Error(error.message);
    }
    return data ? fromRow(data) : null;
  } finally {
    // Después de escribir (aunque falle: pudo aplicarse): una lectura que empezó antes no debe quedar guardada.
    invalidateHoldsCache();
  }
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

/* ─── Existencias: botellas reservadas por vino ─── */

/** Botellas de un vino dentro de un pedido que hoy cuenta contra las existencias. */
export interface WineReservation {
  orderId: string;
  createdAt: string;
  wineId: string;
  quantity: number;
}

/**
 * Pedidos que hoy reservan existencias: en revisión, aprobados y pendientes de pago que no han vencido (rechazados,
 * anulados y vencidos se liberan solos). Una sola consulta paginada, con SOLO las columnas que hacen falta: `items` para
 * sumar botellas y, para atender las reservas por orden de llegada, también `id` y `created_at`. En error lanza.
 */
async function readReservingOrders(columns: "items" | "id, created_at, items"): Promise<{ id: string; createdAt: string; items: WineOrderItem[] }[]> {
  const now = Date.now();
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memWineOrders.values())
      .filter((o) => o.status === "in_review" || o.status === "approved" || (o.status === "pending_payment" && !isWineOrderPendingExpired(o, now)))
      .map((o) => ({ id: o.id, createdAt: o.createdAt, items: o.items }));
  }
  const cutoff = pendingCutoffIso(now);
  const rows = await fetchAllRows<Row>(
    async (from, to) =>
      // `columns` no es un literal: el tipo de supabase-js no puede deducir la forma de las filas, y es `Row`.
      (await sb
        .from("wine_orders")
        .select(columns as string)
        .or(`status.in.(in_review,approved),and(status.eq.pending_payment,created_at.gte.${cutoff})`)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)) as unknown as { data: Row[] | null; error: { message: string } | null }
  );
  return rows.map((r) => ({ id: String(r.id ?? ""), createdAt: String(r.created_at ?? ""), items: itemsFromRow(r.items) }));
}

/** Suma de botellas por vino de una lista de pedidos que reservan. */
function sumHolds(orders: { items: WineOrderItem[] }[], into = new Map<string, number>()): Map<string, number> {
  for (const o of orders) {
    for (const i of o.items) if (i.quantity > 0 && i.wineId) into.set(i.wineId, (into.get(i.wineId) ?? 0) + i.quantity);
  }
  return into;
}

/**
 * Reservas vigentes, línea por línea y con el orden de llegada de cada pedido (la usa el rechequeo de carreras del
 * checkout). `wineIds` limita a esos vinos. SIEMPRE lee la base de datos. En error lanza (el llamador decide si degrada o falla).
 */
export async function listWineReservations(wineIds?: string[]): Promise<WineReservation[]> {
  const wanted = wineIds ? new Set(wineIds) : null;
  const out: WineReservation[] = [];
  for (const o of await readReservingOrders("id, created_at, items")) {
    for (const i of o.items) {
      if (i.quantity > 0 && i.wineId && (!wanted || wanted.has(i.wineId))) {
        out.push({ orderId: o.id, createdAt: o.createdAt, wineId: i.wineId, quantity: i.quantity });
      }
    }
  }
  return out;
}

/**
 * Botellas reservadas por vino (suma de `quantity` en pedidos en revisión, aprobados y pendientes de pago vigentes).
 * Con `wineIds`, cada id pedido aparece en el mapa (0 si no tiene reservas). En error lanza.
 * Disponibles = `availableOf(wine.stock, holds.get(wine.id) ?? 0)`.
 * SIEMPRE lee la base de datos: es la lectura que decide dinero o inventario (checkout, avisos de sobreventa al aprobar,
 * reservas del panel). Para lo que solo se muestra al público está `getWineHoldsCached`.
 */
export async function getWineHolds(wineIds?: string[]): Promise<Map<string, number>> {
  const holds = new Map<string, number>((wineIds ?? []).map((id) => [id, 0]));
  const sums = sumHolds(await readReservingOrders("items"));
  Array.from(sums.entries()).forEach(([wineId, qty]) => {
    if (!wineIds || holds.has(wineId)) holds.set(wineId, qty);
  });
  return holds;
}

/* Caché de las reservas SOLO para lo que se muestra al público (agotado y «quedan N» en /vinos, la ficha del vino y
   /api/wines/cart): sin ella cada visita releería todos los pedidos vigentes. Vive ~10 s en la memoria del proceso y se
   vacía al instante cuando ESTA instancia crea o cambia un pedido (otra instancia puede ir hasta 10 s atrasada, y en pantalla
   eso es inocuo: el checkout vuelve a comprobar). Lo que decide dinero o inventario (el checkout, el rechequeo de carreras,
   los avisos de sobreventa del panel y las reservas que muestra el panel) NO la usa: lee con `getWineHolds` /
   `listWineReservations`. Sin Supabase (memoria) leer es recorrer un Map: no se cachea. Va en globalThis porque las páginas y
   las rutas de la API pueden cargar este módulo por separado y todas deben ver (y vaciar) la misma caché. */

/** Vida de la caché de reservas de la presentación. */
const HOLDS_CACHE_MS = 10_000;

interface HoldsCache {
  /** Sube cada vez que el pedido de alguien cambia: una lectura que empezó antes no puede quedar guardada. */
  gen: number;
  at: number;
  holds: Map<string, number> | null;
  inflight: { gen: number; promise: Promise<Map<string, number>> } | null;
}

const holdsCache: HoldsCache = ((globalThis as unknown as { __eoWineHoldsCache?: HoldsCache }).__eoWineHoldsCache ??= {
  gen: 0,
  at: 0,
  holds: null,
  inflight: null,
});

/** Vacía la caché de reservas (lo llaman las operaciones que crean o cambian un pedido, después de escribir). */
export function invalidateHoldsCache(): void {
  holdsCache.gen++;
  holdsCache.holds = null;
  holdsCache.at = 0;
}

/** ¿Este cambio puede alterar lo que se reserva? (estado o líneas del pedido). */
const changesReservations = (patch: Partial<WineOrder>): boolean => "status" in patch || "items" in patch;

/** Reservas de TODOS los vinos (una consulta que lee solo `items`), compartida entre quienes la piden a la vez. */
function readAllHoldsCached(): Promise<Map<string, number>> {
  const c = holdsCache;
  if (c.holds && Date.now() - c.at < HOLDS_CACHE_MS) return Promise.resolve(c.holds);
  if (c.inflight && c.inflight.gen === c.gen) return c.inflight.promise;
  const gen = c.gen;
  const promise = readReservingOrders("items").then((orders) => {
    const holds = sumHolds(orders);
    // Si un pedido cambió mientras se leía, este resultado puede estar viejo: se entrega a quien lo esperaba, pero no se guarda.
    if (c.gen === gen) {
      c.holds = holds;
      c.at = Date.now();
    }
    return holds;
  });
  const entry = { gen, promise };
  c.inflight = entry;
  const done = () => {
    if (c.inflight === entry) c.inflight = null;
  };
  promise.then(done, done);
  return promise;
}

/**
 * Como `getWineHolds`, pero para mostrar (agotado, «quedan N»): puede venir de una lectura de hasta ~10 s. Cada id pedido
 * aparece en el mapa (0 si no tiene reservas). En error lanza (quien muestra decide cómo degradar). NUNCA para decidir
 * dinero ni inventario.
 */
export async function getWineHoldsCached(wineIds: string[]): Promise<Map<string, number>> {
  if (!getAdminClient()) return getWineHolds(wineIds);
  const all = await readAllHoldsCached();
  return new Map(wineIds.map((id) => [id, all.get(id) ?? 0]));
}

/** Orden en que se atienden las reservas de un vino: la más antigua primero (empate por id), igual para todas las peticiones. */
const byReservationOrder = (a: WineReservation, b: WineReservation) =>
  (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0) || (a.orderId < b.orderId ? -1 : a.orderId > b.orderId ? 1 : 0);

/**
 * Rechequeo de carreras (función pura): ordena las reservas de cada vino por (createdAt, id); si la suma acumulada
 * hasta este pedido supera las existencias, este pedido pierde. Devuelve el primer vino del pedido que no cabe y
 * cuántas botellas quedaban para él, o null si cabe. `stocks`: existencias de los vinos que controlan existencias.
 */
export function stockConflictOf(
  reservations: WineReservation[],
  orderId: string,
  stocks: Map<string, number>
): { wineId: string; available: number } | null {
  for (const [wineId, stock] of Array.from(stocks.entries())) {
    let before = 0;
    for (const r of reservations.filter((x) => x.wineId === wineId).sort(byReservationOrder)) {
      if (r.orderId === orderId) {
        if (before + r.quantity > stock) return { wineId, available: Math.max(0, stock - before) };
        break;
      }
      before += r.quantity;
    }
  }
  return null;
}

/** Tras crear un pedido: ¿alguna de sus líneas supera las existencias por haberse cruzado con otro pedido? En error lanza. */
export async function findStockConflict(orderId: string, stocks: Map<string, number>): Promise<{ wineId: string; available: number } | null> {
  if (!stocks.size) return null;
  return stockConflictOf(await listWineReservations(Array.from(stocks.keys())), orderId, stocks);
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
