import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista de espera",
  description: "¿Te quedaste fuera de una cata? Anótate en la lista de espera de El Origen y te escribimos por WhatsApp apenas se libere un cupo.",
  alternates: { canonical: "/lista-de-espera" },
  openGraph: {
    title: "Lista de espera | El Origen",
    description: "Anótate y te avisamos por WhatsApp apenas se libere un cupo o abramos una nueva fecha.",
    url: "/lista-de-espera",
  },
};

export default function ListaDeEsperaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
