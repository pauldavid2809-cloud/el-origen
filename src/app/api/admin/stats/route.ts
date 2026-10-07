import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listCatas } from "@/lib/catas";
import { countNewLeads } from "@/lib/leads";
import { listMembers } from "@/lib/members";
import { heldSpotsByTasting, holdExpired, isPersistent, listOrders, ticketStats } from "@/lib/orders";
import { orderStatsByTasting, statsFor } from "../catas/shared";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Datos reales del dashboard (sin cifras de ejemplo). */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const now = Date.now();
    const [orders, tickets, catas, held, byTasting, members, leads] = await Promise.all([
      listOrders(),
      ticketStats(),
      listCatas({ includeDrafts: true, upcomingOnly: true }),
      heldSpotsByTasting(),
      orderStatsByTasting(),
      listMembers(),
      countNewLeads(),
    ]);

    const approved = orders.filter((o) => o.status === "approved");
    const approvedAt = (o: (typeof orders)[number]) => Date.parse(o.reviewedAt ?? o.createdAt);
    const last30 = approved.filter((o) => now - approvedAt(o) <= 30 * DAY);

    const upcoming = catas
      .filter((t) => t.status !== "archived")
      .slice(0, 6)
      .map((t) => {
        const heldSpots = held[t.id] ?? 0;
        const s = statsFor(byTasting, t.id);
        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          date: t.date,
          dateDisplay: t.dateDisplay,
          timeStart: t.timeStart,
          status: t.status,
          totalSpots: t.totalSpots,
          heldSpots,
          approvedSpots: s.approvedSpots,
          availableSpots: Math.max(0, t.totalSpots - heldSpots),
          approvedUsd: s.approvedUsd,
        };
      });

    return NextResponse.json({
      success: true,
      persistent: isPersistent(),
      orders: {
        inReview: orders.filter((o) => o.status === "in_review").length,
        pendingPayment: orders.filter((o) => o.status === "pending_payment" && !holdExpired(o, now)).length,
      },
      sales: {
        approvedOrders: approved.length,
        approvedSpots: approved.reduce((n, o) => n + o.spotsCount, 0),
        approvedUsd: round2(approved.reduce((n, o) => n + o.totalUsd, 0)),
        last30DaysUsd: round2(last30.reduce((n, o) => n + o.totalUsd, 0)),
        last30DaysSpots: last30.reduce((n, o) => n + o.spotsCount, 0),
      },
      tickets,
      upcoming,
      members: {
        total: members.length,
        last7Days: members.filter((m) => now - Date.parse(m.createdAt) <= 7 * DAY).length,
      },
      leads,
      recentOrders: orders.slice(0, 6).map((o) => ({
        code: o.code,
        customerName: o.customerName,
        tastingTitle: o.tastingTitle,
        tastingDate: o.tastingDate,
        spotsCount: o.spotsCount,
        totalUsd: o.totalUsd,
        status: o.status,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    console.error("[admin/stats] No se pudo calcular el resumen:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
