import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { LEAD_STATUSES, LEAD_TYPES, LeadInputError, updateLeadStatus, type LeadStatus, type LeadType } from "@/lib/leads";

export const dynamic = "force-dynamic";

const TYPES: readonly LeadType[] = LEAD_TYPES;

type Params = { params: { type: string; id: string } };

/** Cambia el estado de una solicitud. Body: { status: "new" | "contacted" | "closed" | "archived" } */
export async function PATCH(request: Request, { params }: Params) {
  const denied = requireAdmin();
  if (denied) return denied;

  if (!(TYPES as readonly string[]).includes(params.type)) {
    return NextResponse.json({ success: false, message: "Tipo de solicitud inválido." }, { status: 400 });
  }

  let status: unknown;
  try {
    status = (await request.json())?.status;
  } catch {
    return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }
  if (typeof status !== "string" || !(LEAD_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ success: false, message: "Estado inválido." }, { status: 400 });
  }

  try {
    const lead = await updateLeadStatus(params.type as LeadType, params.id, status as LeadStatus);
    if (!lead) return NextResponse.json({ success: false, message: "La solicitud no existe." }, { status: 404 });
    return NextResponse.json({ success: true, lead });
  } catch (err) {
    if (err instanceof LeadInputError) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
    console.error("[admin/leads/status]", err);
    return NextResponse.json({ success: false, message: "No se pudo actualizar la solicitud." }, { status: 500 });
  }
}
