"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { translations, Language } from "@/lib/i18n";

interface NavbarProps {
  currentLang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export function Navbar({ currentLang = "es", onLanguageChange }: NavbarProps) {
  const [lang, setLang] = useState<Language>(currentLang);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const t = translations[lang].nav;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (currentLang) {
      setLang(currentLang);
    }
  }, [currentLang]);

  const handleLangToggle = () => {
    const nextLang = lang === "es" ? "en" : "es";
    setLang(nextLang);
    try {
      localStorage.setItem("el_origen_lang", nextLang);
    } catch {}
    if (onLanguageChange) onLanguageChange(nextLang);
  };

  const navLinks = [
    { href: "/nosotros", label: t.bodega },
    { href: "/catas", label: t.experiencias },
    { href: "/privadas", label: t.privadas },
    { href: "/#terroir", label: t.terroir },
    { href: "/#contacto", label: t.contacto },
  ];

  return (
    <>
      {/* Floating Island Navbar (high-end-visual-design standard) */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 pointer-events-none">
        <div
          className={`mx-auto max-w-5xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${
            scrolled ? "mt-3 sm:mt-4" : "mt-4 sm:mt-6"
          }`}
        >
          {/* Outer Island Container */}
          <div className="bg-white/85 backdrop-blur-2xl border border-black/[0.06] rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-[0_8px_32px_rgba(122,32,72,0.06)] flex items-center justify-between gap-4">
            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 flex-shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
                <Image
                  src="/images/logo-color.png"
                  alt="El Origen"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-serif text-xl sm:text-[22px] font-semibold text-primary tracking-tight">
                El Origen
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium text-on-surface-variant hover:text-primary transition-colors duration-300 relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-primary after:transition-all after:duration-300 after:w-0 hover:after:w-full"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/admin"
                className="text-[13px] font-medium text-on-surface-variant/60 hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">lock</span>
                {t.admin}
              </Link>
            </nav>

            {/* Actions: Lang toggle + Nested Island CTA */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleLangToggle}
                className="text-[11px] font-semibold text-on-surface-variant/80 hover:text-primary bg-black/[0.03] hover:bg-black/[0.06] px-3 py-1.5 rounded-full transition-all duration-300"
                title="Cambiar idioma / Switch language"
              >
                {lang.toUpperCase()}
              </button>

              {/* Nested CTA Button (Button-in-Button pattern) */}
              <Link
                href="/catas"
                className="group hidden sm:inline-flex items-center gap-2.5 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold pl-4 pr-1.5 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm active:scale-[0.98]"
              >
                <span>{t.reservar}</span>
                <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[0.5px]">
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </span>
              </Link>

              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-primary md:hidden rounded-full hover:bg-black/[0.04] transition-colors"
                aria-label="Abrir menú"
              >
                <span className="material-symbols-outlined text-2xl">
                  {mobileMenuOpen ? "close" : "menu"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fullscreen Mobile Glass Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-surface/98 backdrop-blur-3xl flex flex-col justify-center items-center p-6 animate-fade-in md:hidden overflow-y-auto">
          <nav className="flex flex-col items-center gap-6 sm:gap-7 w-full max-w-xs text-center my-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 hover:text-primary pt-2"
            >
              {t.admin}
            </Link>

            <div className="pt-6 w-full">
              <Link
                href="/catas"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-3 bg-primary-container text-white text-xs font-semibold py-4 rounded-full shadow-md"
              >
                <span>{t.reservar}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Spacer to preserve layout flow under floating island */}
      <div className="h-20 sm:h-24" />
    </>
  );
}
