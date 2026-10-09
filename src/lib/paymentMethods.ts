import type { PaymentMethodId, Tasting } from "@/types";
import type { PaymentConfig, ZelleAccount } from "./settings";

/* Qué métodos de pago se ofrecen (lo usan el panel, la página de la cata, la orden y el servidor). */

/** Métodos activos en Configuración (con datos cargados), en el orden en que se ofrecen. */
export function availableMethods(cfg: PaymentConfig): PaymentMethodId[] {
  const methods: PaymentMethodId[] = [];
  if (cfg.pagoMovil.length) methods.push("pago_movil");
  if (cfg.transfers.length) methods.push("transferencia");
  if (cfg.binance.enabled) methods.push("binance_usdt");
  if (cfg.zelle?.length) methods.push("zelle");
  if (cfg.efectivo.enabled) methods.push("efectivo");
  return methods;
}

/**
 * Métodos de una cata: los que marcó el admin (todos si no marcó ninguno) que además estén activos en Configuración.
 * Si ninguno de los marcados está activo, se ofrecen todos los activos para no dejar la cata sin forma de pago.
 */
export function methodsForTasting(tasting: Pick<Tasting, "paymentMethods"> | null | undefined, cfg: PaymentConfig): PaymentMethodId[] {
  const enabled = availableMethods(cfg);
  const chosen = tasting?.paymentMethods ?? [];
  const offered = chosen.length ? enabled.filter((m) => chosen.includes(m)) : enabled;
  return offered.length ? offered : enabled;
}

/** Cuenta Zelle de la cata: la elegida en el panel o, si ya no existe, la primera configurada. */
export function zelleForTasting(tasting: Pick<Tasting, "zelleAccountId"> | null | undefined, cfg: PaymentConfig): ZelleAccount | null {
  const list = cfg.zelle ?? [];
  return list.find((a) => a.id === tasting?.zelleAccountId) ?? list[0] ?? null;
}

/** Métodos que se pagan en bolívares (con la tasa de la cata). */
export const isBsMethod = (m: string | null | undefined) => m === "pago_movil" || m === "transferencia";
/** Métodos que se pagan en divisa (USDT o USD): el monto es el total en USD. */
export const isUsdMethod = (m: string | null | undefined) => m === "binance_usdt" || m === "zelle";
