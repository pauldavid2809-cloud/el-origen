"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { formatBs, formatUsd } from "@/components/PaymentDetails";
import { useBcvRates } from "@/components/TastingCard";
import type { Language } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useWineCart } from "@/lib/useWineCart";
import { WINE_ORDER_MAX_BOTTLES, round2, wineMaxQty } from "@/lib/wineSale";
import { quoteShipping, type PublicWineStore, type ShippingQuote, type WineStoreConfig } from "@/lib/wineStoreRules";
import type { SaleWine } from "@/lib/wines";
import { QtyStepper } from "../QtyStepper";
import { StoreClosedNotice } from "../StoreClosedNotice";
import { WINE_TYPE_LABEL } from "../copy";
import { CART_COPY } from "./copy";

type Fulfillment = "pickup" | "delivery";
type FieldKey = "name" | "docId" | "phone" | "address" | "zone";
/** Cómo se muestra el envío en la vista previa: sin envío (retiro), a coordinar, falta elegir la zona, con costo o gratis. */
type ShipKind = "none" | "coordinated" | "pickZone" | "paid" | "free";

/** Una línea del carrito con los datos actuales del servidor (`wine` es null si el vino ya no existe o no está publicado). */
interface CartLine {
  wineId: string;
  wine: SaleWine | null;
  /** Se puede comprar ahora (a la venta y con existencias): entra en el pedido y en los totales. */
  buyable: boolean;
  /** Controla existencias y no queda ninguna. */
  soldOut: boolean;
  /** Máximo de botellas de este vino ahora: el menor entre su tope por pedido y las que quedan. */
  max: number;
  /** Las botellas que quedan (y no el tope por pedido) son lo que limita la cantidad. */
  limitedByStock: boolean;
  quantity: number;
  total: number;
}

/** Tope por pedido de un vino (el suyo o el configurado por defecto), sin contar las existencias. */
const perOrderOf = (wine: SaleWine, store: PublicWineStore) => wineMaxQty(wine, store.defaultMaxPerOrder);
/** Máximo de botellas que se pueden pedir de un vino ahora: su tope por pedido y las que quedan. */
const capOf = (wine: SaleWine, store: PublicWineStore) =>
  wine.available === null ? perOrderOf(wine, store) : Math.max(0, Math.min(perOrderOf(wine, store), wine.available));

/** `quoteShipping` solo mira retiro y entrega: se arma la configuración mínima con lo público (vista previa; el servidor recalcula). */
const configOf = (s: PublicWineStore): WineStoreConfig => ({
  enabled: s.enabled,
  closedMessage: s.closedMessage,
  pickup: s.pickup,
  delivery: s.delivery,
  defaultMaxPerOrder: s.defaultMaxPerOrder,
  terms: { es: [], en: [] },
});

const digits = (v: string) => v.replace(/\D/g, "");

const inputClass =
  "w-full h-12 bg-surface-container-lowest border rounded px-3.5 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none transition-colors";
const labelClass = "block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-1.5";

