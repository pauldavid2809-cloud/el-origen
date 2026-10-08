"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { translations } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

/* Página 404 bilingüe para rutas inexistentes y llamadas a notFound(). */
export default function NotFound() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: translations.es.notFound.title, en: translations.en.notFound.title });
  const t = translations[lang].notFound;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        <PageHeader eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/catas"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-primary-container hover:bg-primary text-white text-[14px] font-semibold rounded transition-colors"
            >
              {t.ctaPrimary}
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-7 border border-on-surface/20 hover:border-primary-container text-on-surface hover:text-primary-container text-[14px] font-semibold rounded transition-colors"
            >
              {t.ctaSecondary}
            </Link>
          </div>
        </PageHeader>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
