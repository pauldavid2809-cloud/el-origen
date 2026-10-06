"use client";

import React from "react";
import { Language, translations } from "@/lib/i18n";
import { SectionHeading } from "@/components/Brand";

interface PartnersSectionProps {
  currentLang?: Language;
}

const PARTNER_ICONS: Record<string, string> = {
  water: "water_drop",
  restaurant: "restaurant",
  cheese: "lunch_dining",
  sommelier: "wine_bar",
};

export function PartnersSection({ currentLang = "es" }: PartnersSectionProps) {
  const t = translations[currentLang].partners;

  return (
    <section id="aliados" className="scroll-mt-24 bg-surface-container-low border-y border-outline-variant">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <SectionHeading index="04" eyebrow={t.badge} title={t.title} subtitle={t.subtitle} />
        </div>

        <ul className="lg:col-span-8 border-t border-outline-variant">
          {t.partnersList.map((partner) => (
            <li key={partner.handle} className="border-b border-outline-variant">
              <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid grid-cols-[48px_1fr] sm:grid-cols-[56px_1fr_auto] gap-x-5 gap-y-1 items-center py-6 sm:py-7"
              >
                <span className="row-span-2 sm:row-span-1 w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-primary-container/25 bg-surface-container-lowest flex items-center justify-center text-primary-container group-hover:bg-primary-container group-hover:text-paper transition-colors">
                  <span className="material-symbols-outlined text-[22px]">{PARTNER_ICONS[partner.type] ?? "star"}</span>
                </span>

                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">{partner.category}</span>
                  <span className="block font-serif text-[22px] sm:text-2xl text-on-surface group-hover:text-primary-container transition-colors mt-0.5">
                    {partner.name}
                  </span>
                  <span className="block text-[14px] text-on-surface-variant leading-relaxed mt-1 max-w-lg">{partner.description}</span>
                </span>

                <span className="col-start-2 sm:col-start-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-container mt-2 sm:mt-0">
                  {partner.handle}
                  <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    north_east
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
