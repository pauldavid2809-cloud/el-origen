import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo El Origen recopila, usa y protege los datos personales de sus usuarios, miembros y clientes, y cómo solicitar su actualización o eliminación.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
