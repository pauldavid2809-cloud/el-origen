import { createSommelierApplication, type SommelierSpecialty } from "@/lib/leads";
import { leadPostHandler, str } from "../private-events/leadRoute";

export const dynamic = "force-dynamic";

/**
 * Postulación a la red de sommeliers & directores de cata.
 * Body: { fullName, phone, email, instagram, certification, specialties: string[], yearsExperience,
 *         cvUrl?, memorableExperience }
 */
export const POST = leadPostHandler("sommelier-applications", (body) =>
  createSommelierApplication({
    fullName: str(body.fullName),
    phone: str(body.phone),
    email: str(body.email),
    instagram: str(body.instagram),
    certification: str(body.certification),
    specialties: (Array.isArray(body.specialties) ? body.specialties.map(str) : []) as SommelierSpecialty[],
    yearsExperience: typeof body.yearsExperience === "number" ? body.yearsExperience : Number(str(body.yearsExperience) || NaN),
    cvUrl: str(body.cvUrl),
    memorableExperience: str(body.memorableExperience),
  })
);
