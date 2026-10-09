"use client";

import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import type { Tasting } from "@/types";
import { shrinkImage } from "@/lib/shrinkImage";

/* Recuerdos: el admin sube las fotos de cada cata y se publican en /recuerdos/<id de la cata>. */

interface MemoryRow {
  id: string;
  tastingId: string;
  title: string;
  url: string;
  photographer: string;
  createdAt: string;
}

type CataOption = Pick<Tasting, "id" | "title" | "date" | "dateFull" | "status">;

const MAX_SIDE = 2048;
const JPEG_QUALITY = 0.85;
const ACCEPT = "image/jpeg,image/png,image/webp";

const STATUS_LABEL: Record<Tasting["status"], string> = {
  draft: "Borrador",
  active: "Activa",
  sold_out: "Agotada",
  archived: "Archivada",
};

const inputCls =
  "w-full h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] focus:border-primary-container focus:outline-none";
const labelCls = "block text-[13px] font-semibold mb-1.5";

export default function AdminRecuerdosPage() {
  const ids = useId();
  const [catas, setCatas] = useState<CataOption[]>([]);
  const [tastingId, setTastingId] = useState("");
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [loadingCatas, setLoadingCatas] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/catas", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.message);
        // Las más recientes primero: normalmente se suben fotos de la última cata realizada.
        const list: CataOption[] = (d.tastings as Tasting[])
          .map(({ id, title, date, dateFull, status }) => ({ id, title, date, dateFull, status }))
          .sort((a, b) => b.date.localeCompare(a.date));
        setCatas(list);
        const today = new Date().toISOString().slice(0, 10);
        setTastingId((list.find((c) => c.date <= today) ?? list[0])?.id ?? "");
      })
      .catch(() => setNotice({ tone: "error", text: "No se pudieron cargar las catas." }))
      .finally(() => setLoadingCatas(false));
  }, []);

  const loadMemories = useCallback(async (id: string) => {
    if (!id) {
      setMemories([]);
      return;
    }
    setLoadingPhotos(true);
    try {
      const res = await fetch(`/api/admin/memories?tastingId=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMemories(data.memories);
    } catch {
      setNotice({ tone: "error", text: "No se pudieron cargar las fotos de esta cata." });
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  useEffect(() => {
    void loadMemories(tastingId);
  }, [tastingId, loadMemories]);

  const selected = useMemo(() => catas.find((c) => c.id === tastingId), [catas, tastingId]);
  const publicPath = tastingId ? `/recuerdos/${encodeURIComponent(tastingId)}` : "";

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tastingId || files.length === 0) return;
    setNotice(null);
    setProgress({ done: 0, total: files.length });
    const failed: string[] = [];
    let uploaded = 0;
    for (const file of files) {
      try {
        const blob = await shrinkImage(file, MAX_SIDE, JPEG_QUALITY);
        const form = new FormData();
        form.append("file", blob, blob === file ? file.name : `${file.name.replace(/\.[^.]+$/, "")}.jpg`);
        form.append("tastingId", tastingId);
        form.append("title", title);
        form.append("photographer", photographer);
        const res = await fetch("/api/admin/memories", { method: "POST", body: form });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Error al subir.");
        uploaded += 1;
        setMemories((prev) => [data.memory as MemoryRow, ...prev]);
      } catch (error) {
        failed.push(`${file.name}: ${(error as Error).message}`);
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    setProgress(null);
    setFiles([]);
    setInputKey((k) => k + 1);
    if (failed.length) {
      setNotice({
        tone: "error",
        text: `${uploaded ? `Se publicaron ${uploaded} foto(s). ` : ""}No se pudieron subir: ${failed.join(" · ")}`,
      });
    } else {
      setNotice({ tone: "ok", text: `${uploaded} foto(s) publicada(s) en la galería.` });
    }
  };

  const remove = async (m: MemoryRow) => {
    if (!window.confirm(`¿Eliminar ${m.title ? `«${m.title}»` : "esta foto"} de la galería?`)) return;
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/memories?id=${encodeURIComponent(m.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message);
      setMemories((prev) => prev.filter((x) => x.id !== m.id));
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message || "No se pudo eliminar la foto." });
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotice({ tone: "error", text: "No se pudo copiar el enlace." });
    }
  };

  const busy = progress !== null;

  return (
    <div className="p-4 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="border-b border-outline-variant pb-5">
        <p className="eyebrow">Después del evento</p>
        <h1 className="font-serif text-2xl sm:text-3xl mt-1">Recuerdos</h1>
        <p className="text-[14px] text-on-surface-variant mt-1 max-w-2xl">
          Suba las fotos de cada cata. Se publican en una galería pública por cata, enlazada desde la ficha de cata en vivo de cada
          asistente.
        </p>
      </header>

      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`rounded-xl px-4 py-3 text-[14px] ${
            notice.tone === "ok" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-error-container text-on-error-container"
          }`}
        >
          {notice.text}
        </p>
      )}

      <form onSubmit={upload} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${ids}-cata`} className={labelCls}>
              Cata
            </label>
            <select
              id={`${ids}-cata`}
              value={tastingId}
              onChange={(e) => {
                setTastingId(e.target.value);
                setNotice(null);
              }}
              disabled={loadingCatas || busy || catas.length === 0}
              className={inputCls}
            >
              {loadingCatas && <option value="">Cargando catas…</option>}
              {!loadingCatas && catas.length === 0 && <option value="">Aún no hay catas creadas</option>}
              {catas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · {c.dateFull || c.date}
                  {c.status !== "active" ? ` (${STATUS_LABEL[c.status]})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${ids}-files`} className={labelCls}>
              Fotos (JPG, PNG o WebP)
            </label>
            <input
              key={inputKey}
              id={`${ids}-files`}
              type="file"
              accept={ACCEPT}
              multiple
              disabled={busy}
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-[14px] file:mr-3 file:h-11 file:px-4 file:rounded file:border-0 file:bg-primary-fixed file:text-on-primary-fixed-variant file:font-semibold"
            />
            <p className="mt-1 text-[12px] text-on-surface-variant">Puede elegir varias a la vez. Se reducen antes de subirlas.</p>
          </div>
          <div>
            <label htmlFor={`${ids}-title`} className={labelCls}>
              Descripción <span className="font-normal text-on-surface-variant">(opcional)</span>
            </label>
            <input
              id={`${ids}-title`}
              type="text"
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor={`${ids}-photographer`} className={labelCls}>
              Fotógrafo <span className="font-normal text-on-surface-variant">(opcional)</span>
            </label>
            <input
              id={`${ids}-photographer`}
              type="text"
              maxLength={120}
              value={photographer}
              onChange={(e) => setPhotographer(e.target.value)}
              disabled={busy}
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            disabled={busy || !tastingId || files.length === 0}
            className="h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[20px] ${busy ? "animate-spin" : ""}`} aria-hidden="true">
              {busy ? "progress_activity" : "upload"}
            </span>
            {progress
              ? `Subiendo ${Math.min(progress.done + 1, progress.total)} de ${progress.total}…`
              : files.length > 1
                ? `Publicar ${files.length} fotos`
                : "Publicar foto"}
          </button>
          {progress && (
            <progress
              value={progress.done}
              max={progress.total}
              className="w-full sm:w-48 h-2 accent-primary-container"
              aria-label="Progreso de la subida"
            />
          )}
        </div>
      </form>

      <section aria-labelledby={`${ids}-gallery`} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 id={`${ids}-gallery`} className="font-serif text-xl">
            {selected ? `Fotos de «${selected.title}»` : "Fotos"}
            {memories.length > 0 && <span className="text-on-surface-variant text-[15px] font-sans"> · {memories.length}</span>}
          </h2>
          {publicPath && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={publicPath}
                target="_blank"
                className="h-11 px-4 rounded border border-outline-variant inline-flex items-center gap-1.5 text-[13px] font-semibold hover:border-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
                Ver galería pública
              </Link>
              <button
                type="button"
                onClick={copyLink}
                className="h-11 px-4 rounded border border-outline-variant inline-flex items-center gap-1.5 text-[13px] font-semibold hover:border-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{copied ? "check" : "link"}</span>
                {copied ? "Enlace copiado" : "Copiar enlace"}
              </button>
            </div>
          )}
        </div>

        {loadingPhotos ? (
          <p className="py-10 text-center text-on-surface-variant" role="status">
            <span className="material-symbols-outlined animate-spin align-middle mr-2" aria-hidden="true">progress_activity</span>
            Cargando fotos…
          </p>
        ) : memories.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-outline-variant py-12 px-6 text-center text-on-surface-variant">
            {tastingId ? "Esta cata aún no tiene fotos." : "Seleccione una cata."}
          </p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {memories.map((m) => (
              <li key={m.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.title || "Foto de la cata"} loading="lazy" className="w-full aspect-square object-cover bg-surface-container" />
                <div className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 text-[12px]">
                    {m.title && <p className="font-semibold text-on-surface truncate">{m.title}</p>}
                    {m.photographer && <p className="text-on-surface-variant truncate">Foto: {m.photographer}</p>}
                    <p className="text-on-surface-variant">
                      {new Date(m.createdAt).toLocaleDateString("es-VE", { timeZone: "America/Caracas" })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(m)}
                    className="h-11 w-11 -mr-1 -mt-1 flex-shrink-0 rounded-full inline-flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container"
                    aria-label={`Eliminar ${m.title || "foto"}`}
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
