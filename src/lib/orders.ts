import "server-only";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { RateCurrency, Tasting } from "@/types";

/* ─────────────────────────────────────────────────────────────
   Órdenes de reserva con pago verificado (tabla public.orders).
   Usa Supabase con la service role key; sin ella, guarda en memoria
   (solo sirve para probar en local: se pierde al reiniciar).
   ───────────────────────────────────────────────────────────── */

export type OrderStatus = "pending_payment" | "in_review" | "approved" | "rejected" | "cancelled";
/** queued: esperando que el bot de WhatsApp lo envíe. */
export type DeliveryStatus = "not_sent" | "queued" | "sent" | "failed" | "disabled";
/** Métodos de pago aceptados (sin tarjeta internacional). */
export type PaymentMethod = "pago_movil" | "transferencia" | "binance_usdt" | "efectivo";
export const PAYMENT_METHODS: readonly PaymentMethod[] = ["pago_movil", "transferencia", "binance_usdt", "efectivo"];
/** Máximo de cupos que una persona puede reservar en una misma orden. */
export const MAX_SPOTS_PER_ORDER = 10;

export interface OrderAddOn {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  code: string;
  token: string;
  tastingId: string;
  tastingTitle: string;
  tastingDate: string;
  tastingTime: string;
  tastingLocation: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDocId: string;
  spotsCount: number;
  dietaryRestrictions: string | null;
  addOns: OrderAddOn[];
  subtotalUsd: number;
  discountUsd: number;
  couponCode: string | null;
  totalUsd: number;
  paymentMethod: string | null;
  paymentBank: string | null;
  paymentReference: string | null;
  paymentAmountBs: number | null;
  payerBank: string | null;
  payerDocId: string | null;
  payerPhone: string | null;
  bcvRate: number | null;
  proofPath: string | null;
  proofSubmittedAt: string | null;
  status: OrderStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  checkedInAt: string | null;
  checkedInBy: string | null;
  emailStatus: DeliveryStatus;
  whatsappStatus: DeliveryStatus;
  /** Miembro registrado que hizo la reserva (si tenía sesión). */
  memberId: string | null;
  acceptedTermsAt: string | null;
  /** Tasa BCV (USD/EUR) con la que se calcula el monto en bolívares. */
  rateCurrency: RateCurrency | null;
  /** Nota del cliente al reportar el pago (p. ej. coordinación de efectivo). */
  paymentNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Lo que puede ver el cliente con el enlace de su orden (sin datos internos). */
export type PublicOrder = Omit<Order, "proofPath" | "reviewedBy" | "checkedInBy" | "id" | "memberId">;

export function toPublicOrder(o: Order): PublicOrder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { proofPath, reviewedBy, checkedInBy, id, memberId, ...rest } = o;
  return rest;
}

/** Minutos que una orden sin pago reportado retiene sus cupos. */
export const HOLD_MINUTES = 60;
/**
 * Horas que una orden en efectivo ("Ya coordiné la entrega", sin comprobante) retiene sus cupos
 * mientras el admin confirma el pago. Pasado ese tiempo los libera, igual que un apartado vencido.
 */
export const CASH_HOLD_HOURS = 24;

const PROOF_BUCKET = "comprobantes";

/* ─── Cliente ─── */

let admin: SupabaseClient | null | undefined;

/**
 * Cliente de Supabase con la service role key (solo servidor), compartido por todas las capas de datos.
 * Devuelve null si Supabase no está configurado: cada módulo usa entonces su almacén en memoria.
 */
export function getAdminClient(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  admin = url && key && !url.includes("placeholder") ? createClient(url, key, { auth: { persistSession: false } }) : null;
  if (!admin) console.warn("[datos] Supabase no configurado: los datos se guardan en memoria (solo pruebas).");
  return admin;
}

export function isPersistent(): boolean {
  return getAdminClient() !== null;
}

/** Filas por página al leer tablas completas. */
const PAGE_SIZE = 1000;
/** Tope de seguridad (páginas) para no quedar en un bucle si algo falla. */
const MAX_PAGES = 500;

type PageResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/**
 * Lee todas las filas de una consulta paginando con `.range()`. PostgREST corta cada respuesta en
 * `max_rows` (1000 por defecto en Supabase), así que una consulta sin paginar pierde filas en silencio.
 * `page(from, to)` debe construir la consulta con un orden estable (p. ej. por fecha e id).
 * Se avanza por las filas realmente recibidas, por si el servidor usa un `max_rows` menor que la página.
 */
export async function fetchAllRows<T>(page: (from: number, to: number) => PageResult<T>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    const { data, error } = await page(out.length, out.length + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    out.push(...data);
  }
  return out;
}

