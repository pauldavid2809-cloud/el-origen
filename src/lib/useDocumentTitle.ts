"use client";

import { useEffect } from "react";
import type { Language } from "./i18n";

export const SITE_TITLE_SUFFIX = "El Origen Caracas";

/**
 * Título de la pestaña en el idioma activo: "<título> | El Origen Caracas".
 * Para páginas cliente cuyo título del servidor (metadata) solo está en español.
 * Con `title` null no cambia nada (p. ej. mientras cargan los datos).
 */
export function useDocumentTitle(lang: Language, title: { es: string; en: string } | null): void {
  const text = title ? title[lang] : null;
  useEffect(() => {
    if (text) document.title = `${text} | ${SITE_TITLE_SUFFIX}`;
  }, [text]);
}
