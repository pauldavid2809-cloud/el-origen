import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ImageUploadError, MAX_IMAGE_BYTES, PUBLIC_IMAGE_FOLDERS, uploadPublicImage, type PublicImageFolder } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Algunos navegadores no envían el tipo: se deduce de la extensión (storage igual verifica los bytes). */
function typeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop();
  return ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "";
}

/** Sube una imagen pública (multipart: `file`, `folder` = catas | recuerdos | anuncios) → `{ success, url }`. */
export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: "Envíe la imagen como formulario (multipart)." }, { status: 400 });
  }

  const folder = String(form.get("folder") ?? "catas") as PublicImageFolder;
  if (!PUBLIC_IMAGE_FOLDERS.includes(folder)) {
    return NextResponse.json({ success: false, message: "Carpeta inválida." }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string" || file.size === 0) {
    return NextResponse.json({ success: false, message: "Seleccione una imagen." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ success: false, message: "La imagen supera los 6 MB." }, { status: 400 });
  }

  try {
    const url = await uploadPublicImage(folder, Buffer.from(await file.arrayBuffer()), file.type || typeFromName(file.name));
    return NextResponse.json({ success: true, url });
  } catch (error) {
    if (error instanceof ImageUploadError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error("[admin/upload] No se pudo subir la imagen:", error);
    return NextResponse.json({ success: false, message: "No se pudo subir la imagen. Intente de nuevo." }, { status: 500 });
  }
}
