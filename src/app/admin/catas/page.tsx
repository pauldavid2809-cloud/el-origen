"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { RateCurrency, Tasting } from "@/types";
import { getTeamMember } from "@/lib/team";
import { CATEGORY_LABEL, CataForm, RATE_LABEL, STATUS_LABEL } from "./CataForm";
import type { PaymentConfig } from "@/lib/settings";

interface TastingOrderStats {
  orders: number;
  approvedSpots: number;
  approvedUsd: number;
  inReviewSpots: number;
  pendingSpots: number;
}

type AdminTasting = Tasting & { heldSpots: number; stats: TastingOrderStats };

type Editor = { mode: "create" | "edit" | "duplicate"; source: AdminTasting | null };
type Filter = "current" | "draft" | "past" | "archived";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "current", label: "Próximas" },
  { id: "draft", label: "Borradores" },
  { id: "past", label: "Realizadas" },
  { id: "archived", label: "Archivadas" },
];

const STATUS_CLS: Record<Tasting["status"], string> = {
  draft: "bg-surface-container-high text-on-surface-variant",
  active: "bg-emerald-100 text-emerald-900",
  sold_out: "bg-primary-fixed text-on-primary-fixed-variant",
  archived: "bg-surface-container-high text-on-surface-variant",
};

const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** Fecha de hoy en Caracas (YYYY-MM-DD), igual que el servidor. */
const todayCaracas = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export default function AdminCatasPage() {
  const [tastings, setTastings] = useState<AdminTasting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("current");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [rates, setRates] = useState<Record<RateCurrency, number | null>>({ USD: null, EUR: null, BINANCE: null });
  const [payment, setPayment] = useState<PaymentConfig | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/catas", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setTastings(data.tastings);
    } catch (err) {
      setLoadError((err as Error).message || "No se pudieron cargar las catas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => d.success && setRates({ USD: d.USD?.rate ?? null, EUR: d.EUR?.rate ?? null, BINANCE: d.BINANCE?.rate ?? null }))
      .catch(() => undefined);
    fetch("/api/payment-config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.success && setPayment(d.config))
      .catch(() => undefined);
    // /admin/catas?nueva=1 abre directamente el formulario (enlace del dashboard).
    if (new URLSearchParams(window.location.search).get("nueva") === "1") {
      setEditor({ mode: "create", source: null });
      window.history.replaceState(null, "", "/admin/catas");
    }
  }, [load]);

  const notify = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const today = todayCaracas();
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { current: 0, draft: 0, past: 0, archived: 0 };
    tastings.forEach((t) => (c[bucket(t, today)] += 1));
    return c;
  }, [tastings, today]);
  const list = tastings.filter((t) => bucket(t, today) === filter);

  const patch = async (t: AdminTasting, body: Partial<Tasting>, message: string) => {
    setBusy(t.id);
    try {
      const res = await fetch(`/api/admin/catas/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      notify(message);
      await load();
    } catch (err) {
      notify((err as Error).message || "No se pudo actualizar la cata.", false);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (t: AdminTasting) => {
    const { orders, approvedSpots, approvedUsd } = t.stats;
    if (orders > 0) {
      const answer = prompt(
        `"${t.title}" tiene ${orders} ${orders === 1 ? "reserva" : "reservas"} (${approvedSpots} ${approvedSpots === 1 ? "cupo pagado" : "cupos pagados"}, $${approvedUsd}).\n\n` +
          "Al eliminarla se borran también esas reservas, sus entradas QR y sus comprobantes, y no se puede deshacer. " +
          "Si solo quiere ocultarla del sitio, use Archivar. Si necesita el registro, exporte antes el Excel en Reservas.\n\n" +
          "Para confirmar, escriba ELIMINAR:"
      );
      if (answer === null) return;
      if (answer.trim().toUpperCase() !== "ELIMINAR") {
        notify("No se eliminó: escriba ELIMINAR para confirmar.", false);
        return;
      }
    } else if (!confirm(`¿Eliminar "${t.title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setBusy(t.id);
    try {
      const res = await fetch(`/api/admin/catas/${t.id}${orders > 0 ? "?reservas=1" : ""}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      const n = Number(data.ordersDeleted) || 0;
      notify(n > 0 ? `Cata eliminada junto con ${n} ${n === 1 ? "reserva" : "reservas"}.` : "Cata eliminada.");
      await load();
    } catch (err) {
      notify((err as Error).message || "No se pudo eliminar la cata.", false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div
          role="status"
          className={`fixed top-5 right-5 left-5 sm:left-auto z-[60] sm:max-w-sm rounded-lg px-4 py-3 text-[14px] shadow-elevated ${
            toast.ok ? "bg-ink text-paper" : "bg-error text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Catas</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">Crea, publica y archiva las catas del sitio. Los cupos se descuentan solos con cada reserva.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: "create", source: null })}
          className="h-11 px-4 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
          Nueva cata
        </button>
      </header>

      <div className="flex gap-1.5 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0" role="tablist" aria-label="Filtrar catas">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`h-10 px-4 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-colors ${
              filter === f.id ? "bg-primary-container border-primary-container text-white" : "border-outline-variant text-on-surface-variant hover:border-primary-container"
            }`}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums opacity-80">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {loading && !tastings.length ? (
        <div className="py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
          <span className="sr-only">Cargando…</span>
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-lg border border-error/40 bg-error-container/50 p-4 text-[14px] text-on-error-container">
          {loadError}
        </div>
      ) : list.length === 0 ? (
        <div className="py-16 px-6 text-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant space-y-3">
          <p>{filter === "current" ? "No hay catas próximas publicadas." : "No hay catas en esta sección."}</p>
          {filter === "current" && (
            <button type="button" onClick={() => setEditor({ mode: "create", source: null })} className="text-[14px] font-semibold text-primary-container hover:underline">
              Crear la primera cata
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((t) => (
            <CataRow
              key={t.id}
              t={t}
              past={t.date < today}
              busy={busy === t.id}
              onEdit={() => setEditor({ mode: "edit", source: t })}
              onDuplicate={() => setEditor({ mode: "duplicate", source: t })}
              onPublish={() => patch(t, { status: "active" }, "Cata publicada.")}
              onArchive={() => patch(t, { status: "archived" }, "Cata archivada: ya no se muestra en el sitio.")}
              onRestore={() => patch(t, { status: "draft" }, "Cata restaurada como borrador.")}
              onDelete={() => remove(t)}
            />
          ))}
        </ul>
      )}

      {editor && (
        <CataForm
          key={`${editor.mode}-${editor.source?.id ?? "new"}`}
          mode={editor.mode}
          source={editor.source}
          heldSpots={editor.mode === "edit" ? editor.source?.heldSpots ?? 0 : 0}
          rates={rates}
          payment={payment}
          onClose={() => setEditor(null)}
          onSaved={async (saved, message) => {
            setEditor(null);
            notify(message);
            setFilter(saved.status === "archived" ? "archived" : saved.status === "draft" ? "draft" : saved.date < today ? "past" : "current");
            await load();
          }}
        />
      )}
    </div>
  );
}

