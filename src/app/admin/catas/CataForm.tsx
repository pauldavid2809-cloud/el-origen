"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import type { CataInput } from "@/lib/catas";
import { TEAM, teamInitials } from "@/lib/team";
import { shrinkImage } from "@/lib/shrinkImage";
import { VENUES, getVenue, venueForLocation } from "@/lib/venues";
import type { RateCurrency, Tasting, TastingCategory, TastingStatus } from "@/types";

/* Formulario completo de una cata (crear, editar o duplicar). Envía un `CataInput` a /api/admin/catas. */

export const CATEGORY_LABEL: Record<TastingCategory, string> = {
  degustacion: "Degustación",
  reserva: "Reserva",
  atardecer: "Atardecer",
  blancos: "Blancos",
  privada: "Privada",
  icono: "Ícono",
};

export const STATUS_LABEL: Record<TastingStatus, string> = {
  draft: "Borrador",
  active: "Activa",
  sold_out: "Agotada",
  archived: "Archivada",
};

const STATUS_HINT: Partial<Record<TastingStatus, string>> = {
  draft: "No se muestra en el sitio.",
  active: "Publicada y a la venta. Se marca agotada sola al llenarse.",
  sold_out: "Publicada, sin venta (marcada a mano).",
  archived: "Oculta del sitio; conserva sus reservas.",
};

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

type Keyed<T> = T & { _k: number };

interface ProductRow {
  name: string;
  vintage: string;
  type: string;
  description: string;
  /** Aromas separados por coma. */
  aromas: string;
  /** Se conserva al editar (no se edita aquí). */
  audioStory?: string;
}

interface AddOnRow {
  id?: string;
  title: string;
  description: string;
  priceUsd: string;
}

interface FormState {
  title: string;
  subtitle: string;
  description: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  location: string;
  locationAddress: string;
  mapsUrl: string;
  priceUsd: string;
  rateCurrency: RateCurrency;
  totalSpots: string;
  imageUrl: string;
  imageAlt: string;
  category: TastingCategory;
  wines: Keyed<ProductRow>[];
  pairings: Keyed<{ text: string }>[];
  sommelierIds: string[];
  instagram: Keyed<{ handle: string; label: string }>[];
  addOns: Keyed<AddOnRow>[];
  status: TastingStatus;
}

let keySeq = 0;
const k = <T,>(v: T): Keyed<T> => ({ ...v, _k: ++keySeq });

const emptyProduct = (): Keyed<ProductRow> => k({ name: "", vintage: "", type: "", description: "", aromas: "" });
const emptyAddOn = (): Keyed<AddOnRow> => k({ title: "", description: "", priceUsd: "" });

