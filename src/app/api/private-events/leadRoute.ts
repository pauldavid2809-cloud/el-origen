import "server-only";
import { NextResponse } from "next/server";
import { LeadInputError } from "@/lib/leads";
import { HONEYPOT_FIELD } from "@/app/privadas/_components/honeypot";

/* Manejo común de los formularios públicos de solicitudes (privadas, marcas y sommeliers):
   tamaño máximo del cuerpo, campo trampa (honeypot) y límite simple de envíos por IP en memoria. */

const MAX_BODY_BYTES = 32 * 1024;
const LIMIT = { max: 8, windowMs: 15 * 60_000 };

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = ((globalThis as unknown as { __eoLeadLimits?: Map<string, Bucket> }).__eoLeadLimits ??= new Map());

let lastSweep = 0;

/** Registra un envío y dice si esta clave superó el límite de la ventana. */
function overLimit(key: string): boolean {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    buckets.forEach((b, k) => {
      if (b.resetAt <= now) buckets.delete(k);
    });
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + LIMIT.windowMs });
    return false;
  }
  b.count += 1;
  return b.count > LIMIT.max;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Texto recibido o "" (los módulos de datos recortan y validan). */
export const str = (v: unknown): string => (typeof v === "string" ? v : "");

type Body = Record<string, unknown>;

/**
 * Crea el handler POST de un formulario de solicitud.
 * `create` recibe el cuerpo JSON ya leído y guarda la solicitud (lanza `LeadInputError` si no es válida).
 * Responde `{ success: true }` sin exponer los datos guardados.
 */
export function leadPostHandler(scope: string, create: (body: Body) => Promise<unknown>) {
  return async function POST(request: Request) {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, message: "La solicitud es demasiado grande." }, { status: 413 });
    }

    let body: Body;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
      body = parsed as Body;
    } catch {
      return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
    }

    // Un bot llenó el campo trampa: se responde como si todo fuera bien, sin guardar nada.
    if (str(body[HONEYPOT_FIELD]).trim()) return NextResponse.json({ success: true });

    if (overLimit(`${scope}:${clientIp(request)}`)) {
      return NextResponse.json(
        {
          success: false,
          code: "rate_limited",
          message: "Recibimos varias solicitudes desde tu conexión. Espera unos minutos e inténtalo de nuevo.",
        },
        { status: 429 }
      );
    }

    try {
      await create(body);
      return NextResponse.json({ success: true });
    } catch (err) {
      if (err instanceof LeadInputError) {
        return NextResponse.json({ success: false, code: "invalid", message: err.message }, { status: 400 });
      }
      console.error(`[${scope}]`, err);
      return NextResponse.json(
        { success: false, message: "No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp." },
        { status: 500 }
      );
    }
  };
}