/* ─── Mapeo fila ↔ objeto ─── */

type Row = Record<string, unknown>;

const FIELDS: [keyof Order, string][] = [
  ["id", "id"], ["code", "code"], ["token", "token"], ["tastingId", "tasting_id"], ["tastingTitle", "tasting_title"],
  ["tastingDate", "tasting_date"], ["tastingTime", "tasting_time"], ["tastingLocation", "tasting_location"],
  ["customerName", "customer_name"], ["customerEmail", "customer_email"], ["customerPhone", "customer_phone"],
  ["customerDocId", "customer_doc_id"], ["spotsCount", "spots_count"], ["dietaryRestrictions", "dietary_restrictions"],
  ["addOns", "add_ons"], ["subtotalUsd", "subtotal_usd"], ["discountUsd", "discount_usd"], ["couponCode", "coupon_code"],
  ["totalUsd", "total_usd"], ["paymentMethod", "payment_method"], ["paymentBank", "payment_bank"],
  ["paymentReference", "payment_reference"], ["paymentAmountBs", "payment_amount_bs"], ["payerBank", "payer_bank"],
  ["payerDocId", "payer_doc_id"], ["payerPhone", "payer_phone"], ["bcvRate", "bcv_rate"], ["proofPath", "proof_path"],
  ["proofSubmittedAt", "proof_submitted_at"], ["status", "status"], ["rejectionReason", "rejection_reason"],
  ["reviewedAt", "reviewed_at"], ["reviewedBy", "reviewed_by"], ["checkedInAt", "checked_in_at"],
  ["checkedInBy", "checked_in_by"], ["emailStatus", "email_status"], ["whatsappStatus", "whatsapp_status"],
  ["memberId", "member_id"], ["acceptedTermsAt", "accepted_terms_at"], ["rateCurrency", "rate_currency"],
  ["paymentNote", "payment_note"], ["createdAt", "created_at"], ["updatedAt", "updated_at"],
];

const NUMERIC: (keyof Order)[] = ["spotsCount", "subtotalUsd", "discountUsd", "totalUsd", "paymentAmountBs", "bcvRate"];

function fromRow(row: Row): Order {
  const o = {} as Record<string, unknown>;
  for (const [k, col] of FIELDS) {
    const v = row[col];
    o[k] = NUMERIC.includes(k) && v !== null && v !== undefined ? Number(v) : v ?? null;
  }
  return o as unknown as Order;
}

function toRow(patch: Partial<Order>): Row {
  const row: Row = {};
  for (const [k, col] of FIELDS) {
    if (k in patch && k !== "createdAt" && k !== "updatedAt") row[col] = patch[k];
  }
  return row;
}

/* ─── Memoria (fallback) ─── */

const mem = globalThis as unknown as { __eoOrders?: Map<string, Order>; __eoProofs?: Map<string, { data: Buffer; type: string }> };
const memOrders = (mem.__eoOrders ??= new Map());
const memProofs = (mem.__eoProofs ??= new Map());

/* ─── Utilidades ─── */

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateOrderCode(): string {
  const bytes = crypto.randomBytes(5);
  return "EO-" + Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function generateToken(): string {
  return crypto.randomBytes(18).toString("base64url");
}

/* ─── Operaciones ─── */

export type NewOrder = Pick<
  Order,
  | "tastingId" | "tastingTitle" | "tastingDate" | "tastingTime" | "tastingLocation"
  | "customerName" | "customerEmail" | "customerPhone" | "customerDocId" | "spotsCount"
  | "dietaryRestrictions" | "addOns" | "subtotalUsd" | "discountUsd" | "couponCode" | "totalUsd"
> &
  Partial<Pick<Order, "memberId" | "acceptedTermsAt" | "rateCurrency">>;

/** Orden nueva (pendiente de pago) con sus valores iniciales, aún sin guardar. */
function buildOrder(input: NewOrder): Order {
  const now = new Date().toISOString();
  return {
    ...input,
    customerEmail: input.customerEmail.trim().toLowerCase(),
    couponCode: input.couponCode ? input.couponCode.trim().toUpperCase() : null,
    memberId: input.memberId ?? null,
    acceptedTermsAt: input.acceptedTermsAt ?? null,
    rateCurrency: input.rateCurrency ?? null,
    paymentNote: null,
    id: crypto.randomUUID(),
    code: generateOrderCode(),
    token: generateToken(),
    paymentMethod: null, paymentBank: null, paymentReference: null, paymentAmountBs: null,
    payerBank: null, payerDocId: null, payerPhone: null, bcvRate: null, proofPath: null, proofSubmittedAt: null,
    status: "pending_payment", rejectionReason: null, reviewedAt: null, reviewedBy: null,
    checkedInAt: null, checkedInBy: null, emailStatus: "not_sent", whatsappStatus: "not_sent",
    createdAt: now, updatedAt: now,
  };
}

async function insertOrder(sb: SupabaseClient, base: Order): Promise<Order> {
  const { data, error } = await sb.from("orders").insert({ ...toRow(base), id: base.id }).select().single();
  if (error) throw new Error(`No se pudo crear la orden: ${error.message}`);
  return fromRow(data);
}

/** Crea la orden sin comprobar cupos ni usos de cupón (ver `createOrderChecked`). */
export async function createOrder(input: NewOrder): Promise<Order> {
  const base = buildOrder(input);
  const sb = getAdminClient();
  if (!sb) {
    memOrders.set(base.id, base);
    return base;
  }
  return insertOrder(sb, base);
}

export type CheckedOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "sold_out"; availableSpots: number }
  | { ok: false; reason: "coupon_exhausted" };

