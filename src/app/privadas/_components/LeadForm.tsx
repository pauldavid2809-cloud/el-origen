"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Language } from "@/lib/i18n";
import { FORM_COPY } from "./copy";
import { HONEYPOT_FIELD } from "./honeypot";

/* Piezas comunes de los formularios de solicitud (privadas, alianzas y sommeliers):
   campos accesibles con error por campo, campo trampa, envío y panel de confirmación. */

export const fieldClass =
  "w-full h-12 bg-surface-container-lowest border border-outline-variant rounded px-3.5 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary-container focus:outline-none aria-[invalid=true]:border-error transition-colors";
const capsLabelClass = "block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant mb-2";
const textLabelClass = "block text-[15px] font-semibold leading-snug text-on-surface mb-2";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 h-[52px] px-7 rounded bg-primary-container hover:bg-primary text-white text-[15px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 h-[52px] px-7 rounded border border-on-surface/20 hover:border-primary-container text-on-surface hover:text-primary-container text-[14px] font-semibold transition-colors";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isPhone = (v: string) => v.replace(/\D/g, "").length >= 7;
export const isBlank = (v: string) => v.trim().length === 0;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export interface Option<V extends string = string> {
  value: V;
  label: string;
}

/* ─── Envío ─── */

interface LeadFormOptions {
  endpoint: string;
  lang: Language;
  /** Prefijo de los ids de los campos (el primer campo con error recibe el foco). */
  idPrefix: string;
}

/** Estado y envío de un formulario de solicitud. */
export function useLeadForm<K extends string>({ endpoint, lang, idPrefix }: LeadFormOptions) {
  const t = FORM_COPY[lang];
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<FieldErrors<K>>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const idFor = useCallback((key: K) => `${idPrefix}-${key}`, [idPrefix]);

  const clearError = useCallback((key: K) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /** Valida en el cliente y envía. Devuelve true si la solicitud quedó registrada. */
  const submit = async (validate: () => FieldErrors<K>, payload: Record<string, unknown>): Promise<boolean> => {
    const errs = validate();
    setErrors(errs);
    const keys = Object.keys(errs) as K[];
    if (keys.length) {
      setAlert(keys.length === 1 ? (errs[keys[0]] as string) : t.errorSummary);
      document.getElementById(idFor(keys[0]))?.focus();
      return false;
    }

    setStatus("sending");
    setAlert(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, [HONEYPOT_FIELD]: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setStatus("sent");
        return true;
      }
      setStatus("idle");
      if (res.status === 429) setAlert(t.rateLimited);
      // Los mensajes del servidor están en español; en inglés se muestra el genérico.
      else setAlert(lang === "es" && data.message ? data.message : t.generic);
    } catch {
      setStatus("idle");
      setAlert(t.network);
    }
    return false;
  };

  /** Props comunes de un campo con validación: id, idioma, error y onChange que limpia el error. */
  const bind = <V extends string>(key: K, setter: (v: V) => void) => ({
    id: idFor(key),
    lang,
    error: errors[key],
    onChange: (v: V) => {
      setter(v);
      clearError(key);
    },
  });

  const reset = () => {
    setStatus("idle");
    setErrors({});
    setAlert(null);
  };

  return { status, errors, alert, honeypot, setHoneypot, idFor, bind, clearError, submit, reset };
}

/* ─── Marco del formulario ─── */

interface LeadFormShellProps {
  lang: Language;
  onSubmit: () => void;
  alert: string | null;
  honeypot: string;
  onHoneypotChange: (v: string) => void;
  sending: boolean;
  submitLabel: string;
  submitIcon?: string;
  children: React.ReactNode;
  className?: string;
}

/** Tarjeta del formulario: aviso de error, campo trampa, botón de envío y nota de privacidad. */
export function LeadFormShell({
  lang,
  onSubmit,
  alert,
  honeypot,
  onHoneypotChange,
  sending,
  submitLabel,
  submitIcon = "send",
  children,
  className = "",
}: LeadFormShellProps) {
  const t = FORM_COPY[lang];
  return (
    <form
      noValidate
      aria-busy={sending}
      onSubmit={(e) => {
        e.preventDefault();
        if (!sending) onSubmit();
      }}
      className={`bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-10 space-y-7 ${className}`}
    >
      {alert && <FormAlert>{alert}</FormAlert>}

      {children}

      {/* Campo trampa: fuera de pantalla y fuera del orden de tabulación. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label>
          {t.honeypot}
          <input
            type="text"
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => onHoneypotChange(e.target.value)}
          />
        </label>
      </div>

      <div className="space-y-4 pt-1">
        <button type="submit" disabled={sending} className={`${primaryButtonClass} w-full h-14`}>
          {sending ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden="true">progress_activity</span>
              {t.sending}
            </>
          ) : (
            <>
              {submitLabel}
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{submitIcon}</span>
            </>
          )}
        </button>
        <p className="text-center text-[13px] text-on-surface-variant leading-relaxed">
          {t.privacyBefore}
          <Link href="/privacidad" className="underline underline-offset-2 hover:text-primary-container">
            {t.privacyLink}
          </Link>
          {t.privacyAfter}
        </p>
      </div>
    </form>
  );
}

export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-error/30 bg-error-container px-4 py-3 text-[14px] leading-relaxed text-on-error-container">
      <span className="material-symbols-outlined text-[20px] flex-shrink-0" aria-hidden="true">error</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Grupo de campos con título (p. ej. "Datos de contacto"). */
export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-6 min-w-0">
      <legend className="font-serif text-xl sm:text-2xl text-on-surface mb-5">{title}</legend>
      {children}
    </fieldset>
  );
}

/* ─── Campos ─── */

interface FieldFrameProps {
  id: string;
  label: string;
  lang: Language;
  required?: boolean;
  hint?: string;
  error?: string;
  /** Rótulo en texto normal (para preguntas largas) en lugar de versalitas. */
  longLabel?: boolean;
  children: React.ReactNode;
}

function FieldFrame({ id, label, lang, required, hint, error, longLabel, children }: FieldFrameProps) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={longLabel ? textLabelClass : capsLabelClass}>
        {label}
        {!required && <OptionalTag lang={lang} />}
      </label>
      {children}
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

function OptionalTag({ lang }: { lang: Language }) {
  return <span className="ml-1.5 normal-case tracking-normal font-normal text-on-surface-variant">({FORM_COPY[lang].optional})</span>;
}

function FieldMessages({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-on-surface-variant leading-relaxed">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] font-medium text-error">
          {error}
        </p>
      )}
    </>
  );
}

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id"> {
  id: string;
  label: string;
  lang: Language;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  longLabel?: boolean;
}

