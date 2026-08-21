import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";

export default function NosotrosPage() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Header Hero */}
        <section className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16 text-center max-w-4xl mx-auto">
          <span className="text-xs uppercase font-bold tracking-[0.2em] text-primary bg-primary-fixed-dim/30 px-3 py-1 rounded-full">
            Nuestra Historia
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-on-surface mt-4 mb-6 leading-tight">
            El Terroir Donde Nace la Excelencia
          </h1>
          <p className="text-sm sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Enclavados al pie de los Andes a 1.400 metros sobre el nivel del mar, cultivamos vides que desafían el clima extremo para crear vinos de pureza inigualable.
          </p>
        </section>

        {/* Gallery / Story Grid */}
        <section className="py-12 px-4 sm:px-8 lg:px-16 max-w-container-max mx-auto space-y-16">
          {/* Row 1: The Mountain & Soil */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 relative rounded-2xl overflow-hidden soft-shadow aspect-[4/3] w-full bg-surface-container">
              <Image
                src="https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop"
                alt="Viñedos de montaña"
                fill
                className="object-cover"
              />
            </div>
            <div className="lg:w-1/2 space-y-4">
              <span className="text-xs uppercase font-bold tracking-widest text-primary">01 • El Clima de Altura</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
                Amplitud Térmica & Deshielo Puro
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Nuestras uvas reciben más de 300 días de sol al año y noches gélidas de montaña. Esta oscilación térmica de hasta 20°C permite una maduración lenta de los polifenoles, preservando una acidez fresca y aromas florales sumamente expresivos.
              </p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                El riego proviene exclusivamente del deshielo cordillerano, filtrado naturalmente a través de sedimentos de piedra caliza y grava aluvial.
              </p>
            </div>
          </div>

          <TerroirDivider />

          {/* Row 2: The Cellar & Craft */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="lg:w-1/2 relative rounded-2xl overflow-hidden soft-shadow aspect-[4/3] w-full bg-surface-container">
              <Image
                src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop"
                alt="Cava y barricas de roble"
                fill
                className="object-cover"
              />
            </div>
            <div className="lg:w-1/2 space-y-4">
              <span className="text-xs uppercase font-bold tracking-widest text-primary">02 • Enología Minimalista</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
                Acompañar, No Intervenir
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                En El Origen creemos que el carácter del vino se define en la viña. En la bodega, utilizamos piletas de hormigón sin epoxi para preservar la identidad mineral, y barricas de roble francés de grano fino para aportar una textura sedosa sin opacar la fruta.
              </p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Cada partida es vinificada por microparcelas, respetando las particularidades de cada rincón de nuestra finca.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 sm:px-8 lg:px-16 bg-surface-container-low text-center mt-16">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
              Ven a Vivir la Experiencia en Primera Persona
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Grupos reducidos, atención personalizada de sommeliers y degustación directa de barricas.
            </p>
            <div className="pt-2">
              <Link
                href="/catas"
                className="bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-4 px-8 rounded-xl hover:bg-primary transition-all shadow-md inline-block"
              >
                Ver Próximas Catas Disponibles
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
