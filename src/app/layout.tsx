import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WhatsAppConcierge } from "@/components/WhatsAppConcierge";
import { JsonLd } from "@/components/JsonLd";

export const viewport: Viewport = {
  themeColor: "#5C0531",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://el-origen-two.vercel.app"),
  title: {
    default: "El Origen | Experiencias de Cata de Vinos en Caracas, Venezuela",
    template: "%s | El Origen Caracas",
  },
  description:
    "Experiencias exclusivas de cata de vinos de colección y maridaje de autor en Caracas, Venezuela. Reserva de cupos online, sommelier certificado y eventos privados.",
  keywords: [
    "catas de vino caracas",
    "degustacion de vinos venezuela",
    "eventos privados caracas",
    "maridaje de autor caracas",
    "wine tasting caracas",
    "catas privadas caracas",
    "el origen wine experience",
    "sommelier caracas",
    "reserva de catas online caracas",
    "experiencias gastronomicas caracas",
  ],
  authors: [{ name: "El Origen Caracas", url: "https://el-origen-two.vercel.app" }],
  creator: "El Origen Caracas",
  publisher: "El Origen Caracas",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "/",
    languages: {
      "es-VE": "/",
      "en-US": "/",
    },
  },
  openGraph: {
    title: "El Origen | Experiencias de Cata de Vinos en Caracas, Venezuela",
    description:
      "Una experiencia de cata única en Caracas. Reserve su cupo online para degustaciones de colección guiadas por sommeliers y maridaje de autor.",
    url: "https://el-origen-two.vercel.app",
    siteName: "El Origen",
    images: [
      {
        url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Experiencias de cata y maridaje de vinos en Caracas - El Origen",
      },
    ],
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "El Origen | Experiencias de Cata de Vinos en Caracas",
    description:
      "Catas guiadas de colección, copas de cristal y maridajes de autor en Caracas, Venezuela.",
    images: ["https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": "VE-A",
    "geo.placename": "Caracas, Venezuela",
    "geo.position": "10.4806;-66.9036",
    "ICBM": "10.4806, -66.9036",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background antialiased min-h-screen flex flex-col selection:bg-primary-fixed selection:text-primary">
        <JsonLd />
        {children}
        <WhatsAppConcierge />
      </body>
    </html>
  );
}
