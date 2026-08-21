"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerroirDivider } from "@/components/TerroirDivider";
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
    <div className="bg-background text-on-background min-h-screen flex flex-col selection:bg-primary/10 selection:text-primary">
      <Navbar currentLang={lang} onLanguageChange={handleLanguageChange} />

      <main className="flex-grow py-16 sm:py-24 px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              {t.catalog.badge}
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-on-surface tracking-tight mb-5">
            {t.catalog.title}
          </h1>
          <p className="text-[14px] sm:text-base text-on-surface-variant/80 max-w-xl mx-auto leading-relaxed">
            {t.catalog.subtitle}
          </p>
        </div>

        {/* Filter Bar (Floating Island Pill design) */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-12 p-2 rounded-2xl sm:rounded-full bg-black/[0.02] border border-black/[0.05]">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-300 ${
                  categoryFilter === cat.id
                    ? "bg-primary-container text-white shadow-sm"
                    : "text-on-surface-variant hover:text-primary hover:bg-black/[0.04]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.catalog.searchPlaceholder}
              className="w-full bg-white border border-black/[0.06] rounded-full pl-9 pr-4 py-2 text-[12px] text-on-surface focus:border-primary focus:outline-none transition-colors"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant/50 text-[16px]">
              search
            </span>
          </div>
        </div>

        {/* Tastings Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-on-surface-variant/60 text-xs">
            <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
            {t.catalog.loading}
          </div>
        ) : filteredTastings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-black/[0.05] p-8">
            <span className="material-symbols-outlined text-4xl text-primary/40 mb-3">wine_bar</span>
            <h3 className="font-serif text-xl font-semibold text-on-surface mb-1">{t.catalog.noResultsTitle}</h3>
            <p className="text-[13px] text-on-surface-variant/70 mb-4">{t.catalog.noResultsSubtitle}</p>
            <button
              onClick={() => {
                setCategoryFilter("all");
                setSearchQuery("");
              }}
              className="text-[12px] font-semibold text-primary underline"
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

        <TerroirDivider className="my-20" />

        {/* Private Inquiries Banner in Double-Bezel */}
        <div className="p-2 sm:p-2.5 rounded-[2.5rem] bg-black/[0.02] border border-black/[0.05]">
          <div className="bg-white rounded-[calc(2.5rem-0.625rem)] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-on-surface tracking-tight">
                {t.catalog.privateTitle}
              </h3>
              <p className="text-[13px] sm:text-sm text-on-surface-variant/80 max-w-xl">
                {t.catalog.privateSubtitle}
              </p>
            </div>
            <a
              href="/privadas"
              className="group inline-flex items-center gap-3 bg-primary-container hover:bg-primary text-white text-[12px] font-semibold pl-5 pr-2 py-2 rounded-full transition-all duration-300 shadow-sm flex-shrink-0"
            >
              <span>{t.catalog.privateCta}</span>
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </span>
            </a>
          </div>
        </div>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
