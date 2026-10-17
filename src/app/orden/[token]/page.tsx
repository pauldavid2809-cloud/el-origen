"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PayAndReport, Panel, type RateInfo } from "@/components/PayAndReport";
import { formatBs, formatUsd } from "@/components/PaymentDetails";
import { PurchasePolicies } from "@/components/PurchasePolicies";
import { TicketQR, type PublicTicket } from "@/components/TicketQR";
import { CONTACT, whatsappLink } from "@/lib/contact";
import { formatTastingDate } from "@/lib/dates";
import { useLang } from "@/lib/useLang";
import type { Language } from "@/lib/i18n";
import type { PublicOrder } from "@/lib/orders";
import type { PaymentConfig } from "@/lib/settings";
import type { PaymentMethodId } from "@/types";
import { ORDER_COPY } from "./copy";

/** `tastingDateIso`: fecha ISO de la cata para mostrarla en el idioma del visitante (`tastingDate` va en español). */
type OrderWithTickets = PublicOrder & { tickets?: PublicTicket[]; tastingDateIso?: string | null };

const STATUS_TONE: Record<PublicOrder["status"], string> = {
  pending_payment: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  in_review: "bg-secondary-container text-on-secondary-container",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-error-container text-on-error-container",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};

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
                    proofEndpoint={`/api/orders/${encodeURIComponent(token)}/proof`}
                    rate={rate}
                    payment={payment}
                    offeredMethods={methods}
                    holdExpiresAt={holdExpiresAt}
                    lang={lang}
                    t={t}
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
