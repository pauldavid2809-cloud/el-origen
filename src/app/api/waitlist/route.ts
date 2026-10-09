import { createWaitlistEntry, LeadInputError } from "@/lib/leads";
import { getCata, PUBLIC_CATA_STATUSES } from "@/lib/catas";
import { leadPostHandler, str } from "../private-events/leadRoute";

export const dynamic = "force-dynamic";

/**
 * Lista de espera de las catas (enlace para historias y para las catas agotadas).
 * Body: { fullName, phone, email?, tastingId? ("" = la próxima que haya), spots, message? }
 * El listado para el panel está en GET /api/admin/leads?type=waitlist.
 */
export const POST = leadPostHandler("waitlist", async (body) => {
  const wanted = str(body.tastingId).trim();
  let tasting = null;
  if (wanted) {
    tasting = await getCata(wanted);
    if (!tasting || !PUBLIC_CATA_STATUSES.includes(tasting.status)) {
      throw new LeadInputError("Esa cata ya no está disponible. Elige otra o «La próxima cata que haya».");
    }
  }
  return createWaitlistEntry({
    fullName: str(body.fullName),
    phone: str(body.phone),
    email: str(body.email),
    tastingId: tasting?.id ?? null,
    tastingTitle: tasting?.title ?? null,
    spots: Number(body.spots),
    message: str(body.message),
  });
});
