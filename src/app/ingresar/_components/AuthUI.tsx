"use client";

import React, { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AvilaRidge, Logo } from "@/components/Brand";
import type { Language } from "@/lib/i18n";

/* Piezas comunes de las páginas de la Cuenta Origen (registro, ingreso, recuperar, restablecer, mi cuenta). */

export const fieldClass =
  "w-full h-12 bg-surface-container-lowest border border-outline-variant rounded px-3.5 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none aria-[invalid=true]:border-error";
export const labelClass = "block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2";
export const primaryButtonClass =
  "w-full inline-flex items-center justify-center gap-2 h-[52px] px-6 rounded bg-primary-container hover:bg-primary text-white text-[15px] font-semibold tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 px-5 rounded border border-outline-variant text-[14px] font-semibold text-on-surface hover:border-primary-container hover:text-primary-container transition-colors";

const SHELL_COPY = {
  es: { motto: "El Origen, allí el inicio de todo", account: "Cuenta Origen" },
  en: { motto: "El Origen, where it all begins", account: "Origen Account" },
} satisfies Record<Language, unknown>;

/** Solo rutas internas (evita redirecciones abiertas con ?next=). */
export function safeNext(next: string | null | undefined, fallback = "/mi-cuenta"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/* Los parámetros de la URL se leen tras montar (sin useSearchParams) para que el formulario
   se renderice en el servidor sin necesitar un límite de Suspense. */

/** Valor de un parámetro de la URL actual, disponible después del primer render. */
export function useQueryParam(name: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return value;
}

/** Con la sesión ya iniciada, ingresar o registrarse no tiene sentido: se pasa directo al destino (?next=). */
export function useRedirectIfSignedIn(): void {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/members/me?orders=0", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.member) router.replace(safeNext(new URLSearchParams(window.location.search).get("next")));
      })
      .catch(() => {});
  }, [router]);
}

interface AuthShellProps {
  lang: Language;
  onLanguageChange: (l: Language) => void;
  children: React.ReactNode;
  /** Contenido del panel lateral (solo escritorio): beneficios, aviso, etc. */
  aside?: React.ReactNode;
  /** Ancho del área principal: "narrow" para formularios, "wide" para mi cuenta. */
  width?: "narrow" | "wide";
}

/** Marco de página: barra, contenido y pie. En formularios agrega un panel de marca en escritorio. */
export function AuthShell({ lang, onLanguageChange, children, aside, width = "narrow" }: AuthShellProps) {
  const t = SHELL_COPY[lang];
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      <Navbar currentLang={lang} onLanguageChange={onLanguageChange} />
      <main className="flex-grow w-full px-5 sm:px-8 lg:px-12 pt-8 sm:pt-14 pb-20 sm:pb-24">
        {width === "wide" ? (
          <div className="max-w-[1100px] mx-auto">{children}</div>
        ) : (
          <div className="max-w-[1040px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-10 lg:gap-14 items-start">
            <aside className="hidden lg:flex flex-col justify-between min-h-[520px] rounded-2xl bg-primary-container text-paper overflow-hidden relative">
              <div className="p-10 relative z-10">
                <Logo tone="white" variant="full" className="w-36" />
                <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.22em] text-sun">{t.account}</p>
                <p className="font-serif text-[2rem] leading-tight mt-3 text-balance">{t.motto}</p>
                {aside && <div className="mt-8 text-[15px] leading-relaxed text-paper/85">{aside}</div>}
              </div>
              <div className="text-paper/30">
                <AvilaRidge strokeWidth={1.5} showBirds className="h-24" />
              </div>
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        )}
      </main>
      <Footer currentLang={lang} />
    </div>
  );
}

/** Encabezado de cada formulario. */
export function AuthHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <p className="eyebrow flex items-center gap-3 mb-4">
        <span className="h-px w-8 bg-primary-container/40" aria-hidden="true" />
        {eyebrow}
      </p>
      <h1 className="font-serif text-[2.2rem] sm:text-5xl leading-[1.08] text-on-surface text-balance">{title}</h1>
      {subtitle && <p className="mt-4 text-[15px] sm:text-base text-on-surface-variant leading-relaxed text-pretty">{subtitle}</p>}
    </header>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-8 ${className}`}>{children}</section>;
}

/** Mensaje de error del formulario (anunciado por lectores de pantalla). */
export function FormAlert({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "info" | "success" }) {
  const styles = {
    error: "border-error/30 bg-error-container text-on-error-container",
    info: "border-tertiary/40 bg-tertiary-fixed/60 text-on-tertiary-fixed-variant",
    success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  }[tone];
  const icon = { error: "error", info: "info", success: "check_circle" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-lg border px-4 py-3 text-[14px] leading-relaxed ${styles}`}>
      <span className="material-symbols-outlined text-[20px] flex-shrink-0" aria-hidden="true">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Spinner() {
  return <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden="true">progress_activity</span>;
}

const PASSWORD_COPY = {
  es: { show: "Mostrar contraseña", hide: "Ocultar contraseña" },
  en: { show: "Show password", hide: "Hide password" },
} satisfies Record<Language, unknown>;

interface PasswordFieldProps {
  lang: Language;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  /** Texto de ayuda bajo el campo (p. ej. "Mínimo 8 caracteres"). */
  hint?: string;
  minLength?: number;
  invalid?: boolean;
  autoFocus?: boolean;
}

/** Contraseña con botón mostrar/ocultar (objetivo táctil de 44 px). */
export function PasswordField({ lang, label, value, onChange, autoComplete, hint, minLength, invalid, autoFocus }: PasswordFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);
  const t = PASSWORD_COPY[lang];
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={200}
          required
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          className={`${fieldClass} pr-14`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t.hide : t.show}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded text-on-surface-variant hover:text-primary-container"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            {visible ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-[13px] text-on-surface-variant">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Campo de texto con etiqueta. */
export function TextField({
  label,
  hint,
  invalid,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; invalid?: boolean }) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        {...input}
        aria-invalid={invalid || undefined}
        aria-describedby={hint ? hintId : undefined}
        className={fieldClass}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-[13px] text-on-surface-variant">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Anuncia a los demás componentes (menú de cuenta) que la sesión cambió. */
export { notifyMemberChange } from "@/components/AccountMenu";
