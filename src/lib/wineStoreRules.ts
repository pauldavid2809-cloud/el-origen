import { parseMoneyText, round2, WINE_DEFAULT_MAX_PER_ORDER, WINE_MAX_PER_ORDER_LIMIT, WINE_PENDING_TTL_HOURS } from "./wineSale";

/* ─────────────────────────────────────────────────────────────
   Tienda de vinos configurable: reglas puras compartidas por el servidor y el navegador
   (por eso este archivo NO lleva `server-only`: lo usan el panel, el carrito, el checkout y las rutas).
   La configuración se guarda en app_settings (clave "wine_store") desde Admin → Tienda de vinos;
   la lectura y el guardado viven en wineStore.ts.
   ───────────────────────────────────────────────────────────── */

export type DeliveryMode = "coordinate" | "flat" | "zones";
export const DELIVERY_MODES: readonly DeliveryMode[] = ["coordinate", "flat", "zones"];

export interface DeliveryZone {
  /** Estable: no cambia al renombrar la zona (el checkout lo envía como `deliveryZoneId`). */
  id: string;
  name: string;
  feeUsd: number;
}

/**
 * Programación de la entrega a domicilio: el cliente elige día y franja al comprar (es una PREFERENCIA que el equipo confirma
 * por WhatsApp). Solo aplica a la entrega a domicilio; el retiro no la usa.
 */
export interface DeliveryScheduling {
  /** El cliente elige día (y franja, si hay) al comprar con entrega a domicilio. */
  enabled: boolean;
  /** Franjas horarias, ej. "9:00 am – 12:00 m" (≤ 6, cada una ≤ 40, sin repetir). [] = el cliente solo elige el día. */
  slots: string[];
  /** Días atendidos: 0 = domingo … 6 = sábado (con la programación activa, al menos uno). */
  weekdays: number[];
  /** Antelación mínima en días: el primer día elegible es «hoy en Caracas» + N (0..14). */
  minLeadDays: number;
  /** Hasta cuántos días hacia adelante se puede elegir (1..60); debe superar la antelación en al menos 6. */
  horizonDays: number;
}
/** Nombre corto con el que los contratos y las pantallas se refieren a la programación. */
export type Scheduling = DeliveryScheduling;

export interface WineStoreConfig {
  /** Tienda abierta; false = no se compra (los precios pueden verse). */
  enabled: boolean;
  /** Aviso de tienda cerrada; "" = el texto por defecto. */
  closedMessage: string;
  pickup: { enabled: boolean; place: string; hours: string; instructions: string };
  delivery: {
    enabled: boolean;
    /** coordinate: el costo se acuerda por WhatsApp y NO va en el total; flat: costo único; zones: costo por zona. */
    mode: DeliveryMode;
    flatFeeUsd: number;
    zones: DeliveryZone[];
    /** Envío gratis si el subtotal ≥ este monto (flat y zones); null = nunca. */
    freeFromUsd: number | null;
    instructions: string;
    /** Día y franja de entrega que elige el cliente al comprar (configuraciones guardadas antes de existir: valores por defecto). */
    scheduling: DeliveryScheduling;
  };
  /** Tope de botellas por vino y pedido cuando el vino no define el suyo (1..24). */
  defaultMaxPerOrder: number;
  /** Condiciones de compra personalizadas, una por línea; [] = se usan las generadas a partir de la configuración. */
  terms: { es: string[]; en: string[] };
}

/** Máximos de cada campo (el panel los usa para `maxLength` y el servidor para validar). */
export const WINE_STORE_LIMITS = {
  closedMessage: 300,
  pickupPlace: 160,
  pickupHours: 160,
  pickupInstructions: 300,
  deliveryInstructions: 300,
  zoneName: 60,
  maxZones: 20,
  maxFeeUsd: 1000,
  /** Mismo tope que el precio de un vino. */
  maxFreeFromUsd: 100_000,
  maxTermLines: 12,
  termLength: 300,
  /** Franjas horarias de la programación de la entrega y largo de cada una. */
  maxSlots: 6,
  slotLength: 40,
  /** Antelación mínima (0..14 días) y días hacia adelante (1..60) de la programación. */
  maxLeadDays: 14,
  maxHorizonDays: 60,
  /** Con ≥ 7 días de ventana (horizonte − antelación ≥ 6) cada día de la semana aparece al menos una vez: siempre hay una fecha. */
  minWindowSpanDays: 6,
} as const;

/** Zonas de Caracas que el panel ofrece como sugerencia al definir las zonas de entrega (el costo lo llena el administrador). */
export const CARACAS_ZONE_SUGGESTIONS: readonly string[] = [
  "Chacao",
  "Altamira",
  "La Castellana",
  "Las Mercedes",
  "Los Palos Grandes",
  "El Rosal",
  "Sabana Grande",
  "Los Dos Caminos",
  "La Trinidad",
  "Prados del Este",
  "El Cafetal",
  "Los Chorros",
  "Santa Fe",
  "El Hatillo",
];

function defaultScheduling(): DeliveryScheduling {
  return { enabled: false, slots: [], weekdays: [1, 2, 3, 4, 5, 6], minLeadDays: 1, horizonDays: 14 };
}

/** Programación por defecto (apagada; de lunes a sábado, desde mañana y hasta 14 días). Devuelve una copia nueva. */
export const defaultDeliveryScheduling = defaultScheduling;

