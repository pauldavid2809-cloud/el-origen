import React from "react";

export function JsonLd() {
  const winerySchema = {
    "@context": "https://schema.org",
    "@type": ["Winery", "TouristAttraction"],
    "name": "Bodega El Origen",
    "alternateName": "El Origen Wine Experience",
    "url": "https://el-origen-two.vercel.app",
    "logo": "https://el-origen-two.vercel.app/images/logo-color.png",
    "image": [
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop"
    ],
    "description": "Experiencias boutique de cata de vino guiadas por sommeliers en Mendoza a 1.400 msnm. Reserva de cupos online y maridaje de autor.",
    "telephone": "+54-9-261-455-8822",
    "email": "experiencias@elorigen.com",
    "priceRange": "$$$$",
    "currenciesAccepted": "ARS, USD",
    "paymentAccepted": "Credit Card, Stripe, Apple Pay, Bank Transfer",
    "servesCuisine": "Wine Tasting, Gourmet Pairing",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Ruta del Vino s/n",
      "addressLocality": "Mendoza",
      "addressRegion": "Mendoza",
      "postalCode": "M5561",
      "addressCountry": "AR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -33.5684,
      "longitude": -69.0423
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "10:00",
        "closes": "21:00"
      }
    ],
    "sameAs": [
      "https://instagram.com/bodegaelorigen",
      "https://wa.me/5492614558822"
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuál es el código de vestimenta y la temperatura de la cava en Bodega El Origen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Recomendamos calzado cómodo para el recorrido por viñedos y un abrigo liviano para la cava subterránea de barricas, que se mantiene a una temperatura constante de 14°C durante todo el año."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo funciona la llegada y las opciones de traslado a la bodega?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La finca cuenta con estacionamiento privado y seguridad 24 hs. Si prefiere disfrutar de la degustación sin preocuparse por conducir, puede añadir el servicio de traslado privado ejecutivo en el checkout."
        }
      },
      {
        "@type": "Question",
        "name": "¿Se adaptan los maridajes de las catas a restricciones dietéticas o celiaquía?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, disponemos de opciones 100% Sin TACC / Celíacos, vegetarianas y veganas. Solo debe indicarlo en el paso 2 del proceso de reserva online."
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(winerySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