/** Usos vigentes de un cupón (órdenes que aún lo retienen, ver `holdsSpots`). */
async function countCouponUses(code: string): Promise<number> {
  const now = Date.now();
  return (await listCouponOrders(code)).filter((r) => holdsSpots(r, now)).length;
}

let warnedNoRpc = false;

/**
 * Crea la orden solo si caben sus cupos en la cata (`totalSpots`) y, si lleva cupón con `maxUses`,
 * si el cupón aún tiene usos. La comprobación y la inserción son atómicas:
 *  - Supabase: función `create_order_checked` (supabase/v2.sql), que bloquea la cata y el cupón en la transacción.
 *  - Memoria: sin `await` entre el conteo y la inserción.
 * Si la función aún no existe en la base de datos, inserta, vuelve a contar y anula la orden si se pasó.
 */
export async function createOrderChecked(
  input: NewOrder,
  totalSpots: number,
  maxUses: number | null = null
): Promise<CheckedOrderResult> {
  const base = buildOrder(input);
  const coupon = base.couponCode;
  const limitUses = coupon !== null && maxUses !== null;

  const sb = getAdminClient();
  if (!sb) {
    const now = Date.now();
    let held = 0;
    let uses = 0;
    memOrders.forEach((o) => {
      if (!holdsSpots(o, now)) return;
      if (o.tastingId === base.tastingId) held += o.spotsCount;
      if (coupon && o.couponCode?.toUpperCase() === coupon) uses += 1;
    });
    if (held + base.spotsCount > totalSpots) return { ok: false, reason: "sold_out", availableSpots: Math.max(0, totalSpots - held) };
    if (limitUses && uses >= (maxUses as number)) return { ok: false, reason: "coupon_exhausted" };
    memOrders.set(base.id, base);
    return { ok: true, order: base };
  }

  const { data, error } = await sb.rpc("create_order_checked", {
    p_order: { ...toRow(base), id: base.id },
    p_total_spots: totalSpots,
    p_max_uses: limitUses ? maxUses : null,
    p_hold_minutes: HOLD_MINUTES,
    p_cash_hold_hours: CASH_HOLD_HOURS,
  });
  if (!error) return { ok: true, order: fromRow((Array.isArray(data) ? data[0] : data) as Row) };
  if (error.message === "EO_SOLD_OUT") {
    return { ok: false, reason: "sold_out", availableSpots: Math.max(0, Math.floor(Number(error.details)) || 0) };
  }
  if (error.message === "EO_COUPON_EXHAUSTED") return { ok: false, reason: "coupon_exhausted" };
  // PGRST202 / 42883: la función no está creada (falta ejecutar supabase/v2.sql).
  if (error.code !== "PGRST202" && error.code !== "42883") throw new Error(`No se pudo crear la orden: ${error.message}`);

  if (!warnedNoRpc) {
    warnedNoRpc = true;
    console.warn("[orders] Falta la función create_order_checked (supabase/v2.sql): se usa insertar y volver a contar.");
  }
  const order = await insertOrder(sb, base);
  const [held, uses] = await Promise.all([
    heldSpotsByTasting([order.tastingId]).then((h) => h[order.tastingId] ?? 0),
    limitUses ? countCouponUses(coupon as string) : Promise.resolve(0),
  ]);
  const overSpots = held > totalSpots;
  const overUses = limitUses && uses > (maxUses as number);
  if (!overSpots && !overUses) return { ok: true, order };
  // Otra compra simultánea tomó lo último: se anula esta para no vender de más (el cliente puede reintentar).
  await updateOrder(order.id, { status: "cancelled", reviewedAt: new Date().toISOString(), reviewedBy: "Sistema" });
  return overSpots
    ? { ok: false, reason: "sold_out", availableSpots: Math.max(0, totalSpots - (held - order.spotsCount)) }
    : { ok: false, reason: "coupon_exhausted" };
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  if (!token) return null;
  const sb = getAdminClient();
  if (!sb) return Array.from(memOrders.values()).find((o) => o.token === token) ?? null;
  const { data } = await sb.from("orders").select("*").eq("token", token).maybeSingle();
  return data ? fromRow(data) : null;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const sb = getAdminClient();
  if (!sb) return memOrders.get(id) ?? null;
  const { data } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  return data ? fromRow(data) : null;
}