export function TextField({ id, label, lang, value, onChange, hint, error, longLabel, required, ...rest }: TextFieldProps) {
  return (
    <FieldFrame id={id} label={label} lang={lang} required={required} hint={hint} error={error} longLabel={longLabel}>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={fieldClass}
        {...rest}
      />
    </FieldFrame>
  );
}

interface TextAreaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value" | "id"> {
  id: string;
  label: string;
  lang: Language;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  longLabel?: boolean;
}

export function TextAreaField({ id, label, lang, value, onChange, hint, error, longLabel, required, rows = 4, ...rest }: TextAreaFieldProps) {
  return (
    <FieldFrame id={id} label={label} lang={lang} required={required} hint={hint} error={error} longLabel={longLabel}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${fieldClass} h-auto py-3 leading-relaxed resize-y`}
        {...rest}
      />
    </FieldFrame>
  );
}

interface SelectFieldProps<V extends string> {
  id: string;
  label: string;
  lang: Language;
  value: V | "";
  onChange: (v: V) => void;
  options: Option<V>[];
  placeholder: string;
  required?: boolean;
  hint?: string;
  error?: string;
}

export function SelectField<V extends string>({
  id,
  label,
  lang,
  value,
  onChange,
  options,
  placeholder,
  required,
  hint,
  error,
}: SelectFieldProps<V>) {
  return (
    <FieldFrame id={id} label={label} lang={lang} required={required} hint={hint} error={error}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as V)}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={`${fieldClass} appearance-none pr-11 ${value ? "" : "text-on-surface-variant/80"}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
          aria-hidden="true"
        >
          expand_more
        </span>
      </div>
    </FieldFrame>
  );
}

