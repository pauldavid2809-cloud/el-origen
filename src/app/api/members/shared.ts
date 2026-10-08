import "server-only";
import { getCoupon, WELCOME_COUPON_CODE } from "@/lib/coupons";
import type { RateLimit } from "@/lib/rateLimit";

/* Utilidades comunes de las rutas de miembros: límites de intentos (sobre `@/lib/rateLimit`),
   lectura segura del cuerpo JSON y cupón de bienvenida. */

export { clientIp, consume, hit, isLimited, resetLimit, tooManyAttempts, type RateLimit } from "@/lib/rateLimit";

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
