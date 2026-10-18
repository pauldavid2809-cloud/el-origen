import type { Metadata } from "next";
import { listWines, withSoldOut } from "@/lib/wines";
import { getPublicWineStore } from "@/lib/wineStore";
import { WinesCatalog } from "./WinesCatalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuestros vinos",
  description: "Vinos, destilados y etiquetas que hemos degustado en las catas de El Origen en Caracas, con su ficha técnica.",
  alternates: { canonical: "/vinos" },
  openGraph: { title: "Nuestros vinos | El Origen", url: "/vinos" },
};

/* Catálogo público de vinos (los publicados en Admin → Vinos), con los agotados y el estado de la tienda de ahora. */
export default async function WinesPage() {
  const [wines, store] = await Promise.all([
    listWines({ publishedOnly: true }).catch((error) => {
      console.error("[vinos] No se pudieron leer los vinos:", error);
      return [];
    }),
    getPublicWineStore(),
  ]);
  return <WinesCatalog wines={await withSoldOut(wines)} store={store} />;
}
