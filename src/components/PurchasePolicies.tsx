import React from "react";
import type { Language } from "@/lib/i18n";
import { PURCHASE_POLICIES } from "@/lib/policies";

/* Políticas de compra (texto literal del cliente): visibles antes de pagar y al entregar la entrada. */

const HEADING: Record<Language, { eyebrow: string; title: string }> = {
  es: { eyebrow: "Antes de pagar", title: "Políticas de la experiencia" },
  en: { eyebrow: "Before you pay", title: "Experience policies" },
};

const ICONS = ["event_seat", "payments", "event_busy", "schedule"];

interface PurchasePoliciesProps {
  lang: Language;
  /** Texto pequeño sobre el título; por defecto "Antes de pagar". Use `null` para ocultarlo. */
  eyebrow?: string | null;
  /** Versión sin borde ni fondo, para insertarla dentro de otra tarjeta. */
  bare?: boolean;
  className?: string;
}

export function PurchasePolicies({ lang, eyebrow, bare = false, className = "" }: PurchasePoliciesProps) {
  const heading = HEADING[lang];
  const label = eyebrow === undefined ? heading.eyebrow : eyebrow;

  return (
    <section
      aria-label={heading.title}
      className={`${bare ? "" : "rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-6"} ${className}`}
    >
      {label && <p className="eyebrow mb-2">{label}</p>}
      <h2 className="font-serif text-xl text-on-surface">
        {heading.title}
      </h2>
      <ol className="mt-4 space-y-4">
        {PURCHASE_POLICIES[lang].map((p, i) => (
          <li key={p.title} className="flex gap-3">
            <span
              className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-[18px]">{ICONS[i] ?? "info"}</span>
            </span>
            <div className="text-[13.5px] leading-relaxed">
              <p className="font-semibold text-on-surface">
                {i + 1}. {p.title}
              </p>
              <p className="text-on-surface-variant mt-0.5">{p.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
