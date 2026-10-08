import { NextResponse } from "next/server";
import { adminPassword, clearAdminSession, isAdmin, passwordMatches, setAdminSession } from "@/lib/auth";
import { clientIp, hit, isLimited, resetLimit, tooManyAttempts, type RateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** Fallos por IP: 10 cada 15 minutos. */
const FAILURES_PER_IP: RateLimit = { max: 10, windowMs: 15 * 60_000 };
/** Fallos en total (todas las IP): frena un ataque repartido entre muchas direcciones. */
const FAILURES_GLOBAL: RateLimit = { max: 50, windowMs: 15 * 60_000 };
const GLOBAL_KEY = "admin-auth:all";

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
  const ipKey = `admin-auth:${clientIp(request)}`;
  if (isLimited(ipKey, FAILURES_PER_IP) || isLimited(GLOBAL_KEY, FAILURES_GLOBAL)) {
    return tooManyAttempts("Demasiados intentos. Espere unos minutos.");
  }
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (!password || !passwordMatches(String(password))) {
    // Se cuenta antes de esperar: las peticiones en paralelo también agotan el cupo.
    hit(ipKey, FAILURES_PER_IP);
    hit(GLOBAL_KEY, FAILURES_GLOBAL);
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ success: false, message: "Clave incorrecta." }, { status: 401 });
  }
  resetLimit(ipKey);
  setAdminSession();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  clearAdminSession();
  return NextResponse.json({ success: true });
}
