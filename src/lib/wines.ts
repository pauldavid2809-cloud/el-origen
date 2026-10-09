import "server-only";
import crypto from "crypto";
import { unstable_noStore as noStore } from "next/cache";
import { WINE_TYPES, type Wine, type WineSpec, type WineStatus, type WineType } from "@/types";
import { getAdminClient } from "./orders";
import type { PublicWine } from "@/components/WineCard";

/* ─────────────────────────────────────────────────────────────
   Vinos (tabla public.wines): catálogo de los productos degustados en las catas,
   con foto de la botella y ficha técnica. Se cargan desde el panel (Admin → Vinos)
   y se publican en /vinos. Sin Supabase se guardan en memoria (solo pruebas locales).
   ───────────────────────────────────────────────────────────── */

export type WineInput = Omit<Wine, "id" | "slug" | "createdAt" | "updatedAt">;

/** Error de validación (mensaje apto para mostrar en el panel → responder 400). */
export class WineInputError extends Error {}

const WINE_STATUSES: readonly WineStatus[] = ["draft", "published"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "";
const line = (v: unknown, max: number): string => text(v, max).replace(/\s+/g, " ");
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const record = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

function imageUrl(v: unknown): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return "";
  // data: solo existe en modo memoria (subidas sin Supabase Storage).
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(s)) return s;
  if (s.startsWith("/") && !s.startsWith("//")) return s.slice(0, 500);
  try {
    const u = new URL(s);
    if (u.protocol === "https:" || u.protocol === "http:") return s.slice(0, 2000);
  } catch {
    /* se reporta abajo */
  }
  throw new WineInputError("La URL de la foto no es válida.");
}

/** Normaliza los campos presentes en `input`. Con `requireAll` exige los obligatorios (crear). */
function normalize(input: unknown, requireAll: boolean): Partial<WineInput> {
  const r = record(input);
  const out: Partial<WineInput> = {};
  const has = (k: keyof WineInput) => k in r && r[k] !== undefined;

  if (has("name") || requireAll) {
    out.name = line(r.name, 140);
    if (out.name.length < 2) throw new WineInputError("El nombre del vino es obligatorio.");
  }
  if (has("winery")) out.winery = line(r.winery, 140);
  if (has("region")) out.region = line(r.region, 140);
  if (has("type")) {
    if (!WINE_TYPES.includes(r.type as WineType)) throw new WineInputError("Tipo de vino inválido.");
    out.type = r.type as WineType;
  }
  if (has("grapes")) out.grapes = line(r.grapes, 200);
  if (has("vintage")) out.vintage = line(r.vintage, 20);
  if (has("description")) out.description = text(r.description, 4000);
  if (has("imageUrl")) out.imageUrl = imageUrl(r.imageUrl);
  if (has("specs")) {
    out.specs = list(r.specs)
      .slice(0, 30)
      .map((s): WineSpec => ({ label: line(record(s).label, 60), value: text(record(s).value, 600) }))
      .filter((s) => s.label && s.value);
  }
  if (has("tastingIds")) {
    out.tastingIds = Array.from(new Set(list(r.tastingIds).filter((id): id is string => typeof id === "string" && id.length <= 80))).slice(0, 50);
  }
  if (has("status")) {
    if (!WINE_STATUSES.includes(r.status as WineStatus)) throw new WineInputError("Estado inválido.");
    out.status = r.status as WineStatus;
  }
  return out;
}

const DEFAULTS: Omit<WineInput, "name"> = {
  winery: "",
  region: "",
  type: "tinto",
  grapes: "",
  vintage: "",
  description: "",
  imageUrl: "",
  specs: [],
  tastingIds: [],
  status: "draft",
};

/* ─── Filas ─── */

type Row = Record<string, unknown>;

function fromRow(row: Row): Wine {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name ?? ""),
    winery: String(row.winery ?? ""),
    region: String(row.region ?? ""),
    type: WINE_TYPES.includes(row.wine_type as WineType) ? (row.wine_type as WineType) : "otro",
    grapes: String(row.grapes ?? ""),
    vintage: String(row.vintage ?? ""),
    description: String(row.description ?? ""),
    imageUrl: String(row.image_url ?? ""),
    specs: Array.isArray(row.specs) ? (row.specs as WineSpec[]) : [],
    tastingIds: Array.isArray(row.tasting_ids) ? (row.tasting_ids as string[]) : [],
    status: row.status === "published" ? "published" : "draft",
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? row.created_at ?? ""),
  };
}

const COLUMNS: Record<keyof WineInput, string> = {
  name: "name", winery: "winery", region: "region", type: "wine_type", grapes: "grapes", vintage: "vintage",
  description: "description", imageUrl: "image_url", specs: "specs", tastingIds: "tasting_ids", status: "status",
};

function toRow(patch: Partial<WineInput>): Row {
  const row: Row = {};
  for (const [key, col] of Object.entries(COLUMNS) as [keyof WineInput, string][]) {
    if (key in patch) row[col] = patch[key];
  }
  return row;
}

/* ─── Memoria (fallback) ─── */

const memWines = ((globalThis as unknown as { __eoWines?: Map<string, Wine> }).__eoWines ??= new Map());

