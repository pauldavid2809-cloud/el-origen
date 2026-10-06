import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth";
import { listOrders, type Order } from "@/lib/orders";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Order["status"], string> = {
  pending_payment: "Pendiente de pago",
  in_review: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Anulada",
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas" }) : "";

/** Excel con dos hojas: asistentes confirmados y todas las órdenes. ?tasting=<id> filtra por cata. */
export async function GET(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  const tasting = new URL(request.url).searchParams.get("tasting");
  const orders = (await listOrders()).filter((o) => !tasting || o.tastingId === tasting);

  const attendees = orders
    .filter((o) => o.status === "approved")
    .map((o) => ({
      Cata: o.tastingTitle,
      Fecha: o.tastingDate,
      Hora: o.tastingTime,
      Código: o.code,
      Nombre: o.customerName,
      Cédula: o.customerDocId,
      Teléfono: o.customerPhone,
      Correo: o.customerEmail,
      Cupos: o.spotsCount,
      "Restricciones alimentarias": o.dietaryRestrictions ?? "",
      Adicionales: o.addOns.map((a) => `${a.quantity}× ${a.title}`).join(", "),
      "Check-in": o.checkedInAt ? fmt(o.checkedInAt) : "No",
    }));

  const all = orders.map((o) => ({
    Código: o.code,
    Creada: fmt(o.createdAt),
    Estado: STATUS_LABEL[o.status],
    Cata: o.tastingTitle,
    Fecha: o.tastingDate,
    Nombre: o.customerName,
    Cédula: o.customerDocId,
    Teléfono: o.customerPhone,
    Correo: o.customerEmail,
    Cupos: o.spotsCount,
    "Total USD": o.totalUsd,
    "Descuento USD": o.discountUsd,
    Cupón: o.couponCode ?? "",
    "Forma de pago": o.paymentMethod === "pago_movil" ? "Pago Móvil" : o.paymentMethod === "transferencia" ? "Transferencia" : "",
    "Cuenta destino": o.paymentBank ?? "",
    Referencia: o.paymentReference ?? "",
    "Monto Bs": o.paymentAmountBs ?? "",
    "Tasa BCV": o.bcvRate ?? "",
    "Banco pagador": o.payerBank ?? "",
    "Cédula pagador": o.payerDocId ?? "",
    "Motivo rechazo": o.rejectionReason ?? "",
    Correo_envío: o.emailStatus,
    WhatsApp_envío: o.whatsappStatus,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendees.length ? attendees : [{ Cata: "Sin asistentes confirmados" }]), "Asistentes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(all.length ? all : [{ Código: "Sin órdenes" }]), "Órdenes");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="asistentes-el-origen-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
