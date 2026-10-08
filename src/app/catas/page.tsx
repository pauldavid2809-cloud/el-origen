"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { TastingCard, TastingsEmptyState, TastingsLoadError, useBcvRates } from "@/components/TastingCard";
import type { Tasting, TastingCategory } from "@/types";
import { translations } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

type LoadState = "loading" | "ready" | "error";

/** Minúsculas y sin acentos, para que "degustacion" encuentre "Degustación". */
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export default function CatasCatalogPage() {
  const [lang, setLang] = useLang();
  const t = translations[lang];

  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [status, setStatus] = useState<LoadState>("loading");
  const [categoryFilter, setCategoryFilter] = useState<TastingCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const rates = useBcvRates();

  const loadTastings = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/tastings");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setTastings(Array.isArray(data.tastings) ? data.tastings : []);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    loadTastings();
  }, [loadTastings]);

  // Solo se ofrecen como filtro las categorías que tienen catas publicadas.
  const categories = useMemo(() => {
    const present = Array.from(new Set(tastings.map((x) => x.category)));
    return present.length > 1 ? present : [];
  }, [tastings]);

  const filteredTastings = useMemo(() => {
    const q = normalize(searchQuery.trim());
    return tastings.filter((x) => {
      if (categoryFilter !== "all" && x.category !== categoryFilter) return false;
      if (!q) return true;
      const haystack = [
        x.title,
        x.subtitle ?? "",
        x.description,
        x.dateDisplay,
        x.dateFull,
        x.location,
        x.sommelier?.name ?? "",
        ...(x.wines ?? []).map((w) => `${w.name} ${w.type}`),
      ].join(" ");
      return normalize(haystack).includes(q);
    });
  }, [tastings, categoryFilter, searchQuery]);

  const resetFilters = () => {
    setCategoryFilter("all");
    setSearchQuery("");
  };

  const hasTastings = status === "ready" && tastings.length > 0;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        <PageHeader eyebrow={t.catalog.badge} title={t.catalog.title} subtitle={t.catalog.subtitle} />

        <div className="px-5 sm:px-8 lg:px-12 max-w-[1320px] mx-auto w-full pt-10 sm:pt-14 pb-24">
          {/* Filtros (solo cuando hay catas que filtrar) */}
          {hasTastings && (
            <div className="flex flex-col md:flex-row gap-5 md:items-center justify-between mb-10 pb-6 border-b border-outline-variant">
              {categories.length > 0 ? (
                <div
                  className="flex gap-2 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 md:flex-wrap"
                  role="group"
                  aria-label={t.catalog.filterLabel}
                >
                  {(["all", ...categories] as const).map((id) => {
                    const active = categoryFilter === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCategoryFilter(id)}
                        className={`h-11 px-4 whitespace-nowrap rounded-full border text-[13px] font-medium transition-colors ${
                          active
                            ? "bg-primary-container border-primary-container text-white"
                            : "border-outline-variant text-on-surface-variant hover:border-primary-container hover:text-primary-container"
                        }`}
                      >
                        {id === "all" ? t.catalog.filterAll : t.categories[id] ?? id}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[14px] text-on-surface-variant" aria-live="polite">
                  {t.catalog.count(filteredTastings.length)}
                </p>
              )}

              <label className="relative w-full md:w-80">
                <span className="sr-only">{t.catalog.searchPlaceholder}</span>
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]"
                  aria-hidden="true"
                >
                  search
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.catalog.searchPlaceholder}
                  className="w-full h-11 bg-surface-container-lowest border border-outline-variant rounded pl-10 pr-4 text-[14px] text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary-container focus:outline-none transition-colors"
                />
              </label>
            </div>
          )}

          {status === "loading" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label={t.catalog.loading}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[520px] rounded-xl border border-outline-variant bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : status === "error" ? (
            <TastingsLoadError lang={lang} onRetry={loadTastings} headingLevel="h2" />
          ) : tastings.length === 0 ? (
            <TastingsEmptyState lang={lang} headingLevel="h2" />
          ) : filteredTastings.length === 0 ? (
            <div className="text-center py-20 px-6 border border-dashed border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-4xl text-primary-container/50" aria-hidden="true">wine_bar</span>
              <h2 className="font-serif text-2xl text-on-surface mt-3">{t.catalog.noResultsTitle}</h2>
              <p className="text-[14px] text-on-surface-variant mt-1 mb-5">{t.catalog.noResultsSubtitle}</p>
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[44px] px-2 text-[14px] font-semibold text-primary-container underline underline-offset-4"
              >
                {t.catalog.resetFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredTastings.map((tasting) => (
                <TastingCard key={tasting.id} tasting={tasting} currentLang={lang} rates={rates} />
              ))}
            </div>
          )}

          {/* Experiencias privadas */}
          <div className="mt-24 rounded-2xl bg-primary-container text-paper p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <p className="eyebrow !text-sun mb-4">{t.catalog.privateBadge}</p>
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-balance">{t.catalog.privateTitle}</h2>
              <p className="mt-4 text-[15px] text-paper/80 leading-relaxed">{t.catalog.privateSubtitle}</p>
            </div>
            <Link
              href="/privadas"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-paper text-primary hover:bg-white text-[14px] font-semibold rounded transition-colors flex-shrink-0"
            >
              {t.catalog.privateCta}
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
