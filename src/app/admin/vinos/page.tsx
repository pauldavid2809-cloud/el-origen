"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { shrinkImage } from "@/lib/shrinkImage";
import { WINE_TYPES, type Tasting, type Wine, type WineSpec, type WineStatus, type WineType } from "@/types";
import { WINE_TYPE_LABEL } from "@/app/vinos/copy";
import { availableOf, isWineForSale, WINE_MAX_PER_ORDER_LIMIT } from "@/lib/wineSale";

/* Vinos: catálogo de los productos degustados en las catas. Se publican en /vinos con su ficha técnica.
   Cada vino puede además estar «Activo para la venta» (precio + interruptor, aparte de Publicado/Borrador):
   solo los vinos a la venta muestran precio y botón Comprar en el sitio. El precio se edita en la propia tarjeta
   y, opcionalmente, el vino controla sus existencias (botellas a la venta menos las reservadas por pedidos). */

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
/** Mismo tope que acepta el servidor para las existencias de un vino. */
const STOCK_MAX = 100_000;
/** Filas habituales de la ficha técnica (un clic las agrega). */
const SPEC_SUGGESTIONS = ["Procedencia", "Viticultura", "Crianza", "Graduación", "Temperatura de servicio", "Notas de cata", "Maridaje"];

type CataOption = Pick<Tasting, "id" | "title" | "date" | "dateDisplay">;

let keySeq = 0;
type SpecRow = WineSpec & { _k: number };
const specRow = (label = "", value = ""): SpecRow => ({ label, value, _k: ++keySeq });

interface FormState {
  name: string;
  winery: string;
  region: string;
  type: WineType;
  grapes: string;
  vintage: string;
  description: string;
  imageUrl: string;
  specs: SpecRow[];
  tastingIds: string[];
  status: WineStatus;
  /** Texto del campo (acepta coma o punto); vacío = sin precio. */
  priceUsd: string;
  saleActive: boolean;
  /** Texto del campo; vacío = el tope por defecto del sitio. */
  maxPerOrder: string;
  /** Texto del campo; vacío = sin control de existencias. */
  stock: string;
}

function toForm(w: Wine | null): FormState {
  return {
    name: w?.name ?? "",
    winery: w?.winery ?? "",
    region: w?.region ?? "",
    type: w?.type ?? "tinto",
    grapes: w?.grapes ?? "",
    vintage: w?.vintage ?? "",
    description: w?.description ?? "",
    imageUrl: w?.imageUrl ?? "",
    specs: w ? w.specs.map((s) => specRow(s.label, s.value)) : [specRow("Procedencia"), specRow("Crianza")],
    tastingIds: w?.tastingIds ?? [],
    status: w?.status ?? "draft",
    priceUsd: w?.priceUsd != null ? String(w.priceUsd) : "",
    saleActive: w?.saleActive ?? false,
    maxPerOrder: w?.maxPerOrder != null ? String(w.maxPerOrder) : "",
    stock: w?.stock != null ? String(w.stock) : "",
  };
}

/** ¿El campo de precio trae algún valor distinto de cero? (solo para avisar antes de enviar: el servidor valida el número exacto) */
const hasPrice = (text: string) => /[1-9]/.test(text);

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

/** Insignia de venta de la tarjeta: «En venta · $X» / «En venta (oculto: borrador)» / «Sin venta». */
function saleBadge(w: Wine): { label: string; cls: string; title?: string } {
  if (isWineForSale(w)) return { label: `En venta · ${usd(w.priceUsd as number)}`, cls: "bg-emerald-100 text-emerald-900" };
  if (w.saleActive && (w.priceUsd ?? 0) > 0) {
    return {
      label: "En venta (oculto: borrador)",
      cls: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      title: "Está activo para la venta, pero en Borrador no se muestra en el sitio: publíquelo para que se pueda comprar.",
    };
  }
  return { label: "Sin venta", cls: "bg-surface-container-high text-on-surface-variant" };
}

const reservedText = (n: number) => `${n} ${n === 1 ? "reservada" : "reservadas"}`;

