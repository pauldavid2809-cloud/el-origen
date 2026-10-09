"use client";

import React, { useCallback, useEffect, useId, useState } from "react";
import { shrinkImage } from "@/lib/shrinkImage";
import { WINE_TYPES, type Tasting, type Wine, type WineSpec, type WineStatus, type WineType } from "@/types";
import { WINE_TYPE_LABEL } from "@/app/vinos/copy";

/* Vinos: catálogo de los productos degustados en las catas. Se publican en /vinos con su ficha técnica. */

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
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
  const [catas, setCatas] = useState<CataOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ wine: Wine | null } | null>(null);
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

  const published = wines.filter((w) => w.status === "published").length;

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
            y en la portada. {wines.length > 0 && `${published} de ${wines.length} publicados.`}
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
          {wines.map((w) => (
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
              </div>
              <div className="flex flex-wrap gap-2 border-t border-outline-variant bg-surface-container-low/60 px-4 py-3">
                <button type="button" disabled={busy === w.id} onClick={() => setEditing({ wine: w })} className={actionBtn}>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                  Editar
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
          ))}
        </ul>
      )}

      {editing && (
        <WineForm
          wine={editing.wine}
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

function WineForm({
  wine,
  catas,
  onClose,
  onSaved,
}: {
  wine: Wine | null;
  catas: CataOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [s, setS] = useState<FormState>(() => toForm(wine));
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
    setSaving(true);
    try {
      const payload = {
        ...s,
        specs: s.specs.filter((row) => row.label.trim() && row.value.trim()).map(({ label, value }) => ({ label, value })),
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
