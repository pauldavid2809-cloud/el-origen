"use client";

import React from "react";
import { Language, translations } from "@/lib/i18n";
import { instagramUrl } from "@/lib/team";
import { SectionHeading } from "@/components/Brand";

interface Partner {
  name: string;
  category: Record<Language, string>;
  icon: string;
  /** Usuario de Instagram con "@" (solo los confirmados por el cliente). */
  instagram?: string;
}

/* Aliados de El Origen (lista del cliente, en su orden). */
// PENDIENTE CLIENTE: usuarios de Instagram de COCUY La Capilla, Casa Oliveira, Karnivoros Grill, Dimasi Wine y Empresa Paul.
const PARTNERS: Partner[] = [
  { name: "COCUY La Capilla", category: { es: "Cocuy", en: "Cocuy" }, icon: "liquor" },
  { name: "Casa Oliveira", category: { es: "Vinos & licores", en: "Wines & spirits" }, icon: "wine_bar" },
  { name: "Karnivoros Grill", category: { es: "Restaurante", en: "Restaurant" }, icon: "outdoor_grill" },
  {
    name: "Acqua Panna & S.Pellegrino",
    category: { es: "Aguas minerales", en: "Mineral waters" },
    icon: "water_drop",
    instagram: "@brandsimex_vzla",
  },
  { name: "Maratea", category: { es: "Restaurante", en: "Restaurant" }, icon: "restaurant", instagram: "@maratea.ccs" },
  { name: "Dimasi Wine", category: { es: "Vinos", en: "Wines" }, icon: "wine_bar" },
  // PENDIENTE CLIENTE: rubro y nombre comercial exacto de "Empresa Paul".
  { name: "Empresa Paul", category: { es: "Aliado", en: "Partner" }, icon: "handshake" },
];

interface PartnersSectionProps {
  currentLang?: Language;
  /** Número de sección en la portada ("05"). */
  index?: string;
}

export function PartnersSection({ currentLang = "es", index }: PartnersSectionProps) {
  const t = translations[currentLang].partners;

  return (
    <section id="aliados" className="scroll-mt-24 bg-surface-container-low border-y border-outline-variant">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <SectionHeading index={index} eyebrow={t.badge} title={t.title} subtitle={t.subtitle} />
        </div>

        <ul className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8 border-t border-outline-variant sm:border-t-0">
          {PARTNERS.map((partner) => {
            const content = (
              <>
                <span className="w-12 h-12 flex-shrink-0 rounded-full border border-primary-container/25 bg-surface-container-lowest flex items-center justify-center text-primary-container transition-colors group-hover:bg-primary-container group-hover:text-paper">
                  <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{partner.icon}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                    {partner.category[currentLang]}
                  </span>
                  <span className="block font-serif text-[20px] sm:text-[22px] leading-snug text-on-surface mt-0.5 transition-colors group-hover:text-primary-container">
                    {partner.name}
                  </span>
                  {partner.instagram && (
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-container mt-1">
                      {partner.instagram}
                      <span
                        className="material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      >
                        north_east
                      </span>
                    </span>
                  )}
                </span>
              </>
            );

            return (
              <li key={partner.name} className="border-b border-outline-variant sm:first:border-t sm:[&:nth-child(2)]:border-t">
                {partner.instagram ? (
                  <a
                    href={instagramUrl(partner.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.viewProfile(partner.name)}
                    className="group flex items-center gap-4 py-5 sm:py-6 min-h-[88px]"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-4 py-5 sm:py-6 min-h-[88px]">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
