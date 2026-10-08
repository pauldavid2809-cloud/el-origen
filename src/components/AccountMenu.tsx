"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Language } from "@/lib/i18n";

/* Acceso a la Cuenta Origen para el Navbar: "Ingresar" sin sesión, "Mi cuenta" con sesión. */

interface MemberSummary {
  fullName: string;
}

const MEMBER_CHANGE_EVENT = "eo:member-change";

/* Una sola consulta por carga de página, compartida por todas las instancias (barra y menú móvil). */
let memberRequest: Promise<MemberSummary | null> | null = null;

function fetchMember(): Promise<MemberSummary | null> {
  memberRequest ??= fetch("/api/members/me?orders=0", { cache: "no-store", credentials: "same-origin" })
    .then((r) => r.json())
    .then((d) => (d?.success && d.member ? { fullName: String(d.member.fullName ?? "") } : null))
    .catch(() => {
      memberRequest = null;
      return null;
    });
  return memberRequest;
}

/** Avisar al menú de cuenta que la sesión cambió (tras ingresar, registrarse o cerrar sesión). */
export function notifyMemberChange(): void {
  memberRequest = null;
  window.dispatchEvent(new Event(MEMBER_CHANGE_EVENT));
}

const COPY = {
  es: { login: "Ingresar", account: "Mi cuenta", loginAria: "Ingresar a tu Cuenta Origen", accountAria: (n: string) => `Mi cuenta (${n})` },
  en: { login: "Sign in", account: "My account", loginAria: "Sign in to your Origen Account", accountAria: (n: string) => `My account (${n})` },
} satisfies Record<Language, unknown>;

interface AccountMenuProps {
  lang: Language;
  /** "bar": barra superior (clara). "menu": menú móvil a pantalla completa (fondo vino). */
  variant?: "bar" | "menu";
  /** Para cerrar el menú móvil al navegar. */
  onNavigate?: () => void;
  className?: string;
}

export function AccountMenu({ lang, variant = "bar", onNavigate, className = "" }: AccountMenuProps) {
  const t = COPY[lang];
  const [member, setMember] = useState<MemberSummary | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => fetchMember().then((m) => alive && setMember(m));
    load();
    window.addEventListener(MEMBER_CHANGE_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(MEMBER_CHANGE_EVENT, load);
    };
  }, []);

  const firstName = member?.fullName.split(" ")[0] ?? "";
  const href = member ? "/mi-cuenta" : "/ingresar";
  const label = member ? t.account : t.login;
  const aria = member ? t.accountAria(member.fullName) : t.loginAria;

  if (variant === "menu") {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        aria-label={aria}
        className={`w-full flex items-center justify-center gap-2 h-14 border border-paper/40 text-paper text-[14px] font-semibold rounded hover:bg-paper/10 transition-colors ${className}`}
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          {member ? "account_circle" : "login"}
        </span>
        {member && firstName ? `${label} · ${firstName}` : label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label={aria}
      title={label}
      className={`inline-flex items-center justify-center gap-1.5 h-11 min-w-[44px] px-2.5 rounded text-[13px] font-semibold text-on-surface/80 hover:text-primary-container hover:bg-primary-container/5 transition-colors ${className}`}
    >
      <span
        className="material-symbols-outlined text-[22px]"
        style={{ fontVariationSettings: member ? "'FILL' 1" : "'FILL' 0" }}
        aria-hidden="true"
      >
        account_circle
      </span>
      <span className="hidden md:inline max-w-[9rem] truncate">{member && firstName ? firstName : label}</span>
    </Link>
  );
}
