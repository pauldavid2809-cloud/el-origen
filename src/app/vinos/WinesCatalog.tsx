"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/Brand";
import { useBcvRates } from "@/components/TastingCard";
import { WineCard, type PublicWine } from "@/components/WineCard";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useWineCart } from "@/lib/useWineCart";
import { isWineForSale } from "@/lib/wineSale";
import type { PublicWineStore } from "@/lib/wineStoreRules";
import { CartLink } from "./CartLink";
import { StoreClosedNotice } from "./StoreClosedNotice";
import { WINES_COPY } from "./copy";

/* `store`: estado de la tienda de ahora (la página es dinámica). Cerrada = aviso arriba y sin «Comprar»; los precios se ven. */
export function WinesCatalog({ wines, store }: { wines: PublicWine[]; store: PublicWineStore }) {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: "Nuestros vinos", en: "Our wines" });
  const t = WINES_COPY[lang];
  // Tasas del día (una sola consulta para todas las tarjetas) y carrito: solo importan si hay vinos a la venta.
  const rates = useBcvRates();
  const cart = useWineCart();
  const hasSale = store.enabled && wines.some(isWineForSale);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        <PageHeader
          eyebrow={t.eyebrow}
          title={
            <>
              {t.titleMain} <em className="italic font-normal text-primary-container">{t.titleHighlight}</em>
            </>
          }
          subtitle={t.subtitle}
        />

        <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pt-8 pb-24">
          {!store.enabled && wines.some(isWineForSale) && <StoreClosedNotice lang={lang} message={store.closedMessage} className="mb-8 max-w-3xl" />}
          {(hasSale || cart.count > 0) && (
            <div className="mb-8 flex justify-end">
              <CartLink lang={lang} count={cart.count} />
            </div>
          )}
          {wines.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16">
              <span className="material-symbols-outlined text-5xl text-primary-container/60" aria-hidden="true">wine_bar</span>
              <h2 className="font-serif text-2xl mt-4">{t.emptyTitle}</h2>
              <p className="mt-2 text-on-surface-variant">{t.emptyText}</p>
              <Link
                href="/catas"
                className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold"
              >
                {t.seeTastings}
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
              {wines.map((wine) => (
                <li key={wine.id}>
                  <WineCard wine={wine} lang={lang} rates={rates} storeOpen={store.enabled} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
