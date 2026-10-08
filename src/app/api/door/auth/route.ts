import { NextResponse } from "next/server";
import { clearDoorSession, doorPassword, doorPasswordMatches, scannerRole, setDoorSession } from "@/lib/auth";
import { clientIp, hit, isLimited, resetLimit, type RateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* Acceso de la puerta (solo escáner). Un admin con sesión también puede usar /puerta. */

/** Fallos por IP: 10 cada 10 minutos. */
const FAILURES_PER_IP: RateLimit = { max: 10, windowMs: 10 * 60_000 };
/** Fallos en total (todas las IP): frena un ataque repartido entre muchas direcciones. */
const FAILURES_GLOBAL: RateLimit = { max: 50, windowMs: 10 * 60_000 };
const GLOBAL_KEY = "door-auth:all";

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
  const ipKey = `door-auth:${clientIp(request)}`;
  if (isLimited(ipKey, FAILURES_PER_IP) || isLimited(GLOBAL_KEY, FAILURES_GLOBAL)) {
    return NextResponse.json(
      { success: false, code: "too_many", message: "Demasiados intentos. Espere unos minutos." },
      { status: 429 }
    );
  }
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || !doorPasswordMatches(password)) {
    hit(ipKey, FAILURES_PER_IP);
    hit(GLOBAL_KEY, FAILURES_GLOBAL);
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ success: false, code: "wrong_password", message: "Clave incorrecta." }, { status: 401 });
  }
  resetLimit(ipKey);
  setDoorSession();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  clearDoorSession();
  return NextResponse.json({ success: true });
}
