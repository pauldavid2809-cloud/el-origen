import type { Metadata } from "next";

/* El pedido es privado (el enlace funciona como llave de consulta y de pago): no se indexa. */
export const metadata: Metadata = {
  title: "Tu pedido de vinos",
  robots: { index: false, follow: false },
};

export default function WineOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