export default function WineCartPage() {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const t = CART_COPY[lang];
  useDocumentTitle(lang, { es: CART_COPY.es.docTitle, en: CART_COPY.en.docTitle });

  const cart = useWineCart();
  const { setQty } = cart;
  const rates = useBcvRates();
  const rate = rates?.USD ?? null;
  const bs = (usd: number) => (rate ? t.bsApprox(formatBs(round2(usd * rate), lang)) : null);

  /* ─── Datos actuales de los vinos del carrito (precio vigente, si siguen a la venta, cuántas botellas quedan) y de la tienda ─── */
  const [loaded, setLoaded] = useState<{ wines: Record<string, SaleWine>; asked: string[]; store: PublicWineStore } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [adjusted, setAdjusted] = useState(false);
  const idsKey = cart.items.map((i) => i.wineId).join(",");
  /** Lo consultado al servidor, una vez que cubre todos los vinos que hay ahora en el carrito (null mientras tanto). */
  const view = loaded !== null && cart.items.every((i) => loaded.asked.includes(i.wineId)) ? loaded : null;
  const settled = view !== null;
  const store = view?.store ?? null;

  useEffect(() => {
    if (!cart.ready || !idsKey) return;
    let alive = true;
    const asked = idsKey.split(",");
    setLoadFailed(false);
    fetch(`/api/wines/cart?ids=${encodeURIComponent(idsKey)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (!d?.success || !Array.isArray(d.wines) || !d.store) throw new Error("respuesta inválida");
        setLoaded({ wines: Object.fromEntries((d.wines as SaleWine[]).map((w) => [w.id, w])), asked, store: d.store as PublicWineStore });
      })
      .catch(() => alive && setLoadFailed(true));
    return () => {
      alive = false;
    };
  }, [cart.ready, idsKey, reload]);

  // Si el máximo de un vino bajó desde que se agregó (tope por pedido o botellas que quedan), la cantidad guardada se ajusta.
  useEffect(() => {
    if (!view) return;
    let changed = false;
    for (const item of cart.items) {
      const wine = view.wines[item.wineId];
      if (!wine || !wine.forSale) continue;
      const cap = capOf(wine, view.store);
      if (cap >= 1 && item.quantity > cap) {
        setQty(item.wineId, cap);
        changed = true;
      }
    }
    if (changed) setAdjusted(true);
  }, [view, cart.items, setQty]);

  const lines: CartLine[] = cart.items.flatMap((item): CartLine[] => {
    const wine = view?.wines[item.wineId] ?? null;
    if (!view || !wine) {
      return settled ? [{ wineId: item.wineId, wine: null, buyable: false, soldOut: false, max: 0, limitedByStock: false, quantity: item.quantity, total: 0 }] : [];
    }
    const onSale = wine.forSale && (wine.priceUsd ?? 0) > 0;
    const buyable = onSale && !wine.soldOut;
    const max = capOf(wine, view.store);
    const quantity = Math.min(item.quantity, max);
    const limitedByStock = wine.available !== null && wine.available < perOrderOf(wine, view.store);
    return [
      { wineId: item.wineId, wine, buyable, soldOut: onSale && wine.soldOut, max, limitedByStock, quantity, total: buyable ? round2((wine.priceUsd ?? 0) * quantity) : 0 },
    ];
  });
  const sale = lines.filter((l) => l.buyable);
  const gone = lines.filter((l) => !l.buyable);
  const bottles = sale.reduce((n, l) => n + l.quantity, 0);
  const subtotal = round2(sale.reduce((sum, l) => sum + l.total, 0));
  const overBottles = bottles > WINE_ORDER_MAX_BOTTLES;

  /* ─── Cómo se recibe y cuánto cuesta el envío (vista previa: el servidor recalcula al crear el pedido) ─── */
  const pickupOn = store ? store.pickup.enabled : true;
  const deliveryOn = store ? store.delivery.enabled && (store.delivery.mode !== "zones" || store.delivery.zones.length > 0) : true;
  const options: Fulfillment[] = [...(pickupOn ? (["pickup"] as const) : []), ...(deliveryOn ? (["delivery"] as const) : [])];
  const [choice, setChoice] = useState<Fulfillment>("pickup");
  /** Lo elegido si el administrador lo ofrece; si lo desactivó, la forma que queda. */
  const fulfillment: Fulfillment = options.includes(choice) ? choice : options[0] ?? "pickup";
  const zones = store?.delivery.zones ?? [];
  const zonesMode = deliveryOn && store?.delivery.mode === "zones";
  const [zoneChoice, setZoneChoice] = useState("");
  /** La zona elegida solo vale mientras siga existiendo (el administrador pudo quitarla). */
  const zoneId = zones.some((z) => z.id === zoneChoice) ? zoneChoice : "";
  const quote: ShippingQuote | null = store ? quoteShipping(configOf(store), { fulfillment, subtotalUsd: subtotal, zoneId }) : null;
  const shippingUsd = quote?.ok ? quote.shippingUsd : 0;
  const total = round2(subtotal + shippingUsd);
  let shipKind: ShipKind = "none";
  if (fulfillment === "delivery" && quote) {
    if (quote.ok) shipKind = quote.coordinated ? "coordinated" : quote.shippingUsd > 0 ? "paid" : "free";
    else if (quote.code === "zone_required") shipKind = "pickZone";
  }
  const shipZoneName = quote?.ok ? quote.zone?.name ?? null : null;
  // «Envío gratis desde $X»: se avisa cuánto falta mientras el envío tenga costo.
  const freeFrom = store?.delivery.mode !== "coordinate" ? store?.delivery.freeFromUsd ?? null : null;
  const freeHint =
    freeFrom !== null && subtotal < freeFrom && (shipKind === "paid" || (shipKind === "pickZone" && zones.some((z) => z.feeUsd > 0)))
      ? t.freeFromHint(formatUsd(freeFrom), formatUsd(round2(freeFrom - subtotal)))
      : null;
  /** Texto corto del costo de envío para la fila del resumen. */
  const shipValue =
    shipKind === "paid" ? formatUsd(shippingUsd) : shipKind === "free" ? t.shippingFree : shipKind === "coordinated" ? t.shippingCoordinated : t.shippingPickZone;

  /* ─── Cuenta y formulario ─── */
  /** Solo compran los miembros con sesión: sin sesión se muestra la invitación a ingresar o registrarse. */
  const [account, setAccount] = useState<"loading" | "member" | "guest">("loading");
  const [memberEmail, setMemberEmail] = useState("");
  const [form, setForm] = useState({ name: "", docId: "", phone: "", address: "", note: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [submitError, setSubmitError] = useState<{ text: string; pending?: boolean } | null>(null);
  const [errorFocus, setErrorFocus] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  // Sesión de miembro: con ella se prellenan los datos (el correo del pedido es el de la cuenta).
  useEffect(() => {
    let alive = true;
    fetch("/api/members/me?orders=0", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive) return;
        const m = data?.member;
        if (!m) {
          setAccount("guest");
          return;
        }
        setForm((f) => ({ ...f, name: f.name || m.fullName || "", phone: f.phone || m.phone || "" }));
        setMemberEmail(m.email || "");
        setAccount("member");
      })
      .catch(() => alive && setAccount("guest"));
    return () => {
      alive = false;
    };
  }, []);

  const errors: Partial<Record<FieldKey, string>> = {};
  if (form.name.trim().length < 3) errors.name = t.errRequired;
  if (digits(form.docId).length < 5) errors.docId = form.docId.trim() ? t.errDocId : t.errRequired;
  if (digits(form.phone).length < 10) errors.phone = form.phone.trim() ? t.errPhone : t.errRequired;
  if (fulfillment === "delivery" && form.address.trim().length < 8) errors.address = form.address.trim() ? t.errAddress : t.errRequired;
  if (fulfillment === "delivery" && zonesMode && !zoneId) errors.zone = t.errZone;
  const dataValid = Object.keys(errors).length === 0;

  const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Con datos inválidos, el foco va al primer campo marcado (el navegador lo trae a la vista).
  useEffect(() => {
    if (!errorFocus) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errorFocus]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    if (!dataValid) {
      setShowErrors(true);
      setErrorFocus((n) => n + 1);
      return;
    }
    if (!acceptedTerms) {
      setTermsError(true);
      termsRef.current?.focus();
      return;
    }
    if (!store || !store.enabled || options.length === 0 || sale.length === 0 || overBottles) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/wine-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: sale.map((l) => ({ wineId: l.wineId, quantity: l.quantity })),
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          customerDocId: form.docId.trim(),
          fulfillment,
          deliveryAddress: fulfillment === "delivery" ? form.address.trim() : undefined,
          deliveryZoneId: fulfillment === "delivery" && zonesMode ? zoneId : undefined,
          deliveryNote: form.note.trim() || undefined,
          acceptedTerms: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      // Solo se sigue una ruta interna del propio sitio (el servidor responde `/pedido/<token>`).
      if (data.success && typeof data.redirectUrl === "string" && data.redirectUrl.startsWith("/") && !data.redirectUrl.startsWith("//")) {
        setRedirecting(true);
        cart.clear();
        router.push(data.redirectUrl);
        return;
      }
      // La sesión venció mientras completaba la compra.
      if (res.status === 401 && data.code === "login_required") {
        setAccount("guest");
        return;
      }
      if (res.status === 429 || data.code === "rate_limited") {
        setSubmitError({ text: t.rateLimited });
        return;
      }
      // La tienda cerró mientras completaba la compra: se vuelve a pedir su estado y se muestra el aviso.
      if (res.status === 403 && data.code === "store_closed") {
        setSubmitError({ text: t.storeClosedError });
        setReload((x) => x + 1);
        return;
      }
      // La tienda no pudo leer su configuración: no se cobra nada hasta que se resuelva.
      if (res.status === 503 && data.code === "store_unavailable") {
        setSubmitError({ text: t.storeUnavailableError });
        return;
      }
      if (data.code === "insufficient_stock") {
        // Otra persona se llevó botellas: se dice cuántas quedan y se refresca el carrito (las cantidades se ajustan solas).
        const name = view?.wines[String(data.wineId)]?.name;
        const left = Number(data.available);
        setSubmitError({ text: name && Number.isFinite(left) ? t.stockError(name, left) : data.message || t.unavailableError });
        setReload((x) => x + 1);
        return;
      }
      // El administrador cambió el retiro, la entrega o las zonas desde que se abrió la página: se recargan las opciones.
      if (["pickup_disabled", "delivery_disabled", "zone_required", "zone_invalid"].includes(data.code)) {
        if (data.code === "zone_invalid" || data.code === "zone_required") setZoneChoice("");
        setSubmitError({ text: t.configChanged });
        setReload((x) => x + 1);
        return;
      }
      if (data.code === "wine_unavailable") {
        // Algún vino se apagó o se despublicó: se vuelven a pedir los datos y la línea pasa a «ya no está a la venta».
        setSubmitError({ text: t.unavailableError });
        setReload((x) => x + 1);
        return;
      }
      if (data.code === "too_many_pending") {
        setSubmitError({ text: t.tooManyPending, pending: true });
        return;
      }
      if (data.field === "acceptedTerms") setTermsError(true);
      setSubmitError({ text: data.message || t.submitError });
    } catch {
      setSubmitError({ text: t.connectionError });
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Vista ─── */
  const spinner = (text: string) => (
    <div className="py-32 flex justify-center items-center gap-2 text-on-surface-variant" role="status">
      <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
      {text}
    </div>
  );

  let body: React.ReactNode;
  if (!cart.ready) {
    body = spinner(t.loading);
  } else if (redirecting) {
    body = spinner(t.redirecting);
  } else if (cart.items.length === 0) {
    body = (
      <div className="max-w-md mx-auto text-center py-16">
        <span className="material-symbols-outlined text-5xl text-primary-container/60" aria-hidden="true">shopping_bag</span>
        <h2 className="font-serif text-2xl mt-4">{t.emptyTitle}</h2>
        <p className="mt-2 text-on-surface-variant">{t.emptyText}</p>
        <Link
          href="/vinos"
          className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold"
        >
          {t.seeWines}
        </Link>
      </div>
    );
  } else if (!view && loadFailed) {
    body = (
      <div className="max-w-md mx-auto text-center py-16" role="alert">
        <span className="material-symbols-outlined text-5xl text-primary-container/50" aria-hidden="true">cloud_off</span>
        <p className="text-on-surface-variant mt-4">{t.loadError}</p>
        <button
          type="button"
          onClick={() => setReload((n) => n + 1)}
          className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded border border-outline-variant hover:border-primary-container text-[14px] font-semibold"
        >
          {t.retry}
        </button>
      </div>
    );
  } else if (!view) {
    body = spinner(t.loading);
  } else {
    const shop = view.store;
    const policies = shop.policies[lang];
    body = (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Pedido */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8" aria-labelledby="wc-lines-title">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="wc-lines-title" className="font-serif text-2xl">{t.linesTitle}</h2>
              {sale.length > 0 && <p className="text-[14px] text-on-surface-variant">{t.bottles(bottles)}</p>}
            </div>

            {adjusted && (
              <p role="status" className="mt-4 rounded-lg border border-tertiary/30 bg-tertiary-fixed/50 px-4 py-3 text-[13px] text-on-tertiary-fixed-variant">
                {t.adjusted}
              </p>
            )}

            {gone.length > 0 && (
              <div className="mt-5 rounded-xl border border-tertiary/30 bg-tertiary-fixed/40 p-4">
                <p className="font-semibold text-[14px] text-on-tertiary-fixed-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">info</span>
                  {sale.length === 0 ? t.noneAvailableTitle : t.unavailableTitle}
                </p>
                <p className="mt-1 text-[13px] text-on-tertiary-fixed-variant">{sale.length === 0 ? t.noneAvailableText : t.unavailableText}</p>
                <ul className="mt-3 divide-y divide-tertiary/20">
                  {gone.map((l) => {
                    const name = l.wine?.name ?? t.unknownWine;
                    return (
                      <li key={l.wineId} className="flex items-center justify-between gap-3 py-1">
                        <span className="min-w-0 break-words text-[14px] text-on-surface">
                          {name}
                          {l.wine && <span className="block text-[12px] font-semibold text-on-tertiary-fixed-variant">{l.soldOut ? t.goneSoldOut : t.goneNotForSale}</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => cart.remove(l.wineId)}
                          aria-label={t.removeAria(name)}
                          className="min-h-11 px-2 flex-shrink-0 text-[13px] font-semibold text-on-surface-variant hover:text-error"
                        >
                          {t.remove}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {sale.length === 0 ? (
              <Link
                href="/vinos"
                className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold"
              >
                {t.seeWines}
              </Link>
            ) : (
              <>
                <ul className="mt-2 divide-y divide-outline-variant">
                  {sale.map((l) => (
                    <LineRow
                      key={l.wineId}
                      line={l}
                      lang={lang}
                      onQty={(q) => setQty(l.wineId, q)}
                      onRemove={() => cart.remove(l.wineId)}
                    />
                  ))}
                </ul>

                <dl className="mt-2 pt-5 border-t border-outline-variant space-y-2 text-[14px]">
                  <div className="flex justify-between gap-4 text-on-surface-variant">
                    <dt>{t.subtotal}</dt>
                    <dd className="font-medium tabular-nums">{formatUsd(subtotal)}</dd>
                  </div>
                  {shipKind !== "none" && (
                    <div className="flex justify-between gap-4 text-on-surface-variant">
                      <dt className="min-w-0 break-words">{shipZoneName ? t.shippingWithZone(shipZoneName) : t.shipping}</dt>
                      <dd className="font-medium tabular-nums text-right">{shipValue}</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline gap-4 pt-2">
                    <dt className="font-semibold text-on-surface">{t.total}</dt>
                    <dd className="text-right">
                      <span className="block font-serif text-3xl text-primary-container">{formatUsd(total)}</span>
                      {bs(total) && <span className="block text-[13px] text-on-surface-variant tabular-nums">{bs(total)}</span>}
                    </dd>
                  </div>
                </dl>
                {rate && <p className="mt-2 text-[12px] text-on-surface-variant">{t.bsNote}</p>}
                {shipKind === "coordinated" && <p className="mt-2 text-[12px] text-on-surface-variant">{t.shippingNoteCoordinated}</p>}
                {overBottles && (
                  <p role="alert" className="mt-4 text-[13px] text-error">{t.overBottles(WINE_ORDER_MAX_BOTTLES)}</p>
                )}
              </>
            )}
          </section>

          <Link href="/vinos" className="inline-flex items-center gap-1.5 min-h-[44px] text-[13px] font-semibold text-on-surface-variant hover:text-primary-container">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
            {t.keepShopping}
          </Link>
        </div>

        {/* Cuenta y datos */}
        {sale.length > 0 && (
          <aside className="lg:col-span-5 min-w-0">
            {!shop.enabled ? (
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8">
                <span className="w-12 h-12 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant inline-flex items-center justify-center" aria-hidden="true">
                  <span className="material-symbols-outlined text-[24px]">pause_circle</span>
                </span>
                <p className="mt-4 font-serif text-xl text-on-surface">{t.closedCheckoutTitle}</p>
                <p className="mt-2 text-[14px] text-on-surface-variant leading-relaxed">{t.closedCheckoutText}</p>
              </div>
            ) : options.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8" role="alert">
                <p className="text-[14px] text-on-surface-variant leading-relaxed">{t.noFulfillment}</p>
              </div>
            ) : account === "loading" ? (
              <p className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 min-h-[180px] flex items-center justify-center gap-2 text-[14px] text-on-surface-variant" role="status">
                <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden="true">progress_activity</span>
                {t.checkingAccount}
              </p>
            ) : account === "guest" ? (
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8">
                <span className="w-12 h-12 rounded-full bg-primary-fixed text-primary-container inline-flex items-center justify-center" aria-hidden="true">
                  <span className="material-symbols-outlined text-[24px]">person</span>
                </span>
                <p className="mt-4 font-serif text-xl text-on-surface">{t.loginTitle}</p>
                <p className="mt-2 text-[14px] text-on-surface-variant leading-relaxed">{t.loginText}</p>
                <Link
                  href={`/ingresar?next=${encodeURIComponent("/vinos/carrito")}`}
                  className="mt-5 w-full h-12 inline-flex items-center justify-center gap-2 rounded bg-primary-container hover:bg-primary text-white text-[15px] font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">login</span>
                  {t.loginCta}
                </Link>
                <Link
                  href={`/registro?next=${encodeURIComponent("/vinos/carrito")}`}
                  className="mt-2 w-full h-12 inline-flex items-center justify-center gap-2 rounded border border-outline-variant hover:border-primary-container text-on-surface text-[15px] font-semibold"
                >
                  {t.registerCta}
                </Link>
              </div>
            ) : (
              <form
                ref={formRef}
                onSubmit={submit}
                noValidate
                className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8 space-y-5"
                aria-labelledby="wc-data-title"
              >
                <h2 id="wc-data-title" className="font-serif text-2xl">{t.dataTitle}</h2>
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[13px] text-emerald-900">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_check</span>
                  {t.memberPrefilled}
                </p>

                <TextField
                  id="wc-name"
                  label={t.name}
                  value={form.name}
                  onChange={(v) => update("name", v)}
                  placeholder={t.namePlaceholder}
                  autoComplete="name"
                  error={showErrors ? errors.name : undefined}
                />
                <TextField
                  id="wc-doc"
                  label={t.docId}
                  value={form.docId}
                  onChange={(v) => update("docId", v)}
                  placeholder={t.docIdPlaceholder}
                  autoComplete="off"
                  maxLength={20}
                  error={showErrors ? errors.docId : undefined}
                />
                <TextField
                  id="wc-phone"
                  type="tel"
                  label={t.phone}
                  hint={t.phoneHint}
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                  placeholder={t.phonePlaceholder}
                  autoComplete="tel"
                  maxLength={40}
                  error={showErrors ? errors.phone : undefined}
                />
                {memberEmail && <p className="-mt-2 text-[12px] text-on-surface-variant break-words">{t.emailHint(memberEmail)}</p>}

                <fieldset>
                  <legend className={labelClass}>{t.fulfillmentLabel}</legend>
                  {options.length === 1 ? (
                    // El administrador ofrece una sola forma de recibir: no hay nada que elegir.
                    <div className="flex items-start gap-3 min-h-14 px-4 py-3 rounded border border-primary-container bg-primary-container/5">
                      <span className="material-symbols-outlined mt-0.5 text-[20px] text-primary-container" aria-hidden="true">check_circle</span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-on-surface">{options[0] === "pickup" ? t.pickup : t.delivery}</span>
                        <span className="block text-[12px] text-on-surface-variant">{options[0] === "pickup" ? t.onlyPickup : t.onlyDelivery}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {options.map((f) => (
                        <label
                          key={f}
                          className={`flex items-start gap-3 min-h-14 px-4 py-3 rounded border cursor-pointer transition-colors ${
                            fulfillment === f ? "border-primary-container bg-primary-container/5" : "border-outline-variant hover:border-outline"
                          }`}
                        >
                          <input
                            type="radio"
                            name="fulfillment"
                            value={f}
                            checked={fulfillment === f}
                            onChange={() => setChoice(f)}
                            className="mt-1 h-4 w-4 flex-shrink-0 accent-[#7D2A46]"
                          />
                          <span className="min-w-0">
                            <span className="block text-[14px] font-semibold text-on-surface">{f === "pickup" ? t.pickup : t.delivery}</span>
                            <span className="block text-[12px] text-on-surface-variant">{f === "pickup" ? t.pickupHint : deliveryHint(shop, t)}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>

                {fulfillment === "pickup" && (
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-[13px] leading-relaxed text-on-surface space-y-1">
                    {shop.pickup.place && (
                      <p className="break-words">
                        <span className="font-semibold">{t.pickupPlace}:</span> {shop.pickup.place}
                      </p>
                    )}
                    {shop.pickup.hours && (
                      <p className="break-words">
                        <span className="font-semibold">{t.pickupHours}:</span> {shop.pickup.hours}
                      </p>
                    )}
                    {shop.pickup.instructions && <p className="break-words">{shop.pickup.instructions}</p>}
                    {!shop.pickup.place && !shop.pickup.hours && <p className="text-on-surface-variant">{t.pickupDefault}</p>}
                    {shop.pickup.place && !shop.pickup.hours && <p className="text-on-surface-variant">{t.pickupHoursLater}</p>}
                    {!shop.pickup.place && shop.pickup.hours && <p className="text-on-surface-variant">{t.pickupPlaceLater}</p>}
                  </div>
                )}

                {fulfillment === "delivery" && (
                  <>
                    {shop.delivery.instructions && (
                      <p className="rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-[13px] leading-relaxed text-on-surface break-words">
                        {shop.delivery.instructions}
                      </p>
                    )}
                    {zonesMode && (
                      <ZoneField
                        id="wc-zone"
                        label={t.zoneLabel}
                        placeholder={t.zonePlaceholder}
                        value={zoneId}
                        onChange={setZoneChoice}
                        options={zones.map((z) => ({
                          id: z.id,
                          // Con envío gratis por el monto de la compra, todas las zonas salen sin costo.
                          label: z.feeUsd > 0 && !(shop.delivery.freeFromUsd !== null && subtotal >= shop.delivery.freeFromUsd) ? t.zoneOption(z.name, formatUsd(z.feeUsd)) : t.zoneOptionFree(z.name),
                        }))}
                        error={showErrors ? errors.zone : undefined}
                      />
                    )}
                    {shipKind !== "none" && (
                      <p className="flex items-start gap-2 text-[13px] leading-relaxed text-on-surface">
                        <span className="material-symbols-outlined text-[18px] flex-shrink-0 text-primary-container" aria-hidden="true">local_shipping</span>
                        <span>
                          {shipKind === "coordinated"
                            ? t.shippingNoteCoordinated
                            : shipKind === "paid"
                              ? t.shipCost(formatUsd(shippingUsd))
                              : shipKind === "free"
                                ? t.shipFree
                                : t.shipChooseZone}
                          {freeHint && <span className="block mt-1 text-on-surface-variant">{freeHint}</span>}
                        </span>
                      </p>
                    )}
                    <TextField
                      id="wc-address"
                      label={t.address}
                      value={form.address}
                      onChange={(v) => update("address", v)}
                      placeholder={t.addressPlaceholder}
                      autoComplete="street-address"
                      maxLength={300}
                      error={showErrors ? errors.address : undefined}
                    />
                  </>
                )}
                <TextField
                  id="wc-note"
                  label={t.note}
                  value={form.note}
                  onChange={(v) => update("note", v)}
                  placeholder={t.notePlaceholder}
                  maxLength={300}
                />

                {/* Condiciones de compra: las del administrador o, si no escribió, las generadas con su configuración */}
                <section aria-labelledby="wc-terms-title" className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <h3 id="wc-terms-title" className="font-serif text-lg text-on-surface">{policies.title}</h3>
                  <ul className="mt-3 space-y-2 list-disc pl-5 text-[13px] leading-relaxed text-on-surface-variant break-words">
                    {policies.items.map((item, i) => (
                      <li key={`${i}-${item}`}>{item}</li>
                    ))}
                  </ul>
                </section>
                <div>
                  <label className="flex items-start gap-3 cursor-pointer min-h-11">
                    <input
                      ref={termsRef}
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        if (e.target.checked) setTermsError(false);
                      }}
                      required
                      aria-invalid={termsError}
                      aria-describedby={termsError ? "wc-terms-error" : undefined}
                      className="mt-0.5 h-5 w-5 flex-shrink-0 accent-[#7D2A46]"
                    />
                    <span className="text-[14px] text-on-surface leading-relaxed">{policies.accept}</span>
                  </label>
                  {termsError && (
                    <p id="wc-terms-error" role="alert" className="mt-1.5 text-[13px] text-error">{t.termsRequired}</p>
                  )}
                </div>

                <div className="flex justify-between items-baseline gap-4 border-t border-outline-variant pt-5">
                  <span className="font-semibold text-on-surface">{t.total}</span>
                  <span className="text-right">
                    <span className="block font-serif text-2xl text-primary-container">{formatUsd(total)}</span>
                    {bs(total) && <span className="block text-[12px] text-on-surface-variant tabular-nums">{bs(total)}</span>}
                    {shipKind !== "none" && (
                      <span className="block text-[12px] text-on-surface-variant">
                        {shipKind === "paid"
                          ? t.totalIncludesShipping(formatUsd(shippingUsd))
                          : shipKind === "free"
                            ? t.totalFreeShipping
                            : shipKind === "coordinated"
                              ? t.totalPlusShipping
                              : t.totalNoShipping}
                      </span>
                    )}
                  </span>
                </div>

                {showErrors && !dataValid && <p role="alert" className="text-[13px] text-error">{t.errFix}</p>}
                {submitError && (
                  <p role="alert" className="flex items-start gap-2 text-[14px] text-error">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
                    <span>
                      {submitError.text}
                      {submitError.pending && (
                        <>
                          {" "}
                          <Link href="/mi-cuenta" className="font-semibold underline underline-offset-4">{t.seeMyOrders}</Link>
                        </>
                      )}
                    </span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || overBottles}
                  className="w-full h-[52px] inline-flex items-center justify-center gap-2 rounded bg-primary-container hover:bg-primary text-white text-[15px] font-semibold transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>
                      {t.submitting}
                    </>
                  ) : (
                    <>
                      {t.submit}
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                    </>
                  )}
                </button>
                <p className="text-[12px] text-on-surface-variant text-center leading-relaxed">{t.payHint}</p>
              </form>
            )}
          </aside>
        )}
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />
      <main className="flex-grow px-5 sm:px-8 lg:px-12 max-w-[1180px] mx-auto w-full pt-8 sm:pt-12 pb-24">
        <header className="mb-8 sm:mb-10">
          <p className="eyebrow mb-3">{t.eyebrow}</p>
          <h1 className="font-serif text-[2rem] sm:text-5xl leading-tight text-on-surface">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-[15px] sm:text-base text-on-surface-variant leading-relaxed text-pretty">{t.subtitle}</p>
        </header>
        {/* Tienda cerrada: el aviso va arriba del todo (el carrito se conserva, pero no se puede hacer el pedido). */}
        {view && !view.store.enabled && cart.items.length > 0 && !redirecting && (
          <StoreClosedNotice lang={lang} message={view.store.closedMessage} className="mb-8" />
        )}
        {body}
      </main>
      <Footer currentLang={lang} />
    </div>
  );
}

/* ─── Texto corto de la opción «Entrega a domicilio» según cómo la configuró el administrador ─── */

function deliveryHint(store: PublicWineStore, t: (typeof CART_COPY)["es"]): string {
  const d = store.delivery;
  if (d.mode === "coordinate") return t.deliveryHintCoordinate;
  if (d.mode === "zones") return t.deliveryHintZones;
  return d.flatFeeUsd > 0 ? t.deliveryHintFlat(formatUsd(d.flatFeeUsd)) : t.deliveryHintFree;
}

/* ─── Una línea del pedido ─── */

function LineRow({ line, lang, onQty, onRemove }: { line: CartLine; lang: Language; onQty: (q: number) => void; onRemove: () => void }) {
  const t = CART_COPY[lang];
  const wine = line.wine as SaleWine;
  const unit = wine.priceUsd ?? 0;
  const nameId = `wc-line-${line.wineId}`;
  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/vinos/${wine.slug}`}
        aria-hidden="true"
        tabIndex={-1}
        className="relative w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg bg-ink"
      >
        {wine.imageUrl ? (
          // Las fotos vienen de Supabase Storage (o data URL en pruebas locales).
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wine.imageUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-contain p-2" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-paper/25">
            <span className="material-symbols-outlined text-3xl">wine_bar</span>
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-tertiary">
              {[WINE_TYPE_LABEL[lang][wine.type], wine.vintage].filter(Boolean).join(" · ")}
            </p>
            <Link id={nameId} href={`/vinos/${wine.slug}`} className="block font-serif text-lg leading-snug text-on-surface hover:text-primary-container break-words">
              {wine.name}
            </Link>
            <p className="mt-0.5 text-[13px] text-on-surface-variant tabular-nums">{t.unitPrice(formatUsd(unit))}</p>
          </div>
          <p className="font-serif text-lg text-on-surface tabular-nums flex-shrink-0">{formatUsd(line.total)}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <QtyStepper
            value={line.quantity}
            max={line.max}
            onChange={(q) => onQty(Math.max(1, Math.min(line.max, q)))}
            lessLabel={t.fewer(wine.name)}
            moreLabel={t.more(wine.name)}
            labelledBy={nameId}
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label={t.removeAria(wine.name)}
            className="inline-flex items-center gap-1 min-h-11 px-2 text-[13px] font-semibold text-on-surface-variant hover:text-error"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
            {t.remove}
          </button>
        </div>
        {line.limitedByStock && wine.available !== null ? (
          <p className="text-[12px] font-semibold text-on-tertiary-fixed-variant">{t.stockLeft(wine.available)}</p>
        ) : (
          line.quantity >= line.max && <p className="text-[12px] text-on-surface-variant">{t.maxLine(line.max)}</p>
        )}
      </div>
    </li>
  );
}

/* ─── Piezas del formulario ─── */

function ZoneField({
  id,
  label,
  placeholder,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass} appearance-none pr-10 text-ellipsis ${error ? "border-error" : "border-outline-variant"}`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant" aria-hidden="true">
          expand_more
        </span>
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-[12px] text-error">{error}</p>}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  type = "text",
  autoComplete,
  maxLength = 160,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`${inputClass} ${error ? "border-error" : "border-outline-variant"}`}
      />
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-[12px] text-on-surface-variant">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-[12px] text-error">{error}</p>}
    </div>
  );
}
