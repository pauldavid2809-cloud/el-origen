import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/* Sesión de administración firmada (cookie httpOnly), igual que en el congreso. */

const COOKIE = "eo_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export function passwordMatches(input: string): boolean {
  const expected = adminPassword();
  return Boolean(expected) && safeEqual(input.trim(), expected as string);
}

export function setAdminSession(): void {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `admin.${exp}`;
  cookies().set({
    name: COOKIE,
    value: `${payload}.${sign(payload)}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
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
