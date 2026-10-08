import React from "react";
import { CONTACT } from "@/lib/contact";
import { MOTTO, translations } from "@/lib/i18n";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://el-origen-two.vercel.app").replace(/\/+$/, "");

/* Horario de atención real (BUSINESS_HOURS en contact.ts) en formato schema.org. */
const OPENING_HOURS = [
  { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "13:30" },
  { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "19:00", closes: "23:00" },
  { days: ["Saturday"], opens: "08:00", closes: "10:00" },
  { days: ["Saturday"], opens: "15:00", closes: "16:00" },
  { days: ["Saturday"], opens: "19:00", closes: "23:00" },
].map((h) => ({
  "@type": "OpeningHoursSpecification",
  dayOfWeek: h.days,
  opens: h.opens,
  closes: h.closes,
}));

/** Datos estructurados del sitio. Sin dirección ni coordenadas: El Origen no tiene oficina y cada cata indica su lugar. */
export function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "El Origen",
    alternateName: "El Origen Caracas",
    slogan: MOTTO.es,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo-color-full.png`,
    description: translations.es.footer.description,
    email: CONTACT.email,
    telephone: CONTACT.phoneIntl,
    areaServed: { "@type": "City", name: "Caracas" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        name: CONTACT.ownerName,
        telephone: CONTACT.phoneIntl,
        email: CONTACT.email,
        url: `https://wa.me/${CONTACT.whatsappNumber}`,
        availableLanguage: ["Spanish", "English"],
        hoursAvailable: OPENING_HOURS,
      },
    ],
    sameAs: [CONTACT.instagramUrl, `https://wa.me/${CONTACT.whatsappNumber}`],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: translations.es.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}
