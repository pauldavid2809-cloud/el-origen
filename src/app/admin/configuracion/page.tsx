"use client";

import React, { useCallback, useEffect, useId, useState } from "react";
import type { PagoMovilAccount, PaymentConfig, TransferAccount, ZelleAccount } from "@/lib/settings";

/* Configuración de pagos que ve el cliente en la página de su orden (Pago Móvil, transferencias, Binance, Zelle, efectivo).
   Cada cata elige cuáles de estos métodos acepta y qué cuenta Zelle muestra (Catas → Pagos de esta cata). */

/* PENDIENTE CLIENTE: el PDF de respuestas dice Pago Móvil 0412-399-3838; el número usado hasta ahora es 0412-399-3848. */
const PHONE_IN_USE = "0412-399-3848";
const PHONE_IN_PDF = "0412-399-3838";

let keySeq = 0;
type Keyed<T> = T & { _k: number };
const keyed = <T,>(v: T): Keyed<T> => ({ ...v, _k: ++keySeq });

type PmRow = Keyed<Omit<PagoMovilAccount, "id"> & { id?: string }>;
type TrRow = Keyed<Omit<TransferAccount, "id"> & { id?: string }>;
type ZeRow = Keyed<{ id?: string; account: string; holder: string; bank: string }>;

interface FormState {
  pagoMovil: PmRow[];
  transfers: TrRow[];
  zelle: ZeRow[];
  holderName: string;
  binance: { enabled: boolean; payLink: string; payId: string; email: string; holder: string };
  efectivo: { enabled: boolean; instructions: string; instructionsEn: string };
}

function toForm(c: PaymentConfig): FormState {
  return {
    pagoMovil: c.pagoMovil.map((a) => keyed({ ...a })),
    transfers: c.transfers.map((a) => keyed({ ...a })),
    zelle: (c.zelle ?? []).map((a: ZelleAccount) => keyed({ id: a.id, account: a.account, holder: a.holder, bank: a.bank ?? "" })),
    holderName: c.holderName ?? "",
    binance: {
      enabled: c.binance.enabled,
      payLink: c.binance.payLink ?? "",
      payId: c.binance.payId ?? "",
      email: c.binance.email ?? "",
      holder: c.binance.holder ?? "",
    },
    efectivo: { enabled: c.efectivo.enabled, instructions: c.efectivo.instructions, instructionsEn: c.efectivo.instructionsEn ?? "" },
  };
}

function toPayload(f: FormState) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const strip = <T extends { _k: number }>({ _k, ...rest }: T) => rest;
  return {
    pagoMovil: f.pagoMovil.map(strip),
    transfers: f.transfers.map(strip),
    zelle: f.zelle.map(strip),
    holderName: f.holderName,
    binance: f.binance,
    efectivo: f.efectivo,
  };
}

const digits = (v: string) => v.replace(/\D/g, "");

const inputCls =
  "w-full h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] focus:border-primary-container focus:outline-none";
const labelCls = "block text-[13px] font-semibold mb-1.5";
const smallBtn =
  "h-11 px-3 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container";
const removeBtn = "h-11 w-11 flex-shrink-0 inline-flex items-center justify-center rounded text-on-surface-variant hover:text-error";

