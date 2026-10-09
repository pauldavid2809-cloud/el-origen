import type { Metadata } from "next";
import { listWines, toPublicWine } from "@/lib/wines";
import { WinesCatalog } from "./WinesCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuestros vinos",
  description: "Vinos, destilados y etiquetas que hemos degustado en las catas de El Origen en Caracas, con su ficha técnica.",
  alternates: { canonical: "/vinos" },
  openGraph: { title: "Nuestros vinos | El Origen", url: "/vinos" },
};

/* Catálogo público de vinos (los publicados en Admin → Vinos). */
export default async function WinesPage() {
  const wines = await listWines({ publishedOnly: true }).catch((error) => {
    console.error("[vinos] No se pudieron leer los vinos:", error);
    return [];
  });
  return <WinesCatalog wines={wines.map(toPublicWine)} />;
}
