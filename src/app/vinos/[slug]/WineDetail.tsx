"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { formatBs, formatUsd } from "@/components/PaymentDetails";
import { useBcvRates } from "@/components/TastingCard";
import { WineCard, type PublicWine } from "@/components/WineCard";
import { whatsappLink } from "@/lib/contact";
import { formatTastingDate } from "@/lib/dates";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useWineCart, type WineCartLimit } from "@/lib/useWineCart";
import { WINE_ORDER_MAX_BOTTLES, WINE_ORDER_MAX_LINES, isWineForSale, round2, wineMaxQty } from "@/lib/wineSale";
import type { Wine } from "@/types";
import { CartLink } from "../CartLink";
import { QtyStepper } from "../QtyStepper";
import { WINE_TYPE_LABEL, WINES_COPY } from "../copy";

export interface WineTasting {
  id: string;
  title: string;
  /** "YYYY-MM-DD" para mostrar la fecha en el idioma del visitante. */
  dateIso: string;
  /** Fecha en español. */
  date: string;
  href: string;
}

/* Ficha de un vino: la botella sobre fondo oscuro, su descripción, la ficha técnica,
   las catas en que se degustó y otros vinos. */
export function WineDetail({ wine, tastings, related }: { wine: Wine; tastings: WineTasting[]; related: PublicWine[] }) {
  const [lang, setLang] = useLang();
  useDocumentTitle(lang, { es: wine.name, en: wine.name });
  const t = WINES_COPY[lang];
  const router = useRouter();

  // Compra: solo si el vino está a la venta (publicado + activo + precio). El servidor vuelve a comprobarlo al pedir.
  const rates = useBcvRates();
  const cart = useWineCart();
  const forSale = isWineForSale(wine);
  const priceUsd = forSale ? wine.priceUsd : null;
  const maxQty = wineMaxQty(wine);
  const rate = rates?.USD ?? null;
  const priceBs = priceUsd !== null && rate ? round2(priceUsd * rate) : null;
  const inCart = cart.items.find((i) => i.wineId === wine.id)?.quantity ?? 0;
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState<{ text: string; warn: boolean } | null>(null);

  const limitText = (limit: WineCartLimit) =>
    limit === "max" ? t.limitMax(maxQty) : limit === "bottles" ? t.limitBottles(WINE_ORDER_MAX_BOTTLES) : t.limitLines(WINE_ORDER_MAX_LINES);
  const addToCart = () => {
    const result = cart.add(wine.id, qty, maxQty);
    setNote(result.limit ? { text: limitText(result.limit), warn: true } : { text: t.added, warn: false });
    return result;
  };
  const buyNow = () => {
    // Agrega y pasa al carrito; si no cupo ni una botella (tope de vinos distintos), avisa y se queda aquí.
    if (addToCart().quantity > 0) router.push("/vinos/carrito");
  };

  const basics = (
    [
      [t.type, WINE_TYPE_LABEL[lang][wine.type]],
      [t.grapes, wine.grapes],
      [t.vintage, wine.vintage],
      [t.region, wine.region],
      [t.winery, wine.winery],
    ] as [string, string][]
  ).filter(([, value]) => value);
  const sheet: [string, string][] = [...basics, ...wine.specs.map((s): [string, string] => [s.label, s.value])];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />

      <main className="flex-grow">
        {/* Botella y presentación */}
        <section className="bg-ink text-paper">
          <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pt-10 sm:pt-14 pb-16 sm:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-5">
              <div className="relative aspect-[3/4] max-w-sm mx-auto w-full">
                {wine.imageUrl ? (
                  // Las fotos vienen de Supabase Storage (o data URL en pruebas locales).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wine.imageUrl} alt={t.imageAlt(wine.name)} className="absolute inset-0 w-full h-full object-contain" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-paper/20" aria-hidden="true">
                    <span className="material-symbols-outlined text-8xl">wine_bar</span>
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <Link href="/vinos" className="inline-flex items-center gap-1.5 min-h-[44px] text-[13px] font-semibold text-paper/70 hover:text-sun">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
                  {t.back}
                </Link>
                {(forSale || cart.count > 0) && <CartLink lang={lang} count={cart.count} tone="dark" />}
              </div>
              <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-sun">
                {[WINE_TYPE_LABEL[lang][wine.type], wine.vintage].filter(Boolean).join(" · ")}
              </p>
              <h1 className="mt-3 font-serif text-[2.6rem] leading-[1.05] sm:text-6xl text-balance">{wine.name}</h1>
              {(wine.winery || wine.region) && (
                <p className="mt-4 text-[17px] sm:text-lg text-paper/80">{[wine.winery, wine.region].filter(Boolean).join(" · ")}</p>
              )}
              {wine.description && (
                <p className="mt-6 text-[16px] leading-relaxed text-paper/85 max-w-2xl whitespace-pre-line text-pretty">{wine.description}</p>
              )}
              {priceUsd !== null && (
                <div className="mt-8 max-w-md rounded-xl border border-paper/20 bg-paper/5 p-5 sm:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sun">{t.buyEyebrow}</p>
                  <p className="mt-3 font-serif text-4xl leading-none text-paper">
                    {formatUsd(priceUsd)}
                    <span className="ml-2 text-[13px] font-sans text-paper/70">{t.perBottle}</span>
                  </p>
                  {priceBs !== null && (
                    <p className="mt-2 text-[13px] text-paper/75 tabular-nums" title={t.bsTitle}>
                      {t.bsApprox(formatBs(priceBs, lang))}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span id="wine-qty-label" className="text-[12px] font-semibold uppercase tracking-[0.14em] text-paper/75">
                      {t.quantity}
                    </span>
                    <QtyStepper
                      value={qty}
                      max={maxQty}
                      onChange={(v) => setQty(Math.max(1, Math.min(maxQty, v)))}
                      lessLabel={t.fewer}
                      moreLabel={t.more}
                      labelledBy="wine-qty-label"
                      tone="dark"
                    />
                  </div>
                  <p className="mt-2 text-[12px] text-paper/65">
                    {t.maxPerOrder(maxQty)}
                    {inCart > 0 && <> {t.inCart(inCart)}</>}
                  </p>

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={buyNow}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-[52px] px-6 bg-sun hover:bg-tertiary-fixed-dim text-ink text-[14px] font-semibold rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">shopping_bag</span>
                      {t.buyNow}
                    </button>
                    <button
                      type="button"
                      onClick={addToCart}
                      className="flex-1 inline-flex items-center justify-center gap-2 h-[52px] px-6 border border-paper/40 hover:border-sun hover:text-sun text-paper text-[14px] font-semibold rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_shopping_cart</span>
                      {t.addToCart}
                    </button>
                  </div>
                  <div role="status" aria-live="polite" className="mt-3 min-h-[20px] text-[13px]">
                    {note && (
                      <>
                        <span className={note.warn ? "text-tertiary-fixed" : "text-paper/85"}>{note.text}</span>{" "}
                        <Link href="/vinos/carrito" className="font-semibold text-sun underline underline-offset-4">
                          {t.viewCart}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
              <a
                href={whatsappLink(t.askMessage(wine.name))}
                target="_blank"
                rel="noopener noreferrer"
                className={`${priceUsd !== null ? "mt-4 border border-paper/40 hover:border-sun hover:text-sun text-paper" : "mt-8 bg-sun hover:bg-tertiary-fixed-dim text-ink"} inline-flex items-center gap-2 h-[52px] px-7 text-[14px] font-semibold rounded transition-colors`}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                {t.ask}
              </a>
            </div>
          </div>
        </section>

        {/* Ficha técnica */}
        {sheet.length > 0 && (
          <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className="eyebrow mb-4">{wine.name}</p>
              <h2 className="font-serif text-[2rem] sm:text-5xl leading-[1.1] text-on-surface">{t.techSheet}</h2>
            </div>
            <dl className="lg:col-span-8 border-t border-outline-variant">
              {sheet.map(([label, value], i) => (
                <div key={`${label}-${i}`} className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] gap-1 sm:gap-6 py-5 border-b border-outline-variant">
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.16em] text-tertiary pt-0.5">{label}</dt>
                  <dd className="text-[16px] text-on-surface leading-relaxed whitespace-pre-line">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Catas */}
        {tastings.length > 0 && (
          <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pb-16 sm:pb-24">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8">
              <p className="eyebrow">{t.tastedIn}</p>
              <ul className="mt-4 divide-y divide-outline-variant">
                {tastings.map((c) => (
                  <li key={c.id}>
                    <Link href={c.href} className="group flex items-center justify-between gap-4 py-3 min-h-[52px]">
                      <span className="min-w-0">
                        <span className="block font-serif text-xl text-on-surface group-hover:text-primary-container">{c.title}</span>
                        <span className="block text-[13px] text-on-surface-variant">{formatTastingDate(c.dateIso, lang, c.date)}</span>
                      </span>
                      <span className="material-symbols-outlined text-[20px] text-primary-container transition-transform group-hover:translate-x-1" aria-hidden="true">
                        arrow_forward
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Otros vinos */}
        {related.length > 0 && (
          <section className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-12 pb-24 sm:pb-32">
            <div className="flex items-end justify-between gap-6 mb-8 border-t border-outline-variant pt-12">
              <h2 className="font-serif text-3xl sm:text-4xl text-on-surface">{t.related}</h2>
              <Link href="/vinos" className="text-[13px] font-semibold uppercase tracking-[0.16em] text-on-surface hover:text-primary-container whitespace-nowrap">
                {t.viewAll}
              </Link>
            </div>
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
              {related.map((w) => (
                <li key={w.id}>
                  <WineCard wine={w} lang={lang} rates={rates} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Footer currentLang={lang} />
    </div>
  );
}
