"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PaymentDetails, formatBs, formatUsd, hasBinanceDetails } from "@/components/PaymentDetails";
import { PurchasePolicies } from "@/components/PurchasePolicies";
import { TicketQR, type PublicTicket } from "@/components/TicketQR";
import { CONTACT, whatsappLink } from "@/lib/contact";
import { formatTastingDate } from "@/lib/dates";
import { useLang } from "@/lib/useLang";
import type { Language } from "@/lib/i18n";
import type { PublicOrder } from "@/lib/orders";
import type { PaymentConfig } from "@/lib/settings";
import { availableMethods, isBsMethod } from "@/lib/paymentMethods";
import type { PaymentMethodId, RateCurrency } from "@/types";
import { ORDER_COPY, OTHER_BANK, VE_BANKS } from "./copy";

interface RateInfo {
  currency: RateCurrency;
  rate: number;
  amountBs: number;
}

/** `tastingDateIso`: fecha ISO de la cata para mostrarla en el idioma del visitante (`tastingDate` va en español). */
type OrderWithTickets = PublicOrder & { tickets?: PublicTicket[]; tastingDateIso?: string | null };

const STATUS_TONE: Record<PublicOrder["status"], string> = {
  pending_payment: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  in_review: "bg-secondary-container text-on-secondary-container",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-error-container text-on-error-container",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};

const fieldClass =
  "w-full h-12 bg-surface-container-lowest border border-outline-variant rounded px-3.5 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none";
const labelClass = "block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2";

export default function OrderPage() {
  const { token } = useParams<{ token: string }>();
  const [lang, setLang] = useLang();
  const t = ORDER_COPY[lang];
  const [order, setOrder] = useState<OrderWithTickets | null>(null);
  const [rate, setRate] = useState<RateInfo | null>(null);
  const [payment, setPayment] = useState<PaymentConfig | null>(null);
  /** Métodos que acepta la cata de esta orden (los envía el servidor). */
  const [methods, setMethods] = useState<PaymentMethodId[] | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 404) setNotFound(true);
        return;
      }
      setOrder(data.order);
      setRate(data.rate ?? null);
      setPayment(data.payment ?? null);
      setMethods(Array.isArray(data.methods) ? data.methods : null);
      setHoldExpiresAt(data.holdExpiresAt ?? null);
    } catch {
      /* se reintenta en el siguiente ciclo */
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // El título del layout queda en español para buscadores; la pestaña sigue el idioma elegido.
  useEffect(() => {
    document.title = `${t.docTitle} | El Origen Caracas`;
  }, [t.docTitle]);

  // Mientras el pago está en revisión (o las entradas aún no aparecen), consultar periódicamente.
  const ticketsMissing = order?.status === "approved" && !order.tickets?.length;
  useEffect(() => {
    if (order?.status !== "in_review" && !ticketsMissing) return;
    const id = setInterval(load, ticketsMissing ? 8_000 : 20_000);
    return () => clearInterval(id);
  }, [order?.status, ticketsMissing, load]);

  const updateTicket = (updated: PublicTicket) =>
    setOrder((o) => (o ? { ...o, tickets: o.tickets?.map((x) => (x.number === updated.number ? updated : x)) } : o));

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={setLang} />
      <main className="flex-grow px-5 sm:px-8 lg:px-12 max-w-[1180px] mx-auto w-full pt-8 sm:pt-12 pb-24">
        {notFound ? (
          <div className="max-w-md mx-auto text-center py-24">
            <span className="material-symbols-outlined text-5xl text-primary-container/50" aria-hidden="true">search_off</span>
            <h1 className="font-serif text-3xl mt-4">{t.notFoundTitle}</h1>
            <p className="text-on-surface-variant mt-3">{t.notFoundText}</p>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded bg-primary-container text-white font-semibold"
            >
              {t.support}
            </a>
          </div>
        ) : !order ? (
          <div className="py-32 flex justify-center text-on-surface-variant" role="status">
            <span className="material-symbols-outlined animate-spin mr-2" aria-hidden="true">progress_activity</span>
            {t.loading}
          </div>
        ) : (
          <>
            <header className="mb-8 sm:mb-10">
              <p className="eyebrow mb-3">{t.orderLabel(order.code)}</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-[2rem] sm:text-5xl leading-tight text-on-surface">
                  {order.status === "approved" ? t.titleApproved(order.spotsCount) : t.titlePending}
                </h1>
                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${STATUS_TONE[order.status]}`}>
                  {t.status[order.status]}
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7 space-y-6 min-w-0">
                {order.status === "approved" && (
                  <ApprovedTickets order={order} token={token} lang={lang} onReload={load} onTicketUpdated={updateTicket} />
                )}
                {order.status === "in_review" && <InReview order={order} lang={lang} />}
                {(order.status === "pending_payment" || order.status === "rejected") && (
                  <PayAndReport
                    order={order}
                    token={token}
                    rate={rate}
                    payment={payment}
                    offeredMethods={methods}
                    holdExpiresAt={holdExpiresAt}
                    lang={lang}
                    onDone={load}
                  />
                )}
                {order.status === "cancelled" && (
                  <Panel>
                    <h2 className="font-serif text-2xl">{t.cancelledTitle}</h2>
                    <p className="text-on-surface-variant mt-2">{t.cancelledText(order.code)}</p>
                  </Panel>
                )}
                {order.status !== "cancelled" && (
                  <PurchasePolicies
                    lang={lang}
                    eyebrow={order.status === "pending_payment" || order.status === "rejected" ? undefined : null}
                  />
                )}
              </div>

              <aside className="lg:col-span-5 lg:sticky lg:top-28 min-w-0">
                <Summary order={order} lang={lang} />
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer currentLang={lang} />
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8 ${className}`}>{children}</section>;
}

/* ─── Resumen ─── */

function Summary({ order, lang }: { order: OrderWithTickets; lang: Language }) {
  const t = ORDER_COPY[lang];
  const rows: [string, string][] = [
    [t.date, formatTastingDate(order.tastingDateIso, lang, order.tastingDate)],
    [t.time, order.tastingTime],
    [t.place, order.tastingLocation],
    [t.spots, t.persons(order.spotsCount)],
    [t.holder, order.customerName],
  ];
  return (
    <Panel className="!p-0 overflow-hidden">
      <div className="bg-primary-container text-paper px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sun">{t.summaryEyebrow}</p>
        <h2 className="font-serif text-2xl leading-snug mt-1">{order.tastingTitle}</h2>
      </div>
      <dl className="px-6 py-5 space-y-3 text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-on-surface-variant flex-shrink-0">{k}</dt>
            <dd className="text-right font-medium text-on-surface break-words min-w-0">{v}</dd>
          </div>
        ))}
        {order.addOns.length > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-on-surface-variant flex-shrink-0">{t.addOns}</dt>
            <dd className="text-right font-medium text-on-surface min-w-0">
              {order.addOns.map((a) => `${a.quantity}× ${a.title}`).join(", ")}
            </dd>
          </div>
        )}
        {order.discountUsd > 0 && (
          <div className="flex justify-between gap-4 text-emerald-800">
            <dt>{t.discount(order.couponCode ?? "")}</dt>
            <dd className="font-medium">−{formatUsd(order.discountUsd)}</dd>
          </div>
        )}
        <div className="flex justify-between items-baseline gap-4 border-t border-outline-variant pt-4">
          <dt className="font-semibold text-on-surface">{t.total}</dt>
          <dd className="font-serif text-2xl text-primary-container">{formatUsd(order.totalUsd)}</dd>
        </div>
      </dl>
    </Panel>
  );
}