interface ChoiceGroupBase<V extends string> {
  id: string;
  legend: string;
  lang: Language;
  options: Option<V>[];
  required?: boolean;
  hint?: string;
  error?: string;
  /** Columnas en pantallas medianas o más grandes. */
  columns?: 2 | 3 | 4;
}

const COLS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" } as const;

function choiceClass(checked: boolean) {
  return `flex items-center gap-3 min-h-12 px-3.5 py-2.5 rounded border cursor-pointer text-[15px] leading-snug transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-container/40 ${
    checked
      ? "border-primary-container bg-primary-fixed/50 text-on-surface"
      : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary-container/60"
  }`;
}

/** Opción única (radio) presentada como botones grandes. */
export function ChoiceGroup<V extends string>({
  id,
  legend,
  lang,
  options,
  value,
  onChange,
  required,
  hint,
  error,
  columns = 3,
}: ChoiceGroupBase<V> & { value: V | ""; onChange: (v: V) => void }) {
  return (
    <fieldset className="min-w-0" aria-describedby={describedBy(id, hint, error)}>
      <legend className={capsLabelClass}>
        {legend}
        {!required && <OptionalTag lang={lang} />}
      </legend>
      <div className={`grid grid-cols-1 ${COLS[columns]} gap-2.5`}>
        {options.map((o, i) => (
          <label key={o.value} className={choiceClass(value === o.value)}>
            <input
              id={i === 0 ? id : `${id}-${i}`}
              type="radio"
              name={id}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              required={required}
              className="h-4 w-4 flex-shrink-0 accent-primary-container"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
    </fieldset>
  );
}

/** Selección múltiple (casillas) presentada como botones grandes. */
export function MultiChoiceGroup<V extends string>({
  id,
  legend,
  lang,
  options,
  value,
  onChange,
  required,
  hint,
  error,
  columns = 2,
}: ChoiceGroupBase<V> & { value: V[]; onChange: (v: V[]) => void }) {
  const toggle = (v: V, on: boolean) => onChange(on ? [...value.filter((x) => x !== v), v] : value.filter((x) => x !== v));
  return (
    <fieldset className="min-w-0" aria-describedby={describedBy(id, hint, error)}>
      <legend className={capsLabelClass}>
        {legend}
        {!required && <OptionalTag lang={lang} />}
      </legend>
      <div className={`grid grid-cols-1 ${COLS[columns]} gap-2.5`}>
        {options.map((o, i) => {
          const checked = value.includes(o.value);
          return (
            <label key={o.value} className={choiceClass(checked)}>
              <input
                id={i === 0 ? id : `${id}-${i}`}
                type="checkbox"
                value={o.value}
                checked={checked}
                onChange={(e) => toggle(o.value, e.target.checked)}
                className="h-4 w-4 flex-shrink-0 accent-primary-container"
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
    </fieldset>
  );
}

/** Casilla única con texto (p. ej. "Me gustaría enviarles una muestra…"). */
export function CheckboxField({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className={`${choiceClass(checked)} items-start py-3.5`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 flex-shrink-0 accent-primary-container"
      />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

/* ─── Confirmación ─── */

interface SuccessPanelProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/** Confirmación tras enviar; recibe el foco para que los lectores de pantalla la anuncien. */
export function SuccessPanel({ title, children, actions }: SuccessPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <div
      role="status"
      className="bg-surface-container-lowest border border-outline-variant rounded-2xl px-5 py-10 sm:p-14 text-center animate-fade-in"
    >
      <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-200">
        <span className="material-symbols-outlined text-2xl" aria-hidden="true">check_circle</span>
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="mt-5 font-serif text-3xl text-on-surface focus:outline-none text-balance">
        {title}
      </h2>
      <div className="mt-4 text-[15px] text-on-surface-variant max-w-md mx-auto leading-relaxed space-y-3">{children}</div>
      {actions && <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">{actions}</div>}
    </div>
  );
}

/** { valor: texto } → opciones en el orden en que se declararon. */
export function toOptions<V extends string>(labels: Record<V, string>): Option<V>[] {
  return (Object.keys(labels) as V[]).map((value) => ({ value, label: labels[value] }));
}
