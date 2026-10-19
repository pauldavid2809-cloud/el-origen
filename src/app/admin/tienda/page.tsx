"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { parseMoneyText, round2, WINE_MAX_PER_ORDER_LIMIT } from "@/lib/wineSale";
import {
  buildWinePolicies,
  caracasToday,
  CARACAS_ZONE_SUGGESTIONS,
  defaultDeliveryScheduling,
  deliveryDates,
  formatDeliveryDate,
  normalizeWineStoreConfig,
  quoteShipping,
  WINE_STORE_LIMITS,
  type DeliveryMode,
  type DeliveryScheduling,
  type PolicyText,
  type WineStoreConfig,
} from "@/lib/wineStoreRules";

/* Tienda de vinos: todo lo que antes estaba fijo en el código y ahora define el administrador: si la tienda está abierta,
   retiro, entrega (costo fijo o por zonas, día y franja que elige el cliente), tope de botellas y condiciones de compra.
   Se guarda con PUT en /api/admin/settings/wine-store (el cuerpo es la configuración completa, igual que en Configuración
   de pagos): el cuerpo lleva SIEMPRE `delivery.scheduling`, porque un PUT sin ese bloque lo reinicia a los valores por defecto. */

/** Largo máximo de lo que se escribe en un campo de monto: los dígitos del mayor valor permitido más separadores, centavos, «$» y «USD». */
const MONEY_INPUT_MAX = String(WINE_STORE_LIMITS.maxFreeFromUsd).length + 10;
/** Largo máximo del máximo de botellas por vino (un entero de 1 a WINE_MAX_PER_ORDER_LIMIT). */
const MAX_PER_ORDER_DIGITS = String(WINE_MAX_PER_ORDER_LIMIT).length;
/** Desde cuántos caracteres el nombre de una zona muestra su contador (dos tercios del máximo). */
const ZONE_COUNTER_FROM = Math.round((WINE_STORE_LIMITS.zoneName * 2) / 3);

let keySeq = 0;
/** Fila de zona del formulario: `id` es el que ya tiene la zona guardada (se reenvía para que no cambie al renombrarla). */
type ZoneRow = { _k: number; id?: string; name: string; fee: string };
const zoneRow = (name = "", fee = "", id?: string): ZoneRow => ({ _k: ++keySeq, id, name, fee });

/** Fila de franja horaria del formulario. */
type SlotRow = { _k: number; text: string };
const slotRow = (text = ""): SlotRow => ({ _k: ++keySeq, text });

/** Día y franja de entrega tal como se edita: los números son el texto del campo. */
interface SchedulingForm {
  enabled: boolean;
  slots: SlotRow[];
  /** 0 = domingo … 6 = sábado (los mismos números que usa el servidor). */
  weekdays: number[];
  /** Antelación mínima en días (texto del campo). */
  minLead: string;
  /** Hasta cuántos días hacia adelante se puede elegir (texto del campo). */
  horizon: string;
}

interface FormState {
  enabled: boolean;
  closedMessage: string;
  pickup: { enabled: boolean; place: string; hours: string; instructions: string };
  delivery: {
    enabled: boolean;
    mode: DeliveryMode;
    /** Texto del campo (acepta coma o punto). */
    flatFee: string;
    zones: ZoneRow[];
    /** Texto del campo; vacío = nunca es gratis. */
    freeFrom: string;
    instructions: string;
    scheduling: SchedulingForm;
  };
  /** Texto del campo. */
  defaultMax: string;
  /** Una condición por línea; vacío = se generan solas. */
  termsEs: string;
  termsEn: string;
}

type GeneratedTerms = { es: PolicyText; en: PolicyText };

/* ─── Números y textos ─── */

/**
 * "5,5", "$7", "7 USD" o "1.234,50" → número; "" → null; lo que no es un monto → NaN. Se interpreta con `parseMoneyText`, la misma
 * función que usan el servidor (precio de los vinos y montos de la tienda): no hay un monto que el formulario lea de una forma
 * y el servidor de otra, y un descuido como "5.5.5" se rechaza en vez de guardarse como 555.
 */
function parseMoney(text: string): number | null {
  const s = text.replace(/usd|\$|\s/gi, "");
  if (!s) return null;
  return parseMoneyText(s);
}

/** El monto si es un número entre 0 y `max`; si no (vacío, inválido o fuera de rango), null. */
function moneyValue(text: string, max: number): number | null {
  const n = parseMoney(text);
  return n !== null && Number.isFinite(n) && n >= 0 && n <= max ? round2(n) : null;
}

/** Mensaje de error de un monto escrito (null si está vacío o es válido). */
function moneyError(text: string, max: number): string | null {
  const n = parseMoney(text);
  if (n === null) return null;
  if (!Number.isFinite(n)) return "Escriba el monto solo con números, por ejemplo 5 o 5,50.";
  if (n > max) return `El máximo permitido es $${max.toLocaleString("es-VE")}.`;
  return null;
}

/** 5.5 → "5,5" (así se escribe y se lee en el panel). */
const moneyText = (n: number) => String(n).replace(".", ",");
/** $5 / $5,50 */
const usd = (n: number) => `$${(Number.isInteger(n) ? String(n) : n.toFixed(2)).replace(".", ",")}`;

const nameKey = (name: string) =>
  name.replace(/\s+/g, " ").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Líneas de un texto de condiciones (sin vacías ni espacios de más). */
const termLines = (t: string) => t.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);

function termsError(text: string): string | null {
  const lines = termLines(text);
  if (lines.length > WINE_STORE_LIMITS.maxTermLines) {
    return `Escribió ${lines.length} condiciones: el máximo es ${WINE_STORE_LIMITS.maxTermLines}.`;
  }
  const long = lines.findIndex((l) => l.length > WINE_STORE_LIMITS.termLength);
  if (long >= 0) {
    return `La condición ${long + 1} tiene ${lines[long].length} caracteres: el máximo es ${WINE_STORE_LIMITS.termLength}.`;
  }
  return null;
}

/* ─── Día y franja de entrega ─── */

/** Días de la semana en el orden en que se leen aquí (lunes primero); `day` es el número del servidor (0 = domingo). */
const WEEKDAYS: { day: number; short: string; long: string }[] = [
  { day: 1, short: "Lun", long: "Lunes" },
  { day: 2, short: "Mar", long: "Martes" },
  { day: 3, short: "Mié", long: "Miércoles" },
  { day: 4, short: "Jue", long: "Jueves" },
  { day: 5, short: "Vie", long: "Viernes" },
  { day: 6, short: "Sáb", long: "Sábado" },
  { day: 0, short: "Dom", long: "Domingo" },
];
/** Cuántas fechas de la vista previa se escriben una por una (el resto se cuenta). */
const PREVIEW_DATES = 10;
/** Largo máximo de los campos de días (dos dígitos: 14 y 60 son los mayores valores permitidos). */
const DAYS_INPUT_MAX = Math.max(String(WINE_STORE_LIMITS.maxLeadDays).length, String(WINE_STORE_LIMITS.maxHorizonDays).length);

/** Texto de una franja con los espacios normalizados (así la mide y la compara el servidor). */
const slotText = (t: string) => t.replace(/\s+/g, " ").trim();

/** Entero entre `min` y `max` escrito en un campo; null si está vacío, no es un entero o queda fuera de rango. */
function wholeNumber(text: string, min: number, max: number): number | null {
  const s = text.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
}