function bucket(t: Tasting, today: string): Filter {
  if (t.status === "archived") return "archived";
  if (t.status === "draft") return "draft";
  return t.date < today ? "past" : "current";
}

interface RowProps {
  t: AdminTasting;
  past: boolean;
  busy: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

function CataRow({ t, past, busy, onEdit, onDuplicate, onPublish, onArchive, onRestore, onDelete }: RowProps) {
  const { stats } = t;
  const others = Math.max(0, t.heldSpots - stats.approvedSpots);
  const free = Math.max(0, t.totalSpots - t.heldSpots);
  const soldPct = t.totalSpots ? Math.min(100, (stats.approvedSpots / t.totalSpots) * 100) : 0;
  const heldPct = t.totalSpots ? Math.min(100 - soldPct, (others / t.totalSpots) * 100) : 0;
  const sommeliers = t.sommelierIds.map((id) => getTeamMember(id)?.name).filter(Boolean).join(", ");
  const isPublic = t.status === "active" || t.status === "sold_out";
  const actionBtn =
    "h-10 px-3 rounded border border-outline-variant text-[13px] font-semibold inline-flex items-center gap-1.5 hover:border-primary-container disabled:opacity-50";

  return (
    <li className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[176px_minmax(0,1fr)] gap-0">
        <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[150px] bg-surface-container">
          {t.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl" aria-hidden="true">image</span>
            </span>
          )}
          <span className="absolute top-2 left-2 bg-primary-container text-white text-[11px] font-semibold uppercase px-2 py-0.5 rounded">
            {t.dateDisplay}
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_CLS[t.status]}`}>
              {STATUS_LABEL[t.status]}
            </span>
            {past && t.status !== "archived" && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">Realizada</span>
            )}
            <span className="text-[12px] text-on-surface-variant">{CATEGORY_LABEL[t.category]}</span>
            {t.rateCurrency !== "USD" && <span className="text-[12px] text-on-surface-variant">· tasa {RATE_LABEL[t.rateCurrency]}</span>}
          </div>
          <div>
            <h2 className="font-serif text-xl break-words">{t.title}</h2>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              {t.dateFull} · {t.timeStart}
              {t.timeEnd && `–${t.timeEnd}`} · {t.location}
            </p>
            <p className="text-[13px] text-on-surface-variant">
              {t.priceFormatted}
              {sommeliers && <> · {sommeliers}</>}
              {t.addOns.length > 0 && <> · {t.addOns.length} {t.addOns.length === 1 ? "adicional" : "adicionales"}</>}
            </p>
          </div>

          <div className="space-y-1.5">
            <div
              className="flex h-2 rounded-full bg-surface-variant overflow-hidden"
              role="img"
              aria-label={`${stats.approvedSpots} vendidos, ${others} apartados o en revisión, ${free} libres de ${t.totalSpots}`}
            >
              <div className="h-full bg-primary-container" style={{ width: `${soldPct}%` }} />
              <div className="h-full bg-tertiary-container" style={{ width: `${heldPct}%` }} />
            </div>
            <p className="text-[13px] text-on-surface-variant">
              <strong className="text-on-surface">{stats.approvedSpots} vendidos</strong>
              {stats.inReviewSpots > 0 && <> · {stats.inReviewSpots} en revisión</>}
              {stats.pendingSpots > 0 && <> · {stats.pendingSpots} apartados</>} · {free} libres de {t.totalSpots}
              {stats.approvedUsd > 0 && <> · {usd(stats.approvedUsd)} en ventas</>}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-outline-variant bg-surface-container-low/60 px-4 sm:px-5 py-3">
        <button type="button" disabled={busy} onClick={onEdit} className={actionBtn}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
          Editar
        </button>
        <button type="button" disabled={busy} onClick={onDuplicate} className={actionBtn}>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
          Duplicar
        </button>
        {t.status === "draft" && (
          <button type="button" disabled={busy} onClick={onPublish} className={`${actionBtn} border-emerald-700 text-emerald-800`}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">publish</span>
            Publicar
          </button>
        )}
        {isPublic && (
          <a href={`/catas/${t.slug || t.id}`} target="_blank" rel="noopener noreferrer" className={actionBtn}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
            Ver en el sitio
          </a>
        )}
        {t.status === "archived" ? (
          <button type="button" disabled={busy} onClick={onRestore} className={actionBtn}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">unarchive</span>
            Restaurar
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => confirm(`¿Archivar "${t.title}"? Se oculta del sitio y conserva sus reservas.`) && onArchive()}
            className={actionBtn}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">archive</span>
            Archivar
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          title={stats.orders > 0 ? `Elimina también sus ${stats.orders} ${stats.orders === 1 ? "reserva" : "reservas"}` : undefined}
          className="h-10 px-3 rounded text-[13px] font-semibold text-on-surface-variant hover:text-error ml-auto inline-flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
          Eliminar
          {stats.orders > 0 && (
            <span className="font-normal">
              · {stats.orders} {stats.orders === 1 ? "orden" : "órdenes"}
            </span>
          )}
        </button>
      </div>
    </li>
  );
}
