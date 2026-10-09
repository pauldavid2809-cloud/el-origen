import "server-only";
import crypto from "crypto";
import { getAdminClient } from "./orders";
import {
  WAITLIST_EXPERIENCES,
  WAITLIST_MAX_SPOTS,
  WAITLIST_SCHEDULES,
  WINE_LEVELS,
  type WaitlistExperience,
  type WaitlistSchedule,
  type WineLevel,
} from "./waitlist";

/* ─────────────────────────────────────────────────────────────
   Solicitudes de los formularios públicos:
   - private:   Experiencias Privadas & Eventos Corporativos (public.private_inquiries)
   - brand:     Alianzas Comerciales & Marcas Aliadas (public.brand_leads)
   - sommelier: Red de sommeliers & directores de cata (public.sommelier_applications)
   - waitlist:  Lista de espera de las catas (public.waitlist)
   ───────────────────────────────────────────────────────────── */

export type LeadType = "private" | "brand" | "sommelier" | "waitlist";
export const LEAD_TYPES: readonly LeadType[] = ["private", "brand", "sommelier", "waitlist"];
export type LeadStatus = "new" | "contacted" | "closed" | "archived";
export const LEAD_STATUSES: readonly LeadStatus[] = ["new", "contacted", "closed", "archived"];

export const PRIVATE_EVENT_TYPES = ["corporativo", "celebracion_privada", "alianza_comercial", "cena_navidena"] as const;
export const PRIVATE_GUEST_RANGES = ["10-15", "15-25", "25+"] as const;
export const PRIVATE_RESTAURANTS = ["karnivoros_grill", "maratea", "otro"] as const;
export const BRAND_OBJECTIVES = ["patrocinar_edicion", "lanzamiento_producto", "cata_privada_b2b", "presencia_marca"] as const;
export const SOMMELIER_SPECIALTIES = ["vinos_internacionales", "whisky_spirits", "cocuy_destilados", "habano_maridaje"] as const;

export type PrivateEventType = (typeof PRIVATE_EVENT_TYPES)[number];
export type PrivateGuestRange = (typeof PRIVATE_GUEST_RANGES)[number];
export type PrivateRestaurant = (typeof PRIVATE_RESTAURANTS)[number];
export type BrandObjective = (typeof BRAND_OBJECTIVES)[number];
export type SommelierSpecialty = (typeof SOMMELIER_SPECIALTIES)[number];

interface LeadBase {
  id: string;
  status: LeadStatus;
  createdAt: string;
}

export interface PrivateInquiry extends LeadBase {
  fullName: string;
  company: string;
  phone: string;
  email: string | null;
  eventType: PrivateEventType;
  /** Licor o categoría de interés (texto libre). */
  interest: string;
  guests: PrivateGuestRange;
  restaurant: PrivateRestaurant | null;
  message: string | null;
}

export interface BrandLead extends LeadBase {
  company: string;
  brand: string;
  contactName: string;
  contactRole: string | null;
  phone: string;
  email: string;
  objective: BrandObjective;
  message: string | null;
  wantsToSendSamples: boolean;
}

export interface SommelierApplication extends LeadBase {
  fullName: string;
  phone: string;
  email: string;
  instagram: string | null;
  certification: string;
  specialties: SommelierSpecialty[];
  yearsExperience: number;
  cvUrl: string | null;
  memorableExperience: string;
}

export interface WaitlistEntry extends LeadBase {
  fullName: string;
  phone: string;
  email: string | null;
  /** Cata desde la que llegó (enlace «Lista de espera» de una cata agotada); null = sin cata concreta. */
  tastingId: string | null;
  /** Nombre de la cata al momento de anotarse (se conserva aunque la cata cambie). */
  tastingTitle: string | null;
  spots: number;
  /** Preferencias (vacías en las anotaciones anteriores a estas preguntas). */
  experiences: WaitlistExperience[];
  schedule: WaitlistSchedule | null;
  wineLevel: WineLevel | null;
  /** Fecha o celebración especial próxima (cumpleaños, aniversario…). */
  specialOccasion: string | null;
  message: string | null;
}

