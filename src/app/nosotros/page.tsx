import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";

export default function NosotrosPage() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <Navbar />

      <main className="flex-grow">
        {/* Header Hero */}
        <section className="pt-20 sm:pt-28 pb-20 sm:pb-28 px-5 sm:px-8 lg:px-12 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Nuestra Historia
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-semibold text-on-surface tracking-tight leading-[1.08] mb-6 text-balance">
            El Terroir Donde Nace la <span className="italic text-primary font-normal">Excelencia</span>
          </h1>

          <p className="text-[15px] sm:text-lg text-on-surface-variant/80 max-w-2xl mx-auto leading-relaxed text-balance">
            Enclavados al pie de los Andes a 1.400 metros de altura, cultivamos vides que desafían el clima extremo para crear vinos de pureza inigualable.
          </p>
        </section>

        {/* Gallery / Story Grid in Double-Bezel Frames */}
        <section className="py-12 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto space-y-24">
          {/* Row 1: The Mountain & Soil */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 p-2 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
              <div className="relative rounded-[calc(2.5rem-0.5rem)] overflow-hidden aspect-[4/3] w-full bg-surface-container">
                <Image
                  src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop"
                  alt="Viñedos de montaña El Origen"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary block">
                01 • Clima de Altura
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight leading-tight">
                Amplitud Térmica & Deshielo Puro
              </h2>

              <p className="text-[14px] sm:text-base text-on-surface-variant/80 leading-relaxed font-normal">
                Nuestras uvas reciben más de 300 días de sol al año y noches gélidas de montaña. Esta oscilación térmica de hasta 20°C permite una maduración lenta de los polifenoles, preservando una acidez fresca y aromas florales sumamente expresivos.
              </p>

              <p className="text-[14px] sm:text-base text-on-surface-variant/80 leading-relaxed font-normal">
                El riego proviene exclusivamente del deshielo cordillerano, filtrado naturalmente a través de sedimentos de piedra caliza y grava aluvial.
              </p>
            </div>
          </div>

          <TerroirDivider />

          {/* Row 2: The Cellar & Craft */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 lg:order-2 p-2 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
              <div className="relative rounded-[calc(2.5rem-0.5rem)] overflow-hidden aspect-[4/3] w-full bg-surface-container">
                <Image
                  src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop"
                  alt="Cava y barricas de roble"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 lg:order-1 space-y-5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary block">
                02 • Enología Minimalista
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight leading-tight">
                Acompañar, No Intervenir
              </h2>

              <p className="text-[14px] sm:text-base text-on-surface-variant/80 leading-relaxed font-normal">
                En El Origen creemos que el carácter del vino se define en la viña. En la bodega, utilizamos piletas de hormigón sin epoxi para preservar la identidad mineral, y barricas de roble francés de grano fino para aportar una textura sedosa sin opacar la fruta.
              </p>

              <p className="text-[14px] sm:text-base text-on-surface-variant/80 leading-relaxed font-normal">
                Cada partida es vinificada por microparcelas, respetando las particularidades de cada rincón de nuestra finca.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full text-center">
          <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
            <div className="bg-white rounded-[calc(2.5rem-0.625rem)] p-10 sm:p-16 space-y-4">
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-on-surface">
                Ven a Vivir la Experiencia en Primera Persona
              </h2>
              <p className="text-[13px] sm:text-base text-on-surface-variant/80 max-w-lg mx-auto">
                Grupos reducidos, atención personalizada de sommeliers y degustación directa de barricas.
              </p>
              <div className="pt-4">
                <Link
                  href="/catas"
                  className="group inline-flex items-center gap-3 bg-primary-container hover:bg-primary text-white text-[13px] font-semibold pl-6 pr-2 py-2 rounded-full transition-all duration-300 shadow-sm"
                >
                  <span>Ver Próximas Catas</span>
                  <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
