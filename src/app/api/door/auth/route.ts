import { NextResponse } from "next/server";
import { clearDoorSession, doorPassword, doorPasswordMatches, scannerRole, setDoorSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* Acceso de la puerta (solo escáner). Un admin con sesión también puede usar /puerta. */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 10;

/** Intentos fallidos por IP (en memoria; basta para frenar adivinanzas desde la misma red). */
const failures = ((globalThis as unknown as { __eoDoorFailures?: Map<string, { count: number; since: number }> }).__eoDoorFailures ??=
  new Map());

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function blocked(ip: string): boolean {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.since > WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const entry = failures.get(ip);
  if (!entry || Date.now() - entry.since > WINDOW_MS) failures.set(ip, { count: 1, since: Date.now() });
  else entry.count += 1;
}

export async function GET() {
  const role = scannerRole();
  return NextResponse.json({ authenticated: role !== null, role }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!doorPassword()) {
    return NextResponse.json(
      { success: false, message: "Falta configurar DOOR_PASSWORD en el servidor." },
      { status: 503 }
    );
  }
  const ip = clientIp(request);
  if (blocked(ip)) {
    return NextResponse.json(
      { success: false, code: "too_many", message: "Demasiados intentos. Espere unos minutos." },
      { status: 429 }
    );
  }
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || !doorPasswordMatches(password)) {
    recordFailure(ip);
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ success: false, code: "wrong_password", message: "Clave incorrecta." }, { status: 401 });
  }
  failures.delete(ip);
  setDoorSession();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  clearDoorSession();
  return NextResponse.json({ success: true });
}
