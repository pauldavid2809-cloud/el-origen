import "server-only";
import { getAdminClient, holdExpired, listCouponOrders } from "./orders";
import { getMemberByEmail } from "./members";

/* ─────────────────────────────────────────────────────────────
   Cupones de descuento (tabla public.coupons), administrables desde el panel.
   Cada cupón puede tener un "referente" (id de sommelier o texto) para medir
   clientes referidos e impacto.
   ───────────────────────────────────────────────────────────── */

export interface Coupon {
  code: string; // MAYÚSCULAS
  discountPercent: number;
  description: string;
  /** Id de sommelier (`src/lib/team.ts`) o texto libre. */
  referrer: string | null;
  /** Solo para correos registrados como miembros. */
  membersOnly: boolean;
  /** Usos máximos (órdenes no anuladas/rechazadas); null = sin límite. */
  maxUses: number | null;
  active: boolean;
  createdAt: string;
}

export type CouponInput = Omit<Coupon, "createdAt"> & { createdAt?: string };

export type CouponRejection = "not_found" | "inactive" | "members_only" | "exhausted";

export type CouponValidation =
  | { ok: true; coupon: Coupon }
  | { ok: false; reason: string; code: CouponRejection };

export interface CouponUsage {
  orders: number;
  spots: number;
  revenueUsd: number;
}

/** Error de validación (mensaje apto para mostrar en el panel → responder 400). */
export class CouponInputError extends Error {}

/** Cupón de bienvenida para los primeros registros (el % definitivo lo define el cliente). */
export const WELCOME_COUPON_CODE = "2ORIGEN";

const WELCOME_COUPON: Coupon = {
  code: WELCOME_COUPON_CODE,
  // PENDIENTE CLIENTE: porcentaje definitivo del cupón 2ORIGEN (sembrado inactivo con 10 % provisional).
  discountPercent: 10,
  description: "Bienvenida para nuevos registros — % por definir",
  referrer: null,
  membersOnly: true,
  maxUses: null,
  active: false,
  createdAt: new Date(0).toISOString(),
};

/* ─── Normalización ─── */

export function normalizeCouponCode(code: string): string {
  return (code ?? "").trim().toUpperCase();
}

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;

function normalizeCoupon(c: CouponInput): Omit<Coupon, "createdAt"> {
  const code = normalizeCouponCode(c.code);
  if (!CODE_RE.test(code)) {
    throw new CouponInputError("El código debe tener de 2 a 30 caracteres: letras, números, guion o guion bajo.");
  }
  const discountPercent = Math.round(Number(c.discountPercent) * 100) / 100;
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
    throw new CouponInputError("El descuento debe ser un porcentaje mayor que 0 y hasta 100.");
  }
  let maxUses: number | null = null;
  if (c.maxUses !== null && c.maxUses !== undefined && String(c.maxUses) !== "") {
    maxUses = Number(c.maxUses);
    if (!Number.isInteger(maxUses) || maxUses < 1) throw new CouponInputError("Los usos máximos deben ser un entero mayor que 0.");
  }
  const referrer = typeof c.referrer === "string" ? c.referrer.replace(/\s+/g, " ").trim().slice(0, 80) : "";
  return {
    code,
    discountPercent,
    description: typeof c.description === "string" ? c.description.replace(/\s+/g, " ").trim().slice(0, 200) : "",
    referrer: referrer || null,
    membersOnly: c.membersOnly === true,
    maxUses,
    active: c.active !== false,
  };
}

/* ─── Mapeo fila ↔ objeto ─── */

type Row = Record<string, unknown>;

function fromRow(row: Row): Coupon {
  return {
    code: String(row.code).toUpperCase(),
    discountPercent: Number(row.discount_percent ?? 0),
    description: String(row.description ?? ""),
    referrer: (row.referrer as string | null) ?? null,
    membersOnly: Boolean(row.members_only),
    maxUses: row.max_uses === null || row.max_uses === undefined ? null : Number(row.max_uses),
    active: Boolean(row.active),
    createdAt: String(row.created_at ?? ""),
  };
}

/* ─── Memoria (fallback; incluye la semilla 2ORIGEN como en supabase/v2.sql) ─── */

const memCoupons = ((globalThis as unknown as { __eoCoupons?: Map<string, Coupon> }).__eoCoupons ??= new Map([
  [WELCOME_COUPON.code, { ...WELCOME_COUPON, createdAt: new Date().toISOString() }],
]));

/* ─── Operaciones ─── */

