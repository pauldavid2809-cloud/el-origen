"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { WineCard, type PublicWine } from "@/components/WineCard";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { WINES_COPY } from "./copy";

export function WinesCatalog({ wines }: { wines: PublicWine[] }) {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Nuestros vinos", en: "Our wines" });
  const t = WINES_COPY[lang];

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

        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pt-8 pb-24">
          {wines.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16">
              <span className="material-symbols-outlined text-5xl text-primary-container/60" aria-hidden="true">wine_bar</span>
              <h2 className="font-serif text-2xl mt-4">{t.emptyTitle}</h2>
              <p className="mt-2 text-on-surface-variant">{t.emptyText}</p>
              <Link
                href="/catas"
                className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold"
              >
                {t.seeTastings}
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
              {wines.map((wine) => (
                <li key={wine.id}>
                  <WineCard wine={wine} lang={lang} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
