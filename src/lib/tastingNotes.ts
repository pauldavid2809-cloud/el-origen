import "server-only";
import crypto from "crypto";
import { getAdminClient } from "./orders";

/* Fichas de cata interactivas guardadas por cada asistente (tabla public.tasting_notes),
   asociadas al token de su entrada. El contenido (payload) lo define la ficha en vivo. */

export interface TastingNote<T = unknown> {
  id: string;
  ticketToken: string;
  payload: T;
  createdAt: string;
}

/** Tamaño máximo del contenido de una ficha (JSON serializado). */
export const MAX_NOTE_BYTES = 20_000;
const MAX_NOTES_PER_TICKET = 50;

export class TastingNoteError extends Error {}

const memNotes = ((globalThis as unknown as { __eoTastingNotes?: TastingNote[] }).__eoTastingNotes ??= []);

function fromRow(row: Record<string, unknown>): TastingNote {
  return {
    id: String(row.id),
    ticketToken: String(row.ticket_token),
    payload: row.payload,
    createdAt: String(row.created_at ?? ""),
  };
}

/** Lanza `TastingNoteError` si el contenido no es JSON válido, es muy grande o se superó el máximo de fichas. */
export async function saveTastingNote<T>(ticketToken: string, payload: T): Promise<TastingNote<T>> {
  const token = (ticketToken ?? "").trim();
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) throw new TastingNoteError("Entrada inválida.");
  let json: string | undefined;
  try {
    json = JSON.stringify(payload);
  } catch {
    json = undefined;
  }
  if (json === undefined || payload === null || typeof payload !== "object") {
    throw new TastingNoteError("La ficha no tiene un formato válido.");
  }
  if (Buffer.byteLength(json) > MAX_NOTE_BYTES) throw new TastingNoteError("La ficha es demasiado larga.");
  const clean = JSON.parse(json) as T;

  const existing = await listTastingNotes(token);
  if (existing.length >= MAX_NOTES_PER_TICKET) throw new TastingNoteError("Se alcanzó el máximo de fichas para esta entrada.");

  const note: TastingNote<T> = { id: crypto.randomUUID(), ticketToken: token, payload: clean, createdAt: new Date().toISOString() };
  const sb = getAdminClient();
  if (!sb) {
    memNotes.push(note);
    return note;
  }
  const { data, error } = await sb
    .from("tasting_notes")
    .insert({ id: note.id, ticket_token: token, payload: clean })
    .select()
    .single();
  if (error) throw new Error(`No se pudo guardar la ficha: ${error.message}`);
  return fromRow(data) as TastingNote<T>;
}

/** Fichas de una entrada, de la más antigua a la más reciente. */
export async function listTastingNotes<T = unknown>(ticketToken: string): Promise<TastingNote<T>[]> {
  const token = (ticketToken ?? "").trim();
  if (!token) return [];
  const sb = getAdminClient();
  if (!sb) return memNotes.filter((n) => n.ticketToken === token) as TastingNote<T>[];
  const { data, error } = await sb
    .from("tasting_notes")
    .select("*")
    .eq("ticket_token", token)
    .order("created_at", { ascending: true })
    .limit(MAX_NOTES_PER_TICKET);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow) as TastingNote<T>[];
}
