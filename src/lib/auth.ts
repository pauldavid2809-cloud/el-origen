import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/* Sesiones firmadas (cookies httpOnly), igual que en el congreso:
   - admin: acceso total al panel.
   - puerta: solo el escáner de entradas (tablet/teléfono en la entrada del evento). */

const COOKIE = "eo_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const DOOR_COOKIE = "eo_door_session";
const DOOR_MAX_AGE_SECONDS = 60 * 60 * 24;

/** Clave del panel. En producción es obligatorio definir ADMIN_PASSWORD. */
export function adminPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "origen-admin";
}

function secret(): string {
  return process.env.AUTH_SECRET || `${adminPassword() ?? ""}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

/**
 * Firma HMAC (AUTH_SECRET) para otros módulos del servidor (sesión de miembros, enlaces de recuperación).
 * `purpose` separa los dominios para que una firma no sirva en otro contexto.
 */
export function signValue(purpose: string, payload: string): string {
  return sign(`${purpose}|${payload}`);
}

export function verifySignedValue(purpose: string, payload: string, signature: string): boolean {
  return Boolean(signature) && safeEqual(signature, signValue(purpose, payload));
}

export function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export function passwordMatches(input: string): boolean {
  const expected = adminPassword();
  return Boolean(expected) && safeEqual(input.trim(), expected as string);
}

/** Opciones comunes de las cookies de sesión (httpOnly, lax, segura en producción). */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function setAdminSession(): void {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `admin.${exp}`;
  cookies().set({
    name: COOKIE,
    value: `${payload}.${sign(payload)}`,
    ...sessionCookieOptions(MAX_AGE_SECONDS),
  });
}

export function clearAdminSession(): void {
  cookies().delete(COOKIE);
}

export function isAdmin(): boolean {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return false;
  const [role, exp, sig] = token.split(".");
  if (role !== "admin" || !exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, sign(`${role}.${exp}`));
}

/** Uso: `const denied = requireAdmin(); if (denied) return denied;` */
export function requireAdmin(): NextResponse | null {
  if (isAdmin()) return null;
  return NextResponse.json({ success: false, message: "No autorizado. Inicie sesión en el panel." }, { status: 401 });
}

/* ─── Rol "puerta" (solo escáner) ─── */

/** Clave de la puerta. En producción es obligatorio definir DOOR_PASSWORD. */
export function doorPassword(): string | null {
  if (process.env.DOOR_PASSWORD) return process.env.DOOR_PASSWORD;
  return process.env.NODE_ENV === "production" ? null : "puerta-origen";
}

export function doorPasswordMatches(input: string): boolean {
  const expected = doorPassword();
  return Boolean(expected) && safeEqual(input.trim(), expected as string);
}

/* La firma incluye la clave de la puerta: al cambiar DOOR_PASSWORD se cierran las sesiones abiertas. */
const doorSignature = (payload: string) => signValue("door", `${payload}|${doorPassword() ?? ""}`);

export function setDoorSession(): void {
  const exp = Math.floor(Date.now() / 1000) + DOOR_MAX_AGE_SECONDS;
  const payload = `door.${exp}`;
  cookies().set({
    name: DOOR_COOKIE,
    value: `${payload}.${doorSignature(payload)}`,
    ...sessionCookieOptions(DOOR_MAX_AGE_SECONDS),
  });
}

export function clearDoorSession(): void {
  cookies().delete(DOOR_COOKIE);
}

export function isDoor(): boolean {
  if (!doorPassword()) return false;
  const token = cookies().get(DOOR_COOKIE)?.value;
  if (!token) return false;
  const [role, exp, sig] = token.split(".");
  if (role !== "door" || !exp || !sig) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, doorSignature(`${role}.${exp}`));
}

/** Quién valida en la puerta (para `checked_in_by`), o null si no hay sesión. */
export function scannerRole(): "admin" | "puerta" | null {
  if (isAdmin()) return "admin";
  if (isDoor()) return "puerta";
  return null;
}

/** Uso: `const denied = requireDoorOrAdmin(); if (denied) return denied;` */
export function requireDoorOrAdmin(): NextResponse | null {
  if (isAdmin() || isDoor()) return null;
  return NextResponse.json({ success: false, message: "No autorizado. Inicie sesión en la puerta o en el panel." }, { status: 401 });
}