function initialState(source: Tasting | null, duplicate: boolean): FormState {
  if (!source) {
    return {
      title: "",
      subtitle: "",
      description: "",
      date: "",
      timeStart: "19:00",
      timeEnd: "",
      location: "",
      locationAddress: "",
      mapsUrl: "",
      priceUsd: "",
      rateCurrency: "USD",
      totalSpots: "",
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
  }
  return {
    title: duplicate ? `${source.title} (copia)` : source.title,
    subtitle: source.subtitle ?? "",
    description: source.description ?? "",
    date: source.date,
    timeStart: source.timeStart,
    timeEnd: source.timeEnd ?? "",
    location: source.location,
    locationAddress: source.locationAddress ?? "",
    mapsUrl: source.mapsUrl ?? "",
    priceUsd: String(source.priceUsd ?? source.price ?? ""),
    rateCurrency: source.rateCurrency ?? "USD",
    totalSpots: String(source.totalSpots),
    imageUrl: source.imageUrl ?? "",
    imageAlt: source.imageAlt === source.title ? "" : source.imageAlt ?? "",
    category: source.category,
    wines: (source.wines ?? []).map((w) =>
      k({
        name: w.name,
        vintage: w.vintage ?? "",
        type: w.type ?? "",
        description: w.description ?? "",
        aromas: (w.aromaProfile ?? []).join(", "),
        audioStory: w.audioStory,
      })
    ),
    pairings: (source.pairings ?? []).map((text) => k({ text })),
    sommelierIds: source.sommelierIds ?? [],
    instagram: (source.instagram ?? []).map((ig) => k({ handle: ig.handle, label: ig.label ?? "" })),
    addOns: (source.addOns ?? []).map((a) =>
      k({ id: duplicate ? undefined : a.id, title: a.title, description: a.description ?? "", priceUsd: String(a.priceUsd) })
    ),
    // Una copia arranca como borrador para revisarla antes de publicar.
    status: duplicate ? "draft" : source.status,
  };
}

function toPayload(s: FormState): CataInput {
  return {
    title: s.title,
    subtitle: s.subtitle,
    description: s.description,
    date: s.date,
    timeStart: s.timeStart,
    timeEnd: s.timeEnd,
    location: s.location,
    locationAddress: s.locationAddress,
    mapsUrl: s.mapsUrl.trim(),
    // El servidor acepta coma decimal ("45,50").
    priceUsd: s.priceUsd as unknown as number,
    rateCurrency: s.rateCurrency,
    totalSpots: Number(s.totalSpots),
    imageUrl: s.imageUrl,
    imageAlt: s.imageAlt,
    category: s.category,
    wines: s.wines
      .filter((w) => [w.name, w.vintage, w.type, w.description, w.aromas].some((v) => v.trim()))
      .map((w) => ({
        name: w.name,
        vintage: w.vintage,
        type: w.type,
        description: w.description,
        aromaProfile: w.aromas.split(",").map((a) => a.trim()).filter(Boolean),
        ...(w.audioStory ? { audioStory: w.audioStory } : {}),
      })),
    pairings: s.pairings.map((p) => p.text.trim()).filter(Boolean),
    sommelierIds: s.sommelierIds,
    instagram: s.instagram.filter((ig) => ig.handle.trim()).map((ig) => ({ handle: ig.handle.trim(), label: ig.label.trim() || undefined })),
    addOns: s.addOns
      .filter((a) => a.title.trim() || a.priceUsd.trim())
      .map((a) => ({
        ...(a.id ? { id: a.id } : {}),
        title: a.title,
        description: a.description || undefined,
        priceUsd: a.priceUsd as unknown as number,
      })) as CataInput["addOns"],
    status: s.status,
  };
}

const inputCls =
  "w-full h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] focus:border-primary-container focus:outline-none";
const textareaCls =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-[14px] focus:border-primary-container focus:outline-none";
const labelCls = "block text-[13px] font-semibold mb-1.5";
const hintCls = "text-[12px] text-on-surface-variant mt-1";
const smallBtn =
  "h-11 px-3 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container";
const removeBtn = "h-11 w-11 flex-shrink-0 inline-flex items-center justify-center rounded text-on-surface-variant hover:text-error";

interface Props {
  /** Cata a editar o duplicar; null para crear. */
  source: Tasting | null;
  mode: "create" | "edit" | "duplicate";
  /** Cupos ya ocupados (para avisar si se reducen los cupos totales). */
  heldSpots?: number;
  rates: { USD: number | null; EUR: number | null };
  onClose: () => void;
  onSaved: (t: Tasting, message: string) => void;
}

export function CataForm({ source, mode, heldSpots = 0, rates, onClose, onSaved }: Props) {
  const [s, setS] = useState<FormState>(() => initialState(source, mode === "duplicate"));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setS((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const updateRow = <K extends "wines" | "pairings" | "instagram" | "addOns">(
    key: K,
    index: number,
    patch: Partial<FormState[K][number]>
  ) => {
    setS((prev) => ({ ...prev, [key]: prev[key].map((row, i) => (i === index ? { ...row, ...patch } : row)) }));
    setDirty(true);
  };
  /** Restaurante aliado: llena lugar, dirección e Instagram (su reseña sale en la página de compra). */
  const chooseVenue = (venueId: string) => {
    const next = getVenue(venueId);
    setS((prev) => {
      const before = venueForLocation(prev.location);
      if (next === before) return prev;
      const fromBefore = (value: string, field: "address" | "mapsUrl") => !value || (before ? value === before[field] : false);
      const handle = (h: string) => h.trim().replace(/^@/, "").toLowerCase();
      const instagram = prev.instagram.filter((ig) => !before || handle(ig.handle) !== handle(before.instagram));
      if (next && !instagram.some((ig) => handle(ig.handle) === handle(next.instagram))) {
        instagram.push(k({ handle: next.instagram, label: "Lugar" }));
      }
      return {
        ...prev,
        location: next ? next.name : "",
        locationAddress: fromBefore(prev.locationAddress, "address") ? next?.address ?? "" : prev.locationAddress,
        mapsUrl: fromBefore(prev.mapsUrl, "mapsUrl") ? next?.mapsUrl ?? "" : prev.mapsUrl,
        instagram,
      };
    });
    setDirty(true);
  };
  const venue = venueForLocation(s.location);

  const removeRow = (key: "wines" | "pairings" | "instagram" | "addOns", index: number) => {
    setS((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
    setDirty(true);
  };
  const moveRow = (key: "wines" | "pairings", index: number, dir: -1 | 1) => {
    setS((prev) => {
      const rows = [...prev[key]] as FormState[typeof key];
      const j = index + dir;
      if (j < 0 || j >= rows.length) return prev;
      [rows[index], rows[j]] = [rows[j], rows[index]];
      return { ...prev, [key]: rows };
    });
    setDirty(true);
  };

  const requestClose = () => {
    if (dirty && !confirm("Hay cambios sin guardar. ¿Cerrar de todos modos?")) return;
    onClose();
  };

  useEffect(() => {
    titleRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggleSommelier = (memberId: string) => {
    set("sommelierIds", s.sommelierIds.includes(memberId) ? s.sommelierIds.filter((x) => x !== memberId) : [...s.sommelierIds, memberId]);
  };

  const uploadImage = async (file: File) => {
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Formato no permitido. Use una imagen JPG, PNG o WebP.");
      return;
    }
    setUploading(true);
    try {
      // Se reduce en el navegador (lado mayor 1600 px): Vercel rechaza subidas de más de 4,5 MB.
      const image = await shrinkImage(file, 1600, 0.86);
      if (image.size > MAX_IMAGE_BYTES) {
        throw new Error("La imagen supera los 6 MB. Redúzcala (1600×1200 px es suficiente) e intente de nuevo.");
      }
      const form = new FormData();
      form.append("file", image, image === file ? file.name : "portada.jpg");
      form.append("folder", "catas");
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || (res.status === 413 ? "La imagen es demasiado pesada. Use una de menos de 4 MB." : "No se pudo subir la imagen."));
      }
      set("imageUrl", data.url);
    } catch (err) {
      setError((err as Error).message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const total = Number(s.totalSpots);
    if (mode === "edit" && heldSpots > 0 && total < heldSpots) {
      setError(`Esta cata ya tiene ${heldSpots} cupos ocupados: los cupos totales no pueden ser menos.`);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSaving(true);
    try {
      const editing = mode === "edit" && source;
      const res = await fetch(editing ? `/api/admin/catas/${source.id}` : "/api/admin/catas", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(s)),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDirty(false);
      const synced = Number(data.ordersUpdated) || 0;
      const updatedMessage =
        synced > 0
          ? `Cata actualizada. Se actualizaron los datos de ${synced} ${synced === 1 ? "orden" : "órdenes"}: use "Reenviar" en Reservas para avisar a los compradores.`
          : "Cata actualizada.";
      onSaved(data.tasting, editing ? updatedMessage : mode === "duplicate" ? "Copia creada como borrador." : "Cata creada.");
    } catch (err) {
      setError((err as Error).message || "No se pudo guardar la cata.");
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    } finally {
      setSaving(false);
    }
  };

  const price = Number(s.priceUsd.replace(",", "."));
  const rate = rates[s.rateCurrency];
  const heading = mode === "edit" ? "Editar cata" : mode === "duplicate" ? "Duplicar cata" : "Nueva cata";

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 flex items-stretch sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={id("heading")}>
      <form
        onSubmit={submit}
        className="relative w-full sm:max-w-3xl bg-background sm:rounded-2xl flex flex-col max-h-[100dvh] sm:max-h-[92vh] overflow-clip"
      >
        <header className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 sm:px-6 h-16 flex-shrink-0">
          <h2 id={id("heading")} className="font-serif text-2xl truncate">
            {heading}
          </h2>
          <button type="button" onClick={requestClose} className="h-11 w-11 -mr-2 inline-flex items-center justify-center rounded text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
            <span className="sr-only">Cerrar</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-8">
          {error && (
            <div ref={errorRef} role="alert" className="rounded-lg border border-error/40 bg-error-container/60 p-3 text-[14px] text-on-error-container">
              {error}
            </div>
          )}

          {/* Datos básicos */}
          <Section title="Datos de la cata">
            <div>
              <label htmlFor={id("title")} className={labelCls}>Nombre *</label>
              <input id={id("title")} ref={titleRef} required minLength={3} maxLength={140} value={s.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor={id("subtitle")} className={labelCls}>Subtítulo</label>
              <input id={id("subtitle")} maxLength={200} value={s.subtitle} onChange={(e) => set("subtitle", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor={id("description")} className={labelCls}>Descripción</label>
              <textarea id={id("description")} rows={4} maxLength={4000} value={s.description} onChange={(e) => set("description", e.target.value)} className={textareaCls} />
            </div>
            <div>
              <label htmlFor={id("category")} className={labelCls}>Categoría</label>
              <select id={id("category")} value={s.category} onChange={(e) => set("category", e.target.value as TastingCategory)} className={inputCls}>
                {(Object.keys(CATEGORY_LABEL) as TastingCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                ))}
              </select>
            </div>
          </Section>

          {/* Fecha y lugar */}
          <Section title="Fecha y lugar">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor={id("date")} className={labelCls}>Fecha *</label>
                <input id={id("date")} type="date" required value={s.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor={id("timeStart")} className={labelCls}>Hora de inicio *</label>
                <input id={id("timeStart")} type="time" required value={s.timeStart} onChange={(e) => set("timeStart", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor={id("timeEnd")} className={labelCls}>Hora de cierre</label>
                <input id={id("timeEnd")} type="time" value={s.timeEnd} onChange={(e) => set("timeEnd", e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor={id("venue")} className={labelCls}>Restaurante aliado</label>
              <select id={id("venue")} value={venue?.id ?? ""} onChange={(e) => chooseVenue(e.target.value)} className={inputCls}>
                <option value="">Otro lugar (escríbalo abajo)</option>
                {VENUES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <p className={hintCls}>
                {venue
                  ? `La reseña de ${venue.name} aparece en la página de compra, junto al sommelier.`
                  : "Al elegir un aliado se llenan el lugar, la dirección y su Instagram, y su reseña aparece en la página de compra."}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={id("location")} className={labelCls}>Lugar *</label>
                <input id={id("location")} required maxLength={160} value={s.location} onChange={(e) => set("location", e.target.value)} placeholder="Nombre del restaurante o espacio" className={inputCls} />
              </div>
              <div>
                <label htmlFor={id("address")} className={labelCls}>Dirección</label>
                <input id={id("address")} maxLength={240} value={s.locationAddress} onChange={(e) => set("locationAddress", e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor={id("maps")} className={labelCls}>Enlace de Google Maps (GPS)</label>
              <input id={id("maps")} type="url" inputMode="url" value={s.mapsUrl} onChange={(e) => set("mapsUrl", e.target.value)} placeholder="https://maps.app.goo.gl/…" className={inputCls} />
              <p className={hintCls}>En Google Maps: Compartir → Copiar enlace.</p>
            </div>
          </Section>

          {/* Precio, cupos y estado */}
          <Section title="Precio, cupos y estado">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={id("price")} className={labelCls}>Precio por cupo (USD) *</label>
                <input id={id("price")} required inputMode="decimal" value={s.priceUsd} onChange={(e) => set("priceUsd", e.target.value)} placeholder="55" className={inputCls} />
              </div>
              <div>
                <label htmlFor={id("spots")} className={labelCls}>Cupos totales *</label>
                <input id={id("spots")} type="number" required min={Math.max(1, heldSpots)} max={1000} value={s.totalSpots} onChange={(e) => set("totalSpots", e.target.value)} className={inputCls} />
                {mode === "edit" && heldSpots > 0 && <p className={hintCls}>{heldSpots} ya ocupados (no puede ser menos).</p>}
              </div>
            </div>
            <fieldset>
              <legend className={labelCls}>Tasa BCV para el monto en bolívares</legend>
              <div className="flex gap-2">
                {(["USD", "EUR"] as RateCurrency[]).map((c) => (
                  <label key={c} className={`flex-1 sm:flex-none flex items-center gap-2 min-h-11 px-4 rounded border cursor-pointer text-[14px] ${s.rateCurrency === c ? "border-primary-container bg-primary-fixed/50" : "border-outline-variant"}`}>
                    <input type="radio" name={id("rate")} checked={s.rateCurrency === c} onChange={() => set("rateCurrency", c)} className="accent-[#7D2A46]" />
                    {c === "USD" ? "Dólar (USD)" : "Euro (EUR)"}
                  </label>
                ))}
              </div>
              <p className={hintCls}>
                {rate
                  ? `Tasa BCV ${s.rateCurrency} de hoy: Bs ${rate.toLocaleString("es-VE", { maximumFractionDigits: 4 })}${
                      price > 0 ? ` → ${s.priceUsd} = Bs ${(price * rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""
                    }`
                  : "La tasa del día se calcula automáticamente al reservar."}
              </p>
            </fieldset>
            <fieldset>
              <legend className={labelCls}>Estado</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(["draft", "active", "archived", ...(source?.status === "sold_out" && mode === "edit" ? (["sold_out"] as const) : [])] as TastingStatus[]).map((st) => (
                  <label key={st} className={`flex items-start gap-2 min-h-11 p-3 rounded border cursor-pointer ${s.status === st ? "border-primary-container bg-primary-fixed/50" : "border-outline-variant"}`}>
                    <input type="radio" name={id("status")} checked={s.status === st} onChange={() => set("status", st)} className="accent-[#7D2A46] mt-0.5" />
                    <span>
                      <span className="block text-[14px] font-semibold">{STATUS_LABEL[st]}</span>
                      <span className="block text-[12px] text-on-surface-variant">{STATUS_HINT[st]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Section>

          {/* Imagen */}
          <Section title="Imagen">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
              <div className="relative aspect-[4/3] rounded-lg border border-outline-variant bg-surface-container overflow-hidden">
                {s.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.imageUrl} alt={s.imageAlt || "Vista previa"} className="absolute inset-0 w-full h-full object-cover" />
                    {/* Zona segura: lo que queda visible en los recortes de tarjetas y redes. */}
                    <span className="absolute inset-[12%_18%] border border-dashed border-white/80 rounded pointer-events-none" aria-hidden="true" />
                  </>
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-on-surface-variant text-[13px]">
                    <span className="material-symbols-outlined text-3xl" aria-hidden="true">image</span>
                    Sin imagen
                  </span>
                )}
                {uploading && (
                  <span className="absolute inset-0 bg-ink/40 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
                    <span className="sr-only">Subiendo…</span>
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <p className="text-[13px] text-on-surface-variant">
                  Recomendado: <strong className="text-on-surface">1600×1200 px, 4:3, lo importante al centro</strong>. JPG, PNG o WebP; si es muy grande se reduce sola al subirla.
                </p>
                {/* relative: el input oculto queda dentro de la zona con scroll. Si su bloque contenedor fuera el
                    form, al enfocarlo el navegador desplazaba el form y el diálogo quedaba en blanco. */}
                <div className="relative flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    id={id("file")}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
                  />
                  <label htmlFor={id("file")} className={`${smallBtn} cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">upload</span>
                    {s.imageUrl ? "Cambiar imagen" : "Subir imagen"}
                  </label>
                  {s.imageUrl && (
                    <button type="button" onClick={() => set("imageUrl", "")} className={`${smallBtn} hover:text-error`}>
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                      Quitar
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor={id("alt")} className={labelCls}>Descripción de la imagen</label>
                  <input id={id("alt")} maxLength={200} value={s.imageAlt} onChange={(e) => set("imageAlt", e.target.value)} placeholder="Qué se ve en la foto (accesibilidad)" className={inputCls} />
                </div>
              </div>
            </div>
          </Section>

          {/* Productos */}
          <Section title="Productos a degustar" hint="Vinos, destilados u otros productos, en el orden en que se sirven.">
            {s.wines.map((w, i) => (
              <div key={w._k} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant">Producto {i + 1}</span>
                  <span className="flex">
                    <button type="button" onClick={() => moveRow("wines", i, -1)} disabled={i === 0} className={`${removeBtn} disabled:opacity-30`}>
                      <span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
                      <span className="sr-only">Subir</span>
                    </button>
                    <button type="button" onClick={() => moveRow("wines", i, 1)} disabled={i === s.wines.length - 1} className={`${removeBtn} disabled:opacity-30`}>
                      <span className="material-symbols-outlined" aria-hidden="true">arrow_downward</span>
                      <span className="sr-only">Bajar</span>
                    </button>
                    <button type="button" onClick={() => removeRow("wines", i)} className={removeBtn}>
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                      <span className="sr-only">Quitar producto {i + 1}</span>
                    </button>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                  <div>
                    <label htmlFor={id(`w${w._k}-name`)} className={labelCls}>Nombre *</label>
                    <input id={id(`w${w._k}-name`)} maxLength={120} value={w.name} onChange={(e) => updateRow("wines", i, { name: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={id(`w${w._k}-vintage`)} className={labelCls}>Añada</label>
                    <input id={id(`w${w._k}-vintage`)} maxLength={20} value={w.vintage} onChange={(e) => updateRow("wines", i, { vintage: e.target.value })} placeholder="2019" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor={id(`w${w._k}-type`)} className={labelCls}>Tipo / origen</label>
                  <input id={id(`w${w._k}-type`)} maxLength={80} value={w.type} onChange={(e) => updateRow("wines", i, { type: e.target.value })} placeholder="Tempranillo · Ribera del Duero" className={inputCls} />
                </div>
                <div>
                  <label htmlFor={id(`w${w._k}-desc`)} className={labelCls}>Descripción</label>
                  <textarea id={id(`w${w._k}-desc`)} rows={2} maxLength={600} value={w.description} onChange={(e) => updateRow("wines", i, { description: e.target.value })} className={textareaCls} />
                </div>
                <div>
                  <label htmlFor={id(`w${w._k}-aromas`)} className={labelCls}>Aromas</label>
                  <input id={id(`w${w._k}-aromas`)} value={w.aromas} onChange={(e) => updateRow("wines", i, { aromas: e.target.value })} placeholder="Cereza, vainilla, cedro" className={inputCls} />
                  <p className={hintCls}>Separados por coma.</p>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => set("wines", [...s.wines, emptyProduct()])} className={smallBtn}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Agregar producto
            </button>
          </Section>

          {/* Armonías */}
          <Section title="Armonías / menú">
            {s.pairings.map((p, i) => (
              <div key={p._k} className="flex gap-1">
                <label htmlFor={id(`p${p._k}`)} className="sr-only">Armonía {i + 1}</label>
                <input id={id(`p${p._k}`)} maxLength={200} value={p.text} onChange={(e) => updateRow("pairings", i, { text: e.target.value })} placeholder="Tabla de quesos madurados" className={inputCls} />
                <button type="button" onClick={() => moveRow("pairings", i, -1)} disabled={i === 0} className={`${removeBtn} disabled:opacity-30 hidden sm:inline-flex`}>
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
                  <span className="sr-only">Subir</span>
                </button>
                <button type="button" onClick={() => removeRow("pairings", i)} className={removeBtn}>
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                  <span className="sr-only">Quitar armonía {i + 1}</span>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => set("pairings", [...s.pairings, k({ text: "" })])} className={smallBtn}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Agregar armonía
            </button>
          </Section>

          {/* Sommeliers */}
          <Section title="Sommeliers" hint="El primero seleccionado aparece como sommelier principal.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEAM.map((m) => {
                const pos = s.sommelierIds.indexOf(m.id);
                const checked = pos >= 0;
                return (
                  <label key={m.id} className={`flex items-center gap-3 min-h-[56px] px-3 rounded border cursor-pointer ${checked ? "border-primary-container bg-primary-fixed/50" : "border-outline-variant"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleSommelier(m.id)} className="accent-[#7D2A46] w-4 h-4" />
                    {m.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photoUrl} alt="" className="w-9 h-9 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="w-9 h-9 flex-shrink-0 rounded-full bg-primary-container text-white text-[12px] font-semibold flex items-center justify-center" aria-hidden="true">
                        {teamInitials(m.name)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold">{m.name}</span>
                      <span className="block text-[12px] text-on-surface-variant truncate">{m.role.es}</span>
                    </span>
                    {pos === 0 && <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-primary-container">Principal</span>}
                  </label>
                );
              })}
            </div>
          </Section>

          {/* Instagram */}
          <Section title="Instagram" hint="Usuarios a mencionar en la cata: sommelier, restaurante, marcas aliadas.">
            {s.instagram.map((ig, i) => (
              <div key={ig._k} className="flex gap-1 items-end">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                  <div>
                    <label htmlFor={id(`ig${ig._k}-h`)} className="sr-only">Usuario de Instagram {i + 1}</label>
                    <input id={id(`ig${ig._k}-h`)} maxLength={200} value={ig.handle} onChange={(e) => updateRow("instagram", i, { handle: e.target.value })} placeholder="@usuario o enlace" autoCapitalize="none" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={id(`ig${ig._k}-l`)} className="sr-only">Etiqueta {i + 1}</label>
                    <input id={id(`ig${ig._k}-l`)} maxLength={60} value={ig.label} onChange={(e) => updateRow("instagram", i, { label: e.target.value })} placeholder="Etiqueta (ej.: Restaurante)" className={inputCls} />
                  </div>
                </div>
                <button type="button" onClick={() => removeRow("instagram", i)} className={removeBtn}>
                  <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                  <span className="sr-only">Quitar usuario {i + 1}</span>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => set("instagram", [...s.instagram, k({ handle: "", label: "" })])} className={smallBtn}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Agregar usuario
            </button>
          </Section>

          {/* Adicionales */}
          <Section title="Adicionales (Oferta Exclusiva de Reserva)" hint="Botellas o productos a precio preferencial; solo se pueden agregar al reservar.">
            {s.addOns.map((a, i) => (
              <div key={a._k} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant">Adicional {i + 1}</span>
                  <button type="button" onClick={() => removeRow("addOns", i)} className={removeBtn}>
                    <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    <span className="sr-only">Quitar adicional {i + 1}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                  <div>
                    <label htmlFor={id(`a${a._k}-t`)} className={labelCls}>Título *</label>
                    <input id={id(`a${a._k}-t`)} maxLength={120} value={a.title} onChange={(e) => updateRow("addOns", i, { title: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor={id(`a${a._k}-p`)} className={labelCls}>Precio (USD) *</label>
                    <input id={id(`a${a._k}-p`)} inputMode="decimal" value={a.priceUsd} onChange={(e) => updateRow("addOns", i, { priceUsd: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor={id(`a${a._k}-d`)} className={labelCls}>Descripción</label>
                  <input id={id(`a${a._k}-d`)} maxLength={300} value={a.description} onChange={(e) => updateRow("addOns", i, { description: e.target.value })} className={inputCls} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => set("addOns", [...s.addOns, emptyAddOn()])} className={smallBtn}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Agregar adicional
            </button>
          </Section>
        </div>

        <footer className="flex-shrink-0 flex items-center justify-end gap-2 border-t border-outline-variant bg-surface-container-low px-5 sm:px-6 py-3">
          <button type="button" onClick={requestClose} className="h-11 px-4 rounded text-[14px] font-semibold">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="h-11 px-5 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>}
            {mode === "edit" ? "Guardar cambios" : "Crear cata"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-serif text-lg">{title}</h3>
        {hint && <p className="text-[13px] text-on-surface-variant mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
