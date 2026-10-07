import "server-only";
import { listMembers, type Member } from "@/lib/members";
import { listOrders } from "@/lib/orders";

/** Miembro con el resumen de sus reservas (hechas con la sesión iniciada). */
export interface AdminMember extends Member {
  orders: number;
  approvedOrders: number;
  approvedSpots: number;
  approvedUsd: number;
}

export async function listMembersWithStats(): Promise<AdminMember[]> {
  const [members, orders] = await Promise.all([listMembers(), listOrders()]);
  const stats = new Map<string, Pick<AdminMember, "orders" | "approvedOrders" | "approvedSpots" | "approvedUsd">>();
  for (const o of orders) {
    if (!o.memberId) continue;
    const s = stats.get(o.memberId) ?? { orders: 0, approvedOrders: 0, approvedSpots: 0, approvedUsd: 0 };
    s.orders += 1;
    if (o.status === "approved") {
      s.approvedOrders += 1;
      s.approvedSpots += o.spotsCount;
      s.approvedUsd = Math.round((s.approvedUsd + o.totalUsd) * 100) / 100;
    }
    stats.set(o.memberId, s);
  }
  return members.map((m) => ({ ...m, ...(stats.get(m.id) ?? { orders: 0, approvedOrders: 0, approvedSpots: 0, approvedUsd: 0 }) }));
}
