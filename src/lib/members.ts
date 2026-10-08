import "server-only";
import crypto from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { safeEqual, sessionCookieOptions, signValue, verifySignedValue } from "./auth";
import { fetchAllRows, getAdminClient } from "./orders";

/* ─────────────────────────────────────────────────────────────
   Miembros registrados ("Cuenta Origen", tabla public.members).
   Contraseñas con scrypt; sesión en cookie firmada (HMAC, 30 días).
   ───────────────────────────────────────────────────────────── */

/** Miembro tal como sale de este módulo (nunca incluye el hash de la contraseña). */
export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isAdult: boolean;
  acceptedTermsAt: string | null;
  marketingOptIn: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface MemberRecord extends Member {
  passwordHash: string;
}

export interface RegisterMemberInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  isAdult: boolean;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
}

/** Error con mensaje apto para el usuario (responder 400/409). */
export class MemberError extends Error {
  constructor(message: string, readonly code: "invalid" | "email_taken" | "weak_password") {
    super(message);
  }
}

export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 200;

const SESSION_COOKIE = "eo_member_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const RESET_TTL_SECONDS = 60 * 60;

/* ─── Contraseñas (scrypt N=16384, sal de 16 bytes → "scrypt$sal$hash" en base64) ─── */

const scrypt = promisify(crypto.scrypt) as (pw: crypto.BinaryLike, salt: crypto.BinaryLike, keylen: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const SCRYPT_PARAMS: crypto.ScryptOptions = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT_PARAMS);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, SCRYPT_PARAMS);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** Hash ficticio para igualar el tiempo de respuesta cuando el correo no existe. */
let dummyHash: Promise<string> | null = null;

function checkPasswordStrength(password: string): void {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    throw new MemberError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`, "weak_password");
  }
  if (password.length > PASSWORD_MAX_LENGTH) throw new MemberError("La contraseña es demasiado larga.", "weak_password");
}

/* ─── Mapeo fila ↔ objeto ─── */

type Row = Record<string, unknown>;

function fromRow(row: Row): MemberRecord {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    passwordHash: String(row.password_hash ?? ""),
    isAdult: Boolean(row.is_adult),
    acceptedTermsAt: (row.accepted_terms_at as string | null) ?? null,
    marketingOptIn: Boolean(row.marketing_opt_in),
    createdAt: String(row.created_at ?? ""),
    lastLoginAt: (row.last_login_at as string | null) ?? null,
  };
}

function toPublic(r: MemberRecord): Member {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...member } = r;
  return member;
}

/* ─── Memoria (fallback) ─── */

const memMembers = ((globalThis as unknown as { __eoMembers?: Map<string, MemberRecord> }).__eoMembers ??= new Map());

/* ─── Lectura interna ─── */

export const normalizeEmail = (email: string) => (email ?? "").trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function recordById(id: string): Promise<MemberRecord | null> {
  if (!id) return null;
  const sb = getAdminClient();
  if (!sb) return memMembers.get(id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await sb.from("members").select("*").eq("id", id).maybeSingle();
  return data ? fromRow(data) : null;
}

async function recordByEmail(email: string): Promise<MemberRecord | null> {
  const target = normalizeEmail(email);
  if (!target) return null;
  const sb = getAdminClient();
  if (!sb) return Array.from(memMembers.values()).find((m) => m.email === target) ?? null;
  const { data } = await sb.from("members").select("*").eq("email", target).maybeSingle();
  return data ? fromRow(data) : null;
}

/* ─── Operaciones ─── */

export async function registerMember(input: RegisterMemberInput): Promise<Member> {
  const fullName = (input.fullName ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const email = normalizeEmail(input.email);
  const phone = (input.phone ?? "").replace(/\s+/g, " ").trim().slice(0, 40);

  if (fullName.length < 3) throw new MemberError("Indica tu nombre completo.", "invalid");
  if (!EMAIL_RE.test(email) || email.length > 200) throw new MemberError("El correo no es válido.", "invalid");
  if (phone.replace(/\D/g, "").length < 7) throw new MemberError("Indica un número de WhatsApp válido.", "invalid");
  checkPasswordStrength(input.password);
  if (input.isAdult !== true || input.acceptTerms !== true) {
    throw new MemberError("Debes ser mayor de 18 años y aceptar los Términos y Condiciones.", "invalid");
  }
  if (await recordByEmail(email)) throw new MemberError("Ya existe una cuenta con ese correo.", "email_taken");

  const now = new Date().toISOString();
  const record: MemberRecord = {
    id: crypto.randomUUID(),
    fullName,
    email,
    phone,
    passwordHash: await hashPassword(input.password),
    isAdult: true,
    acceptedTermsAt: now,
    marketingOptIn: input.marketingOptIn === true,
    createdAt: now,
    lastLoginAt: null,
  };

  const sb = getAdminClient();
  if (!sb) {
    memMembers.set(record.id, record);
    return toPublic(record);
  }
  const { data, error } = await sb
    .from("members")
    .insert({
      id: record.id,
      full_name: record.fullName,
      email: record.email,
      phone: record.phone,
      password_hash: record.passwordHash,
      is_adult: record.isAdult,
      accepted_terms_at: record.acceptedTermsAt,
      marketing_opt_in: record.marketingOptIn,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") throw new MemberError("Ya existe una cuenta con ese correo.", "email_taken");
    throw new Error(`No se pudo crear la cuenta: ${error.message}`);
  }
  return toPublic(fromRow(data));
}

/** Devuelve el miembro si el correo y la contraseña coinciden; si no, null. */
export async function authenticate(email: string, password: string): Promise<Member | null> {
  if (typeof password !== "string" || !password || password.length > PASSWORD_MAX_LENGTH) return null;
  const record = await recordByEmail(email);
  if (!record) {
    // Mismo costo que una verificación real, para no revelar qué correos existen.
    dummyHash ??= hashPassword(crypto.randomBytes(16).toString("hex"));
    await verifyPassword(password, await dummyHash);
    return null;
  }
  return (await verifyPassword(password, record.passwordHash)) ? toPublic(record) : null;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const r = await recordById(id);
  return r ? toPublic(r) : null;
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const r = await recordByEmail(email);
  return r ? toPublic(r) : null;
}

/** Todos los miembros, los más recientes primero. */
export async function listMembers(): Promise<Member[]> {
  const sb = getAdminClient();
  if (!sb) return Array.from(memMembers.values()).map(toPublic).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rows = await fetchAllRows<Row>((from, to) =>
    sb
      .from("members")
      .select("id, full_name, email, phone, is_adult, accepted_terms_at, marketing_opt_in, created_at, last_login_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to)
  );
  return rows.map((row) => toPublic(fromRow(row)));
}

/** Cambia la contraseña: los enlaces de recuperación y las sesiones abiertas antes dejan de servir. */
export async function updatePassword(id: string, password: string): Promise<void> {
  checkPasswordStrength(password);
  const passwordHash = await hashPassword(password);
  const sb = getAdminClient();
  if (!sb) {
    const current = memMembers.get(id);
    if (!current) throw new Error("Miembro no encontrado");
    memMembers.set(id, { ...current, passwordHash });
    return;
  }
  const { data, error } = await sb.from("members").update({ password_hash: passwordHash }).eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Miembro no encontrado");
}

export async function touchLogin(id: string): Promise<void> {
  const now = new Date().toISOString();
  const sb = getAdminClient();
  if (!sb) {
    const current = memMembers.get(id);
    if (current) memMembers.set(id, { ...current, lastLoginAt: now });
    return;
  }
  await sb.from("members").update({ last_login_at: now }).eq("id", id);
}

/* ─── Sesión (cookie eo_member_session = "<id>.<exp>.<huella>.<firma>") ───
   La huella del hash de la contraseña va firmada: al cambiar o restablecer la contraseña,
   todas las sesiones abiertas antes dejan de valer (currentMember la compara con la cuenta). */

/* Huella del hash actual (también invalida los enlaces de recuperación al cambiar la contraseña). */
const hashFingerprint = (passwordHash: string) =>
  crypto.createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);

interface SessionClaims {
  id: string;
  fingerprint: string;
}

/** Abre la sesión del miembro (cookie firmada, 30 días). */
export async function setMemberSession(id: string): Promise<void> {
  const record = await recordById(id);
  if (!record) throw new Error("Miembro no encontrado");
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${record.id}.${exp}.${hashFingerprint(record.passwordHash)}`;
  cookies().set({
    name: SESSION_COOKIE,
    value: `${payload}.${signValue("member", payload)}`,
    ...sessionCookieOptions(SESSION_MAX_AGE_SECONDS),
  });
}

