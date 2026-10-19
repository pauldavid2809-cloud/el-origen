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
import { isShippingCoordinated, round2 } from "@/lib/wineSale";
import { formatDeliveryDate, type PublicWineStore } from "@/lib/wineStoreRules";
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

/** Estado «En camino» (el pedido salió y aún no se entrega): aprobado, con aviso de salida y sin fecha de entrega. */
const isOnTheWay = (o: Pick<PublicWineOrder, "status" | "dispatchedAt" | "deliveredAt">) =>
  o.status === "approved" && Boolean(o.dispatchedAt) && !o.deliveredAt;

/** «miércoles 21 de octubre» → «Miércoles 21 de octubre». */
const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

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
  /** Configuración de la tienda de ahora (retiro, entrega, condiciones): la define el administrador. */
  const [store, setStore] = useState<PublicWineStore | null>(null);
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
      setStore(data.store ?? null);
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

  // Una entrega a domicilio aprobada y sin entregar: se consulta cada minuto (con la pestaña a la vista) para mostrar «En camino» sin recargar.
  const watchDelivery = order?.status === "approved" && order.fulfillment === "delivery" && !order.deliveredAt;
  useEffect(() => {
    if (!watchDelivery) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60_000);
    return () => clearInterval(id);
  }, [watchDelivery, load]);

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
                  {order.status !== "approved"
                    ? t.titlePending
                    : order.deliveredAt
                      ? t.titleDelivered
                      : isOnTheWay(order)
                        ? t.titleDispatched
                        : t.titleApproved}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold ${
                    isOnTheWay(order) ? "bg-sky-100 text-sky-900" : STATUS_TONE[order.status]
                  }`}
                >
                  {order.status === "approved" && order.deliveredAt ? t.deliveredBadge : isOnTheWay(order) ? t.dispatchedBadge : t.status[order.status]}
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7 space-y-6 min-w-0">
                {order.status === "approved" && <Approved order={order} store={store} lang={lang} />}
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
                {order.status !== "cancelled" && store && <Policies store={store} lang={lang} />}
              </div>

              <aside className="lg:col-span-5 lg:sticky lg:top-28 min-w-0">
                <Summary order={order} store={store} lang={lang} />
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

/**
 * Cómo se muestra el envío de un pedido con entrega: con costo, gratis, o por coordinar. Sale de lo que el pedido guardó
 * al crearse (`shippingMode` y `shippingUsd`), nunca de la configuración de ahora: si el administrador cambia luego el
 * modo de envío, los pedidos ya hechos siguen diciendo lo que se le cobró (o se le dijo) a ese cliente. Los pedidos
 * anteriores a la configuración de la tienda (sin modo) eran todos «a coordinar».
 */
function shippingState(order: PublicWineOrder): "none" | "paid" | "free" | "coordinated" {
  if (order.fulfillment !== "delivery") return "none";
  if (order.shippingUsd > 0) return "paid";
  return isShippingCoordinated(order) ? "coordinated" : "free";
}

function Summary({ order, store, lang }: { order: PublicWineOrder; store: PublicWineStore | null; lang: Language }) {
  const t = PEDIDO_COPY[lang];
  const ship = shippingState(order);
  const rows: [string, string][] = [
    [t.holder, order.customerName],
    [t.fulfillment, order.fulfillment === "delivery" ? t.delivery : t.pickup],
  ];
  if (order.fulfillment === "delivery" && order.deliveryAddress) rows.push([t.address, order.deliveryAddress]);
  // Día y franja que eligió el cliente (solo en entregas programadas): una preferencia que se confirma por WhatsApp.
  const preferred = order.fulfillment === "delivery" && order.deliveryDate ? formatDeliveryDate(order.deliveryDate, lang) : "";
  if (preferred) rows.push([t.preferredDate, cap(preferred)]);
  if (preferred && order.deliverySlot) rows.push([t.preferredSlot, order.deliverySlot]);
  if (order.fulfillment === "pickup" && store?.pickup.place) rows.push([t.pickupPlace, store.pickup.place]);
  if (order.fulfillment === "pickup" && store?.pickup.hours) rows.push([t.pickupHours, store.pickup.hours]);
  if (order.deliveryNote) rows.push([t.deliveryNote, order.deliveryNote]);
  // Indicaciones del administrador para quien recibe (retiro o entrega).
  const instructions = (order.fulfillment === "delivery" ? store?.delivery.instructions : store?.pickup.instructions) ?? "";
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
        {(order.subtotalUsd !== order.totalUsd || ship === "free") && (
          <div className="flex justify-between gap-4 text-on-surface-variant">
            <dt>{t.subtotal}</dt>
            <dd className="font-medium tabular-nums">{formatUsd(order.subtotalUsd)}</dd>
          </div>
        )}
        {(ship === "paid" || ship === "free") && (
          <div className="flex justify-between gap-4 text-on-surface-variant">
            <dt className="min-w-0 break-words">{order.deliveryZone ? t.shippingWithZone(order.deliveryZone) : t.shipping}</dt>
            <dd className="font-medium tabular-nums text-right">{ship === "paid" ? formatUsd(order.shippingUsd) : t.shippingFree}</dd>
          </div>
        )}
        <div className="flex justify-between items-baseline gap-4 border-t border-outline-variant pt-4">
          <dt className="font-semibold text-on-surface">{t.total}</dt>
          <dd className="font-serif text-2xl text-primary-container">{formatUsd(order.totalUsd)}</dd>
        </div>
        {ship === "coordinated" && <p className="text-[12px] text-on-surface-variant leading-relaxed">{t.shippingNoteCoordinated}</p>}
        {preferred && ["pending_payment", "in_review", "rejected"].includes(order.status) && (
          <p className="text-[12px] text-on-surface-variant leading-relaxed">{t.scheduleNote}</p>
        )}
        {order.fulfillment === "delivery" && order.status !== "cancelled" && (
          <p className="flex items-start gap-2 text-[12px] text-on-surface leading-relaxed">
            <span className="material-symbols-outlined text-[16px] flex-shrink-0 text-primary-container" aria-hidden="true">badge</span>
            <span className="min-w-0 break-words">{t.adultNotice}</span>
          </p>
        )}
        {instructions && <p className="text-[12px] text-on-surface-variant leading-relaxed break-words">{instructions}</p>}
      </dl>
    </Panel>
  );
}

/* ─── Condiciones de compra (pie del pedido) ─── */

function Policies({ store, lang }: { store: PublicWineStore; lang: Language }) {
  // Las condiciones que escribió el administrador o, si no escribió, las generadas con su configuración.
  const policies = store.policies[lang];
  return (
    <section aria-label={policies.title} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6">
      <h2 className="font-serif text-xl text-on-surface">{policies.title}</h2>
      <ul className="mt-4 space-y-2.5 list-disc pl-5 text-[13.5px] leading-relaxed text-on-surface-variant break-words">
        {policies.items.map((item, i) => (
          <li key={`${i}-${item}`}>{item}</li>
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

function Approved({ order, store, lang }: { order: PublicWineOrder; store: PublicWineStore | null; lang: Language }) {
  const t = PEDIDO_COPY[lang];
  const delivered = Boolean(order.deliveredAt);
  const onTheWay = isOnTheWay(order);
  const isDelivery = order.fulfillment === "delivery";
  const place = store?.pickup.place ?? "";
  const hours = store?.pickup.hours ?? "";
  // Día (y franja) que eligió el cliente en el carrito; vacío si el pedido no es una entrega programada.
  const chosenDate = isDelivery && order.deliveryDate ? cap(formatDeliveryDate(order.deliveryDate, lang)) : "";
  const detail = delivered && order.deliveredAt
    ? t.deliveredOn(formatDate(order.deliveredAt, lang))
    : onTheWay && order.dispatchedAt
      ? t.dispatchedText(formatDate(order.dispatchedAt, lang))
      : isDelivery
        ? chosenDate
          ? t.toDeliverScheduled(chosenDate, order.deliverySlot)
          : t.toDeliverDelivery
        : place || hours
          ? t.toDeliverPickupAt(place, hours)
          : t.toDeliverPickup;
  // Progreso de una entrega a domicilio: 0 confirmado, 1 en camino, 2 entregado.
  const step = delivered ? 2 : onTheWay ? 1 : 0;
  return (
    <div className="space-y-4">
      <Panel>
        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-[13px] font-semibold text-emerald-900">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">verified</span>
          {t.approvedBadge}
        </p>
        <p className="mt-3 text-[15px] text-on-surface-variant leading-relaxed">{t.approvedText}</p>

        <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          <div className="flex items-start gap-4">
            <span
              className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center ${
                delivered ? "bg-emerald-100 text-emerald-900" : onTheWay ? "bg-sky-100 text-sky-900" : "bg-secondary-container text-primary-container"
              }`}
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-[24px]">{delivered ? "task_alt" : isDelivery ? "local_shipping" : "inventory_2"}</span>
            </span>
            <div className="min-w-0" role="status">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{t.deliveryStatus}</p>
              <p className="font-serif text-xl text-on-surface">{delivered ? t.delivered : onTheWay ? t.dispatched : t.toDeliver}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-on-surface-variant break-words">{detail}</p>
              {onTheWay && chosenDate && (
                <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant break-words">{t.dispatchedChosen(chosenDate, order.deliverySlot)}</p>
              )}
            </div>
          </div>
          {isDelivery && <DeliverySteps step={step} lang={lang} />}
          {isDelivery && !delivered && (
            <p className="mt-4 flex items-start gap-2 text-[13px] leading-relaxed text-on-surface">
              <span className="material-symbols-outlined text-[18px] flex-shrink-0 text-primary-container" aria-hidden="true">badge</span>
              <span className="min-w-0 break-words">{t.adultNotice}</span>
            </p>
          )}
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

/* ─── Progreso de una entrega a domicilio: Confirmado → En camino → Entregado ─── */

function DeliverySteps({ step, lang }: { step: number; lang: Language }) {
  const t = PEDIDO_COPY[lang];
  return (
    <ol aria-label={t.stepsLabel} className="mt-5 flex items-start">
      {t.steps.map((label, i) => {
        const done = i <= step;
        return (
          <li key={label} aria-current={i === step ? "step" : undefined} className="relative flex-1 min-w-0 flex flex-col items-center text-center">
            {/* Tramo hasta el paso siguiente (detrás de los círculos). */}
            {i < t.steps.length - 1 && (
              <span aria-hidden="true" className={`absolute top-4 left-1/2 h-0.5 w-full ${i < step ? "bg-primary-container" : "bg-outline-variant"}`} />
            )}
            <span
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                done ? "bg-primary-container text-white" : "bg-surface-container-high text-on-surface-variant"
              }`}
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-[18px]">{i < step || (i === 2 && done) ? "check" : i === 1 ? "local_shipping" : "verified"}</span>
            </span>
            <span className={`mt-1.5 px-1 text-[12px] leading-tight break-words ${i === step ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
