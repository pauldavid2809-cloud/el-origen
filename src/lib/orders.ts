import "server-only";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* ─────────────────────────────────────────────────────────────
   Órdenes de reserva con pago verificado (tabla public.orders).
   Usa Supabase con la service role key; sin ella, guarda en memoria
   (solo sirve para probar en local: se pierde al reiniciar).
   ───────────────────────────────────────────────────────────── */

export type OrderStatus = "pending_payment" | "in_review" | "approved" | "rejected" | "cancelled";
/** queued: esperando que el bot de WhatsApp lo envíe. */
export type DeliveryStatus = "not_sent" | "queued" | "sent" | "failed" | "disabled";

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
  createdAt: string;
  updatedAt: string;
}

/** Lo que puede ver el cliente con el enlace de su orden (sin datos internos). */
export type PublicOrder = Omit<Order, "proofPath" | "reviewedBy" | "checkedInBy" | "id">;

export function toPublicOrder(o: Order): PublicOrder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { proofPath, reviewedBy, checkedInBy, id, ...rest } = o;
  return rest;
}

/** Minutos que una orden sin pago reportado retiene sus cupos. */
export const HOLD_MINUTES = 60;

const PROOF_BUCKET = "comprobantes";

/* ─── Cliente ─── */

let admin: SupabaseClient | null | undefined;

function getAdminClient(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  admin = url && key && !url.includes("placeholder") ? createClient(url, key, { auth: { persistSession: false } }) : null;
  if (!admin) console.warn("[orders] Supabase no configurado: las órdenes se guardan en memoria (solo pruebas).");
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
  ["createdAt", "created_at"], ["updatedAt", "updated_at"],
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
>;

export async function createOrder(input: NewOrder): Promise<Order> {
  const now = new Date().toISOString();
  const base: Order = {
    ...input,
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