export async function listCoupons(): Promise<Coupon[]> {
  const sb = getAdminClient();
  if (!sb) return Array.from(memCoupons.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { data, error } = await sb.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getCoupon(code: string): Promise<Coupon | null> {
  const key = normalizeCouponCode(code);
  if (!key) return null;
  const sb = getAdminClient();
  if (!sb) return memCoupons.get(key) ?? null;
  const { data } = await sb.from("coupons").select("*").eq("code", key).maybeSingle();
  return data ? fromRow(data) : null;
}

/** Crea o actualiza un cupón (por código). Lanza `CouponInputError` si los datos no son válidos. */
export async function upsertCoupon(c: CouponInput): Promise<Coupon> {
  const clean = normalizeCoupon(c);
  const sb = getAdminClient();
  if (!sb) {
    const createdAt = memCoupons.get(clean.code)?.createdAt ?? new Date().toISOString();
    const saved: Coupon = { ...clean, createdAt };
    memCoupons.set(clean.code, saved);
    return saved;
  }
  const { data, error } = await sb
    .from("coupons")
    .upsert(
      {
        code: clean.code,
        discount_percent: clean.discountPercent,
        description: clean.description,
        referrer: clean.referrer,
        members_only: clean.membersOnly,
        max_uses: clean.maxUses,
        active: clean.active,
      },
      { onConflict: "code" }
    )
    .select()
    .single();
  if (error) throw new Error(`No se pudo guardar el cupón: ${error.message}`);
  return fromRow(data);
}

export async function deleteCoupon(code: string): Promise<boolean> {
  const key = normalizeCouponCode(code);
  const sb = getAdminClient();
  if (!sb) return memCoupons.delete(key);
  const { data, error } = await sb.from("coupons").delete().eq("code", key).select("code");
  if (error) throw new Error(error.message);
  return Boolean(data && data.length);
}

/** Usos que cuentan para el límite: órdenes no anuladas ni rechazadas, ni apartados vencidos. */
async function countActiveUses(code: string): Promise<number> {
  const now = Date.now();
  const rows = await listCouponOrders(code);
  return rows.filter((r) => r.status !== "rejected" && r.status !== "cancelled" && !holdExpired(r, now)).length;
}

/**
 * Valida un cupón para un correo: activo, con usos disponibles y, si es solo para miembros,
 * que el correo pertenezca a una cuenta registrada.
 */
export async function validateCouponForEmail(code: string, email: string): Promise<CouponValidation> {
  const coupon = await getCoupon(code);
  if (!coupon) return { ok: false, code: "not_found", reason: "El cupón no existe." };
  if (!coupon.active) return { ok: false, code: "inactive", reason: "El cupón no está activo." };
  if (coupon.membersOnly && !(await getMemberByEmail(email))) {
    return {
      ok: false,
      code: "members_only",
      reason: "Este cupón es solo para miembros registrados. Crea tu Cuenta Origen con este correo para usarlo.",
    };
  }
  if (coupon.maxUses !== null && (await countActiveUses(coupon.code)) >= coupon.maxUses) {
    return { ok: false, code: "exhausted", reason: "El cupón ya alcanzó su límite de usos." };
  }
  return { ok: true, coupon };
}

/** Descuento en USD (2 decimales) que aplica un cupón sobre un subtotal. */
export function couponDiscountUsd(coupon: Pick<Coupon, "discountPercent">, subtotalUsd: number): number {
  return Math.round(subtotalUsd * coupon.discountPercent) / 100;
}

/** Uso por cupón (solo órdenes aprobadas): órdenes, cupos y ventas en USD. */
export async function couponUsage(): Promise<Record<string, CouponUsage>> {
  const usage: Record<string, CouponUsage> = {};
  for (const r of await listCouponOrders()) {
    if (r.status !== "approved") continue;
    const u = (usage[r.couponCode] ??= { orders: 0, spots: 0, revenueUsd: 0 });
    u.orders += 1;
    u.spots += r.spotsCount;
    u.revenueUsd = Math.round((u.revenueUsd + r.totalUsd) * 100) / 100;
  }
  return usage;
}

/** Uso agregado por referente (sommelier o texto), a partir de los cupones que lo tienen asignado. */
export async function referrerUsage(): Promise<Record<string, CouponUsage & { coupons: string[] }>> {
  const [coupons, usage] = await Promise.all([listCoupons(), couponUsage()]);
  const out: Record<string, CouponUsage & { coupons: string[] }> = {};
  for (const c of coupons) {
    if (!c.referrer) continue;
    const agg = (out[c.referrer] ??= { orders: 0, spots: 0, revenueUsd: 0, coupons: [] });
    const u = usage[c.code];
    agg.coupons.push(c.code);
    if (!u) continue;
    agg.orders += u.orders;
    agg.spots += u.spots;
    agg.revenueUsd = Math.round((agg.revenueUsd + u.revenueUsd) * 100) / 100;
  }
  return out;
}
