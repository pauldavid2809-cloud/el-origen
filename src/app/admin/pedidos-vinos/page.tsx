"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { WineOrder } from "@/lib/wineOrders";
import type { StockWarning } from "@/lib/wines";
import { isShippingCoordinated, round2, WINE_PENDING_TTL_HOURS } from "@/lib/wineSale";

/* Pedidos de vinos: revisión de pagos, aprobación (con confirmación por correo y WhatsApp) y entrega.
   Mismo recorrido que Reservas y pagos, con sus propios textos: aquí no hay cupos, entradas ni QR.
   El detalle muestra subtotal, envío (y zona) y total; al aprobar, si algún vino con existencias controladas quedó
   sobrevendido, la respuesta trae `stockWarning` y se avisa (la aprobación nunca se bloquea: el cliente ya pagó). */

type AdminWineOrder = WineOrder & {
  proofUrl: string | null;
  /** Cuenta destino legible (resuelta en el servidor con la configuración de pagos). */
  paymentDestination: string | null;
};
/** Las aprobadas se reparten en «Por entregar» y «Entregados» según tengan fecha de entrega. */
type Tab = "in_review" | "pending_payment" | "to_deliver" | "delivered" | "rejected" | "cancelled";
type Action = "approve" | "reject" | "resend" | "cancel" | "fulfill";

const TABS: { id: Tab; label: string }[] = [
  { id: "in_review", label: "Por revisar" },
  { id: "pending_payment", label: "Por cobrar" },
  { id: "to_deliver", label: "Por entregar" },
  { id: "delivered", label: "Entregados" },
  { id: "rejected", label: "Rechazados" },
  { id: "cancelled", label: "Anulados" },
];

const tabOf = (o: AdminWineOrder): Tab => (o.status === "approved" ? (o.deliveredAt ? "delivered" : "to_deliver") : o.status);

const REJECT_REASONS = [
  "La referencia no aparece en la cuenta",
  "El monto no coincide con el total del pedido",
  "El comprobante está ilegible o incompleto",
  "La referencia ya fue usada en otra reserva o pedido",
  "El pago aún no se refleja en la cuenta",
];

const METHOD_LABEL: Record<string, string> = {
  pago_movil: "Pago Móvil",
  transferencia: "Transferencia",
  binance_usdt: "Binance USDT",
  zelle: "Zelle",
  efectivo: "Efectivo",
};

const FULFILLMENT_LABEL: Record<string, string> = { pickup: "Retiro", delivery: "Entrega a domicilio" };

const MAIL_LABEL: Record<string, string> = { resend: "Resend" };

