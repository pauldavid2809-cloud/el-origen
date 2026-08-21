import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "El Origen | Boutique Wine Tasting Experience",
  description: "Experiencias exclusivas de cata de vino en Mendoza, Argentina. Venta de cupos online, tickets QR y degustaciones guiadas de alta gama.",
  keywords: ["vino", "catas", "mendoza", "malbec", "enoturismo", "bodega", "degustacion", "el origen"],
  openGraph: {
    title: "El Origen | Boutique Wine Tasting",
    description: "Una experiencia de cata única en el corazón de la montaña.",
    url: "https://elorigen.com",
    siteName: "El Origen",
    images: [
      {
        url: "/images/logo-color.png",
        width: 800,
        height: 600,
        alt: "El Origen Wine Experience Logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
};

import { WhatsAppConcierge } from "@/components/WhatsAppConcierge";

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
        {children}
        <WhatsAppConcierge />
      </body>
    </html>
  );
}
