import type { Metadata } from "next";

/* Validación de entradas en la puerta: no se indexa. */
export const metadata: Metadata = {
  title: "Verificar entrada",
  robots: { index: false, follow: false },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