/** Busca por token, código corto (EO-XXXXX) o una URL que termine en el token. */
export async function findOrderForCheckin(input: string): Promise<Order | null> {
  const raw = input.trim();
  const last = raw.split("/").filter(Boolean).pop() ?? raw;
  const code = last.replace(/^#/, "").toUpperCase();
  if (/^EO-[A-Z0-9]{5}$/.test(code)) {
    const sb = getAdminClient();
    if (!sb) return Array.from(memOrders.values()).find((o) => o.code === code) ?? null;
    const { data } = await sb.from("orders").select("*").eq("code", code).maybeSingle();
    return data ? fromRow(data) : null;
  }
  return getOrderByToken(last);
}

export async function listOrders(): Promise<Order[]> {
  const sb = getAdminClient();
  if (!sb) return Array.from(memOrders.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rows = await fetchAllRows<Row>((from, to) =>
    sb.from("orders").select("*").order("created_at", { ascending: false }).order("id", { ascending: true }).range(from, to)
  );
  return rows.map(fromRow);
}

/** Órdenes de un correo (sin distinguir mayúsculas), las más recientes primero. */
export async function listOrdersByEmail(email: string): Promise<Order[]> {
  const target = email.trim().toLowerCase();
  if (!target) return [];
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memOrders.values())
      .filter((o) => o.customerEmail.toLowerCase() === target)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  // ilike sin comodines: se escapan "%", "_" y "\\" para que la comparación sea exacta.
  const pattern = target.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .ilike("customer_email", pattern)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Órdenes hechas con la sesión de un miembro, las más recientes primero. */
export async function listOrdersByMember(memberId: string): Promise<Order[]> {
  if (!memberId) return [];
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memOrders.values())
      .filter((o) => o.memberId === memberId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Resumen mínimo de las órdenes que usaron un cupón (para límites de uso y reportes). */
export interface CouponOrderRow {
  couponCode: string;
  status: OrderStatus;
  spotsCount: number;
  totalUsd: number;
  createdAt: string;
  paymentMethod: string | null;
  proofSubmittedAt: string | null;
}

export async function listCouponOrders(code?: string): Promise<CouponOrderRow[]> {
  const target = code?.trim().toUpperCase();
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memOrders.values())
      .filter((o) => o.couponCode && (!target || o.couponCode.toUpperCase() === target))
      .map((o) => ({
        couponCode: (o.couponCode as string).toUpperCase(),
        status: o.status,
        spotsCount: o.spotsCount,
        totalUsd: o.totalUsd,
        createdAt: o.createdAt,
        paymentMethod: o.paymentMethod,
        proofSubmittedAt: o.proofSubmittedAt,
      }));
  }
  const rows = await fetchAllRows<Row>((from, to) => {
    let query = sb
      .from("orders")
      .select("id, coupon_code, status, spots_count, total_usd, created_at, payment_method, proof_submitted_at")
      .not("coupon_code", "is", null);
    if (target) query = query.eq("coupon_code", target);
    return query.order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, to);
  });
  return rows.map((r) => ({
    couponCode: String(r.coupon_code).toUpperCase(),
    status: r.status as OrderStatus,
    spotsCount: Number(r.spots_count),
    totalUsd: Number(r.total_usd),
    createdAt: String(r.created_at),
    paymentMethod: (r.payment_method as string | null) ?? null,
    proofSubmittedAt: (r.proof_submitted_at as string | null) ?? null,
  }));
}

/** Datos de una orden que deciden si sigue reteniendo cupos (y usos de cupón). */
export interface HoldInfo {
  status: OrderStatus;
  createdAt: string;
  paymentMethod?: string | null;
  proofSubmittedAt?: string | null;
}

/**
 * La orden dejó de retener cupos (y usos de cupón) porque venció su apartado:
 *  - pendiente de pago con más de HOLD_MINUTES desde que se creó;
 *  - en revisión por efectivo (sin comprobante) con más de CASH_HOLD_HOURS desde que se reportó.
 */
