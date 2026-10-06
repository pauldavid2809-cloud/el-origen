import React from "react";
import Link from "next/link";
import { Tasting } from "@/types";
import { Language, translations } from "@/lib/i18n";

interface TastingCardProps {
  tasting: Tasting;
  currentLang?: Language;
}

/* Tarjeta tipo boleto: foto, talón con la fecha y datos esenciales */
export function TastingCard({ tasting, currentLang = "es" }: TastingCardProps) {
  const isSoldOut = tasting.availableSpots <= 0 || tasting.status === "sold_out";
  const t = translations[currentLang];
  const es = currentLang === "es";

  const categoryLabel =
    tasting.category === "reserva"
      ? es ? "Reserva de cava" : "Cellar reserve"
      : tasting.category === "atardecer"
      ? "Sunset experience"
      : es ? "Degustación" : "Tasting";

  const [day, month] = (tasting.dateDisplay || "").split(" ");
  const fewSpots = !isSoldOut && tasting.availableSpots <= 5;
  const href = `/catas/${tasting.slug || tasting.id}`;

  return (
    <article className="group relative flex flex-col h-full bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-[border-color,transform,box-shadow] duration-500 hover:border-primary-container/40 hover:-translate-y-1 hover:shadow-card">
      {/* Foto */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
          style={{ backgroundImage: `url('${tasting.imageUrl}')` }}
          role="img"
          aria-label={tasting.imageAlt || tasting.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
        <span className="absolute bottom-4 left-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper">
          {categoryLabel}
        </span>
      </div>

      {/* Talón del boleto */}
      <div className="flex flex-1">
        <div className="w-[76px] sm:w-20 flex-shrink-0 flex flex-col items-center justify-start pt-6 border-r border-dashed border-outline-variant">
          <span className="font-serif text-[34px] leading-none text-primary-container">{day}</span>
          <span className="mt-1 text-[11px] font-semibold tracking-[0.2em] text-on-surface-variant">{month}</span>
        </div>

        <div className="flex-1 p-5 sm:p-6 flex flex-col">
          <h3 className="font-serif text-[21px] leading-snug text-on-surface group-hover:text-primary-container transition-colors">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {tasting.title}
            </Link>
          </h3>

          <p className="mt-2 text-[14px] text-on-surface-variant leading-relaxed line-clamp-2">{tasting.description}</p>

          <ul className="mt-4 space-y-1.5 text-[13px] text-on-surface-variant">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary-container">schedule</span>
              {tasting.timeStart} – {tasting.timeEnd}
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary-container">location_on</span>
              <span className="line-clamp-1">{tasting.location}</span>
            </li>
          </ul>

          <div className="mt-auto pt-5 flex items-end justify-between gap-3">
            <div>
              <span className="block font-serif text-2xl text-on-surface">{tasting.priceFormatted}</span>
              <span className="text-[11px] text-on-surface-variant">{es ? "por persona" : "per person"}</span>
            </div>

            {isSoldOut ? (
              <span className="text-[12px] font-semibold uppercase tracking-wider text-error">{t.tastings.soldOut}</span>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${
                  fewSpots ? "text-tertiary" : "text-on-surface-variant"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${fewSpots ? "bg-tertiary-container" : "bg-emerald-600"}`} />
                {tasting.availableSpots} {es ? "cupos" : "spots"}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
