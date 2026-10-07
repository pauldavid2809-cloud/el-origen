"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  persistent: boolean;
  orders: { inReview: number; pendingPayment: number };
  sales: { approvedOrders: number; approvedSpots: number; approvedUsd: number; last30DaysUsd: number; last30DaysSpots: number };
  tickets: { issued: number; checkedIn: number };
  upcoming: {
    id: string;
    slug: string;
    title: string;
    dateDisplay: string;
    timeStart: string;
    status: "active" | "sold_out" | "draft" | "archived";
    totalSpots: number;
    heldSpots: number;
    approvedSpots: number;
    availableSpots: number;
    approvedUsd: number;
  }[];
  members: { total: number; last7Days: number };
  leads: { private: number; brand: number; sommelier: number };
  recentOrders: {
    code: string;
    customerName: string;
    tastingTitle: string;
    tastingDate: string;
    spotsCount: number;
    totalUsd: number;
    status: string;
    createdAt: string;
  }[];
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: "Sin pago", cls: "bg-surface-container-high text-on-surface-variant" },
  in_review: { label: "Por revisar", cls: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  approved: { label: "Aprobada", cls: "bg-emerald-100 text-emerald-900" },
  rejected: { label: "Rechazada", cls: "bg-error-container text-on-error-container" },
  cancelled: { label: "Anulada", cls: "bg-surface-container-high text-on-surface-variant" },
};

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const when = (iso: string) =>
  new Date(iso).toLocaleString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setStats(data);
    } catch (err) {
      setError((err as Error).message || "No se pudo cargar el resumen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const newLeads = stats ? stats.leads.private + stats.leads.brand + stats.leads.sommelier : 0;

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Resumen</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="h-11 px-4 rounded border border-outline-variant text-[14px] font-semibold inline-flex items-center gap-2 hover:border-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
            Actualizar
          </button>
          <Link
            href="/admin/scanner"
            className="h-11 px-4 rounded border border-outline-variant text-[14px] font-semibold inline-flex items-center gap-2 hover:border-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">qr_code_scanner</span>
            Escáner
          </Link>
          <Link
            href="/admin/catas?nueva=1"
            className="h-11 px-4 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Nueva cata
          </Link>
        </div>
      </header>

      {loading && !stats ? (
        <div className="py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
          <span className="sr-only">Cargando…</span>
        </div>
      ) : error && !stats ? (
        <div role="alert" className="rounded-lg border border-error/40 bg-error-container/50 p-4 text-[14px] text-on-error-container">
          {error}
        </div>
      ) : stats ? (
        <>
          {!stats.persistent && (
            <div className="rounded-lg border border-tertiary/40 bg-tertiary-fixed/60 p-4 text-[14px] text-on-tertiary-fixed-variant">
              <strong>Modo de prueba:</strong> Supabase no está configurado; los datos se guardan en memoria y se pierden al reiniciar.
            </div>
          )}

          {/* Pendientes de acción */}
          {(stats.orders.inReview > 0 || newLeads > 0) && (
            <div className="flex flex-col sm:flex-row gap-3">
              {stats.orders.inReview > 0 && (
                <Link
                  href="/admin/reservas"
                  className="flex-1 flex items-center gap-3 rounded-xl border border-tertiary/40 bg-tertiary-fixed/60 px-4 min-h-[56px] text-[14px] text-on-tertiary-fixed-variant hover:border-tertiary"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">pending_actions</span>
                  <span>
                    <strong>{stats.orders.inReview}</strong> {stats.orders.inReview === 1 ? "pago por revisar" : "pagos por revisar"}
                  </span>
                  <span className="material-symbols-outlined ml-auto" aria-hidden="true">chevron_right</span>
                </Link>
              )}
              {newLeads > 0 && (
                <Link
                  href="/admin/privadas"
                  className="flex-1 flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 min-h-[56px] text-[14px] hover:border-primary-container"
                >
                  <span className="material-symbols-outlined text-primary-container" aria-hidden="true">inbox</span>
                  <span>
                    <strong>{newLeads}</strong> {newLeads === 1 ? "solicitud nueva" : "solicitudes nuevas"}
                  </span>
                  <span className="material-symbols-outlined ml-auto text-on-surface-variant" aria-hidden="true">chevron_right</span>
                </Link>
              )}
            </div>
          )}

          {/* Cifras */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Metric
              icon="payments"
              label="Ventas aprobadas"
              value={usd(stats.sales.approvedUsd)}
              hint={`${usd(stats.sales.last30DaysUsd)} en los últimos 30 días`}
            />
            <Metric
              icon="confirmation_number"
              label="Cupos vendidos"
              value={String(stats.sales.approvedSpots)}
              hint={`${stats.sales.approvedOrders} ${stats.sales.approvedOrders === 1 ? "orden aprobada" : "órdenes aprobadas"}`}
            />
            <Metric
              icon="qr_code_2"
              label="Entradas escaneadas"
              value={`${stats.tickets.checkedIn} / ${stats.tickets.issued}`}
              hint="ingresaron / emitidas"
            />
            <Metric
              icon="group"
              label="Miembros"
              value={String(stats.members.total)}
              hint={`${stats.members.last7Days} nuevos en 7 días`}
              href="/admin/miembros"
            />
            <Metric
              icon="pending_actions"
              label="Pagos por revisar"
              value={String(stats.orders.inReview)}
              href="/admin/reservas"
            />
            <Metric
              icon="hourglass_top"
              label="Apartados sin pago"
              value={String(stats.orders.pendingPayment)}
              hint="cupos retenidos 60 min"
            />
            <Metric
              icon="inbox"
              label="Solicitudes nuevas"
              value={String(newLeads)}
              hint={`${stats.leads.private} privadas · ${stats.leads.brand} marcas · ${stats.leads.sommelier} sommeliers`}
              href="/admin/privadas"
            />
            <Metric
              icon="calendar_month"
              label="Próximas catas"
              value={String(stats.upcoming.filter((t) => t.status !== "draft").length)}
              hint={`${stats.upcoming.filter((t) => t.status === "draft").length} en borrador`}
              href="/admin/catas"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Próximas catas */}
            <section className="lg:col-span-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl">Próximas catas</h2>
                <Link href="/admin/catas" className="text-[13px] font-semibold text-primary-container hover:underline">
                  Ver todas
                </Link>
              </div>
              {stats.upcoming.length === 0 ? (
                <p className="text-[14px] text-on-surface-variant">
                  No hay catas próximas.{" "}
                  <Link href="/admin/catas?nueva=1" className="font-semibold text-primary-container hover:underline">
                    Crear una cata
                  </Link>
                </p>
              ) : (
                <ul className="space-y-5">
                  {stats.upcoming.map((t) => {
                    const others = Math.max(0, t.heldSpots - t.approvedSpots);
                    const sold = t.totalSpots ? Math.min(100, (t.approvedSpots / t.totalSpots) * 100) : 0;
                    const held = t.totalSpots ? Math.min(100 - sold, (others / t.totalSpots) * 100) : 0;
                    return (
                      <li key={t.id} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-[14px]">
                          <span className="font-semibold truncate">
                            {t.title}
                            {t.status === "draft" && (
                              <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                                Borrador
                              </span>
                            )}
                          </span>
                          <span className="text-[12px] text-on-surface-variant whitespace-nowrap">
                            {t.dateDisplay} · {t.timeStart}
                          </span>
                        </div>
                        <div
                          className="flex h-2 rounded-full bg-surface-variant overflow-hidden"
                          role="img"
                          aria-label={`${t.approvedSpots} vendidos y ${others} apartados o en revisión de ${t.totalSpots} cupos`}
                        >
                          <div className="h-full bg-primary-container" style={{ width: `${sold}%` }} />
                          <div className="h-full bg-tertiary-container" style={{ width: `${Math.max(0, held)}%` }} />
                        </div>
                        <p className="text-[12px] text-on-surface-variant">
                          {t.approvedSpots} vendidos · {others} apartados/en revisión · {t.availableSpots} libres de{" "}
                          {t.totalSpots} · {usd(t.approvedUsd)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Últimas reservas */}
            <section className="lg:col-span-7 rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-5 border-b border-outline-variant">
                <h2 className="font-serif text-xl">Últimas reservas</h2>
                <Link href="/admin/reservas" className="text-[13px] font-semibold text-primary-container hover:underline">
                  Reservas y pagos
                </Link>
              </div>
              {stats.recentOrders.length === 0 ? (
                <p className="p-5 text-[14px] text-on-surface-variant">Todavía no hay reservas.</p>
              ) : (
                <ul className="divide-y divide-outline-variant">
                  {stats.recentOrders.map((o) => {
                    const st = ORDER_STATUS[o.status] ?? ORDER_STATUS.pending_payment;
                    return (
                      <li key={o.code} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 text-[14px]">
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold">{o.customerName}</span>
                          <span className="block text-[12px] text-on-surface-variant truncate">
                            {o.code} · {o.spotsCount} {o.spotsCount === 1 ? "cupo" : "cupos"} · {o.tastingTitle}
                          </span>
                        </span>
                        <span className="text-[13px] tabular-nums">{usd(o.totalUsd)}</span>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                        <span className="w-full sm:w-auto text-[12px] text-on-surface-variant">{when(o.createdAt)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Metric({ icon, label, value, hint, href }: { icon: string; label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-primary-container" aria-hidden="true">{icon}</span>
        {label}
      </p>
      <p className="font-serif text-2xl sm:text-3xl mt-2 tabular-nums break-words">{value}</p>
      {hint && <p className="text-[12px] text-on-surface-variant mt-1">{hint}</p>}
    </>
  );
  const cls = "block rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-5";
  return href ? (
    <Link href={href} className={`${cls} hover:border-primary-container transition-colors`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
