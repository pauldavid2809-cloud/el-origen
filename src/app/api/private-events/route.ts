import {
  createPrivateInquiry,
  type PrivateEventType,
  type PrivateGuestRange,
  type PrivateRestaurant,
} from "@/lib/leads";
import { leadPostHandler, str } from "./leadRoute";

export const dynamic = "force-dynamic";

/**
 * Solicitud de propuesta privada (Experiencias Privadas & Eventos Corporativos).
 * Body: { fullName, company, phone, email, eventType, interest, guests, restaurant, message } (todos obligatorios)
 * El listado para el panel está en GET /api/admin/leads?type=private.
 */
export const POST = leadPostHandler("private-events", (body) =>
  createPrivateInquiry({
    fullName: str(body.fullName),
    company: str(body.company),
    phone: str(body.phone),
    email: str(body.email),
    eventType: str(body.eventType) as PrivateEventType,
    interest: str(body.interest),
    guests: str(body.guests) as PrivateGuestRange,
    restaurant: (str(body.restaurant) || null) as PrivateRestaurant | null,
    message: str(body.message),
  })
);
