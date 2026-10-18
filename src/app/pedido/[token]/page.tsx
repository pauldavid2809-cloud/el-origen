"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PayAndReport, Panel, type RateInfo } from "@/components/PayAndReport";
import { formatBs, formatUsd } from "@/components/PaymentDetails";
import { CONTACT, whatsappLink } from "@/lib/contact";
import { useLang } from "@/lib/useLang";
import { WINE_POLICIES, round2 } from "@/lib/wineSale";
import type { Language } from "@/lib/i18n";
import type { PublicWineOrder } from "@/lib/wineOrders";
import type { PaymentConfig } from "@/lib/settings";
import type { PaymentMethodId } from "@/types";
import { PEDIDO_COPY } from "./copy";

const STATUS_TONE: Record<PublicWineOrder["status"], string> = {
  pending_payment: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  in_review: "bg-secondary-container text-on-secondary-container",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-error-container text-on-error-container",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};

function formatDate(iso: string, lang: Language): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(lang === "es" ? "es-VE" : "en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Caracas" });
}

/* Pedido de vinos: pagar y reportar el pago, seguir su revisión y ver la confirmación y la entrega.
   El enlace (token) es el secreto: no hay sesión. */
export default function WineOrderPage() {
  const { token } = useParams<{ token: string }>();
  const [lang, setLang] = useLang();
  const t = PEDIDO_COPY[lang];
  const [order, setOrder] = useState<PublicWineOrder | null>(null);
  const [rate, setRate] = useState<RateInfo | null>(null);
  const [payment, setPayment] = useState<PaymentConfig | null>(null);
  /** Métodos que acepta la tienda (los envía el servidor). */
  const [methods, setMethods] = useState<PaymentMethodId[] | null>(null);
  /** El pedido venció (más de 72 h sin reportar el pago): el servidor lo decide. */
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/wine-orders/${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 404) setNotFound(true);
        return;
      }
      setOrder(data.order);
      setRate(data.rate ?? null);
      setPayment(data.payment ?? null);
      setMethods(Array.isArray(data.methods) ? data.methods : null);
      setExpired(Boolean(data.expired));
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

  // Mientras el pago está en revisión, consultar periódicamente.
  useEffect(() => {
    if (order?.status !== "in_review") return;
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [order?.status, load]);

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
                  {order.status === "approved" ? t.titleApproved : t.titlePending}
                </h1>
                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${STATUS_TONE[order.status]}`}>
                  {t.status[order.status]}
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7 space-y-6 min-w-0">
                {order.status === "approved" && <Approved order={order} lang={lang} />}
                {order.status === "in_review" && <InReview order={order} lang={lang} />}
                {(order.status === "pending_payment" || order.status === "rejected") && (
                  <PayAndReport
                    order={order}
                    proofEndpoint={`/api/wine-orders/${encodeURIComponent(token)}/proof`}
                    rate={rate}
                    payment={payment}
                    offeredMethods={methods}
                    holdExpiresAt={null}
                    expired={expired}
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
                {order.status !== "cancelled" && <Policies lang={lang} />}
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

function Summary({ order, lang }: { order: PublicWineOrder; lang: Language }) {
  const t = PEDIDO_COPY[lang];
  const rows: [string, string][] = [
    [t.holder, order.customerName],
    [t.fulfillment, order.fulfillment === "delivery" ? t.delivery : t.pickup],
  ];
  if (order.fulfillment === "delivery" && order.deliveryAddress) rows.push([t.address, order.deliveryAddress]);
  if (order.deliveryNote) rows.push([t.deliveryNote, order.deliveryNote]);
  return (
    <Panel className="!p-0 overflow-hidden">
      <div className="bg-primary-container text-paper px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sun">{t.summaryEyebrow}</p>
        <h2 className="font-serif text-2xl leading-snug mt-1">{t.bottles(order.bottlesCount)}</h2>
      </div>
      <ul className="px-6 pt-2 divide-y divide-outline-variant/70 text-[14px]">
        {order.items.map((item, i) => (
          <li key={`${item.wineId}-${i}`} className="flex justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-on-surface break-words">{[item.name, item.vintage].filter(Boolean).join(" · ")}</p>
              <p className="text-[13px] text-on-surface-variant tabular-nums">
                {item.quantity} × {formatUsd(item.unitPriceUsd)}
              </p>
            </div>
            <p className="font-medium tabular-nums flex-shrink-0">{formatUsd(round2(item.unitPriceUsd * item.quantity))}</p>
          </li>
        ))}
      </ul>
      <dl className="px-6 py-5 space-y-3 text-[14px] border-t border-outline-variant">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-on-surface-variant flex-shrink-0">{k}</dt>
            <dd className="text-right font-medium text-on-surface break-words min-w-0">{v}</dd>
          </div>
        ))}
        {order.subtotalUsd !== order.totalUsd && (
          <div className="flex justify-between gap-4 text-on-surface-variant">
            <dt>{t.subtotal}</dt>
            <dd className="font-medium tabular-nums">{formatUsd(order.subtotalUsd)}</dd>
          </div>
        )}
        <div className="flex justify-between items-baseline gap-4 border-t border-outline-variant pt-4">
          <dt className="font-semibold text-on-surface">{t.total}</dt>
          <dd className="font-serif text-2xl text-primary-container">{formatUsd(order.totalUsd)}</dd>
        </div>
        <p className="text-[12px] text-on-surface-variant leading-relaxed">{t.shippingNote}</p>
      </dl>
    </Panel>
  );
}

/* ─── Condiciones de compra (pie del pedido) ─── */

function Policies({ lang }: { lang: Language }) {
  const policies = WINE_POLICIES[lang];
  return (
    <section aria-label={policies.title} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2 className="font-serif text-xl text-on-surface">{policies.title}</h2>
      <ul className="mt-4 space-y-2.5 list-disc pl-5 text-[13.5px] leading-relaxed text-on-surface-variant">
        {policies.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

/* ─── En revisión ─── */

function InReview({ order, lang }: { order: PublicWineOrder; lang: Language }) {
  const t = PEDIDO_COPY[lang];
  const method = order.paymentMethod as PaymentMethodId | null;
  const isCash = method === "efectivo";
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
          <span className="material-symbols-outlined text-[26px] text-primary-container">{isCash ? "handshake" : "hourglass_top"}</span>
        </span>
        <div className="min-w-0">
          <h2 className="font-serif text-2xl">{t.reviewTitle}</h2>
          <p className="text-on-surface-variant mt-2 leading-relaxed break-words">{isCash ? t.reviewCashText : t.reviewText}</p>
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

/* ─── Confirmado: pago verificado y estado de la entrega ─── */

function Approved({ order, lang }: { order: PublicWineOrder; lang: Language }) {
  const t = PEDIDO_COPY[lang];
  const delivered = Boolean(order.deliveredAt);
  return (
    <div className="space-y-4">
      <Panel>
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-[13px] font-semibold text-emerald-900">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">verified</span>
          {t.approvedBadge}
        </p>
        <p className="mt-3 text-[15px] text-on-surface-variant leading-relaxed">{t.approvedText}</p>

        <div className="mt-5 flex items-start gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4" role="status">
          <span
            className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center ${delivered ? "bg-emerald-100 text-emerald-900" : "bg-secondary-container text-primary-container"}`}
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-[24px]">{delivered ? "task_alt" : order.fulfillment === "delivery" ? "local_shipping" : "inventory_2"}</span>
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{t.deliveryStatus}</p>
            <p className="font-serif text-xl text-on-surface">{delivered ? t.delivered : t.toDeliver}</p>
            <p className="mt-0.5 text-[13px] text-on-surface-variant">
              {delivered && order.deliveredAt
                ? t.deliveredOn(formatDate(order.deliveredAt, lang))
                : order.fulfillment === "delivery"
                  ? t.toDeliverDelivery
                  : t.toDeliverPickup}
            </p>
          </div>
        </div>
      </Panel>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
        <Link
          href="/vinos"
          className="shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-2 h-12 px-6 rounded border border-outline-variant hover:border-primary-container text-[14px] font-semibold"
        >
          {t.moreWines}
        </Link>
        <p className="min-w-0 text-[13px] text-on-surface-variant break-words">{t.keepLink}</p>
      </div>
      <a
        href={whatsappLink(t.questionMessage(order.code))}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 min-h-11 text-[14px] font-semibold text-primary-container"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
        {t.questions} · {CONTACT.phoneDisplay}
      </a>
    </div>
  );
}
