"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { TastingCard } from "@/components/TastingCard";
import { Tasting } from "@/types";
import { translations, Language } from "@/lib/i18n";

export default function CatasCatalogPage() {
  const [lang, setLang] = useState<Language>("es");
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [filteredTastings, setFilteredTastings] = useState<Tasting[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("el_origen_lang") as Language | null;
    if (saved === "en" || saved === "es") {
      setLang(saved);
    }
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("el_origen_lang", newLang);
  };

  const t = translations[lang];

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

  const categories = [
    { id: "all", label: t.catalog.filterAll },
    { id: "reserva", label: t.catalog.filterReserva },
    { id: "atardecer", label: t.catalog.filterSunset },
    { id: "blancos", label: t.catalog.filterWhites },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={handleLanguageChange} />

      <main className="flex-grow">
        <PageHeader eyebrow={t.catalog.badge} title={t.catalog.title} subtitle={t.catalog.subtitle} />

        <div className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-10 sm:pt-14 pb-24">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-5 md:items-center justify-between mb-10 pb-6 border-b border-outline-variant">
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 md:flex-wrap" role="tablist">
              {categories.map((cat) => {
                const active = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`h-10 px-4 whitespace-nowrap rounded-full border text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-primary-container border-primary-container text-white"
                        : "border-outline-variant text-on-surface-variant hover:border-primary-container hover:text-primary-container"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <label className="relative w-full md:w-80">
              <span className="sr-only">{t.catalog.searchPlaceholder}</span>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.catalog.searchPlaceholder}
                className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded pl-10 pr-4 text-[14px] text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-container focus:outline-none transition-colors"
              />
            </label>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label={t.catalog.loading}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[520px] rounded-xl border border-outline-variant bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : filteredTastings.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-4xl text-primary-container/50">wine_bar</span>
              <h3 className="font-serif text-2xl text-on-surface mt-3">{t.catalog.noResultsTitle}</h3>
              <p className="text-[14px] text-on-surface-variant mt-1 mb-5">{t.catalog.noResultsSubtitle}</p>
              <button
                onClick={() => {
                  setCategoryFilter("all");
                  setSearchQuery("");
                }}
                className="text-[14px] font-semibold text-primary-container underline underline-offset-4"
              >
                {t.catalog.resetFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredTastings.map((tasting) => (
                <TastingCard key={tasting.id} tasting={tasting} currentLang={lang} />
              ))}
            </div>
          )}

          {/* Catas privadas */}
          <div className="mt-24 rounded-2xl bg-primary-container text-paper p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <p className="eyebrow !text-sun mb-4">{t.nav.privadas}</p>
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-balance">{t.catalog.privateTitle}</h2>
              <p className="mt-4 text-[15px] text-paper/80 leading-relaxed">{t.catalog.privateSubtitle}</p>
            </div>
            <Link
              href="/privadas"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-paper text-primary hover:bg-white text-[14px] font-semibold rounded transition-colors flex-shrink-0"
            >
              {t.catalog.privateCta}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
