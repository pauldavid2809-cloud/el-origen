import "server-only";
import type { RateCurrency } from "@/types";

/* Tasas en bolívares (vía ve.dolarapi.com), con caché de 10 minutos por tasa:
   USD / EUR = oficiales BCV del dólar y del euro; BINANCE = dólar paralelo, que sigue al mercado P2P
   (la API de Binance bloquea los servidores de EE. UU. donde corre Vercel, por eso no se consulta directo). */

export interface BcvRate {
  rate: number;
  source: string;
  updatedAt: string;
}

export type Rate = BcvRate;

const ENDPOINTS: Record<RateCurrency, string> = {
  USD: "https://ve.dolarapi.com/v1/dolares/oficial",
  EUR: "https://ve.dolarapi.com/v1/euros/oficial",
  BINANCE: "https://ve.dolarapi.com/v1/dolares/paralelo",
};

const SOURCES: Record<RateCurrency, string> = {
  USD: "BCV (dolarapi.com)",
  EUR: "BCV (dolarapi.com)",
  BINANCE: "Dólar paralelo (dolarapi.com)",
};

const TTL = 10 * 60 * 1000;

const cache = ((globalThis as unknown as { __eoRates?: Partial<Record<RateCurrency, { value: BcvRate; at: number }>> })
  .__eoRates ??= {});

export async function getBcvRate(currency: RateCurrency): Promise<BcvRate | null> {
  const hit = cache[currency];
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  try {
    const res = await fetch(ENDPOINTS[currency], {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rate = Number(data.promedio ?? data.precio);
    if (!(rate > 0)) throw new Error("tasa inválida");
    const value: BcvRate = {
      rate,
      source: SOURCES[currency],
      updatedAt: data.fechaActualizacion ?? new Date().toISOString(),
    };
    cache[currency] = { value, at: Date.now() };
    return value;
  } catch (err) {
    console.error(`[rates] No se pudo obtener la tasa ${currency}:`, err);
    // Si la fuente falla, se usa la última tasa conocida (aunque haya vencido la caché).
    return hit?.value ?? null;
  }
}

/** Las tres tasas (BCV dólar, BCV euro y Binance/paralelo); `null` la que no responda. */
export async function getBcvRates(): Promise<Record<RateCurrency, BcvRate | null>> {
  const [USD, EUR, BINANCE] = await Promise.all([getBcvRate("USD"), getBcvRate("EUR"), getBcvRate("BINANCE")]);
  return { USD, EUR, BINANCE };
}

/** @deprecated Use `getBcvRate("USD")`. */
export function getBcvUsdRate(): Promise<BcvRate | null> {
  return getBcvRate("USD");
}

/** Monto en bolívares de un precio en divisa con la tasa indicada (2 decimales). */
export function usdToBs(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100;
}
