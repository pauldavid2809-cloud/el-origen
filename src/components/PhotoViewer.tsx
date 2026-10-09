"use client";

import React, { useCallback, useEffect, useRef } from "react";

export interface ViewerPhoto {
  src: string;
  alt: string;
  /** Texto bajo la foto (opcional). */
  caption?: string;
}

export interface PhotoViewerLabels {
  viewer: string;
  close: string;
  previous: string;
  next: string;
  position: (i: number, total: number) => string;
  /** Si se indica, muestra el botón de descarga con este texto. */
  download?: string;
}

interface PhotoViewerProps {
  photos: ViewerPhoto[];
  /** Foto abierta; `null` con el visor cerrado. */
  index: number | null;
  onChange: (index: number | null) => void;
  labels: PhotoViewerLabels;
}

/* Visor de fotos a pantalla completa: Esc cierra, las flechas cambian de foto y al cerrar
   el foco vuelve al elemento que lo abrió. Las fotos usan <img> nativa: pueden venir de Storage o ser data URL. */
export function PhotoViewer({ photos, index, onChange, labels }: PhotoViewerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpen = index !== null;

  const close = useCallback(() => onChange(null), [onChange]);
  const step = useCallback(
    (delta: number) => {
      if (index !== null) onChange((index + delta + photos.length) % photos.length);
    },
    [index, onChange, photos.length]
  );

  useEffect(() => {
    if (!isOpen) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, step]);

  const current = index === null ? null : photos[index];
  if (!current || index === null) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={labels.viewer} onClick={close} className="fixed inset-0 z-[60] bg-black/90 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-3 sm:px-5 h-16 text-white flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <p className="text-[14px] tabular-nums">{labels.position(index + 1, photos.length)}</p>
        <div className="flex items-center gap-2">
          {labels.download && (
            <a
              href={current.src}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-4 rounded-full bg-white text-ink text-[13px] font-semibold inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
              {labels.download}
            </a>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 inline-flex items-center justify-center"
            aria-label={labels.close}
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.src} alt={current.alt} onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full object-contain rounded" />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 text-white inline-flex items-center justify-center"
              aria-label={labels.previous}
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
              aria-label={labels.next}
            >
              <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          </>
        )}
      </div>

      {current.caption && (
        <p className="px-5 pb-5 text-center text-[14px] text-white/80" onClick={(e) => e.stopPropagation()}>
          {current.caption}
        </p>
      )}
    </div>
  );
}
