import { NextResponse } from "next/server";
import { authenticate, normalizeEmail, setMemberSession, touchLogin } from "@/lib/members";
import { LIMITS, clientIp, hit, isLimited, readJson, resetLimit, str, tooManyAttempts } from "../shared";

export const dynamic = "force-dynamic";

/**
 * Ingreso con correo y contraseña. Los fallos se limitan por IP + correo (8 cada 15 min) y por IP;
 * el error es siempre el mismo para no revelar si el correo tiene cuenta.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  const email = normalizeEmail(str(body.email)).slice(0, 200);
  const password = str(body.password);

  const ip = clientIp(request);
  const accountKey = `login:${ip}:${email}`;
  const ipKey = `login:${ip}`;
  if (isLimited(accountKey, LIMITS.loginPerAccount) || isLimited(ipKey, LIMITS.loginPerIp)) return tooManyAttempts();

  const member = email && password ? await authenticate(email, password) : null;
  if (!member) {
    hit(accountKey, LIMITS.loginPerAccount);
    hit(ipKey, LIMITS.loginPerIp);
    return NextResponse.json(
      { success: false, code: "invalid_credentials", message: "Correo o contraseña incorrectos." },
      { status: 401 }
    );
  }

  resetLimit(accountKey);
  await setMemberSession(member.id);
  await touchLogin(member.id);
  return NextResponse.json({ success: true, member: { fullName: member.fullName, email: member.email } });
}
