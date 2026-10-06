import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { tastingsWithAvailability } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tastings = await tastingsWithAvailability();
    return NextResponse.json({ success: true, tastings });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const newTasting = await db.createTasting(body);
    return NextResponse.json({ success: true, tasting: newTasting });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
