import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const logs = await db.getNotifications();
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const { type, recipient, reservationCode, customMessage } = body;

    if (!type || !recipient) {
      return NextResponse.json(
        { success: false, message: "Tipo y destinatario son requeridos." },
        { status: 400 }
      );
    }

    const log = await db.logNotification({
      type,
      recipient,
      reservationCode: reservationCode || "N/A",
      status: "sent",
      previewText: customMessage || `Mensaje automático enviado con éxito a ${recipient}.`,
    });

    return NextResponse.json({
      success: true,
      message: `Notificación [${type}] enviada exitosamente a ${recipient}.`,
      log,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
