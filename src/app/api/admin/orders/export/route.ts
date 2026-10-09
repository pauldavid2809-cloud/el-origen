import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/auth";
import { listOrders, type Order } from "@/lib/orders";
import { PAYMENT_METHOD_LABEL, paidAmountLabel } from "@/lib/notify";
import { getPaymentConfig } from "@/lib/settings";
import { approvedTicketsByOrder, couponReferrers, paymentDestinationLabel } from "../shared";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<Order["status"], string> = {
  pending_payment: "Pendiente de pago",
  in_review: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Anulada",
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-VE", { timeZone: "America/Caracas" }) : "");

/**
 * Excel con tres hojas:
 *  - Entradas: una fila por entrada (QR) de las órdenes aprobadas, para la lista de puerta.
 *  - Asistentes: una fila por orden aprobada.
 *  - Órdenes: todas las órdenes, con pago, cupón y referente.
 * ?tasting=<id> filtra por cata.
 */
export async function GET(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  const tasting = new URL(request.url).searchParams.get("tasting");
  const orders = (await listOrders()).filter((o) => !tasting || o.tastingId === tasting);
  const approved = orders.filter((o) => o.status === "approved");
  const [byOrder, referrers, config] = await Promise.all([approvedTicketsByOrder(approved), couponReferrers(), getPaymentConfig()]);
  const referrerOf = (o: Order) => (o.couponCode ? referrers.get(o.couponCode.toUpperCase()) ?? "" : "");

  const ticketRows = approved.flatMap((o) =>
    (byOrder.get(o.id) ?? []).map((t) => ({
      Cata: o.tastingTitle,
      Fecha: o.tastingDate,
      Hora: o.tastingTime,
      Entrada: t.code,
      "N.º": `${t.number} de ${o.spotsCount}`,
      Asistente: t.attendeeName ?? "",
      Comprador: o.customerName,
      "Cédula comprador": o.customerDocId,
      Teléfono: o.customerPhone,
      "Restricciones alimentarias": o.dietaryRestrictions ?? "",
      "Check-in": t.checkedInAt ? fmt(t.checkedInAt) : "No",
      "Validó": t.checkedInBy ?? "",
    }))
  );

  const attendees = approved.map((o) => {
    const own = byOrder.get(o.id) ?? [];
    return {
      Cata: o.tastingTitle,
      Fecha: o.tastingDate,
      Hora: o.tastingTime,
      Código: o.code,
      Nombre: o.customerName,
      Cédula: o.customerDocId,
      Teléfono: o.customerPhone,
      Correo: o.customerEmail,
      Cupos: o.spotsCount,
      Ingresaron: own.filter((t) => t.checkedInAt).length,
      "Nombres de asistentes": own.map((t) => t.attendeeName).filter(Boolean).join(", "),
      "Restricciones alimentarias": o.dietaryRestrictions ?? "",
      Adicionales: o.addOns.map((a) => `${a.quantity}× ${a.title}`).join(", "),
      Cupón: o.couponCode ?? "",
      Referente: referrerOf(o),
    };
  });

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
    Miembro: o.memberId ? "Sí" : "No",
    Cupos: o.spotsCount,
    Adicionales: o.addOns.map((a) => `${a.quantity}× ${a.title} ($${a.price})`).join(", "),
    "Subtotal USD": o.subtotalUsd,
    "Descuento USD": o.discountUsd,
    "Total USD": o.totalUsd,
    Cupón: o.couponCode ?? "",
    Referente: referrerOf(o),
    "Forma de pago": PAYMENT_METHOD_LABEL[o.paymentMethod ?? ""] ?? "",
    "Cuenta destino": paymentDestinationLabel(config, o.paymentBank) ?? "",
    Referencia: o.paymentReference ?? "",
    "Monto pagado": paidAmountLabel(o),
    "Tasa BCV": o.bcvRate ?? "",
    "Moneda de la tasa": o.rateCurrency ?? "",
    "Banco pagador": o.payerBank ?? "",
    "Cédula pagador": o.payerDocId ?? "",
    "Nota del cliente": o.paymentNote ?? "",
    "Motivo rechazo": o.rejectionReason ?? "",
    "Términos aceptados": fmt(o.acceptedTermsAt),
    "Envío correo": o.emailStatus,
    "Envío WhatsApp": o.whatsappStatus,
  }));

  const sheet = (rows: Record<string, unknown>[], empty: Record<string, string>) => XLSX.utils.json_to_sheet(rows.length ? rows : [empty]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet(ticketRows, { Cata: "Sin entradas emitidas" }), "Entradas");
  XLSX.utils.book_append_sheet(wb, sheet(attendees, { Cata: "Sin asistentes confirmados" }), "Asistentes");
  XLSX.utils.book_append_sheet(wb, sheet(all, { Código: "Sin órdenes" }), "Órdenes");
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
