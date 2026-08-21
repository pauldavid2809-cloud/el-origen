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
    default: "El Origen | Boutique Wine Tasting Experience en Mendoza",
    template: "%s | Bodega El Origen",
  },
  description:
    "Experiencias exclusivas de cata de vino en Valle de Uco, Mendoza a 1.400 msnm. Reserva de cupos online, degustaciones guiadas por sommeliers, maridaje de autor y tickets QR.",
  keywords: [
    "vino mendoza",
    "catas de vino valle de uco",
    "wine tasting mendoza",
    "bodega boutique mendoza",
    "malbec reserva degustacion",
    "enoturismo argentina",
    "degustacion de vinos mendoza",
    "visitas a bodegas mendoza",
    "el origen wine experience",
    "reserva de catas online",
  ],
  authors: [{ name: "Bodega El Origen", url: "https://el-origen-two.vercel.app" }],
  creator: "Bodega El Origen",
  publisher: "Bodega El Origen",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "/",
    languages: {
      "es-AR": "/",
      "en-US": "/",
    },
  },
  openGraph: {
    title: "El Origen | Boutique Wine Tasting Experience en Mendoza",
    description:
      "Una experiencia de cata única a 1.400 msnm en el corazón de los Andes. Reserve su cupo online para degustaciones de colección guiadas por sommeliers.",
    url: "https://el-origen-two.vercel.app",
    siteName: "Bodega El Origen",
    images: [
      {
        url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "Viñedos de altura Bodega El Origen en Valle de Uco, Mendoza",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "El Origen | Boutique Wine Tasting Experience en Mendoza",
    description:
      "Catas guiadas de colección, barricas de roble y maridajes de autor al pie de la cordillera en Valle de Uco.",
    images: ["https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop"],
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
    "geo.region": "AR-M",
    "geo.placename": "Valle de Uco, Mendoza",
    "geo.position": "-33.5684;-69.0423",
    "ICBM": "-33.5684, -69.0423",
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
