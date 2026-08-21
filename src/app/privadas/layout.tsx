import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catas Privadas & Eventos Corporativos en Bodega",
  description:
    "Organice experiencias de cata privadas, agasajos ejecutivos y aniversarios con sommelier exclusivo y maridaje gourmet en Mendoza, Argentina.",
  alternates: {
    canonical: "/privadas",
  },
  openGraph: {
    title: "Catas Privadas & Eventos Corporativos | Bodega El Origen",
    description: "Degustaciones exclusivas y eventos a medida en Mendoza con sommelier y traslado privado.",
    url: "https://el-origen-two.vercel.app/privadas",
  },
};

export default function PrivadasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