export function holdExpired(o: HoldInfo, now = Date.now()): boolean {
  if (o.status === "pending_payment") return Date.parse(o.createdAt) + HOLD_MINUTES * 60_000 < now;
  if (o.status === "in_review" && o.paymentMethod === "efectivo") {
    const since = o.proofSubmittedAt ? Date.parse(o.proofSubmittedAt) : NaN;
    return !(since + CASH_HOLD_HOURS * 3_600_000 >= now);
  }
  return false;
}

/** La orden ocupa cupos de su cata: aprobada, o en revisión / pendiente sin vencer. */
export function holdsSpots(o: HoldInfo, now = Date.now()): boolean {
  if (o.status === "approved") return true;
  return (o.status === "in_review" || o.status === "pending_payment") && !holdExpired(o, now);
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order> {
  const sb = getAdminClient();
  if (!sb) {
    const current = memOrders.get(id);
    if (!current) throw new Error("Orden no encontrada");
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    memOrders.set(id, next);
    return next;
  }
  const { data, error } = await sb.from("orders").update(toRow(patch)).eq("id", id).select().single();
  if (error) {
    if (error.code === "23505") throw new Error("Esa referencia de pago ya fue registrada en otra orden.");
    throw new Error(error.message);
  }
  return fromRow(data);
}

/**
 * Cambio de estado condicionado: aplica `patch` solo si la orden sigue en uno de los estados `from`
 * (compare-and-set). Devuelve null si otra petición la cambió antes (aprobación y anulación simultáneas,
 * doble envío del comprobante, etc.), para responder 409 sin efectos secundarios.
 */
export async function transitionOrder(id: string, from: OrderStatus[], patch: Partial<Order>): Promise<Order | null> {
  if (!from.length) return null;
  const sb = getAdminClient();
  if (!sb) {
    const current = memOrders.get(id);
    if (!current || !from.includes(current.status)) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    memOrders.set(id, next);
    return next;
  }
  const { data, error } = await sb.from("orders").update(toRow(patch)).eq("id", id).in("status", from).select().maybeSingle();
  if (error) {
    if (error.code === "23505") throw new Error("Esa referencia de pago ya fue registrada en otra orden.");
    throw new Error(error.message);
  }
  return data ? fromRow(data) : null;
}

/**
 * Check-in atómico: solo marca la orden si estaba aprobada y sin usar.
 * Devuelve null si otra persona la validó primero.
 */
export async function markCheckedIn(id: string, by: string): Promise<Order | null> {
  const now = new Date().toISOString();
  const sb = getAdminClient();
  if (!sb) {
    const o = memOrders.get(id);
    if (!o || o.status !== "approved" || o.checkedInAt) return null;
    return updateOrder(id, { checkedInAt: now, checkedInBy: by });
  }
  const { data } = await sb
    .from("orders")
    .update({ checked_in_at: now, checked_in_by: by })
    .eq("id", id)
    .eq("status", "approved")
    .is("checked_in_at", null)
    .select()
    .maybeSingle();
  return data ? fromRow(data) : null;
}

export async function referenceInUse(reference: string, exceptId: string): Promise<boolean> {
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memOrders.values()).some(
      (o) => o.id !== exceptId && o.paymentReference === reference && (o.status === "in_review" || o.status === "approved")
    );
  }
  const { data } = await sb
    .from("orders")
    .select("id")
    .eq("payment_reference", reference)
    .in("status", ["in_review", "approved"])
    .neq("id", exceptId)
    .limit(1);
  return Boolean(data && data.length);
}

/* ─── Copia de los datos de la cata en cada orden ─── */

/** Lo que cada orden guarda de su cata (lo que muestran la entrada, el correo, WhatsApp, la puerta y el export). */
export type TastingSnapshot = Pick<Order, "tastingTitle" | "tastingDate" | "tastingTime" | "tastingLocation">;

export function tastingSnapshot(
  t: Pick<Tasting, "title" | "dateFull" | "dateDisplay" | "timeStart" | "timeEnd" | "location">
): TastingSnapshot {
  return {
    tastingTitle: t.title,
    tastingDate: t.dateFull || t.dateDisplay,
    tastingTime: t.timeEnd ? `${t.timeStart} – ${t.timeEnd}` : t.timeStart,
    tastingLocation: t.location,
  };
}

const SNAPSHOT_KEYS: (keyof TastingSnapshot)[] = ["tastingTitle", "tastingDate", "tastingTime", "tastingLocation"];

