import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alianzas Comerciales & Marcas Aliadas",
  description:
    "Conectamos marcas de prestigio con un público selecto a través de experiencias gastronómicas de alto nivel en Caracas. Patrocinio de ediciones, lanzamientos de producto y catas privadas B2B.",
  alternates: { canonical: "/alianzas" },
  openGraph: {
    title: "Alianzas Comerciales & Marcas Aliadas | El Origen",
    description: "Posiciona tu etiqueta en la mesa correcta: catas guiadas de aforo reducido con sommeliers y maridaje de autor.",
    url: "/alianzas",
  },
};

export default function AlianzasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
