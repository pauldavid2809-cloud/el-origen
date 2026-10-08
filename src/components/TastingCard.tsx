"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { RateCurrency, Tasting } from "@/types";
import { Language, translations } from "@/lib/i18n";
import { whatsappLink } from "@/lib/contact";
import { formatBs } from "@/components/PaymentDetails";
import { AvilaRidge, SunBurst } from "@/components/Brand";

/** Tasas BCV del día por moneda (Bs por unidad). `null` si la fuente no respondió. */
export type BcvRates = Record<RateCurrency, number | null>;

const NO_RATES: BcvRates = { USD: null, EUR: null };

/**
 * Tasas BCV de `/api/rates`, pedidas UNA vez por página y repartidas a todas las tarjetas.
 * Devuelve `null` mientras carga; si falla, ambas tasas quedan en `null` y la tarjeta muestra solo el precio en divisa.
 */
export function useBcvRates(): BcvRates | null {
  const [rates, setRates] = useState<BcvRates | null>(null);

  useEffect(() => {
    let alive = true;
    const rateOf = (v: unknown) => {
      const n = Number((v as { rate?: unknown } | null)?.rate);
      return n > 0 ? n : null;
    };
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => alive && setRates(d?.success ? { USD: rateOf(d.USD), EUR: rateOf(d.EUR) } : NO_RATES))
      .catch(() => alive && setRates(NO_RATES));
    return () => {
      alive = false;
    };
  }, []);

  return rates;
}

interface TastingCardProps {
  tasting: Tasting;
  currentLang?: Language;
  /** Tasas BCV del día (de `useBcvRates`). Sin tasa para la moneda de la cata no se muestra el monto en Bs. */
  rates?: BcvRates | null;
}

