import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catas Privadas & Eventos Corporativos en Caracas",
  description:
    "Organice experiencias de cata privadas, agasajos ejecutivos y aniversarios con sommelier exclusivo y maridaje gourmet en Caracas, Venezuela.",
  alternates: {
    canonical: "/privadas",
  },
  openGraph: {
    title: "Catas Privadas & Eventos Corporativos | El Origen Caracas",
    description: "Degustaciones exclusivas y eventos a medida en Caracas con sommelier y servicio premium.",
    url: "https://el-origen-two.vercel.app/privadas",
  },
};

export default function PrivadasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
