"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";
import { TastingCard } from "@/components/TastingCard";
import { Tasting } from "@/types";
import { translations, Language } from "@/lib/i18n";

export default function HomePage() {
  const [lang, setLang] = useState<Language>("es");
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("el_origen_lang") as Language | null;
    if (saved === "en" || saved === "es") {
      setLang(saved);
    }
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("el_origen_lang", newLang);
  };

  const t = translations[lang];

  useEffect(() => {
    async function fetchTastings() {
      try {
        const res = await fetch("/api/tastings");
        const data = await res.json();
        if (data.success) {
          setTastings(data.tastings);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    fetchTastings();
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <Navbar currentLang={lang} onLanguageChange={handleLanguageChange} />

      <main className="flex-grow">
        {/* ─── HERO SECTION (Bilingual Dynamic Text) ─── */}
        <section className="relative pt-16 sm:pt-24 pb-28 sm:pb-36 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full text-center flex flex-col items-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              {t.hero.eyebrow}
            </span>
          </div>

          {/* Massive Display Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-semibold text-on-surface leading-[1.08] tracking-tight max-w-4xl mx-auto mb-6 text-balance animate-fade-in-up">
            {t.hero.titleMain}{" "}
            <span className="italic text-primary font-normal">{t.hero.titleHighlight}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[15px] sm:text-lg text-on-surface-variant/80 max-w-2xl mx-auto leading-relaxed mb-10 text-balance animate-fade-in-up">
            {t.hero.subtitle}
          </p>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto animate-fade-in-up">
            <Link
              href="/catas"
              className="group w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 bg-primary-container hover:bg-primary text-white text-[13px] font-semibold pl-6 pr-2 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm active:scale-[0.98]"
            >
              <span>{t.hero.ctaPrimary}</span>
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px]">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </span>
            </Link>

            <a
              href="#proximas-catas"
              className="w-full sm:w-auto text-center text-[13px] font-semibold text-on-surface hover:text-primary bg-black/[0.03] hover:bg-black/[0.06] px-6 py-3.5 rounded-full transition-all duration-300"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>

          {/* Floating Metadata Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-16 sm:mt-20 w-full max-w-3xl pt-10 border-t border-black/[0.05]">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="font-serif text-2xl sm:text-3xl font-semibold text-primary">
                {t.hero.statAltitudeValue}
              </span>
              <span className="text-[12px] text-on-surface-variant/70 mt-0.5">
                {t.hero.statAltitudeLabel}
              </span>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="font-serif text-2xl sm:text-3xl font-semibold text-primary">
                {t.hero.statCapacityValue}
              </span>
              <span className="text-[12px] text-on-surface-variant/70 mt-0.5">
                {t.hero.statCapacityLabel}
              </span>
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="font-serif text-2xl sm:text-3xl font-semibold text-primary">
                {t.hero.statCheckinValue}
              </span>
              <span className="text-[12px] text-on-surface-variant/70 mt-0.5">
                {t.hero.statCheckinLabel}
              </span>
            </div>
          </div>
        </section>

        {/* ─── PRÓXIMAS CATAS SECTION (Double-Bezel Cards Grid) ─── */}
        <section id="proximas-catas" className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {t.tastings.badge}
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-on-surface tracking-tight">
                {t.tastings.title}
              </h2>
            </div>

            <Link
              href="/catas"
              className="text-[13px] font-semibold text-primary hover:text-primary-container inline-flex items-center gap-1.5 transition-colors"
            >
              {t.tastings.viewAll}
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-on-surface-variant/60 text-xs">
              <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
              {t.tastings.loading}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {tastings.map((tasting) => (
                <TastingCard key={tasting.id} tasting={tasting} currentLang={lang} />
              ))}
            </div>
          )}
        </section>

        <TerroirDivider className="max-w-[1320px] mx-auto px-5" />

        {/* ─── EDITORIAL TERROIR SPLIT ─── */}
        <section id="terroir" className="py-24 sm:py-36 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Big Image in Double-Bezel Frame */}
            <div className="lg:col-span-6 p-2 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
              <div className="relative rounded-[calc(2.5rem-0.5rem)] overflow-hidden aspect-[4/3] w-full bg-surface-container">
                <Image
                  src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop"
                  alt="Viñedos El Origen en el Valle de Uco"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Right Column: Editorial Narrative */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  {t.terroir.badge}
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-on-surface tracking-tight leading-[1.12]">
                {t.terroir.title}
              </h2>

              <p className="text-[14px] sm:text-base text-on-surface-variant/80 leading-relaxed font-normal">
                {t.terroir.p1}
              </p>

              <p className="text-[14px] sm:text-base text-on-surface-variant/80 leading-relaxed font-normal">
                {t.terroir.p2}
              </p>

              <div className="pt-2">
                <Link
                  href="/nosotros"
                  className="group inline-flex items-center gap-3 text-[13px] font-semibold text-primary hover:text-primary-container transition-colors"
                >
                  <span>{t.terroir.cta}</span>
                  <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── LIVE SENSORY TASTING CALLOUT ─── */}
        <section className="py-16 sm:py-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
          <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-black/[0.03] border border-black/[0.05]">
            <div className="rounded-[calc(2.5rem-0.625rem)] bg-[#5C0531] text-white p-8 sm:p-14 lg:p-16 relative overflow-hidden">
              <div className="max-w-2xl space-y-6 relative z-10">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37] bg-white/10 px-3.5 py-1 rounded-full backdrop-blur-sm">
                  {t.liveDemo.badge}
                </span>

                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
                  {t.liveDemo.title}
                </h2>

                <p className="text-[14px] sm:text-base text-white/80 leading-relaxed font-normal">
                  {t.liveDemo.description}
                </p>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/cata-en-vivo/tok-demo-1234"
                    className="group inline-flex items-center justify-between sm:justify-start gap-4 bg-white text-primary hover:bg-[#faf8f7] text-[13px] font-semibold pl-6 pr-2 py-2 rounded-full transition-all duration-300 shadow-sm active:scale-[0.98]"
                  >
                    <span>{t.liveDemo.cta}</span>
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ACCORDION SECTION ─── */}
        <section className="py-20 sm:py-28 px-5 sm:px-8 lg:px-12 max-w-4xl mx-auto w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t.faq.badge}
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight">
              {t.faq.title}
            </h2>
          </div>

          <div className="p-2 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
            <div className="bg-white rounded-[calc(2.5rem-0.5rem)] p-6 sm:p-8 divide-y divide-black/[0.05]">
              {t.faq.items.map((faq, idx) => (
                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 font-serif text-lg font-semibold text-on-surface hover:text-primary transition-colors py-1"
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`material-symbols-outlined text-primary text-[20px] transition-transform duration-300 ${
                        openFaq === idx ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {openFaq === idx && (
                    <div className="pt-3 text-[13px] text-on-surface-variant/80 leading-relaxed animate-fade-in font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CONTACT & PRIVATE TASTINGS BANNER ─── */}
        <section id="contacto" className="py-16 sm:py-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface">
              {t.custom.title}
            </h2>
            <p className="text-[13px] sm:text-sm text-on-surface-variant/80">
              {t.custom.subtitle}
            </p>
            <div className="pt-3">
              <Link
                href="/privadas"
                className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-primary border border-primary/30 hover:bg-primary hover:text-white px-6 py-3 rounded-full transition-all duration-300"
              >
                {t.custom.cta}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
