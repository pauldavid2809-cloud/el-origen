import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { countNewLeads, listLeads, type LeadType } from "@/lib/leads";
import { isPersistent } from "@/lib/orders";

export const dynamic = "force-dynamic";

const TYPES: readonly LeadType[] = ["private", "brand", "sommelier"];

/**
 * Bandeja de solicitudes del panel.
 * GET ?type=private|brand|sommelier → { success, type, leads, newCounts, persistent }
 * (`newCounts` = solicitudes nuevas por tipo, para las pestañas).
 */
export async function GET(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  const type = new URL(request.url).searchParams.get("type") ?? "private";
  if (!(TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ success: false, message: "Tipo de solicitud inválido." }, { status: 400 });
  }

  try {
    const [leads, newCounts] = await Promise.all([listLeads(type as LeadType), countNewLeads()]);
    return NextResponse.json({ success: true, type, leads, newCounts, persistent: isPersistent() });
  } catch (err) {
    console.error("[admin/leads]", err);
    return NextResponse.json({ success: false, message: "No se pudieron cargar las solicitudes." }, { status: 500 });
  }
}
