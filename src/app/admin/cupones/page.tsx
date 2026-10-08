"use client";

import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { Coupon, CouponUsage } from "@/lib/coupons";
import { TEAM, getTeamMember } from "@/lib/team";

type AdminCoupon = Coupon & { usage: CouponUsage };
type ReferrerRow = CouponUsage & { coupons: string[] };

/** Debe coincidir con WELCOME_COUPON_CODE de @/lib/coupons (módulo solo de servidor). */
const WELCOME_CODE = "2ORIGEN";
const OTHER = "__otro";

interface FormState {
  code: string;
  discountPercent: string;
  description: string;
  /** Id de TEAM, "" (sin referente) u OTHER. */
  referrerChoice: string;
  referrerText: string;
  membersOnly: boolean;
  maxUses: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  discountPercent: "",
  description: "",
  referrerChoice: "",
  referrerText: "",
  membersOnly: false,
  maxUses: "",
  active: true,
};

function formFrom(c: Coupon): FormState {
  const team = c.referrer ? getTeamMember(c.referrer) : undefined;
  return {
    code: c.code,
    discountPercent: String(c.discountPercent),
    description: c.description,
    referrerChoice: !c.referrer ? "" : team ? team.id : OTHER,
    referrerText: c.referrer && !team ? c.referrer : "",
    membersOnly: c.membersOnly,
    maxUses: c.maxUses === null ? "" : String(c.maxUses),
    active: c.active,
  };
}

const referrerName = (ref: string) => getTeamMember(ref)?.name ?? ref;
const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

const inputCls =
  "w-full h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] focus:border-primary-container focus:outline-none disabled:bg-surface-container disabled:text-on-surface-variant";
