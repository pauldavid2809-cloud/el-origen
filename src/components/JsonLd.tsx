import React from "react";

export function JsonLd() {
  const eventOrganizerSchema = {
    "@context": "https://schema.org",
    "@type": ["EventVenue", "FoodEstablishment"],
    "name": "El Origen | Experiencias de Cata & Vinos de Colección",
    "alternateName": "El Origen Caracas",
    "url": "https://el-origen-two.vercel.app",
    "logo": "https://el-origen-two.vercel.app/images/logo-color.png",
    "image": [
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop"
    ],
    "description": "Experiencias boutique de cata de vino y degustaciones guiadas por sommeliers en Caracas, Venezuela. Venta de cupos online, maridaje de autor y eventos privados.",
    "telephone": "+58-414-1074007",
    "email": "contacto@elorigen.com",
    "priceRange": "$$$",
    "currenciesAccepted": "USD, VES",
    "paymentAccepted": "Zelle, Pago Móvil, Stripe, Apple Pay, Credit Card",
    "servesCuisine": "Wine Tasting, Gourmet Pairings, Charcuterie & Cheese",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Caracas",
      "addressLocality": "Caracas",
      "addressRegion": "Distrito Capital",
      "postalCode": "1060",
      "addressCountry": "VE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 10.4806,
      "longitude": -66.9036
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "18:00",
        "closes": "23:00"
      }
    ],
    "sameAs": [
      "https://instagram.com/elorigen_wine",
      "https://wa.me/584141074007"
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuál es el formato y duración de las catas en El Origen Caracas?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nuestras experiencias de cata tienen una duración aproximada de 2 horas y media. Incluyen una selección curada de 4 a 5 etiquetas de vinos de colección, maridaje de autor paso a paso y la guía en vivo de un sommelier certificado."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuáles son los métodos de pago aceptados?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Aceptamos pagos en USD mediante Zelle y Tarjetas Internacionales (Stripe / Apple Pay), así como transferencias y Pago Móvil en Bolívares a la tasa oficial del BCV del día."
        }
      },
      {
        "@type": "Question",
        "name": "¿Se adaptan los maridajes a restricciones dietéticas o celiaquía?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, disponemos de opciones 100% Sin TACC / Celíacos, vegetarianas y libres de frutos secos. Solo debe indicarlo en el paso 2 del proceso de reserva online."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es la política de reprogramación o cancelación de cupos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Puede reprogramar su cupo sin ningún costo con hasta 48 horas de anticipación a la fecha seleccionada, o transferir su entrada digital QR a otra persona."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventOrganizerSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
