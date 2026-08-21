import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tastingId,
      customerName,
      customerEmail,
      customerPhone,
      spotsCount,
      dietaryRestrictions,
      selectedAddOns,
      couponCode,
      paymentMethod = "stripe",
      notes,
    } = body;

    if (!tastingId || !customerName || !customerEmail || !customerPhone || !spotsCount) {
      return NextResponse.json(
        { success: false, message: "Faltan campos obligatorios para completar la reserva." },
        { status: 400 }
      );
    }

    const { reservation, tasting } = await db.createReservation({
      tastingId,
      customerName,
      customerEmail,
      customerPhone,
      spotsCount: Number(spotsCount),
      dietaryRestrictions,
      selectedAddOns,
      couponCode,
      paymentMethod,
      notes,
    });

    // Automatically trigger confirmation notification log
    await db.logNotification({
      type: "whatsapp_confirmation",
      recipient: customerPhone,
      reservationCode: reservation.code,
      status: "sent",
      previewText: `¡Hola ${customerName}! Tu reserva para "${tasting.title}" el ${reservation.tastingDate} está confirmada. Código: ${reservation.code}.`,
    });

    await db.logNotification({
      type: "email_ticket",
      recipient: customerEmail,
      reservationCode: reservation.code,
      status: "sent",
      previewText: `Entrada Oficial Bodega El Origen - ${tasting.title} (${reservation.spotsCount} cupos). Código de reserva: ${reservation.code}.`,
    });

    await db.logNotification({
      type: "internal_sale_alert",
      recipient: "admin@elorigen.com",
      reservationCode: reservation.code,
      status: "sent",
      previewText: `Nueva venta registrada: ${reservation.spotsCount} cupos para ${tasting.title} ($${reservation.totalAmount.toLocaleString("es-CL")}) por ${customerName}.`,
    });

    return NextResponse.json({
      success: true,
      reservation,
      tasting,
      redirectUrl: `/confirmacion/${reservation.id}?token=${reservation.token}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
