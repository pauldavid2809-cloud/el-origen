"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { PhotoViewer, type ViewerPhoto } from "@/components/PhotoViewer";
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

  const subtitle = tasting
    ? [formatTastingDate(tasting.dateIso, lang, tasting.date), tasting.location].filter(Boolean).join(" · ")
    : t.subtitle;
  const caption = (p: GalleryPhoto) => [p.title, p.photographer && t.by(p.photographer)].filter(Boolean).join(" · ");
  const viewerPhotos: ViewerPhoto[] = photos.map((p, i) => ({ src: p.url, alt: p.title || t.photoAlt(i + 1), caption: caption(p) }));

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
                    onClick={() => setOpen(i)}
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
                  {(p.title || p.photographer) && <p className="mt-1.5 text-[12px] text-on-surface-variant line-clamp-2">{caption(p)}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <PhotoViewer
        photos={viewerPhotos}
        index={open}
        onChange={setOpen}
        labels={{ viewer: t.viewerLabel, close: t.close, previous: t.previous, next: t.next, position: t.position, download: t.download }}
      />

      <Footer currentLang={lang} />
    </div>
  );
}
