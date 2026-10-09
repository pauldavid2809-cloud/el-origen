import "server-only";
import crypto from "crypto";
import {
  PAYMENT_METHOD_IDS,
  RATE_CURRENCIES,
  type PaymentMethodId,
  type RateCurrency,
  type Tasting,
  type TastingAddOn,
  type TastingCategory,
  type TastingInstagram,
  type TastingProduct,
  type TastingStatus,
} from "@/types";
import { getAdminClient } from "./orders";
import { TEAM, getTeamMember } from "./team";

/* ─────────────────────────────────────────────────────────────
   Catas (tabla public.catas). El cliente las carga desde el panel.
   Sin Supabase se guardan en memoria; arrancan vacías salvo con
   EO_DEMO_SEED=1, que siembra 2 catas de ejemplo para pruebas.
   ───────────────────────────────────────────────────────────── */

/** Campos editables de una cata (lo que envía el panel). */
export interface CataInput {
  title: string;
  subtitle: string;
  description: string;
  date: string; // YYYY-MM-DD
  timeStart: string; // HH:MM
  timeEnd: string; // HH:MM o ""
  location: string;
  locationAddress: string;
  mapsUrl: string;
  priceUsd: number;
  rateCurrency: RateCurrency;
  /** Métodos de pago de esta cata; vacío = todos los activos en Configuración. */
  paymentMethods: PaymentMethodId[];
  /** Cuenta Zelle (id de Configuración → Zelle); "" = la primera. */
  zelleAccountId: string;
  totalSpots: number;
  imageUrl: string;
  imageAlt: string;
  category: TastingCategory;
  wines: TastingProduct[];
  pairings: string[];
  sommelierIds: string[];
  instagram: TastingInstagram[];
  addOns: TastingAddOn[];
  status: TastingStatus;
}

interface CataRecord extends CataInput {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/** Error de validación (mensaje apto para mostrar en el panel → responder 400). */
export class CataInputError extends Error {}

export const CATA_CATEGORIES: readonly TastingCategory[] = ["degustacion", "reserva", "atardecer", "blancos", "privada", "icono"];
export const CATA_STATUSES: readonly TastingStatus[] = ["draft", "active", "sold_out", "archived"];
/** Estados visibles en el sitio público. */
export const PUBLIC_CATA_STATUSES: readonly TastingStatus[] = ["active", "sold_out"];

const EDITABLE_KEYS: (keyof CataInput)[] = [
  "title", "subtitle", "description", "date", "timeStart", "timeEnd", "location", "locationAddress", "mapsUrl",
  "priceUsd", "rateCurrency", "paymentMethods", "zelleAccountId", "totalSpots", "imageUrl", "imageAlt", "category", "wines",
  "pairings", "sommelierIds", "instagram", "addOns", "status",
];

/* ─── Fechas (zona horaria de Caracas) ─── */

const TIME_ZONE = "America/Caracas";
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** Fecha de hoy en Caracas, YYYY-MM-DD. */
export function todayInCaracas(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function parseDate(date: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? d : null;
}

function addDays(date: string, days: number): string {
  const d = parseDate(date) as Date;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "2026-10-24" → "24 OCT" */
export function formatDateDisplay(date: string): string {
  const d = parseDate(date);
  return d ? `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS_SHORT[d.getUTCMonth()]}` : date;
}

/** "2026-10-24" → "Sábado, 24 de octubre de 2026" */
export function formatDateFull(date: string): string {
  const d = parseDate(date);
  return d ? `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}` : date;
}

const formatUsd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)} USD`;

/* ─── Validación y normalización ─── */

const text = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max) : typeof v === "number" ? String(v) : "";
const line = (v: unknown, max: number): string => text(v, max).replace(/\s+/g, " ");
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const record = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

function money(v: unknown, field: string): number {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100_000) throw new CataInputError(`${field}: monto inválido.`);
  return Math.round(n * 100) / 100;
}

function httpUrl(v: unknown, field: string, max = 1000): string {
  const s = text(v, max);
  if (!s) return "";
  try {
    const u = new URL(s);
    if (u.protocol === "https:" || u.protocol === "http:") return u.toString();
  } catch {
    /* se reporta abajo */
  }
  throw new CataInputError(`${field}: debe ser un enlace http(s) válido.`);
}

function imageUrl(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return "";
  // data: solo existe en modo memoria (subidas sin Supabase Storage).
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(s)) return s;
  if (s.startsWith("/") && !s.startsWith("//")) return s.slice(0, 500);
  return httpUrl(s, "Imagen", 2000);
}

const SLUGISH = /^[a-z0-9][a-z0-9-]{0,47}$/;

function normalizeInstagram(v: unknown): TastingInstagram | null {
  const r = typeof v === "string" ? { handle: v } : record(v);
  let handle = text(r.handle, 200)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "");
  if (!handle) return null;
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) throw new CataInputError(`Instagram: "${handle}" no es un usuario válido.`);
  handle = `@${handle}`;
  const label = line(r.label, 60);
  return label ? { handle, label } : { handle };
}

function normalizeProduct(v: unknown, i: number): TastingProduct | null {
  const r = record(v);
  const name = line(r.name, 120);
  if (!name) {
    if (Object.values(r).some((x) => (typeof x === "string" ? x.trim() : Array.isArray(x) && x.length))) {
      throw new CataInputError(`Producto #${i + 1}: falta el nombre.`);
    }
    return null;
  }
  const product: TastingProduct = {
    name,
    vintage: line(r.vintage, 20),
    type: line(r.type, 80),
    description: text(r.description, 600),
    aromaProfile: list(r.aromaProfile).map((a) => line(a, 40)).filter(Boolean).slice(0, 12),
  };
  const audioStory = text(r.audioStory, 1000);
  if (audioStory) product.audioStory = audioStory;
  return product;
}

