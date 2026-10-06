"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TastingCard } from "@/components/TastingCard";
import { CommercialShowcase } from "@/components/CommercialShowcase";
import { PartnersSection } from "@/components/PartnersSection";
import { AvilaRidge, SectionHeading, SunBurst } from "@/components/Brand";
import { Tasting } from "@/types";
import { translations, Language } from "@/lib/i18n";

export default function HomePage() {
  const [lang, setLang] = useState<Language>("es");
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
  const es = lang === "es";

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

  const next = tastings.find((x) => x.availableSpots > 0) ?? tastings[0];

  const stats = [
    { value: t.hero.statAltitudeValue, label: t.hero.statAltitudeLabel },
    { value: t.hero.statCapacityValue, label: t.hero.statCapacityLabel },
    { value: t.hero.statCheckinValue, label: t.hero.statCheckinLabel },
  ];

  const ritual = es
    ? [
        { n: "01", title: "Curaduría", text: "Etiquetas de colección elegidas copa a copa con un hilo conductor en cada fecha." },
        { n: "02", title: "Maridaje", text: "Bocados de autor junto a aliados gastronómicos de Caracas." },
        { n: "03", title: "Conversación", text: "Grupos pequeños guiados por sommelier, sin prisa y sin solemnidad." },
      ]
    : [
        { n: "01", title: "Curation", text: "Collection labels chosen glass by glass, with a common thread on every date." },
        { n: "02", title: "Pairing", text: "Signature bites alongside culinary partners from Caracas." },
        { n: "03", title: "Conversation", text: "Small groups guided by a sommelier — unhurried and never stuffy." },
      ];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={handleLanguageChange} />

      <main className="flex-grow">
        {/* ─── HERO ─── */}
        <section className="relative paper-grain -mt-16 sm:-mt-20 pt-28 sm:pt-36">
          <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            <div className="lg:col-span-7 animate-fade-in-up">
              <p className="eyebrow flex items-center gap-3 mb-7">
                <span className="h-px w-8 bg-primary-container/40" />
                {t.hero.eyebrow}
              </p>
              <h1 className="font-serif text-[2.75rem] leading-[1.04] sm:text-6xl lg:text-[5.25rem] text-on-surface text-balance">
                {t.hero.titleMain}{" "}
                <em className="italic font-normal text-primary-container">{t.hero.titleHighlight}</em>
              </h1>
              <p className="mt-7 text-[16px] sm:text-lg leading-relaxed text-on-surface-variant max-w-xl text-pretty">
                {t.hero.subtitle}
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/catas"
                  className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-primary-container hover:bg-primary text-white text-[14px] font-semibold rounded transition-colors"
                >
                  {t.hero.ctaPrimary}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <a
                  href="#proximas-catas"
                  className="inline-flex items-center justify-center gap-2 h-[52px] px-7 border border-on-surface/20 hover:border-primary-container text-on-surface hover:text-primary-container text-[14px] font-semibold rounded transition-colors"
                >
                  {t.hero.ctaSecondary}
                </a>
              </div>
            </div>

            {/* Imagen en arco + próxima fecha */}
            <div className="lg:col-span-5 relative max-w-md w-full mx-auto lg:max-w-none animate-fade-in">
              <SunBurst className="absolute -top-10 -right-2 sm:-right-6 w-24 sm:w-28 text-sun z-10" />
              <div className="relative arch overflow-hidden aspect-[4/5] bg-surface-container border border-outline-variant">
                <Image
                  src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop"
                  alt={es ? "Copa de vino tinto servida en una cata de El Origen" : "Red wine served at an El Origen tasting"}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
              </div>

              {next && (
                <Link
                  href={`/catas/${next.slug || next.id}`}
                  className="absolute -bottom-6 left-0 sm:-left-8 right-8 sm:right-auto sm:w-[300px] flex bg-surface-container-lowest border border-outline-variant rounded-lg shadow-elevated overflow-hidden hover:border-primary-container/50 transition-colors"
                >
                  <span className="w-[72px] flex-shrink-0 flex flex-col items-center justify-center bg-primary-container text-paper py-3">
                    <span className="font-serif text-[28px] leading-none">{next.dateDisplay.split(" ")[0]}</span>
                    <span className="text-[10px] font-semibold tracking-[0.2em] mt-1">{next.dateDisplay.split(" ")[1]}</span>
                  </span>
                  <span className="p-3.5 min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                      {es ? "Próxima cata" : "Next tasting"}
                    </span>
                    <span className="block font-serif text-[15px] leading-snug text-on-surface line-clamp-2 mt-0.5">{next.title}</span>
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Línea del Ávila → banda vino */}
          <div className="mt-20 sm:mt-24 text-primary-container relative">
            <AvilaRidge fill="var(--wine)" stroke="var(--wine)" showBirds showValley={false} className="h-20 sm:h-32 -mb-px" />
          </div>
          <div className="bg-primary-container text-paper">
            <dl className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pb-12 sm:pb-16 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
              {stats.map((s, i) => (
                <div key={i} className={`sm:px-6 ${i > 0 ? "sm:border-l border-paper/20" : ""}`}>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.2em] text-sun">{s.label}</dt>
                  <dd className="font-serif text-3xl sm:text-4xl mt-2">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ─── PRÓXIMAS CATAS ─── */}
        <section id="proximas-catas" className="scroll-mt-24 py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 mb-12 sm:mb-16">
            <SectionHeading index="01" eyebrow={t.tastings.badge} title={t.tastings.title} subtitle={t.tastings.subtitle} />
            <Link
              href="/catas"
              className="group inline-flex items-center gap-2 text-[14px] font-semibold text-primary-container whitespace-nowrap"
            >
              {t.tastings.viewAll}
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label={t.tastings.loading}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[520px] rounded-xl border border-outline-variant bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {tastings.map((tasting) => (
                <TastingCard key={tasting.id} tasting={tasting} currentLang={lang} />
              ))}
            </div>
          )}
        </section>

        {/* ─── CURADURÍA ─── */}
        <section id="terroir" className="scroll-mt-24 bg-surface-container-low border-y border-outline-variant">
          <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center">
            <div className="lg:col-span-5 grid grid-cols-5 gap-4 items-end">
              <div className="col-span-3 relative arch overflow-hidden aspect-[3/4] bg-surface-container">
                <Image
                  src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=900&auto=format&fit=crop"
                  alt={es ? "Copa de vino tinto frente a un viñedo" : "Glass of red wine overlooking a vineyard"}
                  fill
                  sizes="(min-width: 1024px) 25vw, 60vw"
                  className="object-cover"
                />
              </div>
              <div className="col-span-2 relative rounded-lg overflow-hidden aspect-[3/4] bg-surface-container mb-10">
                <Image
                  src="https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=600&auto=format&fit=crop"
                  alt={es ? "Tanques de acero en una bodega" : "Steel tanks in a winery cellar"}
                  fill
                  sizes="(min-width: 1024px) 16vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 lg:pl-8">
              <SectionHeading index="02" eyebrow={t.terroir.badge} title={t.terroir.title} />
              <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-on-surface-variant max-w-xl">
                <p>{t.terroir.p1}</p>
                <p>{t.terroir.p2}</p>
              </div>

              <ol className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5 border-t border-outline-variant pt-8">
                {ritual.map((r) => (
                  <li key={r.n}>
                    <span className="font-serif italic text-tertiary text-lg">{r.n}</span>
                    <h3 className="font-serif text-xl text-on-surface mt-1">{r.title}</h3>
                    <p className="text-[14px] text-on-surface-variant leading-relaxed mt-2">{r.text}</p>
                  </li>
                ))}
              </ol>

              <Link
                href="/nosotros"
                className="group mt-10 inline-flex items-center gap-2 text-[14px] font-semibold text-primary-container"
              >
                {t.terroir.cta}
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FICHA SENSORIAL ─── */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-24 sm:py-32">
          <div className="relative overflow-hidden rounded-2xl bg-ink text-paper">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 p-8 sm:p-14 lg:p-16 relative z-10">
                <SectionHeading
                  index="03"
                  eyebrow={t.liveDemo.badge}
                  title={t.liveDemo.title}
                  subtitle={t.liveDemo.description}
                  tone="dark"
                />
                <Link
                  href="/cata-en-vivo/tok-demo-1234"
                  className="mt-9 inline-flex items-center gap-2 h-[52px] px-7 bg-sun hover:bg-tertiary-fixed-dim text-ink text-[14px] font-semibold rounded transition-colors"
                >
                  {t.liveDemo.cta}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>

              {/* Rueda de aromas ilustrada */}
              <div className="lg:col-span-5 flex items-center justify-center p-10 lg:p-12 pt-0 lg:pt-12" aria-hidden="true">
                <svg viewBox="0 0 200 200" className="w-56 sm:w-72 text-sun">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i * 30 * Math.PI) / 180;
                    return (
                      <line key={i} x1={100 + Math.cos(a) * 34} y1={100 + Math.sin(a) * 34} x2={100 + Math.cos(a) * 92} y2={100 + Math.sin(a) * 92} stroke="currentColor" strokeOpacity="0.25" />
                    );
                  })}
                  {[34, 58, 92].map((r) => (
                    <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeOpacity={r === 92 ? 0.5 : 0.25} />
                  ))}
                  <polygon
                    points={[78, 60, 85, 50, 70, 88, 64, 80, 74, 56, 86, 66]
                      .map((r, i) => {
                        const a = ((i * 30 - 90) * Math.PI) / 180;
                        return `${100 + Math.cos(a) * r},${100 + Math.sin(a) * r}`;
                      })
                      .join(" ")}
                    fill="var(--wine)"
                    fillOpacity="0.55"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* ─── ALIADOS ─── */}
        <PartnersSection currentLang={lang} />

        {/* ─── MARCAS & PATROCINIO ─── */}
        <CommercialShowcase currentLang={lang} />

        {/* ─── FAQ ─── */}
        <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <SectionHeading index="06" eyebrow={t.faq.badge} title={t.faq.title} />
          </div>
          <div className="lg:col-span-8 border-t border-outline-variant">
            {t.faq.items.map((faq, idx) => {
              const open = openFaq === idx;
              return (
                <div key={idx} className="border-b border-outline-variant">
                  <button
                    onClick={() => setOpenFaq(open ? null : idx)}
                    aria-expanded={open}
                    className="w-full flex items-start justify-between text-left gap-6 py-6 font-serif text-[19px] sm:text-[22px] leading-snug text-on-surface hover:text-primary-container transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`material-symbols-outlined flex-shrink-0 mt-0.5 text-primary-container transition-transform duration-300 ${open ? "rotate-45" : ""}`}
                    >
                      add
                    </span>
                  </button>
                  {open && (
                    <p className="pb-7 -mt-1 pr-10 text-[15px] text-on-surface-variant leading-relaxed animate-fade-in">{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── CONTACTO / PRIVADAS ─── */}
        <section id="contacto" className="scroll-mt-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pb-20 sm:pb-28">
          <div className="relative text-center border border-outline-variant rounded-2xl bg-surface-container-lowest px-6 sm:px-12 pt-14 sm:pt-20 overflow-hidden">
            <p className="eyebrow mb-5">{es ? "Catas privadas" : "Private tastings"}</p>
            <h2 className="font-serif text-[2rem] sm:text-5xl leading-tight text-on-surface max-w-2xl mx-auto text-balance">{t.custom.title}</h2>
            <p className="mt-5 text-[15px] sm:text-base text-on-surface-variant max-w-xl mx-auto leading-relaxed">{t.custom.subtitle}</p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/privadas"
                className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-primary-container hover:bg-primary text-white text-[14px] font-semibold rounded transition-colors"
              >
                {t.custom.cta}
              </Link>
              <a
                href="https://wa.me/584141074007"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-[52px] px-7 border border-on-surface/20 hover:border-primary-container hover:text-primary-container text-[14px] font-semibold rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                WhatsApp
              </a>
            </div>
            <div className="mt-14 text-primary-container/30">
              <AvilaRidge strokeWidth={1.5} showBirds className="h-16 sm:h-24" />
            </div>
          </div>
        </section>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