export default function AdminPaymentSettingsPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [defaults, setDefaults] = useState<PaymentConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/settings/payments", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setForm(toForm(data.config));
      setDefaults(data.defaults);
      setDirty(false);
    } catch (err) {
      setLoadError((err as Error).message || "No se pudo cargar la configuración.");
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

  const update = (fn: (f: FormState) => FormState) => {
    setForm((f) => (f ? fn(f) : f));
    setDirty(true);
  };

  const updatePm = (i: number, patch: Partial<PmRow>) =>
    update((f) => ({ ...f, pagoMovil: f.pagoMovil.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));
  const updateTr = (i: number, patch: Partial<TrRow>) =>
    update((f) => ({ ...f, transfers: f.transfers.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));
  const updateZe = (i: number, patch: Partial<ZeRow>) =>
    update((f) => ({ ...f, zelle: f.zelle.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setForm(toForm(data.config));
      setDirty(false);
      setToast("Configuración de pagos guardada. Ya se muestra en las órdenes.");
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError((err as Error).message || "No se pudo guardar la configuración.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = () => {
    if (!defaults) return;
    if (!confirm("¿Reemplazar el formulario por los datos de pago por defecto? No se guarda hasta que pulse «Guardar».")) return;
    setForm(toForm(defaults));
    setDirty(true);
  };

  const phones = form?.pagoMovil.map((a) => digits(a.phone)) ?? [];
  const usesInUse = phones.includes(digits(PHONE_IN_USE));
  const usesPdf = phones.includes(digits(PHONE_IN_PDF));

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-4xl mx-auto space-y-6">
      {toast && (
        <div role="status" className="fixed top-5 right-5 left-5 sm:left-auto z-50 sm:max-w-sm rounded-lg px-4 py-3 text-[14px] shadow-elevated bg-ink text-paper">
          {toast}
        </div>
      )}

      <header>
        <p className="eyebrow mb-2">Panel</p>
        <h1 className="font-serif text-3xl sm:text-4xl">Configuración de pagos</h1>
        <p className="text-[14px] text-on-surface-variant mt-1">
          Datos que ve el cliente al pagar su reserva. Los cambios aplican de inmediato en todas las órdenes abiertas.
        </p>
      </header>

      {/* Conflicto del número de Pago Móvil: lo confirma el cliente. */}
      <div role="note" className="rounded-lg border border-tertiary/50 bg-tertiary-fixed/70 p-4 text-[14px] text-on-tertiary-fixed-variant flex gap-3">
        <span className="material-symbols-outlined flex-shrink-0" aria-hidden="true">warning</span>
        <div className="space-y-1">
          <p>
            <strong>Confirme el teléfono de Pago Móvil.</strong> En las respuestas del cuestionario aparece <strong>{PHONE_IN_PDF}</strong>, pero el
            número usado hasta ahora es <strong>{PHONE_IN_USE}</strong>.
          </p>
          <p>
            {usesInUse && usesPdf
              ? "Hoy hay cuentas con ambos números."
              : usesInUse
                ? `Hoy se muestra ${PHONE_IN_USE}.`
                : usesPdf
                  ? `Hoy se muestra ${PHONE_IN_PDF}.`
                  : "Hoy no se muestra ninguno de los dos."}{" "}
            Verifique con el banco cuál recibe los pagos y corríjalo abajo si hace falta.
          </p>
        </div>
      </div>

      {loadError ? (
        <div role="alert" className="rounded-lg border border-error/40 bg-error-container/50 p-4 text-[14px] text-on-error-container">
          {loadError}
        </div>
      ) : !form ? (
        <div className="py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
          <span className="sr-only">Cargando…</span>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-6">
          {error && (
            <div role="alert" className="rounded-lg border border-error/40 bg-error-container/60 p-3 text-[14px] text-on-error-container">
              {error}
            </div>
          )}

          {/* Pago Móvil */}
          <Card title="Pago Móvil" hint="Se paga en bolívares con la tasa de cada cata (BCV dólar, BCV euro o Binance).">
            {form.pagoMovil.map((a, i) => {
              const conflict = digits(a.phone) === digits(PHONE_IN_USE) || digits(a.phone) === digits(PHONE_IN_PDF);
              return (
                <div key={a._k} className="flex gap-1 items-start">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={id(`pm${a._k}-bank`)} className={labelCls}>Banco *</label>
                      <input id={id(`pm${a._k}-bank`)} required value={a.bank} onChange={(e) => updatePm(i, { bank: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor={id(`pm${a._k}-phone`)} className={labelCls}>Teléfono *</label>
                      <input
                        id={id(`pm${a._k}-phone`)}
                        required
                        inputMode="tel"
                        value={a.phone}
                        onChange={(e) => updatePm(i, { phone: e.target.value })}
                        className={`${inputCls} ${conflict ? "border-tertiary" : ""}`}
                        aria-describedby={conflict ? id(`pm${a._k}-warn`) : undefined}
                      />
                      {conflict && (
                        <p id={id(`pm${a._k}-warn`)} className="text-[12px] text-tertiary mt-1">Por confirmar (ver aviso).</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor={id(`pm${a._k}-doc`)} className={labelCls}>Cédula / RIF *</label>
                      <input id={id(`pm${a._k}-doc`)} required value={a.docId} onChange={(e) => updatePm(i, { docId: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <button type="button" onClick={() => update((f) => ({ ...f, pagoMovil: f.pagoMovil.filter((_, j) => j !== i) }))} className={`${removeBtn} mt-7`}>
                    <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    <span className="sr-only">Quitar Pago Móvil {a.bank}</span>
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => update((f) => ({ ...f, pagoMovil: [...f.pagoMovil, keyed({ bank: "", phone: "", docId: "" })] }))}
              className={smallBtn}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Agregar Pago Móvil
            </button>
          </Card>

          {/* Transferencias */}
          <Card title="Transferencias bancarias" hint="Número de cuenta de 20 dígitos.">
            {form.transfers.map((a, i) => (
              <div key={a._k} className="flex gap-1 items-start rounded-lg border border-outline-variant p-3 sm:p-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={id(`tr${a._k}-bank`)} className={labelCls}>Banco *</label>
                    <input id={id(`tr${a._k}-bank`)} required value={a.bank} onChange={(e) => updateTr(i, { bank: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={id(`tr${a._k}-type`)} className={labelCls}>Tipo de cuenta</label>
                    <input id={id(`tr${a._k}-type`)} value={a.accountType} onChange={(e) => updateTr(i, { accountType: e.target.value })} placeholder="Cuenta corriente" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={id(`tr${a._k}-num`)} className={labelCls}>Número de cuenta *</label>
                    <input id={id(`tr${a._k}-num`)} required inputMode="numeric" value={a.number} onChange={(e) => updateTr(i, { number: e.target.value })} className={`${inputCls} tabular-nums`} />
                    <p className={`text-[12px] mt-1 ${digits(a.number).length === 20 ? "text-on-surface-variant" : "text-error"}`}>
                      {digits(a.number).length} de 20 dígitos
                    </p>
                  </div>
                  <div>
                    <label htmlFor={id(`tr${a._k}-doc`)} className={labelCls}>Cédula / RIF *</label>
                    <input id={id(`tr${a._k}-doc`)} required value={a.docId} onChange={(e) => updateTr(i, { docId: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <button type="button" onClick={() => update((f) => ({ ...f, transfers: f.transfers.filter((_, j) => j !== i) }))} className={`${removeBtn} mt-7`}>
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                  <span className="sr-only">Quitar cuenta {a.bank}</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => update((f) => ({ ...f, transfers: [...f.transfers, keyed({ bank: "", accountType: "", number: "", docId: "" })] }))}
              className={smallBtn}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Agregar cuenta
            </button>
          </Card>

          <Card title="Titular de las cuentas" hint="Opcional. Si lo completa, se muestra junto a los datos bancarios.">
            <div>
              <label htmlFor={id("holder")} className={labelCls}>Nombre del titular</label>
              <input
                id={id("holder")}
                value={form.holderName}
                onChange={(e) => update((f) => ({ ...f, holderName: e.target.value }))}
                placeholder="Pendiente de confirmar"
                className={inputCls}
              />
            </div>
          </Card>

          {/* Binance */}
          <Card title="Binance USDT" hint="El cliente paga el total en USDT (1 USDT = 1 USD).">
            <Toggle
              checked={form.binance.enabled}
              onChange={(v) => update((f) => ({ ...f, binance: { ...f.binance, enabled: v } }))}
              label="Aceptar pagos por Binance"
            />
            {form.binance.enabled && (
              <>
                {!form.binance.payLink && !form.binance.payId && !form.binance.email && (
                  <p className="text-[13px] text-tertiary">Falta el enlace de cobro, el Pay ID o el correo de Binance: sin ellos el cliente no sabrá a dónde enviar.</p>
                )}
                <div>
                  <label htmlFor={id("bn-link")} className={labelCls}>Enlace de cobro (QR de Binance)</label>
                  <input
                    id={id("bn-link")}
                    type="url"
                    inputMode="url"
                    placeholder="https://app.binance.com/uni-qr/…"
                    value={form.binance.payLink}
                    onChange={(e) => update((f) => ({ ...f, binance: { ...f.binance, payLink: e.target.value } }))}
                    className={inputCls}
                  />
                  <p className="text-[12px] text-on-surface-variant mt-1">
                    En Binance: Pagar → Recibir → Compartir código QR → copiar enlace. El sitio lo muestra como QR y como botón.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={id("bn-pay")} className={labelCls}>Pay ID</label>
                    <input id={id("bn-pay")} inputMode="numeric" value={form.binance.payId} onChange={(e) => update((f) => ({ ...f, binance: { ...f.binance, payId: e.target.value } }))} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={id("bn-email")} className={labelCls}>Correo de Binance</label>
                    <input id={id("bn-email")} type="email" value={form.binance.email} onChange={(e) => update((f) => ({ ...f, binance: { ...f.binance, email: e.target.value } }))} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={id("bn-holder")} className={labelCls}>Titular</label>
                    <input id={id("bn-holder")} value={form.binance.holder} onChange={(e) => update((f) => ({ ...f, binance: { ...f.binance, holder: e.target.value } }))} className={inputCls} />
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Zelle */}
          <Card title="Zelle" hint="Se paga en dólares. Puede registrar varias cuentas y elegir en cada cata cuál se muestra.">
            {form.zelle.map((a, i) => (
              <div key={a._k} className="flex gap-1 items-start rounded-lg border border-outline-variant p-3 sm:p-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={id(`ze${a._k}-account`)} className={labelCls}>Correo o teléfono Zelle *</label>
                    <input
                      id={id(`ze${a._k}-account`)}
                      required
                      autoCapitalize="none"
                      spellCheck={false}
                      value={a.account}
                      onChange={(e) => updateZe(i, { account: e.target.value })}
                      placeholder="pagos@correo.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor={id(`ze${a._k}-holder`)} className={labelCls}>Titular *</label>
                    <input id={id(`ze${a._k}-holder`)} required value={a.holder} onChange={(e) => updateZe(i, { holder: e.target.value })} placeholder="Como aparece en Zelle" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={id(`ze${a._k}-bank`)} className={labelCls}>Banco</label>
                    <input id={id(`ze${a._k}-bank`)} value={a.bank} onChange={(e) => updateZe(i, { bank: e.target.value })} placeholder="Opcional" className={inputCls} />
                  </div>
                </div>
                <button type="button" onClick={() => update((f) => ({ ...f, zelle: f.zelle.filter((_, j) => j !== i) }))} className={`${removeBtn} mt-7`}>
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                  <span className="sr-only">Quitar Zelle {a.account}</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => update((f) => ({ ...f, zelle: [...f.zelle, keyed({ account: "", holder: "", bank: "" })] }))}
              className={smallBtn}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Agregar cuenta Zelle
            </button>
          </Card>

          {/* Efectivo */}
          <Card title="Efectivo" hint="El cliente coordina la entrega por WhatsApp; la reserva se aprueba al recibir el dinero.">
            <Toggle
              checked={form.efectivo.enabled}
              onChange={(v) => update((f) => ({ ...f, efectivo: { ...f.efectivo, enabled: v } }))}
              label="Aceptar efectivo"
            />
            {form.efectivo.enabled && (
              <div>
                <label htmlFor={id("cash")} className={labelCls}>Instrucciones para el cliente</label>
                <textarea
                  id={id("cash")}
                  rows={2}
                  maxLength={300}
                  value={form.efectivo.instructions}
                  onChange={(e) => update((f) => ({ ...f, efectivo: { ...f.efectivo, instructions: e.target.value } }))}
                  className="w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-[14px] focus:border-primary-container focus:outline-none"
                />
                <label htmlFor={id("cash-en")} className={`${labelCls} mt-4`}>Instrucciones en inglés (opcional)</label>
                <textarea
                  id={id("cash-en")}
                  rows={2}
                  maxLength={300}
                  value={form.efectivo.instructionsEn}
                  onChange={(e) => update((f) => ({ ...f, efectivo: { ...f.efectivo, instructionsEn: e.target.value } }))}
                  placeholder="Ej.: Cash delivery arranged in advance via WhatsApp"
                  aria-describedby={id("cash-en-hint")}
                  className="w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-[14px] focus:border-primary-container focus:outline-none"
                />
                <p id={id("cash-en-hint")} className="mt-1.5 text-[12px] text-on-surface-variant">
                  Se muestra a quien ve el sitio en inglés. Si lo deja vacío, se muestra el texto en español.
                </p>
              </div>
            )}
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

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 min-h-11 cursor-pointer text-[14px] font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[#7D2A46] w-4 h-4" />
      {label}
    </label>
  );
}
