import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth";
import { listMembersWithStats } from "../shared";

export const dynamic = "force-dynamic";

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas" }) : "");

/** Excel de miembros registrados (hoja "Miembros"). */
export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;

  const members = await listMembersWithStats();
  const rows = members.map((m) => ({
    Nombre: m.fullName,
    Correo: m.email,
    WhatsApp: m.phone,
    "Acepta novedades": m.marketingOptIn ? "Sí" : "No",
    "Mayor de 18": m.isAdult ? "Sí" : "No",
    "Términos aceptados": fmt(m.acceptedTermsAt),
    Registro: fmt(m.createdAt),
    "Último ingreso": fmt(m.lastLoginAt),
    Reservas: m.orders,
    "Reservas aprobadas": m.approvedOrders,
    "Cupos aprobados": m.approvedSpots,
    "Total aprobado USD": m.approvedUsd,
  }));

  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Nombre: "Sin miembros registrados" }]);
  sheet["!cols"] = [28, 32, 18, 16, 12, 20, 20, 20, 10, 18, 16, 18].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Miembros");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="miembros-el-origen-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
