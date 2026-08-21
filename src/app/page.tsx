"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";
import { TastingCard } from "@/components/TastingCard";
import { Tasting } from "@/types";
import { translations, Language } from "@/lib/i18n";

export default function HomePage() {
  const [lang, setLang] = useState<Language>("es");
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  useEffect(() => {
    async function fetchTastings() {
      try {
        const res = await fetch("/api/tastings");
        const data = await res.json();
        if (data.success) {
          setTastings(data.tastings);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    fetchTastings();
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        {/* HERO SECTION with Mountain Watermark & Brand Logo */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 sm:px-8 lg:px-16 mountain-bg overflow-hidden py-20 sm:py-28">
          <div className="max-w-4xl mx-auto z-10 flex flex-col items-center gap-6 animate-fade-in-up">
            {/* Logo Image in Color Burgundy */}
            <div className="relative w-48 sm:w-64 md:w-72 h-32 sm:h-40 mb-2">
              <Image
                src="/images/logo-color.png"
                alt="El Origen - Bodega Boutique Mendoza"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Display Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold text-on-surface leading-[1.15] tracking-tight max-w-3xl">
              {t.hero.tagline}
            </h1>

            {/* Sub-tagline */}
            <p className="text-sm sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              {t.hero.subtagline}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto">
              <Link
                href="/catas"
                className="bg-primary-container text-white text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-xl hover:bg-primary transition-all shadow-md active:scale-95 text-center min-w-[200px]"
              >
                {t.hero.ctaPrimary}
              </Link>
              <a
                href="#proximas-catas"
                className="bg-transparent border border-primary-container text-primary-container text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-xl hover:bg-primary-fixed-dim/20 transition-all text-center min-w-[200px]"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>

            {/* Micro Badges */}
            <div className="flex flex-wrap justify-center items-center gap-6 mt-8 text-xs text-secondary font-medium">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
                1.400 msnm Valle de Uco
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
                Grupos reducidos (máx. 20 cupos)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">qr_code_2</span>
                Entrada digital con QR instantáneo
              </span>
            </div>
          </div>
        </section>

        {/* Terroir Divider */}
        <TerroirDivider />

        {/* PRÓXIMAS CATAS SECTION */}
        <section className="py-16 sm:py-24 px-4 sm:px-8 lg:px-16 max-w-container-max mx-auto" id="proximas-catas">
          <div className="text-center mb-14">
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-primary bg-primary-fixed-dim/30 px-3 py-1 rounded-full">
              Calendario de Degustaciones
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-on-background mt-3 mb-3">
              {t.tastings.title}
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              {t.tastings.subtitle}
            </p>
          </div>

          {/* Grid of Tasting Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-secondary">
              <span className="material-symbols-outlined animate-spin text-2xl mr-2">progress_activity</span>
              Cargando experiencias disponibles...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tastings.map((tasting) => (
                <TastingCard key={tasting.id} tasting={tasting} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/catas"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-container hover:underline"
            >
              Ver todas las fechas y experiencias disponibles
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* SOBRE EL ORIGEN / TERROIR SECTION */}
        <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16 bg-surface-container-low" id="terroir">
          <div className="max-w-container-max mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Image */}
            <div className="lg:w-1/2 w-full">
              <div className="relative rounded-2xl overflow-hidden soft-shadow aspect-[4/3] bg-surface-container">
                <Image
                  src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop"
                  alt="Viñedos El Origen en el Valle de Uco, Mendoza"
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute bottom-4 left-4 right-4 p-4 bg-surface/90 backdrop-blur-md rounded-xl border border-surface-variant text-xs text-on-surface">
                  <p className="font-serif font-bold text-sm text-primary">Cava Subterránea & Finca Cordillera</p>
                  <p className="text-secondary mt-0.5">Barricas de roble francés y piletas de hormigón en guarda natural.</p>
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="lg:w-1/2 flex flex-col gap-6">
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-primary">
                Nuestra Historia & Terroir
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-on-background leading-tight">
                {t.story.title}
              </h2>
              <p className="text-base text-on-surface-variant leading-relaxed font-normal">
                {t.story.p1}
              </p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t.story.p2}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-6">
                <Link
                  href="/nosotros"
                  className="bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl hover:bg-primary transition-all shadow-sm inline-flex items-center gap-2"
                >
                  {t.story.learnMore}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
                <Link
                  href="/privadas"
                  className="text-xs uppercase font-bold tracking-wider text-primary hover:underline inline-flex items-center gap-1"
                >
                  Eventos y Catas Privadas B2B
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE SENSORY TASTING HIGHLIGHT */}
        <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16 bg-surface max-w-container-max mx-auto">
          <div className="bg-gradient-to-br from-[#3E001F] via-[#5C0531] to-[#2B0215] text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-xl space-y-4 relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] bg-white/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
                Innovación Enoturística
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                Ficha de Cata Sensorial Digital
              </h2>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                Durante la cata, interactúa en tiempo real desde tu smartphone: califica descriptores en la rueda aromática, escucha la voz del enólogo jefe y descárgate tu Certificado de Degustador y Cuaderno de Cata exclusivo.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  href="/cata-en-vivo/tok-carlos-mendoza-8492"
                  className="bg-[#D4AF37] text-[#3E001F] text-xs font-bold uppercase tracking-wider py-3.5 px-7 rounded-xl hover:bg-[#ffe088] transition-all shadow-md inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">psychology_alt</span>
                  Probar Ficha Sensorial Interactiva
                </Link>
              </div>
            </div>

            <div className="relative z-10 w-full sm:w-72 h-80 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 flex flex-col justify-between shadow-inner">
              <div className="flex justify-between items-center border-b border-white/20 pb-3">
                <span className="font-serif text-sm font-bold text-white">Rueda de Aromas</span>
                <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]">En Vivo</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-white/10 rounded-lg flex justify-between">
                  <span>Ciruela & Violetas</span>
                  <span className="text-[#D4AF37] font-bold">95 pts</span>
                </div>
                <div className="p-2 bg-white/10 rounded-lg flex justify-between">
                  <span>Roble Francés & Cacao</span>
                  <span className="text-[#D4AF37] font-bold">94 pts</span>
                </div>
                <div className="p-2 bg-white/10 rounded-lg flex justify-between">
                  <span>Mineralidad Salina</span>
                  <span className="text-[#D4AF37] font-bold">96 pts</span>
                </div>
              </div>
              <p className="text-[10px] text-white/60 text-center italic">
                Sincronizado paso a paso con el sommelier.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section className="py-16 sm:py-20 px-4 sm:px-8 lg:px-16 bg-surface-container-low" id="contacto">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-primary">
              Visítanos en Mendoza
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
              ¿Deseas organizar una visita especial o tienes alguna consulta?
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto">
              Nuestro equipo de hospitalidad y sommeliers está a tu disposición para asistirte con reservas y traslados.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/5492614558822"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl hover:bg-primary transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                Escribir por WhatsApp
              </a>
              <Link
                href="/privadas"
                className="bg-surface border border-primary text-primary text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl hover:bg-surface-variant transition-all flex items-center gap-2"
              >
                Solicitar Cotización Privada
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
