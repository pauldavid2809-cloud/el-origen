"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { EventGallery } from "@/components/EventGallery";
import { formatTastingDate } from "@/lib/dates";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { EVENTS_COPY } from "./copy";

export interface PastEvent {
  id: string;
  /** Galería del evento (/recuerdos/<slug>). */
  href: string;
  title: string;
  /** "YYYY-MM-DD" para mostrar la fecha en el idioma del visitante. */
  dateIso: string;
  /** Fecha en español. */
  date: string;
  location: string;
  cover: string;
  count: number;
}

export function EventsPage({ events }: { events: PastEvent[] }) {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Eventos realizados", en: "Past events" });
  const t = EVENTS_COPY[lang];

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

        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pt-8 pb-20 sm:pb-24">
          {events.length === 0 ? (
            <div className="max-w-md py-6">
              <h2 className="font-serif text-2xl">{t.emptyTitle}</h2>
              <p className="mt-2 text-on-surface-variant">{t.emptyText}</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {events.map((e) => (
                <li key={e.id}>
                  <Link href={e.href} aria-label={t.open(e.title)} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-container">
                      {/* Las fotos vienen de Supabase Storage (o data URL en pruebas locales). */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.cover}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-semibold text-white">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">photo_library</span>
                        {t.photos(e.count)}
                      </span>
                    </div>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                      {formatTastingDate(e.dateIso, lang, e.date)}
                    </p>
                    <h2 className="mt-1 font-serif text-2xl leading-snug text-on-surface transition-colors group-hover:text-primary-container">{e.title}</h2>
                    {e.location && <p className="mt-0.5 text-[14px] text-on-surface-variant">{e.location}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Fotos reales de nuestras catas */}
        <EventGallery currentLang={lang} />

        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pb-24 sm:pb-32 -mt-8 text-center">
          <p className="font-serif text-2xl sm:text-3xl text-on-surface">{t.nextTitle}</p>
          <Link
            href="/catas"
            className="mt-6 inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-primary-container hover:bg-primary text-white text-[14px] font-semibold rounded transition-colors"
          >
            {t.nextCta}
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </section>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