export interface LeadByType {
  private: PrivateInquiry;
  brand: BrandLead;
  sommelier: SommelierApplication;
  waitlist: WaitlistEntry;
}

type NewLead<T> = Omit<T, "id" | "status" | "createdAt">;
export type PrivateInquiryInput = NewLead<PrivateInquiry>;
export type BrandLeadInput = NewLead<BrandLead>;
export type SommelierApplicationInput = NewLead<SommelierApplication>;
export type WaitlistInput = NewLead<WaitlistEntry>;

/** Error de validación (mensaje apto para el formulario → responder 400). */
export class LeadInputError extends Error {}

/* ─── Validación ─── */

const line = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const para = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "";

function required(v: string, label: string): string {
  if (!v) throw new LeadInputError(`${label} es obligatorio.`);
  return v;
}

function email(v: unknown, label = "El correo"): string {
  const s = line(v, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) throw new LeadInputError(`${label} no es válido.`);
  return s;
}

function optionalEmail(v: unknown): string | null {
  return line(v, 200) ? email(v) : null;
}

function phone(v: unknown): string {
  const s = line(v, 40);
  if (s.replace(/\D/g, "").length < 7) throw new LeadInputError("Indica un número de WhatsApp válido.");
  return s;
}

function oneOf<T extends string>(v: unknown, options: readonly T[], label: string): T {
  if (typeof v === "string" && (options as readonly string[]).includes(v)) return v as T;
  throw new LeadInputError(`Selecciona ${label}.`);
}

function optionalOneOf<T extends string>(v: unknown, options: readonly T[], label: string): T | null {
  return v === undefined || v === null || v === "" ? null : oneOf(v, options, label);
}

/** Opciones válidas de una selección múltiple (sin repetir); ignora las desconocidas. */
function manyOf<T extends string>(v: unknown, options: readonly T[]): T[] {
  const list = Array.isArray(v) ? v : [];
  return options.filter((o) => list.includes(o));
}

function optionalUrl(v: unknown): string | null {
  let s = line(v, 500);
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.hostname.includes(".")) return u.toString();
  } catch {
    /* se reporta abajo */
  }
  throw new LeadInputError("El enlace al CV o LinkedIn no es válido.");
}

function instagramHandle(v: unknown): string | null {
  const s = line(v, 200)
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "");
  if (!s) return null;
  if (!/^[A-Za-z0-9._]{1,30}$/.test(s)) throw new LeadInputError("El usuario de Instagram no es válido.");
  return `@${s}`;
}

function normalizePrivate(i: PrivateInquiryInput): PrivateInquiryInput {
  return {
    fullName: required(line(i.fullName, 120), "El nombre"),
    company: required(line(i.company, 120), "La empresa, marca o motivo del evento"),
    phone: phone(i.phone),
    email: email(i.email),
    eventType: oneOf(i.eventType, PRIVATE_EVENT_TYPES, "el tipo de evento"),
    interest: required(line(i.interest, 200), "El licor o categoría de interés"),
    guests: oneOf(i.guests, PRIVATE_GUEST_RANGES, "el número estimado de invitados"),
    restaurant: oneOf(i.restaurant, PRIVATE_RESTAURANTS, "un restaurante (u «Otro lugar»)"),
    message: required(para(i.message, 2000), "Los detalles del evento"),
  };
}

function normalizeBrand(i: BrandLeadInput): BrandLeadInput {
  return {
    company: required(line(i.company, 160), "La empresa o distribuidora"),
    brand: required(line(i.brand, 160), "La marca o portafolio"),
    contactName: required(line(i.contactName, 120), "El nombre de contacto"),
    contactRole: line(i.contactRole, 120) || null,
    phone: phone(i.phone),
    email: email(i.email, "El correo corporativo"),
    objective: oneOf(i.objective, BRAND_OBJECTIVES, "el objetivo de la alianza"),
    message: para(i.message, 3000) || null,
    wantsToSendSamples: i.wantsToSendSamples === true,
  };
}