function normalizeAddOn(v: unknown, i: number, used: Set<string>): TastingAddOn | null {
  const r = record(v);
  const title = line(r.title, 120);
  if (!title) return null;
  if (r.priceUsd === undefined || r.priceUsd === null || r.priceUsd === "") {
    throw new CataInputError(`Adicional "${title}": falta el precio.`);
  }
  let id = typeof r.id === "string" && SLUGISH.test(r.id) ? r.id : "";
  if (!id || used.has(id)) id = `ad-${crypto.randomBytes(4).toString("hex")}`;
  used.add(id);
  const addOn: TastingAddOn = { id, title, priceUsd: money(r.priceUsd, `Adicional #${i + 1}`) };
  const description = text(r.description, 300);
  if (description) addOn.description = description;
  return addOn;
}

/** Normaliza los campos presentes en `input`. Con `requireAll` exige los obligatorios (crear). */
function normalizeCataInput(input: unknown, requireAll: boolean): Partial<CataInput> {
  const r = record(input);
  const out: Partial<CataInput> = {};
  const has = (k: keyof CataInput) => k in r && r[k] !== undefined;

  if (has("title") || requireAll) {
    out.title = line(r.title, 140);
    if (out.title.length < 3) throw new CataInputError("El nombre de la cata es obligatorio.");
  }
  if (has("subtitle")) out.subtitle = line(r.subtitle, 200);
  if (has("description")) out.description = text(r.description, 4000);
  if (has("date") || requireAll) {
    const date = text(r.date, 10);
    if (!parseDate(date)) throw new CataInputError("Fecha inválida (formato AAAA-MM-DD).");
    out.date = date;
  }
  const time = (k: "timeStart" | "timeEnd", required: boolean) => {
    const s = text(r[k], 5);
    if (!s && !required) return "";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(s)) throw new CataInputError(`Hora ${k === "timeStart" ? "de inicio" : "de cierre"} inválida (HH:MM).`);
    return s;
  };
  if (has("timeStart") || requireAll) out.timeStart = time("timeStart", true);
  if (has("timeEnd")) out.timeEnd = time("timeEnd", false);
  if (has("location") || requireAll) {
    out.location = line(r.location, 160);
    if (out.location.length < 2) throw new CataInputError("El lugar de la cata es obligatorio.");
  }
  if (has("locationAddress")) out.locationAddress = line(r.locationAddress, 240);
  if (has("mapsUrl")) out.mapsUrl = httpUrl(r.mapsUrl, "Enlace de Google Maps");
  if (has("priceUsd") || requireAll) {
    if (r.priceUsd === undefined || r.priceUsd === null || r.priceUsd === "") throw new CataInputError("El precio es obligatorio.");
    out.priceUsd = money(r.priceUsd, "Precio");
  }
  if (has("rateCurrency")) {
    if (!RATE_CURRENCIES.includes(r.rateCurrency as RateCurrency)) throw new CataInputError("La tasa debe ser BCV dólar, BCV euro o Binance.");
    out.rateCurrency = r.rateCurrency as RateCurrency;
  }
  if (has("paymentMethods")) {
    const chosen = list(r.paymentMethods);
    out.paymentMethods = PAYMENT_METHOD_IDS.filter((m) => chosen.includes(m));
  }
  if (has("zelleAccountId")) out.zelleAccountId = line(r.zelleAccountId, 40);
  if (has("totalSpots") || requireAll) {
    const n = Number(r.totalSpots);
    if (!Number.isInteger(n) || n < 1 || n > 1000) throw new CataInputError("Los cupos totales deben ser un número entre 1 y 1000.");
    out.totalSpots = n;
  }
  if (has("imageUrl")) out.imageUrl = imageUrl(r.imageUrl);
  if (has("imageAlt")) out.imageAlt = line(r.imageAlt, 200);
  if (has("category")) {
    if (!CATA_CATEGORIES.includes(r.category as TastingCategory)) throw new CataInputError("Categoría inválida.");
    out.category = r.category as TastingCategory;
  }
  if (has("wines")) {
    out.wines = list(r.wines).slice(0, 30).map(normalizeProduct).filter((p): p is TastingProduct => p !== null);
  }
  if (has("pairings")) out.pairings = list(r.pairings).map((p) => line(p, 200)).filter(Boolean).slice(0, 30);
  if (has("sommelierIds")) {
    const known = new Set(TEAM.map((m) => m.id));
    out.sommelierIds = Array.from(new Set(list(r.sommelierIds).filter((id): id is string => typeof id === "string" && known.has(id))));
  }
  if (has("instagram")) {
    const byHandle = new Map<string, TastingInstagram>();
    for (const ig of list(r.instagram).slice(0, 12).map(normalizeInstagram)) {
      if (ig && !byHandle.has(ig.handle.toLowerCase())) byHandle.set(ig.handle.toLowerCase(), ig);
    }
    out.instagram = Array.from(byHandle.values());
  }
  if (has("addOns")) {
    const used = new Set<string>();
    out.addOns = list(r.addOns)
      .slice(0, 20)
      .map((a, i) => normalizeAddOn(a, i, used))
      .filter((a): a is TastingAddOn => a !== null);
  }
  if (has("status")) {
    if (!CATA_STATUSES.includes(r.status as TastingStatus)) throw new CataInputError("Estado inválido.");
    out.status = r.status as TastingStatus;
  }
  return out;
}

