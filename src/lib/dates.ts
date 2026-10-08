import type { Language } from "./i18n";

/**
 * Fecha de una cata en el idioma de la interfaz.
 * "2026-10-24" → "Saturday, October 24, 2026" (en). En español (o si no hay fecha ISO válida)
 * devuelve `fallback`: el texto en español que ya guarda el servidor (`dateFull` o `tastingDate` de la orden).
 */
export function formatTastingDate(date: string | null | undefined, lang: Language, fallback: string): string {
  if (lang === "es" || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return fallback;
  const d = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? fallback
    : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}
