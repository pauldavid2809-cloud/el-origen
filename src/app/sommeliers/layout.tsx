import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Únete a nuestra red de sommeliers & directores de cata",
  description:
    "El Origen busca sommeliers, especialistas en catas y embajadores de marca con pasión por la docencia sensorial y la maestría en mesa. Postúlate para liderar experiencias exclusivas en Caracas.",
  alternates: { canonical: "/sommeliers" },
  openGraph: {
    title: "Red de sommeliers & directores de cata | El Origen",
    description: "Lidera experiencias exclusivas en los restaurantes y sedes aliadas más destacadas de Caracas.",
    url: "/sommeliers",
  },
};

export default function SommeliersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