const labelCls = "block text-[13px] font-semibold mb-1.5";
const actionBtn =
  "h-10 px-3 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container disabled:opacity-50";

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [referrers, setReferrers] = useState<Record<string, ReferrerRow>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setCoupons(data.coupons);
      setReferrers(data.referrers ?? {});
    } catch (err) {
      setLoadError((err as Error).message || "No se pudieron cargar los cupones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setFormError(null);
  };

  const startEdit = (c: Coupon) => {
    setForm(formFrom(c));
    setEditing(c.code);
    setFormError(null);
    document.getElementById(id("form"))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const referrer = form.referrerChoice === OTHER ? form.referrerText.trim() : form.referrerChoice;
    if (form.referrerChoice === OTHER && !referrer) {
      setFormError("Escriba el nombre del referente o elija uno de la lista.");
      return;
    }
    const body = {
      code: form.code,
      discountPercent: Number(form.discountPercent.replace(",", ".")),
      description: form.description,
      referrer: referrer || null,
      membersOnly: form.membersOnly,
      maxUses: form.maxUses.trim() ? Number(form.maxUses) : null,
      active: form.active,
    };
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/coupons/${encodeURIComponent(editing)}` : "/api/admin/coupons", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      notify(editing ? `Cupón ${data.coupon.code} actualizado.` : `Cupón ${data.coupon.code} creado.`);
      resetForm();
      await load();
    } catch (err) {
      setFormError((err as Error).message || "No se pudo guardar el cupón.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    setBusy(c.code);
    try {
      const res = await fetch(`/api/admin/coupons/${encodeURIComponent(c.code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !c.active }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      notify(`Cupón ${c.code} ${c.active ? "desactivado" : "activado"}.`);
      await load();
    } catch (err) {
      notify((err as Error).message || "No se pudo cambiar el estado.", false);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`¿Eliminar el cupón ${c.code}?`)) return;
    setBusy(c.code);
    try {
      const res = await fetch(`/api/admin/coupons/${encodeURIComponent(c.code)}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      notify(`Cupón ${c.code} eliminado.`);
      if (editing === c.code) resetForm();
      await load();
    } catch (err) {
      notify((err as Error).message || "No se pudo eliminar el cupón.", false);
    } finally {
      setBusy(null);
    }
  };

  const totals = useMemo(
    () =>
      coupons.reduce(
        (t, c) => ({ orders: t.orders + c.usage.orders, spots: t.spots + c.usage.spots, revenueUsd: t.revenueUsd + c.usage.revenueUsd }),
        { orders: 0, spots: 0, revenueUsd: 0 }
      ),
    [coupons]
  );
  const referrerRows = Object.entries(referrers).sort((a, b) => b[1].revenueUsd - a[1].revenueUsd || b[1].orders - a[1].orders);
  const welcome = coupons.find((c) => c.code === WELCOME_CODE);

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8">
      {toast && (
        <div
          role="status"
          className={`fixed top-5 right-5 left-5 sm:left-auto z-50 sm:max-w-sm rounded-lg px-4 py-3 text-[14px] shadow-elevated ${
            toast.ok ? "bg-ink text-paper" : "bg-error text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      <header>
        <p className="eyebrow mb-2">Panel</p>
        <h1 className="font-serif text-3xl sm:text-4xl">Cupones</h1>
        <p className="text-[14px] text-on-surface-variant mt-1">
          Descuentos por porcentaje. Asigne un referente (sommelier u otro) para medir los clientes y las ventas que trae cada código.
        </p>
      </header>

      {welcome && !welcome.active && (
        <div className="rounded-lg border border-tertiary/40 bg-tertiary-fixed/60 p-4 text-[14px] text-on-tertiary-fixed-variant flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="flex-1">
            <strong>{WELCOME_CODE}</strong> (bienvenida para nuevos registros) está inactivo con {welcome.discountPercent}% provisional. Defina el
            porcentaje y actívelo cuando quiera ofrecerlo: solo funciona para correos registrados como miembros.
          </span>
          <button type="button" onClick={() => startEdit(welcome)} className="h-10 px-4 rounded border border-tertiary/60 text-[13px] font-semibold self-start sm:self-auto">
            Configurar
          </button>
        </div>
      )}

      {/* Formulario */}
      <section id={id("form")} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6 scroll-mt-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="font-serif text-xl">{editing ? `Editar ${editing}` : "Nuevo cupón"}</h2>
          {editing && (
            <button type="button" onClick={resetForm} className="h-10 px-3 rounded text-[13px] font-semibold text-on-surface-variant hover:text-primary">
              Cancelar edición
            </button>
          )}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {formError && (
            <div role="alert" className="rounded-lg border border-error/40 bg-error-container/60 p-3 text-[14px] text-on-error-container">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_1fr] gap-4">
            <div>
              <label htmlFor={id("code")} className={labelCls}>Código *</label>
              <input
                id={id("code")}
                required
                disabled={Boolean(editing)}
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s+/g, ""))}
                maxLength={30}
                pattern="[A-Za-z0-9][A-Za-z0-9_\-]{1,29}"
                title="De 2 a 30 caracteres: letras, números, guion o guion bajo."
                placeholder="BELKIS10"
                autoCapitalize="characters"
                className={`${inputCls} font-mono font-semibold tracking-wider uppercase`}
              />
            </div>
            <div>
              <label htmlFor={id("pct")} className={labelCls}>Descuento (%) *</label>
              <input id={id("pct")} required inputMode="decimal" value={form.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} placeholder="10" className={inputCls} />
            </div>
            <div>
              <label htmlFor={id("max")} className={labelCls}>Máximo de usos</label>
              <input id={id("max")} type="number" min={1} step={1} value={form.maxUses} onChange={(e) => set("maxUses", e.target.value)} placeholder="Sin límite" className={inputCls} />
            </div>
          </div>
          <div>
            <label htmlFor={id("desc")} className={labelCls}>Descripción</label>
            <input id={id("desc")} maxLength={200} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Para qué o para quién es el cupón" className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={id("ref")} className={labelCls}>Referente</label>
              <select id={id("ref")} value={form.referrerChoice} onChange={(e) => set("referrerChoice", e.target.value)} className={inputCls}>
                <option value="">Sin referente</option>
                {TEAM.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                <option value={OTHER}>Otro (escribir)…</option>
              </select>
            </div>
            {form.referrerChoice === OTHER && (
              <div>
                <label htmlFor={id("refText")} className={labelCls}>Nombre del referente *</label>
                <input id={id("refText")} maxLength={80} value={form.referrerText} onChange={(e) => set("referrerText", e.target.value)} placeholder="Aliado, influencer, marca…" className={inputCls} />
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
            <label className="flex items-center gap-3 min-h-11 cursor-pointer text-[14px]">
              <input type="checkbox" checked={form.membersOnly} onChange={(e) => set("membersOnly", e.target.checked)} className="accent-[#7D2A46] w-4 h-4" />
              Solo miembros registrados
            </label>
            <label className="flex items-center gap-3 min-h-11 cursor-pointer text-[14px]">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="accent-[#7D2A46] w-4 h-4" />
              Activo (se puede usar en el checkout)
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-5 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              {saving && <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>}
              {editing ? "Guardar cambios" : "Crear cupón"}
            </button>
          </div>
        </form>
      </section>

      {/* Lista */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl">Cupones y usos</h2>
          <p className="text-[13px] text-on-surface-variant">
            Total con cupón (órdenes aprobadas): {totals.orders} órdenes · {totals.spots} cupos · {usd(totals.revenueUsd)}
          </p>
        </div>

        {loading && !coupons.length ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
            <span className="sr-only">Cargando…</span>
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-lg border border-error/40 bg-error-container/50 p-4 text-[14px] text-on-error-container">
            {loadError}
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant">Todavía no hay cupones.</div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <li key={c.code} className={`rounded-xl border bg-surface-container-lowest overflow-hidden flex flex-col ${c.active ? "border-outline-variant" : "border-dashed border-outline-variant"}`}>
                <div className="p-5 space-y-3 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono font-semibold text-lg tracking-wider text-primary-container break-all">{c.code}</span>
                    <span className="font-serif text-2xl whitespace-nowrap">−{c.discountPercent}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.active ? "bg-emerald-100 text-emerald-900" : "bg-surface-container-high text-on-surface-variant"}`}>
                      {c.active ? "Activo" : "Inactivo"}
                    </span>
                    {c.membersOnly && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant">Solo miembros</span>
                    )}
                    {c.maxUses !== null && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                        Máx. {c.maxUses} {c.maxUses === 1 ? "uso" : "usos"}
                      </span>
                    )}
                  </div>
                  {c.description && <p className="text-[14px] text-on-surface-variant">{c.description}</p>}
                  {c.referrer && (
                    <p className="text-[13px] text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">person</span>
                      Referente: <strong className="text-on-surface">{referrerName(c.referrer)}</strong>
                    </p>
                  )}
                  <dl className="grid grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 text-[13px]">
                    <div>
                      <dt className="text-on-surface-variant">Órdenes</dt>
                      <dd className="font-semibold tabular-nums">{c.usage.orders}</dd>
                    </div>
                    <div>
                      <dt className="text-on-surface-variant">Cupos</dt>
                      <dd className="font-semibold tabular-nums">{c.usage.spots}</dd>
                    </div>
                    <div>
                      <dt className="text-on-surface-variant">Ventas</dt>
                      <dd className="font-semibold tabular-nums">{usd(c.usage.revenueUsd)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-outline-variant bg-surface-container-low/60 px-4 py-3">
                  <button type="button" disabled={busy === c.code} onClick={() => startEdit(c)} className={actionBtn}>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                    Editar
                  </button>
                  <button type="button" disabled={busy === c.code} onClick={() => toggleActive(c)} className={actionBtn}>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{c.active ? "toggle_off" : "toggle_on"}</span>
                    {c.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === c.code}
                    onClick={() => remove(c)}
                    className="h-10 px-3 rounded text-[13px] font-semibold text-on-surface-variant hover:text-error ml-auto inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[12px] text-on-surface-variant">Los usos y ventas cuentan solo órdenes aprobadas. Un cupón ya usado no se elimina: desactívelo.</p>
      </section>

      {/* Por referente */}
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
        <div className="p-5 border-b border-outline-variant">
          <h2 className="font-serif text-xl">Impacto por referente</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Suma de los cupones asignados a cada referente (órdenes aprobadas).</p>
        </div>
        {referrerRows.length === 0 ? (
          <p className="p-5 text-[14px] text-on-surface-variant">Ningún cupón tiene referente todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-surface-container-low text-[12px] uppercase tracking-wider text-on-surface-variant">
                  <th scope="col" className="px-5 py-3 font-semibold">Referente</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Cupones</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right">Órdenes</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right">Cupos</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right">Ventas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {referrerRows.map(([ref, r]) => (
                  <tr key={ref}>
                    <th scope="row" className="px-5 py-3 font-semibold whitespace-nowrap">{referrerName(ref)}</th>
                    <td className="px-5 py-3 font-mono text-[13px]">{r.coupons.join(", ")}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{r.orders}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{r.spots}</td>
                    <td className="px-5 py-3 text-right tabular-nums whitespace-nowrap">{usd(r.revenueUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
