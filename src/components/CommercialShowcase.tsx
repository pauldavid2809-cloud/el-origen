"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { translations, Language } from "@/lib/i18n";

interface CommercialShowcaseProps {
  currentLang: Language;
}

export function CommercialShowcase({ currentLang }: CommercialShowcaseProps) {
  const t = translations[currentLang];
  const s = t.commercialShowcase;

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

  return (
    <section className="px-4 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-3 sm:pt-6 pb-12 sm:pb-20 animate-fade-in">
      
      {/* ─── TOP BRAND & COMMERCIAL HEADER (MOBILE COMPACT) ─── */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {s.eyebrow}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-[12px] sm:text-[12.5px] font-semibold">
          <a
            href="/Dossier-El-Origen-Caracas.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:text-primary-container transition-colors py-1"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[17px]">picture_as_pdf</span>
            <span className="hidden xs:inline">Dossier PDF</span>
            <span className="xs:hidden">PDF</span>
          </a>

          <a
            href="#proximas-catas"
            className="text-on-surface-variant/70 hover:text-primary transition-colors hidden md:inline-flex items-center gap-1"
          >
            <span>Ver Catas</span>
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
          </a>
        </div>
      </div>

      {/* ─── 8:4 COMMERCIAL SHOWCASE GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        
        {/* ─── BANNER PRINCIPAL (8 COLS EN DESKTOP / 1 COL EN MÓVIL) ─── */}
        <div className="lg:col-span-8 p-1.5 sm:p-2.5 rounded-[2rem] sm:rounded-[2.5rem] bg-black/[0.03] border border-black/[0.06] shadow-card flex flex-col">
          <div className="rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2.5rem-0.625rem)] relative overflow-hidden bg-primary text-white min-h-[440px] sm:min-h-[520px] flex flex-col justify-between p-5 sm:p-10 lg:p-12 flex-1">
            
            {/* High-End Background Image & Scrim */}
            <Image
              src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1400&auto=format&fit=crop"
              alt="Alianzas Comerciales y Patrocinio El Origen Caracas"
              fill
              priority
              className="object-cover object-center transform scale-105 transition-transform duration-700 hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/65 to-black/35 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-transparent to-black/50 pointer-events-none" />

            {/* Top Bar: Badge & City */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                <span className="text-[11px] text-[#D4AF37]">★</span>
                <span className="text-[9.5px] sm:text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">
                  {s.main.badge}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10.5px] sm:text-[11px] font-medium text-white/90">
                <span className="material-symbols-outlined text-[13px] sm:text-[14px] text-[#D4AF37]">handshake</span>
                <span>Caracas</span>
              </div>
            </div>

            {/* Middle: Headline, Narrative & Impact Metrics */}
            <div className="relative z-10 my-5 sm:my-8 space-y-3.5 sm:space-y-5">
              <h1 className="font-serif text-2xl sm:text-4xl lg:text-[42px] font-semibold text-white leading-[1.14] tracking-tight text-balance">
                {s.main.title}
              </h1>

              <p className="text-[13px] sm:text-[15.5px] text-white/85 max-w-2xl leading-relaxed font-normal text-pretty">
                {s.main.subtitle}
              </p>

              {/* 3 Impact Stat Pills (Calibrated for Mobile screens) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1 max-w-xl">
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-left">
                  <div className="font-serif text-base sm:text-xl font-bold text-[#D4AF37]">
                    {s.main.stat1Value}
                  </div>
                  <div className="text-[9.5px] sm:text-[11px] text-white/80 leading-tight mt-0.5">
                    {s.main.stat1Label}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-left">
                  <div className="font-serif text-base sm:text-xl font-bold text-[#D4AF37]">
                    {s.main.stat2Value}
                  </div>
                  <div className="text-[9.5px] sm:text-[11px] text-white/80 leading-tight mt-0.5">
                    {s.main.stat2Label}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-left">
                  <div className="font-serif text-base sm:text-xl font-bold text-[#D4AF37]">
                    {s.main.stat3Value}
                  </div>
                  <div className="text-[9.5px] sm:text-[11px] text-white/80 leading-tight mt-0.5">
                    {s.main.stat3Label}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Commercial CTAs */}
            <div className="relative z-10 pt-4 sm:pt-5 border-t border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
                <a
                  href="/Dossier-El-Origen-Caracas.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2.5 bg-white text-primary hover:bg-[#FAF8F7] text-[12.5px] sm:text-[13px] font-semibold px-5 sm:px-6 py-3.5 rounded-full transition-all duration-300 shadow-md active:scale-[0.97]"
                >
                  <span className="material-symbols-outlined text-[17px] text-primary">download</span>
                  <span>{s.main.ctaPrimary}</span>
                </a>

                <a
                  href={`https://wa.me/584120000000?text=${whatsappAllianceMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-[12px] sm:text-[12.5px] font-medium text-white bg-white/10 hover:bg-white/20 border border-white/15 px-4 sm:px-5 py-3 rounded-full transition-colors backdrop-blur-sm active:scale-[0.97]"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#25D366]">chat</span>
                  <span>{s.main.ctaSecondary}</span>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ─── COLUMNA LATERAL: DOS CUADRADOS (4 COLS EN DESKTOP / 1 COL EN MÓVIL) ─── */}
        <div className="lg:col-span-4 flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-4 sm:gap-6">
          
          {/* Cuadrado 1: Alianza Gastronómica & Producto en Mesa */}
          <div className="p-1.5 sm:p-2.5 rounded-[2rem] sm:rounded-[2.25rem] bg-black/[0.03] border border-black/[0.06] shadow-card flex-1 flex flex-col">
            <div className="rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2.25rem-0.5rem)] relative overflow-hidden bg-surface-container-lowest p-5 sm:p-7 flex flex-col justify-between flex-1 min-h-[230px] sm:min-h-[250px] border border-black/[0.04] group hover:border-primary/30 transition-all duration-300">
              
              {/* Subtle background photo watermark */}
              <div className="absolute right-0 bottom-0 w-36 sm:w-44 h-36 sm:h-44 opacity-[0.06] pointer-events-none rounded-full overflow-hidden translate-x-6 translate-y-6">
                <Image
                  src="https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=500&auto=format&fit=crop"
                  alt="Alianza Gastronómica"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Card Top */}
              <div className="space-y-2.5 sm:space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-primary bg-primary/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                    {s.card1.badge}
                  </span>
                  <span className="material-symbols-outlined text-primary/60 text-[20px] sm:text-[22px]">
                    restaurant
                  </span>
                </div>

                <h3 className="font-serif text-lg sm:text-2xl font-semibold text-on-surface leading-tight tracking-tight">
                  {s.card1.title}
                </h3>

                <p className="text-[12px] sm:text-[12.5px] text-on-surface-variant/80 leading-relaxed font-normal">
                  {s.card1.subtitle}
                </p>
              </div>

              {/* Card Bottom */}
              <div className="pt-3 sm:pt-4 mt-2 sm:mt-3 border-t border-black/[0.05] relative z-10 flex flex-col gap-2">
                <span className="text-[10.5px] sm:text-[11px] font-semibold text-primary/90 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px] text-[#C9A84C]">verified</span>
                  {s.card1.highlight}
                </span>

                <a
                  href={`https://wa.me/584120000000?text=${whatsappGastroMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-[12px] sm:text-[12.5px] font-semibold text-primary hover:text-primary-container transition-colors pt-0.5 active:scale-[0.98]"
                >
                  <span>{s.card1.cta}</span>
                  <span className="material-symbols-outlined text-[14px] sm:text-[15px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </a>
              </div>

            </div>
          </div>

          {/* Cuadrado 2: Sponsor & B2B Hospitality */}
          <div className="p-1.5 sm:p-2.5 rounded-[2rem] sm:rounded-[2.25rem] bg-black/[0.03] border border-black/[0.06] shadow-card flex-1 flex flex-col">
            <div className="rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2.25rem-0.5rem)] relative overflow-hidden bg-[#24131A] text-white p-5 sm:p-7 flex flex-col justify-between flex-1 min-h-[230px] sm:min-h-[250px] group hover:shadow-elevated transition-all duration-300">
              
              {/* Ambient wine texture */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-black/50 pointer-events-none" />

              {/* Card Top */}
              <div className="space-y-2.5 sm:space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37] bg-white/10 border border-[#D4AF37]/30 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm">
                    {s.card2.badge}
                  </span>
                  <span className="material-symbols-outlined text-[#D4AF37] text-[20px] sm:text-[22px]">
                    corporate_fare
                  </span>
                </div>

                <h3 className="font-serif text-lg sm:text-2xl font-semibold text-white leading-tight tracking-tight">
                  {s.card2.title}
                </h3>

                <p className="text-[12px] sm:text-[12.5px] text-white/80 leading-relaxed font-normal">
                  {s.card2.subtitle}
                </p>
              </div>

              {/* Card Bottom */}
              <div className="pt-3 sm:pt-4 mt-2 sm:mt-3 border-t border-white/10 relative z-10 flex flex-col gap-2">
                <span className="text-[10.5px] sm:text-[11px] font-medium text-[#D4AF37] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px] text-[#D4AF37]">star</span>
                  {s.card2.highlight}
                </span>

                <Link
                  href="/privadas"
                  className="group inline-flex items-center gap-1.5 text-[12px] sm:text-[12.5px] font-semibold text-white hover:text-[#D4AF37] transition-colors pt-0.5 active:scale-[0.98]"
                >
                  <span>{s.card2.cta}</span>
                  <span className="material-symbols-outlined text-[14px] sm:text-[15px] transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
