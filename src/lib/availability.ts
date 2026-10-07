import "server-only";
import { getCata, listCatas, type ListCatasOptions } from "./catas";
import { heldSpotsByTasting } from "./orders";
import type { Tasting } from "@/types";

/** Catas con los cupos disponibles reales: total de la cata menos lo retenido por órdenes. */
export async function tastingsWithAvailability(options: ListCatasOptions = {}): Promise<Tasting[]> {
  const [tastings, held] = await Promise.all([listCatas(options), heldSpotsByTasting()]);
  return tastings.map((t) => applyHeld(t, held[t.id] ?? 0));
}

/** Una cata (por id o slug, en cualquier estado) con su disponibilidad real. */
export async function tastingWithAvailability(idOrSlug: string): Promise<Tasting | null> {
  const t = await getCata(idOrSlug);
  if (!t) return null;
  const held = await heldSpotsByTasting();
  return applyHeld(t, held[t.id] ?? 0);
}

function applyHeld(t: Tasting, held: number): Tasting {
  const available = Math.max(0, Math.min(t.availableSpots, t.totalSpots - held));
  return {
    ...t,
    availableSpots: available,
    status: t.status === "active" && available === 0 ? "sold_out" : t.status,
  };
}
