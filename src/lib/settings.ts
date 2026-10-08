import "server-only";
import { BANK_ACCOUNTS, BINANCE_PAY_LINK, PAGO_MOVIL_PHONE, PAYMENT_ID } from "./contact";
import { getAdminClient, getSetting, setSetting } from "./orders";

/* Configuración de pagos editable desde el panel (app_settings → key "payment_config"). */

export interface PagoMovilAccount {
  id: string;
  bank: string;
  phone: string;
  docId: string;
}

export interface TransferAccount {
  id: string;
  bank: string;
  accountType: string;
  number: string;
  docId: string;
}

export interface PaymentConfig {
  pagoMovil: PagoMovilAccount[];
  transfers: TransferAccount[];
  /** PENDIENTE CLIENTE: titular de las cuentas (y si se muestra en la página). */
  holderName?: string;
  /** `payLink`: enlace de cobro de Binance Pay (el sitio lo muestra como QR y como botón). */
  binance: { enabled: boolean; payLink?: string; payId?: string; email?: string; holder?: string };
  /** `instructionsEn`: versión en inglés opcional (si falta, la página traduce solo el texto por defecto). */
  efectivo: { enabled: boolean; instructions: string; instructionsEn?: string };
}

const SETTING_KEY = "payment_config";

/** Valores por defecto: los datos de pago vigentes de `contact.ts`. */
export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  pagoMovil: [
    { id: "pm-bdv", bank: BANK_ACCOUNTS.bdv.bank, phone: PAGO_MOVIL_PHONE, docId: PAYMENT_ID },
    { id: "pm-mercantil", bank: BANK_ACCOUNTS.mercantil.bank, phone: PAGO_MOVIL_PHONE, docId: PAYMENT_ID },
  ],
  transfers: [
    { id: "tr-bdv", ...BANK_ACCOUNTS.bdv, docId: PAYMENT_ID },
    { id: "tr-mercantil", ...BANK_ACCOUNTS.mercantil, docId: PAYMENT_ID },
  ],
  binance: { enabled: true, payLink: BINANCE_PAY_LINK },
  efectivo: { enabled: true, instructions: "Entrega previa acordada por WhatsApp" },
};

export class PaymentConfigError extends Error {}

const str = (v: unknown, max = 120): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const optional = (v: unknown, max = 120): string | undefined => str(v, max) || undefined;

/** Enlace https de un dominio de Binance (lo que genera "Recibir → Compartir código QR"). */
function isBinanceLink(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && (u.hostname === "binance.com" || u.hostname.endsWith(".binance.com"));
  } catch {
    return false;
  }
}

function slugId(v: unknown, prefix: string, index: number, used: Set<string>): string {
  let id = str(v, 40).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  // "binance" y "efectivo" se usan como `paymentBank` de esos métodos: no pueden ser ids de cuenta.
  if (!id || id === "binance" || id === "efectivo") id = `${prefix}-${index + 1}`;
  let unique = id;
  for (let n = 2; used.has(unique); n++) unique = `${id}-${n}`;
  used.add(unique);
  return unique;
}

function asArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object") : [];
}

/**
 * Normaliza una configuración recibida del panel. Lanza `PaymentConfigError` si falta un dato obligatorio.
 * Los ids de cuenta son únicos y estables (se usan como `paymentBank` en las órdenes).
 */
export function normalizePaymentConfig(input: unknown): PaymentConfig {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const used = new Set<string>();

  const pagoMovil = asArray(raw.pagoMovil).slice(0, 10).map((a, i) => {
    const account = { id: slugId(a.id, "pm", i, used), bank: str(a.bank), phone: str(a.phone, 40), docId: str(a.docId, 40) };
    if (!account.bank || !account.phone || !account.docId) {
      throw new PaymentConfigError(`Pago Móvil #${i + 1}: banco, teléfono y cédula son obligatorios.`);
    }
    return account;
  });

  const transfers = asArray(raw.transfers).slice(0, 10).map((a, i) => {
    const account = {
      id: slugId(a.id, "tr", i, used),
      bank: str(a.bank),
      accountType: str(a.accountType, 60),
      number: str(a.number, 40),
      docId: str(a.docId, 40),
    };
    if (!account.bank || !account.number || !account.docId) {
      throw new PaymentConfigError(`Transferencia #${i + 1}: banco, número de cuenta y cédula son obligatorios.`);
    }
    if (account.number.replace(/\D/g, "").length !== 20) {
      throw new PaymentConfigError(`Transferencia #${i + 1}: el número de cuenta debe tener 20 dígitos.`);
    }
    return account;
  });

  const b = (raw.binance && typeof raw.binance === "object" ? raw.binance : {}) as Record<string, unknown>;
  const e = (raw.efectivo && typeof raw.efectivo === "object" ? raw.efectivo : {}) as Record<string, unknown>;
  const binanceEmail = optional(b.email);
  if (binanceEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(binanceEmail)) {
    throw new PaymentConfigError("Binance: el correo no es válido.");
  }
  const binancePayLink = optional(b.payLink, 300);
  if (binancePayLink && !isBinanceLink(binancePayLink)) {
    throw new PaymentConfigError("Binance: el enlace de cobro debe ser un enlace de Binance (https://app.binance.com/…).");
  }

  return {
    pagoMovil,
    transfers,
    holderName: optional(raw.holderName),
    binance: {
      enabled: b.enabled !== false,
      payLink: binancePayLink,
      payId: optional(b.payId, 40),
      email: binanceEmail,
      holder: optional(b.holder),
    },
    efectivo: {
      enabled: e.enabled !== false,
      instructions: str(e.instructions, 300) || DEFAULT_PAYMENT_CONFIG.efectivo.instructions,
      instructionsEn: optional(e.instructionsEn, 300),
    },
  };
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  try {
    const stored = await getSetting<unknown>(SETTING_KEY);
    if (stored) return normalizePaymentConfig(stored);
  } catch (err) {
    console.error("[settings] Configuración de pagos inválida; se usan los valores por defecto:", err);
  }
  return structuredClone(DEFAULT_PAYMENT_CONFIG);
}

/** Valida y guarda la configuración. Devuelve la versión normalizada. */
export async function savePaymentConfig(cfg: unknown): Promise<PaymentConfig> {
  const clean = normalizePaymentConfig(cfg);
  if (!clean.pagoMovil.length && !clean.transfers.length && !clean.binance.enabled && !clean.efectivo.enabled) {
    throw new PaymentConfigError("Debe quedar al menos un método de pago activo.");
  }
  const sb = getAdminClient();
  if (!sb) {
    await setSetting(SETTING_KEY, clean);
    return clean;
  }
  const { error } = await sb.from("app_settings").upsert({ key: SETTING_KEY, value: clean, updated_at: new Date().toISOString() });
  if (error) throw new Error(`No se pudo guardar la configuración de pagos: ${error.message}`);
  return clean;
}

/** Busca una cuenta destino por id (`paymentBank` de la orden). */
export function findPaymentAccount(
  cfg: PaymentConfig,
  id: string
): { kind: "pago_movil"; account: PagoMovilAccount } | { kind: "transferencia"; account: TransferAccount } | null {
  const pm = cfg.pagoMovil.find((a) => a.id === id);
  if (pm) return { kind: "pago_movil", account: pm };
  const tr = cfg.transfers.find((a) => a.id === id);
  if (tr) return { kind: "transferencia", account: tr };
  return null;
}
