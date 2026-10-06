"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { translations, Language } from "@/lib/i18n";
import { Logo, AvilaRidge } from "@/components/Brand";

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
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (currentLang) {
      setLang(currentLang);
    }
  }, [currentLang]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLangToggle = () => {
    const nextLang = lang === "es" ? "en" : "es";
    setLang(nextLang);
    try {
      localStorage.setItem("el_origen_lang", nextLang);
    } catch {}
    if (onLanguageChange) onLanguageChange(nextLang);
  };

  const navLinks = [
    { href: "/catas", label: t.experiencias },
    { href: "/privadas", label: t.privadas },
    { href: "/nosotros", label: t.bodega },
    { href: "/#terroir", label: t.terroir },
    { href: "/#contacto", label: t.contacto },
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
          scrolled || mobileMenuOpen
            ? "bg-paper/95 backdrop-blur-md border-b border-outline-variant"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-6">
          {/* Marca */}
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
            <Logo variant="mark" className="w-12 sm:w-14 transition-transform duration-500 group-hover:-translate-y-0.5" priority />
            <span className="font-serif text-[17px] sm:text-[19px] font-bold tracking-[0.14em] text-primary-container uppercase">
              El Origen
            </span>
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Principal">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[14px] font-medium text-on-surface/80 hover:text-primary-container transition-colors relative py-1 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-primary-container after:transition-all after:duration-300 after:w-0 hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleLangToggle}
              className="h-9 px-2.5 text-[12px] font-semibold tracking-[0.12em] text-on-surface/70 hover:text-primary-container transition-colors"
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
            >
              <span className={lang === "es" ? "text-primary-container" : ""}>ES</span>
              <span className="mx-1 text-outline">/</span>
              <span className={lang === "en" ? "text-primary-container" : ""}>EN</span>
            </button>

            <Link
              href="/catas"
              className="hidden sm:inline-flex items-center gap-2 h-10 px-5 bg-primary-container hover:bg-primary text-white text-[13px] font-semibold tracking-wide rounded transition-colors"
            >
              {t.reservar}
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-11 h-11 flex items-center justify-center text-primary-container rounded hover:bg-primary-container/5"
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
            >
              <span className="material-symbols-outlined text-[26px]">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-primary text-paper flex flex-col pt-24 animate-fade-in lg:hidden overflow-y-auto">
          <nav className="flex flex-col px-6 sm:px-10" aria-label="Móvil">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-baseline gap-4 py-4 border-b border-paper/15 font-serif text-[28px] sm:text-4xl hover:text-sun transition-colors"
              >
                <span className="font-sans text-[11px] tracking-[0.2em] text-sun tabular-nums">0{i + 1}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="px-6 sm:px-10 pt-8">
            <Link
              href="/catas"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 h-14 bg-paper text-primary text-[14px] font-semibold rounded"
            >
              {t.reservar}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="mt-auto pt-12 text-paper/40">
            <AvilaRidge strokeWidth={1.5} showBirds className="h-24" />
          </div>
        </div>
      )}

      {/* Espaciador bajo la barra fija */}
      <div className="h-16 sm:h-20" />
    </>
  );
}
