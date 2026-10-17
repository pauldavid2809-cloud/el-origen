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
import { WINE_ORDER_MAX_BOTTLES, WINE_POLICIES, round2, wineMaxQty } from "@/lib/wineSale";
import type { SaleWine } from "@/lib/wines";
import { QtyStepper } from "../QtyStepper";
import { WINE_TYPE_LABEL } from "../copy";
import { CART_COPY } from "./copy";

type Fulfillment = "pickup" | "delivery";
type FieldKey = "name" | "docId" | "phone" | "address";

/** Una línea del carrito con los datos actuales del servidor (`wine` es null si el vino ya no existe o no está publicado). */
interface CartLine {
  wineId: string;
  wine: SaleWine | null;
  /** Sigue a la venta: entra en el pedido y en los totales. */
  available: boolean;
  /** Máximo de botellas de este vino por pedido. */
  max: number;
  quantity: number;
  total: number;
}

const digits = (v: string) => v.replace(/\D/g, "");

const inputClass =
  "w-full h-12 bg-surface-container-lowest border rounded px-3.5 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none transition-colors";
const labelClass = "block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-1.5";

export default function WineCartPage() {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const t = CART_COPY[lang];
  useDocumentTitle(lang, { es: CART_COPY.es.docTitle, en: CART_COPY.en.docTitle });
  const policies = WINE_POLICIES[lang];

  const cart = useWineCart();
  const { setQty } = cart;
  const rates = useBcvRates();
  const rate = rates?.USD ?? null;
  const bs = (usd: number) => (rate ? t.bsApprox(formatBs(round2(usd * rate), lang)) : null);

  /* ─── Datos actuales de los vinos del carrito (precio vigente, si siguen a la venta y su máximo por pedido) ─── */
  const [loaded, setLoaded] = useState<{ wines: Record<string, SaleWine>; asked: string[] } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [adjusted, setAdjusted] = useState(false);
  const idsKey = cart.items.map((i) => i.wineId).join(",");
  /** Ya se consultó al servidor por todos los vinos que hay ahora en el carrito. */
  const settled = loaded !== null && cart.items.every((i) => loaded.asked.includes(i.wineId));

  useEffect(() => {
    if (!cart.ready || !idsKey) return;
    let alive = true;
    const asked = idsKey.split(",");
    setLoadFailed(false);
    fetch(`/api/wines/cart?ids=${encodeURIComponent(idsKey)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (!d?.success || !Array.isArray(d.wines)) throw new Error("respuesta inválida");
        setLoaded({ wines: Object.fromEntries((d.wines as SaleWine[]).map((w) => [w.id, w])), asked });
      })
      .catch(() => alive && setLoadFailed(true));
    return () => {
      alive = false;
    };
  }, [cart.ready, idsKey, reload]);

  // Si el máximo por pedido de un vino bajó desde que se agregó, la cantidad guardada se ajusta.
  useEffect(() => {
    if (!settled || !loaded) return;
    let changed = false;
    for (const item of cart.items) {
      const wine = loaded.wines[item.wineId];
      if (wine && wine.forSale && item.quantity > wineMaxQty(wine)) {
        setQty(item.wineId, wineMaxQty(wine));
        changed = true;
      }
    }
    if (changed) setAdjusted(true);
  }, [settled, loaded, cart.items, setQty]);

  const lines: CartLine[] = cart.items.flatMap((item): CartLine[] => {
    const wine = loaded?.wines[item.wineId] ?? null;
    if (!wine) return settled ? [{ wineId: item.wineId, wine: null, available: false, max: 0, quantity: item.quantity, total: 0 }] : [];
    const available = wine.forSale && (wine.priceUsd ?? 0) > 0;
    const max = wineMaxQty(wine);
    const quantity = Math.min(item.quantity, max);
    return [{ wineId: item.wineId, wine, available, max, quantity, total: available ? round2((wine.priceUsd ?? 0) * quantity) : 0 }];
  });
  const sale = lines.filter((l) => l.available);
  const gone = lines.filter((l) => !l.available);
  const bottles = sale.reduce((n, l) => n + l.quantity, 0);
  const total = round2(sale.reduce((sum, l) => sum + l.total, 0));
  const overBottles = bottles > WINE_ORDER_MAX_BOTTLES;

  /* ─── Cuenta y formulario ─── */
  /** Solo compran los miembros con sesión: sin sesión se muestra la invitación a ingresar o registrarse. */
  const [account, setAccount] = useState<"loading" | "member" | "guest">("loading");
  const [memberEmail, setMemberEmail] = useState("");
  const [form, setForm] = useState({ name: "", docId: "", phone: "", address: "", note: "" });
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
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
    if (!settled || sale.length === 0 || overBottles) return;
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
      if (data.code === "wine_unavailable") {
        // Algún vino se apagó o se despublicó: se vuelven a pedir los datos y la línea pasa a «ya no está a la venta».
        setSubmitError({ text: t.unavailableError });
        setReload((n) => n + 1);
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
  } else if (!settled && loadFailed) {
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
  } else if (!settled) {
    body = spinner(t.loading);
  } else {
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
                        <span className="min-w-0 break-words text-[14px] text-on-surface">{name}</span>
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
                    <dd className="font-medium tabular-nums">{formatUsd(total)}</dd>
                  </div>
                  <div className="flex justify-between items-baseline gap-4 pt-2">
                    <dt className="font-semibold text-on-surface">{t.total}</dt>
                    <dd className="text-right">
                      <span className="block font-serif text-3xl text-primary-container">{formatUsd(total)}</span>
                      {bs(total) && <span className="block text-[13px] text-on-surface-variant tabular-nums">{bs(total)}</span>}
                    </dd>
                  </div>
                </dl>
                {rate && <p className="mt-2 text-[12px] text-on-surface-variant">{t.bsNote}</p>}
                {/* PENDIENTE CLIENTE: costo y zonas de envío. */}
                <p className="mt-2 text-[12px] text-on-surface-variant">{t.shippingNote}</p>
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
            {account === "loading" ? (
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
                  <div className="grid grid-cols-1 gap-2">
                    {(["pickup", "delivery"] as const).map((f) => (
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
                          onChange={() => setFulfillment(f)}
                          className="mt-1 h-4 w-4 accent-[#7D2A46]"
                        />
                        <span>
                          <span className="block text-[14px] font-semibold text-on-surface">{f === "pickup" ? t.pickup : t.delivery}</span>
                          <span className="block text-[12px] text-on-surface-variant">{f === "pickup" ? t.pickupHint : t.deliveryHint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {fulfillment === "delivery" && (
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
                )}
                <TextField
                  id="wc-note"
                  label={t.note}
                  value={form.note}
                  onChange={(v) => update("note", v)}
                  placeholder={t.notePlaceholder}
                  maxLength={300}
                />

                {/* Condiciones de compra (PENDIENTE CLIENTE: ver WINE_POLICIES en @/lib/wineSale) */}
                <section aria-labelledby="wc-terms-title" className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <h3 id="wc-terms-title" className="font-serif text-lg text-on-surface">{policies.title}</h3>
                  <ul className="mt-3 space-y-2 list-disc pl-5 text-[13px] leading-relaxed text-on-surface-variant">
                    {policies.items.map((item) => (
                      <li key={item}>{item}</li>
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
        {body}
      </main>
      <Footer currentLang={lang} />
    </div>
  );
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
        {line.quantity >= line.max && <p className="text-[12px] text-on-surface-variant">{t.maxLine(line.max)}</p>}
      </div>
    </li>
  );
}

/* ─── Piezas del formulario ─── */

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
