import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCata } from "@/lib/catas";
import { addMemory, deleteMemory, listMemories, MemoryInputError } from "@/lib/memories";
import { ImageUploadError, uploadPublicImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/* Galería de recuerdos por cata. Las fotos se suben de una en una (el panel las reduce antes de enviarlas). */

const fail = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });
const field = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

/** `?tastingId=` opcional: recuerdos de una cata o de todas. */
export async function GET(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  try {
    const tastingId = new URL(request.url).searchParams.get("tastingId")?.trim() || undefined;
    return NextResponse.json({ success: true, memories: await listMemories(tastingId) });
  } catch (error) {
    console.error("[admin/memories]", error);
    return fail("No se pudieron cargar los recuerdos.", 500);
  }
}

/** Multipart: `file` (JPG/PNG/WebP ≤ 6 MB), `tastingId`, `title?`, `photographer?`. */
export async function POST(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Solicitud inválida.", 400);
  }
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) return fail("Seleccione una foto.", 400);

  try {
    const cata = await getCata(field(form, "tastingId").trim());
    if (!cata) return fail("La cata seleccionada no existe.", 400);

    const url = await uploadPublicImage("recuerdos", Buffer.from(await file.arrayBuffer()), file.type);
    const memory = await addMemory({
      tastingId: cata.id,
      title: field(form, "title"),
      url,
      photographer: field(form, "photographer"),
    });
    return NextResponse.json({ success: true, memory }, { status: 201 });
  } catch (error) {
    if (error instanceof ImageUploadError || error instanceof MemoryInputError) return fail(error.message, 400);
    console.error("[admin/memories] No se pudo subir la foto:", error);
    return fail("No se pudo subir la foto. Intente de nuevo.", 500);
  }
}

/** `?id=` del recuerdo. */
export async function DELETE(request: Request) {
  const denied = requireAdmin();
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) return fail("Falta el recuerdo a eliminar.", 400);
  try {
    if (!(await deleteMemory(id))) return fail("El recuerdo ya no existe.", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/memories] No se pudo eliminar:", error);
    return fail("No se pudo eliminar el recuerdo.", 500);
  }
}
