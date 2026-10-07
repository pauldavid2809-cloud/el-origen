import "server-only";
import type { RateCurrency } from "@/types";

/* Tasas oficiales BCV del dólar y del euro (vía ve.dolarapi.com), con caché de 10 minutos por moneda. */

export interface BcvRate {
  rate: number;
  source: string;
  updatedAt: string;
}

export type Rate = BcvRate;

const ENDPOINTS: Record<RateCurrency, string> = {
  USD: "https://ve.dolarapi.com/v1/dolares/oficial",
  EUR: "https://ve.dolarapi.com/v1/euros/oficial",
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
      source: "BCV (dolarapi.com)",
      updatedAt: data.fechaActualizacion ?? new Date().toISOString(),
    };
    cache[currency] = { value, at: Date.now() };
    return value;
  } catch (err) {
    console.error(`[rates] No se pudo obtener la tasa BCV ${currency}:`, err);
    // Si la fuente falla, se usa la última tasa conocida (aunque haya vencido la caché).
    return hit?.value ?? null;
  }
}

export async function getBcvRates(): Promise<{ USD: BcvRate | null; EUR: BcvRate | null }> {
  const [USD, EUR] = await Promise.all([getBcvRate("USD"), getBcvRate("EUR")]);
  return { USD, EUR };
}

/** @deprecated Use `getBcvRate("USD")`. */
export function getBcvUsdRate(): Promise<BcvRate | null> {
  return getBcvRate("USD");
}

/** Monto en bolívares de un precio en divisa con la tasa indicada (2 decimales). */
export function usdToBs(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100;
}
