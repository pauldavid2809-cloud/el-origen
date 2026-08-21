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

  const handleLangToggle = () => {
    const nextLang = lang === "es" ? "en" : "es";
    setLang(nextLang);
    if (onLanguageChange) onLanguageChange(nextLang);
  };

  const navLinks = [
    { href: "/nosotros", label: t.bodega },
    { href: "/catas", label: t.experiencias, active: true },
    { href: "/privadas", label: t.privadas },
    { href: "/#terroir", label: t.terroir },
    { href: "/#contacto", label: t.contacto },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out-expo ${
          scrolled
            ? "glass border-b border-outline-variant/40 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="flex justify-between items-center w-full px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 flex-shrink-0 transition-transform duration-500 ease-out-expo group-hover:scale-105">
              <Image
                src="/images/logo-color.png"
                alt="El Origen"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-serif text-[22px] font-semibold text-primary tracking-tight">
              El Origen
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] font-medium transition-colors duration-300 relative py-1 ${
                  link.active
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-primary"
                } after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-primary after:transition-all after:duration-500 after:ease-out-expo ${
                  link.active ? "after:w-full" : "after:w-0 hover:after:w-full"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="text-[13px] font-medium text-on-surface-variant/60 hover:text-primary transition-colors duration-300 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              {t.admin}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={handleLangToggle}
              className="text-[12px] font-semibold text-on-surface-variant/70 hover:text-primary bg-surface-container/60 hover:bg-surface-container px-3 py-1.5 rounded-full transition-all duration-300"
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <Link
              href="/catas"
              className="text-[12px] font-semibold text-white bg-primary-container hover:bg-primary px-5 py-2.5 rounded-full transition-all duration-300 ease-out-expo active:scale-[0.97]"
            >
              {t.reservar}
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={handleLangToggle}
              className="text-[11px] font-semibold text-on-surface-variant/70 bg-surface-container/60 px-2.5 py-1 rounded-full"
            >
              {lang === "es" ? "EN" : "ES"}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-primary"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fullscreen Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-surface/98 backdrop-blur-xl flex flex-col justify-center items-center animate-fade-in">
          <nav className="flex flex-col items-center gap-6 stagger-children">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-serif text-3xl font-semibold tracking-tight transition-colors duration-300 ${
                  link.active ? "text-primary" : "text-on-surface/70 hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-on-surface-variant/50 mt-4"
            >
              {t.admin}
            </Link>
            <div className="mt-6 pt-6 border-t border-outline-variant/30 w-48 flex justify-center">
              <Link
                href="/catas"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[13px] font-semibold text-white bg-primary-container hover:bg-primary px-8 py-3 rounded-full transition-all duration-300"
              >
                {t.reservar}
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-[72px]" />
    </>
  );
}