/**
 * Actualiza la copia de la cata en sus órdenes (p. ej. al reprogramarla) para que la entrada, el reenvío,
 * la puerta y el export muestren la fecha y el lugar vigentes. Devuelve cuántas órdenes cambiaron.
 */
export async function syncOrdersWithTasting(tastingId: string, snapshot: TastingSnapshot): Promise<number> {
  const differs = (o: TastingSnapshot) => SNAPSHOT_KEYS.some((k) => o[k] !== snapshot[k]);
  const sb = getAdminClient();
  if (!sb) {
    const now = new Date().toISOString();
    let changed = 0;
    memOrders.forEach((o) => {
      if (o.tastingId !== tastingId || !differs(o)) return;
      memOrders.set(o.id, { ...o, ...snapshot, updatedAt: now });
      changed += 1;
    });
    return changed;
  }
  const rows = await fetchAllRows<Row>((from, to) =>
    sb
      .from("orders")
      .select("id, tasting_title, tasting_date, tasting_time, tasting_location")
      .eq("tasting_id", tastingId)
      .order("id", { ascending: true })
      .range(from, to)
  );
  const ids = rows
    .filter((r) =>
      differs({
        tastingTitle: String(r.tasting_title),
        tastingDate: String(r.tasting_date),
        tastingTime: String(r.tasting_time),
        tastingLocation: String(r.tasting_location),
      })
    )
    .map((r) => String(r.id));
  for (let i = 0; i < ids.length; i += 150) {
    const { error } = await sb.from("orders").update(toRow(snapshot)).in("id", ids.slice(i, i + 150));
    if (error) throw new Error(error.message);
  }
  return ids.length;
}

/**
 * Cupos ocupados por cata (ver `holdsSpots`). Con `tastingIds` solo se leen las órdenes de esas catas;
 * sin él, las de todas (paginado, para no perder filas por el tope de PostgREST).
 */
export async function heldSpotsByTasting(tastingIds?: string[]): Promise<Record<string, number>> {
  const ids = tastingIds ? Array.from(new Set(tastingIds.filter(Boolean))) : null;
  const held: Record<string, number> = {};
  if (ids && !ids.length) return held;

  const now = Date.now();
  const add = (o: HoldInfo & { tastingId: string; spotsCount: number }) => {
    if (holdsSpots(o, now)) held[o.tastingId] = (held[o.tastingId] ?? 0) + Number(o.spotsCount);
  };

  const sb = getAdminClient();
  if (!sb) {
    const only = ids ? new Set(ids) : null;
    memOrders.forEach((o) => {
      if (!only || only.has(o.tastingId)) add(o);
    });
    return held;
  }

  const read = (chunk: string[] | null) =>
    fetchAllRows<Row>((from, to) => {
      let query = sb
        .from("orders")
        .select("id, tasting_id, spots_count, status, created_at, payment_method, proof_submitted_at")
        .in("status", ["pending_payment", "in_review", "approved"]);
      if (chunk) query = query.in("tasting_id", chunk);
      return query.order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, to);
    });

  const rows: Row[] = [];
  if (!ids) rows.push(...(await read(null)));
  // Lotes para no exceder el largo de la URL de PostgREST.
  else for (let i = 0; i < ids.length; i += 150) rows.push(...(await read(ids.slice(i, i + 150))));

  for (const r of rows) {
    add({
      tastingId: String(r.tasting_id),
      spotsCount: Number(r.spots_count),
      status: r.status as OrderStatus,
      createdAt: String(r.created_at),
      paymentMethod: (r.payment_method as string | null) ?? null,
      proofSubmittedAt: (r.proof_submitted_at as string | null) ?? null,
    });
  }
  return held;
}

/* ─── Comprobantes ─── */

