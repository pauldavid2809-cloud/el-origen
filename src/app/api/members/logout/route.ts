import { NextResponse } from "next/server";
import { clearMemberSession } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function POST() {
  clearMemberSession();
  return NextResponse.json({ success: true });
}
