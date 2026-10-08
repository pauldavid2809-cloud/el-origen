import "server-only";
import { fetchAllRows, getAdminClient, holdExpired, listOrders, type OrderStatus } from "@/lib/orders";

/** Resumen de las órdenes de una cata para el panel. */
export interface TastingOrderStats {
  /** Órdenes de cualquier estado (si hay alguna, la cata no se puede eliminar). */
  orders: number;
  /** Cupos de órdenes aprobadas (vendidos). */
  approvedSpots: number;
  /** Ventas aprobadas en USD. */
  approvedUsd: number;
  /** Cupos con pago reportado esperando revisión. */
  inReviewSpots: number;
  /** Cupos apartados sin pago (apartado de 60 min vigente). */
  pendingSpots: number;
}

const EMPTY: TastingOrderStats = { orders: 0, approvedSpots: 0, approvedUsd: 0, inReviewSpots: 0, pendingSpots: 0 };

interface OrderLite {
  tastingId: string;
  status: OrderStatus;
  spotsCount: number;
  totalUsd: number;
  createdAt: string;
  paymentMethod: string | null;
  proofSubmittedAt: string | null;
}

async function listOrderLites(): Promise<OrderLite[]> {
  const sb = getAdminClient();
  if (!sb) return listOrders();
  const rows = await fetchAllRows<Record<string, unknown>>((from, to) =>
    sb
      .from("orders")
      .select("id, tasting_id, status, spots_count, total_usd, created_at, payment_method, proof_submitted_at")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  );
  return rows.map((r) => ({
    tastingId: String(r.tasting_id),
    status: r.status as OrderStatus,
    spotsCount: Number(r.spots_count),
    totalUsd: Number(r.total_usd),
    createdAt: String(r.created_at),
    paymentMethod: (r.payment_method as string | null) ?? null,
    proofSubmittedAt: (r.proof_submitted_at as string | null) ?? null,
  }));
}

/** Estadísticas de órdenes agrupadas por id de cata. */
export async function orderStatsByTasting(): Promise<Record<string, TastingOrderStats>> {
  const now = Date.now();
  const out: Record<string, TastingOrderStats> = {};
  for (const o of await listOrderLites()) {
    const s = (out[o.tastingId] ??= { ...EMPTY });
    s.orders += 1;
    if (o.status === "approved") {
      s.approvedSpots += o.spotsCount;
      s.approvedUsd = Math.round((s.approvedUsd + o.totalUsd) * 100) / 100;
    } else if (o.status === "in_review" && !holdExpired(o, now)) {
      s.inReviewSpots += o.spotsCount;
    } else if (o.status === "pending_payment" && !holdExpired(o, now)) {
      s.pendingSpots += o.spotsCount;
    }
  }
  return out;
}

export function statsFor(stats: Record<string, TastingOrderStats>, id: string): TastingOrderStats {
  return stats[id] ?? { ...EMPTY };
}

/** Cantidad de órdenes (de cualquier estado) de una cata. */
export async function countTastingOrders(tastingId: string): Promise<number> {
  const sb = getAdminClient();
  if (!sb) return (await listOrders()).filter((o) => o.tastingId === tastingId).length;
  const { count, error } = await sb.from("orders").select("id", { count: "exact", head: true }).eq("tasting_id", tastingId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