function normalizeSommelier(i: SommelierApplicationInput): SommelierApplicationInput {
  const specialties = Array.from(new Set(Array.isArray(i.specialties) ? i.specialties : [])).filter(
    (s): s is SommelierSpecialty => (SOMMELIER_SPECIALTIES as readonly string[]).includes(s)
  );
  if (!specialties.length) throw new LeadInputError("Selecciona al menos un área de especialización.");
  const years = Number(i.yearsExperience);
  if (!Number.isInteger(years) || years < 0 || years > 70) throw new LeadInputError("Indica tus años de experiencia.");
  return {
    fullName: required(line(i.fullName, 120), "El nombre"),
    phone: phone(i.phone),
    email: email(i.email),
    instagram: required(instagramHandle(i.instagram) ?? "", "Tu usuario de Instagram"),
    certification: required(line(i.certification, 200), "La titulación o certificación"),
    specialties,
    yearsExperience: years,
    cvUrl: optionalUrl(i.cvUrl),
    memorableExperience: required(para(i.memorableExperience, 3000), "Tu experiencia más memorable"),
  };
}

function normalizeWaitlist(i: WaitlistInput): WaitlistInput {
  const spots = Number(i.spots);
  if (!Number.isInteger(spots) || spots < 1 || spots > WAITLIST_MAX_SPOTS) {
    throw new LeadInputError(`Indica cuántas personas (de 1 a ${WAITLIST_MAX_SPOTS}).`);
  }
  const tastingId = line(i.tastingId, 60) || null;
  return {
    fullName: required(line(i.fullName, 120), "El nombre"),
    phone: phone(i.phone),
    email: optionalEmail(i.email),
    tastingId,
    tastingTitle: tastingId ? line(i.tastingTitle, 160) || null : null,
    spots,
    experiences: manyOf(i.experiences, WAITLIST_EXPERIENCES),
    schedule: optionalOneOf(i.schedule, WAITLIST_SCHEDULES, "un día y horario válido"),
    wineLevel: optionalOneOf(i.wineLevel, WINE_LEVELS, "un nivel válido"),
    specialOccasion: line(i.specialOccasion, 300) || null,
    message: para(i.message, 1000) || null,
  };
}

/* ─── Tablas y columnas ─── */

const TABLES: Record<LeadType, string> = {
  private: "private_inquiries",
  brand: "brand_leads",
  sommelier: "sommelier_applications",
  waitlist: "waitlist",
};

const COLUMNS: { [T in LeadType]: [keyof LeadByType[T], string][] } = {
  private: [
    ["fullName", "full_name"], ["company", "company"], ["phone", "phone"], ["email", "email"],
    ["eventType", "event_type"], ["interest", "interest"], ["guests", "guests"], ["restaurant", "restaurant"],
    ["message", "message"],
  ],
  brand: [
    ["company", "company"], ["brand", "brand"], ["contactName", "contact_name"], ["contactRole", "contact_role"],
    ["phone", "phone"], ["email", "email"], ["objective", "objective"], ["message", "message"],
    ["wantsToSendSamples", "wants_samples"],
  ],
  sommelier: [
    ["fullName", "full_name"], ["phone", "phone"], ["email", "email"], ["instagram", "instagram"],
    ["certification", "certification"], ["specialties", "specialties"], ["yearsExperience", "years_experience"],
    ["cvUrl", "cv_url"], ["memorableExperience", "memorable_experience"],
  ],
  waitlist: [
    ["fullName", "full_name"], ["phone", "phone"], ["email", "email"], ["tastingId", "tasting_id"],
    ["tastingTitle", "tasting_title"], ["spots", "spots"], ["experiences", "experiences"],
    ["schedule", "preferred_schedule"], ["wineLevel", "wine_level"], ["specialOccasion", "special_occasion"],
    ["message", "message"],
  ],
};

type Row = Record<string, unknown>;

function fromRow<T extends LeadType>(type: T, row: Row): LeadByType[T] {
  const out: Record<string, unknown> = {
    id: String(row.id),
    status: LEAD_STATUSES.includes(row.status as LeadStatus) ? row.status : "new",
    createdAt: String(row.created_at ?? ""),
  };
  for (const [key, col] of COLUMNS[type]) out[key as string] = row[col] ?? null;
  if (type === "sommelier") {
    out.specialties = Array.isArray(row.specialties) ? row.specialties : [];
    out.yearsExperience = Number(row.years_experience ?? 0);
  }
  if (type === "brand") out.wantsToSendSamples = Boolean(row.wants_samples);
  if (type === "waitlist") {
    out.spots = Number(row.spots ?? 1);
    out.experiences = Array.isArray(row.experiences) ? row.experiences : [];
  }
  return out as unknown as LeadByType[T];
}

