"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Order, Ticket } from "@/lib/orders";

type AdminOrder = Order & {
  proofUrl: string | null;
  tickets: Ticket[];
  couponReferrer: string | null;
  /** Cuenta destino legible (resuelta en el servidor con la configuración de pagos). */
  paymentDestination: string | null;
};
type Tab = "in_review" | "pending_payment" | "approved" | "rejected" | "cancelled";

const TABS: { id: Tab; label: string }[] = [
  { id: "in_review", label: "Por revisar" },
  { id: "pending_payment", label: "Sin pago" },
  { id: "approved", label: "Aprobadas" },
  { id: "rejected", label: "Rechazadas" },
  { id: "cancelled", label: "Anuladas" },
];

const REJECT_REASONS = [
  "La referencia no aparece en la cuenta",
  "El monto no coincide con el total",
  "El comprobante está ilegible o incompleto",
  "La referencia ya fue usada en otra reserva",
  "El pago aún no se refleja en la cuenta",
];

const METHOD_LABEL: Record<string, string> = {
  pago_movil: "Pago Móvil",
  transferencia: "Transferencia",
  binance_usdt: "Binance USDT",
  zelle: "Zelle",
  efectivo: "Efectivo",
};

const RATE_SUFFIX: Record<string, string> = { EUR: " (tasa BCV euro)", BINANCE: " (tasa Binance)" };

const MAIL_LABEL: Record<string, string> = { gmail: "Gmail", resend: "Resend" };