export async function uploadProof(orderId: string, data: Buffer, contentType: string, ext: string): Promise<string> {
  const path = `${orderId}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const sb = getAdminClient();
  if (!sb) {
    memProofs.set(path, { data, type: contentType });
    return path;
  }
  const { error } = await sb.storage.from(PROOF_BUCKET).upload(path, data, { contentType, upsert: false });
  if (error) throw new Error(`No se pudo guardar el comprobante: ${error.message}`);
  return path;
}

/** Enlace temporal (10 min) para que el admin vea el comprobante. */
export async function proofUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const sb = getAdminClient();
  if (!sb) {
    const f = memProofs.get(path);
    return f ? `data:${f.type};base64,${f.data.toString("base64")}` : null;
  }
  const { data } = await sb.storage.from(PROOF_BUCKET).createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

/* ─── Cola del bot de WhatsApp ─── */

/** Órdenes aprobadas con el WhatsApp de la entrada en cola, las más antiguas primero. */
export async function listWhatsAppQueue(limit = 10): Promise<Order[]> {
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memOrders.values())
      .filter((o) => o.status === "approved" && o.whatsappStatus === "queued")
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .slice(0, limit);
  }
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .eq("status", "approved")
    .eq("whatsapp_status", "queued")
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function countWhatsAppQueue(): Promise<number> {
  const sb = getAdminClient();
  if (!sb) return Array.from(memOrders.values()).filter((o) => o.status === "approved" && o.whatsappStatus === "queued").length;
  const { count } = await sb
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("whatsapp_status", "queued");
  return count ?? 0;
}

/* ─── Ajustes clave/valor (latido del bot) ─── */

const memKv = ((globalThis as unknown as { __eoKv?: Map<string, unknown> }).__eoKv ??= new Map());

export async function setSetting(key: string, value: unknown): Promise<void> {
  const sb = getAdminClient();
  if (!sb) {
    memKv.set(key, value);
    return;
  }
  await sb.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() });
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const sb = getAdminClient();
  if (!sb) return (memKv.get(key) as T) ?? null;
  const { data } = await sb.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? null;
}

/* ─── Entradas: un QR por persona (tabla public.tickets) ─── */

export interface Ticket {
  id: string;
  orderId: string;
  /** 1..spotsCount dentro de la orden. */
  number: number;
  /** Secreto del QR de esta entrada. */
  token: string;
  /** Código visible, ej. EO-7KQ2M-2. */
  code: string;
  attendeeName: string | null;
  checkedInAt: string | null;
  checkedInBy: string | null;
  createdAt: string;
}

/** Máximo de caracteres del nombre opcional de cada asistente. */
export const ATTENDEE_NAME_MAX = 80;

const memTickets = ((globalThis as unknown as { __eoTickets?: Map<string, Ticket> }).__eoTickets ??= new Map());

function ticketFromRow(row: Row): Ticket {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    number: Number(row.number),
    token: String(row.token),
    code: String(row.code),
    attendeeName: (row.attendee_name as string | null) ?? null,
    checkedInAt: (row.checked_in_at as string | null) ?? null,
    checkedInBy: (row.checked_in_by as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

const byOrderAndNumber = (a: Ticket, b: Ticket) => a.orderId.localeCompare(b.orderId) || a.number - b.number;

export const ticketCode = (order: Pick<Order, "code">, number: number) => `${order.code}-${number}`;

/**
 * Crea las entradas que falten (1..spotsCount) y devuelve todas las de la orden.
 * Idempotente: llamarla varias veces (aprobación, reenvío) no duplica entradas.
 */
export async function ensureTickets(order: Pick<Order, "id" | "code" | "spotsCount">): Promise<Ticket[]> {
  const existing = await listTickets(order.id);
  const have = new Set(existing.map((t) => t.number));
  const missing: Ticket[] = [];
  const now = new Date().toISOString();
  for (let n = 1; n <= order.spotsCount; n++) {
    if (have.has(n)) continue;
    missing.push({
      id: crypto.randomUUID(),
      orderId: order.id,
      number: n,
      token: generateToken(),
      code: ticketCode(order, n),
      attendeeName: null,
      checkedInAt: null,
      checkedInBy: null,
      createdAt: now,
    });
  }
  if (!missing.length) return existing;

  const sb = getAdminClient();
  if (!sb) {
    for (const t of missing) memTickets.set(t.id, t);
    return listTickets(order.id);
  }
  const { error } = await sb.from("tickets").upsert(
    missing.map((t) => ({ id: t.id, order_id: t.orderId, number: t.number, token: t.token, code: t.code })),
    { onConflict: "order_id,number", ignoreDuplicates: true }
  );
  if (error) throw new Error(`No se pudieron crear las entradas: ${error.message}`);
  // Se relee: si otra petición creó alguna a la vez, prevalece la guardada.
  return listTickets(order.id);
}

export async function listTickets(orderId: string): Promise<Ticket[]> {
  const sb = getAdminClient();
  if (!sb) return Array.from(memTickets.values()).filter((t) => t.orderId === orderId).sort(byOrderAndNumber);
  const { data, error } = await sb.from("tickets").select("*").eq("order_id", orderId).order("number", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(ticketFromRow);
}

/** Entradas de varias órdenes (orden por orderId y número). */
export async function listTicketsByOrders(orderIds: string[]): Promise<Ticket[]> {
  const ids = Array.from(new Set(orderIds.filter(Boolean)));
  if (!ids.length) return [];
  const sb = getAdminClient();
  if (!sb) {
    const set = new Set(ids);
    return Array.from(memTickets.values()).filter((t) => set.has(t.orderId)).sort(byOrderAndNumber);
  }
  const out: Ticket[] = [];
  // Lotes para no exceder el largo de la URL de PostgREST.
  for (let i = 0; i < ids.length; i += 150) {
    const { data, error } = await sb.from("tickets").select("*").in("order_id", ids.slice(i, i + 150));
    if (error) throw new Error(error.message);
    out.push(...(data ?? []).map(ticketFromRow));
  }
  return out.sort(byOrderAndNumber);
}

const TICKET_CODE_RE = /^EO-[A-Z0-9]{5}-\d{1,2}$/;

/** Busca una entrada por su token, su código (EO-XXXXX-n) o una URL que termine en el token. */
export async function findTicket(input: string): Promise<Ticket | null> {
  const raw = (input ?? "").trim().split(/[?#]/)[0];
  if (!raw) return null;
  const last = raw.split("/").filter(Boolean).pop() ?? raw;
  const code = last.replace(/^#/, "").toUpperCase();
  const byCode = TICKET_CODE_RE.test(code);
  if (!byCode && !/^[A-Za-z0-9_-]{16,64}$/.test(last)) return null;

  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memTickets.values()).find((t) => (byCode ? t.code === code : t.token === last)) ?? null;
  }
  const { data } = await sb
    .from("tickets")
    .select("*")
    .eq(byCode ? "code" : "token", byCode ? code : last)
    .maybeSingle();
  return data ? ticketFromRow(data) : null;
}

/**
 * Check-in atómico de una entrada: solo la marca si no se había usado.
 * Devuelve null si ya estaba validada (o si otra persona la validó primero).
 * También deja constancia en la orden con la hora del primer ingreso.
 */
export async function markTicketCheckedIn(ticketId: string, by: string): Promise<Ticket | null> {
  const now = new Date().toISOString();
  const sb = getAdminClient();
  if (!sb) {
    const t = memTickets.get(ticketId);
    if (!t || t.checkedInAt) return null;
    const used: Ticket = { ...t, checkedInAt: now, checkedInBy: by };
    memTickets.set(ticketId, used);
    const o = memOrders.get(used.orderId);
    if (o && !o.checkedInAt) memOrders.set(o.id, { ...o, checkedInAt: now, checkedInBy: by, updatedAt: now });
    return used;
  }
  const { data } = await sb
    .from("tickets")
    .update({ checked_in_at: now, checked_in_by: by })
    .eq("id", ticketId)
    .is("checked_in_at", null)
    .select()
    .maybeSingle();
  if (!data) return null;
  const ticket = ticketFromRow(data);
  await sb
    .from("orders")
    .update({ checked_in_at: now, checked_in_by: by })
    .eq("id", ticket.orderId)
    .is("checked_in_at", null);
  return ticket;
}

/** Nombre opcional del asistente (recortado a 80 caracteres; vacío → sin nombre). */
export async function setTicketAttendee(ticketId: string, name: string | null): Promise<Ticket> {
  const clean = (name ?? "").replace(/\s+/g, " ").trim().slice(0, ATTENDEE_NAME_MAX) || null;
  const sb = getAdminClient();
  if (!sb) {
    const t = memTickets.get(ticketId);
    if (!t) throw new Error("Entrada no encontrada");
    const next = { ...t, attendeeName: clean };
    memTickets.set(ticketId, next);
    return next;
  }
  const { data, error } = await sb.from("tickets").update({ attendee_name: clean }).eq("id", ticketId).select().maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Entrada no encontrada");
  return ticketFromRow(data);
}

/** Totales para el panel: entradas vigentes (de órdenes aprobadas) y escaneadas. */
export async function ticketStats(): Promise<{ issued: number; checkedIn: number }> {
  const sb = getAdminClient();
  if (!sb) {
    // Las entradas de órdenes anuladas o rechazadas siguen en la tabla, pero ya no valen.
    const valid = Array.from(memTickets.values()).filter((t) => memOrders.get(t.orderId)?.status === "approved");
    return { issued: valid.length, checkedIn: valid.filter((t) => t.checkedInAt).length };
  }
  const approvedTickets = () =>
    sb.from("tickets").select("id, orders!inner(status)", { count: "exact", head: true }).eq("orders.status", "approved");
  const [issued, checkedIn] = await Promise.all([approvedTickets(), approvedTickets().not("checked_in_at", "is", null)]);
  if (issued.error) throw new Error(issued.error.message);
  if (checkedIn.error) throw new Error(checkedIn.error.message);
  return { issued: issued.count ?? 0, checkedIn: checkedIn.count ?? 0 };
}
