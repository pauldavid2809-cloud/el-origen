import { NextResponse } from "next/server";
import { getBcvRates, type BcvRate } from "@/lib/rates";

export const dynamic = "force-dynamic";

const pick = (r: BcvRate | null) => (r ? { rate: r.rate, updatedAt: r.updatedAt } : null);

/** Tasas oficiales BCV del dólar y del euro (null si la fuente no responde). */
export async function GET() {
  const { USD, EUR } = await getBcvRates();
  return NextResponse.json(
    { success: true, USD: pick(USD), EUR: pick(EUR) },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=600" } }
  );
}
