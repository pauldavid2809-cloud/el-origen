"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/Brand";
import { PhotoViewer } from "@/components/PhotoViewer";
import { translations, type Language } from "@/lib/i18n";
import { HOME_GALLERY } from "@/lib/photos";

interface EventGalleryProps {
  currentLang: Language;
  /** Número de sección en la portada ("02"). */
  index?: string;
}

/* Portada: fotos reales de las catas en mosaico, como prueba de que la experiencia existe y se llena.
   Cada foto se abre en grande en el visor. */
export function EventGallery({ currentLang, index }: EventGalleryProps) {
  const t = translations[currentLang].gallery;
  const [open, setOpen] = useState<number | null>(null);
  const viewerPhotos = HOME_GALLERY.map((p) => ({ src: p.src, alt: p.alt[currentLang], caption: p.caption[currentLang] }));

  return (
    <section id="galeria" className="scroll-mt-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pb-24 sm:pb-32">
      <div className="border-t border-outline-variant pt-16 sm:pt-24">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 mb-12 sm:mb-16">
          <SectionHeading index={index} eyebrow={t.badge} title={t.title} subtitle={t.subtitle} />
          <Link
            href="/catas"
            className="group inline-flex items-center gap-2 min-h-[44px] text-[14px] font-semibold text-primary-container whitespace-nowrap"
          >
            {t.cta}
            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>

        <ul className="columns-2 lg:columns-3 gap-3 sm:gap-5">
          {HOME_GALLERY.map((p, i) => (
            <li key={p.src} className="mb-3 sm:mb-5 break-inside-avoid">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={t.open(p.alt[currentLang])}
                className="group relative block w-full overflow-hidden rounded-xl bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
              >
                <Image
                  src={p.src}
                  alt={p.alt[currentLang]}
                  width={p.width}
                  height={p.height}
                  sizes="(min-width: 1024px) 400px, 50vw"
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 sm:px-4 pt-10 pb-3 text-left text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-white">
                  {p.caption[currentLang]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <PhotoViewer
        photos={viewerPhotos}
        index={open}
        onChange={setOpen}
        labels={{ viewer: t.viewer, close: t.close, previous: t.previous, next: t.next, position: t.position }}
      />
    </section>
  );
}