function defaultWineStore(): WineStoreConfig {
  return {
    enabled: true,
    closedMessage: "",
    pickup: { enabled: true, place: "", hours: "", instructions: "" },
    delivery: {
      enabled: true,
      mode: "coordinate",
      flatFeeUsd: 0,
      zones: [],
      freeFromUsd: null,
      instructions: "",
      scheduling: defaultScheduling(),
    },
    defaultMaxPerOrder: WINE_DEFAULT_MAX_PER_ORDER,
    terms: { es: [], en: [] },
  };
}

/** Valores por defecto: el comportamiento de la tienda v1 (retiro y entrega a coordinar por WhatsApp, tope de 12). */
export const DEFAULT_WINE_STORE: WineStoreConfig = defaultWineStore();

/** Error de validación (mensaje apto para mostrar en el panel → responder 400). */
export class WineStoreConfigError extends Error {}

/* ─── Lectura tolerante de la configuración ─── */

const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/g;
/**
 * Una etiqueta HTML. `[^<>]*` (sin `<`) es lo que la hace lineal: un `<a` sin `>` se descarta al llegar al siguiente `<`
 * en lugar de recorrer todo el resto del texto (con `[^>]*` cada `<a` repetido lo reexploraba: coste cuadrático).
 */
const HTML_TAG = /<\/?[a-z!][^<>]*>/gi;
/** Lo mismo sin la bandera `g` (sin estado entre llamadas) para preguntar si queda alguna. */
const HAS_TAG = /<\/?[a-z!][^<>]*>/i;
/** Vueltas máximas quitando etiquetas anidadas (`<<b>b>` deja una nueva al quitar la de dentro). */
const TAG_PASSES = 8;

/** Recorta sin partir un par sustituto (emoji) por la mitad. */
function cut(s: string, max: number): string {
  if (s.length <= max) return s;
  const out = s.slice(0, max);
  const last = out.charCodeAt(out.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? out.slice(0, -1) : out;
}

/**
 * Texto de una sola línea: sin caracteres de control ni etiquetas HTML, con los espacios normalizados.
 * (Todo texto se muestra escapado —React, correo, WhatsApp—; esto es una segunda defensa y evita texto basura.)
 * Lo recibido se corta a un largo razonable ANTES de quitar etiquetas, para que un texto enorme no cueste tiempo de más.
 */
function line(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // Margen para lo que se quita (etiquetas, espacios repetidos) sin cortar de más lo que sí se queda.
  let s = cut(v, max * 4 + 256).replace(INVISIBLE, "");
  for (let pass = 0; pass < TAG_PASSES; pass++) {
    const next = s.replace(HTML_TAG, "");
    if (next === s) break;
    s = next;
  }
  // Si tras las vueltas permitidas aún queda una etiqueta (anidado exagerado), se descartan los corchetes que sobran.
  if (HAS_TAG.test(s)) s = s.replace(/[<>]/g, "");
  return cut(s.replace(/\s+/g, " ").trim(), max);
}

const record = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === "boolean" ? v : fallback);

/**
 * Número escrito por una persona. Los textos se interpretan con las MISMAS reglas que el precio de un vino
 * (`parseMoneyText`): "12", "12.5", "12,5", "$12", "12 USD", "1.000" (= mil) o "1.234,56". null = vacío; NaN = no es un
 * monto (por ejemplo "5.5.5" o ",").
 */
function readNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v !== "string") return NaN;
  const s = v.replace(/usd|\$|\s/gi, "");
  if (!s) return null;
  return parseMoneyText(s);
}

/** Monto en USD entre 0 y `max`, con 2 decimales. Vacío = `empty`; un valor que no es número o está fuera de rango es un error. */
function readMoney(v: unknown, label: string, max: number, empty: number | null): number | null {
  const n = readNumber(v);
  if (n === null) return empty;
  if (!Number.isFinite(n)) throw new WineStoreConfigError(`${label}: escriba un monto en dólares válido.`);
  if (n < 0 || n > max) throw new WineStoreConfigError(`${label}: debe estar entre $0 y $${max}.`);
  return round2(n);
}