const DELIVERY: Record<string, { label: string; cls: string }> = {
  sent: { label: "enviado", cls: "bg-emerald-100 text-emerald-900" },
  queued: { label: "en cola del bot", cls: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  failed: { label: "falló", cls: "bg-error-container text-on-error-container" },
  disabled: { label: "no configurado", cls: "bg-surface-container-high text-on-surface-variant" },
  not_sent: { label: "pendiente", cls: "bg-surface-container-high text-on-surface-variant" },
};

const bs = (n: number) => n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)} USD`;
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function AdminReservationsPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("in_review");
  const [tasting, setTasting] = useState("");
  const [method, setMethod] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminOrder | null>(null);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [wa, setWa] = useState<DeliveryInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setPersistent(data.persistent);
      }
      const w = await fetch("/api/admin/whatsapp", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      if (w?.success) setWa(w);
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

  const act = async (o: AdminOrder, action: "approve" | "reject" | "resend" | "cancel", why?: string) => {
    setBusy(o.id);
    try {
      const res = await fetch(`/api/admin/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: why }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const u: Order = data.order;
      const entries = Array.isArray(data.tickets) ? data.tickets.length : u.spotsCount;
      const sent = `${entries} entrada${entries === 1 ? "" : "s"}. Correo: ${DELIVERY[u.emailStatus].label} · WhatsApp: ${DELIVERY[u.whatsappStatus].label}.`;
      const msg: Record<string, string> = {
        approve: `Aprobada ${u.code}: ${sent}`,
        reject:
          data.emailStatus === "sent"
            ? `Rechazada ${u.code}. Se avisó al cliente por correo.`
            : `Rechazada ${u.code}. ${data.emailStatus === "disabled" ? "El correo no está configurado" : "No se pudo enviar el correo"}: avísele por WhatsApp.`,
        resend: `Reenvío ${u.code}: ${sent}`,
        cancel: `Anulada ${u.code}. Los cupos quedaron libres.`,
      };
      notify(msg[action]);
      setRejecting(null);
      await load();
    } catch (err) {
      notify((err as Error).message || "No se pudo completar la acción.", false);
    } finally {
      setBusy(null);
    }
  };

  const tastings = useMemo(() => {
    const m = new Map<string, string>();
    orders.forEach((o) => m.set(o.tastingId, `${o.tastingTitle} · ${o.tastingDate}`));
    return Array.from(m.entries());
  }, [orders]);

  /** Órdenes de la cata y el método elegidos (las pestañas cuentan sobre este filtro). */
  const filtered = useMemo(
    () => orders.filter((o) => (!tasting || o.tastingId === tasting) && (!method || o.paymentMethod === method)),
    [orders, tasting, method]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    filtered.forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1));
    return c;
  }, [filtered]);

  /** Efectivo de la cata elegida: por cobrar (reportado, sin aprobar) y cobrado (aprobado). */
  const cash = useMemo(() => {
    const ofCata = orders.filter((o) => o.paymentMethod === "efectivo" && (!tasting || o.tastingId === tasting));
    const sum = (list: AdminOrder[]) => ({
      orders: list.length,
      spots: list.reduce((n, o) => n + o.spotsCount, 0),
      usd: list.reduce((n, o) => n + o.totalUsd, 0),
    });
    return { pending: sum(ofCata.filter((o) => o.status === "in_review")), paid: sum(ofCata.filter((o) => o.status === "approved")) };
  }, [orders, tasting]);

  const showCash = (status: "in_review" | "approved") => {
    setMethod("efectivo");
    setTab(status);
  };

  const list = filtered
    .filter((o) => o.status === tab)
    .filter((o) => {
      const s = q.trim().toLowerCase();
      if (!s) return true;
      return [
        o.code,
        o.customerName,
        o.customerDocId,
        o.customerEmail,
        o.paymentReference ?? "",
        o.couponCode ?? "",
        ...o.tickets.flatMap((t) => [t.code, t.attendeeName ?? ""]),
      ].some((v) => v.toLowerCase().includes(s));
    });

  const approvedOrders = orders.filter((o) => o.status === "approved" && (!tasting || o.tastingId === tasting));
  const approvedSpots = approvedOrders.reduce((s, o) => s + o.spotsCount, 0);
  const checkedIn = approvedOrders.reduce((s, o) => s + o.tickets.filter((t) => t.checkedInAt).length, 0);

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div
          role="status"
          className={`fixed top-5 right-5 z-50 max-w-sm rounded-lg px-4 py-3 text-[14px] shadow-elevated ${
            toast.ok ? "bg-ink text-paper" : "bg-error text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Reservas y pagos</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">
            {approvedSpots} cupos confirmados{tasting ? " en esta cata" : ""} · {checkedIn} ingresaron · {counts.in_review ?? 0} pagos por
            revisar
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="h-11 px-4 rounded border border-outline-variant text-[14px] font-semibold inline-flex items-center gap-2 hover:border-primary-container">
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Actualizar
          </button>
          <a
            href={`/api/admin/orders/export${tasting ? `?tasting=${encodeURIComponent(tasting)}` : ""}`}
            className="h-11 px-4 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Exportar Excel
          </a>
        </div>
      </header>

      {wa && <DeliveryStatus wa={wa} />}

      {(cash.pending.orders > 0 || cash.paid.orders > 0) && (
        <section aria-label="Pagos en efectivo" className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary-container" aria-hidden="true">payments</span>
            <h2 className="font-serif text-xl">Efectivo{tasting ? " en esta cata" : ""}</h2>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                ["in_review", "Por cobrar", cash.pending, "Al recibir el dinero, use «Marcar como pagado» para enviarle los QR."],
                ["approved", "Cobrado", cash.paid, "Pagos en efectivo ya recibidos y con entradas enviadas."],
              ] as const
            ).map(([status, label, sum, hint]) => (
              <button
                key={status}
                type="button"
                onClick={() => showCash(status)}
                className={`text-left rounded-lg border p-3.5 transition-colors hover:border-primary-container ${
                  method === "efectivo" && tab === status ? "border-primary-container bg-primary-fixed/40" : "border-outline-variant"
                }`}
              >
                <span className="block text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
                <span className="block font-serif text-2xl mt-0.5">{usd(sum.usd)}</span>
                <span className="block text-[13px] text-on-surface-variant">
                  {sum.orders} reserva{sum.orders === 1 ? "" : "s"} · {sum.spots} cupo{sum.spots === 1 ? "" : "s"}
                </span>
                <span className="block text-[12px] text-on-surface-variant mt-1.5">{hint}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!persistent && (
        <div className="rounded-lg border border-tertiary/40 bg-tertiary-fixed/60 p-4 text-[14px] text-on-tertiary-fixed-variant">
          <strong>Modo de prueba:</strong> Supabase no está configurado, las reservas se guardan en memoria y se pierden al reiniciar.
          Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>SUPABASE_SERVICE_ROLE_KEY</code> y ejecute <code>supabase/orders.sql</code> y{" "}
          <code>supabase/v2.sql</code>.
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
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
          <select value={tasting} onChange={(e) => setTasting(e.target.value)} aria-label="Filtrar por cata" className="h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] sm:w-80">
            <option value="">Todas las catas</option>
            {tastings.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Filtrar por método de pago" className="h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] sm:w-52">
            <option value="">Todos los métodos</option>
            {Object.entries(METHOD_LABEL).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <input
            type="search"
            aria-label="Buscar reservas"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre, código, cédula, referencia o cupón"
            className="h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] sm:flex-1"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
        </div>
      ) : list.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant">
          No hay reservas en esta sección.
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((o) => {
            const isPdf = o.proofPath?.endsWith(".pdf");
            return (
              <li key={o.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 p-5">
                  <div className="space-y-4 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-serif text-xl">{o.customerName}</span>
                      <span className="text-[13px] font-semibold tracking-wider text-primary-container">{o.code}</span>
                      <span className="text-[12px] text-on-surface-variant">creada {when(o.createdAt)}</span>
                      {o.memberId && <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">Miembro</span>}
                    </div>
                    <p className="text-[14px] text-on-surface-variant">
                      <strong className="text-on-surface">{o.spotsCount} cupo{o.spotsCount === 1 ? "" : "s"}</strong> · {o.tastingTitle} · {o.tastingDate}
                      {o.addOns.length > 0 && <> · {o.addOns.map((a) => `${a.quantity}× ${a.title}`).join(", ")}</>}
                    </p>
                    <p className="text-[13px] text-on-surface-variant">
                      C.I. {o.customerDocId} · {o.customerPhone} · {o.customerEmail}
                      {o.dietaryRestrictions && <> · Dieta: {o.dietaryRestrictions}</>}
                    </p>
                    {o.couponCode && (
                      <p className="text-[13px] text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">sell</span>
                        Cupón <strong className="text-on-surface">{o.couponCode}</strong> · −{usd(o.discountUsd)}
                        {o.couponReferrer && <> · Referente: <strong className="text-on-surface">{o.couponReferrer}</strong></>}
                      </p>
                    )}

                    {o.paymentMethod && <PaymentSummary o={o} />}

                    {o.rejectionReason && o.status === "rejected" && (
                      <p className="text-[13px] text-error">Motivo: {o.rejectionReason}</p>
                    )}

                    {o.status === "approved" && (
                      <>
                        <div className="flex flex-wrap gap-2 text-[12px]">
                          <span className={`px-2.5 py-1 rounded-full ${DELIVERY[o.emailStatus].cls}`}>Correo {DELIVERY[o.emailStatus].label}</span>
                          <span className={`px-2.5 py-1 rounded-full ${DELIVERY[o.whatsappStatus].cls}`}>WhatsApp {DELIVERY[o.whatsappStatus].label}</span>
                        </div>
                        <TicketList tickets={o.tickets} spots={o.spotsCount} />
                      </>
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
                          <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
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
                      disabled={busy === o.id}
                      onClick={() => {
                        if (o.status !== "in_review" && !confirm("Esta orden no tiene un pago reportado en revisión. ¿Aprobar de todos modos?")) return;
                        act(o, "approve");
                      }}
                      className="h-10 px-4 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      {o.paymentMethod === "efectivo" ? "Marcar como pagado y enviar" : "Aprobar y enviar"}{" "}
                      {o.spotsCount === 1 ? "QR" : `${o.spotsCount} QR`}
                    </button>
                  )}
                  {/* El efectivo no se rechaza (no hay comprobante que corregir): si no paga, se anula. */}
                  {o.status === "in_review" && o.paymentMethod !== "efectivo" && (
                    <button
                      disabled={busy === o.id}
                      onClick={() => {
                        setRejecting(o);
                        setReason(REJECT_REASONS[0]);
                      }}
                      className="h-10 px-4 rounded border border-error/50 text-error text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-error-container/50"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      Rechazar
                    </button>
                  )}
                  {o.status === "approved" && (
                    <>
                      <button
                        disabled={busy === o.id}
                        onClick={() => act(o, "resend")}
                        className="h-10 px-4 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container"
                      >
                        <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                        Reenviar QR
                      </button>
                      <a
                        href={`/orden/${o.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-4 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container"
                      >
                        <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                        Ver entrada
                      </a>
                    </>
                  )}
                  {o.status !== "cancelled" && !o.checkedInAt && (
                    <button
                      disabled={busy === o.id}
                      onClick={() => confirm(`¿Anular la reserva ${o.code}? Se liberan sus cupos.`) && act(o, "cancel")}
                      className="h-10 px-3 rounded text-[13px] font-semibold text-on-surface-variant hover:text-error ml-auto"
                    >
                      Anular
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Rechazo */}
      {rejecting && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6">
            <h2 className="font-serif text-2xl">Rechazar pago de {rejecting.customerName}</h2>
            <p className="text-[14px] text-on-surface-variant mt-1">El cliente recibirá el motivo por correo y podrá reportar el pago de nuevo.</p>
            <div className="mt-5 space-y-2">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-3 min-h-11 px-3 rounded border border-outline-variant cursor-pointer">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-[#7D2A46]" />
                  <span className="text-[14px]">{r}</span>
                </label>
              ))}
              <textarea
                value={REJECT_REASONS.includes(reason) ? "" : reason}
                onChange={(e) => setReason(e.target.value || REJECT_REASONS[0])}
                placeholder="U otro motivo…"
                rows={2}
                className="w-full rounded border border-outline-variant px-3 py-2 text-[14px]"
              />
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setRejecting(null)} className="h-11 px-4 rounded text-[14px] font-semibold">
                Cancelar
              </button>
              <button
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
  bot: { phone: string | null; running: boolean; online: boolean; lastSeen: string } | null;
  queued: number;
  mail: "gmail" | "resend" | "none";
};

