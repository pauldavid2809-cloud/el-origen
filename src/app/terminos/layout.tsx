import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Compra y Asistencia",
  description:
    "Condiciones de compra y asistencia a las catas de El Origen: mayoría de edad, confirmación de reserva, cancelación y reembolso, productos adicionales y puntualidad.",
  alternates: { canonical: "/terminos" },
};

export default function TerminosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
