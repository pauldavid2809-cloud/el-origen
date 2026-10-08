"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AD_SLOTS, AD_SLOT_IDS, type AdSlot, type AdSlotId, type AdsConfig } from "@/lib/ads";
import { shrinkImage } from "@/lib/shrinkImage";

/* Espacios publicitarios de la página de inicio: imagen del anunciante, enlace y si se muestra.
   Un espacio activo sin imagen aparece en el sitio como «Anuncia aquí» con el WhatsApp de El Origen. */

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const inputCls =
  "w-full h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] focus:border-primary-container focus:outline-none";
const labelCls = "block text-[13px] font-semibold mb-1.5";
const smallBtn =
  "h-11 px-3 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container";

/** Reduce la imagen (lado mayor 2000 px), la sube a Storage y devuelve su URL y proporción. */
async function uploadAdImage(file: File): Promise<{ url: string; ratio: number | null }> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Formato no permitido. Use una imagen JPG, PNG o WebP.");
  }
  const image = await shrinkImage(file, 2000, 0.9);
  if (image.size > MAX_IMAGE_BYTES) throw new Error("La imagen supera los 6 MB. Redúzcala e intente de nuevo.");
  let ratio: number | null = null;
  try {
    const bmp = await createImageBitmap(image);
    ratio = bmp.width / bmp.height;
    bmp.close();
  } catch {
    /* sin proporción: el sitio usa el alto natural de la imagen */
  }
  const form = new FormData();
  form.append("file", image, image === file ? file.name : "anuncio.jpg");
  form.append("folder", "anuncios");
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || (res.status === 413 ? "La imagen es demasiado pesada. Use una de menos de 4 MB." : "No se pudo subir la imagen."));
  }
  return { url: data.url as string, ratio };
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdsConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/ads", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setAds(data.ads);
      setDirty(false);
    } catch (err) {
      setLoadError((err as Error).message || "No se pudo cargar la publicidad.");
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

  const updateSlot = (id: AdSlotId, patch: Partial<AdSlot>) => {
    setAds((a) => (a ? { ...a, [id]: { ...a[id], ...patch } } : a));
    setDirty(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ads) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ads),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) throw new Error(data.message);
      setAds(data.ads);
      setDirty(false);
      setToast("Publicidad guardada. Ya se ve en la página de inicio.");
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setError((err as Error).message || "No se pudo guardar la publicidad.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-4xl mx-auto space-y-6">
      {toast && (
        <div role="status" className="fixed top-5 right-5 left-5 sm:left-auto z-50 sm:max-w-sm rounded-lg px-4 py-3 text-[14px] shadow-elevated bg-ink text-paper">
          {toast}
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Publicidad</h1>
          <p className="text-[14px] text-on-surface-variant mt-1 max-w-2xl">
            Espacios para anunciantes en la página de inicio. Suba la imagen del anunciante, ponga su enlace y guarde. Un espacio activo
            sin imagen muestra <strong>«Anuncia aquí»</strong> con el botón de WhatsApp de El Origen.
          </p>
        </div>
        <Link href="/" target="_blank" className={`${smallBtn} self-start sm:self-auto flex-shrink-0`}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
          Ver la página de inicio
        </Link>
      </header>

      {loadError && (
        <div role="alert" className="rounded-lg border border-error/30 bg-error-container p-4 text-[14px] text-on-error-container flex flex-wrap items-center gap-3">
          {loadError}
          <button type="button" onClick={load} className="underline font-semibold">
            Reintentar
          </button>
        </div>
      )}

      {!ads && !loadError && (
        <div className="py-20 text-center text-on-surface-variant" role="status">
          <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
          <span className="sr-only">Cargando…</span>
        </div>
      )}

      {ads && (
        <form onSubmit={save} noValidate className="space-y-5">
          {error && (
            <div role="alert" className="rounded-lg border border-error/30 bg-error-container p-4 text-[14px] text-on-error-container">
              {error}
            </div>
          )}

          {AD_SLOT_IDS.map((slotId) => (
            <SlotCard key={slotId} slotId={slotId} slot={ads[slotId]} onChange={(patch) => updateSlot(slotId, patch)} />
          ))}

          <div className="sticky bottom-0 -mx-5 sm:mx-0 px-5 sm:px-0 py-3 bg-background/95 backdrop-blur flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant sm:border-0">
            {dirty && <span className="text-[13px] text-on-surface-variant mr-auto">Cambios sin guardar</span>}
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

function SlotCard({ slotId, slot, onChange }: { slotId: AdSlotId; slot: AdSlot; onChange: (patch: Partial<AdSlot>) => void }) {
  const info = AD_SLOTS[slotId];
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const banner = info.kind === "banner";

  const state = !slot.enabled ? "Oculto" : slot.imageUrl ? "Anuncio publicado" : "Muestra «Anuncia aquí»";
  const badge = !slot.enabled
    ? "bg-surface-container-high text-on-surface-variant"
    : slot.imageUrl
      ? "bg-emerald-100 text-emerald-900"
      : "bg-tertiary-fixed text-on-tertiary-fixed-variant";

  return (
    <section
      aria-labelledby={id("title")}
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6 space-y-4 ${slot.enabled ? "" : "opacity-80"}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={id("title")} className="font-serif text-xl">{info.name}</h2>
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge}`}>{state}</span>
          </div>
          <p className="text-[13px] text-on-surface-variant mt-0.5">{info.where}</p>
        </div>
        <label className="flex items-center gap-3 min-h-11 cursor-pointer text-[14px] font-semibold flex-shrink-0">
          <input
            type="checkbox"
            checked={slot.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="accent-[#7D2A46] w-4 h-4"
          />
          Mostrar en el sitio
        </label>
      </div>

      <ImagePicker
        id={id("img")}
        label={banner ? "Imagen (computadora y tablet)" : "Imagen"}
        size={info.size}
        url={slot.imageUrl}
        ratio={slot.imageRatio}
        cover={!banner}
        onChange={(url, ratio) => onChange({ imageUrl: url, imageRatio: ratio })}
      />

      {banner && (
        <ImagePicker
          id={id("img-m")}
          label="Imagen para teléfonos (opcional)"
          size={info.mobileSize ?? info.size}
          hint="Si no sube una, en teléfonos se usa la de arriba, más pequeña."
          url={slot.mobileImageUrl}
          ratio={slot.mobileImageRatio}
          onChange={(url, ratio) => onChange({ mobileImageUrl: url, mobileImageRatio: ratio })}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={id("adv")} className={labelCls}>Anunciante</label>
          <input
            id={id("adv")}
            value={slot.advertiser}
            maxLength={80}
            onChange={(e) => onChange({ advertiser: e.target.value })}
            placeholder="Ej.: Casa Oliveira"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor={id("link")} className={labelCls}>Enlace al hacer clic (opcional)</label>
          <input
            id={id("link")}
            type="url"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            value={slot.link}
            maxLength={500}
            onChange={(e) => onChange({ link: e.target.value })}
            placeholder="https://instagram.com/marca"
            className={inputCls}
          />
        </div>
      </div>
    </section>
  );
}

function ImagePicker({
  id,
  label,
  size,
  hint,
  url,
  ratio,
  cover,
  onChange,
}: {
  id: string;
  label: string;
  size: string;
  hint?: string;
  url: string;
  ratio: number | null;
  cover?: boolean;
  onChange: (url: string, ratio: number | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await uploadAdImage(file);
      onChange(res.url, res.ratio);
    } catch (err) {
      setError((err as Error).message || "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4 items-start">
      <div
        className={`relative rounded-lg border border-outline-variant bg-surface-container overflow-hidden ${
          cover ? "aspect-[4/3]" : url ? "" : "aspect-[4/1]"
        }`}
        style={!cover && url && ratio ? { aspectRatio: String(ratio) } : undefined}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`Vista previa: ${label}`} className={cover || ratio ? "absolute inset-0 w-full h-full object-cover" : "block w-full h-auto"} />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-on-surface-variant text-[13px] p-3 text-center">
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">image</span>
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
        <p className="text-[13px] font-semibold">{label}</p>
        <p className="text-[13px] text-on-surface-variant">
          Recomendado: <strong className="text-on-surface">{size}</strong>. JPG, PNG o WebP.{hint ? ` ${hint}` : ""}
        </p>
        <div className="relative flex flex-wrap gap-2">
          <input
            ref={fileRef}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <label htmlFor={id} className={`${smallBtn} cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">upload</span>
            {url ? "Cambiar imagen" : "Subir imagen"}
          </label>
          {url && (
            <button type="button" onClick={() => onChange("", null)} className={`${smallBtn} hover:text-error`}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
              Quitar
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-[13px] text-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
