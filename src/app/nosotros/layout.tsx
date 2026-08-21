import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuestra Historia & Terroir de Altura en Valle de Uco",
  description:
    "Descubra la filosofía de Bodega El Origen: viñedos a 1.400 metros de altura, irrigación por deshielo puro de los Andes y vinificación de mínima intervención.",
  alternates: {
    canonical: "/nosotros",
  },
  openGraph: {
    title: "Nuestra Historia & Terroir de Altura | Bodega El Origen",
    description: "Viñedos a 1.400 msnm al pie de los Andes. Filosofía enológica y crianza en roble francés.",
    url: "https://el-origen-two.vercel.app/nosotros",
  },
};

export default function NosotrosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
