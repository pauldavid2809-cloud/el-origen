"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Member } from "@/lib/members";

/* Miembros registrados (Cuenta Origen): búsqueda, totales y exportación a Excel. */

type AdminMember = Member & {
  orders: number;
  approvedOrders: number;
  approvedSpots: number;
  approvedUsd: number;
};

const when = (iso: string | null) =>
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

const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** Sin acentos ni mayúsculas, para buscar "jose" y encontrar "José". */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const waLink = (phone: string) => {
  let digits = phone.replace(/\D/g, "");
  // Números venezolanos escritos en formato local (0414…) o sin el 0 (414…).
  if (digits.startsWith("0")) digits = `58${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith("4")) digits = `58${digits}`;
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
};

export default function AdminMembersPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [onlyOptIn, setOnlyOptIn] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/members", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMembers(data.members);
      setPersistent(data.persistent !== false);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "No se pudieron cargar los miembros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => {
    const term = fold(q.trim());
    const digits = q.replace(/\D/g, "");
    return members.filter((m) => {
      if (onlyOptIn && !m.marketingOptIn) return false;
      if (!term) return true;
      return (
        fold(m.fullName).includes(term) ||
        m.email.includes(term) ||
        (digits.length >= 3 && m.phone.replace(/\D/g, "").includes(digits))
      );
    });
  }, [members, q, onlyOptIn]);

  const optInCount = members.filter((m) => m.marketingOptIn).length;
  const buyers = members.filter((m) => m.approvedOrders > 0).length;
  const last30 = members.filter((m) => Date.now() - new Date(m.createdAt).getTime() < 30 * 864e5).length;

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Panel</p>
          <h1 className="font-serif text-3xl sm:text-4xl">Miembros</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">Personas registradas con su Cuenta Origen.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="h-11 px-4 rounded border border-outline-variant text-[14px] font-semibold inline-flex items-center gap-2 hover:border-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
            Actualizar
          </button>
          <a
            href="/api/admin/members/export"
            className="h-11 px-4 rounded bg-primary-container hover:bg-primary text-white text-[14px] font-semibold inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
            Exportar Excel
          </a>
        </div>
      </header>

      {!persistent && (
        <div className="rounded-lg border border-tertiary/40 bg-tertiary-fixed/60 p-4 text-[14px] text-on-tertiary-fixed-variant">
          <strong>Modo de prueba:</strong> Supabase no está configurado, los miembros se guardan en memoria y se pierden al reiniciar.
        </div>
      )}

      <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Miembros" value={members.length} />
        <Stat label="Últimos 30 días" value={last30} />
        <Stat label="Aceptan novedades" value={optInCount} />
        <Stat label="Con reservas aprobadas" value={buyers} />
      </dl>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <label htmlFor="member-search" className="sr-only">
          Buscar miembros
        </label>
        <input
          id="member-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre, correo o teléfono"
          className="h-11 rounded border border-outline-variant bg-surface-container-lowest px-3 text-[14px] sm:flex-1"
        />
        <label className="inline-flex items-center gap-2 h-11 px-3 rounded border border-outline-variant bg-surface-container-lowest text-[14px] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyOptIn}
            onChange={(e) => setOnlyOptIn(e.target.checked)}
            className="h-4 w-4 accent-primary-container"
          />
          Solo los que aceptan novedades
        </label>
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
        <div className="py-20 text-center border border-dashed border-outline-variant rounded-xl text-on-surface-variant">
          {members.length === 0 ? "Aún no hay miembros registrados." : "Ningún miembro coincide con la búsqueda."}
        </div>
      ) : (
        <>
          <p className="text-[13px] text-on-surface-variant" aria-live="polite">
            {list.length === members.length ? `${members.length} miembros` : `${list.length} de ${members.length} miembros`}
          </p>

          {/* Tabla (escritorio) */}
          <div className="hidden md:block rounded-xl border border-outline-variant bg-surface-container-lowest overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-on-surface-variant border-b border-outline-variant">
                  <th scope="col" className="px-4 py-3 font-semibold">Nombre</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Contacto</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Registro</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Último ingreso</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Reservas</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Aprobado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/70">
                {list.map((m) => (
                  <tr key={m.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{m.fullName}</p>
                      {m.marketingOptIn && <OptInBadge />}
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <ContactLinks member={m} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">{when(m.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-on-surface-variant">{when(m.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {m.orders}
                      {m.approvedOrders > 0 && <span className="block text-[12px] text-on-surface-variant">{m.approvedOrders} aprobadas</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {m.approvedUsd > 0 ? usd(m.approvedUsd) : "—"}
                      {m.approvedSpots > 0 && (
                        <span className="block text-[12px] text-on-surface-variant">
                          {m.approvedSpots} cupo{m.approvedSpots === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas (móvil) */}
          <ul className="md:hidden space-y-3">
            {list.map((m) => (
              <li key={m.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-serif text-lg">{m.fullName}</p>
                  {m.marketingOptIn && <OptInBadge />}
                </div>
                <div className="mt-2">
                  <ContactLinks member={m} />
                </div>
                <p className="mt-3 text-[13px] text-on-surface-variant">
                  Registro {when(m.createdAt)} · {m.orders} reserva{m.orders === 1 ? "" : "s"}
                  {m.approvedUsd > 0 ? ` · ${usd(m.approvedUsd)} aprobado` : ""}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{label}</dt>
      <dd className="font-serif text-3xl mt-1 tabular-nums">{value}</dd>
    </div>
  );
}

function OptInBadge() {
  return (
    <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
      Novedades
    </span>
  );
}

function ContactLinks({ member }: { member: AdminMember }) {
  const wa = waLink(member.phone);
  return (
    <div className="space-y-1 text-[14px] min-w-0">
      <a href={`mailto:${member.email}`} className="block text-primary-container hover:underline break-all">
        {member.email}
      </a>
      {wa ? (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-on-surface hover:text-primary-container">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chat</span>
          {member.phone}
        </a>
      ) : (
        <span className="text-on-surface-variant">{member.phone || "—"}</span>
      )}
    </div>
  );
}