/**
 * Insignia de existencias de la tarjeta: «Quedan N de M · X reservadas» / «Agotado». Sin control de existencias no hay insignia.
 * `held` son las botellas reservadas por pedidos vigentes; si no se pudieron leer (`null`) solo se muestra el total.
 */
function stockBadge(w: Wine, held: number | null): { label: string; cls: string; title?: string } | null {
  if (w.stock === null) return null;
  if (held === null) {
    return {
      label: `${w.stock} en existencias · reservas sin leer`,
      cls: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      title: "No se pudieron leer las botellas reservadas por los pedidos. Actualice la página.",
    };
  }
  const left = availableOf(w.stock, held) ?? 0;
  if (left === 0) {
    return {
      label: held > 0 ? `Agotado · ${reservedText(held)} de ${w.stock}` : "Agotado",
      cls: "bg-error-container text-on-error-container",
      title: held > w.stock ? "Hay más botellas reservadas que existencias: revise los pedidos o suba las existencias." : undefined,
    };
  }
  return {
    label: `${left === 1 ? "Queda" : "Quedan"} ${left} de ${w.stock} · ${reservedText(held)}`,
    cls: left <= 3 ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-surface-container-high text-on-surface-variant",
    title: "Quedan = existencias menos las botellas reservadas por pedidos en revisión, aprobados o por pagar vigentes.",
  };
}

const inputCls =
  "w-full h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] focus:border-primary-container focus:outline-none";
const textareaCls =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-[14px] focus:border-primary-container focus:outline-none";
const labelCls = "block text-[13px] font-semibold mb-1.5";
const hintCls = "text-[12px] text-on-surface-variant mt-1";
const actionBtn =
  "h-10 px-3 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container disabled:opacity-50";

