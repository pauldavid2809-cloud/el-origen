"use client";

import React from "react";
import Link from "next/link";
import { translations, Language } from "@/lib/i18n";
import { AvilaRidge } from "@/components/Brand";

interface CommercialShowcaseProps {
  currentLang: Language;
}

export function CommercialShowcase({ currentLang }: CommercialShowcaseProps) {
  const s = translations[currentLang].commercialShowcase;

  const whatsappAllianceMsg = encodeURIComponent(
    currentLang === "es"
      ? "Hola, me gustaría conversar sobre oportunidades de alianza comercial y patrocinio de marca con El Origen Caracas."
      : "Hello, I would like to discuss commercial partnership and brand sponsorship opportunities with El Origen Caracas."
  );

  const whatsappGastroMsg = encodeURIComponent(
    currentLang === "es"
      ? "Hola, represento a una marca gastronómica/gourmet y me gustaría sumarla como aliada en las catas de El Origen."
      : "Hello, I represent a gourmet culinary brand and would like to join as a partner in El Origen tastings."
  );

  const stats = [
    { value: s.main.stat1Value, label: s.main.stat1Label },
    { value: s.main.stat2Value, label: s.main.stat2Label },
    { value: s.main.stat3Value, label: s.main.stat3Label },
  ];

  return (
    <section id="marcas" className="scroll-mt-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-24 sm:pt-32">
      <p className="eyebrow flex items-center gap-3 mb-8">
        <span className="tabular-nums">05</span>
        <span className="h-px w-8 bg-primary-container/40" />
        <span>{s.eyebrow}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Propuesta principal */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-2xl bg-primary-container text-paper p-7 sm:p-12 flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sun">{s.main.badge}</span>
          <h2 className="font-serif text-[1.85rem] sm:text-[2.6rem] leading-[1.12] mt-4 text-balance">{s.main.title}</h2>
          <p className="mt-5 text-[15px] sm:text-base text-paper/80 leading-relaxed max-w-xl">{s.main.subtitle}</p>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-paper/20 pt-6">
            {stats.map((st) => (
              <div key={st.value}>
                <dt className="sr-only">{st.label}</dt>
                <dd className="font-serif text-xl sm:text-2xl text-sun">{st.value}</dd>
                <dd className="text-[12px] sm:text-[13px] text-paper/70 leading-snug mt-1">{st.label}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 relative z-10">
            <a
              href="/Dossier-El-Origen-Caracas.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-paper text-primary hover:bg-white text-[14px] font-semibold rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {s.main.ctaPrimary}
            </a>
            <a
              href={`https://wa.me/584141074007?text=${whatsappAllianceMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 border border-paper/30 hover:border-paper text-paper text-[14px] font-semibold rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              {s.main.ctaSecondary}
            </a>
          </div>

          <div className="absolute inset-x-0 bottom-0 text-paper/10 pointer-events-none" aria-hidden="true">
            <AvilaRidge strokeWidth={1.5} className="h-28" />
          </div>
        </div>

        {/* Dos vías de alianza */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 sm:gap-6">
          {[
            { card: s.card1, icon: "restaurant", href: `https://wa.me/584141074007?text=${whatsappGastroMsg}`, external: true },
            { card: s.card2, icon: "corporate_fare", href: "/privadas", external: false },
          ].map(({ card, icon, href, external }) => {
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">{card.badge}</span>
                  <span className="material-symbols-outlined text-[22px] text-primary-container">{icon}</span>
                </div>
                <h3 className="font-serif text-[22px] sm:text-2xl leading-snug text-on-surface mt-4 group-hover:text-primary-container transition-colors">
                  {card.title}
                </h3>
                <p className="text-[14px] text-on-surface-variant leading-relaxed mt-3">{card.subtitle}</p>
                <div className="mt-auto pt-6 flex items-center justify-between gap-3 border-t border-outline-variant">
                  <span className="text-[13px] text-on-surface-variant">{card.highlight}</span>
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-container whitespace-nowrap">
                    {card.cta}
                    <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </span>
                </div>
              </>
            );
            const cls =
              "group flex flex-col p-7 sm:p-8 rounded-2xl border border-outline-variant bg-surface-container-lowest hover:border-primary-container/40 transition-colors";
            return external ? (
              <a key={icon} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={icon} href={href} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
