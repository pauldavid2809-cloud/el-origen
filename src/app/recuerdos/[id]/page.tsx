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
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-12 sm:py-20 px-4 sm:px-8 lg:px-16 max-w-container-max mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold tracking-[0.2em] text-primary bg-primary-fixed-dim/30 px-3 py-1 rounded-full">
            Galería de Recuerdos
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface mt-3 mb-3">
            Momentos en El Origen
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Descarga las fotografías de alta resolución tomadas por nuestro equipo durante la experiencia.
          </p>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {photos.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPhoto(p.url)}
              className="group relative rounded-2xl overflow-hidden soft-shadow bg-surface-container aspect-square cursor-pointer transition-transform duration-300 hover:-translate-y-1"
            >
              <Image
                src={p.url}
                alt={p.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white text-xs">
                <p className="font-serif font-bold text-sm leading-tight">{p.title}</p>
                <p className="text-[10px] text-white/80 mt-1">Por {p.photographer} • {p.time} hs</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="relative max-w-4xl w-full h-[70vh] rounded-2xl overflow-hidden bg-black shadow-2xl">
              <Image
                src={selectedPhoto}
                alt="Foto en alta resolución"
                fill
                className="object-contain"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-white/20 text-white rounded-full p-2 hover:bg-white/40"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
          </div>
        )}

        <TerroirDivider className="my-16" />

        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
