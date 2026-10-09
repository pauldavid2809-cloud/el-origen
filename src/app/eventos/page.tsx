import type { Metadata } from "next";
import { listCatas, todayInCaracas } from "@/lib/catas";
import { listMemories } from "@/lib/memories";
import { EventsPage, type PastEvent } from "./EventsPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eventos realizados",
  description: "Fotos de las catas y encuentros que El Origen ya realizó en Caracas.",
  alternates: { canonical: "/eventos" },
  openGraph: { title: "Eventos realizados | El Origen", url: "/eventos" },
};

/* Eventos realizados: las catas ya pasadas (no borradores) que tienen fotos en Recuerdos. */
async function loadEvents(): Promise<PastEvent[]> {
  const [catas, memories] = await Promise.all([listCatas({ includeDrafts: true }), listMemories()]);
  const today = todayInCaracas();
  // listMemories viene de la más reciente a la más antigua: la portada de cada evento es su primera foto subida.
  const photos = new Map<string, { cover: string; count: number }>();
  for (const m of memories) {
    const current = photos.get(m.tastingId);
    photos.set(m.tastingId, { cover: m.url, count: (current?.count ?? 0) + 1 });
  }
  return catas
    .filter((c) => c.status !== "draft" && c.date < today && photos.has(c.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((c) => ({
      id: c.id,
      href: `/recuerdos/${c.slug || c.id}`,
      title: c.title,
      dateIso: c.date,
      date: c.dateFull,
      location: c.location,
      cover: photos.get(c.id)?.cover ?? "",
      count: photos.get(c.id)?.count ?? 0,
    }));
}

export default async function EventosPage() {
  const events = await loadEvents().catch((error) => {
    console.error("[eventos] No se pudieron leer los eventos:", error);
    return [];
  });
  return <EventsPage events={events} />;
}
