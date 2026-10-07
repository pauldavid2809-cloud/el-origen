import "server-only";
import { NextResponse } from "next/server";
import { getCoupon, WELCOME_COUPON_CODE } from "@/lib/coupons";

/* Utilidades comunes de las rutas de miembros: límite de intentos en memoria, IP del cliente,
   lectura segura del cuerpo JSON y cupón de bienvenida. */

/* ─── Límite de intentos (ventana fija, en memoria del proceso) ─── */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = ((globalThis as unknown as { __eoMemberLimits?: Map<string, Bucket> }).__eoMemberLimits ??= new Map());

/* Barrido ocasional para que el mapa no crezca sin límite. */
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  buckets.forEach((b, key) => {
    if (b.resetAt <= now) buckets.delete(key);
  });
}

export interface RateLimit {
  /** Máximo de eventos dentro de la ventana. */
  max: number;
  windowMs: number;
}

export const LIMITS = {
  /** Fallos de ingreso por IP + correo. */
  loginPerAccount: { max: 8, windowMs: 15 * 60_000 },
  /** Fallos de ingreso por IP (frena el barrido de muchos correos desde un mismo origen). */
  loginPerIp: { max: 40, windowMs: 15 * 60_000 },
  /** Generoso: en una cata varios invitados pueden registrarse desde el mismo wifi. */
  registerPerIp: { max: 30, windowMs: 60 * 60_000 },
  forgotPerIp: { max: 8, windowMs: 15 * 60_000 },
  forgotPerEmail: { max: 3, windowMs: 60 * 60_000 },
  resetPerIp: { max: 15, windowMs: 15 * 60_000 },
} satisfies Record<string, RateLimit>;

/** ¿Se agotaron los intentos de esta clave? No consume un intento. */
export function isLimited(key: string, limit: RateLimit): boolean {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  return Boolean(b && b.resetAt > now && b.count >= limit.max);
}

/** Registra un intento para esta clave. */
export function hit(key: string, limit: RateLimit): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + limit.windowMs });
  else b.count += 1;
}

/** Consume un intento y dice si la clave ya superó el límite. */
export function consume(key: string, limit: RateLimit): boolean {
  if (isLimited(key, limit)) return true;
  hit(key, limit);
  return false;
}

export function resetLimit(key: string): void {
  buckets.delete(key);
}

/** IP del cliente según el proxy (Vercel y la mayoría de proxies usan x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export const tooManyAttempts = () =>
  NextResponse.json(
    { success: false, code: "rate_limited", message: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
    { status: 429 }
  );

/** Cuerpo JSON como objeto plano (o {} si no es válido). */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Cupón de bienvenida para mostrar a los miembros, solo si el administrador lo activó. */
export async function activeWelcomeCoupon(): Promise<{ code: string; discountPercent: number } | null> {
  try {
    const coupon = await getCoupon(WELCOME_COUPON_CODE);
    return coupon?.active ? { code: coupon.code, discountPercent: coupon.discountPercent } : null;
  } catch {
    return null;
  }
}
