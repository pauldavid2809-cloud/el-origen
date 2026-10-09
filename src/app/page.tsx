import HomeClient from "./_home/HomeClient";
import { getPublicAds } from "@/lib/adsServer";

/* Inicio: la publicidad se lee en el servidor (con caché) para que el banner inicial llegue
   con la página y no la empuje al cargar. El resto de la página es de cliente. */
export default async function HomePage() {
  return <HomeClient ads={await getPublicAds()} />;
}
