import { NextResponse } from "next/server";
import { findTicket, getOrderById } from "@/lib/orders";
import { listTastingNotes, saveTastingNote, TastingNoteError } from "@/lib/tastingNotes";
import type { LiveTastingNote } from "@/components/SensoryWheel";

export const dynamic = "force-dynamic";

/* Fichas de la cata en vivo. Se guardan por entrada (token secreto del QR de cada persona);
   cada envío es una versión nueva y la ficha muestra la última de cada copa. */

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

const fail = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });

/** Solo entradas reales de órdenes aprobadas pueden guardar o leer fichas. */
async function validTicket(token: string): Promise<boolean> {
  if (!TOKEN_RE.test(token)) return false;
  const ticket = await findTicket(token);
  if (!ticket || ticket.token !== token) return false;
  const order = await getOrderById(ticket.orderId);
  return order?.status === "approved";
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const level = (v: unknown) => Math.min(5, Math.max(1, Math.round(Number(v) || 3)));
const ids = (v: unknown) =>
  Array.isArray(v)
    ? Array.from(new Set(v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 40)).filter(Boolean))).slice(0, 40)
    : [];

/** Conserva solo los campos conocidos de la ficha, recortados. */
function cleanNote(raw: unknown): LiveTastingNote | null {
  if (!raw || typeof raw !== "object") return null;
  const n = raw as Record<string, unknown>;
  const productIndex = Number(n.productIndex);
  const score = Number(n.score);
  if (!Number.isInteger(productIndex) || productIndex < 0 || productIndex > 50) return null;
  if (!Number.isFinite(score)) return null;
  const visual = (n.visual ?? {}) as Record<string, unknown>;
  const gustative = (n.gustative ?? {}) as Record<string, unknown>;
  return {
    tastingId: text(n.tastingId, 80),
    productIndex,
    productName: text(n.productName, 160),
    visual: { color: text(visual.color, 40), clarity: text(visual.clarity, 40), density: text(visual.density, 40) },
    aromas: ids(n.aromas),
    gustative: {
      acidity: level(gustative.acidity),
      tannins: level(gustative.tannins),
      body: level(gustative.body),
      persistence: level(gustative.persistence),
    },
    score: Math.min(100, Math.max(70, Math.round(score))),
    notes: text(n.notes, 1000),
    pairingIdea: text(n.pairingIdea, 200),
  };
}

export async function GET(request: Request) {
  const token = (new URL(request.url).searchParams.get("token") ?? "").trim();
  try {
    if (!(await validTicket(token))) return fail("Entrada no encontrada.", 404);
    const notes = await listTastingNotes<LiveTastingNote>(token);
    return NextResponse.json(
      { success: true, notes: notes.map((n) => ({ ...n.payload, savedAt: n.createdAt })) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[tasting-notes] No se pudieron leer las fichas:", error);
    return fail("No se pudieron cargar tus fichas.", 500);
  }
}

/** Body: `{ token, note }`. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const note = cleanNote(body?.note);
  if (!note) return fail("La ficha no tiene un formato válido.", 400);

  try {
    if (!(await validTicket(token))) return fail("Entrada no encontrada.", 404);
    const saved = await saveTastingNote(token, note);
    return NextResponse.json({ success: true, note: { ...saved.payload, savedAt: saved.createdAt } });
  } catch (error) {
    if (error instanceof TastingNoteError) return fail(error.message, 400);
    console.error("[tasting-notes] No se pudo guardar la ficha:", error);
    return fail("No se pudo guardar la ficha. Intente de nuevo.", 500);
  }
}
