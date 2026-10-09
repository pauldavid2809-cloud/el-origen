"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AvilaRidge, Logo, PageHeader, SectionHeading, SunBurst } from "@/components/Brand";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Language } from "@/lib/i18n";
import { TEAM, instagramUrl, teamInitials, type TeamMember } from "@/lib/team";
import { PhotoStrip } from "@/components/PhotoStrip";
import { PHOTOS } from "@/lib/photos";
import { NOSOTROS_COPY } from "./copy";

export default function NosotrosPage() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Nosotros: nuestra historia y sommeliers", en: "About us: our story and sommeliers" });
  const t = NOSOTROS_COPY[lang];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        <PageHeader
          eyebrow={t.eyebrow}
          title={
            <>
              {t.titleMain} <em className="italic font-normal text-primary-container">{t.titleHighlight}</em>
            </>
          }
          subtitle={t.subtitle}
        />

        {/* Historia */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-12 sm:pt-16 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-4">{t.historyEyebrow}</p>
            <h2 className="font-serif text-[2rem] sm:text-5xl leading-[1.1] text-on-surface">{t.historyTitle}</h2>
          </div>
          <div className="lg:col-span-8 space-y-6 max-w-3xl">
            {t.history.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "font-serif text-[1.3rem] sm:text-[1.6rem] leading-snug text-on-surface text-pretty"
                    : "text-[16px] sm:text-[18px] text-on-surface-variant leading-relaxed text-pretty"
                }
              >
                {p}
              </p>
            ))}
          </div>
          <PhotoStrip
            photos={[PHOTOS.sommelierExplica, PHOTOS.invitadoMapas, PHOTOS.sommelierGuiaItalia]}
            lang={lang}
            caption={t.photosCaption}
            className="lg:col-span-12 mt-4 sm:mt-8"
          />
        </section>

        {/* Lema */}
        <section className="bg-primary-container text-paper relative overflow-hidden" aria-label={t.mottoLabel}>
          <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-24 pb-6 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-4 flex justify-center md:justify-start">
              <Logo tone="white" variant="full" className="w-48 sm:w-60" />
            </div>
            <figure className="md:col-span-8 md:pl-10 md:border-l border-paper/20">
              <figcaption className="text-[12px] font-semibold uppercase tracking-[0.22em] text-sun">{t.mottoLabel}</figcaption>
              <blockquote className="mt-4">
                <p className="font-serif italic text-[2.1rem] sm:text-5xl lg:text-6xl leading-[1.1] text-balance">{t.motto}</p>
              </blockquote>
            </figure>
          </div>
          <div className="text-paper/25">
            <AvilaRidge strokeWidth={1.5} showBirds className="h-16 sm:h-24" />
          </div>
        </section>

        {/* Sommeliers */}
        <section id="sommeliers" className="scroll-mt-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full py-20 sm:py-28">
          <SectionHeading eyebrow={t.teamEyebrow} title={t.teamTitle} subtitle={t.teamSubtitle} />
          <ul className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {TEAM.map((member) => (
              <TeamCard key={member.id} member={member} lang={lang} />
            ))}
          </ul>
        </section>

        {/* Red de sommeliers */}
        <section className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pb-20 sm:pb-28">
          <div className="relative text-center border border-outline-variant rounded-2xl bg-surface-container-lowest px-6 sm:px-12 pt-14 sm:pt-20 overflow-hidden">
            <SunBurst className="w-16 mx-auto text-sun mb-5" />
            <p className="eyebrow mb-4">{t.joinEyebrow}</p>
            <h2 className="font-serif text-[2rem] sm:text-5xl leading-tight text-on-surface max-w-3xl mx-auto text-balance">
              {t.joinTitle}
            </h2>
            <p className="mt-5 text-[15px] sm:text-base text-on-surface-variant max-w-xl mx-auto leading-relaxed">{t.joinText}</p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/sommeliers"
                className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-primary-container hover:bg-primary text-white text-[14px] font-semibold rounded transition-colors"
              >
                {t.joinCta}
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
              </Link>
              <Link
                href="/catas"
                className="inline-flex items-center justify-center gap-2 h-[52px] px-7 border border-on-surface/20 hover:border-primary-container hover:text-primary-container text-[14px] font-semibold rounded transition-colors"
              >
                {t.tastingsCta}
              </Link>
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

function TeamCard({ member, lang }: { member: TeamMember; lang: Language }) {
  const t = NOSOTROS_COPY[lang];
  return (
    <li className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-8 flex flex-col">
      <div className="flex items-center gap-5">
        {member.photoUrl ? (
          <span className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex-shrink-0 bg-surface-container border border-outline-variant">
            {/* Las fotos subidas pueden venir de Storage o como data URL: sin optimizar. */}
            <Image src={member.photoUrl} alt={member.name} fill sizes="96px" unoptimized className="object-cover" />
          </span>
        ) : (
          <span
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex-shrink-0 flex items-center justify-center bg-primary-fixed text-primary-container border border-primary-container/15 font-serif text-[1.75rem] sm:text-[2rem] tracking-wide"
            aria-hidden="true"
          >
            {teamInitials(member.name)}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-serif text-2xl leading-tight text-on-surface">{member.name}</h3>
          <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-tertiary">{member.role[lang]}</p>
        </div>
      </div>
      <p className="mt-6 text-[15px] sm:text-[16px] text-on-surface-variant leading-relaxed text-pretty">{member.bio[lang]}</p>
      {member.instagram && (
        <a
          href={instagramUrl(member.instagram)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 self-start inline-flex items-center gap-2 min-h-[44px] text-[14px] font-semibold text-primary-container hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">photo_camera</span>
          <span className="sr-only">{t.instagramLabel(member.name)}: </span>
          {member.instagram}
        </a>
      )}
    </li>
  );
}
