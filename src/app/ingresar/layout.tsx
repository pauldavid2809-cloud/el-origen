import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Ingresa a tu Cuenta Origen para ver tus reservas y entradas.",
  alternates: { canonical: "/ingresar" },
};

export default function IngresarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
