"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TastingCard, TastingsEmptyState, TastingsLoadError, useBcvRates } from "@/components/TastingCard";
import { CommercialShowcase } from "@/components/CommercialShowcase";
import { PartnersSection } from "@/components/PartnersSection";
import { AvilaRidge, SectionHeading, SunBurst } from "@/components/Brand";
import { Tasting } from "@/types";
import { translations } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { BUSINESS_HOURS, CONTACT, whatsappLink } from "@/lib/contact";
import { TEAM, instagramUrl, teamInitials } from "@/lib/team";

/** Ficha de cata en vivo de demostración. */
const LIVE_DEMO_PATH = "/cata-en-vivo/tok-demo-1234";

type LoadState = "loading" | "ready" | "error";

export default function HomePage() {
  const [lang, setLang] = useLang();
  const t = translations[lang];

  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [status, setStatus] = useState<LoadState>("loading");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const rates = useBcvRates();

  const loadTastings = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/tastings");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setTastings(Array.isArray(data.tastings) ? data.tastings : []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadTastings();
  }, [loadTastings]);

  const next = tastings.find((x) => x.availableSpots > 0 && x.status !== "sold_out") ?? tastings[0];
  const featured = tastings.slice(0, 3);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        {/* ─── HERO ─── */}
        <section className="relative paper-grain -mt-16 sm:-mt-20 pt-28 sm:pt-36">
          <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            <div className="lg:col-span-7 animate-fade-in-up">
              <p className="eyebrow flex items-center gap-3 mb-7">
                <span className="h-px w-8 bg-primary-container/40" />
                {t.hero.eyebrow}
              </p>
              <h1 className="font-serif text-[2.6rem] leading-[1.06] sm:text-6xl lg:text-[5rem] text-on-surface text-balance">
                {t.hero.titleMain} <em className="italic font-normal text-primary-container">{t.hero.titleHighlight}</em>
              </h1>
              <p className="mt-7 text-[16px] sm:text-lg leading-relaxed text-on-surface-variant max-w-xl text-pretty">{t.hero.subtitle}</p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/catas"
                  className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-primary-container hover:bg-primary text-white text-[14px] font-semibold rounded transition-colors"
                >
                  {t.hero.ctaPrimary}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                </Link>
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center gap-2 h-[52px] px-7 border border-on-surface/20 hover:border-primary-container text-on-surface hover:text-primary-container text-[14px] font-semibold rounded transition-colors"
                >
                  {t.hero.ctaSecondary}
                </Link>
              </div>
            </div>

            {/* Imagen en arco + próxima fecha */}
            <div className="lg:col-span-5 relative max-w-md w-full mx-auto lg:max-w-none animate-fade-in">
              <SunBurst className="absolute -top-10 -right-2 sm:-right-6 w-24 sm:w-28 text-sun z-10" />
              <div className="relative arch overflow-hidden aspect-[4/5] bg-surface-container border border-outline-variant">
                <Image
                  src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop"
                  alt={t.hero.imageAlt}
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
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-tertiary">{t.hero.nextTasting}</span>
                    <span className="block font-serif text-[15px] leading-snug text-on-surface line-clamp-2 mt-0.5">{next.title}</span>
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Línea del Ávila → banda vino con datos de la experiencia */}
          <div className="mt-20 sm:mt-24 text-primary-container relative">
            <AvilaRidge fill="var(--wine)" stroke="var(--wine)" showBirds showValley={false} className="h-20 sm:h-32 -mb-px" />
          </div>
          <div className="bg-primary-container text-paper">
            <dl className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pb-12 sm:pb-16 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
              {t.hero.stats.map((s, i) => (
                <div key={s.label} className={`sm:px-6 ${i > 0 ? "sm:border-l border-paper/20" : ""}`}>
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.2em] text-tertiary-fixed-dim">{s.label}</dt>
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
            {tastings.length > 0 && (
              <Link
                href="/catas"
                className="group inline-flex items-center gap-2 min-h-[44px] text-[14px] font-semibold text-primary-container whitespace-nowrap"
              >
                {t.tastings.viewAll}
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            )}
          </div>

          {status === "loading" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label={t.tastings.loading}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[520px] rounded-xl border border-outline-variant bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : status === "error" ? (
            <TastingsLoadError lang={lang} onRetry={loadTastings} />
          ) : featured.length === 0 ? (
            <TastingsEmptyState lang={lang} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featured.map((tasting) => (
                <TastingCard key={tasting.id} tasting={tasting} currentLang={lang} rates={rates} />
              ))}
            </div>
          )}
        </section>

        {/* ─── NOSOTROS ─── */}
        <section id="nosotros" className="scroll-mt-24 bg-surface-container-low border-y border-outline-variant">
          <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center">
            <div className="lg:col-span-5 grid grid-cols-5 gap-4 items-end">
              <div className="col-span-3 relative arch overflow-hidden aspect-[3/4] bg-surface-container">
                <Image
                  src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=900&auto=format&fit=crop"
                  alt={t.story.imageMainAlt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 60vw"
                  className="object-cover"
                />
              </div>
              <div className="col-span-2 relative rounded-lg overflow-hidden aspect-[3/4] bg-surface-container mb-10">
                <Image
                  src="https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=600&auto=format&fit=crop"
                  alt={t.story.imageSideAlt}
                  fill
                  sizes="(min-width: 1024px) 16vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 lg:pl-8">
              <SectionHeading index="02" eyebrow={t.story.badge} title={t.story.title} />
              <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-on-surface-variant max-w-xl">
                <p>{t.story.p1}</p>
                <p>{t.story.p2}</p>
              </div>

              <ol className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5 border-t border-outline-variant pt-8">
                {t.story.ritual.map((r) => (
                  <li key={r.n}>
                    <span className="font-serif italic text-tertiary text-lg" aria-hidden="true">{r.n}</span>
                    <h3 className="font-serif text-xl text-on-surface mt-1">{r.title}</h3>
                    <p className="text-[14px] text-on-surface-variant leading-relaxed mt-2">{r.text}</p>
                  </li>
                ))}
              </ol>

              <Link href="/nosotros" className="group mt-10 inline-flex items-center gap-2 min-h-[44px] text-[14px] font-semibold text-primary-container">
                {t.story.cta}
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── SOMMELIERS ─── */}
        <section id="sommeliers" className="scroll-mt-24 py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 mb-12 sm:mb-14">
            <SectionHeading index="03" eyebrow={t.team.badge} title={t.team.title} subtitle={t.team.subtitle} />
            <Link
              href="/nosotros#sommeliers"
              className="group inline-flex items-center gap-2 min-h-[44px] text-[14px] font-semibold text-primary-container whitespace-nowrap"
            >
              {t.team.cta}
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {TEAM.map((member) => (
              <li key={member.id} className="flex flex-col p-6 sm:p-7 rounded-xl border border-outline-variant bg-surface-container-lowest">
                <div className="flex items-center gap-4">
                  {member.photoUrl ? (
                    // Las fotos pueden venir de Supabase Storage o ser data URL: <img> evita depender de images.remotePatterns.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover flex-shrink-0 border border-outline-variant" />
                  ) : (
                    <span
                      className="w-16 h-16 rounded-full flex-shrink-0 bg-primary-container text-paper flex items-center justify-center font-serif text-[22px] tracking-wide"
                      aria-hidden="true"
                    >
                      {teamInitials(member.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-serif text-[21px] leading-snug text-on-surface">{member.name}</h3>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-tertiary mt-1 leading-snug">{member.role[lang]}</p>
                  </div>
                </div>
                <p className="mt-5 text-[14px] text-on-surface-variant leading-relaxed line-clamp-4">{member.bio[lang]}</p>
                {member.instagram && (
                  <a
                    href={instagramUrl(member.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.team.instagram(member.instagram)}
                    className="mt-auto pt-4 inline-flex items-center gap-1.5 min-h-[44px] text-[13px] font-semibold text-primary-container hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">photo_camera</span>
                    {member.instagram}
                  </a>
                )}
              </li>
            ))}
          </ul>

          <Link
            href="/sommeliers"
            className="group mt-8 inline-flex items-center gap-2 min-h-[44px] text-[14px] font-semibold text-on-surface-variant hover:text-primary-container transition-colors"
          >
            {t.team.join}
            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </section>

        {/* ─── FICHA DE CATA INTERACTIVA ─── */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pb-24 sm:pb-32">
          <div className="relative overflow-hidden rounded-2xl bg-ink text-paper">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 p-8 sm:p-14 lg:p-16 relative z-10">
                <SectionHeading index="04" eyebrow={t.liveDemo.badge} title={t.liveDemo.title} subtitle={t.liveDemo.description} tone="dark" />
                <p className="mt-4 text-[13px] text-paper/60 leading-relaxed max-w-xl">{t.liveDemo.note}</p>
                <Link
                  href={LIVE_DEMO_PATH}
                  className="mt-9 inline-flex items-center gap-2 h-[52px] px-7 bg-sun hover:bg-tertiary-fixed-dim text-ink text-[14px] font-semibold rounded transition-colors"
                >
                  {t.liveDemo.cta}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                </Link>
              </div>

              {/* Rueda de aromas ilustrada */}
              <div className="lg:col-span-5 flex items-center justify-center p-10 lg:p-12 pt-0 lg:pt-12" aria-hidden="true">
                <svg viewBox="0 0 200 200" className="w-56 sm:w-72 text-sun">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i * 30 * Math.PI) / 180;
                    return (
                      <line
                        key={i}
                        x1={100 + Math.cos(a) * 34}
                        y1={100 + Math.sin(a) * 34}
                        x2={100 + Math.cos(a) * 92}
                        y2={100 + Math.sin(a) * 92}
                        stroke="currentColor"
                        strokeOpacity="0.25"
                      />
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
        <PartnersSection currentLang={lang} index="05" />

        {/* ─── ALIANZAS, SOMMELIERS Y PRIVADAS ─── */}
        <CommercialShowcase currentLang={lang} index="06" />

        {/* ─── FAQ ─── */}
        <section className="py-24 sm:py-32 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <SectionHeading index="07" eyebrow={t.faq.badge} title={t.faq.title} />
          </div>
          <div className="lg:col-span-8 border-t border-outline-variant">
            {t.faq.items.map((faq, idx) => {
              const open = openFaq === idx;
              const panelId = `faq-${idx}`;
              return (
                <div key={faq.q} className="border-b border-outline-variant">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="w-full flex items-start justify-between text-left gap-6 py-6 font-serif text-[19px] sm:text-[22px] leading-snug text-on-surface hover:text-primary-container transition-colors"
                    >
                      <span>{faq.q}</span>
                      <span
                        className={`material-symbols-outlined flex-shrink-0 mt-0.5 text-primary-container transition-transform duration-300 ${open ? "rotate-45" : ""}`}
                        aria-hidden="true"
                      >
                        add
                      </span>
                    </button>
                  </h3>
                  {open && (
                    <p id={panelId} className="pb-7 -mt-1 pr-10 text-[15px] text-on-surface-variant leading-relaxed animate-fade-in">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── CONTACTO ─── */}
        <section id="contacto" className="scroll-mt-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pb-20 sm:pb-28">
          <div className="relative text-center border border-outline-variant rounded-2xl bg-surface-container-lowest px-6 sm:px-12 pt-14 sm:pt-20 overflow-hidden">
            <p className="eyebrow mb-5">{t.contactSection.badge}</p>
            <h2 className="font-serif text-[2rem] sm:text-5xl leading-tight text-on-surface max-w-2xl mx-auto text-balance">
              {t.contactSection.title}
            </h2>
            <p className="mt-5 text-[15px] sm:text-base text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              {t.contactSection.subtitle(CONTACT.ownerName)}
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-primary-container hover:bg-primary text-white text-[14px] font-semibold rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                {t.contactSection.whatsapp}
              </a>
              <Link
                href="/registro"
                className="inline-flex items-center justify-center gap-2 h-[52px] px-7 border border-on-surface/20 hover:border-primary-container hover:text-primary-container text-[14px] font-semibold rounded transition-colors"
              >
                {t.contactSection.account}
              </Link>
            </div>

            <div className="mt-10 max-w-md mx-auto">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">{t.contactSection.hours}</p>
              <ul className="mt-3 space-y-1.5 text-[14px] text-on-surface-variant leading-relaxed">
                {BUSINESS_HOURS[lang].map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div className="mt-12 text-primary-container/30">
              <AvilaRidge strokeWidth={1.5} showBirds className="h-16 sm:h-24" />
            </div>
          </div>
        </section>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