const DELIVERY: Record<string, { label: string; cls: string }> = {
  sent: { label: "enviado", cls: "bg-emerald-100 text-emerald-900" },
  queued: { label: "en cola del bot", cls: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  failed: { label: "falló", cls: "bg-error-container text-on-error-container" },
  disabled: { label: "no configurado", cls: "bg-surface-container-high text-on-surface-variant" },
  not_sent: { label: "pendiente", cls: "bg-surface-container-high text-on-surface-variant" },
};

const bs = (n: number) => n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)} USD`;
const price = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const bottles = (n: number) => `${n} ${n === 1 ? "botella" : "botellas"}`;

/** 0414-123.45.67 → 584141234567 (para el enlace de WhatsApp con el cliente). */
function waDigits(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "58" + d.slice(1);
  if (d.length === 10 && d.startsWith("4")) d = "58" + d;
  return d;
}

/** Pedido sin pago que superó el plazo (lógico: no hay botellas reservadas); el pago reportado aún puede aprobarse. */
const isExpired = (o: AdminWineOrder) =>
  o.status === "pending_payment" && Date.parse(o.createdAt) + WINE_PENDING_TTL_HOURS * 3_600_000 < Date.now();

export default function AdminWineOrdersPage() {
  const [orders, setOrders] = useState<AdminWineOrder[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("in_review");
  const [method, setMethod] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminWineOrder | null>(null);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [wa, setWa] = useState<DeliveryInfo | null>(null);
  /** Aviso persistente de vinos sobrevendidos tras aprobar un pedido (el toast dura 4 s y esto no debe pasar inadvertido). */
  const [stockAlert, setStockAlert] = useState<{ code: string; items: StockWarning[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/wine-orders", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setOrders(data.orders);
      setPersistent(data.persistent);
      const w = await fetch("/api/admin/whatsapp", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      if (w?.success) setWa(w);
    } catch (err) {
      setLoadError((err as Error).message || "No se pudieron cargar los pedidos de vinos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const remove = async (o: AdminWineOrder) => {
    setBusy(o.id);
    try {
      const res = await fetch(`/api/admin/wine-orders/${o.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      notify(`Eliminado ${o.code}.`);
      await load();
    } catch (err) {
      notify((err as Error).message || "No se pudo eliminar el pedido.", false);
    } finally {
      setBusy(null);
    }
  };

  const act = async (o: AdminWineOrder, action: Action, why?: string) => {
    setBusy(o.id);
    try {
      const res = await fetch(`/api/admin/wine-orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: why }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const u: WineOrder = data.order;
      const sent = `Correo: ${DELIVERY[u.emailStatus].label} · WhatsApp: ${DELIVERY[u.whatsappStatus].label}.`;
      const msg: Record<Action, string> = {
        approve: `Aprobado ${u.code}. ${sent}`,
        reject:
          data.emailStatus === "sent"
            ? `Rechazado ${u.code}. Se avisó al cliente por correo.`
            : `Rechazado ${u.code}. ${data.emailStatus === "disabled" ? "El correo no está configurado" : "No se pudo enviar el correo"}: avísele por WhatsApp.`,
        resend: `Confirmación de ${u.code} reenviada. ${sent}`,
        cancel: `Anulado ${u.code}.`,
        fulfill: `${u.code} marcado como entregado.`,
      };
      notify(msg[action]);
      if (action === "approve") {
        const warnings: StockWarning[] = Array.isArray(data.stockWarning) ? data.stockWarning : [];
        if (warnings.length) setStockAlert({ code: u.code, items: warnings });
      }
      setRejecting(null);
      await load();
    } catch (err) {
      notify((err as Error).message || "No se pudo completar la acción.", false);
    } finally {
      setBusy(null);
    }
  };

  /** Pedidos del método y la forma de entrega elegidos (las pestañas cuentan sobre este filtro). */
  const filtered = useMemo(
    () => orders.filter((o) => (!method || o.paymentMethod === method) && (!fulfillment || o.fulfillment === fulfillment)),
    [orders, method, fulfillment]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach((o) => {
      const t = tabOf(o);
      c[t] = (c[t] ?? 0) + 1;
    });
    return c;
  }, [filtered]);

  const list = filtered
    .filter((o) => tabOf(o) === tab)
    .filter((o) => {
      const s = q.trim().toLowerCase();
      if (!s) return true;
      return [o.code, o.customerName, o.customerDocId, o.customerEmail, o.customerPhone, o.paymentReference ?? "", o.deliveryZone ?? "", ...o.items.map((i) => i.name)].some((v) =>
        v.toLowerCase().includes(s)
      );
    });

  const approved = orders.filter((o) => o.status === "approved");
  const approvedUsd = approved.reduce((s, o) => s + o.totalUsd, 0);

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div
          role="status"
          className={`fixed top-5 right-5 left-5 sm:left-auto z-50 sm:max-w-sm rounded-lg px-4 py-3 text-[14px] shadow-elevated ${
            toast.ok ? "bg-ink text-paper" : "bg-error text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Pedidos de vinos</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">
            {counts.in_review ?? 0} pagos por revisar · {counts.to_deliver ?? 0} por entregar · {approved.length}{" "}
            {approved.length === 1 ? "pedido aprobado" : "pedidos aprobados"} por {usd(Math.round(approvedUsd * 100) / 100)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            className="h-11 px-4 rounded border border-outline-variant text-[14px] font-semibold inline-flex items-center gap-2 hover:border-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
            Actualizar
          </button>
        </div>
      </header>

      {wa && <DeliveryStatus wa={wa} />}

      {!persistent && (
        <div className="rounded-lg border border-tertiary/40 bg-tertiary-fixed/60 p-4 text-[14px] text-on-tertiary-fixed-variant">
          <strong>Modo de prueba:</strong> Supabase no está configurado, los pedidos se guardan en memoria y se pierden al reiniciar.
          Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>SUPABASE_SERVICE_ROLE_KEY</code> y ejecute <code>supabase/v6.sql</code> y{" "}
          <code>supabase/v7.sql</code>.
        </div>
      )}

      {loadError && (
        <div role="alert" className="rounded-lg border border-error/40 bg-error-container/50 p-4 text-[14px] text-on-error-container">
          {loadError}
        </div>
      )}

      {stockAlert && (
        <div role="alert" className="rounded-lg border border-tertiary/50 bg-tertiary-fixed/70 p-4 text-[14px] text-on-tertiary-fixed-variant flex gap-3">
          <span className="material-symbols-outlined flex-shrink-0" aria-hidden="true">warning</span>
          <div className="space-y-2 min-w-0">
            <p>
              <strong>El pedido {stockAlert.code} se aprobó, pero hay más botellas reservadas que existencias.</strong> El cliente ya pagó, por
              eso no se bloqueó la aprobación:
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {stockAlert.items.map((w) => (
                <li key={w.wineId}>
                  «{w.name}»: {w.reserved} reservadas y {w.stock} en existencias (faltan {bottles(w.reserved - w.stock)}).
                </li>
              ))}
            </ul>
            <p>
              Escriba al cliente para acordar una solución, o suba las existencias en{" "}
              <a href="/admin/vinos" className="font-semibold underline">Vinos</a> si ya cuenta con más botellas.
            </p>
            <button type="button" onClick={() => setStockAlert(null)} className="h-10 px-3 -ml-3 rounded text-[13px] font-semibold underline">
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`h-10 px-4 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-colors ${
                tab === t.id ? "bg-primary-container border-primary-container text-white" : "border-outline-variant text-on-surface-variant hover:border-primary-container"
              }`}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums opacity-80">{counts[t.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Filtrar por método de pago" className="h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] sm:w-52">
            <option value="">Todos los métodos</option>
            {Object.entries(METHOD_LABEL).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value)} aria-label="Filtrar por forma de entrega" className="h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] sm:w-56">
            <option value="">Retiro y entrega</option>
            {Object.entries(FULFILLMENT_LABEL).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <input
            type="search"
            aria-label="Buscar pedidos"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, código, cédula, teléfono, referencia o vino"
            className="h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] sm:flex-1"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
          <span className="sr-only">Cargando…</span>
        </div>
      ) : list.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant">
          No hay pedidos en esta sección.
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((o) => {
            const isPdf = o.proofPath?.endsWith(".pdf");
            const expired = isExpired(o);
            const cash = o.paymentMethod === "efectivo";
            return (
              <li key={o.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 p-5">
                  <div className="space-y-4 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-serif text-xl">{o.customerName}</span>
                      <span className="text-[13px] font-semibold tracking-wider text-primary-container">{o.code}</span>
                      <span className="text-[12px] text-on-surface-variant">creado {when(o.createdAt)}</span>
                      {o.memberId && <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">Miembro</span>}
                      {expired && (
                        <span
                          title={`Pasaron más de ${WINE_PENDING_TTL_HOURS} horas sin que se reportara el pago. Si el cliente pagó, puede aprobarlo; si no, anúlelo.`}
                          className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant"
                        >
                          Vencido
                        </span>
                      )}
                    </div>

                    <ItemsList o={o} />

                    <div className="space-y-1 text-[13px] text-on-surface-variant">
                      <p className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[16px] mt-0.5" aria-hidden="true">
                          {o.fulfillment === "delivery" ? "local_shipping" : "storefront"}
                        </span>
                        <span>
                          <strong className="text-on-surface">{FULFILLMENT_LABEL[o.fulfillment]}</strong>
                          {o.fulfillment === "delivery" && o.deliveryZone && <> · Zona: {o.deliveryZone}</>}
                          {o.fulfillment === "delivery" && o.deliveryAddress && <> · {o.deliveryAddress}</>}
                          {o.deliveryNote && <> · Nota: {o.deliveryNote}</>}
                        </span>
                      </p>
                      <p>
                        C.I. {o.customerDocId} · {o.customerPhone} · {o.customerEmail}
                      </p>
                    </div>

                    {o.paymentMethod ? <PaymentSummary o={o} /> : (
                      <p className="text-[13px] text-on-surface-variant">Todavía no reportó el pago. Total del pedido: <strong className="text-on-surface">{usd(o.totalUsd)}</strong>.</p>
                    )}

                    {o.rejectionReason && o.status === "rejected" && (
                      <p className="text-[13px] text-error">Motivo: {o.rejectionReason}</p>
                    )}

                    {o.status === "approved" && (
                      <div className="flex flex-wrap gap-2 text-[12px]">
                        <span className={`px-2.5 py-1 rounded-full ${DELIVERY[o.emailStatus].cls}`}>Correo {DELIVERY[o.emailStatus].label}</span>
                        <span className={`px-2.5 py-1 rounded-full ${DELIVERY[o.whatsappStatus].cls}`}>WhatsApp {DELIVERY[o.whatsappStatus].label}</span>
                        <span className={`px-2.5 py-1 rounded-full ${o.deliveredAt ? "bg-emerald-100 text-emerald-900" : "bg-tertiary-fixed text-on-tertiary-fixed-variant"}`}>
                          {o.deliveredAt ? `Entregado el ${when(o.deliveredAt)}` : "Por entregar"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Comprobante */}
                  {o.proofUrl && (
                    <a
                      href={o.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full md:w-44 h-56 md:h-auto rounded-lg border border-outline-variant overflow-hidden bg-surface-container hover:border-primary-container"
                      title="Abrir comprobante"
                    >
                      {isPdf ? (
                        <span className="h-full flex flex-col items-center justify-center gap-1 text-primary-container">
                          <span className="material-symbols-outlined text-4xl" aria-hidden="true">picture_as_pdf</span>
                          <span className="text-[13px] font-semibold">Ver PDF</span>
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.proofUrl} alt={`Comprobante de ${o.customerName}`} className="w-full h-full object-cover object-top" />
                      )}
                    </a>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2 border-t border-outline-variant bg-surface-container-low/60 px-5 py-3">
                  {(o.status === "in_review" || o.status === "pending_payment" || o.status === "rejected") && (
                    <button
                      type="button"
                      disabled={busy === o.id}
                      onClick={() => {
                        if (o.status !== "in_review" && !confirm("Este pedido no tiene un pago reportado en revisión. ¿Aprobarlo de todos modos?")) return;
                        act(o, "approve");
                      }}
                      className="h-10 px-4 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check</span>
                      {cash ? "Marcar como pagado y enviar confirmación" : "Aprobar y enviar confirmación"}
                    </button>
                  )}
                  {/* El efectivo no se rechaza (no hay comprobante que corregir): si no paga, se anula. */}
                  {o.status === "in_review" && !cash && (
                    <button
                      type="button"
                      disabled={busy === o.id}
                      onClick={() => {
                        setRejecting(o);
                        setReason(REJECT_REASONS[0]);
                      }}
                      className="h-10 px-4 rounded border border-error/50 text-error text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-error-container/50"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
                      Rechazar
                    </button>
                  )}
                  {o.status === "approved" && (
                    <>
                      {!o.deliveredAt && (
                        <button
                          type="button"
                          disabled={busy === o.id}
                          onClick={() =>
                            confirm(`¿Marcar ${o.code} como entregado o retirado? Después ya no se podrá rechazar ni anular.`) && act(o, "fulfill")
                          }
                          className="h-10 px-4 rounded bg-primary-container hover:bg-primary text-white text-[13px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">inventory_2</span>
                          Marcar como entregado
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy === o.id}
                        onClick={() => act(o, "resend")}
                        className="h-10 px-4 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">forward_to_inbox</span>
                        Reenviar confirmación
                      </button>
                    </>
                  )}
                  <a
                    href={`https://wa.me/${waDigits(o.customerPhone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-4 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                    Escribir al cliente
                  </a>
                  <a
                    href={`/pedido/${o.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-4 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
                    Ver pedido
                  </a>
                  {o.status !== "cancelled" && !o.deliveredAt && (
                    <button
                      type="button"
                      disabled={busy === o.id}
                      onClick={() => confirm(`¿Anular el pedido ${o.code}? Esta acción no avisa al cliente.`) && act(o, "cancel")}
                      className="h-10 px-3 rounded text-[13px] font-semibold text-on-surface-variant hover:text-error ml-auto"
                    >
                      Anular
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy === o.id}
                    onClick={() =>
                      confirm(`¿Eliminar definitivamente el pedido ${o.code}? Se borran el pedido y su comprobante. No se puede deshacer.`) &&
                      remove(o)
                    }
                    className={`h-10 px-3 rounded text-[13px] font-semibold text-error hover:underline inline-flex items-center gap-1 ${
                      o.status !== "cancelled" && !o.deliveredAt ? "" : "ml-auto"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Rechazo */}
      {rejecting && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-heading">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6">
            <h2 id="reject-heading" className="font-serif text-2xl">Rechazar pago de {rejecting.customerName}</h2>
            <p className="text-[14px] text-on-surface-variant mt-1">El cliente recibirá el motivo por correo y podrá reportar el pago de nuevo.</p>
            <div className="mt-5 space-y-2">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-3 min-h-11 px-3 rounded border border-outline-variant cursor-pointer">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[#7D2A46]" />
                  <span className="text-[14px]">{r}</span>
                </label>
              ))}
              <textarea
                aria-label="Otro motivo"
                value={REJECT_REASONS.includes(reason) ? "" : reason}
                onChange={(e) => setReason(e.target.value || REJECT_REASONS[0])}
                placeholder="U otro motivo…"
                rows={2}
                maxLength={300}
                className="w-full rounded border border-outline-variant px-3 py-2 text-[14px]"
              />
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button type="button" onClick={() => setRejecting(null)} className="h-11 px-4 rounded text-[14px] font-semibold">
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy === rejecting.id}
                onClick={() => act(rejecting, "reject", reason)}
                className="h-11 px-5 rounded bg-error text-white text-[14px] font-semibold disabled:opacity-60"
              >
                Rechazar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type DeliveryInfo = {
  provider: "meta" | "bot" | "none";
  bot: { phone: string | null; running: boolean; online: boolean; lastSeen: string; text?: boolean } | null;
  queued: number;
  wineQueued?: number;
  mail: "resend" | "none";
};

function DeliveryStatus({ wa }: { wa: DeliveryInfo }) {
  return (
    <div className="space-y-2">
      {wa.mail === "none" ? (
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 text-[14px] text-on-surface-variant">
          <strong className="text-on-surface">Correo sin configurar.</strong> Defina <code>RESEND_API_KEY</code>{" "}
          (y verifique el dominio en Resend) para enviar la confirmación de los pedidos y los avisos por correo.
        </div>
      ) : (
        <p className="text-[14px] text-on-surface-variant flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true" />
          Correo: {MAIL_LABEL[wa.mail]}.
        </p>
      )}
      <WhatsAppStatus wa={wa} />
    </div>
  );
}

function WhatsAppStatus({ wa }: { wa: DeliveryInfo }) {
  if (wa.provider === "meta") {
    return (
      <p className="text-[14px] text-on-surface-variant flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true" />
        WhatsApp: API oficial de Meta.
      </p>
    );
  }
  if (wa.provider === "none") {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 text-[14px] text-on-surface-variant">
        <strong className="text-on-surface">WhatsApp sin configurar.</strong> Defina <code>WHATSAPP_QUEUE_SECRET</code> y encienda el bot
        (carpeta <code>whatsapp-bot/</code>) para enviar la confirmación de los pedidos por WhatsApp.
      </div>
    );
  }
  const online = wa.bot?.online;
  const outdated = Boolean(wa.bot?.running) && wa.bot?.text === false;
  const seen = wa.bot ? new Date(wa.bot.lastSeen).toLocaleString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <div className="space-y-2">
      <div
        className={`rounded-lg border p-4 text-[14px] flex flex-wrap items-center gap-x-4 gap-y-1 ${
          online ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-error/40 bg-error-container/50 text-on-error-container"
        }`}
      >
        <span className="flex items-center gap-2 font-semibold">
          <span className={`w-2.5 h-2.5 rounded-full ${online ? "bg-emerald-600 animate-pulse-soft" : "bg-error"}`} aria-hidden="true" />
          {online
            ? `Bot de WhatsApp conectado${wa.bot?.phone ? ` (+${wa.bot.phone})` : ""}`
            : wa.bot?.running
              ? "Bot encendido, pero sin WhatsApp vinculado"
              : "Bot de WhatsApp apagado"}
        </span>
        <span>
          {wa.queued} mensaje{wa.queued === 1 ? "" : "s"} en cola
          {(wa.wineQueued ?? 0) > 0 && ` (${wa.wineQueued} de pedidos de vinos)`}
        </span>
        {!online && (
          <span>
            {wa.bot?.running
              ? "Abra el panel del bot (http://localhost:3001) y escanee el QR con el teléfono de El Origen."
              : `Encienda el bot en la computadora para enviar la cola${seen ? ` (última conexión: ${seen})` : ""}.`}
          </span>
        )}
      </div>
      {outdated && (
        <div role="alert" className="rounded-lg border border-tertiary/50 bg-tertiary-fixed/60 p-4 text-[14px] text-on-tertiary-fixed-variant">
          <strong>El bot conectado es una versión anterior y no envía los pedidos de vinos.</strong> Esas confirmaciones esperan en la cola
          (los envíos de las reservas de catas no se afectan). Actualice el bot con la carpeta <code>whatsapp-bot/</code> más reciente.
        </div>
      )}
    </div>
  );
}

/**
 * Líneas del pedido: cantidad × vino, precio unitario y subtotal. Al pie, el total; en una entrega a domicilio (o si se
 * cobró envío), el desglose subtotal + envío (con la zona elegida) = total. El envío se lee de lo que el pedido guardó al
 * crearse (`shippingMode` y `shippingUsd`), no de la configuración de ahora: con costo se muestra el monto; si era «a
 * coordinar» (también los pedidos anteriores a la configuración de la tienda) no está en el total y se paga aparte; y con
 * costo fijo o por zonas y envío en cero salió gratis.
 */
function ItemsList({ o }: { o: AdminWineOrder }) {
  const shipping = o.shippingUsd ?? 0;
  const delivery = o.fulfillment === "delivery";
  const breakdown = delivery || shipping > 0;
  const coordinated = isShippingCoordinated({ fulfillment: o.fulfillment, shippingMode: o.shippingMode ?? null, shippingUsd: shipping });
  const subtotal = o.subtotalUsd ?? round2(o.totalUsd - shipping);
  return (
    <div className="rounded-lg border border-outline-variant">
      <ul className="divide-y divide-outline-variant">
        {o.items.map((i) => (
          <li key={i.wineId} className="flex items-baseline justify-between gap-3 px-3.5 py-2.5 text-[14px]">
            <span className="min-w-0">
              <span className="font-semibold tabular-nums">{i.quantity} ×</span> {[i.name, i.vintage].filter(Boolean).join(" ")}
              <span className="block text-[12px] text-on-surface-variant">{price(i.unitPriceUsd)} por botella</span>
            </span>
            <span className="font-semibold tabular-nums whitespace-nowrap">{price(Math.round(i.unitPriceUsd * i.quantity * 100) / 100)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-[14px] space-y-1">
        {breakdown && (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-on-surface-variant">Subtotal · {bottles(o.bottlesCount)}</span>
              <span className="tabular-nums">{price(subtotal)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-on-surface-variant min-w-0">
                Envío{o.deliveryZone ? ` · ${o.deliveryZone}` : ""}
                {coordinated && (
                  <span className="block text-[12px]">El costo se acuerda con el cliente por WhatsApp y se paga aparte.</span>
                )}
              </span>
              <span className="tabular-nums whitespace-nowrap">{shipping > 0 ? price(shipping) : coordinated ? "No incluido" : "Gratis"}</span>
            </div>
          </>
        )}
        <div className={`flex items-baseline justify-between gap-3 ${breakdown ? "border-t border-outline-variant pt-1.5" : ""}`}>
          <span className="text-on-surface-variant">{breakdown ? "Total" : `Total · ${bottles(o.bottlesCount)}`}</span>
          <span className="font-serif text-lg tabular-nums">{usd(o.totalUsd)}</span>
        </div>
      </div>
    </div>
  );
}

/** Resumen del pago reportado según el método (Bs, USDT, USD por Zelle o efectivo), con alerta si el monto no coincide. */
function PaymentSummary({ o }: { o: AdminWineOrder }) {
  const method = METHOD_LABEL[o.paymentMethod ?? ""] ?? o.paymentMethod;
  const cash = o.paymentMethod === "efectivo";
  const usdt = o.paymentMethod === "binance_usdt";
  const zelle = o.paymentMethod === "zelle";
  /** Pagado en divisa: el monto esperado es el total en USD. */
  const inUsd = usdt || zelle;
  const expected = inUsd ? o.totalUsd : o.bcvRate ? o.totalUsd * o.bcvRate : null;
  const paid = o.paymentAmountBs;
  const mismatch = !cash && expected !== null && paid !== null && Math.abs(paid - expected) > Math.max(inUsd ? 0.5 : 1, expected * 0.01);
  const amount = (n: number) => (usdt ? `${bs(n)} USDT` : zelle ? usd(n) : `Bs ${bs(n)}`);

  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-surface-container-low p-3 text-[13px]">
        <div>
          <dt className="text-on-surface-variant">Total</dt>
          <dd className="font-semibold">{usd(o.totalUsd)}</dd>
          {!inUsd && !cash && expected !== null && <dd className="text-on-surface-variant">≈ Bs {bs(expected)}</dd>}
        </div>
        {cash ? (
          <div className="col-span-1 sm:col-span-3">
            <dt className="text-on-surface-variant">Efectivo</dt>
            {o.status === "approved" ? (
              <>
                <dd className="font-semibold text-emerald-800">Cobrado</dd>
                <dd className="text-on-surface-variant">Marcado como pagado el {when(o.reviewedAt)}.</dd>
              </>
            ) : (
              <>
                <dd className="font-semibold">Por cobrar · pago acordado por WhatsApp</dd>
                <dd className="text-on-surface-variant">Al recibir el dinero, use «Marcar como pagado» para enviarle la confirmación; si no paga, anule el pedido.</dd>
              </>
            )}
          </div>
        ) : (
          <>
            <div>
              <dt className="text-on-surface-variant">Pagado</dt>
              <dd className={`font-semibold ${mismatch ? "text-error" : ""}`}>
                {paid != null ? amount(paid) : "—"}
                {mismatch && <span className="block text-[11px] font-normal">no coincide</span>}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">{usdt ? "Order ID / TxID" : zelle ? "Confirmación Zelle" : "Referencia"}</dt>
              <dd className="font-semibold tabular-nums break-all">{o.paymentReference ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">{method}</dt>
              {o.payerBank && <dd className="font-semibold">{o.payerBank}</dd>}
              {o.payerDocId && <dd className="text-on-surface-variant">C.I. {o.payerDocId}</dd>}
              {!usdt && o.paymentDestination && <dd className="text-on-surface-variant">→ {o.paymentDestination}</dd>}
            </div>
          </>
        )}
      </dl>
      {o.paymentNote && (
        <p className="text-[13px] text-on-surface-variant">
          <strong className="text-on-surface">Nota del cliente:</strong> {o.paymentNote}
        </p>
      )}
    </div>
  );
}
