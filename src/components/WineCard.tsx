import React from "react";
import Link from "next/link";
import type { Language } from "@/lib/i18n";
import type { Wine } from "@/types";
import { WINE_TYPE_LABEL, WINES_COPY } from "@/app/vinos/copy";

/** Datos públicos de un vino para tarjetas y listados. */
export type PublicWine = Pick<Wine, "id" | "slug" | "name" | "winery" | "region" | "type" | "vintage" | "imageUrl">;

/* Tarjeta de vino: la botella sobre fondo oscuro (como una foto de bodega) y su nombre debajo. */
export function WineCard({ wine, lang }: { wine: PublicWine; lang: Language }) {
  const t = WINES_COPY[lang];
  return (
    <Link href={`/vinos/${wine.slug}`} aria-label={t.open(wine.name)} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink">
        {wine.imageUrl ? (
          // Las fotos vienen de Supabase Storage (o data URL en pruebas locales): <img> nativa con carga diferida.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={wine.imageUrl}
            alt={t.imageAlt(wine.name)}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-paper/25" aria-hidden="true">
            <span className="material-symbols-outlined text-6xl">wine_bar</span>
          </span>
        )}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">
        {[WINE_TYPE_LABEL[lang][wine.type], wine.vintage].filter(Boolean).join(" · ")}
      </p>
      <h3 className="mt-1 font-serif text-xl leading-snug text-on-surface transition-colors group-hover:text-primary-container">{wine.name}</h3>
      {(wine.winery || wine.region) && (
        <p className="mt-0.5 text-[14px] text-on-surface-variant">{[wine.winery, wine.region].filter(Boolean).join(" · ")}</p>
      )}
    </Link>
  );
}
