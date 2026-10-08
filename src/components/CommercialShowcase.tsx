"use client";

import React from "react";
import Link from "next/link";
import { translations, Language } from "@/lib/i18n";
import { whatsappLink } from "@/lib/contact";
import { AvilaRidge } from "@/components/Brand";

interface CommercialShowcaseProps {
  currentLang: Language;
  /** Número de sección en la portada ("06"). */
  index?: string;
}

/* Alianzas comerciales (→ /alianzas), red de sommeliers (→ /sommeliers) y experiencias privadas (→ /privadas). */
export function CommercialShowcase({ currentLang, index }: CommercialShowcaseProps) {
  const s = translations[currentLang].commercialShowcase;

  const sideCards = [
    { card: s.sommeliers, icon: "wine_bar", href: "/sommeliers" },
    { card: s.private, icon: "corporate_fare", href: "/privadas" },
  ];

  return (
    <section id="marcas" className="scroll-mt-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-24 sm:pt-32">
      <p className="eyebrow flex items-center gap-3 mb-8">
        {index && <span className="tabular-nums">{index}</span>}
        {index && <span className="h-px w-8 bg-primary-container/40" />}
        <span>{s.eyebrow}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Marcas aliadas */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-2xl bg-primary-container text-paper p-7 sm:p-12 flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sun">{s.main.badge}</span>
          <h2 className="font-serif text-[1.85rem] sm:text-[2.6rem] leading-[1.12] mt-4 text-balance">{s.main.title}</h2>
          <p className="mt-5 text-[15px] sm:text-base text-paper/80 leading-relaxed max-w-xl">{s.main.subtitle}</p>

          <div className="mt-8 border-t border-paper/20 pt-6">
            <p className="sr-only">{s.main.modalitiesLabel}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {s.main.modalities.map((m) => (
                <li key={m.key} className="flex sm:block items-baseline gap-3">
                  <span className="font-serif text-xl sm:text-2xl text-sun" aria-hidden="true">
                    {m.key}
                  </span>
                  <span className="text-[13px] text-paper/80 leading-snug sm:block sm:mt-1">{m.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 relative z-10">
            <Link
              href="/alianzas"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-paper text-primary hover:bg-white text-[14px] font-semibold rounded transition-colors"
            >
              {s.main.ctaPrimary}
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </Link>
            <a
              href={whatsappLink(s.main.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 border border-paper/30 hover:border-paper text-paper text-[14px] font-semibold rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
              {s.main.ctaSecondary}
            </a>
          </div>

          <div className="absolute inset-x-0 bottom-0 text-paper/10 pointer-events-none" aria-hidden="true">
            <AvilaRidge strokeWidth={1.5} className="h-28" />
          </div>
        </div>

        {/* Sommeliers y experiencias privadas */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 sm:gap-6">
          {sideCards.map(({ card, icon, href }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col p-7 sm:p-8 rounded-2xl border border-outline-variant bg-surface-container-lowest hover:border-primary-container/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">{card.badge}</span>
                <span className="material-symbols-outlined text-[22px] text-primary-container" aria-hidden="true">{icon}</span>
              </div>
              <h3 className="font-serif text-[22px] sm:text-2xl leading-snug text-on-surface mt-4 group-hover:text-primary-container transition-colors text-balance">
                {card.title}
              </h3>
              <p className="text-[14px] text-on-surface-variant leading-relaxed mt-3">{card.subtitle}</p>
              <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant">
                <span className="text-[13px] text-on-surface-variant">{card.highlight}</span>
                <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-container whitespace-nowrap">
                  {card.cta}
                  <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1" aria-hidden="true">
                    arrow_forward
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
