import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, action = "verify", checkedInBy = "Sommelier en Puerta" } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token o código de reserva no provisto." },
        { status: 400 }
      );
    }

    if (action === "checkin") {
      const result = await db.checkInReservation(token, checkedInBy);
      return NextResponse.json(result);
    }

    // Default verify query
    const reservation = await db.getReservationByIdOrToken(token);
    if (!reservation) {
      return NextResponse.json({
        success: false,
        message: "Reserva no encontrada.",
      });
    }

    const isAlreadyCheckedIn = reservation.checkinStatus === "checked_in";
    return NextResponse.json({
      success: !isAlreadyCheckedIn,
      reservation,
      message: isAlreadyCheckedIn
        ? `Ticket YA UTILIZADO el ${new Date(reservation.checkedInAt || "").toLocaleString("es-CL")}.`
        : "Ticket VÁLIDO. Listo para check-in.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
