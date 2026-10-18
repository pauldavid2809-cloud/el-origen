import React from "react";
import Link from "next/link";
import type { Language } from "@/lib/i18n";
import { WINES_COPY } from "./copy";

/* Enlace «Carrito (N)» a /vinos/carrito. Presentacional: el número de botellas lo trae quien lo usa (useWineCart). */
export function CartLink({ lang, count, tone = "light" }: { lang: Language; count: number; tone?: "light" | "dark" }) {
  const t = WINES_COPY[lang];
  return (
    <Link
      href="/vinos/carrito"
      aria-label={t.cartAria(count)}
      className={`inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border text-[13px] font-semibold transition-colors ${
        tone === "dark"
          ? "border-paper/35 text-paper hover:border-sun hover:text-sun"
          : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary-container hover:text-primary-container"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">shopping_bag</span>
      <span>
        {t.cartLabel}
        {count > 0 && <span className="tabular-nums"> ({count})</span>}
      </span>
    </Link>
  );
}
