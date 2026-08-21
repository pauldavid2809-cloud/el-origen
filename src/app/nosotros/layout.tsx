import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestra Propuesta & Curaduría de Vinos | El Origen Caracas",
  description:
    "Descubra la filosofía de El Origen: curaduría de vinos de colección internacionales, cristalería de alta gama y maridajes gastronómicos de autor en Caracas, Venezuela.",
  alternates: {
    canonical: "/nosotros",
  },
  openGraph: {
    title: "Nuestra Propuesta & Curaduría de Vinos | El Origen Caracas",
    description: "Experiencias boutique de cata y maridaje de autor guiadas por sommeliers en Caracas.",
    url: "https://el-origen-two.vercel.app/nosotros",
  },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
