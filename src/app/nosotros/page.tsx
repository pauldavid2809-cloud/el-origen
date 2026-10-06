"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader, Logo, SunBurst } from "@/components/Brand";
import { translations, Language } from "@/lib/i18n";

export default function NosotrosPage() {
  const [lang, setLang] = useState<Language>("es");

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

  const rows = [
    {
      badge: t.winery.section1Badge,
      title: t.winery.section1Title,
      p: [t.winery.section1P1, t.winery.section1P2],
      img: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop",
      alt: lang === "es" ? "Copa de vino tinto frente a un viñedo" : "Glass of red wine overlooking a vineyard",
    },
    {
      badge: t.winery.section2Badge,
      title: t.winery.section2Title,
      p: [t.winery.section2P1, t.winery.section2P2],
      img: "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=1200&auto=format&fit=crop",
      alt: lang === "es" ? "Tanques de acero en una bodega" : "Steel tanks in a winery cellar",
    },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={handleLanguageChange} />

      <main className="flex-grow">
        <PageHeader
          eyebrow={t.winery.badge}
          title={
            <>
              {t.winery.titleMain} <em className="italic font-normal text-primary-container">{t.winery.titleHighlight}</em>
            </>
          }
          subtitle={t.winery.subtitle}
        />

        {/* El logo como manifiesto */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-16 sm:py-24 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-5 flex justify-center">
            <Logo variant="full" className="w-64 sm:w-80" />
          </div>
          <blockquote className="md:col-span-7 md:pl-10 md:border-l border-outline-variant">
            <p className="font-serif text-[1.65rem] sm:text-4xl leading-snug text-on-surface text-balance">
              {lang === "es"
                ? "La montaña, el sol y la copa: volver al origen de cada vino, con Caracas como punto de partida."
                : "The mountain, the sun and the glass: going back to the origin of every wine, with Caracas as our starting point."}
            </p>
          </blockquote>
        </section>

        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pb-12 space-y-24 sm:space-y-32">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className={`lg:col-span-5 ${i % 2 ? "lg:order-2 lg:col-start-8" : ""}`}>
                <div className="relative arch overflow-hidden aspect-[4/5] max-w-md mx-auto bg-surface-container border border-outline-variant">
                  <Image src={row.img} alt={row.alt} fill sizes="(min-width: 1024px) 35vw, 90vw" className="object-cover" />
                </div>
              </div>

              <div className={`lg:col-span-6 ${i % 2 ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"} space-y-5`}>
                <p className="eyebrow">{row.badge}</p>
                <h2 className="font-serif text-[2rem] sm:text-5xl leading-[1.1] text-on-surface text-balance">{row.title}</h2>
                {row.p.map((para, j) => (
                  <p key={j} className="text-[16px] text-on-surface-variant leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-24 sm:py-32">
          <div className="relative overflow-hidden rounded-2xl bg-primary-container text-paper text-center px-6 py-16 sm:py-20">
            <SunBurst className="w-20 mx-auto text-sun mb-6" />
            <h2 className="font-serif text-[2rem] sm:text-5xl leading-tight max-w-2xl mx-auto text-balance">{t.winery.ctaTitle}</h2>
            <p className="mt-5 text-[15px] sm:text-base text-paper/80 max-w-xl mx-auto">{t.winery.ctaSubtitle}</p>
            <Link
              href="/catas"
              className="mt-9 inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-paper text-primary hover:bg-white text-[14px] font-semibold rounded transition-colors"
            >
              {t.winery.ctaButton}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
