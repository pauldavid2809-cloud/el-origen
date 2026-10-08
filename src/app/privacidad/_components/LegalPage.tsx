"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Language } from "@/lib/i18n";
import { CONTACT, whatsappLink } from "@/lib/contact";
import { RichText } from "../../privadas/_components/RichText";

/* Plantilla de las páginas legales (/privacidad y /terminos). En los textos, **texto** va en negrita. */

export type LegalBlock = { p: string } | { list: string[] };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  eyebrow: string;
  title: string;
  updatedLabel: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  /** Enlace al otro documento legal. */
  related: { href: string; label: string };
}

const CONTACT_COPY = {
  es: {
    title: "¿Dudas o solicitudes?",
    text: "Escríbenos por cualquiera de nuestros canales de atención.",
    whatsapp: "WhatsApp",
    email: "Correo",
    seeAlso: "Consulta también",
  },
  en: {
    title: "Questions or requests?",
    text: "Reach us through any of our customer service channels.",
    whatsapp: "WhatsApp",
    email: "Email",
    seeAlso: "See also",
  },
} satisfies Record<Language, unknown>;

export function LegalPage({ documents }: { documents: Record<Language, LegalDocument> }) {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: documents.es.title, en: documents.en.title });
  const doc = documents[lang];
  const c = CONTACT_COPY[lang];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        <PageHeader eyebrow={doc.eyebrow} title={doc.title}>
          <p className="mt-6 text-[14px] text-on-surface-variant">
            <strong className="font-semibold text-on-surface">{doc.updatedLabel}</strong> {doc.updated}
          </p>
        </PageHeader>

        <div className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-10 sm:pt-14 pb-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <article className="lg:col-span-8 max-w-3xl min-w-0">
            <p className="font-serif text-[1.25rem] sm:text-[1.45rem] leading-snug text-on-surface text-pretty">
              <RichText text={doc.intro} />
            </p>

            <div className="mt-12 space-y-10">
              {doc.sections.map((section) => (
                <section key={section.title} className="border-t border-outline-variant pt-8">
                  <h2 className="font-serif text-2xl sm:text-[1.75rem] leading-snug text-on-surface">{section.title}</h2>
                  <div className="mt-4 space-y-4 text-[16px] text-on-surface-variant leading-relaxed text-pretty">
                    {section.blocks.map((block, i) =>
                      "p" in block ? (
                        <p key={i}>
                          <RichText text={block.p} />
                        </p>
                      ) : (
                        <ul key={i} className="space-y-3">
                          {block.list.map((item) => (
                            <li key={item} className="flex gap-3">
                              <span className="mt-[0.6rem] w-1.5 h-1.5 rounded-full bg-primary-container flex-shrink-0" aria-hidden="true" />
                              <span>
                                <RichText text={item} />
                              </span>
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
              <h2 className="font-serif text-xl text-on-surface">{c.title}</h2>
              <p className="mt-2 text-[14px] text-on-surface-variant leading-relaxed">{c.text}</p>
              <ul className="mt-5 space-y-1">
                <li>
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 min-h-[44px] text-[15px] text-on-surface hover:text-primary-container"
                  >
                    <span className="material-symbols-outlined text-[20px] text-primary-container" aria-hidden="true">chat</span>
                    <span>
                      <span className="sr-only">{c.whatsapp}: </span>
                      {CONTACT.phoneDisplay}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="flex items-center gap-3 min-h-[44px] text-[15px] text-on-surface hover:text-primary-container break-all"
                  >
                    <span className="material-symbols-outlined text-[20px] text-primary-container" aria-hidden="true">mail</span>
                    <span>
                      <span className="sr-only">{c.email}: </span>
                      {CONTACT.email}
                    </span>
                  </a>
                </li>
              </ul>
              <div className="mt-6 pt-5 border-t border-outline-variant">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{c.seeAlso}</p>
                <Link
                  href={doc.related.href}
                  className="mt-1 inline-flex items-center gap-2 min-h-[44px] text-[15px] font-semibold text-primary-container"
                >
                  {doc.related.label}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
