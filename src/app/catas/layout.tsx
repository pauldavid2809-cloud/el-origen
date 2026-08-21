import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo de Experiencias de Cata | Valle de Uco, Mendoza",
  description:
    "Explore y reserve en línea degustaciones guiadas de Malbec Reserva, Gran Reserva y Sunset Tastings con maridaje de autor en Bodega El Origen.",
  alternates: {
    canonical: "/catas",
  },
  openGraph: {
    title: "Catálogo de Experiencias de Cata | Bodega El Origen",
    description: "Reserve cupos online para catas de vino guiadas por sommeliers en Valle de Uco, Mendoza.",
    url: "https://el-origen-two.vercel.app/catas",
  },
};

export default function CatasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
