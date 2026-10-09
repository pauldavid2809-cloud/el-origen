"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BrandLead, LeadStatus, LeadType, PrivateInquiry, SommelierApplication, WaitlistEntry } from "@/lib/leads";
import { PRIVADAS_COPY } from "@/app/privadas/copy";
import { ALIANZAS_COPY } from "@/app/alianzas/copy";
import { SOMMELIERS_COPY } from "@/app/sommeliers/copy";
import { WAITLIST_COPY } from "@/app/lista-de-espera/copy";
import { instagramUrl } from "@/lib/team";

/* Bandeja de solicitudes de los formularios públicos: Privadas, Marcas, Sommeliers y Lista de espera. */

type AnyLead = PrivateInquiry | BrandLead | SommelierApplication | WaitlistEntry;

const TABS: { type: LeadType; slug: string; label: string; icon: string; empty: string }[] = [
  { type: "private", slug: "privadas", label: "Privadas", icon: "celebration", empty: "Aún no hay solicitudes de propuestas privadas." },
  { type: "brand", slug: "marcas", label: "Marcas", icon: "handshake", empty: "Aún no hay solicitudes de marcas aliadas." },
  { type: "sommelier", slug: "sommeliers", label: "Sommeliers", icon: "wine_bar", empty: "Aún no hay postulaciones de sommeliers." },
  { type: "waitlist", slug: "espera", label: "En espera", icon: "hourglass_top", empty: "Aún no hay nadie en la lista de espera." },
];

const NEXT_TASTING_LABEL = "La próxima cata que haya";

const STATUS: Record<LeadStatus, { label: string; plural: string; badge: string }> = {
  new: { label: "Nueva", plural: "Nuevas", badge: "bg-primary-fixed text-on-primary-fixed-variant" },
  contacted: { label: "Contactada", plural: "Contactadas", badge: "bg-tertiary-fixed text-on-tertiary-fixed-variant" },
  closed: { label: "Cerrada", plural: "Cerradas", badge: "bg-emerald-100 text-emerald-900" },
  archived: { label: "Archivada", plural: "Archivadas", badge: "bg-surface-container-high text-on-surface-variant" },
};
const STATUS_ORDER: LeadStatus[] = ["new", "contacted", "closed", "archived"];

/* Textos de las opciones de cada formulario (los mismos que ve el público). */
const PRIVATE = PRIVADAS_COPY.es;
const BRAND = ALIANZAS_COPY.es;
const SOMMELIER = SOMMELIERS_COPY.es;
const WAITLIST = WAITLIST_COPY.es;

const when = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Caracas",
      })
    : "—";

