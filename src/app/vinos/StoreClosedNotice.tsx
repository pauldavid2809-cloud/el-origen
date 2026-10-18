import React from "react";
import type { Language } from "@/lib/i18n";
import { WINES_COPY } from "./copy";

/* Aviso de tienda cerrada (Admin → Tienda de vinos → Estado). `message` es el texto del administrador;
   vacío = el texto por defecto en el idioma del visitante. `tone="dark"` es para las secciones de fondo oscuro. */
export function StoreClosedNotice({
  lang,
  message,
  tone = "light",
  className = "",
}: {
  lang: Language;
  message: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const t = WINES_COPY[lang];
  const dark = tone === "dark";
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
        dark ? "border-sun/40 bg-paper/5 text-paper" : "border-tertiary/30 bg-tertiary-fixed/40 text-on-tertiary-fixed-variant"
      } ${className}`}
    >
      <span className={`material-symbols-outlined text-[22px] flex-shrink-0 ${dark ? "text-sun" : ""}`} aria-hidden="true">
        storefront
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-[14px]">{t.closedTitle}</p>
        <p className={`mt-0.5 text-[13px] leading-relaxed break-words whitespace-pre-line ${dark ? "text-paper/85" : ""}`}>
          {message.trim() || t.closedDefault}
        </p>
      </div>
    </div>
  );
}