const DEFAULTS: Omit<CataInput, "title" | "date" | "timeStart" | "location" | "priceUsd" | "totalSpots"> = {
  subtitle: "",
  description: "",
  timeEnd: "",
  locationAddress: "",
  mapsUrl: "",
  rateCurrency: "USD",
  paymentMethods: [],
  zelleAccountId: "",
  imageUrl: "",
  imageAlt: "",
  category: "degustacion",
  wines: [],
  pairings: [],
  sommelierIds: [],
  instagram: [],
  addOns: [],
  status: "draft",
};

/* ─── Registro ↔ Tasting ─── */

function toTasting(c: CataRecord): Tasting {
  const first = c.sommelierIds.map(getTeamMember).find(Boolean);
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle || undefined,
    description: c.description,
    date: c.date,
    dateDisplay: formatDateDisplay(c.date),
    dateFull: formatDateFull(c.date),
    timeStart: c.timeStart,
    timeEnd: c.timeEnd,
    location: c.location,
    locationAddress: c.locationAddress || undefined,
    mapsUrl: c.mapsUrl || undefined,
    price: c.priceUsd,
    priceUsd: c.priceUsd,
    priceFormatted: formatUsd(c.priceUsd),
    rateCurrency: c.rateCurrency,
    paymentMethods: c.paymentMethods,
    zelleAccountId: c.zelleAccountId || null,
    totalSpots: c.totalSpots,
    // La disponibilidad real (descontando órdenes) la aplica `availability.ts`.
    availableSpots: c.totalSpots,
    imageUrl: c.imageUrl,
    imageAlt: c.imageAlt || c.title,
    category: c.category,
    wines: c.wines,
    pairings: c.pairings,
    sommelierIds: c.sommelierIds,
    sommelier: first
      ? { name: first.name, role: first.role.es, bio: first.bio.es, avatarUrl: first.photoUrl ?? "" }
      : { name: "", role: "", bio: "", avatarUrl: "" },
    instagram: c.instagram,
    addOns: c.addOns,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

type Row = Record<string, unknown>;

const jsonArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function fromRow(row: Row): CataRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    description: String(row.description ?? ""),
    date: String(row.date ?? "").slice(0, 10),
    timeStart: String(row.time_start ?? ""),
    timeEnd: String(row.time_end ?? ""),
    location: String(row.location_name ?? ""),
    locationAddress: String(row.location_address ?? ""),
    mapsUrl: String(row.maps_url ?? ""),
    priceUsd: Number(row.price_usd ?? 0),
    rateCurrency: RATE_CURRENCIES.includes(row.rate_currency as RateCurrency) ? (row.rate_currency as RateCurrency) : "USD",
    paymentMethods: PAYMENT_METHOD_IDS.filter((m) => jsonArray<string>(row.payment_methods).includes(m)),
    zelleAccountId: String(row.zelle_account_id ?? ""),
    totalSpots: Number(row.total_spots ?? 0),
    imageUrl: String(row.image_url ?? ""),
    imageAlt: String(row.image_alt ?? ""),
    category: CATA_CATEGORIES.includes(row.category as TastingCategory) ? (row.category as TastingCategory) : "degustacion",
    wines: jsonArray<TastingProduct>(row.products),
    pairings: jsonArray<string>(row.pairings),
    sommelierIds: jsonArray<string>(row.sommelier_ids),
    instagram: jsonArray<TastingInstagram>(row.instagram),
    addOns: jsonArray<TastingAddOn>(row.add_ons),
    status: CATA_STATUSES.includes(row.status as TastingStatus) ? (row.status as TastingStatus) : "draft",
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? row.created_at ?? ""),
  };
}

