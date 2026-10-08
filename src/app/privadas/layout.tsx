import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experiencias Privadas & Eventos Corporativos",
  description:
    "Diseñamos veladas de cata a medida para marcas, empresas y celebraciones exclusivas en Caracas: cata guiada, maridaje de autor y cristalería de alta gama para 10 a 60 invitados.",
  alternates: { canonical: "/privadas" },
  openGraph: {
    title: "Experiencias Privadas & Eventos Corporativos | El Origen",
    description: "Veladas de cata a medida para marcas, empresas y celebraciones exclusivas en Caracas.",
    url: "/privadas",
  },
};

export default function PrivadasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
