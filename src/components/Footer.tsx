import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Language, translations } from "@/lib/i18n";

interface FooterProps {
  currentLang?: Language;
}

export function Footer({ currentLang = "es" }: FooterProps) {
  const t = translations[currentLang];

  return (
    <footer className="border-t border-outline-variant/40 mt-auto">
      <div className="w-full px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-7 h-7">
                <Image src="/images/logo-color.png" alt="El Origen" fill className="object-contain" />
              </div>
              <span className="font-serif text-lg font-semibold text-primary tracking-tight">
                El Origen
              </span>
            </Link>
            <p className="text-[13px] text-on-surface-variant/70 leading-relaxed max-w-[280px]">
              {t.footer.description}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">
                {t.footer.explore}
              </span>
              <nav className="flex flex-col gap-2">
                <Link href="/nosotros" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">
                  {t.nav.bodega}
                </Link>
                <Link href="/catas" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">
                  {t.nav.experiencias}
                </Link>
                <Link href="/privadas" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">
                  {t.nav.privadas}
                </Link>
              </nav>
            </div>
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">
                {t.footer.legal}
              </span>
              <nav className="flex flex-col gap-2">
                <Link href="#" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">
                  {t.footer.privacy}
                </Link>
                <Link href="#" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">
                  {t.footer.terms}
                </Link>
                <Link href="#" className="text-[13px] text-on-surface-variant/80 hover:text-primary transition-colors duration-300">
                  {t.footer.sustainability}
                </Link>
              </nav>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4 md:text-right">
            <div className="flex gap-2 md:justify-end">
              {[
                { href: "mailto:experiencias@elorigen.com", icon: "mail", label: "Email" },
                { href: "https://wa.me/584141074007", icon: "chat", label: "WhatsApp" },
                { href: "https://maps.google.com", icon: "location_on", label: "Maps" },
              ].map((s) => (
                <a
                  key={s.icon}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="w-9 h-9 rounded-full bg-surface-container/60 hover:bg-primary-container hover:text-white text-on-surface-variant/60 flex items-center justify-center transition-all duration-300"
                  title={s.label}
                >
                  <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                </a>
              ))}
            </div>
            <p className="text-[11px] text-on-surface-variant/40">
              {t.footer.copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