function DeliveryStatus({ wa }: { wa: DeliveryInfo }) {
  return (
    <div className="space-y-2">
      {wa.mail === "none" ? (
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 text-[14px] text-on-surface-variant">
          <strong className="text-on-surface">Correo sin configurar.</strong> Defina <code>GMAIL_USER</code> y <code>GMAIL_APP_PASSWORD</code>{" "}
          (contraseña de aplicación de Google) para enviar las entradas y los avisos por correo.
        </div>
      ) : (
        <p className="text-[14px] text-on-surface-variant flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
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
        <span className="w-2 h-2 rounded-full bg-emerald-600" />
        WhatsApp: API oficial de Meta.
      </p>
    );
  }
  if (wa.provider === "none") {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 text-[14px] text-on-surface-variant">
        <strong className="text-on-surface">WhatsApp sin configurar.</strong> Defina <code>WHATSAPP_QUEUE_SECRET</code> y encienda el bot
        (carpeta <code>whatsapp-bot/</code>) para enviar las entradas por WhatsApp.
      </div>
    );
  }
  const online = wa.bot?.online;
  const seen = wa.bot ? new Date(wa.bot.lastSeen).toLocaleString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null;
  return (
    <div
      className={`rounded-lg border p-4 text-[14px] flex flex-wrap items-center gap-x-4 gap-y-1 ${
        online ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-error/40 bg-error-container/50 text-on-error-container"
      }`}
    >
      <span className="flex items-center gap-2 font-semibold">
        <span className={`w-2.5 h-2.5 rounded-full ${online ? "bg-emerald-600 animate-pulse-soft" : "bg-error"}`} />
        {online
          ? `Bot de WhatsApp conectado${wa.bot?.phone ? ` (+${wa.bot.phone})` : ""}`
          : wa.bot?.running
            ? "Bot encendido, pero sin WhatsApp vinculado"
            : "Bot de WhatsApp apagado"}
      </span>
      <span>{wa.queued} mensaje{wa.queued === 1 ? "" : "s"} en cola</span>
      {!online && (
        <span>
          {wa.bot?.running
            ? "Abra el panel del bot (http://localhost:3001) y escanee el QR con el teléfono de El Origen."
            : `Encienda el bot en la computadora para enviar la cola${seen ? ` (última conexión: ${seen})` : ""}.`}
        </span>
      )}
    </div>
  );
}

