import React from "react";
import Image from "next/image";
import type { Language } from "@/lib/i18n";
import type { EventPhoto } from "@/lib/photos";

interface PhotoStripProps {
  /** Tres fotos. */
  photos: EventPhoto[];
  lang: Language;
  caption?: string;
  className?: string;
}

/* Franja de fotos reales de las catas: en móvil, la primera a lo ancho y dos debajo; desde tablet, tres en fila. */
export function PhotoStrip({ photos, lang, caption, className = "" }: PhotoStripProps) {
  return (
    <figure className={className}>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
        {photos.map((p, i) => (
          <li
            key={p.src}
            className={`relative overflow-hidden rounded-xl bg-surface-container ${
              i === 0 ? "col-span-2 sm:col-span-1 aspect-[4/3] sm:aspect-[3/4]" : "aspect-[3/4]"
            }`}
          >
            <Image
              src={p.src}
              alt={p.alt[lang]}
              fill
              sizes={`(min-width: 1320px) 400px, (min-width: 640px) 33vw, ${i === 0 ? "100vw" : "50vw"}`}
              className="object-cover"
            />
          </li>
        ))}
      </ul>
      {caption && <figcaption className="mt-4 text-[13px] sm:text-[14px] text-on-surface-variant leading-relaxed">{caption}</figcaption>}
    </figure>
  );
}
