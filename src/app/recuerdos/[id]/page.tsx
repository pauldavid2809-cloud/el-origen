import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCata } from "@/lib/catas";
import { listMemories } from "@/lib/memories";
import { MemoriesGallery, type GalleryPhoto } from "./MemoriesGallery";

export const dynamic = "force-dynamic";

/* Galería pública de recuerdos de una cata (id o slug). Los borradores no se muestran. */

async function loadGallery(rawId: string) {
  const key = decodeURIComponent(rawId ?? "").trim().slice(0, 120);
  if (!key) return null;
  const cata = await getCata(key);
  if (cata?.status === "draft") return null;
  const memories = await listMemories(cata?.id ?? key);
  if (!cata && memories.length === 0) return null;
  const photos: GalleryPhoto[] = memories.map((m) => ({ id: m.id, title: m.title, url: m.url, photographer: m.photographer }));
  return { cata, photos };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const data = await loadGallery(params.id).catch(() => null);
  const title = data?.cata ? `Recuerdos · ${data.cata.title}` : "Recuerdos";
  return {
    title,
    description: "Fotos de la experiencia de cata guiada de El Origen en Caracas.",
    alternates: { canonical: `/recuerdos/${params.id}` },
  };
}

export default async function MemoriesPage({ params }: { params: { id: string } }) {
  const data = await loadGallery(params.id);
  if (!data) notFound();
  const { cata, photos } = data;
  return (
    <MemoriesGallery
      tasting={cata ? { title: cata.title, date: cata.dateFull, dateIso: cata.date, location: cata.location } : null}
      photos={photos}
    />
  );
}