export default function AdminWinesPage() {
  const [wines, setWines] = useState<Wine[]>([]);
  /** Botellas reservadas por pedido vigente, por vino (solo de los vinos que controlan existencias). */
  const [holds, setHolds] = useState<Record<string, number>>({});
  /** El servidor no pudo leer las reservas: se muestran las existencias sin descontarlas. */
  const [holdsError, setHoldsError] = useState(false);
  const [catas, setCatas] = useState<CataOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  /** `notice`: aviso al abrir el formulario; `activateSale`: lo abre con «Activo para la venta» ya marcado (falta el precio). */
  const [editing, setEditing] = useState<{ wine: Wine | null; notice?: string; activateSale?: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const notify = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [w, c] = await Promise.all([
        fetch("/api/admin/wines", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/catas", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (!w.success) throw new Error(w.message);
      setWines(w.wines);
      setHolds(w.holds ?? {});
      setHoldsError(Boolean(w.holdsError));
      if (c.success) {
        setCatas(
          (c.tastings as Tasting[])
            .map(({ id, title, date, dateDisplay }) => ({ id, title, date, dateDisplay }))
            .sort((a, b) => b.date.localeCompare(a.date))
        );
      }
    } catch (err) {
      setLoadError((err as Error).message || "No se pudieron cargar los vinos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (w: Wine) => {
    if (!confirm(`¿Eliminar "${w.name}"? Esta acción no se puede deshacer.`)) return;
    setBusy(w.id);
    try {
      const res = await fetch(`/api/admin/wines/${w.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      notify("Vino eliminado.");
      await load();
    } catch (err) {
      notify((err as Error).message || "No se pudo eliminar el vino.", false);
    } finally {
      setBusy(null);
    }
  };

  /** Interruptor de un clic de la venta (como el de los cupones). Sin precio no se puede activar: abre el formulario. */
  const toggleSale = async (w: Wine) => {
    if (!w.saleActive && !((w.priceUsd ?? 0) > 0)) {
      setEditing({ wine: w, notice: "Defina el precio para activar la venta.", activateSale: true });
      return;
    }
    setBusy(w.id);
    try {
      const res = await fetch(`/api/admin/wines/${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleActive: !w.saleActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      notify(
        w.saleActive
          ? `Venta de «${w.name}» desactivada.`
          : w.status === "published"
            ? `«${w.name}» está en venta.`
            : `Venta de «${w.name}» activada, pero sigue en Borrador: no se mostrará hasta que lo publique.`
      );
      await load();
    } catch (err) {
      notify((err as Error).message || "No se pudo cambiar el estado de la venta.", false);
    } finally {
      setBusy(null);
    }
  };

  const published = wines.filter((w) => w.status === "published").length;
  const forSale = wines.filter((w) => isWineForSale(w)).length;

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div
          role="status"
          className={`fixed top-5 right-5 left-5 sm:left-auto z-[60] sm:max-w-sm rounded-lg px-4 py-3 text-[14px] shadow-elevated ${
            toast.ok ? "bg-ink text-paper" : "bg-error text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Vinos</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Los productos degustados en las catas, con foto y ficha técnica. Los publicados se ven en{" "}
            <a href="/vinos" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-container hover:underline">
              /vinos
            </a>{" "}
            y en la portada. {wines.length > 0 && `${published} de ${wines.length} publicados · ${forSale} en venta.`}
            <span className="block mt-0.5">
              Active la venta de un vino para que muestre su precio y el botón Comprar; un vino en Borrador no se muestra aunque tenga la venta activa.
              El precio se cambia en la propia tarjeta.
            </span>
            <span className="block mt-0.5">
              Para abrir o cerrar la tienda, definir el envío o las condiciones de compra, vaya a{" "}
              <a href="/admin/tienda" className="font-semibold text-primary-container hover:underline">Tienda de vinos</a>.
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ wine: null })}
          className="h-11 px-4 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center gap-2 self-start sm:self-auto whitespace-nowrap flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
          Nuevo vino
        </button>
      </header>

      {loading && !wines.length ? (
        <div className="py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
          <span className="sr-only">Cargando…</span>
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-lg border border-error/40 bg-error-container/50 p-4 text-[14px] text-on-error-container">
          {loadError}
        </div>
      ) : wines.length === 0 ? (
        <div className="py-16 px-6 text-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant space-y-3">
          <p>Aún no hay vinos en el catálogo.</p>
          <button type="button" onClick={() => setEditing({ wine: null })} className="text-[14px] font-semibold text-primary-container hover:underline">
            Agregar el primero
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wines.map((w) => {
            const badge = saleBadge(w);
            const stock = stockBadge(w, holdsError ? null : holds[w.id] ?? 0);
            return (
              <li key={w.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden flex flex-col">
                <div className="relative aspect-[4/3] bg-ink flex items-center justify-center">
                  {w.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.imageUrl} alt="" className="absolute inset-0 h-full w-full object-contain p-3" />
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-paper/30" aria-hidden="true">wine_bar</span>
                  )}
                  <span
                    className={`absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      w.status === "published" ? "bg-emerald-100 text-emerald-900" : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {w.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                </div>
                <div className="p-4 flex-1">
                  <p className="font-serif text-xl leading-snug">{w.name}</p>
                  <p className="text-[13px] text-on-surface-variant mt-1">
                    {[WINE_TYPE_LABEL.es[w.type], w.winery, w.vintage].filter(Boolean).join(" · ")}
                  </p>
                  {w.tastingIds.length > 0 && (
                    <p className="text-[12px] text-on-surface-variant mt-1">
                      Degustado en {w.tastingIds.length} {w.tastingIds.length === 1 ? "cata" : "catas"}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span title={badge.title} className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {stock && (
                      <span title={stock.title} className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${stock.cls}`}>
                        {stock.label}
                      </span>
                    )}
                  </div>
                  <QuickPrice
                    key={`${w.id}:${w.priceUsd ?? ""}`}
                    wine={w}
                    disabled={busy === w.id}
                    onSaved={(updated) => {
                      setWines((list) => list.map((x) => (x.id === updated.id ? updated : x)));
                      notify(
                        updated.priceUsd != null
                          ? `Precio de «${updated.name}» actualizado: ${usd(updated.priceUsd)}.`
                          : `Se quitó el precio de «${updated.name}».`
                      );
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 border-t border-outline-variant bg-surface-container-low/60 px-4 py-3">
                  <button type="button" disabled={busy === w.id} onClick={() => setEditing({ wine: w })} className={actionBtn}>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                    Editar
                  </button>
                  <button type="button" disabled={busy === w.id} onClick={() => toggleSale(w)} className={actionBtn}>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{w.saleActive ? "toggle_off" : "toggle_on"}</span>
                    {w.saleActive ? "Desactivar venta" : "Activar venta"}
                  </button>
                  {w.status === "published" && (
                    <a href={`/vinos/${w.slug}`} target="_blank" rel="noopener noreferrer" className={actionBtn}>
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
                      Ver
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={busy === w.id}
                    onClick={() => remove(w)}
                    className="h-10 px-3 rounded text-[13px] font-semibold text-on-surface-variant hover:text-error ml-auto inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <WineForm
          wine={editing.wine}
          notice={editing.notice}
          activateSale={editing.activateSale}
          held={editing.wine && !holdsError ? holds[editing.wine.id] ?? 0 : null}
          catas={catas}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            notify(message);
            await load();
          }}
        />
      )}
    </div>
  );
}

/**
 * Edición rápida del precio en la tarjeta (PATCH { priceUsd }): no toca ningún otro campo ni el interruptor de la venta.
 * Acepta coma o punto; el servidor valida el número y rechaza quitar el precio de un vino activo para la venta.
 */
function QuickPrice({ wine, disabled, onSaved }: { wine: Wine; disabled: boolean; onSaved: (wine: Wine) => void }) {
  const uid = useId();
  const initial = wine.priceUsd != null ? String(wine.priceUsd) : "";
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const unchanged = value.trim() === initial;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current || unchanged) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/wines/${wine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceUsd: value.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.success) throw new Error(data?.message);
      const saved: Wine = data.wine;
      // Muestra el precio tal como quedó guardado ("18,5" → "18.5") para que «Guardar» vuelva a quedar apagado.
      setValue(saved.priceUsd != null ? String(saved.priceUsd) : "");
      onSaved(saved);
    } catch (err) {
      setError((err as Error).message || "No se pudo guardar el precio.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="mt-3">
      <label htmlFor={`${uid}-price`} className="block text-[12px] font-semibold mb-1">Precio (USD)</label>
      <div className="flex gap-2">
        <input
          id={`${uid}-price`}
          inputMode="decimal"
          maxLength={12}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="Sin precio"
          aria-label={`Precio (USD) de ${wine.name}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${uid}-price-err` : undefined}
          className={`${inputCls} min-w-0 tabular-nums aria-[invalid=true]:border-error`}
        />
        <button
          type="submit"
          disabled={disabled || saving || unchanged}
          aria-label={`Guardar el precio de ${wine.name}`}
          className="h-11 px-3 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container disabled:opacity-50 disabled:hover:border-outline-variant flex-shrink-0"
        >
          {saving && <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>}
          Guardar
        </button>
      </div>
      {error && (
        <p id={`${uid}-price-err`} role="alert" className="mt-1 text-[12px] text-error">
          {error}
        </p>
      )}
    </form>
  );
}

function WineForm({
  wine,
  notice,
  activateSale,
  held,
  catas,
  onClose,
  onSaved,
}: {
  wine: Wine | null;
  notice?: string;
  activateSale?: boolean;
  /** Botellas de este vino reservadas ahora por pedidos vigentes; null = no se conocen (vino nuevo o no se pudieron leer). */
  held: number | null;
  catas: CataOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [s, setS] = useState<FormState>(() => ({ ...toForm(wine), ...(activateSale ? { saleActive: true } : {}) }));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setS((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };
  const updateSpec = (k: number, patch: Partial<WineSpec>) =>
    set(
      "specs",
      s.specs.map((row) => (row._k === k ? { ...row, ...patch } : row))
    );

  const requestClose = () => {
    if (dirty && !confirm("Hay cambios sin guardar. ¿Cerrar de todos modos?")) return;
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && requestClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      // Se reduce en el navegador (lado mayor 1600 px): Vercel rechaza subidas de más de 4,5 MB.
      const image = await shrinkImage(file, 1600, 0.88);
      if (image.size > MAX_IMAGE_BYTES) throw new Error("La imagen supera los 6 MB. Redúzcala e intente de nuevo.");
      const form = new FormData();
      form.append("file", image, image === file ? file.name : "botella.jpg");
      form.append("folder", "vinos");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || "No se pudo subir la imagen.");
      set("imageUrl", data.url);
    } catch (err) {
      setError((err as Error).message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (s.saleActive && !hasPrice(s.priceUsd)) {
      setError("Defina el precio para activar la venta.");
      document.getElementById(id("price"))?.focus();
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...s,
        specs: s.specs.filter((row) => row.label.trim() && row.value.trim()).map(({ label, value }) => ({ label, value })),
        // El servidor interpreta el texto ("12,5" o "12.50") y valida el rango; vacío = sin precio / tope por defecto.
        priceUsd: s.priceUsd.trim(),
        maxPerOrder: s.maxPerOrder.trim(),
        // Vacío = sin control de existencias (el servidor lo guarda como null y valida el entero).
        stock: s.stock.trim(),
      };
      const res = await fetch(wine ? `/api/admin/wines/${wine.id}` : "/api/admin/wines", {
        method: wine ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSaved(wine ? "Vino actualizado." : s.status === "published" ? "Vino publicado." : "Vino guardado como borrador.");
    } catch (err) {
      setError((err as Error).message || "No se pudo guardar el vino.");
    } finally {
      setSaving(false);
    }
  };

  /** Existencias escritas en el campo (null si está vacío o no es un entero), para mostrar cuántas quedarían disponibles. */
  const stockNum = /^\d+$/.test(s.stock.trim()) ? Number(s.stock.trim()) : null;

  const missingSuggestions = SPEC_SUGGESTIONS.filter((label) => !s.specs.some((row) => row.label.trim().toLowerCase() === label.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 flex items-stretch sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={id("heading")}>
      <form onSubmit={save} className="relative w-full sm:max-w-3xl bg-background sm:rounded-2xl flex flex-col max-h-[100dvh] sm:max-h-[92vh] overflow-clip">
        <header className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 sm:px-6 h-16 flex-shrink-0">
          <h2 id={id("heading")} className="font-serif text-2xl truncate">
            {wine ? "Editar vino" : "Nuevo vino"}
          </h2>
          <button type="button" onClick={requestClose} className="h-11 w-11 -mr-2 inline-flex items-center justify-center rounded text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
            <span className="sr-only">Cerrar</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-8">
          {notice && !error && (
            <div role="status" className="rounded-lg border border-tertiary/40 bg-tertiary-fixed/60 p-3 text-[14px] text-on-tertiary-fixed-variant">
              {notice}
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-lg border border-error/40 bg-error-container/60 p-3 text-[14px] text-on-error-container">
              {error}
            </div>
          )}

          {/* Foto y datos */}
          <section className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] gap-5">
            <div>
              <span className={labelCls}>Foto de la botella</span>
              <label className="relative block aspect-[3/4] rounded-lg bg-ink overflow-hidden cursor-pointer border border-outline-variant hover:border-primary-container">
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt="" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-paper/60 text-[13px] text-center px-3">
                    <span className="material-symbols-outlined text-3xl" aria-hidden="true">add_photo_alternate</span>
                    Subir foto
                  </span>
                )}
                {uploading && (
                  <span className="absolute inset-0 bg-ink/60 flex items-center justify-center text-paper">
                    <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
                  </span>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
              </label>
              <p className={hintCls}>Vertical, con la botella centrada sobre fondo oscuro o liso.</p>
              {s.imageUrl && (
                <button type="button" onClick={() => set("imageUrl", "")} className="mt-1 text-[12px] font-semibold text-on-surface-variant hover:text-error">
                  Quitar foto
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor={id("name")} className={labelCls}>Nombre *</label>
                <input id={id("name")} required minLength={2} maxLength={140} value={s.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej.: Joven Roble" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={id("winery")} className={labelCls}>Bodega o productor</label>
                  <input id={id("winery")} maxLength={140} value={s.winery} onChange={(e) => set("winery", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label htmlFor={id("region")} className={labelCls}>Origen (país, región o D.O.)</label>
                  <input id={id("region")} maxLength={140} value={s.region} onChange={(e) => set("region", e.target.value)} placeholder="Ej.: Ribera del Duero, España" className={inputCls} />
                </div>
                <div>
                  <label htmlFor={id("type")} className={labelCls}>Tipo</label>
                  <select id={id("type")} value={s.type} onChange={(e) => set("type", e.target.value as WineType)} className={inputCls}>
                    {WINE_TYPES.map((t) => (
                      <option key={t} value={t}>{WINE_TYPE_LABEL.es[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={id("vintage")} className={labelCls}>Añada</label>
                  <input id={id("vintage")} maxLength={20} inputMode="numeric" value={s.vintage} onChange={(e) => set("vintage", e.target.value)} placeholder="Ej.: 2021" className={inputCls} />
                </div>
              </div>
              <div>
                <label htmlFor={id("grapes")} className={labelCls}>Uva o variedad</label>
                <input id={id("grapes")} maxLength={200} value={s.grapes} onChange={(e) => set("grapes", e.target.value)} placeholder="Ej.: Tempranillo" className={inputCls} />
              </div>
            </div>
          </section>

          <section>
            <label htmlFor={id("description")} className={labelCls}>Descripción</label>
            <textarea id={id("description")} rows={4} maxLength={4000} value={s.description} onChange={(e) => set("description", e.target.value)} className={textareaCls} />
          </section>

          {/* Ficha técnica */}
          <section className="space-y-3">
            <div>
              <h3 className="font-serif text-xl">Ficha técnica</h3>
              <p className={hintCls}>Cada fila es un dato (por ejemplo «Crianza» → «5 meses en barrica de roble francés»). Las filas vacías no se guardan.</p>
            </div>
            {s.specs.map((row) => (
              <div key={row._k} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-2">
                  <input aria-label="Dato" maxLength={60} value={row.label} onChange={(e) => updateSpec(row._k, { label: e.target.value })} placeholder="Dato" className={inputCls} />
                  <textarea aria-label="Detalle" rows={2} maxLength={600} value={row.value} onChange={(e) => updateSpec(row._k, { value: e.target.value })} placeholder="Detalle" className={textareaCls} />
                </div>
                <button
                  type="button"
                  onClick={() => set("specs", s.specs.filter((r) => r._k !== row._k))}
                  className="h-11 w-11 flex-shrink-0 inline-flex items-center justify-center rounded text-on-surface-variant hover:text-error"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                  <span className="sr-only">Quitar {row.label || "fila"}</span>
                </button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => set("specs", [...s.specs, specRow()])} className={actionBtn}>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                Agregar fila
              </button>
              {missingSuggestions.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set("specs", [...s.specs, specRow(label)])}
                  className="h-10 px-3 rounded-full border border-dashed border-outline-variant text-[12px] font-semibold text-on-surface-variant hover:border-primary-container hover:text-primary-container"
                >
                  + {label}
                </button>
              ))}
            </div>
          </section>

          {/* Catas */}
          <section className="space-y-3">
            <div>
              <h3 className="font-serif text-xl">Catas en que se degustó</h3>
              <p className={hintCls}>Se muestran en la ficha del vino (solo las catas publicadas).</p>
            </div>
            {catas.length === 0 ? (
              <p className="text-[14px] text-on-surface-variant">Aún no hay catas creadas.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-outline-variant divide-y divide-outline-variant">
                {catas.map((c) => {
                  const checked = s.tastingIds.includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-3 min-h-11 px-3 py-2 cursor-pointer hover:bg-surface-container-low">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => set("tastingIds", e.target.checked ? [...s.tastingIds, c.id] : s.tastingIds.filter((x) => x !== c.id))}
                        className="accent-[#7D2A46]"
                      />
                      <span className="text-[14px] min-w-0">
                        {c.title} <span className="text-on-surface-variant">· {c.dateDisplay}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {/* Venta */}
          <section className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-low/50 p-4 sm:p-5">
            <div>
              <h3 className="font-serif text-xl">Venta</h3>
              <p className={hintCls}>
                Un vino activo para la venta muestra su precio y el botón «Comprar» en el sitio. Es un interruptor aparte del estado
                Borrador/Publicado: para que se pueda comprar debe estar publicado, activo y con precio.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={id("price")} className={labelCls}>Precio por botella (USD)</label>
                <input
                  id={id("price")}
                  inputMode="decimal"
                  maxLength={12}
                  value={s.priceUsd}
                  onChange={(e) => set("priceUsd", e.target.value)}
                  placeholder="Ej.: 18,50"
                  aria-describedby={id("price-hint")}
                  className={inputCls}
                />
                <p id={id("price-hint")} className={hintCls}>Escriba el precio con coma o punto. Déjelo vacío si no se vende.</p>
              </div>
              <div>
                <label htmlFor={id("max")} className={labelCls}>Máximo por pedido</label>
                <input
                  id={id("max")}
                  type="number"
                  min={1}
                  max={WINE_MAX_PER_ORDER_LIMIT}
                  step={1}
                  value={s.maxPerOrder}
                  onChange={(e) => set("maxPerOrder", e.target.value)}
                  placeholder="Máximo general"
                  aria-describedby={id("max-hint")}
                  className={inputCls}
                />
                <p id={id("max-hint")} className={hintCls}>
                  Botellas de este vino en un mismo pedido (de 1 a {WINE_MAX_PER_ORDER_LIMIT}). Vacío: el máximo general de{" "}
                  <a href="/admin/tienda" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-container hover:underline">Tienda de vinos</a>.
                </p>
              </div>
              <div>
                <label htmlFor={id("stock")} className={labelCls}>Existencias (opcional)</label>
                <input
                  id={id("stock")}
                  type="number"
                  min={0}
                  max={STOCK_MAX}
                  step={1}
                  value={s.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  placeholder="Sin control"
                  aria-describedby={id("stock-hint")}
                  className={inputCls}
                />
                <p id={id("stock-hint")} className={hintCls}>
                  Botellas que pone a la venta en total. Cuando los pedidos las reservan todas, el vino aparece como agotado. Para reponer,
                  suba el número. Déjelo vacío para no controlar las existencias.
                  {stockNum !== null && held !== null && (
                    <span className="block mt-0.5 font-semibold text-on-surface">
                      Reservadas ahora: {held} · Disponibles con este número: {availableOf(stockNum, held)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div>
              <label className="flex items-start gap-3 min-h-11 cursor-pointer text-[14px]">
                <input
                  type="checkbox"
                  checked={s.saleActive}
                  onChange={(e) => set("saleActive", e.target.checked)}
                  className="accent-[#7D2A46] w-4 h-4 mt-1"
                />
                <span>
                  <span className="block font-semibold">Activo para la venta</span>
                  <span className="block text-[12px] text-on-surface-variant">
                    Si define las existencias, el vino se marca como agotado solo; si no, apáguelo cuando se agote.
                  </span>
                </span>
              </label>
              {s.saleActive && !hasPrice(s.priceUsd) && (
                <p role="status" className="mt-1 text-[12px] font-semibold text-error">
                  Defina el precio para activar la venta.
                </p>
              )}
              {s.saleActive && s.status === "draft" && hasPrice(s.priceUsd) && (
                <p role="status" className="mt-1 text-[12px] text-on-tertiary-fixed-variant">
                  Está en Borrador: no se mostrará ni se podrá comprar hasta que lo publique.
                </p>
              )}
            </div>
          </section>

          {/* Estado */}
          <fieldset>
            <legend className={labelCls}>Estado</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  ["draft", "Borrador", "No se muestra en el sitio."],
                  ["published", "Publicado", "Se ve en /vinos y en la portada."],
                ] as const
              ).map(([value, label, hint]) => (
                <label key={value} className={`flex items-start gap-2 min-h-11 p-3 rounded border cursor-pointer ${s.status === value ? "border-primary-container bg-primary-fixed/50" : "border-outline-variant"}`}>
                  <input type="radio" name={id("status")} checked={s.status === value} onChange={() => set("status", value)} className="accent-[#7D2A46] mt-0.5" />
                  <span>
                    <span className="block text-[14px] font-semibold">{label}</span>
                    <span className="block text-[12px] text-on-surface-variant">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-outline-variant px-5 sm:px-6 py-3 flex-shrink-0 bg-background">
          <button type="button" onClick={requestClose} className="h-11 px-4 rounded text-[14px] font-semibold">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="h-11 px-5 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold disabled:opacity-60 inline-flex items-center gap-2"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>}
            {wine ? "Guardar cambios" : "Guardar vino"}
          </button>
        </footer>
      </form>
    </div>
  );
}