/** Resumen del pago reportado según el método (Bs, USDT, USD por Zelle o efectivo), con alerta si el monto no coincide. */
function PaymentSummary({ o }: { o: AdminOrder }) {
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
          {!inUsd && !cash && expected !== null && (
            <dd className="text-on-surface-variant">
              ≈ Bs {bs(expected)}
              {RATE_SUFFIX[o.rateCurrency ?? ""] ?? ""}
            </dd>
          )}
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
                <dd className="font-semibold">Por cobrar · entrega acordada por WhatsApp</dd>
                <dd className="text-on-surface-variant">El cupo queda apartado hasta que lo marque como pagado o anule la reserva.</dd>
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

/** Entradas de una orden aprobada: código, asistente y si ya ingresó. */
function TicketList({ tickets, spots }: { tickets: Ticket[]; spots: number }) {
  if (!tickets.length) return null;
  const inside = tickets.filter((t) => t.checkedInAt).length;
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
        Entradas · {inside} de {spots} ingresaron
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {tickets.map((t) => (
          <li
            key={t.id}
            className={`flex items-center gap-2 rounded border px-3 py-2 text-[13px] ${
              t.checkedInAt ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-outline-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {t.checkedInAt ? "how_to_reg" : "confirmation_number"}
            </span>
            <span className="min-w-0">
              <span className="font-semibold tabular-nums">{t.code}</span>
              {t.attendeeName && <span className="text-on-surface-variant"> · {t.attendeeName}</span>}
              <span className="block text-[12px] text-on-surface-variant">
                {t.checkedInAt ? `Ingresó ${when(t.checkedInAt)}${t.checkedInBy ? ` · ${t.checkedInBy}` : ""}` : "Sin ingresar"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