/** Base de un id de zona: minúsculas, sin acentos, solo letras, números y guiones (máx. 40). */
function slug(v: unknown): string {
  const s = typeof v === "string" ? v : "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

const nameKey = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function readZones(raw: unknown): DeliveryZone[] {
  const rows = Array.isArray(raw) ? raw : [];
  if (rows.length > 200) throw new WineStoreConfigError(`Puede definir hasta ${WINE_STORE_LIMITS.maxZones} zonas de entrega.`);
  const zones: { name: string; feeUsd: number; rawId: string }[] = [];
  rows.forEach((item, i) => {
    if (!item || typeof item !== "object") return;
    const z = item as Record<string, unknown>;
    const name = line(z.name, WINE_STORE_LIMITS.zoneName);
    const fee = readMoney(z.feeUsd, `Zona ${name ? `«${name}»` : `#${i + 1}`}`, WINE_STORE_LIMITS.maxFeeUsd, 0) ?? 0;
    if (!name) {
      // Una fila en blanco se descarta; una con costo pero sin nombre es un olvido que se avisa.
      if (fee > 0) throw new WineStoreConfigError(`La zona #${i + 1} tiene costo pero no tiene nombre.`);
      return;
    }
    zones.push({ name, feeUsd: fee, rawId: slug(z.id) });
  });
  if (zones.length > WINE_STORE_LIMITS.maxZones) {
    throw new WineStoreConfigError(`Puede definir hasta ${WINE_STORE_LIMITS.maxZones} zonas de entrega.`);
  }
  const names = new Set<string>();
  for (const z of zones) {
    const key = nameKey(z.name);
    if (names.has(key)) throw new WineStoreConfigError(`Hay dos zonas llamadas «${z.name}»: use nombres distintos.`);
    names.add(key);
  }
  // Los ids que ya traen las zonas se conservan (el cliente tiene el checkout abierto con ellos); el resto se genera
  // a partir del nombre. Siempre únicos: un id repetido o vacío recibe uno nuevo.
  const used = new Set<string>();
  const ids: string[] = zones.map((z) => {
    if (!z.rawId || used.has(z.rawId)) return "";
    used.add(z.rawId);
    return z.rawId;
  });
  return zones.map((z, i) => {
    let id = ids[i];
    if (!id) {
      const base = slug(z.name) || `zona-${i + 1}`;
      id = base;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
      used.add(id);
    }
    return { id, name: z.name, feeUsd: z.feeUsd };
  });
}

/** Hasta cuántos caracteres de una condición se leen para medirla (más allá solo se sabe que es demasiado larga). */
const TERM_READ_CAP = WINE_STORE_LIMITS.termLength * 4;

/** Condiciones de compra: un arreglo de líneas (o un texto con una condición por línea). */
function readTerms(raw: unknown, label: string): string[] {
  const rows = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : [];
  if (rows.length > 200) throw new WineStoreConfigError(`Condiciones de compra (${label}): máximo ${WINE_STORE_LIMITS.maxTermLines} líneas.`);
  const lines = rows.map((r) => line(r, TERM_READ_CAP)).filter(Boolean);
  if (lines.length > WINE_STORE_LIMITS.maxTermLines) {
    throw new WineStoreConfigError(`Condiciones de compra (${label}): máximo ${WINE_STORE_LIMITS.maxTermLines} líneas.`);
  }
  lines.forEach((l, i) => {
    if (l.length > WINE_STORE_LIMITS.termLength) {
      throw new WineStoreConfigError(
        `Condiciones de compra (${label}), línea ${i + 1}: máximo ${WINE_STORE_LIMITS.termLength} caracteres (tiene ${
          l.length >= TERM_READ_CAP ? `más de ${TERM_READ_CAP - 1}` : l.length
        }).`
      );
    }
  });
  return lines;
}

/** Hasta cuántos caracteres de una franja se leen para medirla (más allá solo se sabe que es demasiado larga). */
const SLOT_READ_CAP = WINE_STORE_LIMITS.slotLength * 4;

/** Franjas horarias: un arreglo de textos (o un texto con una franja por línea). Se descartan las vacías. */
function readSlots(raw: unknown): string[] {
  const rows = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : [];
  const label = "Día y franja de entrega";
  if (rows.length > 200) throw new WineStoreConfigError(`${label}: puede definir hasta ${WINE_STORE_LIMITS.maxSlots} franjas horarias.`);
  const slots = rows.map((r) => line(r, SLOT_READ_CAP)).filter(Boolean);
  if (slots.length > WINE_STORE_LIMITS.maxSlots) {
    throw new WineStoreConfigError(`${label}: puede definir hasta ${WINE_STORE_LIMITS.maxSlots} franjas horarias.`);
  }
  const seen = new Set<string>();
  slots.forEach((slot, i) => {
    if (slot.length > WINE_STORE_LIMITS.slotLength) {
      throw new WineStoreConfigError(
        `${label}, franja ${i + 1}: máximo ${WINE_STORE_LIMITS.slotLength} caracteres (tiene ${slot.length >= SLOT_READ_CAP ? `más de ${SLOT_READ_CAP - 1}` : slot.length}).`
      );
    }
    const key = nameKey(slot);
    if (seen.has(key)) throw new WineStoreConfigError(`${label}: la franja «${slot}» está repetida. Use franjas distintas.`);
    seen.add(key);
  });
  return slots;
}

/** Días de la semana atendidos (0 = domingo … 6 = sábado), sin repetir y en orden. Ausente = lunes a sábado. */
function readWeekdays(raw: unknown, fallback: number[]): number[] {
  if (raw === undefined || raw === null) return [...fallback];
  const rows = Array.isArray(raw) ? raw : [];
  if (rows.length > 100) throw new WineStoreConfigError("Día y franja de entrega: los días de la semana no son válidos.");
  const days = new Set<number>();
  for (const r of rows) {
    const n = typeof r === "string" && /^\d$/.test(r.trim()) ? Number(r.trim()) : r;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 6) {
      throw new WineStoreConfigError("Día y franja de entrega: los días de la semana no son válidos.");
    }
    days.add(n);
  }
  return Array.from(days).sort((a, b) => a - b);
}

/** Número entero de días entre `min` y `max`. Vacío = `fallback`; cualquier otra cosa es un error. */
function readDays(v: unknown, label: string, min: number, max: number, fallback: number): number {
  const n = readNumber(v);
  if (n === null) return fallback;
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new WineStoreConfigError(`Día y franja de entrega, ${label}: debe ser un número entero de ${min} a ${max}.`);
  }
  return n;
}

