"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function AdminRecuerdosPage() {
  const [photos, setPhotos] = useState([
    {
      id: "1",
      title: "Golden Hour sobre la Cordillera",
      url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop",
      tastingTitle: "Atardecer en el Viñedo",
      date: "2026-08-15",
    },
    {
      id: "2",
      title: "Servicio de Cata Malbec Reserva en Cava",
      url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
      tastingTitle: "Cata Malbec Reserva",
      date: "2026-08-15",
    },
    {
      id: "3",
      title: "Degustación de Barricas de Roble Francés",
      url: "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?q=80&w=1200&auto=format&fit=crop",
      tastingTitle: "Blancos de Altura",
      date: "2026-08-10",
    },
  ]);

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTasting, setNewTasting] = useState("Cata Malbec Reserva");

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;

    setPhotos([
      {
        id: Date.now().toString(),
        title: newTitle,
        url: newUrl,
        tastingTitle: newTasting,
        date: new Date().toISOString().split("T")[0],
      },
      ...photos,
    ]);

    setNewTitle("");
    setNewUrl("");
  };

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
      <header className="border-b border-surface-variant pb-6">
        <p className="text-xs uppercase font-bold tracking-[0.2em] text-secondary mb-1">
          Experiencia Post-Evento
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
          Galería de Recuerdos para Asistentes
        </h2>
      </header>

      {/* Upload Box */}
      <div className="bg-surface rounded-2xl border border-surface-variant p-6 soft-shadow">
        <h3 className="font-serif text-lg font-bold text-on-surface mb-3">Subir Fotografía de la Cata</h3>
        <form onSubmit={handleAddPhoto} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block uppercase font-bold text-secondary mb-1">Título de la Foto</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ej: Brindis en Cava Subterránea"
              className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block uppercase font-bold text-secondary mb-1">URL de la Imagen (Alta resolución)</label>
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block uppercase font-bold text-secondary mb-1">Cata Asociada</label>
            <div className="flex gap-2">
              <select
                value={newTasting}
                onChange={(e) => setNewTasting(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="Cata Malbec Reserva">Cata Malbec Reserva</option>
                <option value="Atardecer en el Viñedo">Atardecer en el Viñedo</option>
                <option value="Blancos de Altura">Blancos de Altura</option>
              </select>
              <button
                type="submit"
                className="bg-primary-container text-white font-bold uppercase px-4 py-3 rounded-xl hover:bg-primary transition-all shadow-sm flex-shrink-0"
              >
                Publicar
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {photos.map((p) => (
          <div key={p.id} className="bg-surface rounded-2xl border border-surface-variant overflow-hidden soft-shadow">
            <div className="relative h-48 w-full bg-surface-container">
              <Image src={p.url} alt={p.title} fill className="object-cover" />
            </div>
            <div className="p-4 space-y-1 text-xs">
              <p className="font-serif font-bold text-sm text-on-surface">{p.title}</p>
              <p className="text-secondary">{p.tastingTitle} • {p.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
