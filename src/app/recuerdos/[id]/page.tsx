"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";

export default function EventMemoriesPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const photos = [
    {
      id: "1",
      title: "Golden Hour sobre la Cordillera",
      url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop",
      photographer: "M. Silva",
      time: "19:15",
    },
    {
      id: "2",
      title: "Servicio de Cata Malbec Reserva en Cava",
      url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
      photographer: "G. Valenzuela",
      time: "18:40",
    },
    {
      id: "3",
      title: "Degustación de Barricas de Roble Francés",
      url: "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=1200&auto=format&fit=crop",
      photographer: "A. Morales",
      time: "19:50",
    },
    {
      id: "4",
      title: "Brindis al Atardecer en el Deck",
      url: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1200&auto=format&fit=crop",
      photographer: "M. Silva",
      time: "20:10",
    },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <Navbar />

      <main className="flex-grow py-16 sm:py-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Galería de Recuerdos
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-on-surface tracking-tight mb-4">
            Momentos en El Origen
          </h1>
          <p className="text-[14px] sm:text-base text-on-surface-variant/80 max-w-lg mx-auto leading-relaxed">
            Descarga las fotografías de alta resolución tomadas por nuestro equipo de hospitalidad durante la experiencia.
          </p>
        </div>

        {/* Photo Grid with Staggered Entrance & Double-Bezel Frames */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {photos.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPhoto(p.url)}
              className="group p-1.5 rounded-[2rem] bg-black/[0.02] border border-black/[0.05] hover:border-primary/25 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover-lift"
            >
              <div className="relative rounded-[calc(2rem-0.375rem)] overflow-hidden bg-surface-container aspect-square shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                <Image
                  src={p.url}
                  alt={p.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end text-white text-xs">
                  <p className="font-serif font-semibold text-sm leading-snug">{p.title}</p>
                  <p className="text-[11px] text-white/75 mt-1 font-sans">Por {p.photographer} • {p.time} hs</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal with Emil Kowalski Modal Recipe */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full h-[75vh] rounded-3xl overflow-hidden bg-black mockup-shadow animate-scale-in flex items-center justify-center"
            >
              <Image
                src={selectedPhoto}
                alt="Foto en alta resolución"
                fill
                className="object-contain"
              />

              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2.5 backdrop-blur-md transition-all active:scale-95"
                aria-label="Cerrar vista previa"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              {/* Download Action */}
              <a
                href={selectedPhoto}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="absolute bottom-6 right-6 bg-white text-on-surface hover:bg-[#faf8f7] text-[12px] font-semibold px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                Descargar HD
              </a>
            </div>
          </div>
        )}

        <TerroirDivider className="my-20" />

        <div className="text-center">
          <Link
            href="/"
            className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant/70 hover:text-primary transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
