import "server-only";

/* Tasa oficial BCV del dólar (vía ve.dolarapi.com), con caché de 10 minutos. */

export interface BcvRate {
  rate: number;
  source: string;
  updatedAt: string;
}

let cache: { value: BcvRate; at: number } | null = null;
const TTL = 10 * 60 * 1000;

export async function getBcvUsdRate(): Promise<BcvRate | null> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rate = Number(data.promedio ?? data.precio);
    if (!(rate > 0)) throw new Error("tasa inválida");
    const value = { rate, source: "BCV (dolarapi.com)", updatedAt: data.fechaActualizacion ?? new Date().toISOString() };
    cache = { value, at: Date.now() };
    return value;
  } catch (err) {
    console.error("[rates] No se pudo obtener la tasa BCV:", err);
    return cache?.value ?? null;
  }
}

export function usdToBs(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100;
}
