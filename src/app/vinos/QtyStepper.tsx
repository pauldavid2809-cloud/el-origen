"use client";

import React from "react";

/* Selector de cantidad (− n +) del detalle del vino y del carrito. Botones de 44 px para el dedo.
   `tone="dark"` es para las secciones de fondo oscuro (la botella sobre fondo tinta). */
export function QtyStepper({
  value,
  min = 1,
  max,
  onChange,
  lessLabel,
  moreLabel,
  labelledBy,
  tone = "light",
  className = "",
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  lessLabel: string;
  moreLabel: string;
  /** Id del elemento que nombra al grupo (p. ej. «Cantidad»). */
  labelledBy: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const btn =
    tone === "dark"
      ? "border-paper/35 bg-paper/5 text-paper hover:border-sun hover:text-sun disabled:hover:border-paper/35 disabled:hover:text-paper"
      : "border-outline-variant bg-surface-container-lowest text-primary-container hover:border-primary-container disabled:hover:border-outline-variant";
  const base = "w-11 h-11 rounded-full border flex items-center justify-center disabled:opacity-35 transition-colors";
  return (
    <div className={`flex items-center gap-2 flex-shrink-0 ${className}`} role="group" aria-labelledby={labelledBy}>
      <button type="button" className={`${base} ${btn}`} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={lessLabel}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">remove</span>
      </button>
      <span className={`w-8 text-center font-serif text-lg tabular-nums ${tone === "dark" ? "text-paper" : "text-on-surface"}`} aria-live="polite">
        {value}
      </span>
      <button type="button" className={`${base} ${btn}`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={moreLabel}>
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
      </button>
    </div>
  );
}