/**
 * Programación de la entrega. Tolerante con lo que falta (una configuración guardada antes de existir este bloque toma los
 * valores por defecto) y estricta con lo escrito. Con la programación activa exige al menos un día de la semana y una ventana
 * de al menos 7 días (horizonte − antelación ≥ 6): así cada día de la semana aparece una vez y siempre hay una fecha que ofrecer.
 */
function readScheduling(raw: unknown): DeliveryScheduling {
  const s = record(raw);
  const def = defaultScheduling();
  const out: DeliveryScheduling = {
    enabled: bool(s.enabled, def.enabled),
    slots: readSlots(s.slots),
    weekdays: readWeekdays(s.weekdays, def.weekdays),
    minLeadDays: readDays(s.minLeadDays, "antelación mínima", 0, WINE_STORE_LIMITS.maxLeadDays, def.minLeadDays),
    horizonDays: readDays(s.horizonDays, "días hacia adelante", 1, WINE_STORE_LIMITS.maxHorizonDays, def.horizonDays),
  };
  if (out.enabled) {
    if (!out.weekdays.length) {
      throw new WineStoreConfigError("Día y franja de entrega: elija al menos un día de la semana en que entrega.");
    }
    if (out.horizonDays - out.minLeadDays < WINE_STORE_LIMITS.minWindowSpanDays) {
      throw new WineStoreConfigError(
        `Día y franja de entrega: los días hacia adelante deben superar la antelación mínima en al menos ${WINE_STORE_LIMITS.minWindowSpanDays} (por ejemplo, antelación de 1 día y hasta 14 días), para que siempre haya una fecha disponible.`
      );
    }
  }
  return out;
}

/**
 * Normaliza una configuración recibida del panel o leída de la base. Tolerante: lo que falta o viene con otro tipo
 * toma el valor por defecto. Lanza `WineStoreConfigError` (mensaje para el panel) si un valor escrito no es válido
 * (montos fuera de rango, más de 20 zonas, zonas repetidas, condiciones demasiado largas…) o si la combinación no
 * funciona: al menos una forma de entrega activa y, en modo «por zonas», al menos una zona con nombre.
 */
export function normalizeWineStoreConfig(input: unknown): WineStoreConfig {
  const raw = record(input);
  const p = record(raw.pickup);
  const d = record(raw.delivery);
  const t = record(raw.terms);
  const def = defaultWineStore();

  const mode: DeliveryMode = DELIVERY_MODES.includes(d.mode as DeliveryMode) ? (d.mode as DeliveryMode) : def.delivery.mode;
  // 0 o vacío = sin envío gratis: un «gratis desde $0» sería siempre gratis y casi seguro es un descuido.
  const freeFrom = readMoney(d.freeFromUsd, "Envío gratis desde", WINE_STORE_LIMITS.maxFreeFromUsd, null);

  let defaultMax = def.defaultMaxPerOrder;
  const maxRaw = readNumber(raw.defaultMaxPerOrder);
  if (maxRaw !== null) {
    if (!Number.isInteger(maxRaw) || maxRaw < 1 || maxRaw > WINE_MAX_PER_ORDER_LIMIT) {
      throw new WineStoreConfigError(`El máximo de botellas por vino debe ser un número entero de 1 a ${WINE_MAX_PER_ORDER_LIMIT}.`);
    }
    defaultMax = maxRaw;
  }

  const config: WineStoreConfig = {
    enabled: bool(raw.enabled, def.enabled),
    closedMessage: line(raw.closedMessage, WINE_STORE_LIMITS.closedMessage),
    pickup: {
      enabled: bool(p.enabled, def.pickup.enabled),
      place: line(p.place, WINE_STORE_LIMITS.pickupPlace),
      hours: line(p.hours, WINE_STORE_LIMITS.pickupHours),
      instructions: line(p.instructions, WINE_STORE_LIMITS.pickupInstructions),
    },
    delivery: {
      enabled: bool(d.enabled, def.delivery.enabled),
      mode,
      flatFeeUsd: readMoney(d.flatFeeUsd, "Costo de envío", WINE_STORE_LIMITS.maxFeeUsd, 0) ?? 0,
      zones: readZones(d.zones),
      freeFromUsd: freeFrom !== null && freeFrom > 0 ? freeFrom : null,
      instructions: line(d.instructions, WINE_STORE_LIMITS.deliveryInstructions),
      scheduling: readScheduling(d.scheduling),
    },
    defaultMaxPerOrder: defaultMax,
    terms: { es: readTerms(t.es, "español"), en: readTerms(t.en, "inglés") },
  };

  if (!config.pickup.enabled && !config.delivery.enabled) {
    throw new WineStoreConfigError("Active al menos una forma de entrega: el retiro o el envío a domicilio.");
  }
  if (config.delivery.enabled && config.delivery.mode === "zones" && !config.delivery.zones.length) {
    throw new WineStoreConfigError("Agregue al menos una zona de envío con nombre, o elija otro modo de envío.");
  }
  return config;
}

/* ─── Lo público ─── */

export type PolicyText = { title: string; items: string[]; accept: string };

/** Lo único que ve el público (nunca la configuración cruda). */
export type PublicWineStore = {
  enabled: boolean;
  /** "" = el llamador usa su texto por defecto (en el idioma del visitante). */
  closedMessage: string;
  pickup: WineStoreConfig["pickup"];
  delivery: WineStoreConfig["delivery"];
  defaultMaxPerOrder: number;
  /** Condiciones de compra ya resueltas: las personalizadas o, si no hay, las generadas. */
  policies: { es: PolicyText; en: PolicyText };
};