export function clearMemberSession(): void {
  cookies().delete(SESSION_COOKIE);
}

/** Datos firmados de la cookie si la firma es válida y no venció (sin consultar la base de datos). */
function sessionClaims(): SessionClaims | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [id, exp, fingerprint, sig] = token.split(".");
  if (!id || !exp || !fingerprint || !sig) return null;
  if (!(Number(exp) >= Math.floor(Date.now() / 1000))) return null;
  return verifySignedValue("member", `${id}.${exp}.${fingerprint}`, sig) ? { id, fingerprint } : null;
}

/**
 * Id de la cookie de sesión si su firma es válida, sin consultar la base de datos.
 * No detecta sesiones revocadas por un cambio de contraseña: para leer datos use `currentMember()`.
 */
export function currentMemberId(): string | null {
  return sessionClaims()?.id ?? null;
}

/** Miembro con sesión válida; null si no hay sesión o si la contraseña cambió después de abrirla. */
export async function currentMember(): Promise<Member | null> {
  const claims = sessionClaims();
  if (!claims) return null;
  const record = await recordById(claims.id);
  if (!record || !safeEqual(claims.fingerprint, hashFingerprint(record.passwordHash))) return null;
  return toPublic(record);
}

/* ─── Recuperación de contraseña ─── */

/** Token firmado de un solo propósito, válido 1 hora: "<id>.<exp>.<huella>.<firma>". */
export async function createResetToken(member: Pick<Member, "id">): Promise<string> {
  const record = await recordById(member.id);
  if (!record) throw new Error("Miembro no encontrado");
  const exp = Math.floor(Date.now() / 1000) + RESET_TTL_SECONDS;
  const payload = `${record.id}.${exp}.${hashFingerprint(record.passwordHash)}`;
  return `${payload}.${signValue("member-reset", payload)}`;
}

/** Devuelve el miembro si el token es válido, no venció y la contraseña no cambió desde que se emitió. */
export async function verifyResetToken(token: string): Promise<Member | null> {
  const [id, exp, fingerprint, sig] = (token ?? "").trim().split(".");
  if (!id || !exp || !fingerprint || !sig) return null;
  if (!(Number(exp) >= Math.floor(Date.now() / 1000))) return null;
  if (!verifySignedValue("member-reset", `${id}.${exp}.${fingerprint}`, sig)) return null;
  const record = await recordById(id);
  if (!record || !safeEqual(fingerprint, hashFingerprint(record.passwordHash))) return null;
  return toPublic(record);
}
