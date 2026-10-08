import type { Metadata } from "next";
import { getCata, PUBLIC_CATA_STATUSES } from "@/lib/catas";

/* Metadatos de cada cata (título, descripción e imagen para compartir el enlace). */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const cata = await getCata(params.id);
    if (!cata || !PUBLIC_CATA_STATUSES.includes(cata.status)) {
      return { title: "Cata no disponible", robots: { index: false } };
    }
    const description = (cata.subtitle || cata.description || "").slice(0, 160);
    // Las imágenes en data URL (modo local) no sirven para vistas previas.
    const image = /^https?:\/\//.test(cata.imageUrl) ? cata.imageUrl : undefined;
    return {
      title: `${cata.title} · ${cata.dateDisplay}`,
      description,
      alternates: { canonical: `/catas/${cata.slug || cata.id}` },
      openGraph: {
        title: cata.title,
        description,
        ...(image ? { images: [{ url: image, alt: cata.imageAlt || cata.title }] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default function TastingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