const COLUMNS: Record<keyof CataInput, string> = {
  title: "title", subtitle: "subtitle", description: "description", date: "date", timeStart: "time_start",
  timeEnd: "time_end", location: "location_name", locationAddress: "location_address", mapsUrl: "maps_url",
  priceUsd: "price_usd", rateCurrency: "rate_currency", paymentMethods: "payment_methods", zelleAccountId: "zelle_account_id",
  totalSpots: "total_spots", imageUrl: "image_url",
  imageAlt: "image_alt", category: "category", wines: "products", pairings: "pairings", sommelierIds: "sommelier_ids",
  instagram: "instagram", addOns: "add_ons", status: "status",
};

function toRow(patch: Partial<CataInput>): Row {
  const row: Row = {};
  for (const k of EDITABLE_KEYS) {
    if (k in patch) {
      const v = patch[k];
      // Columnas de texto opcionales: "" se guarda como null.
      row[COLUMNS[k]] = (k === "locationAddress" || k === "mapsUrl" || k === "zelleAccountId") && !v ? null : v;
    }
  }
  return row;
}

/* ─── Memoria (fallback) ─── */

const mem = globalThis as unknown as { __eoCatas?: Map<string, CataRecord>; __eoCatasSeeded?: boolean };
const memCatas = (mem.__eoCatas ??= new Map());

function memoryStore(): Map<string, CataRecord> {
  if (!mem.__eoCatasSeeded) {
    mem.__eoCatasSeeded = true;
    if (process.env.EO_DEMO_SEED === "1") for (const c of demoCatas()) memCatas.set(c.id, c);
  }
  return memCatas;
}

/* ─── Utilidades ─── */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

async function slugTaken(slug: string): Promise<boolean> {
  const sb = getAdminClient();
  if (!sb) return Array.from(memoryStore().values()).some((c) => c.slug === slug);
  const { data } = await sb.from("catas").select("id").eq("slug", slug).limit(1);
  return Boolean(data && data.length);
}

