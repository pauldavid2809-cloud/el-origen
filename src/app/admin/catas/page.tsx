"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Tasting } from "@/types";

export default function AdminCatasPage() {
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [dateDisplay, setDateDisplay] = useState("");
  const [timeStart, setTimeStart] = useState("18:00");
  const [timeEnd, setTimeEnd] = useState("20:30");
  const [price, setPrice] = useState(45000);
  const [totalSpots, setTotalSpots] = useState(20);
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop"
  );
  const [category, setCategory] = useState<"reserva" | "atardecer" | "blancos">("reserva");

  useEffect(() => {
    async function loadTastings() {
      try {
        const res = await fetch("/api/tastings");
        const data = await res.json();
        if (data.success) {
          setTastings(data.tastings);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadTastings();
  }, []);

  const handleCreateTasting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const res = await fetch("/api/tastings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          subtitle,
          description,
          date,
          dateDisplay: dateDisplay || "PRÓX",
          dateFull: `Fecha: ${date}`,
          timeStart,
          timeEnd,
          location: "El Origen, Caracas, Venezuela",
          price: Number(price),
          priceFormatted: `$${Number(price)} USD`,
          totalSpots: Number(totalSpots),
          availableSpots: Number(totalSpots),
          imageUrl,
          imageAlt: title,
          category,
          wines: [
            {
              name: `${title} - Selección Especial`,
              vintage: "2022",
              type: "Cosecha Limitada",
              description: "Vino emblemático de altura con notas minerales.",
              aromaProfile: ["Frutos Rojos", "Roble Francés"],
              audioStory: "Historia del viñedo en las laderas andinas.",
            },
          ],
          pairings: ["Tabla de quesos madurados", "Chocolates artesanales"],
          sommelier: {
            name: "Jaifred Pastran",
            role: "Head Sommelier & Admin",
            bio: "Especialista en maridaje y terroir de altura.",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
          },
          status: "active",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTastings([data.tasting, ...tastings]);
        setIsModalOpen(false);
        // Reset
        setTitle("");
        setDescription("");
      }
    } catch {
      alert("Error al crear la cata.");
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-surface-variant pb-6">
        <div>
          <p className="text-xs uppercase font-bold tracking-[0.2em] text-secondary mb-1">
            Gestión de Experiencias
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
            Catas & Cupos
          </h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary-container text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary transition-all shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Crear Nueva Cata
        </button>
      </header>

      {/* Grid of Tastings */}
      {loading ? (
        <div className="text-center py-20 text-secondary">
          <span className="material-symbols-outlined animate-spin text-2xl mr-2">progress_activity</span>
          Cargando catálogo...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tastings.map((t) => (
            <div
              key={t.id}
              className="bg-surface rounded-2xl border border-surface-variant soft-shadow overflow-hidden flex flex-col justify-between"
            >
              <div className="relative h-44 w-full bg-surface-container">
                <Image src={t.imageUrl} alt={t.title} fill className="object-cover" />
                <div className="absolute top-3 left-3 bg-primary-container text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
                  {t.dateDisplay}
                </div>
                <div className="absolute top-3 right-3 bg-surface/90 backdrop-blur-sm text-primary font-bold text-xs px-2.5 py-1 rounded">
                  {t.availableSpots} / {t.totalSpots} cupos
                </div>
              </div>

              <div className="p-5 flex-grow space-y-2">
                <h3 className="font-serif text-lg font-bold text-on-surface">{t.title}</h3>
                <p className="text-xs text-on-surface-variant line-clamp-2">{t.description}</p>
                <div className="flex justify-between items-center text-xs pt-2 text-secondary">
                  <span>{t.timeStart} - {t.timeEnd} hs</span>
                  <span className="font-serif font-bold text-primary text-base">{t.priceFormatted}</span>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low border-t border-surface-variant flex justify-between items-center text-xs">
                <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                  t.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                }`}>
                  {t.status === "active" ? "Publicada" : "Agotada"}
                </span>
                <div className="flex gap-2">
                  <a
                    href={`/catas/${t.slug || t.id}`}
                    target="_blank"
                    className="text-primary font-bold hover:underline"
                  >
                    Ver en vivo ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal to create Tasting */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-variant rounded-3xl max-w-lg w-full p-6 sm:p-8 soft-shadow max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-surface-variant pb-4 mb-6">
              <h3 className="font-serif text-xl font-bold text-on-surface">Crear Nueva Experiencia de Cata</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTasting} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-bold tracking-wider text-secondary mb-1">Título de la Cata *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Cata Vertical Malbec Ícono"
                  className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase font-bold tracking-wider text-secondary mb-1">Subtítulo / Tagline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej: Recorrido por las mejores añadas de la década"
                  className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase font-bold tracking-wider text-secondary mb-1">Descripción</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalla en qué consiste la experiencia..."
                  className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold tracking-wider text-secondary mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase font-bold tracking-wider text-secondary mb-1">Etiqueta Fecha</label>
                  <input
                    type="text"
                    value={dateDisplay}
                    onChange={(e) => setDateDisplay(e.target.value)}
                    placeholder="Ej: 15 NOV"
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold tracking-wider text-secondary mb-1">Horario Inicio</label>
                  <input
                    type="text"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    placeholder="18:00"
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase font-bold tracking-wider text-secondary mb-1">Horario Fin</label>
                  <input
                    type="text"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    placeholder="20:30"
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-bold tracking-wider text-secondary mb-1">Precio ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase font-bold tracking-wider text-secondary mb-1">Cupos Totales</label>
                  <input
                    type="number"
                    value={totalSpots}
                    onChange={(e) => setTotalSpots(Number(e.target.value))}
                    className="w-full bg-surface-container-low border border-surface-variant rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent border border-surface-variant text-secondary text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-surface-variant"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-grow bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-primary transition-all shadow-md"
                >
                  Guardar y Publicar Cata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
