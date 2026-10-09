import React from "react";
import Link from "next/link";
import type { Language } from "@/lib/i18n";
import { SectionHeading } from "@/components/Brand";
import { WineCard, type PublicWine } from "@/components/WineCard";
import { WINES_COPY } from "@/app/vinos/copy";

/* Portada: "Nuestros vinos" en una fila deslizable (como el catálogo de una bodega) con enlace a /vinos. */
export function WinesShowcase({ wines, lang, index }: { wines: PublicWine[]; lang: Language; index?: string }) {
  const t = WINES_COPY[lang];
  return (
    <section id="vinos" className="scroll-mt-24 py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10 sm:mb-12">
        <SectionHeading index={index} eyebrow={t.eyebrow} title={t.showcaseTitle} subtitle={t.showcaseSubtitle} />
        <Link
          href="/vinos"
          className="group inline-flex items-center gap-2 min-h-[44px] text-[13px] font-semibold uppercase tracking-[0.16em] text-on-surface hover:text-primary-container whitespace-nowrap"
        >
          {t.viewAll}
          <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
      </div>

      <ul className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0 pb-4">
        {wines.map((wine) => (
          <li key={wine.id} className="snap-start flex-shrink-0 w-[72%] sm:w-[40%] lg:w-[calc((100%-4.5rem)/4)]">
            <WineCard wine={wine} lang={lang} />
          </li>
        ))}
      </ul>
      <div className="mt-4 h-px bg-on-surface/70" aria-hidden="true" />
    </section>
  );
}
