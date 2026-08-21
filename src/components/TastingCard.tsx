import React from "react";
import Link from "next/link";
import { Tasting } from "@/types";
import { Language, translations } from "@/lib/i18n";

interface TastingCardProps {
  tasting: Tasting;
  currentLang?: Language;
}

export function TastingCard({ tasting, currentLang = "es" }: TastingCardProps) {
  const isSoldOut = tasting.availableSpots <= 0 || tasting.status === "sold_out";
  const t = translations[currentLang];

  const categoryLabel =
    currentLang === "en"
      ? tasting.category === "reserva"
        ? "Cellar Reserve"
        : tasting.category === "atardecer"
        ? "Sunset Experience"
        : "Tasting"
      : tasting.category === "reserva"
      ? "Reserva de Cava"
      : tasting.category === "atardecer"
      ? "Sunset Experience"
      : "Degustación";

  const spotsText =
    currentLang === "en"
      ? `${tasting.availableSpots} spots available`
      : `${tasting.availableSpots} cupos disponibles`;

  const ctaText = isSoldOut
    ? t.tastings.soldOut
    : currentLang === "en"
    ? "Book Experience"
    : "Reservar Experiencia";

  return (
    /* Outer Shell (Double-Bezel Architecture) */
    <div className="p-1.5 sm:p-2 rounded-[2rem] bg-black/[0.02] border border-black/[0.05] hover:border-primary/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover-lift">
      {/* Inner Core */}
      <article className="group bg-white rounded-[calc(2rem-0.5rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col h-full">
        {/* Top Image Container */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-container">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            style={{ backgroundImage: `url('${tasting.imageUrl}')` }}
          />
          <div className="absolute inset-0 bg-black/10" />

          {/* Eyebrow Category */}
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-semibold text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider">
              {categoryLabel}
            </span>
          </div>

          {/* Date pill */}
          <div className="absolute top-4 right-4">
            <span className="text-[11px] font-semibold text-white bg-primary-container/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
              {tasting.dateDisplay}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-7 flex flex-col flex-grow">
          <div className="mb-2">
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-on-surface tracking-tight group-hover:text-primary transition-colors duration-300">
              {tasting.title}
            </h3>
          </div>

          <p className="text-[13px] text-on-surface-variant/80 leading-relaxed mb-6 flex-grow line-clamp-2">
            {tasting.description}
          </p>

          {/* Metadata Row */}
          <div className="flex items-center justify-between text-[12px] text-on-surface-variant/70 mb-4 pb-4 border-b border-black/[0.05]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              {tasting.timeStart} – {tasting.timeEnd}
            </span>
            <span className="font-serif text-xl font-semibold text-primary">
              {tasting.priceFormatted}
            </span>
          </div>

          {/* Spots Remaining Indicator */}
          <div className="flex items-center justify-between mb-5">
            {isSoldOut ? (
              <span className="text-[11px] font-semibold text-error/80">{t.tastings.soldOut}</span>
            ) : (
              <span className="text-[11px] font-medium text-on-surface-variant/70 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse-soft" />
                {spotsText}
              </span>
            )}
          </div>

          {/* Button-in-Button Nested CTA */}
          <Link
            href={`/catas/${tasting.slug || tasting.id}`}
            className={`w-full flex items-center justify-between pl-5 pr-2 py-2 rounded-full text-[12px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isSoldOut
                ? "bg-surface-container text-on-surface-variant/40 cursor-not-allowed"
                : "bg-primary-container text-white hover:bg-primary active:scale-[0.98] shadow-sm"
            }`}
          >
            <span>{ctaText}</span>
            {!isSoldOut && (
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px]">
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </span>
            )}
          </Link>
        </div>
      </article>
    </div>
  );
}