/* ─── Slugs ─── */

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
  if (!sb) return Array.from(memWines.values()).some((w) => w.slug === slug);
  const { data } = await sb.from("wines").select("id").eq("slug", slug).limit(1);
  return Boolean(data && data.length);
}

async function uniqueSlug(name: string, vintage: string): Promise<string> {
  const base = slugify([name, vintage].filter(Boolean).join(" ")) || "vino";
  if (!(await slugTaken(base))) return base;
  for (let n = 2; n < 50; n++) if (!(await slugTaken(`${base}-${n}`))) return `${base}-${n}`;
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

/* ─── Operaciones ─── */

const byNewest = (a: Wine, b: Wine) => b.createdAt.localeCompare(a.createdAt);

/** Vinos, los más recientes primero. `publishedOnly` para el sitio público. */
export async function listWines({ publishedOnly = false }: { publishedOnly?: boolean } = {}): Promise<Wine[]> {
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memWines.values())
      .filter((w) => !publishedOnly || w.status === "published")
      .sort(byNewest);
  }
  let query = sb.from("wines").select("*");
  if (publishedOnly) query = query.eq("status", "published");
  const { data, error } = await query.order("created_at", { ascending: false }).limit(500);
  if (error) throw new Error(`No se pudieron leer los vinos: ${error.message}`);
  return (data ?? []).map(fromRow);
}

/** Busca por id o slug, en cualquier estado (el llamador decide qué mostrar). */
export async function getWine(idOrSlug: string): Promise<Wine | null> {
  const key = (idOrSlug ?? "").trim().slice(0, 120);
  if (!key) return null;
  const sb = getAdminClient();
  if (!sb) return memWines.get(key) ?? Array.from(memWines.values()).find((w) => w.slug === key) ?? null;
  const { data, error } = await sb.from("wines").select("*").eq(UUID_RE.test(key) ? "id" : "slug", key).maybeSingle();
  if (error) throw new Error(`No se pudo leer el vino: ${error.message}`);
  return data ? fromRow(data) : null;
}

/** Lanza `WineInputError` si los datos no son válidos. */
export async function createWine(input: unknown): Promise<Wine> {
  const clean = { ...DEFAULTS, ...normalize(input, true) } as WineInput;
  const now = new Date().toISOString();
  const wine: Wine = { ...clean, id: crypto.randomUUID(), slug: await uniqueSlug(clean.name, clean.vintage), createdAt: now, updatedAt: now };
  const sb = getAdminClient();
  if (!sb) {
    memWines.set(wine.id, wine);
    return wine;
  }
  const { data, error } = await sb.from("wines").insert({ ...toRow(clean), id: wine.id, slug: wine.slug }).select().single();
  if (error) throw new Error(`No se pudo guardar el vino: ${error.message}`);
  return fromRow(data);
}

/** Actualiza los campos enviados. El slug no cambia (los enlaces compartidos siguen funcionando). */
export async function updateWine(id: string, input: unknown): Promise<Wine | null> {
  const patch = normalize(input, false);
  const sb = getAdminClient();
  if (!sb) {
    const current = memWines.get(id);
    if (!current) return null;
    const updated: Wine = { ...current, ...patch, updatedAt: new Date().toISOString() };
    memWines.set(id, updated);
    return updated;
  }
  if (!UUID_RE.test(id)) return null;
  const row = toRow(patch);
  if (!Object.keys(row).length) return getWine(id);
  const { data, error } = await sb.from("wines").update(row).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`No se pudo actualizar el vino: ${error.message}`);
  return data ? fromRow(data) : null;
}

export async function deleteWine(id: string): Promise<boolean> {
  const sb = getAdminClient();
  if (!sb) return memWines.delete(id);
  if (!UUID_RE.test(id)) return false;
  const { data, error } = await sb.from("wines").delete().eq("id", id).select("id");
  if (error) throw new Error(`No se pudo eliminar el vino: ${error.message}`);
  return Boolean(data && data.length);
}

/** Lo que necesitan las tarjetas públicas (sin catas ni ficha). */
export function toPublicWine({ id, slug, name, winery, region, type, vintage, imageUrl }: Wine): PublicWine {
  return { id, slug, name, winery, region, type, vintage, imageUrl };
}

/** Etiqueta de caché de los vinos de la portada: el panel la invalida al guardar (revalidateTag). */
export const WINES_TAG = "wines";

/**
 * Vinos publicados para la portada, con caché de datos de Next (como la publicidad): el inicio sigue
 * siendo estático y se actualiza cuando el panel guarda un vino. Si la tabla aún no existe, no muestra nada.
 */
export async function getHomeWines(limit = 12): Promise<PublicWine[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder")) {
    // Sin Supabase (pruebas locales) los vinos viven en memoria: se leen en cada visita.
    noStore();
    return (await listWines({ publishedOnly: true })).slice(0, limit).map(toPublicWine);
  }
  try {
    const res = await fetch(`${url}/rest/v1/wines?status=eq.published&select=*&order=created_at.desc&limit=${limit}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { tags: [WINES_TAG], revalidate: 600 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as Row[]).map(fromRow).map(toPublicWine);
  } catch (err) {
    console.error("[wines] No se pudieron leer los vinos de la portada:", err);
    return [];
  }
}
