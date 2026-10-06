import { NextResponse } from "next/server";
import { adminPassword, clearAdminSession, isAdmin, passwordMatches, setAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ authenticated: isAdmin() });
}

export async function POST(request: Request) {
  if (!adminPassword()) {
    return NextResponse.json(
      { success: false, message: "Falta configurar ADMIN_PASSWORD en el servidor." },
      { status: 503 }
    );
  }
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (!password || !passwordMatches(String(password))) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ success: false, message: "Clave incorrecta." }, { status: 401 });
  }
  setAdminSession();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  clearAdminSession();
  return NextResponse.json({ success: true });
}
