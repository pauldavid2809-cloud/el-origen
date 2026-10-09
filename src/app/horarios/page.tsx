"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { BUSINESS_HOURS, CONTACT, whatsappLink } from "@/lib/contact";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { HOURS_COPY } from "./copy";

/** "Lunes a viernes: 8:00 a.m. – …" → ["Lunes a viernes", "8:00 a.m. – …"]. */
function splitLine(line: string): [string, string] {
  const i = line.indexOf(": ");
  return i > 0 ? [line.slice(0, i), line.slice(i + 2)] : ["", line];
}

export default function HoursPage() {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Horario de atención", en: "Customer service hours" });
  const t = HOURS_COPY[lang];

  const contacts = [
    { href: `tel:${CONTACT.phoneIntl.replace(/-/g, "")}`, icon: "call", label: t.phone, value: CONTACT.phoneDisplay, external: false },
    { href: CONTACT.instagramUrl, icon: "photo_camera", label: t.instagram, value: CONTACT.instagramHandle, external: true },
    { href: `mailto:${CONTACT.email}`, icon: "mail", label: t.email, value: CONTACT.email, external: false },
  ];

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

        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-24 sm:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          <div className="lg:col-span-7 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-10">
            <p className="eyebrow flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">schedule</span>
              {t.hoursTitle}
            </p>
            <dl className="mt-6 divide-y divide-outline-variant border-t border-outline-variant">
              {BUSINESS_HOURS[lang].map((line) => {
                const [days, hours] = splitLine(line);
                return (
                  <div key={line} className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] gap-1 sm:gap-6 py-5">
                    <dt className="font-serif text-xl sm:text-2xl text-on-surface">{days}</dt>
                    <dd className="text-[16px] sm:text-[17px] text-on-surface-variant leading-relaxed sm:pt-1">{hours}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-6 text-[14px] text-on-surface-variant">
              {t.tastingsNote}{" "}
              <Link href="/catas" className="font-semibold text-primary-container hover:underline">
                {t.tastingsCta}
              </Link>
            </p>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-primary-container text-paper p-6 sm:p-10">
            <h2 className="font-serif text-2xl sm:text-3xl">{t.contactTitle}</h2>
            <a
              href={whatsappLink(t.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full h-[52px] inline-flex items-center justify-center gap-2 rounded bg-paper text-primary hover:bg-white text-[15px] font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
              {t.whatsapp}
            </a>
            <ul className="mt-6 space-y-1">
              {contacts.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-3 min-h-[52px] rounded hover:text-sun transition-colors"
                  >
                    <span className="w-10 h-10 rounded-full border border-paper/25 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px] text-sun" aria-hidden="true">{c.icon}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/60">{c.label}</span>
                      <span className="block text-[15px] break-all">{c.value}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
