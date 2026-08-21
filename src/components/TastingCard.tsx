import React from "react";
import Link from "next/link";
import { Tasting } from "@/types";

interface TastingCardProps {
  tasting: Tasting;
}

export function TastingCard({ tasting }: TastingCardProps) {
  const isSoldOut = tasting.availableSpots <= 0 || tasting.status === "sold_out";

  return (
    <article className="bg-surface-container-lowest rounded-xl border border-surface-variant soft-shadow overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 group">
      {/* Tasting Image */}
      <div className="relative w-full h-52 overflow-hidden bg-surface-container">
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${tasting.imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
        
        {/* Category / Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-primary-container text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
            {tasting.category === "reserva" ? "Reserva de Cava" : tasting.category === "atardecer" ? "Sunset Experience" : "Degustación"}
          </span>
        </div>

        {/* Date Badge */}
        <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur-sm text-primary font-bold text-xs uppercase px-2.5 py-1 rounded shadow-sm">
          {tasting.dateDisplay}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-serif text-xl md:text-2xl font-bold text-on-background group-hover:text-primary transition-colors">
            {tasting.title}
          </h3>
        </div>

        <p className="text-sm text-on-surface-variant mb-6 flex-grow line-clamp-3 leading-relaxed">
          {tasting.description}
        </p>

        <div className="flex flex-col gap-3.5 mt-auto pt-4 border-t border-surface-variant">
          {/* Time & Price */}
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1.5 text-secondary text-xs">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              {tasting.timeStart} - {tasting.timeEnd}
            </span>
            <span className="font-serif text-lg font-bold text-primary">
              {tasting.priceFormatted}
            </span>
          </div>

          {/* Spots Remaining Indicator */}
          <div className="flex justify-between items-center">
            {isSoldOut ? (
              <span className="text-xs font-bold uppercase tracking-wider text-error bg-error-container/40 px-2.5 py-1 rounded-md">
                Agotado
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-fixed-dim/30 px-2.5 py-1 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                {tasting.availableSpots} cupos restantes
              </span>
            )}
          </div>

          {/* Action Button */}
          <Link
            href={`/catas/${tasting.slug || tasting.id}`}
            className={`w-full text-center text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all mt-1 ${
              isSoldOut
                ? "bg-surface-variant text-secondary cursor-not-allowed"
                : "bg-primary-container text-white hover:bg-primary shadow-sm hover:shadow active:scale-[0.98]"
            }`}
          >
            {isSoldOut ? "Sin cupos disponibles" : "Reservar y pagar"}
          </Link>
        </div>
      </div>
    </article>
  );
}