/** «miércoles 21 de octubre» con la primera letra en mayúscula (para las fichas de la vista previa). */
const dateLabel = (ymd: string) => {
  const s = formatDeliveryDate(ymd, "es");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Franjas escritas y válidas: sin vacías, sin repetir (sin distinguir mayúsculas ni acentos), de hasta 40 caracteres y no más de 6. */
function cleanSlots(rows: SlotRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    const t = slotText(r.text);
    if (!t || t.length > WINE_STORE_LIMITS.slotLength) continue;
    const key = nameKey(t);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out.slice(0, WINE_STORE_LIMITS.maxSlots);
}

/**
 * La programación tal como la entiende el servidor si todo está en orden (al menos un día, números enteros y ventana de al menos
 * 7 días: horizonte − antelación ≥ 6); null si algo falta. La usan la vista previa de fechas y el cuerpo del PUT. `enabled` va
 * en true porque la vista previa se calcula también con el interruptor apagado.
 */
function draftScheduling(s: SchedulingForm): DeliveryScheduling | null {
  const lead = wholeNumber(s.minLead, 0, WINE_STORE_LIMITS.maxLeadDays);
  const horizon = wholeNumber(s.horizon, 1, WINE_STORE_LIMITS.maxHorizonDays);
  if (!s.weekdays.length || lead === null || horizon === null || horizon - lead < WINE_STORE_LIMITS.minWindowSpanDays) return null;
  return { enabled: true, slots: cleanSlots(s.slots), weekdays: [...s.weekdays].sort((a, b) => a - b), minLeadDays: lead, horizonDays: horizon };
}

/**
 * Errores de la programación (claves: sdays, slead, shorizon, slots, slot:<k>). Son las mismas reglas del servidor, con sus
 * mismos límites. Solo se aplican con la entrega y la programación activas: apagada, el servidor admite días vacíos y una
 * ventana corta, y `schedulingPayload` deja lo oculto en orden para que un dato olvidado e invisible no impida guardar.
 */
function schedulingErrors(s: SchedulingForm): Record<string, string> {
  const e: Record<string, string> = {};
  const L = WINE_STORE_LIMITS;
  if (!s.weekdays.length) e.sdays = "Elija al menos un día de la semana en que entrega.";

  const lead = wholeNumber(s.minLead, 0, L.maxLeadDays);
  const horizon = wholeNumber(s.horizon, 1, L.maxHorizonDays);
  if (lead === null) e.slead = `Escriba un número entero de 0 a ${L.maxLeadDays}.`;
  if (horizon === null) e.shorizon = `Escriba un número entero de 1 a ${L.maxHorizonDays}.`;
  else if (lead !== null && horizon - lead < L.minWindowSpanDays) {
    e.shorizon = `Los días hacia adelante deben superar la antelación mínima en al menos ${L.minWindowSpanDays} (por ejemplo, antelación de 1 día y hasta 14 días), para que siempre haya una fecha disponible.`;
  }

  const seen = new Set<string>();
  let named = 0;
  for (const r of s.slots) {
    const t = slotText(r.text);
    if (!t) continue; // fila en blanco: no se guarda
    named++;
    const key = nameKey(t);
    if (t.length > L.slotLength) e[`slot:${r._k}`] = `La franja tiene ${t.length} caracteres: el máximo es ${L.slotLength}.`;
    else if (seen.has(key)) e[`slot:${r._k}`] = "Ya hay una franja con este texto. Use franjas distintas.";
    seen.add(key);
  }
  if (named > L.maxSlots) e.slots = `Puede definir hasta ${L.maxSlots} franjas horarias.`;
  return e;
}

/** Bloque `delivery.scheduling` del PUT. Lo que no sirve se corrige aquí (solo puede estar oculto: lo visible ya se validó). */
function schedulingPayload(s: SchedulingForm): DeliveryScheduling {
  const def = defaultDeliveryScheduling();
  return {
    // Si el servidor rechazaría la programación activa (sin días o con ventana corta), se envía apagada en vez de impedir guardar.
    enabled: s.enabled && draftScheduling(s) !== null,
    slots: cleanSlots(s.slots),
    weekdays: [...s.weekdays].sort((a, b) => a - b),
    minLeadDays: wholeNumber(s.minLead, 0, WINE_STORE_LIMITS.maxLeadDays) ?? def.minLeadDays,
    horizonDays: wholeNumber(s.horizon, 1, WINE_STORE_LIMITS.maxHorizonDays) ?? def.horizonDays,
  };
}

/* ─── Formulario ↔ configuración ─── */

function toForm(c: WineStoreConfig): FormState {
  // Una configuración guardada antes de existir la programación no trae el bloque: se parte de los valores por defecto.
  const sc = c.delivery.scheduling ?? defaultDeliveryScheduling();
  return {
    enabled: c.enabled,
    closedMessage: c.closedMessage,
    pickup: { ...c.pickup },
    delivery: {
      enabled: c.delivery.enabled,
      mode: c.delivery.mode,
      flatFee: moneyText(c.delivery.flatFeeUsd),
      zones: c.delivery.zones.map((z) => zoneRow(z.name, moneyText(z.feeUsd), z.id)),
      freeFrom: c.delivery.freeFromUsd === null ? "" : moneyText(c.delivery.freeFromUsd),
      instructions: c.delivery.instructions,
      scheduling: {
        enabled: sc.enabled,
        slots: sc.slots.map((t) => slotRow(t)),
        weekdays: [...sc.weekdays],
        minLead: String(sc.minLeadDays),
        horizon: String(sc.horizonDays),
      },
    },
    defaultMax: String(c.defaultMaxPerOrder),
    termsEs: c.terms.es.join("\n"),
    termsEn: c.terms.en.join("\n"),
  };
}

/**
 * Cuerpo del PUT. Los campos visibles ya se validaron antes de llegar aquí; lo que está oculto (por ejemplo las zonas
 * cuando el modo es «costo fijo») se envía solo si es válido, para que un dato olvidado e invisible no impida guardar.
 */
function toPayload(f: FormState) {
  const d = f.delivery;
  const seen = new Set<string>();
  const zones = d.zones
    .flatMap((z) => {
      const name = z.name.trim();
      if (!name) return [];
      const key = nameKey(name);
      const fee = z.fee.trim() ? moneyValue(z.fee, WINE_STORE_LIMITS.maxFeeUsd) : 0;
      if (fee === null || seen.has(key)) return [];
      seen.add(key);
      return [{ ...(z.id ? { id: z.id } : {}), name, feeUsd: fee }];
    })
    .slice(0, WINE_STORE_LIMITS.maxZones);
  return {
    enabled: f.enabled,
    closedMessage: f.closedMessage,
    pickup: f.pickup,
    delivery: {
      enabled: d.enabled,
      mode: d.mode,
      flatFeeUsd: moneyValue(d.flatFee, WINE_STORE_LIMITS.maxFeeUsd) ?? 0,
      zones,
      freeFromUsd: moneyValue(d.freeFrom, WINE_STORE_LIMITS.maxFreeFromUsd),
      instructions: d.instructions,
      // Siempre se envía: un PUT sin este bloque reiniciaría el día y la franja a los valores por defecto (apagados).
      scheduling: schedulingPayload(d.scheduling),
    },
    defaultMaxPerOrder: Number(f.defaultMax.trim()),
    terms: { es: termLines(f.termsEs), en: termLines(f.termsEn) },
  };
}

/** Errores por campo (claves: channels, flatFee, freeFrom, zones, zone:<k>:name, zone:<k>:fee, sdays, slead, shorizon, slots, slot:<k>, defaultMax, termsEs, termsEn). */
function validate(f: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  const d = f.delivery;

  if (!f.pickup.enabled && !d.enabled) e.channels = "Active al menos una forma de entrega: el retiro o la entrega a domicilio.";

  if (d.enabled && d.mode === "flat") {
    const m = d.flatFee.trim() ? moneyError(d.flatFee, WINE_STORE_LIMITS.maxFeeUsd) : "Escriba el costo del envío (escriba 0 si no tiene costo).";
    if (m) e.flatFee = m;
  }
  if (d.enabled && d.mode !== "coordinate") {
    const m = moneyError(d.freeFrom, WINE_STORE_LIMITS.maxFreeFromUsd);
    if (m) e.freeFrom = m;
  }
  if (d.enabled && d.mode === "zones") {
    const names = new Set<string>();
    let named = 0;
    for (const z of d.zones) {
      const name = z.name.trim();
      if (!name && !z.fee.trim()) continue; // fila en blanco: no se guarda
      if (!name) e[`zone:${z._k}:name`] = "Escriba el nombre de la zona.";
      else {
        named++;
        const key = nameKey(name);
        if (names.has(key)) e[`zone:${z._k}:name`] = "Ya hay una zona con este nombre.";
        names.add(key);
      }
      const m = z.fee.trim() ? moneyError(z.fee, WINE_STORE_LIMITS.maxFeeUsd) : "Escriba el costo (escriba 0 si no tiene costo).";
      if (m) e[`zone:${z._k}:fee`] = m;
    }
    if (named > WINE_STORE_LIMITS.maxZones) e.zones = `Puede definir hasta ${WINE_STORE_LIMITS.maxZones} zonas.`;
    else if (named === 0) e.zones = "Agregue al menos una zona con nombre y costo, o elija otro modo de envío.";
  }
  if (d.enabled && d.scheduling.enabled) Object.assign(e, schedulingErrors(d.scheduling));

  const max = f.defaultMax.trim();
  if (!/^\d+$/.test(max) || Number(max) < 1 || Number(max) > WINE_MAX_PER_ORDER_LIMIT) {
    e.defaultMax = `Escriba un número entero de 1 a ${WINE_MAX_PER_ORDER_LIMIT}.`;
  }

  const es = termsError(f.termsEs);
  if (es) e.termsEs = es;
  const en = termsError(f.termsEn);
  if (en) e.termsEn = en;
  return e;
}

/* ─── Estilos (los mismos de Configuración de pagos) ─── */

const inputCls =
  "w-full h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] focus:border-primary-container focus:outline-none aria-[invalid=true]:border-error";
const textareaCls =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-[14px] focus:border-primary-container focus:outline-none aria-[invalid=true]:border-error";
const labelCls = "block text-[13px] font-semibold mb-1.5";
const hintCls = "text-[12px] text-on-surface-variant";
const smallBtn =
  "h-11 px-3 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container disabled:opacity-50 disabled:hover:border-outline-variant";
const removeBtn = "h-11 w-11 flex-shrink-0 inline-flex items-center justify-center rounded text-on-surface-variant hover:text-error";

const MODES: { id: DeliveryMode; label: string; hint: string }[] = [
  { id: "coordinate", label: "Se coordina por WhatsApp", hint: "El costo no se suma al total: usted lo acuerda con el cliente y se paga aparte." },
  { id: "flat", label: "Costo fijo", hint: "El mismo costo de envío para todos los pedidos." },
  { id: "zones", label: "Por zonas", hint: "Solo se entrega en las zonas de su lista: el cliente elige la suya al comprar y paga su costo." },
];

/** Texto de la tarjeta «Entrega a domicilio»: lo que pasa con el costo depende del modo elegido. */
function deliveryHint(d: FormState["delivery"]): string {
  if (!d.enabled) return "Active la entrega si quiere que el cliente pueda pedir que le lleven el pedido a su dirección.";
  if (d.mode === "coordinate") {
    return "El costo del envío no se suma al total: usted lo acuerda con el cliente por WhatsApp y se paga aparte.";
  }
  return "El costo del envío se suma al total del pedido, y el cliente lo paga junto con las botellas.";
}

export default function AdminWineStorePage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [defaults, setDefaults] = useState<WineStoreConfig | null>(null);
  /** Condiciones automáticas según lo último guardado (respaldo cuando el formulario aún tiene errores). */
  const [savedTerms, setSavedTerms] = useState<GeneratedTerms | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** Aviso de error del formulario; cada aviso es un objeto nuevo (aunque el texto se repita) y `reveal` pide llevarlo a la vista. */
  const [error, setError] = useState<{ text: string; reveal: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  /** La configuración guardada ya no es válida (editada a mano o de una versión vieja): se muestran los valores por defecto. */
  const [invalidStored, setInvalidStored] = useState(false);
  /** Ya se intentó guardar con errores: recién entonces se marcan en rojo los costos de zona que aún están vacíos. */
  const [attempted, setAttempted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** Subtotal de ejemplo para la vista del costo de envío. */
  const [example, setExample] = useState("40");
  const savingRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusRef = useRef<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/settings/wine-store", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!data?.success) throw new Error(data?.message);
      setForm(toForm(data.config));
      setDefaults(data.defaults);
      setSavedTerms(data.generatedTerms ?? null);
      // Con la configuración guardada dañada el formulario parte de los valores por defecto: se deja listo para guardar y reparar.
      setInvalidStored(data.invalidStored === true);
      setDirty(data.invalidStored === true);
    } catch (err) {
      setLoadError((err as Error).message || "No se pudo cargar la configuración de la tienda.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Tras agregar una zona, el cursor va a su nombre.
  useEffect(() => {
    if (!focusRef.current) return;
    document.getElementById(focusRef.current)?.focus();
    focusRef.current = null;
  });

  // Lleva el aviso de error a la vista. En escritorio el desplazamiento es el de <main> (no el de la ventana), así que
  // `window.scrollTo` no lo alcanza: `scrollIntoView` sube por el contenedor que corresponda. El foco hace que se lea.
  useEffect(() => {
    if (!error?.reveal) return;
    const el = errorRef.current;
    if (!el) return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }, [error]);

  const showError = (text: string, reveal = true) => setError({ text, reveal });

  const update = (fn: (f: FormState) => FormState) => {
    setForm((f) => (f ? fn(f) : f));
    setDirty(true);
  };
  const setPickup = (patch: Partial<FormState["pickup"]>) => update((f) => ({ ...f, pickup: { ...f.pickup, ...patch } }));
  const setDelivery = (patch: Partial<FormState["delivery"]>) => update((f) => ({ ...f, delivery: { ...f.delivery, ...patch } }));
  const updateZone = (k: number, patch: Partial<ZoneRow>) =>
    update((f) => ({ ...f, delivery: { ...f.delivery, zones: f.delivery.zones.map((z) => (z._k === k ? { ...z, ...patch } : z)) } }));
  const updateScheduling = (fn: (s: SchedulingForm) => SchedulingForm) =>
    update((f) => ({ ...f, delivery: { ...f.delivery, scheduling: fn(f.delivery.scheduling) } }));

  const errors = useMemo(() => (form ? validate(form) : {}), [form]);
  const errorCount = Object.keys(errors).length;

  /** La configuración tal como la guardaría el servidor, sin condiciones personalizadas (para el ejemplo y las condiciones automáticas). */
  const liveConfig = useMemo(() => {
    if (!form) return null;
    try {
      return normalizeWineStoreConfig({ ...toPayload(form), terms: { es: [], en: [] } });
    } catch {
      return null;
    }
  }, [form]);

  const generated = useMemo<{ terms: GeneratedTerms; live: boolean } | null>(() => {
    if (liveConfig) return { terms: { es: buildWinePolicies(liveConfig, "es"), en: buildWinePolicies(liveConfig, "en") }, live: true };
    return savedTerms ? { terms: savedTerms, live: false } : null;
  }, [liveConfig, savedTerms]);

  const notify = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || savingRef.current) return;
    setError(null);
    if (errorCount > 0) {
      // Con un campo marcado el foco va al campo (el navegador lo desplaza a la vista); si no, al aviso de arriba.
      // (Los días de la semana son botones: su grupo se marca con `data-invalid` y puede recibir el foco.)
      setAttempted(true);
      const find = () => (errors.channels ? null : document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]'));
      const bad = find();
      showError(errors.channels ? errors.channels : "Hay campos por corregir. Revise los mensajes en rojo y vuelva a guardar.", !bad);
      bad?.focus();
      // Los costos vacíos de las zonas sugeridas recién se marcan ahora: el foco va al primero cuando ya están pintados.
      if (!bad) setTimeout(() => find()?.focus(), 0);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/wine-store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const data = await res.json().catch(() => null);
      if (!data?.success) throw new Error(data?.message);
      setForm(toForm(data.config));
      setSavedTerms(data.generatedTerms ?? null);
      setInvalidStored(false);
      setAttempted(false);
      setDirty(false);
      notify(
        data.config.enabled
          ? "Configuración de la tienda guardada. Ya se aplica en el sitio."
          : "Configuración guardada. La tienda está cerrada: los clientes ven el aviso y no pueden comprar."
      );
    } catch (err) {
      showError((err as Error).message || "No se pudo guardar la configuración de la tienda.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const restoreDefaults = () => {
    if (!defaults) return;
    if (!confirm("¿Reemplazar el formulario por los valores por defecto (tienda abierta, retiro y entrega a coordinar por WhatsApp sin que el cliente elija día ni franja, máximo de 12 botellas)? No se guarda hasta que pulse «Guardar».")) return;
    setForm(toForm(defaults));
    setDirty(true);
  };

  const addZone = () => {
    const row = zoneRow();
    focusRef.current = id(`z${row._k}-name`);
    setDelivery({ zones: [...(form?.delivery.zones ?? []), row] });
  };

  /**
   * Agrega una zona sugerida de Caracas con el costo VACÍO (el costo lo decide usted): el cursor va al costo. Si ya hay una fila
   * en blanco la usa en vez de dejarla vacía; nunca repite un nombre que ya está en la lista.
   */
  const addSuggestedZone = (name: string) => {
    const zones = form?.delivery.zones ?? [];
    const key = nameKey(name);
    if (zones.some((z) => nameKey(z.name) === key)) return;
    const blank = zones.find((z) => !z.name.trim() && !z.fee.trim());
    if (!blank && zones.length >= WINE_STORE_LIMITS.maxZones) return;
    const row = blank ? { ...blank, name } : zoneRow(name);
    focusRef.current = id(`z${row._k}-fee`);
    setDelivery({ zones: blank ? zones.map((z) => (z._k === blank._k ? row : z)) : [...zones, row] });
  };

  const addSlot = () => {
    const row = slotRow();
    focusRef.current = id(`s${row._k}-text`);
    updateScheduling((s) => (s.slots.length >= WINE_STORE_LIMITS.maxSlots ? s : { ...s, slots: [...s.slots, row] }));
  };
  const toggleDay = (day: number) =>
    updateScheduling((s) => ({
      ...s,
      weekdays: s.weekdays.includes(day) ? s.weekdays.filter((d) => d !== day) : [...s.weekdays, day].sort((a, b) => a - b),
    }));

  const changeMode = (mode: DeliveryMode) => {
    // Al elegir «Por zonas» sin ninguna zona se deja lista una fila para escribir.
    update((f) => ({
      ...f,
      delivery: { ...f.delivery, mode, zones: mode === "zones" && f.delivery.zones.length === 0 ? [zoneRow()] : f.delivery.zones },
    }));
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-4xl mx-auto space-y-6">
      {/* Región de avisos: siempre en pantalla para que se anuncie el texto cuando aparece. */}
      <div role="status" aria-live="polite" className="fixed top-5 right-5 left-5 sm:left-auto z-50 sm:max-w-sm pointer-events-none">
        {toast && <div className="rounded-lg px-4 py-3 text-[14px] shadow-elevated bg-ink text-paper pointer-events-auto">{toast}</div>}
      </div>

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Tienda de vinos</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Defina aquí cómo se venden los vinos: si la tienda está abierta, cómo se retira o se entrega el pedido, cuánto cuesta el
            envío y qué condiciones acepta el cliente. Los cambios se aplican de inmediato en el sitio. Los precios y las existencias de
            cada vino se editan en{" "}
            <a href="/admin/vinos" className="font-semibold text-primary-container hover:underline">Vinos</a>.
          </p>
        </div>
        <a
          href="/vinos"
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 px-4 rounded border border-outline-variant text-[14px] font-semibold inline-flex items-center gap-2 hover:border-primary-container self-start sm:self-auto whitespace-nowrap flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
          Ver la tienda
        </a>
      </header>

      {loadError ? (
        <div role="alert" className="rounded-lg border border-error/40 bg-error-container/50 p-4 text-[14px] text-on-error-container space-y-2">
          <p>{loadError}</p>
          <button type="button" onClick={load} className="font-semibold underline">Reintentar</button>
        </div>
      ) : !form ? (
        <div className="py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
          <span className="sr-only">Cargando…</span>
        </div>
      ) : (
        <form onSubmit={save} noValidate className="space-y-6">
          {invalidStored && (
            <div role="alert" className="rounded-lg border border-error/40 bg-error-container/60 p-3 text-[14px] text-on-error-container">
              La configuración guardada no es válida, por eso los clientes no pueden comprar ahora. Se muestran los valores por defecto:
              revíselos, ajústelos y pulse «Guardar» para repararla.
            </div>
          )}
          {error && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="rounded-lg border border-error/40 bg-error-container/60 p-3 text-[14px] text-on-error-container scroll-mt-6 focus:outline-none"
            >
              {error.text}
            </div>
          )}

          {/* 1. Estado de la tienda */}
          <Card title="Estado de la tienda" hint="Abra o cierre las compras sin tocar nada más.">
            <Toggle
              checked={form.enabled}
              onChange={(v) => update((f) => ({ ...f, enabled: v }))}
              label="Tienda abierta"
              hint={form.enabled ? "Los clientes pueden comprar." : "Cerrada: los clientes ven los vinos y sus precios, pero no pueden comprar."}
            />
            {!form.enabled && (
              <div role="note" className="rounded-lg border border-tertiary/40 bg-tertiary-fixed/60 p-3 text-[13px] text-on-tertiary-fixed-variant">
                Con la tienda cerrada no aparece el botón «Comprar» y no se aceptan pedidos nuevos. Los pedidos que ya se hicieron se
                siguen pagando y revisando con normalidad.
              </div>
            )}
            <Field
              id={id("closed")}
              label="Mensaje cuando la tienda está cerrada (opcional)"
              hint="Se muestra solo mientras la tienda esté cerrada. Si lo deja vacío, se usa un aviso estándar."
              value={form.closedMessage}
              onChange={(v) => update((f) => ({ ...f, closedMessage: v }))}
              max={WINE_STORE_LIMITS.closedMessage}
              rows={2}
              placeholder="Ej.: Estamos reponiendo existencias. Volvemos pronto."
            />
          </Card>

          {errors.channels && (
            <div role="alert" className="rounded-lg border border-error/40 bg-error-container/60 p-3 text-[14px] text-on-error-container">
              {errors.channels}
            </div>
          )}

          {/* 2. Retiro */}
          <Card title="Retiro en persona" hint="El cliente recoge su pedido. Esta información se muestra en su pedido, en las condiciones y en los mensajes de confirmación.">
            <Toggle
              checked={form.pickup.enabled}
              onChange={(v) => setPickup({ enabled: v })}
              label="Ofrecer retiro"
              hint={form.pickup.enabled ? undefined : "Sin retiro, el cliente solo podrá pedir entrega a domicilio."}
            />
            {form.pickup.enabled && (
              <>
                <Field
                  id={id("pk-place")}
                  label="Lugar de retiro"
                  hint="Si lo deja vacío, el lugar se coordina por WhatsApp una vez confirmado el pago."
                  value={form.pickup.place}
                  onChange={(v) => setPickup({ place: v })}
                  max={WINE_STORE_LIMITS.pickupPlace}
                  placeholder="Ej.: Av. Principal, local 3, Caracas"
                />
                <Field
                  id={id("pk-hours")}
                  label="Horario de retiro"
                  value={form.pickup.hours}
                  onChange={(v) => setPickup({ hours: v })}
                  max={WINE_STORE_LIMITS.pickupHours}
                  placeholder="Ej.: Lunes a viernes, de 10:00 a. m. a 5:00 p. m."
                />
                <Field
                  id={id("pk-instr")}
                  label="Indicaciones adicionales (opcional)"
                  hint="Por ejemplo, qué debe presentar el cliente al llegar."
                  value={form.pickup.instructions}
                  onChange={(v) => setPickup({ instructions: v })}
                  max={WINE_STORE_LIMITS.pickupInstructions}
                  rows={2}
                  placeholder="Ej.: Presente su código de pedido al llegar."
                />
              </>
            )}
          </Card>

          {/* 3. Entrega */}
          <Card title="Entrega a domicilio" hint={deliveryHint(form.delivery)}>
            <Toggle
              checked={form.delivery.enabled}
              onChange={(v) => setDelivery({ enabled: v })}
              label="Ofrecer entrega a domicilio"
              hint={form.delivery.enabled ? undefined : "Sin entrega, el cliente solo podrá retirar su pedido."}
            />
            {form.delivery.enabled && (
              <>
                <fieldset>
                  <legend className={labelCls}>Costo del envío</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {MODES.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-start gap-2 min-h-11 p-3 rounded border cursor-pointer ${
                          form.delivery.mode === m.id ? "border-primary-container bg-primary-fixed/50" : "border-outline-variant"
                        }`}
                      >
                        <input
                          type="radio"
                          name={id("mode")}
                          checked={form.delivery.mode === m.id}
                          onChange={() => changeMode(m.id)}
                          className="accent-[#7D2A46] mt-0.5"
                        />
                        <span>
                          <span className="block text-[14px] font-semibold">{m.label}</span>
                          <span className="block text-[12px] text-on-surface-variant">{m.hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className={`${hintCls} mt-2`}>
                    El cambio de modo vale para los pedidos nuevos: cada pedido conserva la forma en que se cobró su envío.
                  </p>
                </fieldset>

                {form.delivery.mode === "flat" && (
                  <MoneyField
                    id={id("flat")}
                    label="Costo del envío (USD)"
                    hint="Se cobra una vez por pedido. Escriba 0 si el envío no tiene costo."
                    value={form.delivery.flatFee}
                    onChange={(v) => setDelivery({ flatFee: v })}
                    error={errors.flatFee}
                    placeholder="Ej.: 5 o 5,50"
                  />
                )}

                {form.delivery.mode === "zones" && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-[13px] font-semibold">Zonas de envío</h3>
                      <p className={`${hintCls} mt-0.5`}>
                        <strong>Solo se entrega en las zonas de esta lista:</strong> fuera de ellas el cliente no puede pedir entrega a
                        domicilio. Cada zona tiene su propio costo y el cliente elige la suya al comprar. Las filas en blanco no se guardan.
                        Máximo {WINE_STORE_LIMITS.maxZones} zonas ({form.delivery.zones.length} en la lista).
                      </p>
                    </div>
                    {form.delivery.zones.map((z, i) => {
                      const nameErr = errors[`zone:${z._k}:name`];
                      // Un costo recién agregado (zona sugerida) no se marca en rojo hasta que la persona intente guardar.
                      const feeErr = z.fee.trim() || attempted ? errors[`zone:${z._k}:fee`] : undefined;
                      const rowLabel = i === 0 ? labelCls : `${labelCls} sm:sr-only`;
                      return (
                        <div key={z._k} className="flex gap-1 items-start">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_11rem] gap-3">
                            <div>
                              <label htmlFor={id(`z${z._k}-name`)} className={rowLabel}>Nombre de la zona</label>
                              <input
                                id={id(`z${z._k}-name`)}
                                value={z.name}
                                maxLength={WINE_STORE_LIMITS.zoneName}
                                onChange={(e) => updateZone(z._k, { name: e.target.value })}
                                placeholder="Ej.: Chacao"
                                aria-invalid={nameErr ? true : undefined}
                                aria-describedby={[nameErr ? id(`z${z._k}-name-err`) : "", z.name.length >= ZONE_COUNTER_FROM ? id(`z${z._k}-name-n`) : ""].filter(Boolean).join(" ") || undefined}
                                className={inputCls}
                              />
                              {z.name.length >= ZONE_COUNTER_FROM && (
                                <p id={id(`z${z._k}-name-n`)} className={`${hintCls} mt-1 tabular-nums text-right`}>
                                  {z.name.length} / {WINE_STORE_LIMITS.zoneName}
                                </p>
                              )}
                              {nameErr && <p id={id(`z${z._k}-name-err`)} className="text-[12px] text-error mt-1">{nameErr}</p>}
                            </div>
                            <div>
                              <label htmlFor={id(`z${z._k}-fee`)} className={rowLabel}>Costo (USD)</label>
                              <input
                                id={id(`z${z._k}-fee`)}
                                inputMode="decimal"
                                maxLength={MONEY_INPUT_MAX}
                                value={z.fee}
                                onChange={(e) => updateZone(z._k, { fee: e.target.value })}
                                placeholder="Ej.: 3,50"
                                aria-invalid={feeErr ? true : undefined}
                                aria-describedby={feeErr ? id(`z${z._k}-fee-err`) : undefined}
                                className={`${inputCls} tabular-nums`}
                              />
                              {feeErr && <p id={id(`z${z._k}-fee-err`)} className="text-[12px] text-error mt-1">{feeErr}</p>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDelivery({ zones: form.delivery.zones.filter((x) => x._k !== z._k) })}
                            className={`${removeBtn} ${i === 0 ? "mt-7" : "mt-7 sm:mt-0"}`}
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                            <span className="sr-only">Quitar la zona {z.name || i + 1}</span>
                          </button>
                        </div>
                      );
                    })}
                    {errors.zones && <p className="text-[13px] text-error">{errors.zones}</p>}
                    <button type="button" onClick={addZone} disabled={form.delivery.zones.length >= WINE_STORE_LIMITS.maxZones} className={smallBtn}>
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                      Agregar zona
                    </button>
                    <ZoneSuggestions
                      id={id("zone-sugg")}
                      zones={form.delivery.zones}
                      full={form.delivery.zones.length >= WINE_STORE_LIMITS.maxZones && !form.delivery.zones.some((z) => !z.name.trim() && !z.fee.trim())}
                      onAdd={addSuggestedZone}
                    />
                  </div>
                )}

                {form.delivery.mode !== "coordinate" && (
                  <MoneyField
                    id={id("free")}
                    label="Envío gratis desde (USD, opcional)"
                    hint="Si el total de las botellas llega a este monto, el envío no se cobra. Déjelo vacío para cobrarlo siempre."
                    value={form.delivery.freeFrom}
                    onChange={(v) => setDelivery({ freeFrom: v })}
                    error={errors.freeFrom}
                    placeholder="Ej.: 100"
                  />
                )}

                <Field
                  id={id("dl-instr")}
                  label="Indicaciones de la entrega (opcional)"
                  hint="Se muestra al cliente. Por ejemplo, una aclaración sobre cómo se entrega."
                  value={form.delivery.instructions}
                  onChange={(v) => setDelivery({ instructions: v })}
                  max={WINE_STORE_LIMITS.deliveryInstructions}
                  rows={2}
                  placeholder="Ej.: Entregas de lunes a sábado"
                />

                <ShippingExample
                  id={id("example")}
                  config={liveConfig}
                  example={example}
                  onExample={setExample}
                />

                <p role="note" className="flex items-start gap-2 text-[13px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0" aria-hidden="true">info</span>
                  <span>
                    El cliente siempre ve el aviso «Debe recibir el pedido una persona mayor de 18 años» al elegir la entrega a domicilio,
                    y también va en su correo y su mensaje de WhatsApp, aunque usted escriba sus propias condiciones de compra.
                  </span>
                </p>

                <SchedulingSection
                  idOf={id}
                  value={form.delivery.scheduling}
                  errors={errors}
                  onChange={(patch) => updateScheduling((s) => ({ ...s, ...patch }))}
                  onToggleDay={toggleDay}
                  onSlotText={(k, text) => updateScheduling((s) => ({ ...s, slots: s.slots.map((r) => (r._k === k ? { ...r, text } : r)) }))}
                  onAddSlot={addSlot}
                  onRemoveSlot={(k) => updateScheduling((s) => ({ ...s, slots: s.slots.filter((r) => r._k !== k) }))}
                />
              </>
            )}
          </Card>

          {/* 4. Límites */}
          <Card title="Límites" hint="Protegen la tienda de pedidos por error.">
            <div className="max-w-xs">
              <Field
                id={id("max")}
                label="Máximo de botellas por vino en un pedido"
                hint={`De 1 a ${WINE_MAX_PER_ORDER_LIMIT}. Aplica a los vinos que no tienen su propio máximo (se define en la ficha de cada vino).`}
                value={form.defaultMax}
                onChange={(v) => update((f) => ({ ...f, defaultMax: v }))}
                error={errors.defaultMax}
                inputMode="numeric"
                maxLength={MAX_PER_ORDER_DIGITS}
              />
            </div>
          </Card>

          {/* 5. Condiciones de compra */}
          <Card
            title="Condiciones de compra"
            hint="El cliente las acepta antes de pagar y aparecen al pie de su pedido y del correo de confirmación. Escriba una condición por línea."
          >
            <p className="text-[13px] text-on-surface-variant">
              Si deja un idioma vacío, sus condiciones se generan solas a partir de lo que configuró arriba (retiro, entrega y costos). Escríbalas
              usted solo si necesita un texto propio.
            </p>
            <TermsEditor
              id={id("terms-es")}
              label="Condiciones en español"
              value={form.termsEs}
              onChange={(v) => update((f) => ({ ...f, termsEs: v }))}
              error={errors.termsEs}
              generated={generated?.terms.es ?? null}
              live={generated?.live ?? false}
            />
            <TermsEditor
              id={id("terms-en")}
              label="Condiciones en inglés (para quien ve el sitio en inglés)"
              value={form.termsEn}
              onChange={(v) => update((f) => ({ ...f, termsEn: v }))}
              error={errors.termsEn}
              generated={generated?.terms.en ?? null}
              live={generated?.live ?? false}
            />
          </Card>

          <div className="sticky bottom-0 -mx-5 sm:mx-0 px-5 sm:px-0 py-3 bg-background/95 backdrop-blur flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant sm:border-0">
            {dirty && <span className="text-[13px] text-on-surface-variant mr-auto">Cambios sin guardar</span>}
            <button type="button" onClick={restoreDefaults} disabled={!defaults} className="h-11 px-4 rounded text-[14px] font-semibold text-on-surface-variant hover:text-primary">
              Restaurar valores por defecto
            </button>
            <button
              type="submit"
              disabled={saving || !dirty}
              className="h-11 px-5 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              {saving && <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>}
              Guardar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ─── Piezas ─── */

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-serif text-xl">{title}</h2>
        {hint && <p className="text-[13px] text-on-surface-variant mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const uid = useId();
  return (
    <label className="flex items-start gap-3 min-h-11 cursor-pointer text-[14px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={hint ? `${uid}-hint` : undefined}
        className="accent-[#7D2A46] w-4 h-4 mt-1"
      />
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span id={`${uid}-hint`} className="block text-[12px] text-on-surface-variant">{hint}</span>}
      </span>
    </label>
  );
}

/** Campo de texto (o área de texto si trae `rows`) con ayuda, contador de caracteres y mensaje de error. */
function Field({
  id,
  label,
  hint,
  value,
  onChange,
  max,
  maxLength,
  rows,
  placeholder,
  error,
  inputMode,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  /** Tope con contador visible («12 / 160»). */
  max?: number;
  /** Tope sin contador (campos cortos). */
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  error?: string;
  inputMode?: "numeric" | "decimal";
}) {
  const describedBy = [hint ? `${id}-hint` : "", max ? `${id}-count` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    value,
    placeholder,
    maxLength: max ?? maxLength,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  } as const;
  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value);
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      {rows ? (
        <textarea {...common} rows={rows} onChange={change} className={textareaCls} />
      ) : (
        <input {...common} inputMode={inputMode} onChange={change} className={inputCls} />
      )}
      {(hint || max) && (
        <div className="mt-1 flex items-start justify-between gap-3">
          {hint ? <p id={`${id}-hint`} className={hintCls}>{hint}</p> : <span />}
          {max && (
            <span id={`${id}-count`} className={`${hintCls} tabular-nums whitespace-nowrap`}>
              {value.length} / {max}
            </span>
          )}
        </div>
      )}
      {error && <p id={`${id}-err`} className="text-[12px] text-error mt-1">{error}</p>}
    </div>
  );
}

/** Monto en dólares: acepta coma o punto decimal. */
function MoneyField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div className="max-w-xs">
      <Field id={id} label={label} hint={hint} value={value} onChange={onChange} error={error} placeholder={placeholder} inputMode="decimal" maxLength={MONEY_INPUT_MAX} />
    </div>
  );
}

/** Zonas de Caracas para agregar con un clic: entran con el costo VACÍO (lo escribe usted) y las que ya están en la lista no se ofrecen. */
function ZoneSuggestions({ id, zones, full, onAdd }: { id: string; zones: ZoneRow[]; full: boolean; onAdd: (name: string) => void }) {
  const used = new Set(zones.map((z) => nameKey(z.name)));
  const left = CARACAS_ZONE_SUGGESTIONS.filter((n) => !used.has(nameKey(n)));
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low/50 p-4 space-y-2.5">
      <div>
        <h4 id={`${id}-h`} className="text-[13px] font-semibold">Zonas de Caracas sugeridas</h4>
        <p className={hintCls}>
          Pulse una zona para agregarla a la lista y escriba cuánto cuesta el envío a esa zona. Después puede cambiarle el nombre o quitarla.
        </p>
      </div>
      {left.length > 0 ? (
        <ul aria-labelledby={`${id}-h`} className="flex flex-wrap gap-1.5">
          {left.map((name) => (
            <li key={name}>
              <button
                type="button"
                disabled={full}
                onClick={() => onAdd(name)}
                aria-label={`Agregar la zona ${name}`}
                className="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-[13px] font-semibold inline-flex items-center gap-1 hover:border-primary-container disabled:opacity-50 disabled:hover:border-outline-variant"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">add</span>
                {name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={hintCls}>Ya agregó todas las zonas sugeridas.</p>
      )}
      {full && left.length > 0 && (
        <p className={hintCls}>La lista ya tiene {WINE_STORE_LIMITS.maxZones} zonas: quite alguna para agregar otra.</p>
      )}
    </div>
  );
}

/**
 * «Día y franja de entrega»: el cliente elige al comprar con entrega a domicilio cuándo prefiere recibir su pedido. Es una
 * preferencia que usted confirma con él por WhatsApp. Con el interruptor apagado solo se ve el interruptor; encendido, se
 * definen los días de la semana, la antelación, hasta cuándo se puede elegir y las franjas, con una vista previa de las fechas.
 */
function SchedulingSection({
  idOf,
  value,
  errors,
  onChange,
  onToggleDay,
  onSlotText,
  onAddSlot,
  onRemoveSlot,
}: {
  idOf: (name: string) => string;
  value: SchedulingForm;
  errors: Record<string, string>;
  onChange: (patch: Partial<SchedulingForm>) => void;
  onToggleDay: (day: number) => void;
  onSlotText: (k: number, text: string) => void;
  onAddSlot: () => void;
  onRemoveSlot: (k: number) => void;
}) {
  const L = WINE_STORE_LIMITS;
  const nameCount = value.slots.filter((r) => slotText(r.text)).length;
  const draft = draftScheduling(value);
  return (
    <section aria-labelledby={idOf("sched-h")} className="rounded-xl border border-outline-variant bg-surface-container-low/50 p-4 sm:p-5 space-y-4">
      <div>
        <h3 id={idOf("sched-h")} className="font-serif text-lg">Día y franja de entrega</h3>
        <p className={hintCls}>
          Opcional. El cliente elige al comprar el día (y la franja horaria) en que prefiere recibir su pedido a domicilio. Es una
          preferencia: usted la confirma con él por WhatsApp. El retiro en persona no usa esta opción.
        </p>
      </div>

      <Toggle
        checked={value.enabled}
        onChange={(v) => onChange({ enabled: v })}
        label="Que el cliente elija el día de la entrega"
        hint={
          value.enabled
            ? "Encendido: al comprar con entrega a domicilio, el cliente debe elegir un día" + (value.slots.length ? " y una franja." : ".")
            : "Apagado: el cliente no elige día; usted acuerda la fecha con él por WhatsApp."
        }
      />

      {value.enabled && (
        <>
          <fieldset
            tabIndex={-1}
            data-invalid={errors.sdays ? "true" : undefined}
            aria-describedby={[idOf("days-hint"), errors.sdays ? idOf("days-err") : ""].filter(Boolean).join(" ")}
            className="focus:outline-none"
          >
            <legend className={labelCls}>Días en que entrega</legend>
            <div className="grid grid-cols-4 min-[480px]:grid-cols-7 gap-1.5">
              {WEEKDAYS.map((w) => {
                const on = value.weekdays.includes(w.day);
                return (
                  <button
                    key={w.day}
                    type="button"
                    aria-pressed={on}
                    aria-label={w.long}
                    onClick={() => onToggleDay(w.day)}
                    className={`h-11 rounded border text-[13px] font-semibold inline-flex items-center justify-center gap-1 ${
                      on
                        ? "border-primary-container bg-primary-container text-white"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary-container"
                    }`}
                  >
                    {on && <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check</span>}
                    {w.short}
                  </button>
                );
              })}
            </div>
            <p id={idOf("days-hint")} className={`${hintCls} mt-1.5`}>
              El cliente solo podrá elegir los días marcados. Los días sin marcar no aparecen como opción.
            </p>
            {errors.sdays && <p id={idOf("days-err")} className="text-[12px] text-error mt-1">{errors.sdays}</p>}
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <Field
              id={idOf("sd-lead")}
              label="Antelación mínima (días)"
              hint={`De 0 a ${L.maxLeadDays}. Con 0 el cliente puede elegir hoy mismo; con 1, desde mañana.`}
              value={value.minLead}
              onChange={(v) => onChange({ minLead: v })}
              error={errors.slead}
              inputMode="numeric"
              maxLength={DAYS_INPUT_MAX}
            />
            <Field
              id={idOf("sd-horizon")}
              label="Hasta cuántos días puede elegir"
              hint={`De 1 a ${L.maxHorizonDays}, contados desde hoy. Con 14, el cliente ve las próximas dos semanas.`}
              value={value.horizon}
              onChange={(v) => onChange({ horizon: v })}
              error={errors.shorizon}
              inputMode="numeric"
              maxLength={DAYS_INPUT_MAX}
            />
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-[13px] font-semibold">Franjas horarias (opcional)</h4>
              <p className={`${hintCls} mt-0.5`}>
                Por ejemplo «9:00 am – 12:00 m» o «2:00 – 6:00 pm». Si no agrega ninguna, el cliente solo elige el día. Máximo {L.maxSlots}{" "}
                franjas ({nameCount} en la lista); cada una, de hasta {L.slotLength} caracteres. Las filas en blanco no se guardan.
              </p>
            </div>
            {value.slots.map((r, i) => {
              const err = errors[`slot:${r._k}`];
              const len = slotText(r.text).length;
              return (
                <div key={r._k} className="flex gap-1 items-start">
                  <div className="flex-1 min-w-0">
                    <label htmlFor={idOf(`s${r._k}-text`)} className="sr-only">Franja {i + 1}</label>
                    <input
                      id={idOf(`s${r._k}-text`)}
                      value={r.text}
                      maxLength={L.slotLength}
                      onChange={(e) => onSlotText(r._k, e.target.value)}
                      placeholder={i % 2 === 0 ? "Ej.: 9:00 am – 12:00 m" : "Ej.: 2:00 – 6:00 pm"}
                      aria-invalid={err ? true : undefined}
                      aria-describedby={[idOf(`s${r._k}-n`), err ? idOf(`s${r._k}-err`) : ""].filter(Boolean).join(" ")}
                      className={inputCls}
                    />
                    <p id={idOf(`s${r._k}-n`)} className={`${hintCls} mt-1 tabular-nums text-right`}>
                      {len} / {L.slotLength}
                    </p>
                    {err && <p id={idOf(`s${r._k}-err`)} className="text-[12px] text-error mt-1">{err}</p>}
                  </div>
                  <button type="button" onClick={() => onRemoveSlot(r._k)} className={removeBtn}>
                    <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    <span className="sr-only">Quitar la franja {slotText(r.text) || i + 1}</span>
                  </button>
                </div>
              );
            })}
            {value.slots.length === 0 && <p className={hintCls}>Sin franjas: el cliente solo elige el día.</p>}
            {errors.slots && <p className="text-[13px] text-error">{errors.slots}</p>}
            <button type="button" onClick={onAddSlot} disabled={value.slots.length >= L.maxSlots} className={smallBtn}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Agregar franja
            </button>
          </div>

          <SchedulingPreview draft={draft} />
        </>
      )}
    </section>
  );
}

/** Vista previa: las próximas fechas que vería el cliente con lo escrito arriba, calculadas con las mismas funciones del servidor. */
function SchedulingPreview({ draft }: { draft: DeliveryScheduling | null }) {
  const today = caracasToday();
  if (!draft) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3.5 text-[13px] text-on-surface-variant">
        Corrija los campos marcados en rojo para ver las fechas que tendrá el cliente.
      </div>
    );
  }
  const dates = deliveryDates(draft, today);
  const shown = dates.slice(0, PREVIEW_DATES);
  const more = dates.length - shown.length;
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3.5 space-y-2.5">
      <h4 className="text-[13px] font-semibold">Vista previa: fechas que verá el cliente</h4>
      <p className="text-[13px] text-on-surface-variant">
        Hoy en Caracas es {formatDeliveryDate(today, "es")}.{" "}
        {dates.length > 0
          ? `El cliente podrá elegir entre ${dates.length} ${dates.length === 1 ? "fecha" : "fechas"}, desde el ${formatDeliveryDate(dates[0], "es")} hasta el ${formatDeliveryDate(dates[dates.length - 1], "es")}.`
          : "Con esta configuración no queda ninguna fecha disponible."}
      </p>
      {shown.length > 0 && (
        <ul aria-label="Próximas fechas disponibles" className="flex flex-wrap gap-1.5">
          {shown.map((d) => (
            <li key={d} className="px-2.5 py-1 rounded-full border border-outline-variant bg-surface-container-low text-[12px] tabular-nums">
              {dateLabel(d)}
            </li>
          ))}
          {more > 0 && <li className="px-1 py-1 text-[12px] text-on-surface-variant">y {more} {more === 1 ? "fecha más" : "fechas más"}</li>}
        </ul>
      )}
      <p className="text-[13px] text-on-surface-variant break-words">
        {draft.slots.length > 0 ? (
          <>
            Franjas a elegir: <strong className="text-on-surface">{draft.slots.join(" · ")}</strong>.
          </>
        ) : (
          "Sin franjas: el cliente solo elige el día."
        )}
      </p>
    </div>
  );
}

/** Vista de ejemplo: cuánto pagaría un cliente de envío y en total con un subtotal de botellas de ejemplo. */
function ShippingExample({
  id,
  config,
  example,
  onExample,
}: {
  id: string;
  config: WineStoreConfig | null;
  example: string;
  onExample: (v: string) => void;
}) {
  const sub = parseMoney(example);
  const subOk = sub !== null && Number.isFinite(sub) && sub >= 0 && sub <= WINE_STORE_LIMITS.maxFreeFromUsd;
  const d = config?.delivery;

  let body: React.ReactNode;
  if (!config || !d || !d.enabled) {
    body = <p className="text-[13px] text-on-surface-variant">Corrija los campos marcados en rojo para ver el ejemplo.</p>;
  } else if (!subOk) {
    body = <p className="text-[13px] text-on-surface-variant">Escriba un subtotal de ejemplo (por ejemplo 40) para ver el cálculo.</p>;
  } else if (d.mode === "coordinate") {
    body = (
      <p className="text-[13px]">
        El costo del envío <strong>no se suma</strong> al total: usted lo acuerda con el cliente por WhatsApp y se paga aparte. El cliente
        pagaría <strong>{usd(sub as number)}</strong> por las botellas.
      </p>
    );
  } else {
    const subtotal = sub as number;
    const rows = (d.mode === "flat" ? [{ id: "", name: "Todos los envíos", feeUsd: d.flatFeeUsd }] : d.zones).map((z) => {
      const q = quoteShipping(config, { fulfillment: "delivery", subtotalUsd: subtotal, zoneId: z.id });
      const shipping = q.ok ? q.shippingUsd : 0;
      return { key: z.id || "flat", name: z.name, shipping, free: q.ok && z.feeUsd > 0 && shipping === 0 };
    });
    body = (
      <ul className="divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface-container-lowest">
        {rows.map((r) => (
          <li key={r.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-3.5 py-2.5 text-[14px]">
            <span className="font-semibold min-w-0 break-words">{r.name}</span>
            <span className="text-on-surface-variant">
              Envío: {r.free ? "gratis (llega al mínimo)" : r.shipping === 0 ? "sin costo" : usd(r.shipping)}
            </span>
            <span className="tabular-nums">
              Total: <strong>{usd(round2(subtotal + r.shipping))}</strong>
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low/50 p-4 space-y-3">
      <div>
        <h3 className="font-serif text-lg">Vista de ejemplo</h3>
        <p className={hintCls}>Así se calcularía el envío con lo que tiene escrito arriba, sin guardar. Es solo una simulación.</p>
      </div>
      <div className="max-w-xs">
        <label htmlFor={id} className={labelCls}>Total de las botellas de ejemplo (USD)</label>
        <input id={id} inputMode="decimal" maxLength={MONEY_INPUT_MAX} value={example} onChange={(e) => onExample(e.target.value)} className={`${inputCls} tabular-nums`} />
      </div>
      {body}
    </div>
  );
}

/** Condiciones de compra de un idioma: una por línea, con contador y los botones para partir de las automáticas. */
function TermsEditor({
  id,
  label,
  value,
  onChange,
  error,
  generated,
  live,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  generated: PolicyText | null;
  /** false = las automáticas salen de lo último guardado (el formulario tiene errores). */
  live: boolean;
}) {
  const lines = termLines(value);
  const empty = !value.trim();
  const describedBy = [`${id}-hint`, error ? `${id}-err` : ""].filter(Boolean).join(" ");

  const fill = () => {
    if (!generated) return;
    if (!empty && !confirm("¿Reemplazar lo escrito por las condiciones automáticas actuales? Podrá editarlas antes de guardar.")) return;
    onChange(generated.items.join("\n"));
  };
  const reset = () => {
    if (!confirm("¿Borrar sus condiciones? Volverán a generarse solas a partir de lo que configuró arriba.")) return;
    onChange("");
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={labelCls}>{label}</label>
      <textarea
        id={id}
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        placeholder="Vacío: se usan las condiciones automáticas."
        className={textareaCls}
      />
      <div className="flex items-start justify-between gap-3">
        <p id={`${id}-hint`} className={hintCls}>
          Una condición por línea (hasta {WINE_STORE_LIMITS.maxTermLines} líneas de {WINE_STORE_LIMITS.termLength} caracteres).
        </p>
        <span className={`${hintCls} tabular-nums whitespace-nowrap ${lines.length > WINE_STORE_LIMITS.maxTermLines ? "text-error" : ""}`}>
          {lines.length} de {WINE_STORE_LIMITS.maxTermLines}
        </span>
      </div>
      {error && <p id={`${id}-err`} className="text-[12px] text-error">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={fill} disabled={!generated} className={smallBtn}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit_note</span>
          Ver las condiciones actuales
        </button>
        <button type="button" onClick={reset} disabled={empty} className={smallBtn}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">autorenew</span>
          Volver a las automáticas
        </button>
      </div>
      {!live && generated && (
        <p className={hintCls}>Las condiciones automáticas mostradas son las de la última configuración guardada: corrija los campos marcados en rojo para ver los cambios.</p>
      )}
      {empty && generated && (
        <details className="rounded-lg border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-[13px]">
          <summary className="cursor-pointer font-semibold">Así se mostrarán las condiciones automáticas</summary>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-on-surface-variant break-words">
            {generated.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
