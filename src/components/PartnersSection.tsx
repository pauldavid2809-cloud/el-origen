"use client";

import React from "react";
import { Language, translations } from "@/lib/i18n";

interface PartnersSectionProps {
  currentLang?: Language;
}

export function PartnersSection({ currentLang = "es" }: PartnersSectionProps) {
  const t = translations[currentLang].partners;

  const getPartnerEmblem = (type: string, name: string) => {
    switch (type) {
      case "water":
        return (
          <div className="flex items-center justify-center gap-2.5 text-primary py-2">
            {/* Acqua Panna Fleur-de-lis */}
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
              <path d="M12 2c-.6 2.5-2.2 4.4-4 5.2 1.4.6 2.5 1.8 2.8 3.3.4-1.2 1.2-2.3 2.2-3.1-.3-.6-.6-1.3-.7-2-.1-1.1-.2-2.3-.3-3.4zm0 10.5c-1.8 0-3.3 1.2-3.8 2.9-.3 1.1-.1 2.3.5 3.2.7 1.1 1.9 1.8 3.3 1.8 1.4 0 2.6-.7 3.3-1.8.6-.9.8-2.1.5-3.2-.5-1.7-2-2.9-3.8-2.9zM5 10c-.8 2-2.5 3.5-4.5 4 1.5.8 2.5 2.2 2.7 3.9.7-1.1 1.7-2 2.9-2.5-.2-.7-.4-1.4-.4-2.1 0-1.2.3-2.3.7-3.3H5zm14 0c.4 1 .7 2.1.7 3.3 0 .7-.2 1.4-.4 2.1 1.2.5 2.2 1.4 2.9 2.5.2-1.7 1.2-3.1 2.7-3.9-2-.5-3.7-2-4.5-4h-1.4z" />
            </svg>
            <span className="font-serif tracking-widest text-xs font-bold text-on-surface uppercase">
              Acqua Panna
            </span>
            <span className="text-[#C9A84C] text-sm">★</span>
            <span className="font-serif tracking-widest text-xs font-bold text-on-surface uppercase">
              S.Pellegrino
            </span>
          </div>
        );
      case "restaurant":
        return (
          <div className="flex flex-col items-center justify-center text-primary py-1">
            {/* Maratea Arch & Mountain */}
            <div className="w-9 h-11 border-2 border-primary rounded-t-full flex items-center justify-center p-1 relative mb-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-primary fill-none stroke-2" aria-hidden="true">
                <path d="M3 20l6-9 4 5 3-4 5 8H3z" />
              </svg>
            </div>
            <span className="font-serif text-base font-bold tracking-[0.25em] text-on-surface uppercase">
              MARATEA
            </span>
          </div>
        );
      case "cheese":
        return (
          <div className="flex flex-col items-center justify-center py-1">
            {/* Sowi Artisan Badge */}
            <div className="w-12 h-12 rounded-full bg-amber-600/10 border border-amber-600/30 flex items-center justify-center text-amber-800 font-serif font-bold text-lg italic shadow-inner mb-1">
              Sowi
            </div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-900/80">
              Quesos & Lácteos
            </span>
          </div>
        );
      case "sommelier":
        return (
          <div className="flex flex-col items-center justify-center text-primary py-1">
            {/* Belkis Croquer Sommelier Swirl */}
            <div className="flex items-center gap-1.5 mb-1 text-primary">
              <span className="material-symbols-outlined text-2xl">wine_bar</span>
              <span className="material-symbols-outlined text-sm text-[#C9A84C]">verified</span>
            </div>
            <span className="font-serif text-base font-semibold text-on-surface tracking-wide">
              Belkis Croquer
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            {t.badge}
          </span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-on-surface tracking-tight mb-4">
          {t.title}
        </h2>
        <p className="text-[14px] sm:text-base text-on-surface-variant/80 max-w-xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Partners Grid in Double-Bezel Frames */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {t.partnersList.map((partner, idx) => (
          <div
            key={idx}
            className="p-1.5 sm:p-2 rounded-[2rem] bg-black/[0.02] border border-black/[0.05] hover:border-primary/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover-lift flex flex-col"
          >
            <div className="bg-white rounded-[calc(2rem-0.5rem)] p-6 sm:p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] flex flex-col justify-between flex-grow text-center">
              {/* Top Brand Emblem */}
              <div className="min-h-[90px] flex items-center justify-center mb-4 border-b border-black/[0.04] pb-4">
                {getPartnerEmblem(partner.type, partner.name)}
              </div>

              {/* Body Info */}
              <div className="space-y-2 mb-6 flex-grow flex flex-col justify-center">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-0.5 rounded-full mx-auto">
                  {partner.category}
                </span>
                <p className="text-[12px] text-on-surface-variant/75 leading-relaxed">
                  {partner.description}
                </p>
              </div>

              {/* Instagram Handle & Action */}
              <div className="pt-2 border-t border-black/[0.04]">
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-full bg-surface-container hover:bg-black/[0.05] text-on-surface text-[12px] font-semibold transition-all duration-300 active:scale-95"
                >
                  <span className="text-primary font-mono text-[11px] font-medium">
                    {partner.handle}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60 transition-transform group-hover:translate-x-0.5">
                    open_in_new
                  </span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
