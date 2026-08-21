"use client";

import React, { useState } from "react";
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

  const t = translations[lang].nav;

  const handleLangToggle = () => {
    const nextLang = lang === "es" ? "en" : "es";
    setLang(nextLang);
    if (onLanguageChange) onLanguageChange(nextLang);
  };

  return (
    <header className="bg-surface/95 backdrop-blur-md border-b border-surface-variant sticky top-0 z-50 transition-all">
      <div className="flex justify-between items-center w-full px-4 sm:px-8 lg:px-16 py-3.5 max-w-container-max mx-auto">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 flex-shrink-0">
            <Image
              src="/images/logo-color.png"
              alt="El Origen Logo"
              fill
              className="object-contain transition-transform group-hover:scale-105"
              priority
            />
          </div>
          <span className="font-serif text-2xl md:text-3xl font-bold text-primary tracking-tight">
            El Origen
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href="/nosotros"
            className="text-xs uppercase tracking-widest font-semibold text-secondary hover:text-primary transition-colors hover:opacity-90"
          >
            {t.bodega}
          </Link>
          <Link
            href="/catas"
            className="text-xs uppercase tracking-widest font-semibold text-primary border-b-2 border-primary pb-0.5"
          >
            {t.experiencias}
          </Link>
          <Link
            href="/privadas"
            className="text-xs uppercase tracking-widest font-semibold text-secondary hover:text-primary transition-colors hover:opacity-90"
          >
            {t.privadas}
          </Link>
          <Link
            href="/#terroir"
            className="text-xs uppercase tracking-widest font-semibold text-secondary hover:text-primary transition-colors hover:opacity-90"
          >
            {t.terroir}
          </Link>
          <Link
            href="/#contacto"
            className="text-xs uppercase tracking-widest font-semibold text-secondary hover:text-primary transition-colors hover:opacity-90"
          >
            {t.contacto}
          </Link>
          <Link
            href="/admin"
            className="text-xs uppercase tracking-widest font-semibold text-tertiary-container hover:text-tertiary transition-colors flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-md"
          >
            <span className="material-symbols-outlined text-[14px]">lock</span>
            {t.admin}
          </Link>
        </nav>

        {/* Right Action: Language Switcher & CTA */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            onClick={handleLangToggle}
            className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded border border-outline-variant text-secondary hover:text-primary hover:border-primary transition-all flex items-center gap-1"
            title="Cambiar idioma / Switch language"
          >
            <span className="material-symbols-outlined text-[14px]">language</span>
            {lang.toUpperCase()}
          </button>

          <Link
            href="/catas"
            className="bg-primary-container text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-primary transition-all shadow-sm active:scale-95"
          >
            {t.reservar}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={handleLangToggle}
            className="text-xs font-bold uppercase px-2 py-1 rounded border border-outline-variant text-secondary"
          >
            {lang.toUpperCase()}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-primary focus:outline-none"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-surface border-b border-surface-variant px-6 py-6 space-y-4 animate-fade-in-up">
          <Link
            href="/nosotros"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-wider font-semibold text-secondary hover:text-primary py-2"
          >
            {t.bodega}
          </Link>
          <Link
            href="/catas"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-wider font-semibold text-primary py-2"
          >
            {t.experiencias}
          </Link>
          <Link
            href="/privadas"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-wider font-semibold text-secondary hover:text-primary py-2"
          >
            {t.privadas}
          </Link>
          <Link
            href="/#terroir"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-wider font-semibold text-secondary hover:text-primary py-2"
          >
            {t.terroir}
          </Link>
          <Link
            href="/#contacto"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-wider font-semibold text-secondary hover:text-primary py-2"
          >
            {t.contacto}
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm uppercase tracking-wider font-semibold text-tertiary-container py-2"
          >
            {t.admin}
          </Link>

          <div className="pt-4 border-t border-surface-variant">
            <Link
              href="/catas"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full block text-center bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-primary transition-all"
            >
              {t.reservar}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
