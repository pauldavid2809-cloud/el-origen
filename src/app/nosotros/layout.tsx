import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros: nuestra historia y sommeliers",
  description:
    "El Origen nació en Caracas a inicios de 2026 para transformar la manera en que se vive la gastronomía y los licores de alta gama en Venezuela. Conoce a los sommeliers y directores de cata que guían cada experiencia.",
  alternates: { canonical: "/nosotros" },
  openGraph: {
    title: "Nosotros | El Origen",
    description: "El Origen, allí el inicio de todo. Catas guiadas, maridaje de autor y networking de alto nivel en Caracas.",
    url: "/nosotros",
  },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
