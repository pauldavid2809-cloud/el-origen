import HomeClient from "./_home/HomeClient";
import { getPublicAds } from "@/lib/adsServer";
import { getHomeWines } from "@/lib/wines";

/* Inicio: la publicidad y los vinos se leen en el servidor (con caché) para que lleguen
   con la página y no la empujen al cargar. El resto de la página es de cliente. */
export default async function HomePage() {
  const [ads, wines] = await Promise.all([getPublicAds(), getHomeWines()]);
  return <HomeClient ads={ads} wines={wines} />;
}
