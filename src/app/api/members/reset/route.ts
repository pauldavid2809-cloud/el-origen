import { NextResponse } from "next/server";
import { MemberError, setMemberSession, touchLogin, updatePassword, verifyResetToken } from "@/lib/members";
import { LIMITS, clientIp, consume, readJson, str, tooManyAttempts } from "../shared";

export const dynamic = "force-dynamic";

const invalidLink = () =>
  NextResponse.json(
    { success: false, code: "invalid_token", message: "El enlace no es válido o ya venció. Solicita uno nuevo." },
    { status: 400 }
  );

/** ¿Sigue vigente el enlace? (para avisar antes de que la persona escriba la contraseña). */
export async function GET(request: Request) {
  if (consume(`reset:${clientIp(request)}`, LIMITS.resetPerIp)) return tooManyAttempts();
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const member = token ? await verifyResetToken(token) : null;
  return NextResponse.json({ success: true, valid: Boolean(member) }, { headers: { "Cache-Control": "no-store" } });
}

/** Body: { token, password }. Cambia la contraseña e inicia la sesión. */
export async function POST(request: Request) {
  if (consume(`reset:${clientIp(request)}`, LIMITS.resetPerIp)) return tooManyAttempts();

  const body = await readJson(request);
  const member = await verifyResetToken(str(body.token));
  if (!member) return invalidLink();

  try {
    await updatePassword(member.id, str(body.password));
  } catch (err) {
    if (err instanceof MemberError) {
      return NextResponse.json({ success: false, code: err.code, message: err.message }, { status: 400 });
    }
    console.error("[members/reset]", err);
    return NextResponse.json({ success: false, message: "No pudimos cambiar la contraseña. Inténtalo de nuevo." }, { status: 500 });
  }

  setMemberSession(member.id);
  await touchLogin(member.id);
  return NextResponse.json({ success: true });
}