/* ─── Pago y reporte ─── */

const usdtAmount = (usd: number) => (Number.isInteger(usd) ? String(usd) : usd.toFixed(2));

const sameText = (a: string, b: string) => {
  const norm = (v: string) => v.trim().replace(/[.\s]+$/, "").toLowerCase();
  return norm(a) === norm(b);
};

/**
 * Indicaciones de efectivo del admin. En inglés: la versión en inglés del admin si existe; si no, se traduce
 * el texto por defecto (un texto personalizado sin versión en inglés se muestra tal cual).
 */
function cashInstructions(efectivo: PaymentConfig["efectivo"], lang: Language): string {
  if (lang === "en") {
    if (efectivo.instructionsEn?.trim()) return efectivo.instructionsEn;
    if (sameText(efectivo.instructions, ORDER_COPY.es.cashInstructionsDefault)) return ORDER_COPY.en.cashInstructionsDefault;
  }
  return efectivo.instructions;
}

function PayAndReport({
  order,
  token,
  rate,
  payment,
  offeredMethods,
  holdExpiresAt,
  lang,
  onDone,
}: {
  order: PublicOrder;
  token: string;
  rate: RateInfo | null;
  payment: PaymentConfig | null;
  offeredMethods: PaymentMethodId[] | null;
  holdExpiresAt: string | null;
  lang: Language;
  onDone: () => void;
}) {
  const t = ORDER_COPY[lang];
  const methods = payment ? offeredMethods ?? availableMethods(payment) : [];
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [accountId, setAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [payerBank, setPayerBank] = useState("");
  const [payerDocId, setPayerDocId] = useState(order.customerDocId);
  const [payerPhone, setPayerPhone] = useState(order.customerPhone);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const active: PaymentMethodId | null = method && methods.includes(method) ? method : methods[0] ?? null;
  const accounts =
    active === "pago_movil" ? payment?.pagoMovil ?? [] : active === "transferencia" ? payment?.transfers ?? [] : [];
  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const inBs = isBsMethod(active);

  // Monto sugerido según el método elegido.
  useEffect(() => {
    if (active === "binance_usdt" || active === "zelle") setAmount(usdtAmount(order.totalUsd));
    else if (inBs) setAmount(rate ? formatBs(rate.amountBs, "es") : "");
  }, [active, inBs, rate, order.totalUsd]);

  const expired = holdExpiresAt ? new Date(holdExpiresAt).getTime() < Date.now() : false;
  const totalLabel = formatUsd(order.totalUsd);
  // Cupón del 100 %: no hay método, monto ni comprobante (el servidor acepta el reporte sin campos).
  const free = order.totalUsd <= 0;

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!active && !free) return;
    setError("");
    if (!free && active !== "efectivo" && !file) {
      setError(t.proofMissing);
      return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      if (free) {
        // Sin campos de pago.
      } else if (active === "efectivo") {
        fd.set("paymentMethod", active);
        fd.set("paymentBank", "efectivo");
        fd.set("payerDocId", order.customerDocId);
        fd.set("payerPhone", order.customerPhone);
      } else if (active) {
        fd.set("paymentMethod", active);
        fd.set("paymentBank", active === "binance_usdt" ? "binance" : active === "zelle" ? payment?.zelle[0]?.id ?? "" : selectedAccount?.id ?? "");
        fd.set("paymentReference", reference);
        fd.set("paymentAmount", amount);
        if (inBs) {
          fd.set("payerBank", payerBank);
          fd.set("payerDocId", payerDocId);
          if (active === "pago_movil") fd.set("payerPhone", payerPhone);
        }
        if (file) fd.set("file", file);
      }
      if (note.trim()) fd.set("note", note.trim());
      const res = await fetch(`/api/orders/${encodeURIComponent(token)}/proof`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!data.success) throw new Error(data.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      onDone();
    } catch (err) {
      setError((err as Error).message || t.sendError);
    } finally {
      setSending(false);
    }
  };

  const errorBox = error && (
    <p role="alert" className="text-[14px] text-error flex items-start gap-2">
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
      {error}
    </p>
  );

  return (
    <>
      {order.status === "rejected" && (
        <div className="rounded-xl border border-error/30 bg-error-container/60 p-5 text-on-error-container" role="alert">
          <p className="font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">error</span>
            {t.rejectedTitle}
          </p>
          {order.rejectionReason && (
            <p className="mt-1 text-[14px]">
              {t.rejectedReason} {order.rejectionReason}
            </p>
          )}
          <p className="mt-2 text-[14px]">{t.rejectedText}</p>
        </div>
      )}

      {expired && order.status === "pending_payment" && (
        <div className="rounded-xl border border-tertiary/30 bg-tertiary-fixed/60 p-4 text-[14px] text-on-tertiary-fixed-variant">
          {t.holdExpired}
        </div>
      )}

      {free ? (
        <Panel>
          <div className="flex items-start gap-4">
            <span className="w-12 h-12 flex-shrink-0 rounded-full bg-secondary-container flex items-center justify-center" aria-hidden="true">
              <span className="material-symbols-outlined text-[26px] text-primary-container">redeem</span>
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-2xl">{t.freeTitle}</h2>
              <p className="text-on-surface-variant mt-2 leading-relaxed">{t.freeText}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {errorBox}
            <button
              type="button"
              onClick={() => submit()}
              disabled={sending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-6 rounded bg-primary-container hover:bg-primary text-white font-semibold disabled:opacity-60"
            >
              {sending && <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>}
              {t.freeSubmit}
            </button>
          </div>
        </Panel>
      ) : !payment || !active ? (
        <Panel>
          <p className="text-on-surface-variant">{t.noMethods}</p>
          <a
            href={whatsappLink(t.reportedMessage(order.code))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 h-12 px-6 rounded bg-primary-container text-white font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
            {t.support} · {CONTACT.phoneDisplay}
          </a>
        </Panel>
      ) : (
        <>
          {/* Paso 1 */}
          <Panel>
            <p className="eyebrow mb-4">{t.step1}</p>

            <fieldset>
              <legend className="sr-only">{t.methodsLegend}</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {methods.map((m) => (
                  <label
                    key={m}
                    className={`flex items-start gap-3 min-h-14 px-4 py-3 rounded border cursor-pointer transition-colors ${
                      active === m ? "border-primary-container bg-primary-container/5" : "border-outline-variant hover:border-outline"
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={m}
                      checked={active === m}
                      onChange={() => {
                        setMethod(m);
                        setError("");
                      }}
                      className="mt-1 h-4 w-4 accent-[#7D2A46]"
                    />
                    <span>
                      <span className="block text-[14px] font-semibold text-on-surface">{t.methods[m].title}</span>
                      <span className="block text-[12px] text-on-surface-variant">{t.methods[m].hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-outline-variant">
              <div>
                <p className="text-[13px] text-on-surface-variant">{t.amountToPay}</p>
                {active === "binance_usdt" ? (
                  <>
                    <p className="font-serif text-4xl text-on-surface mt-1">{usdtAmount(order.totalUsd)} USDT</p>
                    <p className="text-[13px] text-on-surface-variant mt-1">
                      {hasBinanceDetails(payment) ? t.usdtLine : t.usdtLineNoDetails}
                    </p>
                  </>
                ) : active === "efectivo" || active === "zelle" ? (
                  <>
                    <p className="font-serif text-4xl text-on-surface mt-1">{totalLabel}</p>
                    <p className="text-[13px] text-on-surface-variant mt-1">{active === "zelle" ? t.zelleLine : t.cashLine}</p>
                  </>
                ) : rate ? (
                  <>
                    <p className="font-serif text-4xl text-on-surface mt-1">Bs {formatBs(rate.amountBs, lang)}</p>
                    <p className="text-[13px] text-on-surface-variant mt-1">
                      {t.rateLine(totalLabel, rate.currency, formatBs(rate.rate, lang))}
                    </p>
                    {rate.currency === "EUR" && <p className="text-[12px] text-on-surface-variant mt-0.5">{t.eurNote}</p>}
                    {rate.currency === "BINANCE" && <p className="text-[12px] text-on-surface-variant mt-0.5">{t.binanceNote}</p>}
                  </>
                ) : (
                  <>
                    <p className="font-serif text-4xl text-on-surface mt-1">{totalLabel}</p>
                    <p className="text-[13px] text-on-surface-variant mt-1">{t.noRate}</p>
                  </>
                )}
              </div>
              {holdExpiresAt && !expired && (
                <p className="text-[13px] text-on-surface-variant">
                  {t.heldUntil}{" "}
                  <strong className="text-on-surface">
                    {new Date(holdExpiresAt).toLocaleTimeString(lang === "es" ? "es-VE" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Caracas",
                    })}
                  </strong>
                </p>
              )}
            </div>

            {active === "efectivo" ? (
              <p className="mt-5 text-[14px] text-on-surface-variant leading-relaxed">
                {cashInstructions(payment.efectivo, lang)}
              </p>
            ) : (
              <PaymentDetails
                className="mt-5"
                config={payment}
                method={active}
                lang={lang}
                selectedId={selectedAccount?.id}
                onSelect={setAccountId}
              />
            )}
          </Panel>

          {/* Paso 2 */}
          {active === "efectivo" ? (
            <Panel>
              <p className="eyebrow mb-1">{t.step2}</p>
              <h2 className="font-serif text-2xl mt-2">{t.cashTitle}</h2>
              <ol className="mt-3 space-y-1.5 text-[14px] text-on-surface-variant leading-relaxed">
                <li>{t.cashStep1}</li>
                <li>{t.cashStep2}</li>
              </ol>
              <a
                href={whatsappLink(t.cashMessage(order.code, order.customerName, totalLabel))}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full h-12 inline-flex items-center justify-center gap-2 rounded border border-primary-container text-primary-container text-[15px] font-semibold hover:bg-primary-container/5"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                {t.cashWhatsapp}
              </a>
              <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                  <label className={labelClass} htmlFor="cash-note">{t.cashNote}</label>
                  <input
                    id="cash-note"
                    value={note}
                    maxLength={500}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t.cashNotePlaceholder}
                    className={fieldClass}
                  />
                </div>
                {errorBox}
                <SubmitButton sending={sending} label={t.cashDone} sendingLabel={t.sending} icon="handshake" />
              </form>
            </Panel>
          ) : (
            <Panel>
              <p className="eyebrow mb-1">{t.step2}</p>
              <p className="text-[14px] text-on-surface-variant mb-6">{t.step2Text}</p>

              <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                  <div>
                    <label className={labelClass} htmlFor="ref">
                      {active === "binance_usdt" ? t.binanceReference : active === "zelle" ? t.zelleReference : t.reference}
                    </label>
                    <input
                      id="ref"
                      required
                      inputMode={inBs ? "numeric" : "text"}
                      autoComplete="off"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={t.referencePlaceholder}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="amt">
                      {active === "binance_usdt" ? t.amountUsdt : active === "zelle" ? t.amountUsd : t.amountBs}
                    </label>
                    <input
                      id="amt"
                      required
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className={fieldClass}
                    />
                  </div>
                  {inBs && (
                    <>
                      <div>
                        <label className={labelClass} htmlFor="bank">{t.payerBank}</label>
                        <select id="bank" required value={payerBank} onChange={(e) => setPayerBank(e.target.value)} className={fieldClass}>
                          <option value="" disabled>{t.select}</option>
                          {VE_BANKS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                          <option value="Otro">{OTHER_BANK[lang]}</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="doc">{t.payerDocId}</label>
                        <input
                          id="doc"
                          required
                          value={payerDocId}
                          onChange={(e) => setPayerDocId(e.target.value)}
                          placeholder="V-12345678"
                          className={fieldClass}
                        />
                      </div>
                    </>
                  )}
                  {active === "pago_movil" && (
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="tel">{t.payerPhone}</label>
                      <input
                        id="tel"
                        type="tel"
                        autoComplete="tel"
                        value={payerPhone}
                        onChange={(e) => setPayerPhone(e.target.value)}
                        placeholder="0414-123-4567"
                        className={fieldClass}
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="note">{t.note}</label>
                    <input
                      id="note"
                      value={note}
                      maxLength={500}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t.notePlaceholder}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div className="relative">
                  <span className={labelClass} id="proof-label">{t.proof}</span>
                  <label
                    htmlFor="proof"
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors ${
                      file ? "border-primary-container bg-primary-container/5" : "border-outline-variant hover:border-primary-container/60"
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl text-primary-container" aria-hidden="true">
                      {file ? "task" : "upload_file"}
                    </span>
                    <span className="text-[14px] font-semibold text-on-surface break-all">{file ? file.name : t.proofCta}</span>
                    <span className="text-[12px] text-on-surface-variant">{t.proofHint}</span>
                  </label>
                  <input
                    id="proof"
                    type="file"
                    aria-labelledby="proof-label"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                {errorBox}
                <SubmitButton sending={sending} label={t.send} sendingLabel={t.sending} icon="send" />
              </form>
            </Panel>
          )}
        </>
      )}
    </>
  );
}

function SubmitButton({ sending, label, sendingLabel, icon }: { sending: boolean; label: string; sendingLabel: string; icon: string }) {
  return (
    <button
      type="submit"
      disabled={sending}
      className="w-full h-14 flex items-center justify-center gap-2 rounded bg-primary-container hover:bg-primary text-white text-[15px] font-semibold transition-colors disabled:opacity-60"
    >
      {sending ? (
        <>
          <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>
          {sendingLabel}
        </>
      ) : (
        <>
          {label}
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{icon}</span>
        </>
      )}
    </button>
  );
}

/* ─── En revisión ─── */

function InReview({ order, lang }: { order: PublicOrder; lang: Language }) {
  const t = ORDER_COPY[lang];
  const method = order.paymentMethod as PaymentMethodId | null;
  const isCash = method === "efectivo";
  const free = order.totalUsd <= 0;
  const amount =
    order.paymentAmountBs == null
      ? null
      : method === "binance_usdt"
        ? `${order.paymentAmountBs} USDT`
        : method === "zelle"
          ? formatUsd(order.paymentAmountBs)
          : `Bs ${formatBs(order.paymentAmountBs, lang)}`;
  const details: [string, string][] = [];
  if (method && t.methods[method]) details.push([t.method, t.methods[method].title]);
  if (order.paymentReference) details.push([t.reportedReference, order.paymentReference]);
  if (amount) details.push([t.reportedAmount, amount]);

  return (
    <Panel>
      <div className="flex items-start gap-4">
        <span className="w-12 h-12 flex-shrink-0 rounded-full bg-secondary-container flex items-center justify-center" aria-hidden="true">
          <span className="material-symbols-outlined text-[26px] text-primary-container">
            {free ? "redeem" : isCash ? "handshake" : "hourglass_top"}
          </span>
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-2xl">{free ? t.freeReviewTitle : t.reviewTitle}</h2>
          <p className="text-on-surface-variant mt-2 leading-relaxed break-words">
            {free
              ? t.freeReviewText(order.customerEmail)
              : isCash
                ? t.reviewCashText(order.customerEmail)
                : t.reviewText(order.customerEmail)}
          </p>
        </div>
      </div>
      {details.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-outline-variant pt-5 text-[14px]">
          {details.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-on-surface-variant">{k}</dt>
              <dd className="font-semibold tabular-nums break-all">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <a
        href={whatsappLink(t.reportedMessage(order.code))}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 min-h-11 text-[14px] font-semibold text-primary-container"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
        {t.questions} · {CONTACT.phoneDisplay}
      </a>
    </Panel>
  );
}

/* ─── Entradas aprobadas: una por persona ─── */

function ApprovedTickets({
  order,
  token,
  lang,
  onReload,
  onTicketUpdated,
}: {
  order: OrderWithTickets;
  token: string;
  lang: Language;
  onReload: () => void;
  onTicketUpdated: (ticket: PublicTicket) => void;
}) {
  const t = ORDER_COPY[lang];
  const tickets = order.tickets ?? [];
  const when = [formatTastingDate(order.tastingDateIso, lang, order.tastingDate), order.tastingTime].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <Panel>
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-[13px] font-semibold text-emerald-900">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">verified</span>
          {t.approvedTitle}
        </p>
        <p className="mt-3 text-[15px] text-on-surface-variant leading-relaxed">{t.approvedText(tickets.length || order.spotsCount)}</p>
      </Panel>

      {tickets.length === 0 ? (
        <Panel className="text-center">
          <p className="text-on-surface-variant" role="status">{t.ticketsPending}</p>
          <button
            type="button"
            onClick={onReload}
            className="mt-4 inline-flex items-center gap-2 h-12 px-6 rounded border border-outline-variant hover:border-primary-container text-[14px] font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
            {t.reload}
          </button>
        </Panel>
      ) : (
        tickets.map((ticket) => (
          <TicketQR
            key={ticket.token}
            ticket={ticket}
            total={tickets.length}
            orderToken={token}
            tastingTitle={order.tastingTitle}
            when={when}
            lang={lang}
            onUpdated={onTicketUpdated}
          />
        ))
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
        <Link
          href="/catas"
          className="shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-2 h-12 px-6 rounded border border-outline-variant hover:border-primary-container text-[14px] font-semibold"
        >
          {t.otherTastings}
        </Link>
        <p className="min-w-0 text-[13px] text-on-surface-variant break-words">{t.keepLink(order.customerEmail)}</p>
      </div>
    </div>
  );
}