/**
 * Lo público de la configuración: del envío solo el costo y las zonas del modo ACTIVO (nada de montos de un modo que no se
 * usa). El lugar, el horario y las indicaciones de retiro y entrega se conservan aunque el canal esté en pausa, porque los
 * pedidos ya hechos por ese canal los siguen mostrando. La forma es la de `WineStoreConfig` (los campos que no aplican
 * quedan vacíos), así `quoteShipping` sigue funcionando con lo público. `delivery.scheduling` solo trae la programación real si
 * hay entrega a domicilio Y la programación está activa; si no, la forma por defecto con `enabled: false`.
 */
export function toPublicWineStore(c: WineStoreConfig): PublicWineStore {
  const p = c.pickup;
  const d = c.delivery;
  return {
    enabled: c.enabled,
    closedMessage: c.closedMessage,
    pickup: { ...p },
    delivery: d.enabled
      ? {
          enabled: true,
          mode: d.mode,
          // Solo el costo del modo activo: el fijo si es «costo fijo», las zonas si es «por zonas»; «gratis desde» no aplica a «coordinar».
          flatFeeUsd: d.mode === "flat" ? d.flatFeeUsd : 0,
          zones: d.mode === "zones" ? d.zones.map((z) => ({ ...z })) : [],
          freeFromUsd: d.mode !== "coordinate" ? d.freeFromUsd : null,
          instructions: d.instructions,
          // La programación solo se publica si está activa y hay entrega a domicilio; si no, la forma por defecto apagada.
          scheduling: d.scheduling?.enabled
            ? { ...d.scheduling, slots: [...d.scheduling.slots], weekdays: [...d.scheduling.weekdays] }
            : defaultScheduling(),
        }
      : {
          enabled: false,
          mode: d.mode,
          flatFeeUsd: 0,
          zones: [],
          freeFromUsd: null,
          instructions: d.instructions,
          scheduling: defaultScheduling(),
        },
    defaultMaxPerOrder: c.defaultMaxPerOrder,
    policies: { es: buildWinePolicies(c, "es"), en: buildWinePolicies(c, "en") },
  };
}

/* ─── Condiciones de compra ─── */

/** "$12", "$12,50" (es) o "$12.50" (en). */
function usd(n: number, lang: "es" | "en"): string {
  const v = round2(n);
  const s = Number.isInteger(v) ? String(v) : v.toFixed(2);
  return `$${lang === "es" ? s.replace(".", ",") : s}`;
}

/** Cierra con punto (sin duplicarlo si el texto ya termina en puntuación). */
const sentence = (s: string) => (/[.!?…]$/.test(s) ? s : `${s}.`);