/** Sin acentos ni mayúsculas, para buscar "jose" y encontrar "José". */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function waLink(phone: string, text: string): string | null {
  let digits = phone.replace(/\D/g, "");
  // Números venezolanos escritos en formato local (0414…) o sin el 0 (414…).
  if (digits.startsWith("0")) digits = `58${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("4")) digits = `58${digits}`;
  return digits.length >= 10 ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** Datos comunes para mostrar cualquier solicitud. */
function summary(type: LeadType, lead: AnyLead) {
  if (type === "private") {
    const l = lead as PrivateInquiry;
    return {
      title: l.fullName,
      subtitle: l.company || null,
      phone: l.phone,
      email: l.email,
      greeting: `Hola ${firstName(l.fullName)}, te escribimos de El Origen sobre tu solicitud de propuesta privada.`,
      search: [l.fullName, l.company, l.phone, l.email ?? "", l.interest].join(" "),
    };
  }
  if (type === "brand") {
    const l = lead as BrandLead;
    return {
      title: l.brand,
      subtitle: l.company,
      phone: l.phone,
      email: l.email,
      greeting: `Hola ${firstName(l.contactName)}, te escribimos de El Origen sobre la alianza con ${l.brand}.`,
      search: [l.brand, l.company, l.contactName, l.phone, l.email].join(" "),
    };
  }
  if (type === "waitlist") {
    const l = lead as WaitlistEntry;
    return {
      title: l.fullName,
      subtitle: `${l.tastingTitle ?? NEXT_TASTING_LABEL} · ${l.spots} ${l.spots === 1 ? "persona" : "personas"}`,
      phone: l.phone,
      email: l.email,
      greeting: `Hola ${firstName(l.fullName)}, te escribimos de El Origen por tu lugar en la lista de espera${
        l.tastingTitle ? ` de «${l.tastingTitle}»` : ""
      }.`,
      search: [l.fullName, l.phone, l.email ?? "", l.tastingTitle ?? NEXT_TASTING_LABEL].join(" "),
    };
  }
  const l = lead as SommelierApplication;
  return {
    title: l.fullName,
    subtitle: l.certification,
    phone: l.phone,
    email: l.email,
    greeting: `Hola ${firstName(l.fullName)}, te escribimos de El Origen sobre tu postulación a nuestra red de sommeliers.`,
    search: [l.fullName, l.certification, l.phone, l.email, l.instagram ?? ""].join(" "),
  };
}

export default function AdminSolicitudesPage() {
  const [tab, setTab] = useState<LeadType>("private");
  const [leads, setLeads] = useState<AnyLead[]>([]);
  const [newCounts, setNewCounts] = useState<Record<LeadType, number> | null>(null);
  const [persistent, setPersistent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "open" | "all">("open");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Evita que una respuesta de una pestaña anterior pise la actual. */
  const requestRef = useRef(0);

  // Pestaña inicial desde ?tab= (se lee tras montar para no necesitar Suspense).
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("tab");
    const found = TABS.find((t) => t.slug === slug);
    if (found) setTab(found.type);
  }, []);

  const load = useCallback(async (type: LeadType) => {
    const request = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/leads?type=${type}`, { cache: "no-store" });
      const data = await res.json();
      if (request !== requestRef.current) return;
      if (!data.success) throw new Error(data.message);
      setLeads(data.leads);
      setNewCounts(data.newCounts);
      setPersistent(data.persistent !== false);
    } catch (err) {
      if (request !== requestRef.current) return;
      setLeads([]);
      setError(err instanceof Error && err.message ? err.message : "No se pudieron cargar las solicitudes.");
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const selectTab = (type: LeadType) => {
    if (type === tab) return;
    setLeads([]);
    setTab(type);
    const slug = TABS.find((t) => t.type === type)?.slug;
    window.history.replaceState(null, "", `${window.location.pathname}?tab=${slug}`);
  };

  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = TABS[(index + delta + TABS.length) % TABS.length];
    selectTab(next.type);
    document.getElementById(`tab-${next.slug}`)?.focus();
  };

  const changeStatus = async (lead: AnyLead, status: LeadStatus) => {
    const previous = lead.status;
    if (previous === status) return;
    setBusyId(lead.id);
    setError("");
    setLeads((list) => list.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    try {
      const res = await fetch(`/api/admin/leads/${tab}/${encodeURIComponent(lead.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setNewCounts((c) => (c ? { ...c, [tab]: c[tab] + (status === "new" ? 1 : 0) - (previous === "new" ? 1 : 0) } : c));
    } catch (err) {
      setLeads((list) => list.map((l) => (l.id === lead.id ? { ...l, status: previous } : l)));
      setError(err instanceof Error && err.message ? err.message : "No se pudo actualizar el estado.");
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, contacted: 0, closed: 0, archived: 0 };
    for (const l of leads) c[l.status] += 1;
    return c;
  }, [leads]);

  const list = useMemo(() => {
    const term = fold(q.trim());
    return leads.filter((l) => {
      if (statusFilter === "open" && l.status !== "new" && l.status !== "contacted") return false;
      if (statusFilter !== "open" && statusFilter !== "all" && l.status !== statusFilter) return false;
      return !term || fold(summary(tab, l).search).includes(term);
    });
  }, [leads, q, statusFilter, tab]);

  const current = TABS.find((t) => t.type === tab) ?? TABS[0];

  const filters: { value: LeadStatus | "open" | "all"; label: string; count: number }[] = [
    { value: "open", label: "Abiertas", count: counts.new + counts.contacted },
    ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS[s].plural, count: counts[s] })),
    { value: "all", label: "Todas", count: leads.length },
  ];

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Solicitudes</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Propuestas privadas, marcas aliadas, postulaciones de sommeliers y lista de espera recibidas desde el sitio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(tab)}
          className="self-start md:self-auto h-11 px-4 rounded border border-outline-variant text-[14px] font-semibold inline-flex items-center gap-2 hover:border-primary-container"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
          Actualizar
        </button>
      </header>

      {!persistent && (
        <div className="rounded-lg border border-tertiary/40 bg-tertiary-fixed/60 p-4 text-[14px] text-on-tertiary-fixed-variant">
          <strong>Modo de prueba:</strong> Supabase no está configurado, las solicitudes se guardan en memoria y se pierden al reiniciar.
        </div>
      )}

      {/* Pestañas */}
      <div role="tablist" aria-label="Tipo de solicitud" className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-surface-container-low border border-outline-variant">
        {TABS.map((t, i) => {
          const active = t.type === tab;
          const pending = newCounts?.[t.type] ?? 0;
          return (
            <button
              key={t.type}
              id={`tab-${t.slug}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="solicitudes-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => selectTab(t.type)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`min-h-11 px-2 sm:px-4 rounded-lg text-[13px] sm:text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
                active ? "bg-primary-container text-white shadow-sm" : "text-on-surface-variant hover:text-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-[18px] hidden sm:inline" aria-hidden="true">{t.icon}</span>
              {t.label}
              {pending > 0 && (
                <span
                  className={`min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center tabular-nums ${
                    active ? "bg-white text-primary-container" : "bg-primary-container text-white"
                  }`}
                >
                  {pending}
                  <span className="sr-only"> {pending === 1 ? "nueva" : "nuevas"}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div id="solicitudes-panel" role="tabpanel" aria-labelledby={`tab-${current.slug}`} className="space-y-5">
        {tab === "waitlist" && <ShareLink path="/lista-de-espera" />}

        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={statusFilter === f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`h-10 px-3 rounded-full border text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  statusFilter === f.value
                    ? "border-primary-container bg-primary-container text-white"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary-container"
                }`}
              >
                {f.label}
                <span className="tabular-nums opacity-80">{f.count}</span>
              </button>
            ))}
          </div>
          <label htmlFor="lead-search" className="sr-only">
            Buscar solicitudes
          </label>
          <input
            id="lead-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, empresa, teléfono o correo"
            className="h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] lg:ml-auto lg:w-80 focus:border-primary-container focus:outline-none"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-error/30 bg-error-container p-4 text-[14px] text-on-error-container">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-on-surface-variant" role="status">
            <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
            <span className="sr-only">Cargando…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 px-6 text-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant">
            {leads.length === 0 ? current.empty : "Ninguna solicitud coincide con el filtro."}
          </div>
        ) : (
          <ul className="space-y-4">
            {list.map((lead) => (
              <LeadCard
                key={lead.id}
                type={tab}
                lead={lead}
                busy={busyId === lead.id}
                onStatusChange={(s) => changeStatus(lead, s)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─── Tarjeta de solicitud ─── */

function LeadCard({
  type,
  lead,
  busy,
  onStatusChange,
}: {
  type: LeadType;
  lead: AnyLead;
  busy: boolean;
  onStatusChange: (s: LeadStatus) => void;
}) {
  const s = summary(type, lead);
  const wa = waLink(s.phone, s.greeting);
  const statusId = `status-${lead.id}`;

  return (
    <li
      className={`rounded-xl border bg-surface-container-lowest p-4 sm:p-6 ${
        lead.status === "new" ? "border-primary-container/40" : "border-outline-variant"
      } ${lead.status === "archived" ? "opacity-75" : ""}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl leading-tight text-on-surface break-words">{s.title}</h2>
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS[lead.status].badge}`}>
              {STATUS[lead.status].label}
            </span>
          </div>
          {s.subtitle && <p className="text-[14px] text-on-surface-variant mt-1 break-words">{s.subtitle}</p>}
          <p className="text-[12px] text-on-surface-variant mt-1">Recibida el {when(lead.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <label htmlFor={statusId} className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
            Estado
          </label>
          <select
            id={statusId}
            value={lead.status}
            disabled={busy}
            onChange={(e) => onStatusChange(e.target.value as LeadStatus)}
            className="h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] font-semibold focus:border-primary-container focus:outline-none disabled:opacity-60"
          >
            {STATUS_ORDER.map((st) => (
              <option key={st} value={st}>
                {STATUS[st].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <LeadDetails type={type} lead={lead} />

      <div className="mt-4 pt-4 border-t border-outline-variant flex flex-col sm:flex-row sm:flex-wrap gap-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
            WhatsApp · {s.phone}
          </a>
        ) : (
          <span className="h-11 px-4 inline-flex items-center text-[14px] text-on-surface-variant">Teléfono: {s.phone || "—"}</span>
        )}
        {s.email && (
          <a
            href={`mailto:${s.email}`}
            className="h-11 px-4 rounded border border-outline-variant hover:border-primary-container text-[14px] font-semibold inline-flex items-center justify-center gap-2 min-w-0"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">mail</span>
            <span className="truncate">{s.email}</span>
          </a>
        )}
        {lead.status === "new" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusChange("contacted")}
            className="h-11 px-4 rounded border border-outline-variant hover:border-primary-container text-[14px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60 sm:ml-auto"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">done</span>
            Marcar como contactada
          </button>
        )}
      </div>
    </li>
  );
}

/** Enlace público de la lista de espera, listo para copiar y pegar en historias de Instagram. */
function ShareLink({ path }: { path: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(`${window.location.origin}${path}`), [path]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copia el enlace:", url);
    }
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-on-surface">Enlace para compartir</p>
        <p className="text-[13px] text-on-surface-variant">
          Ponlo en tus historias de Instagram o envíalo a quien se quedó sin cupo. Quien se anote aparece aquí.
        </p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[14px] text-primary-container font-semibold break-all hover:underline">
          {url}
        </a>
      </div>
      <button
        type="button"
        onClick={copy}
        className="h-11 px-4 rounded border border-outline-variant bg-surface-container-lowest hover:border-primary-container text-[14px] font-semibold inline-flex items-center justify-center gap-2 sm:flex-shrink-0"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{copied ? "check" : "content_copy"}</span>
        <span aria-live="polite">{copied ? "Copiado" : "Copiar enlace"}</span>
      </button>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{label}</dt>
      <dd className="mt-0.5 text-[14px] text-on-surface break-words">{children}</dd>
    </div>
  );
}

function Message({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <div className="mt-4 rounded-lg bg-surface-container-low border border-outline-variant p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
      <p className="mt-1 text-[14px] text-on-surface leading-relaxed whitespace-pre-line break-words">{text}</p>
    </div>
  );
}

function LeadDetails({ type, lead }: { type: LeadType; lead: AnyLead }) {
  const grid = "mt-4 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3";

  if (type === "private") {
    const l = lead as PrivateInquiry;
    return (
      <>
        <dl className={grid}>
          <Detail label="Tipo de evento">{PRIVATE.eventTypes[l.eventType] ?? l.eventType}</Detail>
          <Detail label="Invitados">{PRIVATE.guestRanges[l.guests] ?? l.guests}</Detail>
          <Detail label="Restaurante">{l.restaurant ? PRIVATE.restaurants[l.restaurant] ?? l.restaurant : "Sin preferencia"}</Detail>
          <Detail label="Licor o categoría">{l.interest || "—"}</Detail>
        </dl>
        <Message label="Detalles adicionales" text={l.message} />
      </>
    );
  }

  if (type === "brand") {
    const l = lead as BrandLead;
    return (
      <>
        <dl className={grid}>
          <Detail label="Contacto">
            {l.contactName}
            {l.contactRole ? ` · ${l.contactRole}` : ""}
          </Detail>
          <Detail label="Objetivo">{BRAND.objectives[l.objective] ?? l.objective}</Detail>
          <Detail label="Muestras">{l.wantsToSendSamples ? "Quiere enviar muestras" : "No"}</Detail>
        </dl>
        <Message label="Mensaje" text={l.message} />
      </>
    );
  }

  if (type === "waitlist") {
    const l = lead as WaitlistEntry;
    return (
      <>
        <dl className={grid}>
          <Detail label="Cata">
            {l.tastingId && l.tastingTitle ? (
              <a href={`/catas/${encodeURIComponent(l.tastingId)}`} target="_blank" rel="noopener noreferrer" className="text-primary-container hover:underline">
                {l.tastingTitle}
              </a>
            ) : (
              l.tastingTitle ?? NEXT_TASTING_LABEL
            )}
          </Detail>
          <Detail label="Personas">{l.spots}</Detail>
          <Detail label="Experiencias que le interesan">
            {l.experiences.map((x) => WAITLIST.experienceOptions[x] ?? x).join(" · ") || "—"}
          </Detail>
          <Detail label="Días y horarios">{l.schedule ? WAITLIST.scheduleOptions[l.schedule] ?? l.schedule : "—"}</Detail>
          <Detail label="Nivel en el mundo del vino">{l.wineLevel ? WAITLIST.wineLevelOptions[l.wineLevel] ?? l.wineLevel : "—"}</Detail>
        </dl>
        <Message label="Fecha o celebración especial" text={l.specialOccasion} />
        <Message label="Comentario" text={l.message} />
      </>
    );
  }

  const l = lead as SommelierApplication;
  return (
    <>
      <dl className={grid}>
        <Detail label="Experiencia">
          {l.yearsExperience} año{l.yearsExperience === 1 ? "" : "s"}
        </Detail>
        <Detail label="Especialidades">
          {l.specialties.map((sp) => SOMMELIER.specialtyOptions[sp] ?? sp).join(", ") || "—"}
        </Detail>
        <Detail label="Instagram">
          {l.instagram ? (
            <a
              href={instagramUrl(l.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-container hover:underline"
            >
              {l.instagram}
            </a>
          ) : (
            "—"
          )}
        </Detail>
        <Detail label="CV / LinkedIn">
          {l.cvUrl ? (
            <a href={l.cvUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-container hover:underline break-all">
              Abrir enlace
            </a>
          ) : (
            "—"
          )}
        </Detail>
      </dl>
      <Message label="Experiencia más memorable" text={l.memorableExperience} />
    </>
  );
}
