"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";
import { TastingCard } from "@/components/TastingCard";
import { Tasting } from "@/types";

export default function CatasCatalogPage() {
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [filteredTastings, setFilteredTastings] = useState<Tasting[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTastings() {
      try {
        const res = await fetch("/api/tastings");
        const data = await res.json();
        if (data.success) {
          setTastings(data.tastings);
          setFilteredTastings(data.tastings);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    loadTastings();
  }, []);

  useEffect(() => {
    let result = tastings;
    if (categoryFilter !== "all") {
      result = result.filter((t) => t.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.dateDisplay.toLowerCase().includes(q)
      );
    }
    setFilteredTastings(result);
  }, [categoryFilter, searchQuery, tastings]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-12 sm:py-20 px-4 sm:px-8 lg:px-16 max-w-container-max mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold tracking-[0.2em] text-primary bg-primary-fixed-dim/30 px-3 py-1 rounded-full">
            Catálogo de Experiencias
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-on-surface mt-3 mb-4">
            Catas y Degustaciones Exclusivas
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            Reserve sus cupos en línea para degustar añadas de colección guiadas por sommeliers en nuestra bodega boutique del Valle de Uco.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface border border-surface-variant rounded-2xl p-4 sm:p-6 mb-10 soft-shadow flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: "all", label: "Todas las Catas" },
              { id: "reserva", label: "Malbec Reserva" },
              { id: "atardecer", label: "Atardecer & Terrazas" },
              { id: "blancos", label: "Blancos de Altura" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  categoryFilter === cat.id
                    ? "bg-primary-container text-white shadow-sm"
                    : "bg-surface-container text-secondary hover:bg-surface-variant"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cepa, fecha..."
              className="w-full bg-surface-container-low border border-surface-variant rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-secondary text-sm">
              search
            </span>
          </div>
        </div>

        {/* Tastings Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-secondary">
            <span className="material-symbols-outlined animate-spin text-2xl mr-2">progress_activity</span>
            Cargando catálogo...
          </div>
        ) : filteredTastings.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-surface-variant">
            <span className="material-symbols-outlined text-4xl text-secondary mb-2">wine_bar</span>
            <h3 className="font-serif text-lg font-bold text-on-surface">No se encontraron catas</h3>
            <p className="text-xs text-secondary mt-1">Pruebe ajustando los filtros de búsqueda.</p>
            <button
              onClick={() => {
                setCategoryFilter("all");
                setSearchQuery("");
              }}
              className="mt-4 text-xs font-bold uppercase text-primary underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTastings.map((tasting) => (
              <TastingCard key={tasting.id} tasting={tasting} />
            ))}
          </div>
        )}

        <TerroirDivider className="my-16" />

        {/* Private Inquiries Banner */}
        <div className="bg-surface-container-low border border-surface-variant rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-on-surface">
              ¿Buscas una cata privada para tu empresa o grupo?
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
              Diseñamos experiencias a medida para aniversarios, viajes corporativos y agasajos exclusivos con sommelier y traslado privado.
            </p>
          </div>
          <a
            href="/privadas"
            className="bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl hover:bg-primary transition-all shadow-sm flex-shrink-0"
          >
            Solicitar Cata Privada
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
