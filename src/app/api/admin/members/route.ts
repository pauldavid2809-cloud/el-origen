import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isPersistent } from "@/lib/orders";
import { listMembersWithStats } from "./shared";

export const dynamic = "force-dynamic";

/** Miembros registrados (los más recientes primero) con el resumen de sus reservas. */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  try {
    const members = await listMembersWithStats();
    return NextResponse.json({ success: true, total: members.length, members, persistent: isPersistent() });
  } catch (err) {
    console.error("[admin/members]", err);
    return NextResponse.json({ success: false, message: "No se pudieron cargar los miembros." }, { status: 500 });
  }
}
