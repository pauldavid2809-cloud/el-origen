import "server-only";
import type { Ticket } from "@/lib/orders";

/* Utilidades compartidas por las rutas públicas de la orden (/api/orders/[token]/**). */

/** Lo que ve el comprador de cada entrada (sin ids internos ni quién la validó). */
export interface PublicTicket {
  number: number;
  token: string;
  code: string;
  attendeeName: string | null;
  checkedInAt: string | null;
}

export function toPublicTicket(t: Ticket): PublicTicket {
  return { number: t.number, token: t.token, code: t.code, attendeeName: t.attendeeName, checkedInAt: t.checkedInAt };
}
