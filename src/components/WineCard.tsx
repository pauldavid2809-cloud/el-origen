"use client";

import React from "react";
import Link from "next/link";
import type { Language } from "@/lib/i18n";
import type { PublicWine } from "@/types";
import { formatBs, formatUsd } from "@/components/PaymentDetails";
import type { BcvRates } from "@/components/TastingCard";
import { isWineForSale, round2 } from "@/lib/wineSale";
import { WINE_TYPE_LABEL, WINES_COPY } from "@/app/vinos/copy";

/** Datos públicos de un vino para tarjetas y listados (definido en @/types; se reexporta para no romper los imports). */
export type { PublicWine } from "@/types";

/* Tarjeta de vino: la botella sobre fondo oscuro (como una foto de bodega) y su nombre debajo.
   Solo los vinos a la venta (publicados, activos y con precio) muestran precio y la etiqueta «Comprar». */
export function WineCard({ wine, lang, rates }: { wine: PublicWine; lang: Language; rates?: BcvRates | null }) {
  const t = WINES_COPY[lang];
  const priceUsd = isWineForSale(wine) ? wine.priceUsd : null;
  const rate = rates?.USD ?? null;
  const priceBs = priceUsd !== null && rate ? round2(priceUsd * rate) : null;
  return (
    <Link
      href={`/vinos/${wine.slug}`}
      aria-label={priceUsd !== null ? t.openForSale(wine.name, formatUsd(priceUsd)) : t.open(wine.name)}
      className="group block"
    >
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
      {priceUsd !== null && (
        <div className="mt-3">
          <p className="font-serif text-xl leading-none text-on-surface">{formatUsd(priceUsd)}</p>
          {priceBs !== null && (
            <p className="mt-1 text-[12px] text-on-surface-variant tabular-nums" title={t.bsTitle}>
              {t.bsApprox(formatBs(priceBs, lang))}
            </p>
          )}
          {/* Etiqueta no interactiva: la tarjeta completa ya es el enlace (no se anidan botones). */}
          <span
            aria-hidden="true"
            className="mt-3 inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary-container group-hover:bg-primary text-white text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
            {t.buy}
          </span>
        </div>
      )}
    </Link>
  );
}
