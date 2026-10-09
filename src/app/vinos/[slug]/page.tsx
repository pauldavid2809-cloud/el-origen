import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCata } from "@/lib/catas";
import { getWine, listWines, toPublicWine } from "@/lib/wines";
import { WineDetail, type WineTasting } from "./WineDetail";

export const dynamic = "force-dynamic";

/** Vino publicado por slug (o id). Los borradores no se muestran. */
async function loadWine(slug: string) {
  const wine = await getWine(decodeURIComponent(slug ?? ""));
  return wine && wine.status === "published" ? wine : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const wine = await loadWine(params.slug).catch(() => null);
  if (!wine) return { title: "Vino no encontrado" };
  const description =
    wine.description.replace(/\s+/g, " ").slice(0, 160) ||
    [wine.winery, wine.region, wine.grapes].filter(Boolean).join(" · ") ||
    "Vino degustado en las catas de El Origen.";
  return {
    title: wine.name,
    description,
    alternates: { canonical: `/vinos/${wine.slug}` },
    openGraph: {
      title: `${wine.name} | El Origen`,
      description,
      url: `/vinos/${wine.slug}`,
      ...(wine.imageUrl.startsWith("http") ? { images: [{ url: wine.imageUrl, alt: wine.name }] } : {}),
    },
  };
}

export default async function WinePage({ params }: { params: { slug: string } }) {
  const wine = await loadWine(params.slug);
  if (!wine) notFound();

  const [catas, all] = await Promise.all([
    Promise.all(wine.tastingIds.map((id) => getCata(id).catch(() => null))),
    listWines({ publishedOnly: true }).catch(() => []),
  ]);
  // Solo catas visibles: las publicadas enlazan a su página; las archivadas, a sus recuerdos.
  const tastings: WineTasting[] = catas
    .filter((c): c is NonNullable<typeof c> => c !== null && c.status !== "draft")
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((c) => ({
      id: c.id,
      title: c.title,
      dateIso: c.date,
      date: c.dateFull,
      href: c.status === "archived" ? `/recuerdos/${c.slug || c.id}` : `/catas/${c.slug || c.id}`,
    }));
  const related = all.filter((w) => w.id !== wine.id).slice(0, 4).map(toPublicWine);

  return <WineDetail wine={wine} tastings={tastings} related={related} />;
}
