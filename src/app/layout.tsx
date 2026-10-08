import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WhatsAppConcierge } from "@/components/WhatsAppConcierge";
import { JsonLd } from "@/components/JsonLd";

export const viewport: Viewport = {
  themeColor: "#5A1C31",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://el-origen-two.vercel.app").replace(/\/+$/, "");

const TITLE = "El Origen | Catas guiadas y experiencias en Caracas, Venezuela";
const DESCRIPTION =
  "El Origen, allí el inicio de todo. Catas guiadas de vinos, destilados y licores de alta gama con sommeliers y maridaje de autor en Caracas. Reserva tu cupo en línea, con una entrada QR por persona.";
const OG_IMAGE = "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | El Origen Caracas",
  },
  description: DESCRIPTION,
  keywords: [
    "catas de vino caracas",
    "catas guiadas caracas",
    "degustación de vinos venezuela",
    "cata de whisky caracas",
    "cata de cocuy",
    "maridaje de autor caracas",
    "sommelier caracas",
    "catas privadas caracas",
    "eventos corporativos caracas",
    "wine tasting caracas",
    "el origen caracas",
  ],
  authors: [{ name: "El Origen", url: SITE_URL }],
  creator: "El Origen",
  publisher: "El Origen",
  formatDetection: {
    email: true,
    address: false,
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
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "El Origen",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Copa de vino tinto — El Origen, catas guiadas en Caracas",
      },
    ],
    locale: "es_VE",
    alternateLocale: ["en_US"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  icons: {
    icon: "/images/icon-192.png",
    apple: "/images/icon-192.png",
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
  // Sin coordenadas: El Origen no tiene oficina; cada cata indica su propio lugar.
  other: {
    "geo.region": "VE-A",
    "geo.placename": "Caracas, Venezuela",
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
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Gelasio:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background antialiased min-h-screen flex flex-col">
        <JsonLd />
        {children}
        <WhatsAppConcierge />
      </body>
    </html>
  );
}
