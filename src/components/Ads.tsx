import React from "react";
import { AD_COPY, type AdSlot, type PublicAds } from "@/lib/ads";
import { whatsappLink } from "@/lib/contact";
import type { Language } from "@/lib/i18n";
import { SunBurst } from "./Brand";

/* Espacios publicitarios de la página de inicio (se administran en el panel → Publicidad).
   Con imagen se muestra el anuncio; activo y sin imagen, el aviso «Anuncia aquí». */

const has = (slot: AdSlot | undefined): slot is AdSlot => Boolean(slot?.imageUrl);

/** Imagen del anuncio (con versión para teléfono si la hay), enlazada al anunciante. */
function AdCreative({ slot, lang, fit, eager }: { slot: AdSlot; lang: Language; fit?: "cover"; eager?: boolean }) {
  const mobile = slot.mobileImageUrl || slot.imageUrl;
  const mobileRatio = slot.mobileImageUrl ? slot.mobileImageRatio : slot.imageRatio;
  // La proporción guardada reserva el espacio antes de que cargue la imagen (sin saltos).
  const sized = fit === "cover" || (slot.imageRatio != null && mobileRatio != null);
  const style = sized && fit !== "cover" ? ({ "--ad-r": slot.imageRatio, "--ad-rm": mobileRatio } as React.CSSProperties) : undefined;

  const picture = (
    <picture>
      {slot.mobileImageUrl && <source media="(max-width: 639px)" srcSet={mobile} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slot.imageUrl}
        alt={AD_COPY[lang].adLabel(slot.advertiser)}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={sized ? "absolute inset-0 w-full h-full object-cover" : "block w-full h-auto"}
      />
    </picture>
  );
  const frame =
    fit === "cover" ? "relative block aspect-[4/3]" : sized ? "relative block aspect-[var(--ad-rm)] sm:aspect-[var(--ad-r)]" : "relative block";
  const cls = `${frame} overflow-hidden rounded-lg bg-surface-container`;

  return slot.link ? (
    <a href={slot.link} target="_blank" rel="sponsored noopener noreferrer" className={`${cls} group focus-visible:outline-offset-4`} style={style}>
      {picture}
    </a>
  ) : (
    <div className={cls} style={style}>
      {picture}
    </div>
  );
}

const advertiseHref = (lang: Language) => whatsappLink(AD_COPY[lang].whatsappMessage);

/** Banner inicial, justo debajo del menú. */
export function TopAd({ slot, lang }: { slot?: AdSlot; lang: Language }) {
  if (!slot) return null;
  const t = AD_COPY[lang];
  if (has(slot)) {
    return (
      <aside aria-label={t.sponsored} className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-3 sm:pt-4">
        <AdCreative slot={slot} lang={lang} eager />
      </aside>
    );
  }
  return (
    <aside aria-label={t.sponsored} className="bg-ink text-paper">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-2.5 flex flex-wrap items-center justify-center sm:justify-between gap-x-6 gap-y-2 text-center sm:text-left">
        <p className="text-[13px] sm:text-[14px] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-sun" aria-hidden="true">campaign</span>
          <span>
            <strong className="font-semibold text-sun">{t.title}.</strong> {t.topText}
          </span>
        </p>
        <a
          href={advertiseHref(lang)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 min-h-[36px] px-3.5 rounded-full bg-sun hover:bg-tertiary-fixed-dim text-ink text-[13px] font-semibold transition-colors"
        >
          {t.cta}
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
        </a>
      </div>
    </aside>
  );
}

/** Los recuadros «Anuncia aquí» de la franja vinotinto. */
export function BandAds({ ads, lang }: { ads: PublicAds; lang: Language }) {
  const slots = [ads.band1, ads.band2, ads.band3].filter((s): s is AdSlot => Boolean(s));
  if (!slots.length) return null;
  const t = AD_COPY[lang];
  return (
    <aside aria-label={t.sponsored} className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pb-12 sm:pb-16">
      {/* En teléfonos se deslizan de lado; desde tablet van en columnas. */}
      <ul
        className={`-mx-5 px-5 sm:mx-0 sm:px-0 flex sm:grid sm:grid-cols-3 gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-px-5 pb-2 sm:pb-0`}
      >
        {slots.map((slot, i) => (
          <li key={i} className="snap-start flex-shrink-0 w-[82%] sm:w-auto">
            {has(slot) ? (
              <AdCreative slot={slot} lang={lang} fit="cover" />
            ) : (
              <div className="relative aspect-[4/3] rounded-lg border border-dashed border-paper/40 bg-paper/[0.06] p-5 sm:p-6 flex flex-col justify-between text-paper">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sun">{t.sponsored}</p>
                <div>
                  <p className="font-serif text-2xl sm:text-[1.7rem] leading-tight">{t.title}</p>
                  <p className="mt-1.5 text-[13px] leading-snug text-paper/75 line-clamp-3">{t.text}</p>
                </div>
                <a
                  href={advertiseHref(lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded bg-sun hover:bg-tertiary-fixed-dim text-ink text-[13px] font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chat</span>
                  {t.cta}
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Banner largo entre la historia y los sommeliers (estilo «Keep Walking»). */
export function WideAd({ slot, lang }: { slot?: AdSlot; lang: Language }) {
  if (!slot) return null;
  const t = AD_COPY[lang];
  return (
    <aside aria-label={t.sponsored} className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-16 sm:pt-24">
      {has(slot) ? (
        <AdCreative slot={slot} lang={lang} />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-ink text-paper px-6 py-8 sm:px-12 sm:py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <SunBurst className="absolute -right-6 -bottom-8 w-40 sm:w-52 text-sun/20" />
          <div className="relative max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sun">{t.sponsored}</p>
            <p className="mt-2 font-serif text-3xl sm:text-5xl leading-[1.05]">
              {t.title.split(" ")[0]} <em className="italic font-normal text-sun">{t.title.split(" ").slice(1).join(" ")}</em>
            </p>
            <p className="mt-3 text-[14px] sm:text-[15px] text-paper/75 leading-relaxed">{t.text}</p>
          </div>
          <a
            href={advertiseHref(lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="relative self-start md:self-auto flex-shrink-0 inline-flex items-center justify-center gap-2 h-[52px] px-7 rounded bg-sun hover:bg-tertiary-fixed-dim text-ink text-[14px] font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
            {t.cta}
          </a>
        </div>
      )}
    </aside>
  );
}
