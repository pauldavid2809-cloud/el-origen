"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { formatTastingDate } from "@/lib/dates";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { MEMORIES_COPY } from "./copy";

export interface GalleryPhoto {
  id: string;
  title: string;
  url: string;
  photographer: string;
}

interface MemoriesGalleryProps {
  /** `date`: fecha en español; `dateIso`: "YYYY-MM-DD" para mostrarla en inglés. */
  tasting: { title: string; date: string; dateIso: string; location: string } | null;
  photos: GalleryPhoto[];
}

/* Las fotos vienen de Supabase Storage (o data URL en pruebas locales): se usan <img> nativas con carga diferida. */
export function MemoriesGallery({ tasting, photos }: MemoriesGalleryProps) {
  const [lang, setLang] = useLang();
  useDocumentTitle(
    lang,
    tasting ? { es: `Recuerdos · ${tasting.title}`, en: `Memories · ${tasting.title}` } : { es: "Recuerdos", en: "Memories" }
  );
  const t = MEMORIES_COPY[lang];
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    lastTrigger.current?.focus();
  }, []);
  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  const subtitle = tasting
    ? [formatTastingDate(tasting.dateIso, lang, tasting.date), tasting.location].filter(Boolean).join(" · ")
    : t.subtitle;
  const current = open === null ? null : photos[open];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        <PageHeader eyebrow={t.eyebrow} title={tasting?.title ?? t.fallbackTitle} subtitle={subtitle}>
          {photos.length > 0 && <p className="mt-4 text-[14px] text-on-surface-variant">{t.count(photos.length)}</p>}
        </PageHeader>

        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pb-20">
          {photos.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16">
              <span className="material-symbols-outlined text-5xl text-primary-container/60" aria-hidden="true">photo_camera</span>
              <h2 className="font-serif text-2xl mt-4">{t.emptyTitle}</h2>
              <p className="mt-2 text-on-surface-variant">{t.emptyText}</p>
              <Link
                href="/catas"
                className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold"
              >
                {t.catas}
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {photos.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={(e) => {
                      lastTrigger.current = e.currentTarget;
                      setOpen(i);
                    }}
                    aria-label={p.title || t.open(i + 1)}
                    className="group block w-full aspect-square overflow-hidden rounded-xl bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.title || t.photoAlt(i + 1)}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </button>
                  {(p.title || p.photographer) && (
                    <p className="mt-1.5 text-[12px] text-on-surface-variant line-clamp-2">
                      {p.title}
                      {p.title && p.photographer ? " · " : ""}
                      {p.photographer && t.by(p.photographer)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {current && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.viewerLabel}
          onClick={close}
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col"
        >
          <div className="flex items-center justify-between gap-3 px-3 sm:px-5 h-16 text-white flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] tabular-nums">{t.position(open + 1, photos.length)}</p>
            <div className="flex items-center gap-2">
              <a
                href={current.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-4 rounded-full bg-white text-ink text-[13px] font-semibold inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
                {t.download}
              </a>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center"
                aria-label={t.close}
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.title || t.photoAlt(open + 1)}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain rounded"
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 text-white inline-flex items-center justify-center"
                  aria-label={t.previous}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 text-white inline-flex items-center justify-center"
                  aria-label={t.next}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                </button>
              </>
            )}
          </div>

          {(current.title || current.photographer) && (
            <p className="px-5 pb-5 text-center text-[14px] text-white/80" onClick={(e) => e.stopPropagation()}>
              {current.title}
              {current.title && current.photographer ? " · " : ""}
              {current.photographer && t.by(current.photographer)}
            </p>
          )}
        </div>
      )}

      <Footer currentLang={lang} />
    </div>
  );
}
