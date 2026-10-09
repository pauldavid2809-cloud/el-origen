import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Horario de atención",
  description: "Horario de atención al cliente de El Origen, catas guiadas en Caracas: WhatsApp, Instagram y correo.",
  alternates: { canonical: "/horarios" },
  openGraph: { title: "Horario de atención | El Origen", url: "/horarios" },
};

export default function HorariosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
