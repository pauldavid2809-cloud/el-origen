"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { translations, Language } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { Logo, AvilaRidge } from "@/components/Brand";
import { AccountMenu } from "@/components/AccountMenu";

interface NavbarProps {
  /** Idioma que controla la página. Si se omite, la barra usa el idioma guardado (`useLang`). */
  currentLang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export function Navbar({ currentLang, onLanguageChange }: NavbarProps) {
  const [storedLang, setStoredLang] = useLang();
  const lang = currentLang ?? storedLang;
  const t = translations[lang].nav;
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Menú móvil: bloquea el scroll de fondo y se cierra con Escape.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  // Cierra el menú al cambiar de página.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLangToggle = () => {
    const nextLang: Language = lang === "es" ? "en" : "es";
    setStoredLang(nextLang); // persiste y sincroniza las demás instancias de useLang
    onLanguageChange?.(nextLang);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  /* Menú completo (en el orden que pidió el cliente). `desktop`: también en la barra de pantallas anchas;
     el resto queda en el menú desplegable y en el pie de página. */
  const navLinks = [
    { href: "/catas", label: t.catas, desktop: true },
    { href: "/privadas", label: t.privadas, desktop: true },
    { href: "/alianzas", label: t.alianzas, desktop: true },
    { href: "/nosotros", label: t.nosotros, desktop: true },
    { href: "/horarios", label: t.horarios, desktop: false },
    { href: "/eventos", label: t.eventos, desktop: true },
    { href: "/#contacto", label: t.contacto, desktop: true },
    { href: "/sommeliers", label: t.sommeliers, desktop: false },
    { href: "/vinos", label: t.vinos, desktop: true },
  ];

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname?.startsWith(`${href}/`));

  const langToggle = (className: string) => (
    <button
      type="button"
      onClick={handleLangToggle}
      className={className}
      aria-label={t.switchLang}
      lang={lang === "es" ? "en" : "es"}
    >
      <span className={lang === "es" ? "text-primary-container" : ""}>ES</span>
      <span className="mx-1 text-outline" aria-hidden="true">/</span>
      <span className={lang === "en" ? "text-primary-container" : ""}>EN</span>
    </button>
  );

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
          scrolled || mobileMenuOpen
            ? "bg-paper/95 backdrop-blur-md border-b border-outline-variant"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Marca */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0" onClick={closeMenu} aria-label={t.home}>
            <Logo variant="mark" className="w-11 sm:w-14 flex-shrink-0 transition-transform duration-500 group-hover:-translate-y-0.5" priority />
            <span className="font-serif text-[16px] sm:text-[19px] font-bold tracking-[0.12em] sm:tracking-[0.14em] text-primary-container uppercase whitespace-nowrap">
              El Origen
            </span>
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden xl:flex items-center gap-7" aria-label={t.mainLabel}>
            {navLinks.filter((link) => link.desktop).map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-[14px] font-medium transition-colors relative py-1 after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-primary-container after:transition-all after:duration-300 hover:text-primary-container hover:after:w-full ${
                    active ? "text-primary-container after:w-full" : "text-on-surface/80 after:w-0"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {langToggle(
              "h-11 px-2 text-[12px] font-semibold tracking-[0.12em] text-on-surface/70 hover:text-primary-container transition-colors"
            )}

            <span className="hidden sm:block">
              <AccountMenu lang={lang} />
            </span>

            <Link
              href="/catas"
              className="hidden sm:inline-flex items-center gap-2 h-11 px-5 ml-1 bg-primary-container hover:bg-primary text-white text-[13px] font-semibold tracking-wide rounded transition-colors"
            >
              {t.reservar}
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="xl:hidden w-11 h-11 flex items-center justify-center text-primary-container rounded hover:bg-primary-container/5"
              aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="menu-movil"
            >
              <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div
          id="menu-movil"
          className="fixed inset-0 z-40 bg-primary text-paper flex flex-col pt-20 sm:pt-24 animate-fade-in xl:hidden overflow-y-auto"
        >
          <nav className="flex flex-col px-6 sm:px-10" aria-label={t.mobileLabel}>
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                aria-current={isActive(link.href) ? "page" : undefined}
                className="flex items-baseline gap-4 py-3 border-b border-paper/15 font-serif text-[26px] sm:text-4xl hover:text-sun transition-colors"
              >
                <span className="font-sans text-[11px] tracking-[0.2em] text-sun tabular-nums" aria-hidden="true">
                  0{i + 1}
                </span>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="px-6 sm:px-10 pt-6 space-y-3">
            <Link
              href="/catas"
              onClick={closeMenu}
              className="w-full flex items-center justify-center gap-2 h-14 bg-paper text-primary text-[14px] font-semibold rounded"
            >
              {t.reservar}
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </Link>
            <AccountMenu lang={lang} variant="menu" onNavigate={closeMenu} />
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
