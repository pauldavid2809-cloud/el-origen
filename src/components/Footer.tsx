"use client";

import React from "react";
import Link from "next/link";
import { Language, translations } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { Logo, AvilaRidge } from "@/components/Brand";
import { BUSINESS_HOURS, CONTACT, whatsappLink } from "@/lib/contact";

interface FooterProps {
  /** Idioma que controla la página. Si se omite, usa el idioma guardado (`useLang`). */
  currentLang?: Language;
}

export function Footer({ currentLang }: FooterProps) {
  const [storedLang] = useLang();
  const lang = currentLang ?? storedLang;
  const t = translations[lang];

  const explore = [
    { href: "/catas", label: t.nav.catas },
    { href: "/privadas", label: t.nav.privadas },
    { href: "/alianzas", label: t.nav.alianzas },
    { href: "/sommeliers", label: t.nav.sommeliers },
    { href: "/nosotros", label: t.nav.nosotros },
  ];

  const contact = [
    {
      href: whatsappLink(),
      icon: "chat",
      label: `${t.footer.customerService} · ${CONTACT.ownerName}`,
      value: CONTACT.phoneDisplay,
    },
    { href: CONTACT.instagramUrl, icon: "photo_camera", label: "Instagram", value: CONTACT.instagramHandle },
    { href: `mailto:${CONTACT.email}`, icon: "mail", label: t.footer.email, value: CONTACT.email },
  ];

  return (
    <footer className="mt-auto text-paper">
      {/* Silueta del Ávila como transición */}
      <AvilaRidge fill="var(--wine-deep)" stroke="var(--wine-deep)" showValley={false} className="h-16 sm:h-24 -mb-px" />

      <div className="bg-primary">
        {/* pb-24 deja libre la franja inferior que ocupa el botón flotante de WhatsApp (WhatsAppConcierge). */}
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 sm:pt-14 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
            {/* Marca */}
            <div className="sm:col-span-2 lg:col-span-4 space-y-6">
              <Link href="/" className="inline-block" aria-label={t.nav.home}>
                <Logo tone="white" variant="full" className="w-40 sm:w-48" />
              </Link>
              <p className="text-[15px] text-paper/70 leading-relaxed max-w-sm">{t.footer.description}</p>
              <p className="font-serif italic text-[17px] text-sun">{CONTACT.city}, Venezuela</p>
            </div>

            {/* Explorar */}
            <div className="lg:col-span-2">
              <p className="eyebrow !text-sun mb-4">{t.footer.explore}</p>
              <nav className="flex flex-col" aria-label={t.footer.explore}>
                {explore.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="inline-flex items-center min-h-11 text-[14px] text-paper/80 hover:text-sun transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Contacto */}
            <div className="lg:col-span-3">
              <p className="eyebrow !text-sun mb-4">{t.footer.contact}</p>
              <ul className="space-y-3">
                {contact.map((c) => {
                  const external = c.href.startsWith("http");
                  return (
                    <li key={c.icon}>
                      <a
                        href={c.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        className="group flex items-center gap-3 min-h-[44px] text-[14px] text-paper/80 hover:text-sun transition-colors"
                      >
                        <span className="w-9 h-9 flex-shrink-0 rounded-full border border-paper/20 group-hover:border-sun flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-[17px]" aria-hidden="true">{c.icon}</span>
                        </span>
                        <span className="min-w-0 break-words">
                          {c.icon === "chat" ? (
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-sun">{c.label}</span>
                          ) : (
                            <span className="sr-only">{c.label}: </span>
                          )}
                          {c.value}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Horario */}
            <div className="lg:col-span-3">
              <p className="eyebrow !text-sun mb-4">{t.footer.hours}</p>
              <ul className="space-y-3 text-[14px] text-paper/80 leading-relaxed">
                {BUSINESS_HOURS[lang].map((line) => {
                  const [days, ...rest] = line.split(": ");
                  return (
                    <li key={line}>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-sun">{days}</span>
                      {rest.join(": ")}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-paper/15 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-[12px] text-paper/70">
            <p>{t.footer.copyright(new Date().getFullYear())}</p>
            <nav className="flex flex-wrap gap-x-5" aria-label={t.footer.legal}>
              <Link href="/privacidad" className="inline-flex items-center min-h-[44px] hover:text-paper transition-colors">
                {t.footer.privacy}
              </Link>
              <Link href="/terminos" className="inline-flex items-center min-h-[44px] hover:text-paper transition-colors">
                {t.footer.terms}
              </Link>
              <Link href="/admin" className="inline-flex items-center gap-1 min-h-[44px] hover:text-paper transition-colors">
                <span className="material-symbols-outlined text-[13px]" aria-hidden="true">lock</span>
                {t.nav.admin}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