function toRow<T extends LeadType>(type: T, lead: NewLead<LeadByType[T]>): Row {
  const row: Row = {};
  for (const [key, col] of COLUMNS[type]) row[col] = (lead as Record<string, unknown>)[key as string];
  return row;
}

/* ─── Memoria (fallback) ─── */

const memLeads = ((globalThis as unknown as { __eoLeads?: { [T in LeadType]: Map<string, LeadByType[T]> } }).__eoLeads ??= {
  private: new Map(),
  brand: new Map(),
  sommelier: new Map(),
  waitlist: new Map(),
});

/* ─── Operaciones ─── */

async function insertLead<T extends LeadType>(type: T, clean: NewLead<LeadByType[T]>): Promise<LeadByType[T]> {
  const lead = {
    ...clean,
    id: crypto.randomUUID(),
    status: "new" as LeadStatus,
    createdAt: new Date().toISOString(),
  } as LeadByType[T];
  const sb = getAdminClient();
  if (!sb) {
    (memLeads[type] as Map<string, LeadByType[T]>).set(lead.id, lead);
    return lead;
  }
  const { data, error } = await sb
    .from(TABLES[type])
    .insert({ ...toRow(type, clean), id: lead.id })
    .select()
    .single();
  if (error) throw new Error(`No se pudo guardar la solicitud: ${error.message}`);
  return fromRow(type, data);
}

/** Lanza `LeadInputError` si los datos no son válidos. */
export function createPrivateInquiry(input: PrivateInquiryInput): Promise<PrivateInquiry> {
  return insertLead("private", normalizePrivate(input));
}

export function createBrandLead(input: BrandLeadInput): Promise<BrandLead> {
  return insertLead("brand", normalizeBrand(input));
}

export function createSommelierApplication(input: SommelierApplicationInput): Promise<SommelierApplication> {
  return insertLead("sommelier", normalizeSommelier(input));
}

export function createWaitlistEntry(input: WaitlistInput): Promise<WaitlistEntry> {
  return insertLead("waitlist", normalizeWaitlist(input));
}

/** Solicitudes de un tipo, las más recientes primero. */
export async function listLeads<T extends LeadType>(type: T): Promise<LeadByType[T][]> {
  const sb = getAdminClient();
  if (!sb) {
    return Array.from((memLeads[type] as Map<string, LeadByType[T]>).values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }
  const { data, error } = await sb.from(TABLES[type]).select("*").order("created_at", { ascending: false }).limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => fromRow(type, row));
}

/** Cambia el estado de una solicitud. Devuelve null si no existe. */
export async function updateLeadStatus<T extends LeadType>(type: T, id: string, status: LeadStatus): Promise<LeadByType[T] | null> {
  if (!LEAD_STATUSES.includes(status)) throw new LeadInputError("Estado inválido.");
  const sb = getAdminClient();
  if (!sb) {
    const store = memLeads[type] as Map<string, LeadByType[T]>;
    const current = store.get(id);
    if (!current) return null;
    const next = { ...current, status };
    store.set(id, next);
    return next;
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await sb.from(TABLES[type]).update({ status }).eq("id", id).select().maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(type, data) : null;
}

/** Cantidad de solicitudes nuevas por tipo (para el panel). */
export async function countNewLeads(): Promise<Record<LeadType, number>> {
  const sb = getAdminClient();
  const counts = await Promise.all(
    LEAD_TYPES.map(async (type) => {
      if (!sb) return Array.from((memLeads[type] as Map<string, LeadBase>).values()).filter((l) => l.status === "new").length;
      const { count } = await sb.from(TABLES[type]).select("id", { count: "exact", head: true }).eq("status", "new");
      return count ?? 0;
    })
  );
  return { private: counts[0], brand: counts[1], sommelier: counts[2], waitlist: counts[3] };
}
