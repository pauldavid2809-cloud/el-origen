import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de Experiencias de Cata | Caracas, Venezuela",
  description:
    "Explore y reserve en línea degustaciones guiadas de vinos de colección, copas de alta gama y maridaje de autor en Caracas con El Origen.",
  alternates: {
    canonical: "/catas",
  },
  openGraph: {
    title: "Catálogo de Experiencias de Cata | El Origen Caracas",
    description: "Reserve cupos online para catas de vino guiadas por sommeliers en Caracas, Venezuela.",
    url: "https://el-origen-two.vercel.app/catas",
  },
};

export default function CatasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
