import "server-only";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { RateCurrency } from "@/types";

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

export async function createOrder(input: NewOrder): Promise<Order> {
  const now = new Date().toISOString();
  const base: Order = {
    ...input,
    customerEmail: input.customerEmail.trim().toLowerCase(),
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

  const sb = getAdminClient();
  if (!sb) {
    memOrders.set(base.id, base);
    return base;
  }
  const { data, error } = await sb.from("orders").insert({ ...toRow(base), id: base.id }).select().single();
  if (error) throw new Error(`No se pudo crear la orden: ${error.message}`);
  return fromRow(data);
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
  const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
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
      }));
  }
  let query = sb.from("orders").select("coupon_code, status, spots_count, total_usd, created_at").not("coupon_code", "is", null);
  if (target) query = query.eq("coupon_code", target);
  const { data, error } = await query.limit(10000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    couponCode: String(r.coupon_code).toUpperCase(),
    status: r.status as OrderStatus,
    spotsCount: Number(r.spots_count),
    totalUsd: Number(r.total_usd),
    createdAt: String(r.created_at),
  }));
}

/** Una orden pendiente de pago deja de retener cupos (y usos de cupón) al vencer su apartado. */
export function holdExpired(o: { status: OrderStatus; createdAt: string }, now = Date.now()): boolean {
  return o.status === "pending_payment" && Date.parse(o.createdAt) + HOLD_MINUTES * 60_000 < now;
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

/** Cupos ocupados por cata: aprobadas, en revisión y pendientes recientes. */
export async function heldSpotsByTasting(): Promise<Record<string, number>> {
  const cutoff = new Date(Date.now() - HOLD_MINUTES * 60_000).toISOString();
  const sb = getAdminClient();
  let rows: { tasting_id: string; spots_count: number; status: string; created_at: string }[];
  if (!sb) {
    rows = Array.from(memOrders.values()).map((o) => ({
      tasting_id: o.tastingId, spots_count: o.spotsCount, status: o.status, created_at: o.createdAt,
    }));
  } else {
    const { data, error } = await sb
      .from("orders")
      .select("tasting_id, spots_count, status, created_at")
      .in("status", ["pending_payment", "in_review", "approved"]);
    if (error) throw new Error(error.message);
    rows = data ?? [];
  }
  const held: Record<string, number> = {};
  for (const r of rows) {
    const counts = r.status === "approved" || r.status === "in_review" || (r.status === "pending_payment" && r.created_at >= cutoff);
    if (counts) held[r.tasting_id] = (held[r.tasting_id] ?? 0) + Number(r.spots_count);
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

/** Totales para el panel: entradas emitidas y escaneadas. */
export async function ticketStats(): Promise<{ issued: number; checkedIn: number }> {
  const sb = getAdminClient();
  if (!sb) {
    const all = Array.from(memTickets.values());
    return { issued: all.length, checkedIn: all.filter((t) => t.checkedInAt).length };
  }
  const [issued, checkedIn] = await Promise.all([
    sb.from("tickets").select("id", { count: "exact", head: true }),
    sb.from("tickets").select("id", { count: "exact", head: true }).not("checked_in_at", "is", null),
  ]);
  return { issued: issued.count ?? 0, checkedIn: checkedIn.count ?? 0 };
}
