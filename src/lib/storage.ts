import "server-only";
import crypto from "crypto";
import { getAdminClient } from "./orders";

/* Imágenes públicas (fotos de catas, recuerdos, publicidad y vinos) en Supabase Storage.
   Sin Supabase se devuelven como data URL (solo pruebas locales). */

export type PublicImageFolder = "catas" | "recuerdos" | "anuncios" | "vinos";
export const PUBLIC_IMAGE_FOLDERS: readonly PublicImageFolder[] = ["catas", "recuerdos", "anuncios", "vinos"];

export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ImageUploadError extends Error {}

/** Tipo real según los primeros bytes (no se confía en el content-type del navegador). */
function sniffImageType(data: Buffer): string | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data.length >= 12 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Sube una imagen JPG/PNG/WebP (máx. 6 MB) al bucket público `folder` y devuelve su URL pública.
 * Lanza `ImageUploadError` si el archivo no es válido.
 */
export async function uploadPublicImage(folder: PublicImageFolder, data: Buffer, contentType: string): Promise<string> {
  if (!PUBLIC_IMAGE_FOLDERS.includes(folder)) throw new ImageUploadError("Carpeta inválida.");
  if (!data?.length) throw new ImageUploadError("El archivo está vacío.");
  if (data.length > MAX_IMAGE_BYTES) throw new ImageUploadError("La imagen supera los 6 MB.");
  const declared = (contentType ?? "").toLowerCase().split(";")[0].trim().replace("image/jpg", "image/jpeg");
  const actual = sniffImageType(data);
  if (!actual || !(declared in EXTENSIONS) || actual !== declared) {
    throw new ImageUploadError("Formato no permitido. Usa una imagen JPG, PNG o WebP.");
  }

  const sb = getAdminClient();
  if (!sb) return `data:${actual};base64,${data.toString("base64")}`;

  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${EXTENSIONS[actual]}`;
  const { error } = await sb.storage.from(folder).upload(path, data, {
    contentType: actual,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);
  return sb.storage.from(folder).getPublicUrl(path).data.publicUrl;
}