/* Tarjeta tipo boleto: foto, talón con la fecha y datos esenciales */
export function TastingCard({ tasting, currentLang = "es", rates }: TastingCardProps) {
  const isSoldOut = tasting.availableSpots <= 0 || tasting.status === "sold_out";
  const t = translations[currentLang];

  const [day, month] = (tasting.dateDisplay || "").split(" ");
  const fewSpots = !isSoldOut && tasting.availableSpots <= 5;
  const href = `/catas/${tasting.slug || tasting.id}`;

  const currency: RateCurrency = tasting.rateCurrency === "EUR" ? "EUR" : "USD";
  const rate = rates?.[currency] ?? null;
  const priceUsd = tasting.priceUsd ?? tasting.price;
  const priceBs = rate && priceUsd > 0 ? Math.round(priceUsd * rate * 100) / 100 : null;
  const time = [tasting.timeStart, tasting.timeEnd].filter(Boolean).join(" – ");

  return (
    <article className="group relative flex flex-col h-full bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-[border-color,transform,box-shadow] duration-500 hover:border-primary-container/40 hover:-translate-y-1 hover:shadow-card">
      {/* Foto (o ilustración de marca mientras la cata no tenga foto) */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
        {tasting.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
            style={{ backgroundImage: `url(${JSON.stringify(tasting.imageUrl)})` }}
            role="img"
            aria-label={tasting.imageAlt || tasting.title}
          />
        ) : (
          <div className="absolute inset-0 bg-primary-container text-paper flex items-center justify-center" role="img" aria-label={t.tastings.noImage}>
            <SunBurst className="w-20 text-sun -mt-6" />
            <div className="absolute inset-x-0 bottom-0 text-paper/25">
              <AvilaRidge strokeWidth={1.5} showBirds className="h-16" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
        <span className="absolute bottom-4 left-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper">
          {t.categories[tasting.category] ?? t.categories.degustacion}
        </span>
      </div>

      {/* Talón del boleto */}
      <div className="flex flex-1">
        <div className="w-[76px] sm:w-20 flex-shrink-0 flex flex-col items-center justify-start pt-6 border-r border-dashed border-outline-variant">
          <span className="font-serif text-[34px] leading-none text-primary-container">{day}</span>
          <span className="mt-1 text-[11px] font-semibold tracking-[0.2em] text-on-surface-variant">{month}</span>
        </div>

        <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col">
          <h3 className="font-serif text-[21px] leading-snug text-on-surface group-hover:text-primary-container transition-colors">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {tasting.title}
            </Link>
          </h3>

          {(tasting.subtitle || tasting.description) && (
            <p className="mt-2 text-[14px] text-on-surface-variant leading-relaxed line-clamp-2">
              {tasting.subtitle || tasting.description}
            </p>
          )}

          <ul className="mt-4 space-y-1.5 text-[13px] text-on-surface-variant">
            {time && (
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary-container" aria-hidden="true">schedule</span>
                {time}
              </li>
            )}
            {tasting.location && (
              <li className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[16px] text-primary-container" aria-hidden="true">location_on</span>
                <span className="line-clamp-1">{tasting.location}</span>
              </li>
            )}
            {tasting.sommelier?.name && (
              <li className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[16px] text-primary-container" aria-hidden="true">wine_bar</span>
                <span className="line-clamp-1">{tasting.sommelier.name}</span>
              </li>
            )}
          </ul>

          <div className="mt-auto pt-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="block font-serif text-2xl text-on-surface">{tasting.priceFormatted}</span>
              {priceBs !== null && (
                <span className="block text-[12px] text-on-surface-variant tabular-nums" title={t.tastings.bsTitle(currency)}>
                  {t.tastings.bsApprox(formatBs(priceBs, currentLang))}
                </span>
              )}
              <span className="text-[11px] text-on-surface-variant">{t.tastings.perPerson}</span>
            </div>

            {isSoldOut ? (
              <span className="text-[12px] font-semibold uppercase tracking-wider text-error">{t.tastings.soldOut}</span>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 text-[12px] font-semibold whitespace-nowrap ${
                  fewSpots ? "text-tertiary" : "text-on-surface-variant"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${fewSpots ? "bg-tertiary-container" : "bg-emerald-600"}`} aria-hidden="true" />
                {tasting.availableSpots} {tasting.availableSpots === 1 ? t.tastings.spot : t.tastings.spots}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* Sin catas publicadas: invitación a registrarse para enterarse primero (portada y catálogo). */
export function TastingsEmptyState({ lang, headingLevel = "h3" }: { lang: Language; headingLevel?: "h2" | "h3" }) {
  const t = translations[lang].tastings;
  const Heading = headingLevel;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest px-6 sm:px-12 pt-14 sm:pt-16 text-center">
      <SunBurst className="w-16 mx-auto text-sun" />
      <p className="eyebrow mt-6">{t.emptyBadge}</p>
      <Heading className="font-serif text-[1.75rem] sm:text-4xl leading-tight text-on-surface mt-3 max-w-xl mx-auto text-balance">{t.emptyTitle}</Heading>
      <p className="mt-4 text-[15px] text-on-surface-variant leading-relaxed max-w-lg mx-auto">{t.emptyText}</p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/registro"
          className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-primary-container hover:bg-primary text-white text-[14px] font-semibold rounded transition-colors"
        >
          {t.emptyCta}
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
        </Link>
        <a
          href={whatsappLink(t.emptyWhatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 h-[52px] px-7 border border-on-surface/20 hover:border-primary-container hover:text-primary-container text-[14px] font-semibold rounded transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
          {t.emptySecondary}
        </a>
      </div>
      <div className="mt-12 text-primary-container/25">
        <AvilaRidge strokeWidth={1.5} showBirds className="h-14 sm:h-20" />
      </div>
    </div>
  );
}

/* No se pudo leer /api/tastings. */
export function TastingsLoadError({
  lang,
  onRetry,
  headingLevel = "h3",
}: {
  lang: Language;
  onRetry: () => void;
  headingLevel?: "h2" | "h3";
}) {
  const t = translations[lang].tastings;
  const Heading = headingLevel;
  return (
    <div role="alert" className="text-center py-16 px-6 border border-dashed border-outline-variant rounded-xl">
      <span className="material-symbols-outlined text-4xl text-primary-container/50" aria-hidden="true">wifi_off</span>
      <Heading className="font-serif text-2xl text-on-surface mt-3">{t.errorTitle}</Heading>
      <p className="text-[14px] text-on-surface-variant mt-1 mb-5">{t.errorText}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center gap-2 h-12 px-6 border border-on-surface/20 hover:border-primary-container hover:text-primary-container text-[14px] font-semibold rounded transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
        {t.retry}
      </button>
    </div>
  );
}
