import "server-only";
import { listCoupons } from "@/lib/coupons";
import { ensureTickets, listTicketsByOrders, type Order, type Ticket } from "@/lib/orders";
import { findPaymentAccount, type PaymentConfig } from "@/lib/settings";
import { getTeamMember } from "@/lib/team";

/* Utilidades del panel de reservas (/api/admin/orders/**). */

/** Nombre visible de un referente: el sommelier del equipo o el texto libre guardado en el cupón. */
export function referrerName(referrer: string | null): string | null {
  if (!referrer) return null;
  return getTeamMember(referrer)?.name ?? referrer;
}

/** Cupón (MAYÚSCULAS) → nombre de su referente, para los cupones que tienen uno. */
export async function couponReferrers(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const c of await listCoupons()) {
    const name = referrerName(c.referrer);
    if (name) map.set(c.code, name);
  }
  return map;
}

/**
 * Entradas de las órdenes aprobadas, agrupadas por orden. Las órdenes aprobadas antes de que existieran
 * las entradas por persona reciben las suyas aquí (`ensureTickets` es idempotente).
 */
export async function approvedTicketsByOrder(orders: Order[]): Promise<Map<string, Ticket[]>> {
  const approved = orders.filter((o) => o.status === "approved");
  const byOrder = new Map<string, Ticket[]>();
  for (const t of await listTicketsByOrders(approved.map((o) => o.id))) {
    byOrder.set(t.orderId, [...(byOrder.get(t.orderId) ?? []), t]);
  }
  const incomplete = approved.filter((o) => (byOrder.get(o.id)?.length ?? 0) < o.spotsCount);
  for (const o of incomplete) byOrder.set(o.id, await ensureTickets(o));
  return byOrder;
}

/** Cuenta destino legible ("Pago Móvil · Banco de Venezuela"). Las órdenes antiguas guardaban el nombre del banco. */
export function paymentDestinationLabel(config: PaymentConfig, paymentBank: string | null): string | null {
  if (!paymentBank) return null;
  if (paymentBank === "binance") return "Binance";
  if (paymentBank === "efectivo") return "Efectivo";
  const found = findPaymentAccount(config, paymentBank);
  if (!found) return paymentBank;
  if (found.kind === "pago_movil") return `Pago Móvil · ${found.account.bank}`;
  if (found.kind === "zelle") return `Zelle · ${found.account.account} (${found.account.holder})`;
  return `Transferencia · ${found.account.bank} ${found.account.number.replace(/\D/g, "").slice(-4)}`;
}
