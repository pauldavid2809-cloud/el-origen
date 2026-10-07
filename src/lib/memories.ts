import "server-only";
import crypto from "crypto";
import { getAdminClient } from "./orders";

/* Galería de recuerdos de cada cata (tabla public.memories). */

export interface Memory {
  id: string;
  tastingId: string;
  title: string;
  url: string;
  photographer: string;
  createdAt: string;
}

export type MemoryInput = Pick<Memory, "tastingId" | "title" | "url" | "photographer">;

export class MemoryInputError extends Error {}

const line = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

function normalize(input: MemoryInput): MemoryInput {
  const tastingId = line(input.tastingId, 80);
  const title = line(input.title, 160);
  const url = typeof input.url === "string" ? input.url.trim() : "";
  if (!tastingId) throw new MemoryInputError("Selecciona la cata del recuerdo.");
  if (!url) throw new MemoryInputError("Falta la imagen.");
  const isData = /^data:image\/(png|jpe?g|webp);base64,/i.test(url);
  if (!isData) {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    } catch {
      throw new MemoryInputError("La URL de la imagen no es válida.");
    }
  }
  return { tastingId, title, url: isData ? url : url.slice(0, 2000), photographer: line(input.photographer, 120) };
}

type Row = Record<string, unknown>;

function fromRow(row: Row): Memory {
  return {
    id: String(row.id),
    tastingId: String(row.tasting_id ?? ""),
    title: String(row.title ?? ""),
    url: String(row.url ?? ""),
    photographer: String(row.photographer ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

const memMemories = ((globalThis as unknown as { __eoMemories?: Map<string, Memory> }).__eoMemories ??= new Map());

/** Recuerdos (de una cata o de todas), los más recientes primero. */
export async function listMemories(tastingId?: string): Promise<Memory[]> {
  const sb = getAdminClient();
  if (!sb) {
    return Array.from(memMemories.values())
      .filter((m) => !tastingId || m.tastingId === tastingId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  let query = sb.from("memories").select("*");
  if (tastingId) query = query.eq("tasting_id", tastingId);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Lanza `MemoryInputError` si los datos no son válidos. */
export async function addMemory(input: MemoryInput): Promise<Memory> {
  const clean = normalize(input);
  const memory: Memory = { ...clean, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const sb = getAdminClient();
  if (!sb) {
    memMemories.set(memory.id, memory);
    return memory;
  }
  const { data, error } = await sb
    .from("memories")
    .insert({ id: memory.id, tasting_id: clean.tastingId, title: clean.title, url: clean.url, photographer: clean.photographer })
    .select()
    .single();
  if (error) throw new Error(`No se pudo guardar el recuerdo: ${error.message}`);
  return fromRow(data);
}

export async function deleteMemory(id: string): Promise<boolean> {
  const sb = getAdminClient();
  if (!sb) return memMemories.delete(id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  const { data, error } = await sb.from("memories").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  return Boolean(data && data.length);
}
