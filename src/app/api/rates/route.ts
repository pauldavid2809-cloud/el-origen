import { NextResponse } from "next/server";
import { getBcvRates, type BcvRate } from "@/lib/rates";

export const dynamic = "force-dynamic";

const pick = (r: BcvRate | null) => (r ? { rate: r.rate, updatedAt: r.updatedAt } : null);

/** Tasas BCV del dólar y del euro y tasa Binance (dólar paralelo); null la que no responda. */
export async function GET() {
  const { USD, EUR, BINANCE } = await getBcvRates();
  return NextResponse.json(
    { success: true, USD: pick(USD), EUR: pick(EUR), BINANCE: pick(BINANCE) },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=600" } }
  );
}
