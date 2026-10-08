import { createBrandLead, type BrandObjective } from "@/lib/leads";
import { leadPostHandler, str } from "../private-events/leadRoute";

export const dynamic = "force-dynamic";

/**
 * Solicitud de dossier / alianza comercial (Alianzas Comerciales & Marcas Aliadas).
 * Body: { company, brand, contactName, contactRole?, phone, email, objective, message?, wantsToSendSamples? }
 */
export const POST = leadPostHandler("brand-leads", (body) =>
  createBrandLead({
    company: str(body.company),
    brand: str(body.brand),
    contactName: str(body.contactName),
    contactRole: str(body.contactRole),
    phone: str(body.phone),
    email: str(body.email),
    objective: str(body.objective) as BrandObjective,
    message: str(body.message),
    wantsToSendSamples: body.wantsToSendSamples === true,
  })
);
