import React from "react";
import Link from "next/link";
import { Tasting } from "@/types";

interface TastingCardProps {
  tasting: Tasting;
}

export function TastingCard({ tasting }: TastingCardProps) {
  const isSoldOut = tasting.availableSpots <= 0 || tasting.status === "sold_out";

  return (
    <article className="group bg-white rounded-2xl overflow-hidden hover-lift soft-shadow hover:soft-shadow-hover flex flex-col">
      {/* Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
          style={{ backgroundImage: `url('${tasting.imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-[#1a1a1a]/10" />

        {/* Floating date pill */}
        <div className="absolute top-4 right-4">
          <span className="text-[11px] font-semibold text-white bg-primary-container/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {tasting.dateDisplay}
          </span>
        </div>

        {/* Category eyebrow */}
        <div className="absolute bottom-4 left-4">
          <span className="text-[10px] font-semibold text-white/90 tracking-wider uppercase">
            {tasting.category === "reserva"
              ? "Reserva de Cava"
              : tasting.category === "atardecer"
              ? "Sunset Experience"
              : "Degustación"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <h3 className="font-serif text-xl font-semibold text-on-surface tracking-tight mb-2 group-hover:text-primary transition-colors duration-300">
          {tasting.title}
        </h3>

        <p className="text-[13px] text-on-surface-variant/80 leading-relaxed mb-5 flex-grow line-clamp-2">
          {tasting.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center justify-between text-[12px] text-on-surface-variant/70 mb-4 pb-4 border-b border-outline-variant/30">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">schedule</span>
            {tasting.timeStart} – {tasting.timeEnd}
          </span>
          <span className="font-serif text-lg font-semibold text-primary">
            {tasting.priceFormatted}
          </span>
        </div>

        {/* Spots */}
        <div className="flex items-center justify-between mb-4">
          {isSoldOut ? (
            <span className="text-[11px] font-semibold text-error/80">Sin disponibilidad</span>
          ) : (
            <span className="text-[11px] font-medium text-on-surface-variant/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
              {tasting.availableSpots} cupos restantes
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/catas/${tasting.slug || tasting.id}`}
          className={`w-full flex items-center justify-center gap-2 text-[12px] font-semibold py-3 rounded-xl transition-all duration-300 ease-out-expo ${
            isSoldOut
              ? "bg-surface-container text-on-surface-variant/50 cursor-not-allowed"
              : "bg-primary-container text-white hover:bg-primary active:scale-[0.98]"
          }`}
        >
          {isSoldOut ? "Sin cupos" : "Reservar experiencia"}
          {!isSoldOut && (
            <span className="material-symbols-outlined text-[15px] transition-transform duration-300 group-hover:translate-x-0.5">
              arrow_forward
            </span>
          )}
        </Link>
      </div>
    </article>
  );
}
