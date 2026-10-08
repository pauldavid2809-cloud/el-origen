import type { Language } from "@/lib/i18n";
import type { LegalDocument } from "../privacidad/_components/LegalPage";

/* Términos y Condiciones de Compra y Asistencia. El texto en español es literal del cliente
   (PDF de respuestas, pregunta 28). */

const es: LegalDocument = {
  eyebrow: "Términos y Condiciones",
  title: "Términos y Condiciones de Compra y Asistencia",
  updatedLabel: "Última actualización:",
  updated: "Octubre 2026",
  intro:
    "Al adquirir un ticket o producto a través del sitio web de **El Origen**, el cliente acepta de manera vinculante los siguientes términos y condiciones:",
  sections: [
    {
      title: "1. Mayoría de Edad",
      blocks: [
        {
          p: "El acceso a nuestras catas, eventos de degustación y la compra de bebidas alcohólicas está **estrictamente reservado para mayores de 18 años**. **El Origen** y los establecimientos aliados se reservan el derecho de solicitar un documento de identidad original antes del ingreso. En caso de no cumplir con la edad legal, no se permitirá el acceso ni habrá reembolso del ticket.",
        },
      ],
    },
    {
      title: "2. Confirmación de Reserva y Cupos",
      blocks: [
        {
          p: "Los eventos de **El Origen** manejan aforos limitados. La reserva del cupo solo queda garantizada una vez que la plataforma confirme la recepción exitosa del pago.",
        },
      ],
    },
    {
      title: "3. Políticas de Cancelación y Reembolso",
      blocks: [
        {
          list: [
            "**No Reembolsable:** Debido a la naturaleza exclusiva y al aforo reducido de nuestras mesas privadas, los tickets adquiridos **no son reembolsables en dinero**.",
            "**Transferencia de Ticket:** Si el comprador no puede asistir, podrá transferir o ceder su entrada a un tercero, notificándolo formalmente a **El Origen** con un mínimo de **24 horas de anticipación** a la fecha del evento.",
            "**Reprogramación por la Organización:** En caso de fuerza mayor o postergación del evento por parte de la organización, la reserva mantendrá su validez para la nueva fecha programada o podrá ser canjeada como crédito para una edición futura.",
          ],
        },
      ],
    },
    {
      title: "4. Productos Adicionales (Upsells & Compras Iniciales)",
      blocks: [
        {
          p: "Las ofertas de botellas o productos adicionales adquiridos durante el proceso de reserva en la web tienen un precio de oportunidad válido **únicamente al momento de la compra inicial**. Dichos productos se entregarán de forma presencial al titular de la reserva el día del evento en la sede acordada.",
        },
      ],
    },
    {
      title: "5. Puntualidad y Derecho de Admisión",
      blocks: [
        {
          p: "Para garantizar la fluidez de la experiencia gastronómica y la secuencia técnica del maridaje en tiempos, se solicita puntualidad a los asistentes. **El Origen** se reserva el derecho de admisión y permanencia para garantizar el respeto, la seguridad y el ambiente exclusivo de la velada.",
        },
      ],
    },
  ],
  related: { href: "/privacidad", label: "Política de Privacidad" },
};

const en: LegalDocument = {
  eyebrow: "Terms and Conditions",
  title: "Terms and Conditions of Purchase and Attendance",
  updatedLabel: "Last updated:",
  updated: "October 2026",
  intro:
    "By purchasing a ticket or product through the **El Origen** website, the customer bindingly accepts the following terms and conditions:",
  sections: [
    {
      title: "1. Legal Age",
      blocks: [
        {
          p: "Access to our tastings and tasting events, and the purchase of alcoholic beverages, is **strictly reserved for people over 18**. **El Origen** and its partner venues reserve the right to request an original identity document before entry. Anyone who does not meet the legal age will not be admitted and the ticket will not be refunded.",
        },
      ],
    },
    {
      title: "2. Booking Confirmation and Spots",
      blocks: [
        {
          p: "**El Origen** events have limited capacity. A spot is only guaranteed once the platform confirms that payment has been successfully received.",
        },
      ],
    },
    {
      title: "3. Cancellation and Refund Policy",
      blocks: [
        {
          list: [
            "**Non-refundable:** Due to the exclusive nature and limited capacity of our private tables, purchased tickets **are not refundable in cash**.",
            "**Ticket Transfer:** If the buyer cannot attend, they may transfer or assign their ticket to another person by formally notifying **El Origen** at least **24 hours before** the event date.",
            "**Rescheduling by the Organisers:** In the event of force majeure or postponement of the event by the organisers, the booking will remain valid for the new scheduled date or may be redeemed as credit for a future edition.",
          ],
        },
      ],
    },
    {
      title: "4. Additional Products (Upsells & Initial Purchases)",
      blocks: [
        {
          p: "Offers on bottles or additional products purchased during the online booking process carry a special price valid **only at the time of the initial purchase**. These products will be handed over in person to the booking holder on the day of the event at the agreed venue.",
        },
      ],
    },
    {
      title: "5. Punctuality and Right of Admission",
      blocks: [
        {
          p: "To ensure the smooth flow of the gastronomic experience and the technical timing of the pairing, guests are asked to be punctual. **El Origen** reserves the right of admission and continued attendance in order to ensure respect, safety and the exclusive atmosphere of the evening.",
        },
      ],
    },
  ],
  related: { href: "/privacidad", label: "Privacy Policy" },
};

export const TERMS_AND_CONDITIONS: Record<Language, LegalDocument> = { es, en };
