/* Reduce una foto en el navegador antes de subirla: sube más rápido y no pasa el límite de 4,5 MB
   que Vercel impone al cuerpo de cada petición. Solo para componentes de cliente. */

const PASSTHROUGH_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Lado mayor `maxSide` px, JPEG. Si ya es chica y de un formato aceptado, la devuelve tal cual. */
export async function shrinkImage(file: File, maxSide = 2048, quality = 0.85): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024 && PASSTHROUGH_TYPES.includes(file.type)) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    return blob ?? file;
  } catch {
    // El navegador no pudo leerla: se envía tal cual y el servidor decide.
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
