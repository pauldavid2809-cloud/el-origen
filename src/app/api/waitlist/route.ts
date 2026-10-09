import { createWaitlistEntry } from "@/lib/leads";
import type { WaitlistExperience, WaitlistSchedule, WineLevel } from "@/lib/waitlist";
import { getCata, PUBLIC_CATA_STATUSES } from "@/lib/catas";
import { leadPostHandler, str } from "../private-events/leadRoute";

export const dynamic = "force-dynamic";

/**
 * Lista de espera & registro prioritario (enlace para historias y para las catas agotadas).
 * Body: { fullName, phone, email?, spots, experiences?, schedule?, wineLevel?, specialOccasion?, message?,
 *         tastingId? (la cata desde la que llegó, si el enlace la traía; si ya no está publicada se ignora) }
 * El listado para el panel está en GET /api/admin/leads?type=waitlist.
 */
export const POST = leadPostHandler("waitlist", async (body) => {
  const wanted = str(body.tastingId).trim();
  const found = wanted ? await getCata(wanted).catch(() => null) : null;
  const tasting = found && PUBLIC_CATA_STATUSES.includes(found.status) ? found : null;
  return createWaitlistEntry({
    fullName: str(body.fullName),
    phone: str(body.phone),
    email: str(body.email),
    tastingId: tasting?.id ?? null,
    tastingTitle: tasting?.title ?? null,
    spots: Number(body.spots),
    experiences: (Array.isArray(body.experiences) ? body.experiences.map(str) : []) as WaitlistExperience[],
    schedule: (str(body.schedule) || null) as WaitlistSchedule | null,
    wineLevel: (str(body.wineLevel) || null) as WineLevel | null,
    specialOccasion: str(body.specialOccasion),
    message: str(body.message),
  });
});
