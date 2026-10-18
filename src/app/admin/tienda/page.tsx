"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { round2, WINE_MAX_PER_ORDER_LIMIT } from "@/lib/wineSale";
import {
  buildWinePolicies,
  normalizeWineStoreConfig,
  quoteShipping,
  WINE_STORE_LIMITS,
  type DeliveryMode,
  type PolicyText,
  type WineStoreConfig,
} from "@/lib/wineStoreRules";

/* Tienda de vinos: todo lo que antes estaba fijo en el código y ahora define el administrador: si la tienda está abierta,
   retiro, entrega (costo fijo o por zonas), tope de botellas y condiciones de compra. Se guarda con PUT en
   /api/admin/settings/wine-store (el cuerpo es la configuración completa, igual que en Configuración de pagos). */

let keySeq = 0;
/** Fila de zona del formulario: `id` es el que ya tiene la zona guardada (se reenvía para que no cambie al renombrarla). */
type ZoneRow = { _k: number; id?: string; name: string; fee: string };
const zoneRow = (name = "", fee = "", id?: string): ZoneRow => ({ _k: ++keySeq, id, name, fee });

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
  };
  /** Texto del campo. */
  defaultMax: string;
  /** Una condición por línea; vacío = se generan solas. */
  termsEs: string;
  termsEn: string;
}

type GeneratedTerms = { es: PolicyText; en: PolicyText };

/* ─── Números y textos ─── */

/** "5,5", "$7" o "7 USD" → número; "" → null; lo que no es un monto → NaN (mismas reglas que el servidor). */
function parseMoney(text: string): number | null {
  const s = text.replace(/usd|\$|\s/gi, "");
  if (!s) return null;
  return /^\d+([.,]\d+)?$/.test(s) ? Number(s.replace(",", ".")) : NaN;
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

/* ─── Formulario ↔ configuración ─── */

function toForm(c: WineStoreConfig): FormState {
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
    },
    defaultMaxPerOrder: Number(f.defaultMax.trim()),
    terms: { es: termLines(f.termsEs), en: termLines(f.termsEn) },
  };
}

/** Errores por campo (claves: channels, flatFee, freeFrom, zones, zone:<k>:name, zone:<k>:fee, defaultMax, termsEs, termsEn). */
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
  { id: "zones", label: "Por zonas", hint: "El cliente elige su zona al comprar y paga el costo de esa zona." },
];

export default function AdminWineStorePage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [defaults, setDefaults] = useState<WineStoreConfig | null>(null);
  /** Condiciones automáticas según lo último guardado (respaldo cuando el formulario aún tiene errores). */
  const [savedTerms, setSavedTerms] = useState<GeneratedTerms | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** Subtotal de ejemplo para la vista del costo de envío. */
  const [example, setExample] = useState("40");
  const savingRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusRef = useRef<string | null>(null);
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
      setDirty(false);
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

  const update = (fn: (f: FormState) => FormState) => {
    setForm((f) => (f ? fn(f) : f));
    setDirty(true);
  };
  const setPickup = (patch: Partial<FormState["pickup"]>) => update((f) => ({ ...f, pickup: { ...f.pickup, ...patch } }));
  const setDelivery = (patch: Partial<FormState["delivery"]>) => update((f) => ({ ...f, delivery: { ...f.delivery, ...patch } }));
  const updateZone = (k: number, patch: Partial<ZoneRow>) =>
    update((f) => ({ ...f, delivery: { ...f.delivery, zones: f.delivery.zones.map((z) => (z._k === k ? { ...z, ...patch } : z)) } }));

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
      setError(
        errors.channels
          ? errors.channels
          : "Hay campos por corregir. Revise los mensajes en rojo y vuelva a guardar."
      );
      const bad = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (bad && !errors.channels) bad.focus();
      else window.scrollTo({ top: 0, behavior: "smooth" });
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
      setDirty(false);
      notify(
        data.config.enabled
          ? "Configuración de la tienda guardada. Ya se aplica en el sitio."
          : "Configuración guardada. La tienda está cerrada: los clientes ven el aviso y no pueden comprar."
      );
    } catch (err) {
      setError((err as Error).message || "No se pudo guardar la configuración de la tienda.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const restoreDefaults = () => {
    if (!defaults) return;
    if (!confirm("¿Reemplazar el formulario por los valores por defecto (tienda abierta, retiro y entrega a coordinar por WhatsApp, máximo de 12 botellas)? No se guarda hasta que pulse «Guardar».")) return;
    setForm(toForm(defaults));
    setDirty(true);
  };

  const addZone = () => {
    const row = zoneRow();
    focusRef.current = id(`z${row._k}-name`);
    setDelivery({ zones: [...(form?.delivery.zones ?? []), row] });
  };

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
          {error && (
            <div role="alert" className="rounded-lg border border-error/40 bg-error-container/60 p-3 text-[14px] text-on-error-container">
              {error}
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
          <Card title="Entrega a domicilio" hint="Elija cómo se cobra el envío. El costo se suma al total del pedido, y el cliente lo paga junto con las botellas.">
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
                        Cada zona tiene su propio costo. El cliente elige la suya al comprar. Las filas en blanco no se guardan. Máximo{" "}
                        {WINE_STORE_LIMITS.maxZones} zonas ({form.delivery.zones.length} en la lista).
                      </p>
                    </div>
                    {form.delivery.zones.map((z, i) => {
                      const nameErr = errors[`zone:${z._k}:name`];
                      const feeErr = errors[`zone:${z._k}:fee`];
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
                                aria-describedby={[nameErr ? id(`z${z._k}-name-err`) : "", z.name.length >= 40 ? id(`z${z._k}-name-n`) : ""].filter(Boolean).join(" ") || undefined}
                                className={inputCls}
                              />
                              {z.name.length >= 40 && (
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
                                maxLength={12}
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
                  hint="Se muestra al cliente. Por ejemplo, los días de entrega."
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
                maxLength={2}
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
      <Field id={id} label={label} hint={hint} value={value} onChange={onChange} error={error} placeholder={placeholder} inputMode="decimal" maxLength={12} />
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
            <span className="font-semibold min-w-0">{r.name}</span>
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
        <input id={id} inputMode="decimal" maxLength={12} value={example} onChange={(e) => onExample(e.target.value)} className={`${inputCls} tabular-nums`} />
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
          <ul className="list-disc pl-5 mt-2 space-y-1 text-on-surface-variant">
            {generated.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
