import React from "react";
import Link from "next/link";
import { Language, translations } from "@/lib/i18n";
import { Logo, AvilaRidge } from "@/components/Brand";
import { CONTACT, whatsappLink } from "@/lib/contact";

interface FooterProps {
  currentLang?: Language;
}

export function Footer({ currentLang = "es" }: FooterProps) {
  const t = translations[currentLang];
  const es = currentLang === "es";

  const contact = [
    { href: whatsappLink(), icon: "chat", label: es ? "Atención al cliente (WhatsApp)" : "Customer service (WhatsApp)", value: CONTACT.phoneDisplay },
    { href: CONTACT.instagramUrl, icon: "photo_camera", label: "Instagram", value: CONTACT.instagramHandle },
    { href: `mailto:${CONTACT.email}`, icon: "mail", label: "Email", value: CONTACT.email },
  ];

  return (
    <footer className="mt-auto text-paper">
      {/* Silueta del Ávila como transición */}
      <AvilaRidge fill="var(--wine-deep)" stroke="var(--wine-deep)" showValley={false} className="h-16 sm:h-24 -mb-px" />

      <div className="bg-primary">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 sm:pt-14 pb-24 sm:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
            {/* Marca */}
            <div className="md:col-span-5 space-y-6">
              <Link href="/" className="inline-block" aria-label="El Origen — inicio">
                <Logo tone="white" variant="full" className="w-40 sm:w-48" />
              </Link>
              <p className="text-[15px] text-paper/70 leading-relaxed max-w-sm">{t.footer.description}</p>
            </div>

            {/* Enlaces */}
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-1 gap-8">
              <div>
                <p className="eyebrow !text-sun mb-4">{t.footer.explore}</p>
                <nav className="flex flex-col gap-2.5">
                  {[
                    { href: "/catas", label: t.nav.experiencias },
                    { href: "/privadas", label: t.nav.privadas },
                    { href: "/nosotros", label: t.nav.bodega },
                    { href: "/Dossier-El-Origen-Caracas.pdf", label: es ? "Dossier comercial" : "Commercial dossier" },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} className="text-[14px] text-paper/80 hover:text-sun transition-colors">
                      {l.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            {/* Contacto */}
            <div className="md:col-span-4">
              <p className="eyebrow !text-sun mb-4">{t.nav.contacto}</p>
              <ul className="space-y-3">
                {contact.map((c) => (
                  <li key={c.icon}>
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="group flex items-center gap-3 text-[14px] text-paper/80 hover:text-sun transition-colors"
                    >
                      <span className="w-9 h-9 rounded-full border border-paper/20 group-hover:border-sun flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[17px]">{c.icon}</span>
                      </span>
                      <span>
                        {c.icon === "chat" ? (
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-sun">
                            {es ? "Atención al cliente" : "Customer service"}
                          </span>
                        ) : (
                          <span className="sr-only">{c.label}: </span>
                        )}
                        {c.value}
                      </span>
                    </a>
                  </li>
                ))}
                <li className="flex items-center gap-3 text-[14px] text-paper/60 pl-0.5">
                  <span className="w-9 h-9 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[17px]">location_on</span>
                  </span>
                  Caracas, Venezuela
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-paper/15 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-[12px] text-paper/50">
            <p>{t.footer.copyright}</p>
            <div className="flex gap-5">
              <Link href="#" className="hover:text-paper transition-colors">{t.footer.privacy}</Link>
              <Link href="#" className="hover:text-paper transition-colors">{t.footer.terms}</Link>
              <Link href="/admin" className="hover:text-paper transition-colors inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">lock</span>
                {t.nav.admin}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
