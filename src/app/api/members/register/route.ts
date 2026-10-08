import { NextResponse } from "next/server";
import { MemberError, registerMember, setMemberSession, touchLogin } from "@/lib/members";
import { LIMITS, activeWelcomeCoupon, clientIp, consume, readJson, str, tooManyAttempts } from "../shared";

export const dynamic = "force-dynamic";

/**
 * Crea una Cuenta Origen e inicia la sesión.
 * Body: { fullName, email, phone, password, acceptTerms: true, marketingOptIn? }
 * `acceptTerms` es la casilla "Soy mayor de 18 años y acepto los Términos y Condiciones." (cubre ambas cosas).
 */
export async function POST(request: Request) {
  if (consume(`register:${clientIp(request)}`, LIMITS.registerPerIp)) return tooManyAttempts();

  const body = await readJson(request);
  const accepted = body.acceptTerms === true;

  try {
    const member = await registerMember({
      fullName: str(body.fullName),
      email: str(body.email),
      phone: str(body.phone),
      password: str(body.password),
      isAdult: accepted,
      acceptTerms: accepted,
      marketingOptIn: body.marketingOptIn === true,
    });
    await setMemberSession(member.id);
    await touchLogin(member.id);
    return NextResponse.json({
      success: true,
      member: { fullName: member.fullName, email: member.email },
      welcomeCoupon: await activeWelcomeCoupon(),
    });
  } catch (err) {
    if (err instanceof MemberError) {
      return NextResponse.json(
        { success: false, code: err.code, message: err.message },
        { status: err.code === "email_taken" ? 409 : 400 }
      );
    }
    console.error("[members/register]", err);
    return NextResponse.json({ success: false, message: "No pudimos crear la cuenta. Inténtalo de nuevo." }, { status: 500 });
  }
}