async function uniqueSlug(title: string, date: string): Promise<string> {
  const base = `${slugify(title) || "cata"}-${date}`;
  if (!(await slugTaken(base))) return base;
  for (let n = 2; n < 50; n++) if (!(await slugTaken(`${base}-${n}`))) return `${base}-${n}`;
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

/** Próximas primero (fecha y hora ascendentes); las pasadas al final, de la más reciente a la más antigua. */
function sortUpcomingFirst(a: CataRecord, b: CataRecord, today: string): number {
  const aPast = a.date < today;
  const bPast = b.date < today;
  if (aPast !== bPast) return aPast ? 1 : -1;
  const ka = `${a.date} ${a.timeStart}`;
  const kb = `${b.date} ${b.timeStart}`;
  return aPast ? kb.localeCompare(ka) : ka.localeCompare(kb);
}

/* ─── Operaciones ─── */

export interface ListCatasOptions {
  /** Incluye borradores y archivadas (panel). Por defecto solo activas y agotadas. */
  includeDrafts?: boolean;
  /** Solo catas de hoy en adelante (hora de Caracas). */
  upcomingOnly?: boolean;
}

export async function listCatas(options: ListCatasOptions = {}): Promise<Tasting[]> {
  const today = todayInCaracas();
  const sb = getAdminClient();
  let records: CataRecord[];
  if (!sb) {
    records = Array.from(memoryStore().values());
  } else {
    let query = sb.from("catas").select("*");
    if (!options.includeDrafts) query = query.in("status", PUBLIC_CATA_STATUSES as TastingStatus[]);
    if (options.upcomingOnly) query = query.gte("date", today);
    const { data, error } = await query.order("date", { ascending: true }).limit(1000);
    if (error) throw new Error(`No se pudieron leer las catas: ${error.message}`);
    records = (data ?? []).map(fromRow);
  }
  return records
    .filter((c) => options.includeDrafts || PUBLIC_CATA_STATUSES.includes(c.status))
    .filter((c) => !options.upcomingOnly || c.date >= today)
    .sort((a, b) => sortUpcomingFirst(a, b, today))
    .map(toTasting);
}

/** Busca por id o slug, en cualquier estado (el llamador decide qué mostrar). */
export async function getCata(idOrSlug: string): Promise<Tasting | null> {
  const key = (idOrSlug ?? "").trim();
  if (!key) return null;
  const sb = getAdminClient();
  if (!sb) {
    const store = memoryStore();
    const found = store.get(key) ?? Array.from(store.values()).find((c) => c.slug === key);
    return found ? toTasting(found) : null;
  }
  const { data, error } = await sb
    .from("catas")
    .select("*")
    .eq(UUID_RE.test(key) ? "id" : "slug", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toTasting(fromRow(data)) : null;
}

/** Crea una cata. Lanza `CataInputError` si los datos no son válidos. */
export async function createCata(input: CataInput): Promise<Tasting> {
  const clean = { ...DEFAULTS, ...normalizeCataInput(input, true) } as CataInput;
  const now = new Date().toISOString();
  const record: CataRecord = {
    ...clean,
    id: crypto.randomUUID(),
    slug: await uniqueSlug(clean.title, clean.date),
    createdAt: now,
    updatedAt: now,
  };
  const sb = getAdminClient();
  if (!sb) {
    memoryStore().set(record.id, record);
    return toTasting(record);
  }
  const { data, error } = await sb
    .from("catas")
    .insert({ ...toRow(record), id: record.id, slug: record.slug })
    .select()
    .single();
  if (error) throw new Error(`No se pudo crear la cata: ${error.message}`);
  return toTasting(fromRow(data));
}

/** Actualiza los campos enviados. El slug no cambia (los enlaces compartidos siguen funcionando). */
export async function updateCata(id: string, patch: Partial<CataInput>): Promise<Tasting | null> {
  const clean = normalizeCataInput(patch, false);
  const sb = getAdminClient();
  if (!sb) {
    const store = memoryStore();
    const current = store.get(id);
    if (!current) return null;
    const next: CataRecord = { ...current, ...clean, updatedAt: new Date().toISOString() };
    store.set(id, next);
    return toTasting(next);
  }
  if (!UUID_RE.test(id)) return null;
  const row = toRow(clean);
  if (!Object.keys(row).length) return getCata(id);
  const { data, error } = await sb.from("catas").update(row).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`No se pudo actualizar la cata: ${error.message}`);
  return data ? toTasting(fromRow(data)) : null;
}

/** Elimina una cata. Devuelve false si no existía. (Las órdenes guardan su propia copia de título/fecha.) */
export async function deleteCata(id: string): Promise<boolean> {
  const sb = getAdminClient();
  if (!sb) return memoryStore().delete(id);
  if (!UUID_RE.test(id)) return false;
  const { data, error } = await sb.from("catas").delete().eq("id", id).select("id");
  if (error) throw new Error(`No se pudo eliminar la cata: ${error.message}`);
  return Boolean(data && data.length);
}

/* ─── Datos de demostración (solo memoria y EO_DEMO_SEED=1) ─── */

function demoCatas(): CataRecord[] {
  const today = todayInCaracas();
  const now = new Date().toISOString();
  const base = {
    createdAt: now,
    updatedAt: now,
    status: "active" as const,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Caracas%2C%20Venezuela",
    paymentMethods: [] as PaymentMethodId[],
    zelleAccountId: "",
  };
  return [
    {
      ...base,
      id: "00000000-0000-4000-8000-00000000d001",
      slug: "demo-vinos-viejo-mundo",
      title: "Cata de ejemplo · Vinos del Viejo Mundo",
      subtitle: "Datos de demostración (EO_DEMO_SEED)",
      description: "Cata de prueba para revisar el flujo de reserva, pago y entradas. No es un evento real.",
      date: addDays(today, 10),
      timeStart: "19:00",
      timeEnd: "21:00",
      location: "Salón de ejemplo",
      locationAddress: "Caracas",
      priceUsd: 55,
      rateCurrency: "USD",
      totalSpots: 18,
      imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
      imageAlt: "Copa de vino tinto servida en una mesa de cata.",
      category: "degustacion",
      wines: [
        { name: "Tinto de ejemplo Reserva", vintage: "2019", type: "Tempranillo · España", description: "Producto de demostración.", aromaProfile: ["Cereza", "Vainilla", "Cedro"] },
        { name: "Tinto de ejemplo Toscana", vintage: "2020", type: "Sangiovese · Italia", description: "Producto de demostración.", aromaProfile: ["Violeta", "Mora", "Cacao"] },
        { name: "Blanco de ejemplo", vintage: "2022", type: "Chardonnay · Francia", description: "Producto de demostración.", aromaProfile: ["Pera", "Mantequilla", "Almendra"] },
      ],
      pairings: ["Tabla de quesos (ejemplo)", "Charcutería (ejemplo)", "Chocolate oscuro (ejemplo)"],
      sommelierIds: ["belkis-croquer", "raiza-navarro"],
      instagram: [{ handle: "@belkiscroquer", label: "Belkis Croquer" }],
      addOns: [
        { id: "demo-botella", title: "Botella de ejemplo para llevar", description: "Adicional de demostración.", priceUsd: 35 },
        { id: "demo-tabla", title: "Tabla extra de ejemplo", priceUsd: 20 },
      ],
    },
    {
      ...base,
      id: "00000000-0000-4000-8000-00000000d002",
      slug: "demo-whisky-destilados",
      title: "Cata de ejemplo · Whisky & Destilados",
      subtitle: "Datos de demostración (EO_DEMO_SEED) · tasa EUR",
      description: "Cata de prueba con tasa BCV del euro para revisar el cálculo en bolívares. No es un evento real.",
      date: addDays(today, 24),
      timeStart: "18:30",
      timeEnd: "20:30",
      location: "Restaurante aliado de ejemplo",
      locationAddress: "",
      priceUsd: 65,
      rateCurrency: "EUR",
      totalSpots: 12,
      imageUrl: "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=1200&auto=format&fit=crop",
      imageAlt: "Copas servidas en una cena de cata.",
      category: "degustacion",
      wines: [
        { name: "Whisky de ejemplo 12 años", vintage: "", type: "Blended Scotch", description: "Producto de demostración.", aromaProfile: ["Miel", "Roble", "Vainilla"] },
        { name: "Cocuy de ejemplo", vintage: "", type: "Destilado de agave · Venezuela", description: "Producto de demostración.", aromaProfile: ["Agave", "Herbal"] },
      ],
      pairings: ["Menú de tres tiempos (ejemplo)"],
      sommelierIds: ["juan-carlos-arias", "fabian-lugo"],
      instagram: [{ handle: "@maratea.ccs", label: "Maratea" }],
      addOns: [{ id: "demo-whisky", title: "Botella de whisky de ejemplo", description: "Adicional de demostración.", priceUsd: 48 }],
    },
  ];
}
