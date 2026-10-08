import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crea tu Cuenta Origen",
  description: "Regístrate en El Origen para reservar más rápido, consultar tus entradas y enterarte de las próximas catas en Caracas.",
  alternates: { canonical: "/registro" },
};

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
