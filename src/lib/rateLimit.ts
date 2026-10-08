import "server-only";
import { NextResponse } from "next/server";

/* ─────────────────────────────────────────────────────────────
   Límite de intentos con ventana fija, en memoria del proceso
   (globalThis para sobrevivir a la recarga en desarrollo).
   Lo usan los accesos (admin, puerta, miembros) y el checkout.
   ───────────────────────────────────────────────────────────── */

export interface RateLimit {
  /** Máximo de eventos dentro de la ventana. */
  max: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = ((globalThis as unknown as { __eoRateLimits?: Map<string, Bucket> }).__eoRateLimits ??= new Map());

/* Barrido ocasional para que el mapa no crezca sin límite. */
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  buckets.forEach((b, key) => {
    if (b.resetAt <= now) buckets.delete(key);
  });
}

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

/** Respuesta 429 estándar. */
export const tooManyAttempts = (message = "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.") =>
  NextResponse.json({ success: false, code: "rate_limited", message }, { status: 429 });
