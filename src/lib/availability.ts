import "server-only";
import { db } from "./db";
import { heldSpotsByTasting } from "./orders";
import type { Tasting } from "@/types";

/** Cupos disponibles reales: total de la cata menos lo retenido por órdenes. */
export async function tastingsWithAvailability(): Promise<Tasting[]> {
  const [tastings, held] = await Promise.all([db.getTastings(), heldSpotsByTasting()]);
  return tastings.map((t) => applyHeld(t, held[t.id] ?? 0));
}

export async function tastingWithAvailability(idOrSlug: string): Promise<Tasting | null> {
  const t = await db.getTastingById(idOrSlug);
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