/** Recorta a `max` caracteres con «…» al final (sin partir un emoji por la mitad). */
function ellipsize(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${cut(s, Math.max(0, max - 1)).trimEnd()}…`;
}

/**
 * Reparte `room` caracteres entre el lugar y el horario: lo que ya cabe no se toca; si no caben los dos, cada uno puede
 * usar la mitad y el que sobra le cede lo suyo al otro.
 */
function shareRoom(place: string, hours: string, room: number): [string, string] {
  if (place.length + hours.length <= room) return [place, hours];
  const half = Math.floor(room / 2);
  const placeRoom = place.length <= half ? place.length : hours.length <= half ? room - hours.length : half;
  return [ellipsize(place, placeRoom), ellipsize(hours, room - Math.min(place.length, placeRoom))];
}

function pickupLine(c: WineStoreConfig, lang: "es" | "en"): string {
  const es = lang === "es";
  const build = (place: string, hours: string): string => {
    if (es) {
      if (place && hours) return `${sentence(`Retiro en ${place}`)} ${sentence(`Horario: ${hours}`)}`;
      if (place) return `${sentence(`Retiro en ${place}`)} Coordinamos el horario por WhatsApp una vez confirmado el pago.`;
      if (hours) return `${sentence(`Horario de retiro: ${hours}`)} Coordinamos el punto por WhatsApp una vez confirmado el pago.`;
      return "El retiro se coordina por WhatsApp una vez confirmado el pago.";
    }
    if (place && hours) return `${sentence(`Pickup at ${place}`)} ${sentence(`Hours: ${hours}`)}`;
    if (place) return `${sentence(`Pickup at ${place}`)} We arrange the time on WhatsApp once your payment is confirmed.`;
    if (hours) return `${sentence(`Pickup hours: ${hours}`)} We arrange the pickup point on WhatsApp once your payment is confirmed.`;
    return "Pickup is arranged on WhatsApp once your payment is confirmed.";
  };
  const { place, hours } = c.pickup;
  const full = build(place, hours);
  if (full.length <= WINE_STORE_LIMITS.termLength) return full;
  // Lugar (160) + horario (160) + las frases fijas pasan de 300: no se podría editar en el panel (cada condición admite 300).
  // Se acortan el lugar y el horario, que son lo único variable, para que la línea quepa.
  const marks = (place ? 1 : 0) + (hours ? 1 : 0);
  const room = Math.max(marks, WINE_STORE_LIMITS.termLength - (build(place ? "x" : "", hours ? "x" : "").length - marks));
  const [p, h] = place && hours ? shareRoom(place, hours, room) : [ellipsize(place, room), ellipsize(hours, room)];
  return ellipsize(build(p, h), WINE_STORE_LIMITS.termLength);
}

function deliveryLine(c: WineStoreConfig, lang: "es" | "en"): string {
  const d = c.delivery;
  const es = lang === "es";
  const fees = d.mode === "zones" ? d.zones.map((z) => z.feeUsd) : d.mode === "flat" ? [d.flatFeeUsd] : [];
  if (d.mode === "coordinate" || !fees.length) {
    return es
      ? "La entrega a domicilio se coordina por WhatsApp una vez confirmado el pago. El costo del envío no está incluido en el total: se acuerda aparte."
      : "Home delivery is arranged on WhatsApp once your payment is confirmed. The delivery cost is not included in the total: it is agreed separately.";
  }
  const min = Math.min(...fees);
  const max = Math.max(...fees);
  let text: string;
  if (max === 0) {
    text = es ? "La entrega a domicilio no tiene costo." : "Home delivery is free.";
  } else if (min === max) {
    text = es
      ? `La entrega a domicilio cuesta ${usd(max, lang)} y se suma al total de tu pedido.`
      : `Home delivery costs ${usd(max, lang)} and is added to the total of your order.`;
  } else {
    text = es
      ? `El costo de la entrega a domicilio depende de la zona que elijas (de ${usd(min, lang)} a ${usd(max, lang)}) y se suma al total de tu pedido.`
      : `The cost of home delivery depends on the zone you choose (from ${usd(min, lang)} to ${usd(max, lang)}) and is added to the total of your order.`;
  }
  if (d.freeFromUsd !== null && max > 0) {
    text += es ? ` El envío es gratis en compras desde ${usd(d.freeFromUsd, lang)}.` : ` Delivery is free on purchases from ${usd(d.freeFromUsd, lang)}.`;
  }
  return text + (es ? " La entrega se coordina por WhatsApp una vez confirmado el pago." : " Delivery is arranged on WhatsApp once your payment is confirmed.");
}

/** «Entregamos solo en las zonas indicadas en la tienda: A, B, C.» (toda la línea ≤ 300 caracteres; si no caben todas, termina en «…»). */
function zonesLine(c: WineStoreConfig, lang: "es" | "en"): string | null {
  const d = c.delivery;
  if (d.mode !== "zones" || !d.zones.length) return null;
  const head = lang === "es" ? "Entregamos solo en las zonas indicadas en la tienda: " : "We deliver only to the zones listed in the store: ";
  const max = WINE_STORE_LIMITS.termLength;
  let list = "";
  let shown = 0;
  for (const z of d.zones) {
    const next = list ? `${list}, ${z.name}` : z.name;
    // Se reserva un carácter para el cierre (punto o «…»).
    if (head.length + next.length + 1 > max) break;
    list = next;
    shown++;
  }
  return `${head}${list}${shown < d.zones.length ? "…" : "."}`;
}

/** La entrega la recibe una persona adulta (se repite en los avisos de pedidos a domicilio aunque las condiciones sean personalizadas). */
function deliveryAgeLine(lang: "es" | "en"): string {
  return lang === "es" ? "La entrega se hace a una persona mayor de 18 años." : "Delivery is made to a person over 18 years old.";
}

/** El día (y la franja) que elige el cliente es una preferencia que se confirma por WhatsApp. */
function schedulingLine(c: WineStoreConfig, lang: "es" | "en"): string {
  const withSlots = (c.delivery.scheduling?.slots?.length ?? 0) > 0;
  if (lang === "es") {
    return withSlots
      ? "El día y la franja que eliges son una preferencia: los confirmamos contigo por WhatsApp."
      : "El día que eliges es una preferencia: lo confirmamos contigo por WhatsApp.";
  }
  return withSlots
    ? "The day and time slot you choose are a preference: we confirm them with you on WhatsApp."
    : "The day you choose is a preference: we confirm it with you on WhatsApp.";
}

/**
 * Condiciones de compra (casilla del checkout, pie del pedido y del correo). Si el administrador escribió las suyas
 * para este idioma se usan tal cual; si no, se generan a partir de la configuración (retiro, entrega, costos).
 */
export function buildWinePolicies(c: WineStoreConfig, lang: "es" | "en"): PolicyText {
  const es = lang === "es";
  const title = es ? "Condiciones de compra" : "Purchase terms";
  const accept = es
    ? "Declaro ser mayor de 18 años y acepto las condiciones de compra."
    : "I confirm that I am over 18 and I accept the purchase terms.";
  const custom = c.terms?.[lang];
  if (Array.isArray(custom) && custom.length) return { title, items: [...custom], accept };

  const items: string[] = es
    ? [
        "Tu pedido se confirma cuando verificamos tu pago.",
        `Si no reportas tu pago, el pedido vence a las ${WINE_PENDING_TTL_HOURS} horas. Si ya venció, escríbenos por WhatsApp o haz un pedido nuevo.`,
        "Los precios están en dólares (USD). Si pagas en bolívares, el monto se calcula con la tasa oficial del BCV del día.",
        "Los vinos están sujetos a disponibilidad: si alguno se agotó antes de confirmar tu pago, te avisaremos por WhatsApp para acordar una solución.",
      ]
    : [
        "Your order is confirmed once we verify your payment.",
        `If you do not report your payment, the order expires after ${WINE_PENDING_TTL_HOURS} hours. If it has expired, message us on WhatsApp or place a new order.`,
        "Prices are in US dollars (USD). If you pay in bolívares, the amount is calculated with the official BCV rate of the day.",
        "Wines are subject to availability: if one sells out before your payment is confirmed, we will let you know on WhatsApp to agree on a solution.",
      ];
  if (c.pickup.enabled) items.push(pickupLine(c, lang));
  if (c.delivery.enabled) {
    items.push(deliveryLine(c, lang));
    const zones = zonesLine(c, lang);
    if (zones) items.push(zones);
    items.push(deliveryAgeLine(lang));
    if (c.delivery.scheduling?.enabled) items.push(schedulingLine(c, lang));
  }
  items.push(
    es
      ? "Si recibes un producto dañado o distinto al que pediste, escríbenos por WhatsApp para resolverlo."
      : "If you receive a damaged product or one different from what you ordered, message us on WhatsApp so we can sort it out.",
    es ? "La venta de bebidas alcohólicas es solo para mayores de 18 años." : "Alcoholic beverages are sold only to people over 18."
  );
  // Cada condición generada cabe en lo que admite el panel (WINE_STORE_LIMITS.termLength): así se puede cargar y editar.
  return { title, items: items.map((i) => ellipsize(i, WINE_STORE_LIMITS.termLength)), accept };
}

/* ─── Envío ─── */

export type ShippingQuote =
  | { ok: true; shippingUsd: number; zone: DeliveryZone | null; coordinated: boolean }
  | { ok: false; code: "pickup_disabled" | "delivery_disabled" | "zone_required" | "zone_invalid"; message: string };

/**
 * Costo de envío de un pedido según la configuración (el servidor es quien lo calcula: nunca se confía en un monto del cliente).
 * retiro → 0; entrega en modo «coordinar» → 0 y `coordinated` (el costo se acuerda por WhatsApp y no va en el total);
 * costo fijo → `flatFeeUsd`; por zonas → el costo de la zona elegida (`zoneId` obligatorio).
 * En costo fijo y por zonas, un subtotal ≥ `freeFromUsd` deja el envío en 0.
 */
export function quoteShipping(
  c: WineStoreConfig,
  q: { fulfillment: "pickup" | "delivery"; subtotalUsd: number; zoneId?: string | null }
): ShippingQuote {
  if (q.fulfillment !== "delivery") {
    if (!c.pickup.enabled) return { ok: false, code: "pickup_disabled", message: "El retiro no está disponible por ahora. Elige la entrega a domicilio." };
    return { ok: true, shippingUsd: 0, zone: null, coordinated: false };
  }
  const d = c.delivery;
  if (!d.enabled) return { ok: false, code: "delivery_disabled", message: "La entrega a domicilio no está disponible por ahora. Elige el retiro." };
  if (d.mode === "coordinate") return { ok: true, shippingUsd: 0, zone: null, coordinated: true };

  const subtotal = Number.isFinite(q.subtotalUsd) ? Math.max(0, round2(q.subtotalUsd)) : 0;
  const free = d.freeFromUsd !== null && subtotal >= d.freeFromUsd;

  if (d.mode === "flat") return { ok: true, shippingUsd: free ? 0 : round2(d.flatFeeUsd), zone: null, coordinated: false };

  // Por zonas
  if (!d.zones.length) return { ok: false, code: "delivery_disabled", message: "La entrega a domicilio no está disponible por ahora. Elige el retiro." };
  const zoneId = typeof q.zoneId === "string" ? q.zoneId.trim() : "";
  if (!zoneId) return { ok: false, code: "zone_required", message: "Elige la zona de entrega." };
  const zone = d.zones.find((z) => z.id === zoneId);
  if (!zone) return { ok: false, code: "zone_invalid", message: "La zona de entrega elegida ya no está disponible. Elige otra." };
  return { ok: true, shippingUsd: free ? 0 : round2(zone.feeUsd), zone: { ...zone }, coordinated: false };
}

/* ─── Programación de la entrega: día y franja (funciones puras; no dependen de la zona horaria del servidor ni del navegador) ─── */

/** Caracas está en UTC−4 todo el año (sin horario de verano desde 2016). */
const CARACAS_OFFSET_MS = -4 * 3_600_000;
const DAY_MS = 86_400_000;

const pad2 = (n: number) => String(n).padStart(2, "0");
const ymdOf = (d: Date) => `${String(d.getUTCFullYear()).padStart(4, "0")}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

/**
 * «Hoy» en Caracas como 'YYYY-MM-DD' (UTC−4 fijo). `now` en milisegundos (por defecto `Date.now()`, así que respeta un reloj
 * parcheado en las pruebas). Cerca de la medianoche de Caracas el día de Caracas y el del servidor (UTC) no coinciden: este es el que vale.
 */
export function caracasToday(now: number = Date.now()): string {
  const d = new Date((Number.isFinite(now) ? now : Date.now()) + CARACAS_OFFSET_MS);
  return ymdOf(Number.isNaN(d.getTime()) ? new Date(Date.now() + CARACAS_OFFSET_MS) : d);
}

/** 'YYYY-MM-DD' que existe en el calendario → milisegundos UTC de ese día a las 00:00; si no, null. */
function ymdToUtc(v: unknown): number | null {
  if (typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  // Date.UTC "arregla" fechas imposibles (30 de febrero → 2 de marzo) y los años 0..99: se rechazan comparando de vuelta.
  return back.getUTCFullYear() === y && back.getUTCMonth() === mo - 1 && back.getUTCDate() === d ? t : null;
}

/** ¿Es 'YYYY-MM-DD' y una fecha real del calendario? */
export const isYmd = (v: unknown): v is string => ymdToUtc(v) !== null;

/** Entero acotado a [min, max]; si no es un número usa `fallback`. */
function intIn(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : fallback;
}

/**
 * Fechas ('YYYY-MM-DD') que el cliente puede elegir: de `hoy + minLeadDays` a `hoy + horizonDays` (ambos incluidos),
 * solo en los días de la semana atendidos. `today` es la fecha de Caracas (`caracasToday()`); si no es una fecha válida
 * devuelve []. No mira `enabled` (el panel la usa también para la vista previa con la programación apagada).
 */
export function deliveryDates(s: DeliveryScheduling, today: string): string[] {
  const base = ymdToUtc(today);
  if (base === null) return [];
  const days = new Set((Array.isArray(s?.weekdays) ? s.weekdays : []).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6));
  // Un número que falta o no es número toma el valor por defecto (la vista previa del panel puede pasar un borrador a medio escribir).
  const def = defaultScheduling();
  const lead = intIn(s?.minLeadDays, 0, WINE_STORE_LIMITS.maxLeadDays, def.minLeadDays);
  const horizon = intIn(s?.horizonDays, 0, WINE_STORE_LIMITS.maxHorizonDays, def.horizonDays);
  const out: string[] = [];
  for (let i = lead; i <= horizon; i++) {
    const d = new Date(base + i * DAY_MS);
    if (days.has(d.getUTCDay())) out.push(ymdOf(d));
  }
  return out;
}

/** ¿Hay entrega a domicilio con día y franja para elegir? (Sirve con la configuración completa y con la pública.) */
export function isSchedulingActive(c: { delivery: { enabled: boolean; scheduling?: DeliveryScheduling } }): boolean {
  return Boolean(c?.delivery?.enabled && c.delivery.scheduling?.enabled);
}

export type SchedulingCheck =
  | {
      ok: true;
      /** null solo cuando la programación no está activa: no hay nada que guardar (lo que el cliente haya enviado se ignora). */
      date: string | null;
      /** null si la programación no tiene franjas (solo día) o no está activa. */
      slot: string | null;
    }
  | {
      ok: false;
      /** schedule_required: falta elegir (400). schedule_invalid: lo elegido ya no es válido, p. ej. cambió la configuración (409). */
      code: "schedule_required" | "schedule_invalid";
      /** Qué campo del cuerpo del checkout corregir. */
      field: "deliveryDate" | "deliverySlot";
      message: string;
    };

/**
 * Valida el día y la franja que eligió el cliente contra la configuración de AHORA. `today` = `caracasToday()` (el servidor
 * lo calcula siempre; nunca se confía en la fecha del cliente). Con la programación apagada devuelve `{ ok: true, date: null,
 * slot: null }`. Con franjas configuradas la franja es obligatoria y debe ser una de ellas; sin franjas se ignora.
 */
export function schedulingCheck(
  c: { delivery: { enabled: boolean; scheduling?: DeliveryScheduling } },
  input: { date?: unknown; slot?: unknown },
  today: string
): SchedulingCheck {
  if (!isSchedulingActive(c)) return { ok: true, date: null, slot: null };
  const s = c.delivery.scheduling as DeliveryScheduling;

  const rawDate = typeof input?.date === "string" ? input.date.trim() : input?.date;
  if (rawDate === undefined || rawDate === null || rawDate === "") {
    return { ok: false, code: "schedule_required", field: "deliveryDate", message: "Elige el día de entrega." };
  }
  if (typeof rawDate !== "string" || !deliveryDates(s, today).includes(rawDate)) {
    return {
      ok: false,
      code: "schedule_invalid",
      field: "deliveryDate",
      message: "El día de entrega que elegiste ya no está disponible. Elige otro.",
    };
  }
  if (!s.slots.length) return { ok: true, date: rawDate, slot: null };

  const rawSlot = typeof input?.slot === "string" ? input.slot.replace(/\s+/g, " ").trim() : input?.slot;
  if (rawSlot === undefined || rawSlot === null || rawSlot === "") {
    return { ok: false, code: "schedule_required", field: "deliverySlot", message: "Elige la franja horaria de entrega." };
  }
  if (typeof rawSlot !== "string" || !s.slots.includes(rawSlot)) {
    return {
      ok: false,
      code: "schedule_invalid",
      field: "deliverySlot",
      message: "La franja horaria que elegiste ya no está disponible. Elige otra.",
    };
  }
  return { ok: true, date: rawDate, slot: rawSlot };
}

const WEEKDAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * 'YYYY-MM-DD' → «martes 21 de octubre» (es) / «Tuesday, October 21» (en). Calcula el día de la semana con aritmética de
 * calendario en UTC: no depende de la zona horaria del servidor ni del navegador. Una fecha que no existe devuelve "".
 */
export function formatDeliveryDate(ymd: string, lang: "es" | "en"): string {
  const t = ymdToUtc(ymd);
  if (t === null) return "";
  const d = new Date(t);
  const day = d.getUTCDate();
  const wd = d.getUTCDay();
  const mo = d.getUTCMonth();
  return lang === "es" ? `${WEEKDAYS_ES[wd]} ${day} de ${MONTHS_ES[mo]}` : `${WEEKDAYS_EN[wd]}, ${MONTHS_EN[mo]} ${day}`;
}
